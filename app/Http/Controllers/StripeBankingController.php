<?php

namespace App\Http\Controllers;

use App\Services\StripeFinancialConnectionsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StripeBankingController extends Controller
{
    public function __construct(
        private readonly StripeFinancialConnectionsService $stripeBanking,
    ) {}

    public function createSession(Request $request): JsonResponse
    {
        if (! $this->stripeBanking->isConfigured()) {
            return response()->json([
                'message' => 'La connexion bancaire Stripe n est pas configuree.',
            ], 503);
        }

        try {
            $session = $this->stripeBanking->createSession($request->user());

            return response()->json([
                'session_id' => $session['session_id'],
                'client_secret' => $session['client_secret'],
                'publishable_key' => config('services.stripe.key'),
            ]);
        } catch (\Throwable $exception) {
            Log::warning('Stripe Financial Connections session failed.', [
                'user_id' => $request->user()->id,
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    public function complete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['required', 'string', 'max:255'],
        ]);

        if (! $this->stripeBanking->isConfigured()) {
            return response()->json([
                'message' => 'La connexion bancaire Stripe n est pas configuree.',
            ], 503);
        }

        try {
            $result = $this->stripeBanking->syncSession(
                $request->user(),
                $validated['session_id'],
            );

            return response()->json([
                'message' => 'Compte bancaire connecte via Stripe.',
                'accounts' => $result['accounts'],
                'transactions' => $result['transactions'],
            ]);
        } catch (\Throwable $exception) {
            Log::warning('Stripe Financial Connections sync failed.', [
                'user_id' => $request->user()->id,
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Synchronisation bancaire impossible pour le moment.',
            ], 422);
        }
    }
}
