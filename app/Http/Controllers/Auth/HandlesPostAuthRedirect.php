<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

trait HandlesPostAuthRedirect
{
    protected function storeAuthIntent(Request $request): void
    {
        if (! $request->filled('redirect')) {
            return;
        }

        session(['url.intended' => $this->resolveAuthRedirectUrl($request)]);
    }

    protected function resolveAuthRedirectUrl(Request $request): string
    {
        $redirect = (string) $request->query('redirect', '/');

        if (! str_starts_with($redirect, '/') || str_starts_with($redirect, '//')) {
            $redirect = '/';
        }

        if ($request->query('intent') === 'subscribe' && ! str_contains($redirect, 'subscribe=1')) {
            $separator = str_contains($redirect, '?') ? '&' : '?';
            $redirect .= $separator.'subscribe=1';
        }

        return $redirect;
    }

    protected function redirectAfterAuthentication(Request $request): RedirectResponse
    {
        $user = $request->user();

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
