<?php

namespace App\Services;

use App\Models\FinancialRecord;
use Illuminate\Support\Collection;

class FinancialService
{
    public function buildDashboardData(Collection $records): array
    {
        $currentMonthRecord = $records->sortByDesc('month')->first();
        $alert = $this->buildAlert($currentMonthRecord);

        return [
            'kpis_mensuels' => [
                'mois_actuel' => $currentMonthRecord?->month,
                'chiffre_affaires' => $currentMonthRecord?->revenue ?? 0,
                'charges_totales' => $currentMonthRecord?->charges ?? 0,
                'marge_nette' => $this->calculateNetMargin($currentMonthRecord),
                'cac' => $this->calculateCac($currentMonthRecord),
                'ltv' => $this->calculateLtv($currentMonthRecord),
            ],
            'alerte' => $alert,
            'graphique_evolution' => $records->take(-3)->values()->map(function ($record) {
                return [
                    'mois' => $record->month,
                    'ca' => $record->revenue,
                    'charges' => $record->charges,
                ];
            }),
        ];
    }

    public function calculateNetMargin(?FinancialRecord $record): float|int
    {
        if (! $record) {
            return 0;
        }

        return $record->revenue - $record->charges;
    }

    public function calculateCac(?FinancialRecord $record): float|int|null
    {
        if (! $record || $record->clients_count <= 0) {
            return null;
        }

        return $record->marketing_budget / $record->clients_count;
    }

    public function calculateLtv(?FinancialRecord $record): float|int|null
    {
        if (! $record || $record->clients_count <= 0) {
            return null;
        }

        return $record->revenue / $record->clients_count;
    }

    public function buildAlert(?FinancialRecord $record): ?array
    {
        if (! $record) {
            return null;
        }

        $margin = $this->calculateNetMargin($record);
        $cac = $this->calculateCac($record);
        $ltv = $this->calculateLtv($record);

        if ($margin < 0) {
            return [
                'niveau' => 'critique',
                'message' => 'Votre marge est negative ce mois-ci.',
            ];
        }

        if ($cac !== null && $ltv !== null && $ltv < $cac) {
            return [
                'niveau' => 'critique',
                'message' => 'Votre LTV est inferieure a votre CAC ce mois-ci.',
            ];
        }

        if ($margin > 0 && $cac !== null && $ltv !== null && $cac > 0 && ($ltv / $cac) > 3) {
            return [
                'niveau' => 'sain',
                'message' => 'Vos indicateurs sont favorables ce mois-ci.',
            ];
        }

        if ($record->revenue > 0 && $record->charges > ($record->revenue * 0.7)) {
            return [
                'niveau' => 'attention',
                'message' => 'Vos charges depassent 70 % de votre chiffre d affaires.',
            ];
        }

        return null;
    }
}
