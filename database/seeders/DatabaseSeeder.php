<?php

namespace Database\Seeders;

use App\Models\AiInsight;
use App\Models\FinancialRecord;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    private const DEMO_PASSWORD = 'password';

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = $this->createUser(
            [
                'name' => 'Admin Copifi',
                'email' => 'admin@copifi.test',
            ],
            [
                'role' => 'admin',
                'stripe_status' => 'inactive',
            ],
        );

        $this->seedFinancialRecords($admin, [
            ['month' => '2026-06', 'revenue' => 0, 'charges' => 0, 'marketing_budget' => 0, 'clients_count' => 0],
            ['month' => '2026-07', 'revenue' => 0, 'charges' => 0, 'marketing_budget' => 0, 'clients_count' => 0],
        ]);

        $clientDemo = $this->createUser(
            [
                'name' => 'Sophie Martin',
                'email' => 'client@copifi.test',
            ],
            $this->activeSubscriptionAttributes('cus_copifi_demo', 'sub_copifi_demo'),
        );

        $marie = $this->createUser(
            [
                'name' => 'Marie Dupont',
                'email' => 'marie@copifi.test',
            ],
            $this->activeSubscriptionAttributes('cus_copifi_marie', 'sub_copifi_marie'),
        );

        $thomas = $this->createUser(
            [
                'name' => 'Thomas Bernard',
                'email' => 'thomas@copifi.test',
            ],
            $this->activeSubscriptionAttributes('cus_copifi_thomas', 'sub_copifi_thomas'),
        );

        $emptyStateUser = $this->createUser(
            [
                'name' => 'Lucas Vide',
                'email' => 'empty@copifi.test',
            ],
            $this->activeSubscriptionAttributes('cus_copifi_empty', 'sub_copifi_empty'),
        );

        $this->createUser(
            [
                'name' => 'Client Suspendu',
                'email' => 'suspendu@copifi.test',
            ],
            [
                'role' => 'user',
                'stripe_status' => 'past_due',
                'suspended_at' => now(),
            ],
        );

        $this->seedFinancialRecords($clientDemo, [
            ['month' => '2026-01', 'revenue' => 9500, 'charges' => 4200, 'marketing_budget' => 900, 'clients_count' => 4],
            ['month' => '2026-02', 'revenue' => 10800, 'charges' => 4600, 'marketing_budget' => 1100, 'clients_count' => 5],
            ['month' => '2026-03', 'revenue' => 9900, 'charges' => 5100, 'marketing_budget' => 1200, 'clients_count' => 4],
            ['month' => '2026-04', 'revenue' => 13200, 'charges' => 5700, 'marketing_budget' => 1300, 'clients_count' => 6],
            ['month' => '2026-05', 'revenue' => 14100, 'charges' => 6200, 'marketing_budget' => 1500, 'clients_count' => 7],
            ['month' => '2026-06', 'revenue' => 15600, 'charges' => 6400, 'marketing_budget' => 1600, 'clients_count' => 8],
            ['month' => '2026-07', 'revenue' => 17200, 'charges' => 6800, 'marketing_budget' => 1750, 'clients_count' => 9],
        ]);

        $this->seedFinancialRecords($marie, [
            ['month' => '2026-03', 'revenue' => 6200, 'charges' => 2800, 'marketing_budget' => 600, 'clients_count' => 3],
            ['month' => '2026-04', 'revenue' => 7100, 'charges' => 3100, 'marketing_budget' => 700, 'clients_count' => 4],
            ['month' => '2026-05', 'revenue' => 7800, 'charges' => 3300, 'marketing_budget' => 750, 'clients_count' => 4],
            ['month' => '2026-06', 'revenue' => 8400, 'charges' => 3500, 'marketing_budget' => 800, 'clients_count' => 5],
            ['month' => '2026-07', 'revenue' => 9100, 'charges' => 3600, 'marketing_budget' => 850, 'clients_count' => 6],
        ]);

        $this->seedFinancialRecords($thomas, [
            ['month' => '2026-04', 'revenue' => 11800, 'charges' => 5200, 'marketing_budget' => 1400, 'clients_count' => 5],
            ['month' => '2026-05', 'revenue' => 12500, 'charges' => 5400, 'marketing_budget' => 1500, 'clients_count' => 6],
            ['month' => '2026-06', 'revenue' => 13100, 'charges' => 5600, 'marketing_budget' => 1550, 'clients_count' => 6],
            ['month' => '2026-07', 'revenue' => 14800, 'charges' => 5900, 'marketing_budget' => 1600, 'clients_count' => 7],
        ]);

        $this->seedAiInsight($clientDemo, '2026-07');
        $this->seedAiInsight($marie, '2026-07');
        $this->seedAiInsight($thomas, '2026-07');

        $this->call(FacturationDemoSeeder::class);

        $this->printCredentials();
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @param  array<string, mixed>  $extra
     */
    private function createUser(array $attributes, array $extra = []): User
    {
        $user = User::factory()->create(array_merge([
            'password' => self::DEMO_PASSWORD,
            'email_verified_at' => now(),
        ], $attributes));

        if ($extra !== []) {
            $user->forceFill($extra)->save();
        }

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function activeSubscriptionAttributes(string $customerId, string $subscriptionId): array
    {
        return [
            'role' => 'user',
            'stripe_status' => 'active',
            'stripe_customer_id' => $customerId,
            'stripe_subscription_id' => $subscriptionId,
            'stripe_price_id' => 'price_demo_mensuel',
            'subscription_amount' => 49.90,
            'subscription_currency' => 'eur',
        ];
    }

    /**
     * @param  list<array<string, int|string|float>>  $records
     */
    private function seedFinancialRecords(User $user, array $records): void
    {
        foreach ($records as $record) {
            FinancialRecord::query()->create([
                'user_id' => $user->id,
                'month' => $record['month'],
                'revenue' => $record['revenue'],
                'charges' => $record['charges'],
                'marketing_budget' => $record['marketing_budget'],
                'clients_count' => $record['clients_count'],
            ]);
        }
    }

    private function seedAiInsight(User $user, string $month): void
    {
        AiInsight::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'month' => $month,
            ],
            [
                'generated_content' => <<<TEXT
**Synthèse du mois {$month}**

Votre marge reste positive et votre base clients progresse. Le ratio charges / CA reste sous contrôle.

**Points d'attention**
- Surveiller le poste marketing si vous accélérez l'acquisition.
- Consolider le suivi des encaissements sur les factures envoyées.

**Recommandation**
Priorisez la conversion des devis en attente et le relance des factures proches de l'échéance.
TEXT,
                'edited_content' => null,
                'edited_by_admin_id' => null,
                'edited_at' => null,
            ],
        );
    }

    private function printCredentials(): void
    {
        $lines = [
            '',
            '=== Comptes demo Copifi (mot de passe : password) ===',
            'Admin        admin@copifi.test',
            'Utilisateur  client@copifi.test',
            'Utilisateur  marie@copifi.test',
            'Utilisateur  thomas@copifi.test',
            'Vide (KPI)   empty@copifi.test',
            'Suspendu     suspendu@copifi.test',
            '===================================================',
            '',
        ];

        foreach ($lines as $line) {
            $this->command?->info($line);
        }
    }
}
