<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class StripeCheckoutController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $stripeSecret = config('services.stripe.secret');
        $priceId = config('services.stripe.price_id');

        if (! $stripeSecret || ! $priceId) {
            return back()->with('error', 'Configuration Stripe manquante.');
        }

        $payload = [
            'mode' => 'subscription',
            'client_reference_id' => (string) $user->id,
            'success_url' => route('billing.success').'?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('billing.cancel'),
            'line_items' => [
                [
                    'price' => $priceId,
                    'quantity' => 1,
                ],
            ],
        ];

        if ($user->stripe_customer_id) {
            $payload['customer'] = $user->stripe_customer_id;
        } else {
            $payload['customer_email'] = $user->email;
        }

        $response = Http::asForm()
            ->withToken($stripeSecret)
            ->post('https://api.stripe.com/v1/checkout/sessions', $payload);

        if ($response->failed() || ! $response->json('url')) {
            return back()->with('error', 'Impossible de demarrer le paiement Stripe.');
        }

        return redirect()->away($response->json('url'));
    }

    public function success(Request $request): RedirectResponse
    {
        $sessionId = $request->query('session_id');

        if (! $sessionId || ! config('services.stripe.secret')) {
            return redirect('/')->with('success', 'Paiement termine. Verification en cours.');
        }

        $response = Http::withToken(config('services.stripe.secret'))
            ->get("https://api.stripe.com/v1/checkout/sessions/{$sessionId}");

        if ($response->ok()
            && (string) $response->json('client_reference_id') === (string) $request->user()->id
            && $response->json('status') === 'complete') {
            $user = $request->user();
            $user->stripe_customer_id = $response->json('customer');
            $user->stripe_subscription_id = $response->json('subscription');
            $user->stripe_status = 'active';
            $user->save();
        }

        return redirect()->route('dashboard')
            ->with('success', 'Abonnement active avec succes.');
    }

    public function cancel(): RedirectResponse
    {
        return redirect('/')
            ->with('error', 'Paiement annule. Vous pouvez reessayer quand vous voulez.');
    }
}
