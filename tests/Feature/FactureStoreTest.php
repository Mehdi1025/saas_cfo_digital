<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Article;
use App\Models\CompanySetting;
use App\Models\Tier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FactureStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_service_invoice_without_destination(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'stripe_status' => 'active',
        ]);

        CompanySetting::query()->create([
            'user_id' => $user->id,
            'name' => 'Test SAS',
            'address' => '10 rue de Paris, 75001 Paris',
            'registration_number' => '91234567800012',
            'vat_number' => 'FR12345678901',
            'email' => 'billing@test.fr',
        ]);

        $client = Tier::query()->create([
            'user_id' => $user->id,
            'name' => 'Client Pro',
            'type' => 'client',
            'address' => '20 avenue Lyon, 69001 Lyon',
            'country_code' => 'FR',
            'registration_number' => '12345678901234',
            'vat_number' => 'FR98765432109',
            'email' => 'client@test.fr',
        ]);

        $article = Article::query()->create([
            'user_id' => $user->id,
            'designation' => 'Prestation conseil',
            'sku' => 'PREST-001',
            'type' => Article::TYPE_SERVICE,
            'operation_category' => Article::OPERATION_SERVICE,
            'price_ht' => 150.00,
            'price_type' => 'fixed',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->post(route('factures.store'), [
            'tiers_id' => $client->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'currency_code' => 'EUR',
            'type_prestation' => 'service',
            'operation_category' => 'service',
            'delivery_address' => '',
            'destination' => '',
            'jours_stockage' => 0,
            'vat_on_debits' => false,
            'financial_discount_percent' => 0,
            'lignes' => [
                [
                    'article_id' => $article->id,
                    'quantity' => 1,
                    'unit_price_ht' => 150,
                    'vat_rate' => 20,
                ],
            ],
        ]);

        $response->assertRedirect(route('factures.index'));
        $response->assertSessionHas('success');
    }
}
