<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    use RedirectsVerifiedUsers;

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user()->fresh();

        if ($user->hasVerifiedEmail()) {
            $this->loginVerifiedUser($user);

            return $this->redirectVerifiedUser($user);
        }

        $user->sendEmailVerificationNotification();

        return redirect()
            ->route('verification.notice')
            ->with('status', 'verification-link-sent');
    }
}
