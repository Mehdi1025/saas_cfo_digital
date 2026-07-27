<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class StripeFinancialConnectionsService
{
    public function isConfigured(): bool
    {
        return filled(config('services.stripe.key'))
            && filled(config('services.stripe.secret'));
    }

    public function ensureStripeCustomer(User $user): string
    {
        if (filled($user->stripe_customer_id)) {
            return $user->stripe_customer_id;
        }

        $response = Http::asForm()
            ->withToken($this->secret())
            ->post('https://api.stripe.com/v1/customers', [
                'email' => $user->email,
                'name' => $user->name,
                'metadata[user_id]' => (string) $user->id,
            ]);

        if ($response->failed() || ! filled($response->json('id'))) {
            throw new RuntimeException($this->formatStripeError(
                $response->json(),
                'Impossible de creer le client Stripe.',
            ));
        }

        $customerId = $response->json('id');
        $user->forceFill(['stripe_customer_id' => $customerId])->save();

        return $customerId;
    }

    /**
     * @return array{session_id: string, client_secret: string}
     */
    public function createSession(User $user): array
    {
        $customerId = $this->ensureStripeCustomer($user);

        $payload = [
            'account_holder[type]' => 'customer',
            'account_holder[customer]' => $customerId,
            'permissions[]' => 'balances',
            'permissions[]' => 'ownership',
            'permissions[]' => 'transactions',
            'return_url' => route('dashboard'),
        ];

        foreach ($this->supportedCountries() as $country) {
            $payload['filters[countries][]'] = $country;
        }

        $response = Http::asForm()
            ->withToken($this->secret())
            ->post('https://api.stripe.com/v1/financial_connections/sessions', $payload);

        if ($response->failed()) {
            throw new RuntimeException($this->formatStripeError(
                $response->json(),
                'Impossible de demarrer la connexion bancaire Stripe.',
            ));
        }

        $sessionId = $response->json('id');
        $clientSecret = $response->json('client_secret');

        if (! is_string($sessionId) || ! is_string($clientSecret)) {
            throw new RuntimeException('Session Stripe Financial Connections incomplete.');
        }

        return [
            'session_id' => $sessionId,
            'client_secret' => $clientSecret,
        ];
    }

    /**
     * @return array{accounts: int, transactions: int}
     */
    public function syncSession(User $user, string $sessionId): array
    {
        $session = $this->retrieveSession($sessionId);
        $sessionCustomer = data_get($session, 'account_holder.customer');

        if ($sessionCustomer !== $user->stripe_customer_id) {
            throw new RuntimeException('Cette session bancaire ne correspond pas a votre compte.');
        }

        $accountIds = $session['accounts'] ?? [];
        $accountsSynced = 0;
        $transactionsSynced = 0;

        foreach ($accountIds as $accountId) {
            if (! is_string($accountId) || $accountId === '') {
                continue;
            }

            $bankAccount = $this->syncFinancialAccount($user, $accountId);
            $accountsSynced++;
            $transactionsSynced += $this->syncTransactions($bankAccount);
        }

        return [
            'accounts' => $accountsSynced,
            'transactions' => $transactionsSynced,
        ];
    }

    public function syncFinancialAccount(User $user, string $financialAccountId): BankAccount
    {
        $this->refreshAccountBalance($financialAccountId);
        $account = $this->retrieveFinancialAccount($financialAccountId);

        $balanceCents = data_get($account, 'balance.cash.available.amount')
            ?? data_get($account, 'balance.current.amount')
            ?? 0;

        $last4 = $account['last4'] ?? null;
        $institution = $account['institution_name'] ?? 'Banque connectee';

        return BankAccount::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'stripe_fc_account_id' => $financialAccountId,
            ],
            [
                'bank_name' => $institution,
                'iban' => $last4 ? '****'.$last4 : null,
                'balance' => round(((float) $balanceCents) / 100, 2),
                'type' => $account['subcategory'] ?? 'checking',
            ],
        );
    }

    public function syncTransactions(BankAccount $bankAccount): int
    {
        if (! filled($bankAccount->stripe_fc_account_id)) {
            return 0;
        }

        $response = Http::withToken($this->secret())
            ->get('https://api.stripe.com/v1/financial_connections/transactions', [
                'account' => $bankAccount->stripe_fc_account_id,
                'limit' => 50,
            ]);

        if ($response->failed()) {
            return 0;
        }

        $synced = 0;

        foreach ($response->json('data') ?? [] as $transaction) {
            if (! is_array($transaction) || ! filled($transaction['id'])) {
                continue;
            }

            $amountCents = (float) ($transaction['amount'] ?? 0);
            $postedAt = $transaction['transacted_at'] ?? $transaction['status_transitions']['posted_at'] ?? null;
            $date = $postedAt ? date('Y-m-d', (int) $postedAt) : now()->toDateString();

            BankTransaction::query()->updateOrCreate(
                [
                    'bank_account_id' => $bankAccount->id,
                    'stripe_transaction_id' => $transaction['id'],
                ],
                [
                    'amount' => round($amountCents / 100, 2),
                    'date' => $date,
                    'label' => $transaction['description'] ?? 'Transaction bancaire',
                    'status' => $transaction['status'] ?? 'posted',
                ],
            );

            $synced++;
        }

        return $synced;
    }

    private function refreshAccountBalance(string $financialAccountId): void
    {
        Http::asForm()
            ->withToken($this->secret())
            ->post("https://api.stripe.com/v1/financial_connections/accounts/{$financialAccountId}/refresh", [
                'features[]' => 'balance',
            ]);
    }

    private function retrieveSession(string $sessionId): array
    {
        $response = Http::withToken($this->secret())
            ->get("https://api.stripe.com/v1/financial_connections/sessions/{$sessionId}");

        if ($response->failed()) {
            throw new RuntimeException('Session Stripe introuvable.');
        }

        return $response->json();
    }

    private function retrieveFinancialAccount(string $financialAccountId): array
    {
        $response = Http::withToken($this->secret())
            ->get("https://api.stripe.com/v1/financial_connections/accounts/{$financialAccountId}");

        if ($response->failed()) {
            throw new RuntimeException('Compte bancaire Stripe introuvable.');
        }

        return $response->json();
    }

    private function secret(): string
    {
        $secret = config('services.stripe.secret');

        if (! is_string($secret) || $secret === '') {
            throw new RuntimeException('Configuration Stripe manquante.');
        }

        return trim($secret, " \t\n\r\0\x0B<>\"'");
    }

    /**
     * @return list<string>
     */
    private function supportedCountries(): array
    {
        $countries = config('services.stripe.fc_countries', ['US']);

        return is_array($countries) && count($countries) > 0 ? $countries : ['US'];
    }

    /**
     * @param  array<string, mixed>|null  $payload
     */
    private function formatStripeError(?array $payload, string $fallback): string
    {
        $message = data_get($payload, 'error.message');

        if (! is_string($message) || $message === '') {
            return $fallback;
        }

        if (str_contains($message, 'Supported countries: US')) {
            return 'Stripe Financial Connections ne supporte que les comptes bancaires US. En mode test, choisissez une banque de demonstration US.';
        }

        return $message;
    }
}
