<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

trait HandlesPostAuthRedirect
{
    protected function storeAuthIntent(Request $request): void
    {
        $intent = $this->authIntentFromRequest($request);

        if ($intent !== null) {
            session(['auth.intent' => $intent]);
        }

        if ($intent === 'subscribe') {
            session(['url.intended' => route('billing.checkout.start', absolute: false)]);

            return;
        }

        $redirect = $this->authRedirectPath($request);

        if ($redirect === null) {
            return;
        }

        session(['url.intended' => $this->resolveAuthRedirectUrl($request, $redirect)]);
    }

    protected function authRedirectPath(Request $request): ?string
    {
        $redirect = $request->input('redirect', $request->query('redirect'));

        if (! is_string($redirect) || $redirect === '') {
            return null;
        }

        return $redirect;
    }

    protected function authIntentFromRequest(Request $request): ?string
    {
        $intent = $request->input('intent', $request->query('intent'));

        return is_string($intent) && $intent !== '' ? $intent : null;
    }

    protected function authIntent(Request $request): ?string
    {
        $intent = $this->authIntentFromRequest($request);

        if ($intent !== null) {
            return $intent;
        }

        $sessionIntent = $request->session()->get('auth.intent');

        return is_string($sessionIntent) && $sessionIntent !== '' ? $sessionIntent : null;
    }

    protected function resolveAuthRedirectUrl(Request $request, ?string $redirect = null): string
    {
        $redirect = (string) ($redirect ?? $this->authRedirectPath($request) ?? '/');

        if (! str_starts_with($redirect, '/') || str_starts_with($redirect, '//')) {
            $redirect = '/';
        }

        return $redirect;
    }

    protected function redirectAfterAuthentication(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($this->authIntent($request) === 'subscribe') {
            $request->session()->forget('auth.intent');

            if ($user->role === 'admin') {
                return redirect()->route('admin.dashboard');
            }

            if (in_array($user->stripe_status, ['active', 'trialing'], true)) {
                return redirect()->route('dashboard');
            }

            return redirect()->route('billing.checkout.start');
        }

        if ($this->authRedirectPath($request) !== null) {
            $this->storeAuthIntent($request);
        }

        if ($user->role === 'admin') {
            return redirect()->intended(route('admin.dashboard', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * @return array{redirect: string|null, intent: string|null}
     */
    protected function authRedirectProps(Request $request): array
    {
        return [
            'redirect' => $request->query('redirect'),
            'intent' => $request->query('intent'),
        ];
    }
}
