<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\DeliveryDestination;
use App\Models\Document;
use Illuminate\Validation\Rule;

class DocumentPrestation
{
    public const TYPE_SERVICE = 'service';

    public const TYPE_PRODUIT = 'produit';

    public const FRAIS_PORT_PAR_JOUR = 10.0;

    /**
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'type_prestation' => ['required', Rule::in([self::TYPE_SERVICE, self::TYPE_PRODUIT])],
            'destination' => [
                'nullable',
                'string',
                'max:255',
                Rule::when(
                    fn ($input) => filled(data_get($input, 'destination')),
                    [Rule::exists('delivery_destinations', 'name')],
                ),
            ],
            'jours_stockage' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{type_prestation: string, destination: ?string, jours_stockage: int, frais_port: float}
     */
    public static function normalize(array $data): array
    {
        $type = (string) ($data['type_prestation'] ?? self::TYPE_SERVICE);

        if ($type !== self::TYPE_PRODUIT) {
            return [
                'type_prestation' => self::TYPE_SERVICE,
                'destination' => null,
                'jours_stockage' => 0,
                'frais_port' => 0.0,
            ];
        }

        $jours = max(0, (int) ($data['jours_stockage'] ?? 0));
        $destination = filled($data['destination'] ?? null)
            ? (string) $data['destination']
            : null;

        return [
            'type_prestation' => self::TYPE_PRODUIT,
            'destination' => $destination,
            'jours_stockage' => $jours,
            'frais_port' => self::fraisPortForDays($jours, $destination),
        ];
    }

    public static function fraisPortForDays(int $jours, ?string $destination = null): float
    {
        $feePerDay = DeliveryDestination::feePerDayForName($destination) ?? self::FRAIS_PORT_PAR_JOUR;

        return round(max(0, $jours) * $feePerDay, 2);
    }

    public static function fraisPortForDocument(Document $document): float
    {
        if ($document->type_prestation !== self::TYPE_PRODUIT) {
            return 0.0;
        }

        return (float) ($document->frais_port ?? self::fraisPortForDays(
            (int) $document->jours_stockage,
            $document->destination,
        ));
    }
}
