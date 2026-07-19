<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToAuthenticatedUser;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Article extends Model
{
    use BelongsToAuthenticatedUser, HasFactory;

    public const TYPE_SERVICE = 'service';

    public const TYPE_BUNDLE = 'bundle';

    public const TYPE_PRODUCT = 'product';

    public const OPERATION_BIEN = 'bien';

    public const OPERATION_SERVICE = 'service';

    public const OPERATION_MIXTE = 'mixte';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'designation',
        'sku',
        'description',
        'image_path',
        'type',
        'operation_category',
        'category',
        'price_ht',
        'price_type',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price_ht' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public static function typeLabel(?string $type): string
    {
        return match ($type) {
            self::TYPE_BUNDLE => 'Bundle',
            self::TYPE_PRODUCT => 'Produit',
            default => 'Service',
        };
    }

    public static function priceSuffix(?string $priceType): string
    {
        return match ($priceType) {
            'year' => '/an',
            'hour' => '/h',
            'month' => '/mois',
            'unit' => '/unité',
            default => '/fixe',
        };
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
    public static function operationCategories(): array
    {
        return [
            self::OPERATION_BIEN,
            self::OPERATION_SERVICE,
            self::OPERATION_MIXTE,
        ];
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if ($this->image_path === null || $this->image_path === '') {
                return null;
            }

            return '/storage/'.ltrim($this->image_path, '/');
        });
    }

    /**
     * @return HasMany<LigneDocument, $this>
     */
    public function lignes(): HasMany
    {
        return $this->hasMany(LigneDocument::class);
    }
}
