<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class StripeWebhookController extends Controller
{
    public function handle(Request $request): Response
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        if (! $webhookSecret || ! $signature || ! $this->hasValidSignature($payload, $signature, $webhookSecret)) {
            return response('Invalid Stripe signature.', Response::HTTP_BAD_REQUEST);
        }

        $event = json_decode($payload, true);

        if (! is_array($event) || ! isset($event['type'], $event['data']['object'])) {
            return response('Invalid Stripe payload.', Response::HTTP_BAD_REQUEST);
        }

        try {
            match ($event['type']) {
                'checkout.session.completed' => $this->handleCheckoutCompleted($event['data']['object']),
                'customer.subscription.updated' => $this->handleSubscriptionUpdated($event['data']['object']),
                'customer.subscription.deleted' => $this->handleSubscriptionDeleted($event['data']['object']),
                default => null,
            };
        } catch (\Throwable $e) {
            report($e);

            return response('Webhook processing failed.', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return response('Webhook handled.', Response::HTTP_OK);
    }

    private function handleCheckoutCompleted(array $session): void
    {
        if (($session['mode'] ?? null) !== 'subscription') {
            return;
        }

        $user = User::find($session['client_reference_id'] ?? null);

        if (! $user) {
            return;
        }

        $subscriptionId = $session['subscription'] ?? null;

        if (! $subscriptionId) {
            return;
        }

        $user->stripe_customer_id = $session['customer'] ?? $user->stripe_customer_id;
        $user->stripe_subscription_id = $subscriptionId;
        $user->stripe_status = $this->getStripeSubscriptionStatus($subscriptionId);
        $user->save();
    }

    private function handleSubscriptionUpdated(array $subscription): void
    {
        $user = User::where('stripe_subscription_id', $subscription['id'] ?? null)->first();

        if (! $user) {
            return;
        }

        $user->stripe_status = $subscription['status'] ?? $user->stripe_status;
        $user->save();
    }

    private function handleSubscriptionDeleted(array $subscription): void
    {
        $user = User::where('stripe_subscription_id', $subscription['id'] ?? null)->first();

        if (! $user) {
            return;
        }

        $user->stripe_status = 'canceled';
        $user->save();
    }

    private function getStripeSubscriptionStatus(string $subscriptionId): string
    {
        $stripeSecret = config('services.stripe.secret');

        if (! $stripeSecret) {
            throw new RuntimeException('Stripe secret is missing.');
        }

        $response = Http::withToken($stripeSecret)
            ->get("https://api.stripe.com/v1/subscriptions/{$subscriptionId}");

        if ($response->failed() || ! $response->json('status')) {
            throw new RuntimeException('Unable to fetch Stripe subscription status.');
        }

        return $response->json('status');
    }

    private function hasValidSignature(string $payload, string $signature, string $webhookSecret): bool
    {
        $timestamp = null;
        $signatures = [];

        foreach (explode(',', $signature) as $part) {
            [$key, $value] = array_pad(explode('=', $part, 2), 2, null);

            if ($key === 't') {
                $timestamp = $value;
            }

            if ($key === 'v1' && $value) {
                $signatures[] = $value;
            }
        }

        if (! $timestamp || ! is_numeric($timestamp) || $signatures === []) {
            return false;
        }

        if (abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        $expectedSignature = hash_hmac('sha256', $timestamp.'.'.$payload, $webhookSecret);

        foreach ($signatures as $givenSignature) {
            if (hash_equals($expectedSignature, $givenSignature)) {
                return true;
            }
        }

        return false;
    }
}
