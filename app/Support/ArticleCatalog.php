<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Article;
use App\Models\Document;
use Illuminate\Support\Collection;

class ArticleCatalog
{
    /**
     * Articles actifs du catalogue, plus ceux déjà liés au document en édition.
     *
     * @return Collection<int, Article>
     */
    public static function forDocument(?Document $document = null): Collection
    {
        $usedIds = collect();

        if ($document !== null) {
            $document->loadMissing('lignes');
            $usedIds = $document->lignes->pluck('article_id')->filter()->unique()->values();
        }

        $query = Article::query()->orderBy('designation');

        if ($usedIds->isEmpty()) {
            return $query
                ->where('is_active', true)
                ->get(['id', 'designation', 'description', 'price_ht']);
        }

        return $query
            ->where(function ($inner) use ($usedIds) {
                $inner->where('is_active', true)->orWhereIn('id', $usedIds);
            })
            ->get(['id', 'designation', 'description', 'price_ht']);
    }
}
