<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\LigneDocument;
use Illuminate\Support\Facades\DB;

class LigneAmounts
{
    public const DISCOUNT_PERCENT = 'percent';

    public const DISCOUNT_FIXED = 'fixed';

    /**
     * @param  LigneDocument|array<string, mixed>  $ligne
     */
    public static function baseAmount(LigneDocument|array $ligne): float
    {
        $quantity = (float) self::value($ligne, 'quantity');
        $unitPrice = (float) self::value($ligne, 'unit_price_ht');

        return $quantity * $unitPrice;
    }

    /**
     * @param  LigneDocument|array<string, mixed>  $ligne
     */
    public static function discountAmount(LigneDocument|array $ligne): float
    {
        $type = self::value($ligne, 'discount_type');
        $value = (float) self::value($ligne, 'discount_value');

        if ($type === null || $type === '' || $value <= 0) {
            return 0.0;
        }

        $base = self::baseAmount($ligne);

        if ($type === self::DISCOUNT_PERCENT) {
            return $base * ($value / 100);
        }

        if ($type === self::DISCOUNT_FIXED) {
            return min($value, $base);
        }

        return 0.0;
    }

    /**
     * @param  LigneDocument|array<string, mixed>  $ligne
     */
    public static function totalHt(LigneDocument|array $ligne): float
    {
        return max(0.0, self::baseAmount($ligne) - self::discountAmount($ligne));
    }

    /**
     * @param  LigneDocument|array<string, mixed>  $ligne
     */
    public static function vatAmount(LigneDocument|array $ligne): float
    {
        $vatRate = (float) self::value($ligne, 'vat_rate');

        return self::totalHt($ligne) * ($vatRate / 100);
    }

    /**
     * @param  LigneDocument|array<string, mixed>  $ligne
     */
    public static function totalTtc(LigneDocument|array $ligne): float
    {
        return self::totalHt($ligne) + self::vatAmount($ligne);
    }

    /**
     * Expression SQL : montant HT d'une ligne après remise.
     */
    public static function ligneHtSql(string $alias = 'ld'): string
    {
        $base = "{$alias}.quantity * {$alias}.unit_price_ht";
        $fixedDiscount = self::leastSql("{$alias}.discount_value", $base);
        $discount = "CASE
            WHEN {$alias}.discount_type = 'percent' AND COALESCE({$alias}.discount_value, 0) > 0
                THEN {$base} * ({$alias}.discount_value / 100)
            WHEN {$alias}.discount_type = 'fixed' AND COALESCE({$alias}.discount_value, 0) > 0
                THEN {$fixedDiscount}
            ELSE 0
        END";

        return self::greatestZeroSql("{$base} - ({$discount})");
    }

    private static function greatestZeroSql(string $expression): string
    {
        if (DB::getDriverName() === 'sqlite') {
            return "MAX(0, {$expression})";
        }

        return "GREATEST(0, {$expression})";
    }

    private static function leastSql(string $left, string $right): string
    {
        if (DB::getDriverName() === 'sqlite') {
            return "MIN({$left}, {$right})";
        }

        return "LEAST({$left}, {$right})";
    }

    /**
     * @param  LigneDocument|array<string, mixed>  $ligne
     */
    public static function discountLabel(LigneDocument|array $ligne): ?string
    {
        $type = self::value($ligne, 'discount_type');
        $value = (float) self::value($ligne, 'discount_value');

        if ($type === null || $type === '' || $value <= 0) {
            return null;
        }

        if ($type === self::DISCOUNT_PERCENT) {
            return rtrim(rtrim(number_format($value, 2, ',', ' '), '0'), ',').' %';
        }

        if ($type === self::DISCOUNT_FIXED) {
            return number_format($value, 2, ',', ' ').' €';
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $ligne
     * @return array{0: string|null, 1: float|null}
     */
    public static function normalizeDiscountInput(array $ligne): array
    {
        $type = $ligne['discount_type'] ?? null;

        if ($type === '' || $type === null) {
            return [null, null];
        }

        $value = (float) ($ligne['discount_value'] ?? 0);

        if ($value <= 0) {
            return [null, null];
        }

        return [(string) $type, $value];
    }

    /**
     * @param  LigneDocument|array<string, mixed>  $ligne
     */
    private static function value(LigneDocument|array $ligne, string $key): mixed
    {
        if ($ligne instanceof LigneDocument) {
            return $ligne->{$key};
        }

        return $ligne[$key] ?? null;
    }
}
