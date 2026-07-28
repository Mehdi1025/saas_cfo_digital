<?php

namespace App\Http\Middleware;

use App\Models\BankTransaction;
use App\Support\BankTreasurySummary;
use App\Services\CompanySettingsService;
use App\Services\DeliveryDestinationService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'role' => $user->role,
                    'stripe_status' => $user->stripe_status,
                    'suspended_at' => $user->suspended_at,
                    'is_suspended' => $user->suspended_at !== null,
                    'can_access_app' => $user->suspended_at === null
                        && in_array($user->stripe_status, ['active', 'trialing'], true),
                    'kpi_profile' => $user->kpi_profile,
                    'kpi_preferences' => $user->kpi_preferences ?? ['enabled_secondary' => []],
                    'needs_kpi_onboarding' => $user->needsKpiOnboarding(),
                ] : null,
            ],
            'tax_rates' => config('taxes'),
            'currencies' => config('currencies'),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'compliance_errors' => $request->session()->get('compliance_errors', []),
            ],
            'company' => fn () => $user
                ? app(CompanySettingsService::class)->forFrontend()
                : null,
            'delivery_destinations' => fn () => $user
                ? app(DeliveryDestinationService::class)->forFrontend()
                : [],
            'pricing' => [
                'name' => config('services.stripe.plan_name'),
                'amount' => config('services.stripe.plan_price'),
                'amount_display' => str_replace('.', ',', (string) config('services.stripe.plan_price')),
                'amount_label' => config('services.stripe.plan_price_label'),
                'currency' => config('services.stripe.plan_currency'),
                'interval' => 'mois',
            ],
            'banking' => fn () => $user ? [
                'bridge_configured' => filled(config('services.bridge.client_id'))
                    && filled(config('services.bridge.client_secret')),
                'accounts' => $user->bankAccounts()
                    ->whereNotNull('bridge_account_id')
                    ->orderByDesc('updated_at')
                    ->get(['id', 'bank_name', 'iban', 'balance', 'type'])
                    ->map(fn ($account) => [
                        'id' => $account->id,
                        'bank_name' => $account->bank_name,
                        'iban' => $account->iban,
                        'balance' => (float) $account->balance,
                        'type' => $account->type,
                    ])
                    ->values()
                    ->all(),
                'recent_transactions' => BankTransaction::query()
                    ->whereIn(
                        'bank_account_id',
                        $user->bankAccounts()
                            ->whereNotNull('bridge_account_id')
                            ->pluck('id'),
                    )
                    ->orderByDesc('date')
                    ->orderByDesc('id')
                    ->limit(10)
                    ->get(['id', 'amount', 'date', 'label', 'status'])
                    ->map(fn ($transaction) => [
                        'id' => $transaction->id,
                        'amount' => (float) $transaction->amount,
                        'date' => $transaction->date?->toDateString(),
                        'label' => $transaction->label,
                        'status' => $transaction->status,
                    ])
                    ->values()
                    ->all(),
                'treasury' => BankTreasurySummary::forUser($user),
            ] : null,
        ];
    }
}
