<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    use RedirectsVerifiedUsers;

    public function __invoke(Request $request): RedirectResponse|Response
    {
        $user = $request->user()->fresh();

        if ($user->hasVerifiedEmail()) {
            $this->loginVerifiedUser($user);

            return $this->redirectVerifiedUser($user);
        }

        return Inertia::render('Auth/VerifyEmail', [
            'status' => session('status'),
            'userEmail' => $user->email,
        ]);
    }
}
