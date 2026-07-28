<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankAccount extends Model
{
    protected $fillable = [
        'user_id',
        'powens_account_id',
        'stripe_fc_account_id',
        'bridge_account_id',
        'bridge_item_id',
        'bank_name',
        'iban',
        'balance',
        'type',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'powens_account_id' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(BankTransaction::class);
    }
}
