<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class StripeSubscriptionSync
{
    public function syncUserFromCheckoutSession(User $user, string $sessionId): bool
    {
        $stripeSecret = config('services.stripe.secret');

        if (! $stripeSecret) {
            return false;
        }

        $response = Http::withToken($stripeSecret)
            ->get("https://api.stripe.com/v1/checkout/sessions/{$sessionId}");

        if ($response->failed()) {
            return false;
        }

        $session = $response->json();

        if (($session['mode'] ?? null) !== 'subscription') {
            return false;
        }

        if (($session['client_reference_id'] ?? null) !== (string) $user->id) {
            return false;
        }

        $subscriptionId = $session['subscription'] ?? null;

        if (! is_string($subscriptionId) || $subscriptionId === '') {
            return false;
        }

        $subscription = $this->fetchSubscription($subscriptionId);
        $this->applySubscription($user, $subscription, $session['customer'] ?? null);

        return true;
    }

    public function applySubscription(User $user, array $subscription, ?string $customerId = null): void
    {
        $price = $subscription['items']['data'][0]['price'] ?? null;

        if (is_string($customerId) && $customerId !== '') {
            $user->stripe_customer_id = $customerId;
        }

        $user->stripe_subscription_id = $subscription['id'] ?? $user->stripe_subscription_id;
        $user->stripe_status = $subscription['status'] ?? $user->stripe_status;
        $user->stripe_price_id = $price['id'] ?? $user->stripe_price_id;
        $user->subscription_amount = isset($price['unit_amount'])
            ? number_format($price['unit_amount'] / 100, 2, '.', '')
            : $user->subscription_amount;
        $user->subscription_currency = $price['currency'] ?? $user->subscription_currency;
        $user->save();
    }

    public function fetchSubscription(string $subscriptionId): array
    {
        $stripeSecret = config('services.stripe.secret');

        if (! $stripeSecret) {
            throw new RuntimeException('Stripe secret is missing.');
        }

        $response = Http::withToken($stripeSecret)
            ->get("https://api.stripe.com/v1/subscriptions/{$subscriptionId}");

        if ($response->failed() || ! $response->json('status')) {
            throw new RuntimeException('Unable to fetch Stripe subscription.');
        }

        return $response->json();
    }
}
