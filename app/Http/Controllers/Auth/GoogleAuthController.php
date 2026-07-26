<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->googleIsConfigured()) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'La connexion Google n est pas encore configuree sur cet environnement.']);
        }

        return $this->googleDriver()
            ->scopes(['openid', 'email', 'profile'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        if (! $this->googleIsConfigured()) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'La connexion Google n est pas encore configuree sur cet environnement.']);
        }

        if ($request->filled('error')) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'La connexion Google a ete annulee.']);
        }

        try {
            $googleUser = $this->googleDriver()->user();
        } catch (\Throwable) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Impossible de finaliser la connexion Google pour le moment.']);
        }

        $email = strtolower(trim((string) $googleUser->getEmail()));

        if ($email === '' || ! data_get($googleUser->user, 'email_verified', false)) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Le compte Google doit avoir un e-mail vérifié.']);
        }

        $googleId = (string) $googleUser->getId();
        $name = (string) ($googleUser->getName() ?: 'Utilisateur Google');
        $avatar = (string) ($googleUser->getAvatar() ?: '');

        $user = User::query()
            ->where('google_id', $googleId)
            ->orWhere('email', $email)
            ->first();

        if (! $user) {
            $user = new User([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(32)),
                'google_id' => $googleId,
                'avatar' => $avatar,
            ]);
        }

        $user->forceFill([
            'name' => $user->name ?: $name,
            'google_id' => $googleId,
            'avatar' => $avatar,
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        Auth::login($user, true);
        $request->session()->regenerate();

        if ($user->role === 'admin') {
            return redirect()->intended(route('admin.dashboard', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    protected function googleIsConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'));
    }

    protected function googleDriver()
    {
        return Socialite::driver('google');
    }
}
