<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'avatar',
        'bridge_user_uuid',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'powens_access_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'suspended_at' => 'datetime',
            'kpi_preferences' => 'array',
            'kpi_onboarding_completed_at' => 'datetime',
            'powens_access_token' => 'encrypted',
            'powens_id_user' => 'integer',
        ];
    }

    public function financialRecords(): HasMany
    {
        return $this->hasMany(FinancialRecord::class);
    }

    public function facturesFournisseurs(): HasMany
    {
        return $this->hasMany(FactureFournisseur::class);
    }

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(BankAccount::class);
    }

    public function hasActiveSubscription(): bool
    {
        return $this->suspended_at === null
            && in_array($this->stripe_status, ['active', 'trialing'], true);
    }

    public function subscriptionPlanLabel(): string
    {
        return match ($this->stripe_status) {
            'active', 'trialing' => 'Abonnement actif',
            'canceled' => 'Abonnement annule',
            default => 'Aucun abonnement actif',
        };
    }

    public function needsKpiOnboarding(): bool
    {
        return $this->kpi_onboarding_completed_at === null;
    }
}
