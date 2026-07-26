<?php

namespace App\Http\Middleware;

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
        ];
    }
}
