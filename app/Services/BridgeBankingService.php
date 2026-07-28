<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\User;
use App\Services\Bridge\BridgeApiClient;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class BridgeBankingService
{
    public function __construct(
        private readonly BridgeApiClient $bridge,
    ) {}

    public function configured(): bool
    {
        return $this->bridge->configured();
    }

    public function ensureBridgeUser(User $user): User
    {
        if (filled($user->bridge_user_uuid)) {
            return $user;
        }

        $externalUserId = $this->externalUserId($user);
        $payload = $this->bridge->createUser($externalUserId);
        $uuid = (string) ($payload['uuid'] ?? '');

        if ($uuid === '') {
            throw new RuntimeException('Bridge n a pas renvoye d identifiant utilisateur.');
        }

        $user->forceFill(['bridge_user_uuid' => $uuid])->save();

        return $user->refresh();
    }

    /**
     * @return array{url: string, session_id: string}
     */
    public function createConnectSession(User $user): array
    {
        $user = $this->ensureBridgeUser($user);
        $auth = $this->bridge->authorizeUser($this->externalUserId($user));
        $accessToken = (string) ($auth['access_token'] ?? '');

        if ($accessToken === '') {
            throw new RuntimeException('Token Bridge invalide.');
        }

        $session = $this->bridge->createConnectSession($accessToken, [
            'user_email' => $user->email,
            'callback_url' => $this->callbackUrl(),
        ]);

        $url = (string) ($session['url'] ?? '');
        $sessionId = (string) ($session['id'] ?? '');

        if ($url === '') {
            throw new RuntimeException('Bridge Connect n a pas renvoye d URL.');
        }

        return [
            'url' => $url,
            'session_id' => $sessionId,
        ];
    }

    /**
     * @return array{accounts: int, transactions: int}
     */
    public function syncUserBanking(User $user): array
    {
        $user = $this->ensureBridgeUser($user);
        $auth = $this->bridge->authorizeUser($this->externalUserId($user));
        $accessToken = (string) ($auth['access_token'] ?? '');

        if ($accessToken === '') {
            throw new RuntimeException('Token Bridge invalide.');
        }

        $accountsPayload = $this->bridge->listAccounts($accessToken);
        $resources = $accountsPayload['resources'] ?? [];

        if (! is_array($resources) || $resources === []) {
            throw new RuntimeException('Aucun compte bancaire synchronise via Bridge.');
        }

        $primary = $this->pickPrimaryAccount($resources);

        if ($primary === null) {
            throw new RuntimeException('Aucun compte bancaire actif trouve chez Bridge.');
        }

        $user->bankAccounts()
            ->whereNotNull('bridge_account_id')
            ->where('bridge_account_id', '!=', (string) ($primary['id'] ?? ''))
            ->delete();

        $bankAccount = $this->syncAccount($user, $primary);
        $transactions = $this->syncTransactions($accessToken, $bankAccount);

        return [
            'accounts' => 1,
            'transactions' => $transactions,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $resources
     * @return array<string, mixed>|null
     */
    private function pickPrimaryAccount(array $resources): ?array
    {
        $enabled = collect($resources)
            ->filter(fn (array $account) => ($account['data_access'] ?? '') === 'enabled')
            ->values();

        if ($enabled->isEmpty()) {
            $enabled = collect($resources)->values();
        }

        $checking = $enabled->first(
            fn (array $account) => ($account['type'] ?? '') === 'checking',
        );

        return $checking ?? $enabled->first();
    }

    /**
     * @param  array<string, mixed>  $account
     */
    private function syncAccount(User $user, array $account): BankAccount
    {
        $bridgeAccountId = (string) ($account['id'] ?? '');

        if ($bridgeAccountId === '') {
            throw new RuntimeException('Compte Bridge sans identifiant.');
        }

        $balance = $this->normalizeBalance($account['balance'] ?? 0);
        $name = trim((string) ($account['name'] ?? 'Compte bancaire'));

        return BankAccount::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'bridge_account_id' => $bridgeAccountId,
            ],
            [
                'bridge_item_id' => isset($account['item_id']) ? (int) $account['item_id'] : null,
                'bank_name' => $name !== '' ? $name : 'Banque connectee',
                'iban' => filled($account['iban'] ?? null) ? (string) $account['iban'] : null,
                'balance' => round($balance, 2),
                'type' => (string) ($account['type'] ?? 'checking'),
            ],
        );
    }

    private function syncTransactions(string $accessToken, BankAccount $bankAccount): int
    {
        $bridgeAccountId = (int) $bankAccount->bridge_account_id;
        $payload = $this->bridge->listTransactions($accessToken, $bridgeAccountId);
        $resources = $payload['resources'] ?? [];

        if (! is_array($resources)) {
            return 0;
        }

        $synced = 0;

        foreach ($resources as $transaction) {
            if (! is_array($transaction)) {
                continue;
            }

            if (($transaction['deleted'] ?? false) === true) {
                continue;
            }

            $bridgeTransactionId = (string) ($transaction['id'] ?? '');

            if ($bridgeTransactionId === '') {
                continue;
            }

            $amount = $this->normalizeAmount($transaction['amount'] ?? 0);
            $label = trim((string) ($transaction['clean_description'] ?? $transaction['provider_description'] ?? 'Operation bancaire'));
            $date = $this->resolveTransactionDate($transaction);

            BankTransaction::query()->updateOrCreate(
                [
                    'bank_account_id' => $bankAccount->id,
                    'bridge_transaction_id' => $bridgeTransactionId,
                ],
                [
                    'amount' => round($amount, 2),
                    'date' => $date,
                    'label' => $label !== '' ? $label : 'Operation bancaire',
                    'status' => 'posted',
                ],
            );

            $synced++;
        }

        return $synced;
    }

    /**
     * @param  array<string, mixed>  $transaction
     */
    private function resolveTransactionDate(array $transaction): string
    {
        $candidate = $transaction['transaction_date']
            ?? $transaction['date']
            ?? $transaction['value_date']
            ?? null;

        if (is_string($candidate) && $candidate !== '') {
            return Carbon::parse($candidate)->toDateString();
        }

        return now()->toDateString();
    }

    private function externalUserId(User $user): string
    {
        return 'copifi-user-'.$user->id;
    }

    private function callbackUrl(): string
    {
        $configured = config('services.bridge.connect_callback_url');

        if (filled($configured)) {
            return (string) $configured;
        }

        return route('banking.bridge.callback', absolute: true);
    }

    private function normalizeBalance(float|int|string|null $value): float
    {
        $amount = (float) $value;

        return round(abs($amount) >= 1000 ? $amount / 100 : $amount, 2);
    }

    private function normalizeAmount(float|int|string|null $value): float
    {
        return round((float) $value, 2);
    }

    public function logSyncFailure(User $user, \Throwable $exception): void
    {
        Log::warning('Bridge banking sync failed.', [
            'user_id' => $user->id,
            'message' => $exception->getMessage(),
        ]);
    }
}
