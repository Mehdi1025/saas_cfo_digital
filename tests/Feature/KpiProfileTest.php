<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KpiProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_save_kpi_profile_on_first_dashboard_visit(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('dashboard.kpi-profile'), [
            'profile' => 'btp',
            'preferences' => [
                'enabled_secondary' => ['dso', 'bfr'],
            ],
        ]);

        $response->assertRedirect();
        $user->refresh();

        $this->assertSame('btp', $user->kpi_profile);
        $this->assertSame(['dso', 'bfr'], $user->kpi_preferences['enabled_secondary']);
        $this->assertNotNull($user->kpi_onboarding_completed_at);
    }

    public function test_kpi_profile_requires_valid_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('dashboard.kpi-profile'), [
                'profile' => 'invalid-profile',
            ])
            ->assertSessionHasErrors('profile');
    }

    public function test_dashboard_shares_kpi_onboarding_state(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('auth.user.needs_kpi_onboarding', true)
            );
    }
}
