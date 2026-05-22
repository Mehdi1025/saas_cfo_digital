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

    public function findOrGenerateForDashboard(User $user, array $dashboardData): ?AiInsight
    {
        $month = $dashboardData['kpis_mensuels']['mois_actuel'] ?? null;

        if (! $month) {
            return null;
        }

        $existingInsight = AiInsight::where('user_id', $user->id)
            ->where('month', $month)
            ->first();

        if ($existingInsight) {
            return $existingInsight;
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
            'generated_content' => $insight->generated_content,
            'edited_content' => $insight->edited_content,
            'is_edited' => $insight->edited_content !== null,
            'edited_at' => $insight->edited_at,
        ];
    }

    public function dashboardStatus(?AiInsight $insight, array $dashboardData): string
    {
        if ($insight) {
            return 'ready';
        }

        if (! ($dashboardData['kpis_mensuels']['mois_actuel'] ?? null)) {
            return 'missing_data';
        }

        return 'unavailable';
    }
}
