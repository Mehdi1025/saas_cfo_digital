<?php

namespace Database\Factories;

use App\Models\FinancialRecord;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FinancialRecord>
 */
class FinancialRecordFactory extends Factory
{
    protected $model = FinancialRecord::class;

    public function definition(): array
    {
        $revenue = fake()->numberBetween(8000, 18000);
        $charges = fake()->numberBetween(2500, 9000);
        $marketingBudget = fake()->numberBetween(700, 2500);
        $clientsCount = fake()->numberBetween(3, 12);

        return [
            'user_id' => User::factory(),
            'month' => fake()->date('Y-m'),
            'revenue' => $revenue,
            'charges' => min($charges, $revenue - 500),
            'marketing_budget' => $marketingBudget,
            'clients_count' => $clientsCount,
        ];
    }
}
