<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscribeAuthRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_subscribe_intent_stores_checkout_redirect_on_register_page(): void
    {
        $response = $this->get('/register?redirect=/&intent=subscribe');

        $response->assertOk();
        $this->assertSame(route('billing.checkout.start', absolute: false), session('url.intended'));
        $this->assertSame('subscribe', session('auth.intent'));
    }

    public function test_registration_with_subscribe_intent_redirects_to_checkout(): void
    {
        $this->get('/register?redirect=/&intent=subscribe');

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password1',
            'password_confirmation' => 'password1',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('billing.checkout.start', absolute: false));
    }

    public function test_registration_with_subscribe_intent_in_post_body_redirects_to_checkout(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password1',
            'password_confirmation' => 'password1',
            'redirect' => '/',
            'intent' => 'subscribe',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('billing.checkout.start', absolute: false));
    }

    public function test_login_with_subscribe_intent_redirects_to_checkout(): void
    {
        $user = User::factory()->create();

        $this->get('/login?redirect=/&intent=subscribe');

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('billing.checkout.start', absolute: false));
    }

    public function test_authenticated_users_can_view_landing_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/')
            ->assertOk();
    }
}
