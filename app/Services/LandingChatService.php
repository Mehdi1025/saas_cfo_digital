<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class LandingChatService
{
    private const SYSTEM_PROMPT = <<<'PROMPT'
Tu es l'assistant virtuel de Mini CFO Digital, un SaaS B2B français pour entrepreneurs.

Tu réponds UNIQUEMENT en français, de manière claire, chaleureuse et concise (2 à 4 phrases sauf si une liste est vraiment utile).

Produit — ce que tu peux expliquer :
- Mini CFO Digital : tableau de bord financier (CA, marge, CAC, LTV, alertes, score de santé)
- Saisie mensuelle simple des indicateurs
- Analyse IA (copilote financier) sur les KPI
- Module facturation intégré : devis, factures, clients, catalogue, paiements, PDF, envoi email
- Abonnement Pro à 49 €/mois via Stripe
- Cible : freelances, TPE, startups

Règles strictes :
- Ne invente pas de fonctionnalités absentes (pas de sync bancaire, pas de comptabilité complète, pas de signature électronique)
- Ne donne pas de conseil fiscal, juridique ou d'investissement personnalisé
- Si on te demande d'analyser des chiffres réels, invite à créer un compte et utiliser le dashboard
- Oriente vers l'inscription ou la démo produit quand c'est pertinent
- Reste dans le contexte Mini CFO Digital
PROMPT;

    /**
     * @param  list<array{role: string, content: string}>  $messages
     */
    public function reply(array $messages): string
    {
        $apiKey = config('services.groq.api_key') ?? config('services.groq.key');

        if (! is_string($apiKey) || $apiKey === '') {
            throw new RuntimeException('Clé API Groq non configurée.');
        }

        $verifySsl = (bool) config('services.groq.verify_ssl', true);

        $payload = [
            ['role' => 'system', 'content' => self::SYSTEM_PROMPT],
            ...$messages,
        ];

        $response = Http::withToken($apiKey)
            ->withOptions(['verify' => $verifySsl])
            ->timeout(30)
            ->acceptJson()
            ->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => config('services.groq.model'),
                'messages' => $payload,
                'temperature' => 0.55,
                'max_tokens' => 512,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException(
                'Groq API error: '.$response->status(),
            );
        }

        $content = $response->json('choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('Réponse vide de l\'assistant.');
        }

        return trim($content);
    }
}
