<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ReferenceGeneratorService
{
    /**
     * @var array<string, string>
     */
    private const PREFIXES = [
        Document::TYPE_DEVIS => 'DEV',
        Document::TYPE_FACTURE => 'FAC',
        Document::TYPE_AVOIR => 'AVO',
    ];

    public function generate(string $type): string
    {
        if (! isset(self::PREFIXES[$type])) {
            throw new InvalidArgumentException("Type de document non pris en charge : {$type}");
        }

        return DB::transaction(function () use ($type) {
            $prefix = self::PREFIXES[$type];
            $year = now()->year;

            $last = Document::query()
                ->where('type', $type)
                ->whereYear('created_at', $year)
                ->lockForUpdate()
                ->latest('id')
                ->first();

            $sequence = 1;

            if ($last !== null && preg_match('/(\d{4})$/', $last->reference, $matches)) {
                $sequence = (int) $matches[1] + 1;
            }

            return sprintf(
                '%s-%d-%s',
                $prefix,
                $year,
                str_pad((string) $sequence, 4, '0', STR_PAD_LEFT),
            );
        });
    }
}
