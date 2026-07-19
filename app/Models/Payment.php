<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::addGlobalScope('forAuthenticatedUser', function (Builder $builder): void {
            if (auth()->check()) {
                $builder->whereHas('tier');
            }
        });
    }

    public const METHOD_SEPA = 'sepa';

    public const METHOD_CARD = 'card';

    public const METHOD_DIRECT_DEBIT = 'direct_debit';

    public const METHOD_MANUAL = 'manual';

    public const STATUS_SUCCESS = 'success';

    public const STATUS_PENDING = 'pending';

    public const STATUS_FAILED = 'failed';

    public const KIND_PAYMENT = 'payment';

    public const KIND_REFUND = 'refund';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tiers_id',
        'document_id',
        'kind',
        'amount',
        'financial_discount_amount',
        'transaction_fee',
        'payment_method',
        'payment_method_detail',
        'status',
        'paid_at',
        'notes',
        'ereported_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'financial_discount_amount' => 'decimal:2',
            'transaction_fee' => 'decimal:2',
            'paid_at' => 'datetime',
            'ereported_at' => 'datetime',
        ];
    }

    public static function methodLabel(string $method): string
    {
        return match ($method) {
            self::METHOD_SEPA => 'Virement SEPA',
            self::METHOD_CARD => 'Carte bancaire',
            self::METHOD_DIRECT_DEBIT => 'Prélèvement',
            default => 'Paiement manuel',
        };
    }

    public static function statusLabel(string $status): string
    {
        return match ($status) {
            self::STATUS_SUCCESS => 'Réussi',
            self::STATUS_PENDING => 'En attente',
            default => 'Échoué',
        };
    }

    /**
     * @return BelongsTo<Tier, $this>
     */
    public function tier(): BelongsTo
    {
        return $this->belongsTo(Tier::class, 'tiers_id');
    }

    /**
     * @return BelongsTo<Document, $this>
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
