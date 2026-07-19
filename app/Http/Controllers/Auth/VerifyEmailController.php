<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller
{
    use RedirectsVerifiedUsers;

    /**
     * Valide le lien signe, confirme l'e-mail et connecte l'utilisateur.
     */
    public function __invoke(Request $request, string $id, string $hash): RedirectResponse
    {
        $user = User::query()->find($id);

        if ($user === null) {
            return redirect()
                ->route('login')
                ->with('error', 'Ce lien de confirmation est invalide ou expire. Connectez-vous pour en recevoir un nouveau.');
        }

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            abort(403);
        }

        if (! $request->hasValidSignature()) {
            return redirect()
                ->route('login')
                ->with('error', 'Ce lien de confirmation a expire. Connectez-vous pour en recevoir un nouveau.');
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        $this->loginVerifiedUser($user->fresh());

        return $this->redirectVerifiedUser($user->fresh());
    }
}
