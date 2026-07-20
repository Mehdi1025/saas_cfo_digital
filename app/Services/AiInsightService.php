<?php

namespace App\Services;

use App\Models\AiInsight;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Throwable;

class AiInsightService
{
    public function __construct(private GroqApiService $groqApiService)
    {
    }

    public function findForDashboard(User $user, array $dashboardData): ?AiInsight
    {
        $month = $dashboardData['kpis_mensuels']['mois_actuel'] ?? null;

        if (! $month) {
            return null;
        }

        return AiInsight::where('user_id', $user->id)
            ->where('month', $month)
            ->first();
    }

    public function findOrGenerateForDashboard(User $user, array $dashboardData): ?AiInsight
    {
        $existingInsight = $this->findForDashboard($user, $dashboardData);

        if ($existingInsight) {
            return $existingInsight;
        }

        $month = $dashboardData['kpis_mensuels']['mois_actuel'] ?? null;

        if (! $month) {
            return null;
        }

        try {
            $generatedContent = $this->groqApiService->generateFinancialAnalysis($dashboardData);

            return AiInsight::create([
                'user_id' => $user->id,
                'month' => $month,
                'generated_content' => $generatedContent,
            ]);
        } catch (Throwable $exception) {
            Log::warning('Unable to generate AI financial insight.', [
                'user_id' => $user->id,
                'month' => $month,
                'message' => $exception->getMessage(),
            ]);

            return null;
        }
    }

    public function toDashboardPayload(?AiInsight $insight): ?array
    {
        if (! $insight) {
            return null;
        }

        return [
            'id' => $insight->id,
            'month' => $insight->month,
            'content' => $insight->displayContent(),
            'edited_content' => $insight->edited_content ?? $insight->displayContent(),
            'is_edited' => $insight->edited_content !== null,
        ];
    }

    public function dashboardStatus(?AiInsight $insight, array $dashboardData, bool $allowPending = true): string
    {
        if ($insight) {
            return 'ready';
        }

        if (! ($dashboardData['kpis_mensuels']['mois_actuel'] ?? null)) {
            return 'missing_data';
        }

        return $allowPending ? 'pending' : 'unavailable';
    }

    /**
     * @param  array<string, mixed>  $simulationContext
     * @param  array<string, mixed>  $params
     */
    public function generateSimulationInsight(array $dashboardData, array $simulationContext, array $params): string
    {
        return $this->groqApiService->generateSimulationInsight($dashboardData, $simulationContext, $params);
    }
}
