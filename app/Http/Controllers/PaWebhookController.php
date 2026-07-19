<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use App\Models\Document;
use App\Models\FactureFournisseur;
use App\Models\ProcessedPaWebhook;
use App\Services\DocumentEventRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use JsonException;

class PaWebhookController extends Controller
{
    public function handle(Request $request, DocumentEventRecorder $eventRecorder): JsonResponse
    {
        if (! $this->isValidSignature($request)) {
            return response()->json(['message' => 'Signature PA invalide.'], 401);
        }

        $eventId = $this->resolveEventId($request);

        if (ProcessedPaWebhook::query()->where('event_id', $eventId)->exists()) {
            return response()->json([
                'message' => 'Événement PA déjà traité.',
                'event_id' => $eventId,
            ]);
        }

        $eventType = (string) $request->input('event_type', '');

        $response = match ($eventType) {
            'STATUS_UPDATE' => $this->handleStatusUpdate($request, $eventRecorder),
            'NEW_INCOMING_INVOICE' => $this->handleNewIncomingInvoice($request),
            default => response()->json(['message' => 'Type d\'événement PA inconnu.'], 422),
        };

        if ($response->isSuccessful()) {
            ProcessedPaWebhook::query()->create([
                'event_id' => $eventId,
                'processed_at' => now(),
            ]);
        }

        return $response;
    }

    private function handleStatusUpdate(Request $request, DocumentEventRecorder $eventRecorder): JsonResponse
    {
        $validated = $request->validate([
            'pa_document_id' => ['required', 'string'],
            'cdar_status' => ['required', 'string'],
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $cdarStatus = $this->normalizeCdarStatus($validated['cdar_status']);

        if ($cdarStatus === null) {
            return response()->json(['message' => 'Statut CDAR inconnu.'], 422);
        }

        $document = Document::query()
            ->withoutGlobalScopes()
            ->where('pa_document_id', $validated['pa_document_id'])
            ->first();

        if ($document === null) {
            return response()->json(['message' => 'Facture émise introuvable pour ce pa_document_id.'], 404);
        }

        DB::transaction(function () use ($document, $cdarStatus, $validated, $eventRecorder): void {
            $eventRecorder->recordCdarStatusChange(
                $document,
                $cdarStatus,
                $validated['reason'] ?? null,
            );

            $document->update(['cdar_status' => $cdarStatus]);
        });

        return response()->json([
            'message' => 'Statut CDAR mis à jour.',
            'document_id' => $document->id,
            'cdar_status' => $cdarStatus,
        ]);
    }

    private function handleNewIncomingInvoice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pa_document_id' => ['required', 'string'],
            'recipient_siret' => ['required', 'string'],
            'supplier_name' => ['required', 'string', 'max:255'],
            'supplier_siret' => ['nullable', 'string', 'max:20'],
            'reference' => ['required', 'string', 'max:255'],
            'issue_date' => ['required', 'date'],
            'amount_ht' => ['required', 'numeric', 'min:0'],
            'amount_ttc' => ['required', 'numeric', 'min:0'],
            'cdar_status' => ['nullable', 'string'],
            'pdf_url' => ['nullable', 'url', 'max:2000'],
        ]);

        $userId = $this->resolveUserIdFromRecipientSiret($validated['recipient_siret']);

        if ($userId === null) {
            return response()->json(['message' => 'Destinataire introuvable pour ce SIRET.'], 404);
        }

        $cdarStatus = $this->normalizeCdarStatus(
            (string) ($validated['cdar_status'] ?? Document::CDAR_DEPOSEE),
        ) ?? Document::CDAR_DEPOSEE;

        $factureFournisseur = FactureFournisseur::query()->updateOrCreate(
            ['pa_document_id' => $validated['pa_document_id']],
            [
                'user_id' => $userId,
                'supplier_name' => $validated['supplier_name'],
                'supplier_siret' => $validated['supplier_siret'] ?? null,
                'reference' => $validated['reference'],
                'issue_date' => $validated['issue_date'],
                'amount_ht' => $validated['amount_ht'],
                'amount_ttc' => $validated['amount_ttc'],
                'cdar_status' => $cdarStatus,
                'pdf_url' => $validated['pdf_url'] ?? null,
            ],
        );

        return response()->json([
            'message' => 'Facture fournisseur enregistrée.',
            'facture_fournisseur_id' => $factureFournisseur->id,
        ], $factureFournisseur->wasRecentlyCreated ? 201 : 200);
    }

    private function resolveEventId(Request $request): string
    {
        $eventId = $request->input('event_id') ?? $request->input('webhook_id');

        if (is_string($eventId) && $eventId !== '') {
            return $eventId;
        }

        try {
            return md5(json_encode($request->all(), JSON_THROW_ON_ERROR));
        } catch (JsonException) {
            return md5((string) $request->getContent());
        }
    }

    private function isValidSignature(Request $request): bool
    {
        $secret = (string) config('services.pa.webhook_secret');

        if ($secret === '') {
            return false;
        }

        $signature = (string) $request->header('X-PA-Signature', '');

        return hash_equals($secret, $signature);
    }

    private function resolveUserIdFromRecipientSiret(string $recipientSiret): ?int
    {
        $normalizedRecipient = $this->normalizeSiret($recipientSiret);

        if ($normalizedRecipient === '') {
            return null;
        }

        $settings = CompanySetting::query()
            ->whereNotNull('registration_number')
            ->get(['user_id', 'registration_number']);

        foreach ($settings as $setting) {
            if ($this->normalizeSiret((string) $setting->registration_number) === $normalizedRecipient) {
                return (int) $setting->user_id;
            }
        }

        return null;
    }

    private function normalizeSiret(string $value): string
    {
        return preg_replace('/\D/', '', $value) ?? '';
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
