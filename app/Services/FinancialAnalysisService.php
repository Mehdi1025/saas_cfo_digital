<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class FinancialAnalysisService
{
    private const SYSTEM_PROMPT = <<<'PROMPT'
Tu es un Directeur Financier (DAF) virtuel expert. L'utilisateur te fournit les statistiques actuelles de son entreprise. Ton rôle est de rédiger une analyse financière concise, claire et professionnelle en français. Mets en évidence la santé de la trésorerie, alerte sur les retards de paiement, et donne 2 ou 3 recommandations d'actions immédiates. Utilise le formatage Markdown. Sois direct, pas d'introduction inutile.
PROMPT;

    public function analyze(array $financialData): string
    {
        $apiKey = config('services.groq.api_key');

        if (! is_string($apiKey) || $apiKey === '') {
            throw new RuntimeException('Clé API Groq non configurée. Ajoutez GROQ_API_KEY dans votre fichier .env.');
        }

        $verifySsl = (bool) config('services.groq.verify_ssl', true);

        try {
            $response = Http::withToken($apiKey)
                ->withOptions(['verify' => $verifySsl])
                ->timeout(45)
                ->acceptJson()
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => config('services.groq.model'),
                    'messages' => [
                        ['role' => 'system', 'content' => self::SYSTEM_PROMPT],
                        [
                            'role' => 'user',
                            'content' => 'Voici les indicateurs financiers anonymisés de mon entreprise (montants en EUR) :'
                                ."\n\n".json_encode($financialData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
                        ],
                    ],
                    'temperature' => 0.6,
                    'max_tokens' => 1024,
                ]);

            if (! $response->successful()) {
                throw new RuntimeException(
                    'Groq API error: '.$response->status().' — '.($response->json('error.message') ?? $response->body()),
                );
            }

            $content = $response->json('choices.0.message.content');

            if (! is_string($content) || trim($content) === '') {
                throw new RuntimeException('Réponse vide de l\'API Groq.');
            }

            return trim($content);
        } catch (RuntimeException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            $detail = $exception->getMessage();

            if (
                str_contains($detail, 'cURL error 60')
                || str_contains($detail, 'SSL certificate')
                || str_contains($detail, 'unable to get local issuer certificate')
            ) {
                throw new RuntimeException(
                    'Connexion Groq bloquée par un problème de certificat SSL (fréquent sur Windows/XAMPP). '
                    .'Ajoutez GROQ_VERIFY_SSL=false dans votre fichier .env pour le développement local, '
                    .'puis relancez php artisan config:clear.',
                    previous: $exception,
                );
            }

            throw new RuntimeException(
                'Impossible de contacter le service Groq. Vérifiez votre connexion et réessayez.'
                .(config('app.debug') ? ' Détail : '.$detail : ''),
                previous: $exception,
            );
        }
    }
}
