<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\DocumentTotals;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
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

    public const TYPE_DEVIS = 'devis';

    public const TYPE_FACTURE = 'facture';

    public const TYPE_AVOIR = 'avoir';

    public const PRESTATION_SERVICE = 'service';

    public const PRESTATION_PRODUIT = 'produit';

    public const OPERATION_BIEN = 'bien';

    public const OPERATION_SERVICE = 'service';

    public const OPERATION_MIXTE = 'mixte';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SENT = 'sent';

    public const STATUS_PAID = 'paid';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_REJECTED = 'rejected';

    /** @deprecated Use STATUS_REJECTED */
    public const STATUS_REFUSED = 'rejected';

    public const STATUS_EXPIRED = 'expired';

    public const CDAR_DEPOSEE = 'déposée';

    public const CDAR_REJETEE = 'rejetée';

    public const CDAR_REFUSEE = 'refusée';

    public const CDAR_SUSPENDUE = 'suspendue';

    public const CDAR_ENCAISSEE = 'encaissée';

    public const CDAR_APPROUVEE = 'approuvée';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tiers_id',
        'type',
        'reference',
        'project_title',
        'issue_date',
        'due_date',
        'status',
        'cdar_status',
        'pa_document_id',
        'online_signature',
        'open_tracking',
        'payment_terms',
        'financial_discount_percent',
        'financial_discount_days',
        'parent_id',
        'currency_code',
        'exchange_rate',
        'type_prestation',
        'operation_category',
        'destination',
        'delivery_address',
        'vat_on_debits',
        'jours_stockage',
        'frais_port',
        'ereported_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => 'string',
            'status' => 'string',
            'cdar_status' => 'string',
            'issue_date' => 'date',
            'due_date' => 'date',
            'online_signature' => 'boolean',
            'open_tracking' => 'boolean',
            'vat_on_debits' => 'boolean',
            'exchange_rate' => 'decimal:6',
            'jours_stockage' => 'integer',
            'frais_port' => 'decimal:2',
            'financial_discount_percent' => 'decimal:2',
            'financial_discount_days' => 'integer',
            'ereported_at' => 'datetime',
        ];
    }

    public function totalTtc(): float
    {
        return DocumentTotals::totalTtc($this);
    }

    public function totalTtcInEur(): float
    {
        return DocumentTotals::totalTtcInEur($this);
    }

    public function isFacture(): bool
    {
        return $this->type === self::TYPE_FACTURE;
    }

    public function isDevis(): bool
    {
        return $this->type === self::TYPE_DEVIS;
    }

    public function isAvoir(): bool
    {
        return $this->type === self::TYPE_AVOIR;
    }

    public function canBeEdited(): bool
    {
        if ($this->isDevis()) {
            return $this->status === self::STATUS_DRAFT;
        }

        if ($this->isFacture()) {
            return $this->status === self::STATUS_DRAFT;
        }

        if ($this->isAvoir()) {
            return $this->status === self::STATUS_DRAFT;
        }

        return false;
    }

    /**
     * @return list<string>
     */
    public static function operationCategories(): array
    {
        return [
            self::OPERATION_BIEN,
            self::OPERATION_SERVICE,
            self::OPERATION_MIXTE,
        ];
    }

    public static function operationCategoryLabel(?string $category): string
    {
        return match ($category) {
            self::OPERATION_BIEN => 'Bien',
            self::OPERATION_MIXTE => 'Mixte',
            default => 'Service',
        };
    }

    /**
     * @return list<string>
     */
    public static function cdarStatuses(): array
    {
        return [
            self::CDAR_DEPOSEE,
            self::CDAR_REJETEE,
            self::CDAR_REFUSEE,
            self::CDAR_SUSPENDUE,
            self::CDAR_ENCAISSEE,
            self::CDAR_APPROUVEE,
        ];
    }

    public static function cdarStatusLabel(?string $status): string
    {
        return match ($status) {
            self::CDAR_DEPOSEE => 'Déposée',
            self::CDAR_REJETEE => 'Rejetée',
            self::CDAR_REFUSEE => 'Refusée',
            self::CDAR_SUSPENDUE => 'Suspendue',
            self::CDAR_ENCAISSEE => 'Encaissée',
            self::CDAR_APPROUVEE => 'Approuvée',
            default => $status ?? '—',
        };
    }

    public function hasCdarStatus(?string $status = null): bool
    {
        if ($status === null) {
            return filled($this->cdar_status);
        }

        return $this->cdar_status === $status;
    }

    /**
     * @return BelongsTo<Tier, $this>
     */
    public function tier(): BelongsTo
    {
        return $this->belongsTo(Tier::class, 'tiers_id');
    }

    /**
     * @return HasMany<LigneDocument, $this>
     */
    public function lignes(): HasMany
    {
        return $this->hasMany(LigneDocument::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * @return HasMany<DocumentEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(DocumentEvent::class)->orderBy('created_at');
    }

    /**
     * @return BelongsTo<Document, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Documents enfants (ex. avoirs rattachés à cette facture).
     *
     * @return HasMany<Document, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}
