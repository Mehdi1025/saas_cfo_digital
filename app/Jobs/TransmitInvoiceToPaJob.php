<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Contracts\PaClientInterface;
use App\Models\CompanySetting;
use App\Models\Document;
use App\Models\User;
use App\Services\DocumentEventRecorder;
use App\Services\DocumentPdfService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\DB;
use Throwable;

class TransmitInvoiceToPaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 5;

    public function __construct(
        public int $documentId,
    ) {}

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [60, 300, 1800, 3600];
    }

    public function handle(
        DocumentPdfService $pdfService,
        PaClientInterface $paClient,
        DocumentEventRecorder $eventRecorder,
    ): void {
        $document = Document::query()
            ->withoutGlobalScopes()
            ->with(['tier', 'lignes'])
            ->find($this->documentId);

        if ($document === null || ! $document->isFacture()) {
            return;
        }

        $userId = $document->tier?->user_id;

        if ($userId === null) {
            return;
        }

        auth()->setUser(User::query()->find($userId));

        $companySettings = CompanySetting::query()->where('user_id', $userId)->first();

        if (! ($companySettings?->electronic_invoicing_active)) {
            return;
        }

        $facturxContent = $pdfService->renderFacturX($document);

        try {
            $paDocumentId = $paClient->submitInvoice($document, $facturxContent);
        } catch (Throwable $exception) {
            if ($this->attempts() >= $this->tries) {
                throw $exception;
            }

            $delays = $this->backoff();
            $delay = $delays[min($this->attempts() - 1, count($delays) - 1)] ?? 3600;

            $this->release($delay);

            return;
        }

        DB::transaction(function () use ($document, $paDocumentId, $eventRecorder): void {
            $eventRecorder->recordCdarStatusChange(
                $document,
                Document::CDAR_DEPOSEE,
                'Transmission à la Plateforme Agréée.',
            );

            $document->update([
                'pa_document_id' => $paDocumentId,
                'cdar_status' => Document::CDAR_DEPOSEE,
            ]);
        });
    }
}
