<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToAuthenticatedUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FactureFournisseur extends Model
{
    use BelongsToAuthenticatedUser;

    protected $table = 'factures_fournisseurs';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'pa_document_id',
        'supplier_name',
        'supplier_siret',
        'reference',
        'issue_date',
        'amount_ht',
        'amount_ttc',
        'cdar_status',
        'pdf_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'amount_ht' => 'decimal:2',
            'amount_ttc' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
