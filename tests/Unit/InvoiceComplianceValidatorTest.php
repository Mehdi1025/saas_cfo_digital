<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\CompanySetting;
use App\Models\Document;
use App\Models\LigneDocument;
use App\Models\Tier;
use App\Models\User;
use App\Support\InvoiceComplianceValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceComplianceValidatorTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{document: Document, tier: Tier}
     */
    private function createCompliantFixture(): array
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        CompanySetting::query()->create([
            'user_id' => $user->id,
            'name' => 'Test SAS',
            'address' => '10 rue de Paris, 75001 Paris',
            'registration_number' => '91234567800012',
            'vat_number' => 'FR12345678901',
            'email' => 'billing@test.fr',
        ]);

        $tier = Tier::query()->create([
            'user_id' => $user->id,
            'name' => 'Client Pro',
            'type' => 'client',
            'address' => '20 avenue Lyon, 69001 Lyon',
            'country_code' => 'FR',
            'registration_number' => '12345678901234',
            'vat_number' => 'FR98765432109',
            'email' => 'client@test.fr',
        ]);

        $document = Document::query()->create([
            'tiers_id' => $tier->id,
            'type' => Document::TYPE_FACTURE,
            'reference' => 'FAC-TEST-001',
            'issue_date' => now(),
            'due_date' => now()->addDays(30),
            'status' => Document::STATUS_DRAFT,
            'operation_category' => Document::OPERATION_SERVICE,
            'currency_code' => 'EUR',
            'exchange_rate' => 1,
        ]);

        LigneDocument::query()->create([
            'document_id' => $document->id,
            'label' => 'Prestation test',
            'quantity' => 1,
            'unit_price_ht' => 100,
            'vat_rate' => 20,
        ]);

        $document->load(['tier', 'lignes']);

        return [
            'document' => $document,
            'tier' => $tier,
        ];
    }

    public function test_it_passes_for_a_compliant_invoice(): void
    {
        ['document' => $document] = $this->createCompliantFixture();

        $errors = app(InvoiceComplianceValidator::class)->validate($document);

        $this->assertSame([], $errors);
    }

    public function test_it_blocks_invoice_without_french_client_siret(): void
    {
        ['document' => $document, 'tier' => $tier] = $this->createCompliantFixture();

        $tier->update(['registration_number' => null]);
        $document->load(['tier', 'lignes']);

        $errors = app(InvoiceComplianceValidator::class)->validate($document);

        $this->assertNotEmpty($errors);
        $this->assertTrue(
            collect($errors)->contains(
                fn (string $error) => str_contains($error, 'SIRET') || str_contains($error, 'SIREN'),
            ),
        );
    }

    public function test_it_blocks_invoice_without_operation_category(): void
    {
        ['document' => $document] = $this->createCompliantFixture();

        $document->operation_category = null;

        $errors = app(InvoiceComplianceValidator::class)->validate($document);

        $this->assertNotEmpty($errors);
        $this->assertTrue(
            collect($errors)->contains(
                fn (string $error) => str_contains($error, 'catégorie d\'opération'),
            ),
        );
    }
}
