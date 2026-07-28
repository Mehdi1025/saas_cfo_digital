<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\BankTransaction;
use App\Models\User;
use Illuminate\Support\Collection;

class BankTreasurySummary
{
    private const CHECKING_TYPES = ['checking', 'current'];

    private const LIQUID_TYPES = ['checking', 'current', 'savings'];

    /**
     * @return array<string, mixed>|null
     */
    public static function forUser(User $user): ?array
    {
        $accounts = $user->bankAccounts()
            ->whereNotNull('bridge_account_id')
            ->get(['id', 'balance', 'type', 'bank_name']);

        if ($accounts->isEmpty()) {
            return null;
        }

        $checkingBalance = self::sumCheckingBalance($accounts);
        $liquidBalance = round(
            $accounts
                ->filter(fn ($account) => in_array((string) $account->type, self::LIQUID_TYPES, true))
                ->sum('balance'),
            2,
        );

        $accountIds = $accounts->pluck('id');

        /** @var Collection<int, BankTransaction> $transactions */
        $transactions = BankTransaction::query()
            ->whereIn('bank_account_id', $accountIds)
            ->where('date', '>=', now()->subDays(60)->toDateString())
            ->orderBy('date')
            ->orderBy('id')
            ->limit(120)
            ->get(['id', 'amount', 'date', 'label']);

        $last30 = $transactions->filter(
            fn (BankTransaction $transaction) => $transaction->date?->gte(now()->subDays(30)->startOfDay()),
        );

        $netFlow30 = round((float) $last30->sum('amount'), 2);
        $inflow30 = round((float) $last30->where('amount', '>', 0)->sum('amount'), 2);
        $outflow30 = round(abs((float) $last30->where('amount', '<', 0)->sum('amount')), 2);

        return [
            'has_live_data' => true,
            'source' => 'bridge',
            'checking_balance' => $checkingBalance,
            'liquid_balance' => $liquidBalance,
            'checking_accounts_count' => $accounts
                ->filter(fn ($account) => in_array((string) $account->type, self::CHECKING_TYPES, true))
                ->count(),
            'accounts_count' => $accounts->count(),
            'net_flow_30d' => $netFlow30,
            'inflow_30d' => $inflow30,
            'outflow_30d' => $outflow30,
            'cashflow_events' => self::buildCashflowEvents($user, $last30),
            'daily_net_flow' => self::buildDailyNetFlow($last30),
        ];
    }

    /**
     * @param  Collection<int, \App\Models\BankAccount>  $accounts
     */
    private static function sumCheckingBalance(Collection $accounts): float
    {
        $checking = $accounts->filter(
            fn ($account) => in_array((string) $account->type, self::CHECKING_TYPES, true),
        );

        if ($checking->isNotEmpty()) {
            return round((float) $checking->sum('balance'), 2);
        }

        return round(
            (float) $accounts
                ->reject(fn ($account) => in_array((string) $account->type, ['loan', 'card'], true))
                ->sum('balance'),
            2,
        );
    }

    /**
     * @param  Collection<int, BankTransaction>  $recentTransactions
     * @return list<array<string, mixed>>
     */
    private static function buildCashflowEvents(User $user, Collection $recentTransactions): array
    {
        $events = [];

        $latestRecord = $user->financialRecords()->orderByDesc('month')->first();

        if ($latestRecord && (float) $latestRecord->charges > 0) {
            $events[] = [
                'id' => 'proj-charges',
                'label' => 'Charges mensuelles',
                'subtitle' => 'Projection saisie mensuelle',
                'type' => 'outflow',
                'amount' => -round((float) $latestRecord->charges, 2),
                'dueDay' => 12,
            ];
        }

        if ($latestRecord && (float) $latestRecord->revenue > 0) {
            $events[] = [
                'id' => 'proj-revenue',
                'label' => 'Encaissements clients',
                'subtitle' => 'Projection CA mensuel',
                'type' => 'inflow',
                'amount' => round((float) $latestRecord->revenue * 0.55, 2),
                'dueDay' => 6,
            ];
        }

        $significant = $recentTransactions
            ->sortByDesc(fn (BankTransaction $transaction) => abs((float) $transaction->amount))
            ->take(6)
            ->values();

        foreach ($significant as $index => $transaction) {
            $amount = (float) $transaction->amount;

            if ($amount === 0.0) {
                continue;
            }

            $events[] = [
                'id' => 'bank-tx-'.$transaction->id,
                'label' => filled($transaction->label) ? (string) $transaction->label : 'Operation bancaire',
                'subtitle' => $amount >= 0 ? 'Flux bancaire entrant' : 'Flux bancaire sortant',
                'type' => $amount >= 0 ? 'inflow' : 'outflow',
                'amount' => round($amount, 2),
                'dueDay' => min(28, 4 + ($index * 4)),
            ];
        }

        return $events;
    }

    /**
     * @param  Collection<int, BankTransaction>  $recentTransactions
     * @return list<float>
     */
    private static function buildDailyNetFlow(Collection $recentTransactions): array
    {
        if ($recentTransactions->isEmpty()) {
            return [];
        }

        $byDay = [];

        foreach ($recentTransactions as $transaction) {
            $key = $transaction->date?->toDateString();

            if ($key === null) {
                continue;
            }

            $byDay[$key] = ($byDay[$key] ?? 0) + (float) $transaction->amount;
        }

        ksort($byDay);

        return array_map(fn (float $value) => round($value, 2), array_values($byDay));
    }
}
