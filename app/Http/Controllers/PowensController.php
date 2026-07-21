<?php

namespace App\Http\Controllers;

use App\Services\PowensService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class PowensController extends Controller
{
    public function __construct(private PowensService $powens)
    {
    }

    /**
     * Redirige l'utilisateur vers la Webview Powens Connect (OAuth2 / DSP2).
     */
    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->powens->isConfigured()) {
            return redirect()
                ->route('dashboard')
                ->with('error', 'La connexion bancaire Powens n est pas encore configuree.');
        }

        $user = $request->user();

        try {
            $tokenPayload = $this->powens->ensurePermanentUserToken($user);
            $temporaryCode = $this->powens->createTemporaryCode($tokenPayload['access_token']);
            $webviewUrl = $this->powens->buildConnectWebviewUrl($temporaryCode);

            return redirect()->away($webviewUrl);
        } catch (Throwable $exception) {
            Log::warning('Powens connect redirect failed.', [
                'user_id' => $user->id,
                'message' => $exception->getMessage(),
            ]);

            return redirect()
                ->route('dashboard')
                ->with('error', 'Impossible d ouvrir la connexion bancaire pour le moment.');
        }
    }

    /**
     * Callback Powens après la Webview — échange éventuel du code et retour dashboard.
     */
    public function callback(Request $request): RedirectResponse
    {
        if ($request->filled('error')) {
            $description = (string) $request->query('error_description', 'Connexion bancaire annulee.');

            return redirect()
                ->route('dashboard')
                ->with('error', $description);
        }

        $user = $request->user();

        if (! $user) {
            return redirect()
                ->route('login')
                ->with('error', 'Veuillez vous reconnecter pour finaliser la liaison bancaire.');
        }

        try {
            if ($request->filled('code')) {
                $exchange = $this->powens->exchangeAuthorizationCode((string) $request->query('code'));

                $user->forceFill([
                    'powens_access_token' => $exchange['access_token'],
                ])->save();
            }

            $connectionId = $request->query('connection_id');

            return redirect()
                ->route('dashboard')
                ->with('success', $connectionId
                    ? 'Banque connectee avec succes. Synchronisation des comptes en cours.'
                    : 'Connexion Powens finalisee avec succes.');
        } catch (Throwable $exception) {
            Log::warning('Powens callback failed.', [
                'user_id' => $user->id,
                'message' => $exception->getMessage(),
            ]);

            return redirect()
                ->route('dashboard')
                ->with('error', 'La finalisation de la connexion bancaire a echoue.');
        }
    }
}
