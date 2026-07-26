<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\Provider as SocialiteProvider;
use Laravel\Socialite\Contracts\User as SocialiteUserContract;
use Laravel\Socialite\Facades\Socialite;
use Tests\TestCase;

class GoogleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_redirect_route_sends_user_to_google(): void
    {
        config()->set('services.google.client_id', 'client-id');
        config()->set('services.google.client_secret', 'client-secret');
        config()->set('services.google.redirect', 'http://127.0.0.1:8000/auth/google/callback');

        $provider = \Mockery::mock(SocialiteProvider::class);
        $provider->shouldReceive('scopes')
            ->once()
            ->with(['openid', 'email', 'profile'])
            ->andReturnSelf();
        $provider->shouldReceive('redirect')
            ->once()
            ->andReturn(redirect()->away('https://accounts.google.com/o/oauth2/v2/auth?state=test-state'));

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $response = $this->get(route('auth.google.redirect'));

        $response->assertRedirect('https://accounts.google.com/o/oauth2/v2/auth?state=test-state');
        $this->assertStringContainsString('accounts.google.com', $response->headers->get('Location'));
    }

    public function test_google_callback_creates_and_authenticates_a_user(): void
    {
        config()->set('services.google.client_id', 'client-id');
        config()->set('services.google.client_secret', 'client-secret');
        config()->set('services.google.redirect', 'http://127.0.0.1:8000/auth/google/callback');

        $socialiteUser = $this->fakeSocialiteUser(
            id: 'google-user-1',
            name: 'Client Google',
            email: 'client.google@example.com',
            avatar: 'https://example.com/avatar.png',
            raw: ['email_verified' => true],
        );

        $provider = \Mockery::mock(SocialiteProvider::class);
        $provider->shouldReceive('user')->once()->andReturn($socialiteUser);

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $response = $this
            ->get(route('auth.google.callback', [
                'code' => 'valid-code',
            ]));

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

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

        $socialiteUser = $this->fakeSocialiteUser(
            id: 'google-user-2',
            name: 'Existing User',
            email: 'existing@example.com',
            avatar: 'https://example.com/avatar-2.png',
            raw: ['email_verified' => true],
        );

        $provider = \Mockery::mock(SocialiteProvider::class);
        $provider->shouldReceive('user')->once()->andReturn($socialiteUser);

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $response = $this
            ->get(route('auth.google.callback', [
                'code' => 'valid-code',
            ]));

        $this->assertAuthenticatedAs($user->fresh());
        $response->assertRedirect(route('dashboard', absolute: false));

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'google_id' => 'google-user-2',
        ]);
    }

    protected function fakeSocialiteUser(
        string $id,
        string $name,
        string $email,
        string $avatar,
        array $raw = [],
    ): SocialiteUserContract {
        $user = \Mockery::mock(SocialiteUserContract::class);
        $user->shouldReceive('getId')->andReturn($id);
        $user->shouldReceive('getName')->andReturn($name);
        $user->shouldReceive('getEmail')->andReturn($email);
        $user->shouldReceive('getAvatar')->andReturn($avatar);
        $user->user = $raw;

        return $user;
    }
}
