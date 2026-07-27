<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class StripeBankingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.stripe.key' => 'pk_test_example',
            'services.stripe.secret' => 'sk_test_example',
        ]);
    }

    public function test_authenticated_user_can_create_stripe_banking_session(): void
    {
        Http::fake([
            'https://api.stripe.com/v1/customers' => Http::response([
                'id' => 'cus_test_123',
            ], 200),
            'https://api.stripe.com/v1/financial_connections/sessions' => Http::response([
                'id' => 'fcsess_test_123',
                'client_secret' => 'fcsess_secret_test_123',
            ], 200),
        ]);

        $user = User::factory()->create([
            'stripe_status' => 'active',
        ]);

        $response = $this->actingAs($user)->postJson(route('banking.stripe.session'));

        $response
            ->assertOk()
            ->assertJsonPath('session_id', 'fcsess_test_123')
            ->assertJsonPath('client_secret', 'fcsess_secret_test_123')
            ->assertJsonPath('publishable_key', 'pk_test_example');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'stripe_customer_id' => 'cus_test_123',
        ]);
    }

    public function test_authenticated_user_can_complete_stripe_banking_sync(): void
    {
        Http::fake([
            'https://api.stripe.com/v1/financial_connections/sessions/fcsess_test_123' => Http::response([
                'id' => 'fcsess_test_123',
                'account_holder' => ['customer' => 'cus_test_123'],
                'accounts' => ['fca_test_123'],
            ], 200),
            'https://api.stripe.com/v1/financial_connections/accounts/fca_test_123/refresh' => Http::response([
                'id' => 'fca_test_123',
            ], 200),
            'https://api.stripe.com/v1/financial_connections/accounts/fca_test_123' => Http::response([
                'id' => 'fca_test_123',
                'institution_name' => 'Banque Demo',
                'last4' => '4242',
                'subcategory' => 'checking',
                'balance' => [
                    'cash' => [
                        'available' => [
                            'amount' => 125000,
                            'currency' => 'eur',
                        ],
                    ],
                ],
            ], 200),
            'https://api.stripe.com/v1/financial_connections/transactions*' => Http::response([
                'data' => [
                    [
                        'id' => 'fctxn_test_123',
                        'amount' => -4500,
                        'description' => 'Paiement fournisseur',
                        'status' => 'posted',
                        'transacted_at' => now()->timestamp,
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create([
            'stripe_status' => 'active',
            'stripe_customer_id' => 'cus_test_123',
        ]);

        $response = $this->actingAs($user)->postJson(route('banking.stripe.complete'), [
            'session_id' => 'fcsess_test_123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('accounts', 1)
            ->assertJsonPath('transactions', 1);

        $this->assertDatabaseHas('bank_accounts', [
            'user_id' => $user->id,
            'stripe_fc_account_id' => 'fca_test_123',
            'bank_name' => 'Banque Demo',
        ]);
    }
}
