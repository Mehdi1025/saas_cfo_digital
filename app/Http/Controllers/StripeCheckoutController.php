<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class StripeCheckoutController extends Controller
{
    public function store(Request $request): Response
    {
        $user = $request->user();
        $stripeSecret = config('services.stripe.secret');
        $priceId = config('services.stripe.price_id');

        if (! $stripeSecret || ! $priceId) {
            return redirect()
                ->route('profile.edit')
                ->with('error', 'Configuration Stripe manquante. Contactez le support.');
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
            return redirect()
                ->route('profile.edit')
                ->with('error', 'Impossible de demarrer le paiement Stripe.');
        }

        return Inertia::location($response->json('url'));
    }

    public function success(Request $request): RedirectResponse
    {
        return redirect()
            ->to(route('profile.edit').'#subscription')
            ->with('success', 'Paiement termine. Votre abonnement sera active sous peu.');
    }

    public function cancel(): RedirectResponse
    {
        return redirect()
            ->to(route('profile.edit').'#subscription')
            ->with('error', 'Paiement annule. Vous pouvez reessayer quand vous le souhaitez.');
    }
}
