<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $canAccessApp = $user !== null
            && $user->suspended_at === null
            && in_array($user->stripe_status, ['active', 'trialing'], true);

        if (! $canAccessApp) {
            return Inertia::render('Dashboard', [
                'dashboardData' => null,
            ]);
        }

        $records = $user->financialRecords()
            ->orderBy('month')
            ->get();

        $currentMonthRecord = $records->sortByDesc('month')->first();

        $dashboardData = [
            'kpis_mensuels' => [
                'mois_actuel' => $currentMonthRecord?->month,
                'chiffre_affaires' => $currentMonthRecord?->revenue ?? 0,
                'charges_totales' => $currentMonthRecord?->charges ?? 0,
                'marge_nette' => $currentMonthRecord
                    ? $currentMonthRecord->revenue - $currentMonthRecord->charges
                    : 0,
                'cac' => ($currentMonthRecord && $currentMonthRecord->clients_count > 0)
                    ? $currentMonthRecord->marketing_budget / $currentMonthRecord->clients_count
                    : 0,
                'ltv' => ($currentMonthRecord && $currentMonthRecord->clients_count > 0)
                    ? $currentMonthRecord->revenue / $currentMonthRecord->clients_count
                    : 0,
            ],
            'graphique_evolution' => $records->take(-3)->values()->map(function ($record) {
                return [
                    'mois' => $record->month,
                    'ca' => $record->revenue,
                    'charges' => $record->charges,
                ];
            }),
        ];

        return Inertia::render('Dashboard', [
            'dashboardData' => $dashboardData,
        ]);
    }
}
