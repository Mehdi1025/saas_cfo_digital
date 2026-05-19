<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_redirect_route_sends_user_to_google(): void
    {
        config()->set('services.google.client_id', 'client-id');
        config()->set('services.google.client_secret', 'client-secret');
        config()->set('services.google.redirect', 'http://127.0.0.1:8000/auth/google/callback');

        $response = $this->get(route('auth.google.redirect'));

        $response->assertRedirect();
        $this->assertStringContainsString('accounts.google.com', $response->headers->get('Location'));
        $this->assertNotNull(session('google_oauth_state'));
    }

    public function test_google_callback_creates_and_authenticates_a_user(): void
    {
        config()->set('services.google.client_id', 'client-id');
        config()->set('services.google.client_secret', 'client-secret');
        config()->set('services.google.redirect', 'http://127.0.0.1:8000/auth/google/callback');

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'access_token' => 'google-token',
            ]),
            'https://openidconnect.googleapis.com/v1/userinfo' => Http::response([
                'sub' => 'google-user-1',
                'name' => 'Client Google',
                'email' => 'client.google@example.com',
                'email_verified' => true,
                'picture' => 'https://example.com/avatar.png',
            ]),
        ]);

        $response = $this
            ->withSession(['google_oauth_state' => 'secure-state'])
            ->get(route('auth.google.callback', [
                'state' => 'secure-state',
                'code' => 'valid-code',
            ]));

        $this->assertAuthenticated();
        $response->assertRedirect('/');

        $this->assertDatabaseHas('users', [
            'email' => 'client.google@example.com',
            'google_id' => 'google-user-1',
        ]);
    }

    public function test_google_callback_links_an_existing_user_by_email(): void
    {
        config()->set('services.google.client_id', 'client-id');
        config()->set('services.google.client_secret', 'client-secret');
        config()->set('services.google.redirect', 'http://127.0.0.1:8000/auth/google/callback');

        $user = User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'access_token' => 'google-token',
            ]),
            'https://openidconnect.googleapis.com/v1/userinfo' => Http::response([
                'sub' => 'google-user-2',
                'name' => 'Existing User',
                'email' => 'existing@example.com',
                'email_verified' => true,
                'picture' => 'https://example.com/avatar-2.png',
            ]),
        ]);

        $response = $this
            ->withSession(['google_oauth_state' => 'secure-state'])
            ->get(route('auth.google.callback', [
                'state' => 'secure-state',
                'code' => 'valid-code',
            ]));

        $this->assertAuthenticatedAs($user->fresh());
        $response->assertRedirect('/');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'google_id' => 'google-user-2',
        ]);
    }
}
