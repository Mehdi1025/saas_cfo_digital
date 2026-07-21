<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PowensService
{
    public function isConfigured(): bool
    {
        return filled(config('services.powens.client_id'))
            && filled(config('services.powens.client_secret'))
            && filled(config('services.powens.domain'))
            && filled(config('services.powens.redirect_uri'));
    }

    /**
     * Crée un utilisateur Powens (auth/init) ou renouvelle le token permanent existant.
     *
     * @return array{access_token: string, id_user: int|null}
     */
    public function ensurePermanentUserToken(User $user): array
    {
        if (filled($user->powens_access_token)) {
            return [
                'access_token' => $user->powens_access_token,
                'id_user' => $user->powens_id_user,
            ];
        }

        $response = $this->post('/auth/init', [
            'client_id' => config('services.powens.client_id'),
            'client_secret' => config('services.powens.client_secret'),
        ]);

        $accessToken = (string) $response->json('auth_token');
        $idUser = $response->json('id_user');

        if ($accessToken === '') {
            throw new RuntimeException('Powens auth/init n a pas retourne de token.');
        }

        $user->forceFill([
            'powens_access_token' => $accessToken,
            'powens_id_user' => $idUser !== null ? (int) $idUser : null,
        ])->save();

        return [
            'access_token' => $accessToken,
            'id_user' => $user->powens_id_user,
        ];
    }

    /**
     * Génère un code temporaire pour ouvrir la Webview Connect.
     */
    public function createTemporaryCode(string $accessToken): string
    {
        $response = $this->get('/auth/token/code', [
            'type' => 'singleAccess',
        ], $accessToken);

        $code = (string) $response->json('code');

        if ($code === '') {
            throw new RuntimeException('Powens n a pas retourne de code temporaire.');
        }

        return $code;
    }

    /**
     * Échange le code OAuth retourné par la Webview contre un access_token permanent.
     *
     * @return array{access_token: string, token_type: string|null}
     */
    public function exchangeAuthorizationCode(string $code): array
    {
        $response = $this->post('/auth/token/access', [
            'grant_type' => 'authorization_code',
            'client_id' => config('services.powens.client_id'),
            'client_secret' => config('services.powens.client_secret'),
            'code' => $code,
        ]);

        $accessToken = (string) $response->json('access_token');

        if ($accessToken === '') {
            throw new RuntimeException('Echange du code Powens impossible.');
        }

        return [
            'access_token' => $accessToken,
            'token_type' => $response->json('token_type'),
        ];
    }

    public function buildConnectWebviewUrl(string $temporaryCode): string
    {
        $query = http_build_query([
            'domain' => config('services.powens.domain'),
            'client_id' => config('services.powens.client_id'),
            'redirect_uri' => config('services.powens.redirect_uri'),
            'code' => $temporaryCode,
        ]);

        return rtrim((string) config('services.powens.webview_url'), '/').'?'.$query;
    }

    private function get(string $path, array $query = [], ?string $bearerToken = null): Response
    {
        $request = Http::acceptJson()
            ->timeout((int) config('services.powens.timeout', 20));

        if ($bearerToken) {
            $request = $request->withToken($bearerToken);
        }

        $response = $request->get($this->apiUrl($path), $query);

        if ($response->failed()) {
            throw new RuntimeException('Appel Powens echoue : '.$response->body());
        }

        return $response;
    }

    private function post(string $path, array $payload = [], ?string $bearerToken = null): Response
    {
        $request = Http::acceptJson()
            ->timeout((int) config('services.powens.timeout', 20));

        if ($bearerToken) {
            $request = $request->withToken($bearerToken);
        }

        $response = $request->post($this->apiUrl($path), $payload);

        if ($response->failed()) {
            throw new RuntimeException('Appel Powens echoue : '.$response->body());
        }

        return $response;
    }

    private function apiUrl(string $path): string
    {
        $domain = (string) config('services.powens.domain');
        $base = str_starts_with($domain, 'http')
            ? rtrim($domain, '/')
            : 'https://'.rtrim($domain, '/');

        return $base.'/2.0/'.ltrim($path, '/');
    }
}
