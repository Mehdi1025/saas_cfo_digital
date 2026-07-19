<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\PaClientInterface;
use App\Models\Document;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GenericPaApiClient implements PaClientInterface
{
    public function submitInvoice(Document $document, string $facturxContent): string
    {
        $url = (string) config('services.pa.url');
        $key = (string) config('services.pa.key');

        $paDocumentId = 'PA-UUID-'.(string) Str::uuid();

        Log::info('PA submitInvoice (simulated)', [
            'pa_document_id' => $paDocumentId,
            'document_id' => $document->id,
            'reference' => $document->reference,
            'payload_bytes' => strlen($facturxContent),
            'endpoint' => $url,
            'api_key_configured' => $key !== '',
        ]);

        return $paDocumentId;
    }

    public function checkInvoiceStatus(string $paDocumentId): string
    {
        $url = (string) config('services.pa.url');

        Log::info('PA checkInvoiceStatus (simulated)', [
            'pa_document_id' => $paDocumentId,
            'endpoint' => $url,
            'cdar_status' => Document::CDAR_DEPOSEE,
        ]);

        return Document::CDAR_DEPOSEE;
    }

    public function submitEreporting(array $reportingData): bool
    {
        $url = (string) config('services.pa.url');

        Log::info('PA submitEreporting (simulated)', [
            'endpoint' => $url,
            'reporting_keys' => array_keys($reportingData),
        ]);

        return true;
    }
}
