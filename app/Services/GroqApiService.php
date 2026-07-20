<?php

namespace App\Services;

use App\Support\FinancialSimulation;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GroqApiService
{
    /**
     * @param  array<string, mixed>  $simulationContext
     * @param  array<string, mixed>  $params
     */
    public function generateSimulationInsight(array $dashboardData, array $simulationContext, array $params): string
    {
        $apiKey = config('services.groq.key');
        $model = config('services.groq.model');
        $url = config('services.groq.url');

        if (! $apiKey) {
            throw new RuntimeException('Groq API key is missing.');
        }

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(45)
            ->post($url, [
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $this->simulationSystemPrompt(),
                    ],
                    [
                        'role' => 'user',
                        'content' => $this->buildSimulationPrompt($dashboardData, $simulationContext, $params),
                    ],
                ],
                'temperature' => 0.45,
                'max_tokens' => 280,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Groq API request failed.');
        }

        $content = $response->json('choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('Groq API returned an empty simulation insight.');
        }

        return trim($content);
    }

    public function generateFinancialAnalysis(array $dashboardData): string
    {
        $apiKey = config('services.groq.key');
        $model = config('services.groq.model');
        $url = config('services.groq.url');

        if (! $apiKey) {
            throw new RuntimeException('Groq API key is missing.');
        }

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(20)
            ->post($url, [
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $this->systemPrompt(),
                    ],
                    [
                        'role' => 'user',
                        'content' => $this->buildUserPrompt($dashboardData),
                    ],
                ],
                'temperature' => 0.3,
                'max_tokens' => 500,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Groq API request failed.');
        }

        $content = $response->json('choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('Groq API returned an empty analysis.');
        }

        return trim($content);
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Tu es un analyste financier SaaS.
Tu analyses les KPI d'un client Mini CFO Digital.
Reponds en francais, de facon claire, courte et utile.
Ne donne pas de conseil juridique ou fiscal.
Structure la reponse en 3 parties :
1. Diagnostic rapide
2. Points de vigilance
3. Actions recommandees
PROMPT;
    }

    private function simulationSystemPrompt(): string
    {
        return <<<'PROMPT'
Tu es un Directeur Financier virtuel pour Copifi.
Tu analyses un scenario What-If (simulation sur 6 mois).
Reponds en francais, en 2 ou 3 phrases maximum.
Sois direct, strategique et concret.
Mets en avant l impact tresorerie, la marge et le risque CAC/LTV si pertinent.
Pas de conseil juridique ou fiscal. Pas de listes numerotees.
PROMPT;
    }

    /**
     * @param  array<string, mixed>  $simulationContext
     * @param  array<string, mixed>  $params
     */
    private function buildSimulationPrompt(array $dashboardData, array $simulationContext, array $params): string
    {
        return 'Analyse ce scenario de simulation financiere au format JSON :'.PHP_EOL.PHP_EOL.json_encode([
            'situation_actuelle' => $dashboardData['kpis_mensuels'] ?? [],
            'alerte_actuelle' => $dashboardData['alerte'] ?? null,
            'parametres_simulation' => [
                'variation_budget_marketing_pct' => $params['marketing_budget_delta'] ?? 0,
                'nouveaux_clients_par_mois' => $params['new_clients_per_month'] ?? 0,
                'variation_charges_fixes_pct' => $params['fixed_charges_delta'] ?? 0,
            ],
            'projection_6_mois' => $simulationContext['projected'] ?? [],
            'kpis_horizon_6_mois' => $simulationContext['horizon_kpis'] ?? [],
            'score_sante_simule' => FinancialSimulation::healthScore($simulationContext['horizon_kpis'] ?? []),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    private function buildUserPrompt(array $dashboardData): string
    {
        $kpis = $dashboardData['kpis_mensuels'] ?? [];
        $alert = $dashboardData['alerte'] ?? null;
        $evolution = $dashboardData['graphique_evolution'] ?? [];

        return 'Voici les donnees financieres du client au format JSON :'.PHP_EOL.PHP_EOL.json_encode([
            'kpis_mensuels' => [
                'mois_actuel' => $kpis['mois_actuel'] ?? null,
                'chiffre_affaires' => $kpis['chiffre_affaires'] ?? 0,
                'charges_totales' => $kpis['charges_totales'] ?? 0,
                'marge_nette' => $kpis['marge_nette'] ?? 0,
                'cac' => $kpis['cac'] ?? null,
                'ltv' => $kpis['ltv'] ?? null,
            ],
            'alerte' => $alert,
            'evolution' => $evolution,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
