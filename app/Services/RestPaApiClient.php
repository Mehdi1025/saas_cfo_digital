<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\PaClientInterface;
use App\Models\Document;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Client HTTP REST vers la Plateforme Agréée (PA).
 *
 * Les chemins d'URI (/v1/invoices, /v1/ereporting…) et la forme exacte des payloads
 * sont des conventions de travail — à ajuster avec la documentation Swagger/Postman
 * de la PA définitive retenue (JeFacture, Cegedim, EDI, etc.).
 *
 * Alternative documentée pour submitInvoice : envoi multipart/form-data avec
 * attach('file', $facturxContent, 'facture.pdf', ['Content-Type' => 'application/pdf'])
 * si la PA cible n'accepte pas le JSON base64.
 */
class RestPaApiClient implements PaClientInterface
{
    private const TIMEOUT_SECONDS = 30;

    public function submitInvoice(Document $document, string $facturxContent): string
    {
        $payload = [
            'reference' => $document->reference,
            'issue_date' => $document->issue_date?->toDateString(),
            'due_date' => $document->due_date?->toDateString(),
            'currency_code' => $document->currency_code ?? 'EUR',
            'operation_category' => $document->operation_category,
            'file' => [
                'filename' => sprintf('%s.pdf', $document->reference),
                'content_type' => 'application/pdf',
                'content_base64' => base64_encode($facturxContent),
            ],
        ];

        $response = $this->http()
            ->post($this->endpoint('/v1/invoices'), $payload);

        if ($response->failed()) {
            Log::error('PA submitInvoice failed', [
                'document_id' => $document->id,
                'reference' => $document->reference,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw_if(
                $response->failed(),
                new \Exception(sprintf(
                    'Échec de la transmission PA (HTTP %d) : %s',
                    $response->status(),
                    $response->body(),
                )),
            );
        }

        $paDocumentId = $response->json('id')
            ?? $response->json('pa_document_id')
            ?? $response->json('data.id');

        if (! is_string($paDocumentId) || $paDocumentId === '') {
            Log::error('PA submitInvoice missing remote id', [
                'document_id' => $document->id,
                'body' => $response->json(),
            ]);

            throw new \Exception('Réponse PA invalide : identifiant distant manquant.');
        }

        return $paDocumentId;
    }

    public function checkInvoiceStatus(string $paDocumentId): string
    {
        $response = $this->http()
            ->get($this->endpoint('/v1/invoices/'.urlencode($paDocumentId).'/status'));

        if ($response->failed()) {
            Log::error('PA checkInvoiceStatus failed', [
                'pa_document_id' => $paDocumentId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw_if(
                $response->failed(),
                new \Exception(sprintf(
                    'Échec de la consultation PA (HTTP %d) : %s',
                    $response->status(),
                    $response->body(),
                )),
            );
        }

        $rawStatus = $response->json('cdar_status')
            ?? $response->json('status')
            ?? $response->json('data.cdar_status')
            ?? $response->json('data.status');

        if (! is_string($rawStatus) || $rawStatus === '') {
            throw new \Exception('Réponse PA invalide : statut CDAR manquant.');
        }

        $normalized = $this->normalizeCdarStatus($rawStatus);

        if ($normalized === null) {
            throw new \Exception(sprintf('Statut CDAR PA non reconnu : %s', $rawStatus));
        }

        return $normalized;
    }

    public function submitEreporting(array $reportingData): bool
    {
        $response = $this->http()
            ->post($this->endpoint('/v1/ereporting'), $reportingData);

        if ($response->failed()) {
            Log::error('PA submitEreporting failed', [
                'user_id' => $reportingData['user_id'] ?? null,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        }

        return $response->successful();
    }

    private function http(): PendingRequest
    {
        $request = Http::timeout(self::TIMEOUT_SECONDS)
            ->acceptJson()
            ->asJson();

        $apiKey = (string) config('services.pa.key');

        if ($apiKey !== '') {
            $request = $request->withHeaders([
                'Authorization' => 'Bearer '.$apiKey,
                'X-API-Key' => $apiKey,
            ]);
        }

        return $request;
    }

    /**
     * Construit l'URL absolue à partir de services.pa.url (ex. https://pa.example.com/api).
     */
    private function endpoint(string $path): string
    {
        return rtrim((string) config('services.pa.url'), '/').$path;
    }

    private function normalizeCdarStatus(string $status): ?string
    {
        if (in_array($status, Document::cdarStatuses(), true)) {
            return $status;
        }

        $map = [
            'deposited' => Document::CDAR_DEPOSEE,
            'deposee' => Document::CDAR_DEPOSEE,
            'rejected' => Document::CDAR_REJETEE,
            'rejetee' => Document::CDAR_REJETEE,
            'refused' => Document::CDAR_REFUSEE,
            'refusee' => Document::CDAR_REFUSEE,
            'suspended' => Document::CDAR_SUSPENDUE,
            'suspendue' => Document::CDAR_SUSPENDUE,
            'collected' => Document::CDAR_ENCAISSEE,
            'encaissee' => Document::CDAR_ENCAISSEE,
            'approved' => Document::CDAR_APPROUVEE,
            'approuvee' => Document::CDAR_APPROUVEE,
        ];

        $key = strtolower(str_replace(['é', 'è', 'ê'], 'e', trim($status)));

        return $map[$key] ?? null;
    }
}
