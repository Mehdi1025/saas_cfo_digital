<?php

declare(strict_types=1);

namespace App\Http\Controllers\Concerns;

use App\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

trait SecuresDocumentLifecycle
{
    /**
     * Champs figés après le stade brouillon (pattern snapshot / immutabilité post-envoi).
     *
     * @return list<string>
     */
    protected function immutableDocumentFields(): array
    {
        return [
            'type',
            'reference',
            'currency_code',
            'exchange_rate',
            'operation_category',
            'delivery_address',
            'vat_on_debits',
        ];
    }

    protected function rejectIfLocked(Document $document): ?RedirectResponse
    {
        if (! $document->canBeEdited()) {
            return back()->with('error', 'Action impossible : ce document est verrouillé dans son état actuel.');
        }

        return null;
    }

    protected function rejectImmutableFieldChanges(Document $document, Request $request): ?RedirectResponse
    {
        if ($document->status === Document::STATUS_DRAFT) {
            return null;
        }

        if ($request->has('reference') && $request->input('reference') !== $document->reference) {
            return back()->with('error', 'La référence ne peut plus être modifiée après le stade brouillon.');
        }

        foreach ($this->immutableDocumentFields() as $field) {
            if ($field === 'reference') {
                continue;
            }

            if (! $request->has($field)) {
                continue;
            }

            if ($this->immutableFieldValueChanged($document, $request, $field)) {
                return back()->with('error', $this->immutableFieldErrorMessage($field));
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function stripImmutableFields(Document $document, array $payload): array
    {
        if ($document->status !== Document::STATUS_DRAFT) {
            foreach ($this->immutableDocumentFields() as $field) {
                unset($payload[$field]);
            }
        }

        return $payload;
    }

    private function immutableFieldValueChanged(Document $document, Request $request, string $field): bool
    {
        $current = $document->getAttribute($field);
        $incoming = $request->input($field);

        if (is_bool($current) || in_array($field, ['vat_on_debits'], true)) {
            return filter_var($incoming, FILTER_VALIDATE_BOOLEAN) !== (bool) $current;
        }

        if ($current === null && ($incoming === null || $incoming === '')) {
            return false;
        }

        return (string) $incoming !== (string) $current;
    }

    private function immutableFieldErrorMessage(string $field): string
    {
        return match ($field) {
            'type' => 'Le type du document ne peut plus être modifié.',
            'currency_code' => 'La devise ne peut plus être modifiée après le stade brouillon.',
            'exchange_rate' => 'Le taux de change ne peut plus être modifié après le stade brouillon.',
            'operation_category' => 'La catégorie d\'opération ne peut plus être modifiée après le stade brouillon.',
            'delivery_address' => 'L\'adresse de livraison ne peut plus être modifiée après le stade brouillon.',
            'vat_on_debits' => 'L\'option TVA sur les débits ne peut plus être modifiée après le stade brouillon.',
            default => 'Ce champ ne peut plus être modifié après le stade brouillon.',
        };
    }
}
