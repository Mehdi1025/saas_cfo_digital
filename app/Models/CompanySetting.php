<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToAuthenticatedUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CompanySetting extends Model
{
    use BelongsToAuthenticatedUser;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'address',
        'registration_number',
        'vat_number',
        'email',
        'phone',
        'logo_path',
        'brand_color',
        'electronic_invoicing_active',
        'billing_mandate_accepted_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'electronic_invoicing_active' => 'boolean',
            'billing_mandate_accepted_at' => 'datetime',
        ];
    }

    public static function current(): self
    {
        $userId = auth()->id();

        return static::query()->firstOrCreate(
            ['user_id' => $userId],
            [
                'name' => (string) config('company.name'),
                'address' => (string) config('company.address'),
                'registration_number' => (string) config('company.registration_number', ''),
                'email' => (string) config('company.email'),
                'phone' => (string) config('company.phone', ''),
                'brand_color' => (string) config('company.brand_color', '#3B82F6'),
            ],
        );
    }

    public function logoUrl(): ?string
    {
        if (! $this->logo_path) {
            return null;
        }

        return Storage::disk('public')->url($this->logo_path);
    }

    public function logoAbsolutePath(): ?string
    {
        if (! $this->logo_path) {
            return null;
        }

        $path = Storage::disk('public')->path($this->logo_path);

        return is_file($path) ? $path : null;
    }
}
