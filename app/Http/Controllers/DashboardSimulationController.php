<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AiInsightService;
use App\Services\FinancialService;
use App\Support\FinancialSimulation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardSimulationController extends Controller
{
    public function __construct(
        private FinancialService $financialService,
        private AiInsightService $aiInsightService,
    ) {
    }

    public function simulateInsights(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'marketing_budget_delta' => ['required', 'numeric', 'min:-50', 'max:100'],
            'new_clients_per_month' => ['required', 'numeric', 'min:0', 'max:20'],
            'fixed_charges_delta' => ['required', 'numeric', 'min:-30', 'max:50'],
            'viewed_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $actor = $request->user();
        $targetUser = $actor;

        if (
            ! empty($validated['viewed_user_id'])
            && $actor->role === 'admin'
        ) {
            $targetUser = User::query()->findOrFail((int) $validated['viewed_user_id']);
        }

        $currentRecord = $targetUser->financialRecords()
            ->orderByDesc('month')
            ->first();

        if (! $currentRecord) {
            return response()->json([
                'insight' => null,
                'message' => 'Aucune donnee financiere disponible pour simuler.',
            ], 422);
        }

        $simulation = FinancialSimulation::projectFromRecord(
            $currentRecord,
            $validated,
            $this->financialService,
        );

        $baseDashboard = $this->financialService->buildDashboardData(
            $targetUser->financialRecords()->orderBy('month')->get(),
        );

        try {
            $insight = $this->aiInsightService->generateSimulationInsight(
                $baseDashboard,
                $simulation,
                $validated,
            );

            return response()->json([
                'insight' => $insight,
                'health_score' => FinancialSimulation::healthScore($simulation['horizon_kpis']),
                'horizon_kpis' => $simulation['horizon_kpis'],
            ]);
        } catch (\Throwable) {
            return response()->json([
                'insight' => null,
                'message' => 'Analyse IA indisponible pour cette simulation.',
            ], 503);
        }
    }
}
