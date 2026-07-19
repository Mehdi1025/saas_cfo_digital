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

        if (
            filled(config('services.stripe.secret'))
            && filled(config('services.stripe.price_id'))
        ) {
            return redirect()->route('billing.checkout.start')
                ->with('success', 'E-mail confirme. Finalisez votre abonnement pour acceder a Copifi.');
        }

        return redirect('/')
            ->with('success', 'E-mail confirme. Vous etes connecte a Copifi.');
    }

    protected function loginVerifiedUser(User $user): void
    {
        Auth::login($user, remember: true);
        request()->session()->regenerate();
    }
}
