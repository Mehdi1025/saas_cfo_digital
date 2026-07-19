<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CompanySetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CompanySettingsService
{
    public function current(): CompanySetting
    {
        return CompanySetting::current();
    }

    /**
     * @return array<string, mixed>
     */
    public function forFrontend(): array
    {
        return $this->map($this->current());
    }

    /**
     * @return array<string, mixed>
     */
    public function forPdf(): array
    {
        $settings = $this->current();
        $data = $this->map($settings);
        $logoPath = $settings->logoAbsolutePath();

        if ($logoPath !== null) {
            $mime = mime_content_type($logoPath) ?: 'image/png';
            $data['logo_data_uri'] = 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($logoPath));
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    public function update(array $validated, ?UploadedFile $logo = null, bool $removeLogo = false): CompanySetting
    {
        $settings = $this->current();

        if ($removeLogo) {
            $this->deleteLogo($settings);
            $validated['logo_path'] = null;
        }

        if ($logo !== null) {
            $this->deleteLogo($settings);
            $validated['logo_path'] = $logo->store('company', 'public');
        }

        $settings->update($validated);

        return $settings->fresh() ?? $settings;
    }

    private function deleteLogo(CompanySetting $settings): void
    {
        if (! $settings->logo_path) {
            return;
        }

        Storage::disk('public')->delete($settings->logo_path);
    }

    /**
     * @return array<string, mixed>
     */
    private function map(CompanySetting $settings): array
    {
        return [
            'name' => $settings->name,
            'address' => $settings->address ?? '',
            'registration_number' => $settings->registration_number ?? '',
            'vat_number' => $settings->vat_number ?? '',
            'email' => $settings->email ?? '',
            'phone' => $settings->phone ?? '',
            'logo_url' => $settings->logoUrl(),
            'brand_color' => $settings->brand_color ?: '#3B82F6',
            'electronic_invoicing_active' => (bool) $settings->electronic_invoicing_active,
            'billing_mandate_accepted_at' => $settings->billing_mandate_accepted_at?->toIso8601String(),
        ];
    }
}
