<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationCheckController extends Controller
{
    use RedirectsVerifiedUsers;

    /**
     * Bouton « J'ai confirme mon e-mail » sur la page d'attente.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user()->fresh();

        if (! $user->hasVerifiedEmail()) {
            return back()->with('status', 'not-verified-yet');
        }

        $this->loginVerifiedUser($user);

        return $this->redirectVerifiedUser($user);
    }
}
