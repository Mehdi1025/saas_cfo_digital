<?php

namespace Database\Seeders;

use App\Models\FinancialRecord;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin Mini CFO',
            'email' => 'admin@minicfo.test',
            'role' => 'admin',
            'stripe_status' => 'inactive',
        ]);

        $activeUser = User::factory()->create([
            'name' => 'Client Demo',
            'email' => 'client@minicfo.test',
            'role' => 'user',
            'stripe_status' => 'active',
            'stripe_customer_id' => 'cus_demo_minicfo',
            'stripe_subscription_id' => 'sub_demo_minicfo',
            'stripe_price_id' => 'price_demo_mensuel',
            'subscription_amount' => 49.90,
            'subscription_currency' => 'eur',
        ]);

        $emptyStateUser = User::factory()->create([
            'name' => 'Client Sans Donnees',
            'email' => 'empty@minicfo.test',
            'role' => 'user',
            'stripe_status' => 'active',
            'stripe_customer_id' => 'cus_demo_empty',
            'stripe_subscription_id' => 'sub_demo_empty',
            'stripe_price_id' => 'price_demo_mensuel',
            'subscription_amount' => 49.90,
            'subscription_currency' => 'eur',
        ]);

        FinancialRecord::factory()
            ->count(6)
            ->for($activeUser)
            ->sequence(
                [
                    'month' => '2026-01',
                    'revenue' => 9500,
                    'charges' => 4200,
                    'marketing_budget' => 900,
                    'clients_count' => 4,
                ],
                [
                    'month' => '2026-02',
                    'revenue' => 10800,
                    'charges' => 4600,
                    'marketing_budget' => 1100,
                    'clients_count' => 5,
                ],
                [
                    'month' => '2026-03',
                    'revenue' => 9900,
                    'charges' => 5100,
                    'marketing_budget' => 1200,
                    'clients_count' => 4,
                ],
                [
                    'month' => '2026-04',
                    'revenue' => 13200,
                    'charges' => 5700,
                    'marketing_budget' => 1300,
                    'clients_count' => 6,
                ],
                [
                    'month' => '2026-05',
                    'revenue' => 14100,
                    'charges' => 6200,
                    'marketing_budget' => 1500,
                    'clients_count' => 7,
                ],
                [
                    'month' => '2026-06',
                    'revenue' => 15600,
                    'charges' => 6400,
                    'marketing_budget' => 1600,
                    'clients_count' => 8,
                ],
            )
            ->create();

        FinancialRecord::factory()
            ->count(2)
            ->for($admin)
            ->sequence(
                [
                    'month' => '2026-05',
                    'revenue' => 8000,
                    'charges' => 3000,
                    'marketing_budget' => 500,
                    'clients_count' => 3,
                ],
                [
                    'month' => '2026-06',
                    'revenue' => 8700,
                    'charges' => 3200,
                    'marketing_budget' => 600,
                    'clients_count' => 4,
                ],
            )
            ->create();

        User::factory()->create([
            'name' => 'Client Suspendu',
            'email' => 'suspendu@minicfo.test',
            'role' => 'user',
            'stripe_status' => 'past_due',
            'suspended_at' => now(),
        ]);
    }
}
