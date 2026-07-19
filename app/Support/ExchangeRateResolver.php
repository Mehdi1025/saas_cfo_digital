<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Document;

class ExchangeRateResolver
{
    /**
     * @return list<string>
     */
    public static function supportedCodes(): array
    {
        return array_keys(config('currencies', []));
    }

    public static function rateFor(string $currencyCode): float
    {
        $code = strtoupper(trim($currencyCode));
        $rates = config('currencies', []);

        return (float) ($rates[$code] ?? $rates['EUR'] ?? 1.0);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{currency_code: string, exchange_rate: float}
     */
    public static function fieldsFromValidated(array $validated, ?Document $document = null): array
    {
        $code = strtoupper((string) ($validated['currency_code'] ?? 'EUR'));

        if ($document !== null && $document->currency_code === $code) {
            return [
                'currency_code' => $code,
                'exchange_rate' => (float) $document->exchange_rate,
            ];
        }

        return [
            'currency_code' => $code,
            'exchange_rate' => self::rateFor($code),
        ];
    }
}
