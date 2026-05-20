<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiInsight extends Model
{
    protected $fillable = [
        'user_id',
        'month',
        'generated_content',
        'edited_content',
        'edited_by_admin_id',
        'edited_at',
    ];

    protected function casts(): array
    {
        return [
            'edited_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function editedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'edited_by_admin_id');
    }

    public function displayContent(): string
    {
        return $this->edited_content ?: $this->generated_content;
    }
}
