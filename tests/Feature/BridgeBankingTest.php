<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BridgeBankingTest extends TestCase
{
    use RefreshDatabase;

    private const BASE_URL = 'https://api.bridgeapi.io/v3';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.bridge.client_id' => 'bridge_client_test',
            'services.bridge.client_secret' => 'bridge_secret_test',
            'services.bridge.base_url' => self::BASE_URL,
        ]);
    }

    public function test_authenticated_user_can_start_bridge_connect_session(): void
    {
        Http::fake([
            self::BASE_URL.'/aggregation/users' => Http::response([
                'uuid' => 'bridge-user-uuid-1',
            ], 200),
            self::BASE_URL.'/aggregation/authorization/token' => Http::response([
                'access_token' => 'bridge-access-token',
                'expires_at' => now()->addHour()->toIso8601String(),
                'user' => ['uuid' => 'bridge-user-uuid-1'],
            ], 200),
            self::BASE_URL.'/aggregation/connect-sessions' => Http::response([
                'id' => 'connect-session-1',
                'url' => 'https://connect.bridgeapi.io/session/demo',
            ], 200),
        ]);

        $user = User::factory()->create([
            'stripe_status' => 'active',
        ]);

        $response = $this->actingAs($user)->postJson(route('banking.bridge.connect'));

        $response
            ->assertOk()
            ->assertJsonPath('session_id', 'connect-session-1')
            ->assertJsonPath('url', 'https://connect.bridgeapi.io/session/demo');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'bridge_user_uuid' => 'bridge-user-uuid-1',
        ]);
    }

    public function test_authenticated_user_can_sync_all_bridge_accounts(): void
    {
        Http::fake([
            self::BASE_URL.'/aggregation/users' => Http::response([
                'uuid' => 'bridge-user-uuid-2',
            ], 200),
            self::BASE_URL.'/aggregation/authorization/token' => Http::response([
                'access_token' => 'bridge-access-token',
                'expires_at' => now()->addHour()->toIso8601String(),
                'user' => ['uuid' => 'bridge-user-uuid-2'],
            ], 200),
            self::BASE_URL.'/aggregation/accounts*' => Http::response([
                'resources' => [
                    [
                        'id' => 12345,
                        'item_id' => 99,
                        'name' => 'Compte courant Demo',
                        'type' => 'checking',
                        'data_access' => 'enabled',
                        'balance' => 1250.50,
                        'iban' => 'FR7612345678901234567890123',
                    ],
                    [
                        'id' => 12346,
                        'item_id' => 99,
                        'name' => 'Livret Demo',
                        'type' => 'savings',
                        'data_access' => 'enabled',
                        'balance' => 5000,
                    ],
                    [
                        'id' => 12347,
                        'item_id' => 99,
                        'name' => 'Carte Demo',
                        'type' => 'card',
                        'data_access' => 'enabled',
                        'balance' => -120.50,
                    ],
                ],
            ], 200),
            self::BASE_URL.'/aggregation/transactions*' => Http::response([
                'resources' => [
                    [
                        'id' => 'tx-1',
                        'account_id' => 12345,
                        'amount' => -94.00,
                        'clean_description' => 'Paiement CB',
                        'transaction_date' => now()->toDateString(),
                        'deleted' => false,
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create([
            'stripe_status' => 'active',
            'bridge_user_uuid' => 'bridge-user-uuid-2',
        ]);

        $response = $this->actingAs($user)->postJson(route('banking.bridge.sync'));

        $response
            ->assertOk()
            ->assertJsonPath('accounts', 3)
            ->assertJsonPath('transactions', 3);

        $this->assertDatabaseHas('bank_accounts', [
            'user_id' => $user->id,
            'bridge_account_id' => '12345',
            'bank_name' => 'Compte courant Demo',
        ]);

        $this->assertDatabaseHas('bank_accounts', [
            'user_id' => $user->id,
            'bridge_account_id' => '12346',
            'bank_name' => 'Livret Demo',
        ]);

        $this->assertDatabaseHas('bank_accounts', [
            'user_id' => $user->id,
            'bridge_account_id' => '12347',
            'bank_name' => 'Carte Demo',
        ]);

        $this->assertDatabaseHas('bank_transactions', [
            'bridge_transaction_id' => 'tx-1',
            'amount' => -94.00,
            'label' => 'Paiement CB',
        ]);
    }

    public function test_bridge_callback_redirects_with_success_message(): void
    {
        Http::fake([
            self::BASE_URL.'/aggregation/authorization/token' => Http::response([
                'access_token' => 'bridge-access-token',
                'expires_at' => now()->addHour()->toIso8601String(),
                'user' => ['uuid' => 'bridge-user-uuid-3'],
            ], 200),
            self::BASE_URL.'/aggregation/accounts*' => Http::response([
                'resources' => [
                    [
                        'id' => 54321,
                        'item_id' => 88,
                        'name' => 'Compte Demo Bank',
                        'type' => 'checking',
                        'data_access' => 'enabled',
                        'balance' => 500,
                    ],
                ],
            ], 200),
            self::BASE_URL.'/aggregation/transactions*' => Http::response([
                'resources' => [],
            ], 200),
        ]);

        $user = User::factory()->create([
            'stripe_status' => 'active',
            'bridge_user_uuid' => 'bridge-user-uuid-3',
        ]);

        $response = $this->actingAs($user)->withSession([
            'banking.return_to' => 'dashboard',
            'banking.return_section' => 'open-banking',
        ])->get(route('banking.bridge.callback', [
            'success' => 'true',
        ]));

        $response
            ->assertRedirect(route('dashboard').'#open-banking')
            ->assertSessionHas('success');

        $this->assertDatabaseHas('bank_accounts', [
            'user_id' => $user->id,
            'bridge_account_id' => '54321',
        ]);
    }

    public function test_bridge_callback_can_redirect_to_landing_section(): void
    {
        Http::fake([
            self::BASE_URL.'/aggregation/authorization/token' => Http::response([
                'access_token' => 'bridge-access-token',
                'expires_at' => now()->addHour()->toIso8601String(),
                'user' => ['uuid' => 'bridge-user-uuid-4'],
            ], 200),
            self::BASE_URL.'/aggregation/accounts*' => Http::response([
                'resources' => [
                    [
                        'id' => 11111,
                        'item_id' => 77,
                        'name' => 'Compte Landing',
                        'type' => 'checking',
                        'data_access' => 'enabled',
                        'balance' => 1200,
                    ],
                ],
            ], 200),
            self::BASE_URL.'/aggregation/transactions*' => Http::response([
                'resources' => [],
            ], 200),
        ]);

        $user = User::factory()->create([
            'stripe_status' => 'active',
            'bridge_user_uuid' => 'bridge-user-uuid-4',
        ]);

        $response = $this->actingAs($user)->withSession([
            'banking.return_to' => 'welcome',
            'banking.return_section' => 'open-banking',
        ])->get(route('banking.bridge.callback', [
            'success' => 'true',
        ]));

        $response->assertRedirect(url('/').'#open-banking');
    }
}
