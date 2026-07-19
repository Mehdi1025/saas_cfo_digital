<?php

declare(strict_types=1);

namespace App\Support;

class TaxRateResolver
{
    public static function forCountry(?string $countryCode): float
    {
        $rates = config('taxes', []);
        $default = (float) ($rates['default'] ?? 0);

        if ($countryCode === null || trim($countryCode) === '') {
            return $default;
        }

        $code = strtoupper(trim($countryCode));

        if (array_key_exists($code, $rates) && $code !== 'default') {
            return (float) $rates[$code];
        }

        return $default;
    }

    /**
     * @return array<string, float>
     */
    public static function allRates(): array
    {
        return config('taxes', []);
    }
}
