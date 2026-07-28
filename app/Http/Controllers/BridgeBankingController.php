<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\BridgeBankingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BridgeBankingController extends Controller
{
    public function __construct(
        private readonly BridgeBankingService $bridgeBanking,
    ) {}

    public function connect(Request $request): JsonResponse
    {
        if (! $this->bridgeBanking->configured()) {
            return response()->json([
                'message' => 'La connexion bancaire Bridge n est pas encore configuree.',
            ], 503);
        }

        $validated = $request->validate([
            'return_to' => ['nullable', 'string', 'in:dashboard,welcome'],
            'return_section' => ['nullable', 'string', 'max:64'],
        ]);

        session([
            'banking.return_to' => $validated['return_to'] ?? 'dashboard',
            'banking.return_section' => $validated['return_section'] ?? 'open-banking',
        ]);

        try {
            $session = $this->bridgeBanking->createConnectSession($request->user());

            return response()->json($session);
        } catch (\Throwable $exception) {
            $this->bridgeBanking->logSyncFailure($request->user(), $exception);

            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    public function callback(Request $request): RedirectResponse
    {
        $success = filter_var($request->query('success', true), FILTER_VALIDATE_BOOLEAN);

        if (! $success) {
            return $this->bankingRedirect($request, 'error', 'Connexion bancaire annulee ou incomplete.');
        }

        if (! $this->bridgeBanking->configured()) {
            return $this->bankingRedirect($request, 'error', 'Bridge n est pas configure.');
        }

        try {
            $result = $this->bridgeBanking->syncUserBanking($request->user());

            return $this->bankingRedirect(
                $request,
                'success',
                sprintf(
                    'Banque connectee via Bridge (%d compte, %d transactions synchronisees).',
                    $result['accounts'],
                    $result['transactions'],
                ),
            );
        } catch (\Throwable $exception) {
            $this->bridgeBanking->logSyncFailure($request->user(), $exception);

            return $this->bankingRedirect($request, 'error', $exception->getMessage());
        }
    }

    private function bankingRedirect(Request $request, string $flashKey, string $message): RedirectResponse
    {
        $returnTo = session()->pull('banking.return_to', 'dashboard');
        $returnSection = session()->pull('banking.return_section', 'open-banking');

        $baseUrl = match ($returnTo) {
            'welcome' => url('/'),
            default => route('dashboard'),
        };

        $fragment = preg_match('/^[a-z0-9_-]+$/i', (string) $returnSection) ? $returnSection : 'open-banking';

        return redirect("{$baseUrl}#{$fragment}")->with($flashKey, $message);
    }

    public function sync(Request $request): JsonResponse
    {
        if (! $this->bridgeBanking->configured()) {
            return response()->json([
                'message' => 'La connexion bancaire Bridge n est pas encore configuree.',
            ], 503);
        }

        try {
            $result = $this->bridgeBanking->syncUserBanking($request->user());

            return response()->json([
                'message' => 'Synchronisation Bridge terminee.',
                ...$result,
            ]);
        } catch (\Throwable $exception) {
            $this->bridgeBanking->logSyncFailure($request->user(), $exception);

            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
    }
}
