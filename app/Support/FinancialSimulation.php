<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\FinancialRecord;
use App\Services\FinancialService;
use Carbon\Carbon;

class FinancialSimulation
{
    public const PROJECTION_MONTHS = 6;

    /**
     * @param  array{
     *     marketing_budget_delta?: float|int,
     *     new_clients_per_month?: float|int,
     *     fixed_charges_delta?: float|int
     * }  $params
     * @return array{
     *     baseline: array<string, mixed>,
     *     projected: list<array<string, mixed>>,
     *     horizon_kpis: array<string, mixed>
     * }
     */
    public static function projectFromRecord(?FinancialRecord $record, array $params, FinancialService $financialService): array
    {
        if (! $record) {
            return [
                'baseline' => [],
                'projected' => [],
                'horizon_kpis' => [],
            ];
        }

        $marketingBudgetDelta = (float) ($params['marketing_budget_delta'] ?? 0);
        $newClientsPerMonth = (float) ($params['new_clients_per_month'] ?? 0);
        $fixedChargesDelta = (float) ($params['fixed_charges_delta'] ?? 0);

        $baseline = [
            'month' => $record->month,
            'revenue' => (float) $record->revenue,
            'charges' => (float) $record->charges,
            'marketing_budget' => (float) $record->marketing_budget,
            'clients_count' => (int) $record->clients_count,
        ];

        $fixedCharges = max(0, $baseline['charges'] - $baseline['marketing_budget']);
        $revenuePerClient = $baseline['clients_count'] > 0
            ? $baseline['revenue'] / $baseline['clients_count']
            : $baseline['revenue'];

        $projected = [];
        $cursor = Carbon::createFromFormat('Y-m', $record->month)->startOfMonth();

        for ($monthIndex = 1; $monthIndex <= self::PROJECTION_MONTHS; $monthIndex++) {
            $cursor = $cursor->copy()->addMonth();
            $marketingBudget = $baseline['marketing_budget'] * (1 + ($marketingBudgetDelta / 100));
            $fixedComponent = $fixedCharges * (1 + ($fixedChargesDelta / 100));
            $additionalClients = $newClientsPerMonth * $monthIndex;
            $projectedClients = max(1, $baseline['clients_count'] + (int) round($additionalClients));
            $organicGrowth = $baseline['revenue'] * 0.015 * $monthIndex;
            $acquisitionRevenue = $revenuePerClient * $newClientsPerMonth * $monthIndex;
            $projectedRevenue = $baseline['revenue'] + $organicGrowth + $acquisitionRevenue;
            $projectedCharges = $fixedComponent + $marketingBudget;

            $projected[] = [
                'mois' => $cursor->format('Y-m'),
                'ca' => round($projectedRevenue, 2),
                'charges' => round($projectedCharges, 2),
                'clients_count' => $projectedClients,
                'marketing_budget' => round($marketingBudget, 2),
                'is_projected' => true,
            ];
        }

        $horizon = $projected[self::PROJECTION_MONTHS - 1] ?? [];
        $horizonRecord = new FinancialRecord([
            'month' => $horizon['mois'] ?? $record->month,
            'revenue' => $horizon['ca'] ?? 0,
            'charges' => $horizon['charges'] ?? 0,
            'marketing_budget' => $horizon['marketing_budget'] ?? 0,
            'clients_count' => $horizon['clients_count'] ?? 0,
        ]);

        return [
            'baseline' => $baseline,
            'projected' => $projected,
            'horizon_kpis' => [
                'mois_actuel' => $horizonRecord->month,
                'chiffre_affaires' => $horizonRecord->revenue,
                'charges_totales' => $horizonRecord->charges,
                'marge_nette' => $financialService->calculateNetMargin($horizonRecord),
                'cac' => $financialService->calculateCac($horizonRecord),
                'ltv' => $financialService->calculateLtv($horizonRecord),
                'marketing_budget' => $horizonRecord->marketing_budget,
                'clients_count' => $horizonRecord->clients_count,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $kpis
     */
    public static function healthScore(array $kpis): int
    {
        $margin = (float) ($kpis['marge_nette'] ?? 0);
        $revenue = (float) ($kpis['chiffre_affaires'] ?? 0);
        $charges = (float) ($kpis['charges_totales'] ?? 0);
        $cac = $kpis['cac'] ?? null;
        $ltv = $kpis['ltv'] ?? null;

        $score = 50;

        if ($margin > 0) {
            $score += 20;
        } elseif ($margin < 0) {
            $score -= 25;
        }

        if ($cac !== null && $ltv !== null && (float) $cac > 0) {
            $ratio = (float) $ltv / (float) $cac;
            if ($ratio > 3) {
                $score += 20;
            } elseif ($ratio >= 1) {
                $score += 8;
            } else {
                $score -= 18;
            }
        }

        if ($revenue > 0) {
            $chargesRatio = $charges / $revenue;
            if ($chargesRatio <= 0.5) {
                $score += 10;
            } elseif ($chargesRatio <= 0.7) {
                $score += 5;
            } else {
                $score -= 10;
            }
        }

        return max(0, min(100, $score));
    }
}
