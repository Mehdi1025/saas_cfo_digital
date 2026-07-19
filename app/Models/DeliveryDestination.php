<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToAuthenticatedUser;
use Illuminate\Database\Eloquent\Model;

class DeliveryDestination extends Model
{
    use BelongsToAuthenticatedUser;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'fee_per_day',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fee_per_day' => 'float',
            'sort_order' => 'integer',
        ];
    }

    public static function feePerDayForName(?string $name): ?float
    {
        if (! filled($name)) {
            return null;
        }

        $destination = static::query()->where('name', $name)->first();

        return $destination !== null ? (float) $destination->fee_per_day : null;
    }
}
