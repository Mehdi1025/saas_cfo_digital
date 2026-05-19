<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->googleIsConfigured()) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'La connexion Google n est pas encore configuree sur cet environnement.']);
        }

        $state = Str::random(40);

        $request->session()->put('google_oauth_state', $state);

        $query = http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => config('services.google.redirect'),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'access_type' => 'offline',
            'prompt' => 'select_account',
        ]);

        return redirect()->away('https://accounts.google.com/o/oauth2/v2/auth?'.$query);
    }

    public function callback(Request $request): RedirectResponse
    {
        if (! $this->googleIsConfigured()) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'La connexion Google n est pas encore configuree sur cet environnement.']);
        }

        $expectedState = (string) $request->session()->pull('google_oauth_state');
        $currentState = (string) $request->string('state');

        if ($expectedState === '' || ! hash_equals($expectedState, $currentState)) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'La verification Google a echoue. Merci de reessayer.']);
        }

        if ($request->filled('error')) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'La connexion Google a ete annulee.']);
        }

        $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'code' => $request->string('code')->value(),
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => config('services.google.redirect'),
            'grant_type' => 'authorization_code',
        ]);

        if (! $tokenResponse->successful()) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Impossible de finaliser la connexion Google pour le moment.']);
        }

        $accessToken = data_get($tokenResponse->json(), 'access_token');

        if (! is_string($accessToken) || $accessToken === '') {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'La reponse Google est incomplete. Merci de reessayer.']);
        }

        $profileResponse = Http::withToken($accessToken)
            ->get('https://openidconnect.googleapis.com/v1/userinfo');

        if (! $profileResponse->successful()) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Impossible de recuperer le profil Google.']);
        }

        $googleUser = $profileResponse->json();
        $email = strtolower(trim((string) data_get($googleUser, 'email', '')));

        if ($email === '' || ! data_get($googleUser, 'email_verified', false)) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Le compte Google doit avoir un email verifie.']);
        }

        $user = User::query()
            ->where('google_id', data_get($googleUser, 'sub'))
            ->orWhere('email', $email)
            ->first();

        if (! $user) {
            $user = new User([
                'name' => (string) data_get($googleUser, 'name', 'Utilisateur Google'),
                'email' => $email,
                'password' => Hash::make(Str::random(32)),
                'google_id' => (string) data_get($googleUser, 'sub', ''),
                'avatar' => (string) data_get($googleUser, 'picture', ''),
            ]);
        }

        $user->forceFill([
            'name' => $user->name ?: (string) data_get($googleUser, 'name', 'Utilisateur Google'),
            'google_id' => (string) data_get($googleUser, 'sub', ''),
            'avatar' => (string) data_get($googleUser, 'picture', ''),
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        Auth::login($user, true);
        $request->session()->regenerate();

        if ($user->role === 'admin') {
            return redirect()->intended(route('admin.dashboard', absolute: false));
        }

        if ($user->suspended_at === null && in_array($user->stripe_status, ['active', 'trialing'], true)) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        return redirect()->intended('/');
    }

    protected function googleIsConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'));
    }
}
