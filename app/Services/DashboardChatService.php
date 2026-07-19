<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class DashboardChatService
{
    public function __construct(private CopilotContextService $contextService) {}

    /**
     * @param  list<array{role: string, content: string}>  $messages
     */
    public function reply(User $user, array $messages): string
    {
        $context = $this->contextService->buildForUser($user);

        $apiKey = config('services.groq.api_key') ?? config('services.groq.key');

        if (! is_string($apiKey) || $apiKey === '') {
            throw new RuntimeException('Clé API Groq non configurée.');
        }

        $verifySsl = (bool) config('services.groq.verify_ssl', true);

        $contextMessage = [
            'role' => 'user',
            'content' => 'Données du client connecté (JSON — source de vérité, ne jamais inventer de chiffres hors de ce contexte) :'
                ."\n\n".json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
        ];

        try {
            $response = Http::withToken($apiKey)
                ->withOptions(['verify' => $verifySsl])
                ->timeout(60)
                ->acceptJson()
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => config('services.groq.model'),
                    'messages' => [
                        ['role' => 'system', 'content' => $this->systemPrompt()],
                        $contextMessage,
                        ...$messages,
                    ],
                    'temperature' => 0.4,
                    'max_tokens' => 1024,
                ]);

            if (! $response->successful()) {
                Log::warning('Copilot Groq error', [
                    'user_id' => $user->id,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new RuntimeException('Groq API error: '.$response->status());
            }

            $content = $response->json('choices.0.message.content');

            if (! is_string($content) || trim($content) === '') {
                throw new RuntimeException('Réponse vide de l\'assistant.');
            }

            return trim($content);
        } catch (Throwable $exception) {
            if (! $exception instanceof RuntimeException) {
                Log::error('Copilot unexpected error', [
                    'user_id' => $user->id,
                    'message' => $exception->getMessage(),
                ]);
            }

            throw $exception instanceof RuntimeException
                ? $exception
                : new RuntimeException('Erreur copilote: '.$exception->getMessage());
        }
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Tu es le copilote financier personnel de Mini CFO Digital. Tu parles à UN client entrepreneur identifié dans le JSON.

Tu réponds UNIQUEMENT en français, avec clarté et professionnalisme. Utilise le markdown (titres courts, listes) quand c'est utile.

Tu as accès à deux sources de données du client :
1. **cfo_digital** — saisie mensuelle : CA, charges, marge, CAC, LTV, alertes, évolution sur plusieurs mois
2. **facturation** — devis, factures, encaissements, retards, clients, catalogue, activité récente

Comportement attendu :
- Personnalise chaque réponse avec les chiffres réels du JSON (cite les montants en EUR)
- Croise CFO et facturation quand pertinent (ex. comparer CA saisi vs CA encaissé factures)
- Signale les risques : factures en retard, encours élevé, marge négative, LTV < CAC
- Propose 2 à 4 actions concrètes et priorisées
- Si une donnée manque, dis-le clairement et indique où la compléter (saisie mensuelle, créer factures, etc.)
- Ne jamais inventer de chiffre, client ou document absent du JSON
- Pas de conseil fiscal, juridique ou réglementé d'investissement
- Reste concis sauf si l'utilisateur demande une analyse détaillée
PROMPT;
    }
}
