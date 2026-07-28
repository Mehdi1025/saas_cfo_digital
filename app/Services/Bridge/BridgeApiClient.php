<?php

declare(strict_types=1);

namespace App\Services\Bridge;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class BridgeApiClient
{
    public function configured(): bool
    {
        return filled(config('services.bridge.client_id'))
            && filled(config('services.bridge.client_secret'));
    }

    /**
     * @return array{uuid: string, external_user_id?: string|null}
     */
    public function createUser(string $externalUserId): array
    {
        $response = $this->appClient()->post('/aggregation/users', [
            'external_user_id' => $externalUserId,
        ]);

        return $this->decode($response, 'Impossible de creer l utilisateur Bridge.');
    }

    /**
     * @return array{access_token: string, expires_at: string, user: array<string, mixed>}
     */
    public function authorizeUser(string $externalUserId): array
    {
        $response = $this->appClient()->post('/aggregation/authorization/token', [
            'external_user_id' => $externalUserId,
        ]);

        return $this->decode($response, 'Impossible d authentifier l utilisateur Bridge.');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{id: string, url: string}
     */
    public function createConnectSession(string $accessToken, array $payload): array
    {
        $response = $this->userClient($accessToken)->post('/aggregation/connect-sessions', $payload);

        return $this->decode($response, 'Impossible de demarrer Bridge Connect.');
    }

    /**
     * @return array{resources: list<array<string, mixed>>, pagination?: array<string, mixed>}
     */
    public function listAccounts(string $accessToken): array
    {
        $response = $this->userClient($accessToken)->get('/aggregation/accounts', [
            'limit' => 100,
        ]);

        return $this->decode($response, 'Impossible de recuperer les comptes Bridge.');
    }

    /**
     * @return array{resources: list<array<string, mixed>>, pagination?: array<string, mixed>}
     */
    public function listTransactions(string $accessToken, ?int $accountId = null, ?string $since = null): array
    {
        $query = ['limit' => 500];

        if ($accountId !== null) {
            $query['account_id'] = $accountId;
        }

        if ($since !== null) {
            $query['since'] = $since;
        }

        $response = $this->userClient($accessToken)->get('/aggregation/transactions', $query);

        return $this->decode($response, 'Impossible de recuperer les transactions Bridge.');
    }

    private function appClient(): PendingRequest
    {
        return $this->baseClient();
    }

    private function userClient(string $accessToken): PendingRequest
    {
        return $this->baseClient()->withToken($accessToken);
    }

    private function baseClient(): PendingRequest
    {
        if (! $this->configured()) {
            throw new RuntimeException('Bridge API non configuree (BRIDGE_CLIENT_ID / BRIDGE_CLIENT_SECRET).');
        }

        return Http::baseUrl(rtrim((string) config('services.bridge.base_url'), '/'))
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'Bridge-Version' => (string) config('services.bridge.version'),
                'Client-Id' => (string) config('services.bridge.client_id'),
                'Client-Secret' => (string) config('services.bridge.client_secret'),
            ])
            ->timeout(30);
    }

    /**
     * @return array<string, mixed>
     */
    private function decode(Response $response, string $fallbackMessage): array
    {
        if ($response->successful()) {
            /** @var array<string, mixed> $payload */
            $payload = $response->json() ?? [];

            return $payload;
        }

        $message = data_get($response->json(), 'errors.0.message')
            ?? data_get($response->json(), 'message')
            ?? $fallbackMessage;

        throw new RuntimeException((string) $message);
    }
}
