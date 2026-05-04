<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class FinancialRecord extends Model
{
   protected $fillable = [
        'user_id',
        'month',
        'revenue',
        'charges',
        'marketing_budget',
        'clients_count',
    ];


    public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}

}
