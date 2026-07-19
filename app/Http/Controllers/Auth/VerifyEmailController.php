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
     * Valide le lien signe, confirme l'e-mail et connecte l'utilisateur
     * (meme si la session a ete perdue sur mobile).
     */
    public function __invoke(Request $request, string $id, string $hash): RedirectResponse
    {
        $user = User::query()->findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            abort(403);
        }

        if (! $request->hasValidSignature()) {
            abort(403);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        $this->loginVerifiedUser($user->fresh());

        return $this->redirectVerifiedUser($user->fresh());
    }
}
