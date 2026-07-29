<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Tier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_client_and_see_it_in_index(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'stripe_status' => 'active',
        ]);

        $response = $this->actingAs($user)->post(route('clients.store'), [
            'name' => 'Acme Corp',
            'email' => 'contact@acme.test',
            'type' => 'client',
            'address' => '10 rue Test, 75001 Paris',
            'country_code' => 'FR',
            'registration_number' => '12345678901234',
            'vat_number' => 'FR12345678901',
        ]);

        $response->assertRedirect(route('clients.index', [
            'search' => 'Acme Corp',
            'created' => Tier::query()->where('name', 'Acme Corp')->value('id'),
        ]));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('tiers', [
            'name' => 'Acme Corp',
            'user_id' => $user->id,
        ]);

        $index = $this->actingAs($user)->get(route('clients.index'));
        $index->assertOk();
        $index->assertInertia(fn ($page) => $page
            ->component('FinFlow/Clients/Index')
            ->has('clients.data', 1)
            ->where('clients.data.0.name', 'Acme Corp')
            ->where('stats.total_clients', 1));
    }

    public function test_client_without_user_id_is_not_visible_to_authenticated_user(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'stripe_status' => 'active',
        ]);

        Tier::query()->withoutGlobalScopes()->create([
            'name' => 'Orphan Client',
            'type' => 'client',
            'user_id' => null,
        ]);

        $index = $this->actingAs($user)->get(route('clients.index'));
        $index->assertInertia(fn ($page) => $page
            ->component('FinFlow/Clients/Index')
            ->where('stats.total_clients', 0));
    }
}
