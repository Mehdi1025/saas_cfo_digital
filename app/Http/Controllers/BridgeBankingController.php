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
            return redirect()
                ->route('dashboard')
                ->with('error', 'Connexion bancaire annulee ou incomplete.');
        }

        if (! $this->bridgeBanking->configured()) {
            return redirect()
                ->route('dashboard')
                ->with('error', 'Bridge n est pas configure.');
        }

        try {
            $result = $this->bridgeBanking->syncUserBanking($request->user());

            return redirect()
                ->route('dashboard')
                ->with(
                    'success',
                    sprintf(
                        'Banque connectee via Bridge (%d compte, %d transactions synchronisees).',
                        $result['accounts'],
                        $result['transactions'],
                    ),
                );
        } catch (\Throwable $exception) {
            $this->bridgeBanking->logSyncFailure($request->user(), $exception);

            return redirect()
                ->route('dashboard')
                ->with('error', $exception->getMessage());
        }
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
