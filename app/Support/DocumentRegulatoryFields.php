<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Article;
use App\Models\Document;
use Illuminate\Validation\Rule;

class DocumentRegulatoryFields
{
    /**
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'operation_category' => ['required', Rule::in(Document::operationCategories())],
            'delivery_address' => ['nullable', 'string', 'max:2000'],
            'vat_on_debits' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public static function fromValidated(array $validated): array
    {
        $address = trim((string) ($validated['delivery_address'] ?? ''));

        return [
            'operation_category' => in_array(
                $validated['operation_category'] ?? null,
                Document::operationCategories(),
                true,
            )
                ? $validated['operation_category']
                : Document::OPERATION_SERVICE,
            'delivery_address' => $address !== '' ? $address : null,
            'vat_on_debits' => filter_var($validated['vat_on_debits'] ?? false, FILTER_VALIDATE_BOOLEAN),
        ];
    }

    public static function resolveVatRate(Document $document): float
    {
        if ($document->vat_on_debits) {
            return 0.0;
        }

        $document->loadMissing('tier');

        return TaxRateResolver::forCountry($document->tier?->country_code);
    }

    /**
     * @param  list<array<string, mixed>>  $lignes
     */
    public static function inferOperationCategoryFromLignes(array $lignes, ?string $explicit = null): string
    {
        if (
            is_string($explicit)
            && in_array($explicit, Document::operationCategories(), true)
        ) {
            return $explicit;
        }

        $categories = collect($lignes)
            ->pluck('article_id')
            ->filter()
            ->map(fn ($id) => Article::query()->find($id)?->operation_category)
            ->filter()
            ->unique()
            ->values();

        if ($categories->isEmpty()) {
            return Document::OPERATION_SERVICE;
        }

        if ($categories->count() === 1) {
            return (string) $categories->first();
        }

        return Document::OPERATION_MIXTE;
    }
}
