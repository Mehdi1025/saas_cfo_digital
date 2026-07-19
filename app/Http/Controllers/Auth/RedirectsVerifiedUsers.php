<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

trait RedirectsVerifiedUsers
{
    protected function redirectVerifiedUser(User $user): RedirectResponse
    {
        if ($user->role === 'admin') {
            return redirect()->route('admin.dashboard')
                ->with('success', 'E-mail confirme. Bienvenue !');
        }

        if (in_array($user->stripe_status, ['active', 'trialing'], true)) {
            return redirect()->route('dashboard')
                ->with('success', 'E-mail confirme. Bienvenue !');
        }

        return redirect()->route('verification.complete');
    }

    protected function loginVerifiedUser(User $user): void
    {
        Auth::login($user, remember: true);
        request()->session()->regenerate();
    }
}
