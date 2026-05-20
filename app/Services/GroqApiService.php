<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class GroqApiService
{
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
