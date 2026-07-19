<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DeliveryDestination;
use Illuminate\Support\Collection;

class DeliveryDestinationService
{
    /**
     * @return list<array{id: int, name: string, fee_per_day: float}>
     */
    public function forFrontend(): array
    {
        return DeliveryDestination::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (DeliveryDestination $destination) => [
                'id' => $destination->id,
                'name' => $destination->name,
                'fee_per_day' => (float) $destination->fee_per_day,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  list<array{id?: int|null, name: string, fee_per_day: float|int|string}>  $destinations
     */
    public function sync(array $destinations): void
    {
        $keptIds = collect();

        foreach ($destinations as $index => $row) {
            $name = trim((string) ($row['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            $feePerDay = max(0, (float) ($row['fee_per_day'] ?? 0));
            $id = isset($row['id']) ? (int) $row['id'] : null;

            if ($id) {
                $destination = DeliveryDestination::query()->find($id);
                if ($destination !== null) {
                    $destination->update([
                        'name' => $name,
                        'fee_per_day' => $feePerDay,
                        'sort_order' => $index + 1,
                    ]);
                    $keptIds->push($destination->id);

                    continue;
                }
            }

            $created = DeliveryDestination::query()->updateOrCreate(
                ['name' => $name],
                [
                    'fee_per_day' => $feePerDay,
                    'sort_order' => $index + 1,
                ],
            );

            $keptIds->push($created->id);
        }

        if ($keptIds->isEmpty()) {
            return;
        }

        DeliveryDestination::query()
            ->whereNotIn('id', $keptIds->unique()->all())
            ->delete();
    }

    /**
     * @return Collection<int, string>
     */
    public function allowedNames(): Collection
    {
        return DeliveryDestination::query()
            ->orderBy('sort_order')
            ->pluck('name');
    }
}
