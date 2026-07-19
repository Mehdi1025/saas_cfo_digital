<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToAuthenticatedUser
{
    public static function bootBelongsToAuthenticatedUser(): void
    {
        static::addGlobalScope('authenticatedUser', function (Builder $builder): void {
            if (auth()->check()) {
                $builder->where(
                    $builder->getModel()->getTable().'.user_id',
                    auth()->id(),
                );
            }
        });

        static::creating(function (self $model): void {
            if (auth()->check() && empty($model->user_id)) {
                $model->user_id = auth()->id();
            }
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
