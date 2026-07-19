<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Document;
use Illuminate\Support\Carbon;

class FinancialDiscount
{
    public static function percent(Document $document): float
    {
        return max(0.0, (float) ($document->financial_discount_percent ?? 0));
    }

    public static function days(Document $document): ?int
    {
        $days = $document->financial_discount_days;

        return $days !== null && $days > 0 ? (int) $days : null;
    }

    public static function isConfigured(Document $document): bool
    {
        return self::percent($document) > 0 && self::days($document) !== null;
    }

    public static function deadline(Document $document): ?Carbon
    {
        if (! self::isConfigured($document) || ! $document->issue_date) {
            return null;
        }

        return $document->issue_date->copy()->startOfDay()->addDays((int) self::days($document));
    }

    public static function isEligible(Document $document, Carbon|string $paymentDate): bool
    {
        $deadline = self::deadline($document);

        if ($deadline === null) {
            return false;
        }

        $paidAt = $paymentDate instanceof Carbon
            ? $paymentDate->copy()->startOfDay()
            : Carbon::parse($paymentDate)->startOfDay();

        return $paidAt->lte($deadline);
    }

    public static function settledAmount(Document $document): float
    {
        $document->loadMissing('payments');

        $cash = (float) $document->payments->sum('amount');
        $discounts = (float) $document->payments->sum('financial_discount_amount');

        return round($cash + $discounts, 2);
    }

    public static function remainingBalance(Document $document, ?float $totalTtc = null): float
    {
        $total = $totalTtc ?? DocumentTotals::totalTtc($document);

        return max(0.0, round($total - self::settledAmount($document), 2));
    }

    /**
     * @return array{
     *     discount_amount: float,
     *     net_cash_due: float,
     *     gross_remaining: float,
     *     eligible: bool
     * }
     */
    public static function quoteForRemaining(
        Document $document,
        Carbon|string $paymentDate,
        ?float $totalTtc = null,
    ): array {
        $grossRemaining = self::remainingBalance($document, $totalTtc);
        $eligible = self::isEligible($document, $paymentDate) && self::percent($document) > 0;

        if (! $eligible || $grossRemaining <= 0) {
            return [
                'discount_amount' => 0.0,
                'net_cash_due' => $grossRemaining,
                'gross_remaining' => $grossRemaining,
                'eligible' => false,
            ];
        }

        $discountAmount = round($grossRemaining * self::percent($document) / 100, 2);
        $netCashDue = round(max(0.0, $grossRemaining - $discountAmount), 2);

        return [
            'discount_amount' => $discountAmount,
            'net_cash_due' => $netCashDue,
            'gross_remaining' => $grossRemaining,
            'eligible' => true,
        ];
    }

    /**
     * @return array{
     *     amount: float,
     *     financial_discount_amount: float,
     *     settled: float,
     *     remaining_after: float,
     *     escompte_applied: bool
     * }
     */
    public static function resolvePayment(
        Document $document,
        float $cashAmount,
        Carbon|string $paymentDate,
        ?float $totalTtc = null,
    ): array {
        $quote = self::quoteForRemaining($document, $paymentDate, $totalTtc);
        $cashAmount = round(max(0.0, $cashAmount), 2);
        $discountAmount = 0.0;
        $escompteApplied = false;

        if ($quote['eligible'] && abs($cashAmount - $quote['net_cash_due']) <= 0.01) {
            $discountAmount = $quote['discount_amount'];
            $escompteApplied = $discountAmount > 0;
        }

        $settled = round($cashAmount + $discountAmount, 2);
        $remainingAfter = max(0.0, round($quote['gross_remaining'] - $settled, 2));

        return [
            'amount' => $cashAmount,
            'financial_discount_amount' => $discountAmount,
            'settled' => $settled,
            'remaining_after' => $remainingAfter,
            'escompte_applied' => $escompteApplied,
        ];
    }
}
