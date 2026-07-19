<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Jobs\TransmitInvoiceToPaJob;
use App\Models\Article;
use App\Models\CompanySetting;
use App\Models\Document;
use App\Models\DocumentEvent;
use App\Models\FactureFournisseur;
use App\Models\LigneDocument;
use App\Models\ProcessedPaWebhook;
use App\Models\Tier;
use App\Models\User;
use App\Services\DocumentPdfService;
use App\Support\FacturXAssembler;
use App\Support\FacturXCiiGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private CompanySetting $companySettings;

    private Tier $clientFr;

    private Article $article;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.pa.url' => 'https://pa.test/api',
            'services.pa.key' => 'test-api-key',
            'services.pa.webhook_secret' => 'test-secret',
        ]);

        $this->user = User::factory()->create();
        $this->user->forceFill(['stripe_status' => 'active'])->save();

        $this->actingAs($this->user);

        $this->companySettings = CompanySetting::query()->create([
            'user_id' => $this->user->id,
            'name' => 'FinFlow Test SAS',
            'address' => '10 rue de Paris, 75001 Paris',
            'registration_number' => '91234567800012',
            'vat_number' => 'FR12345678901',
            'email' => 'billing@finflow.test',
            'electronic_invoicing_active' => true,
            'billing_mandate_accepted_at' => now(),
        ]);

        $this->clientFr = Tier::query()->create([
            'user_id' => $this->user->id,
            'name' => 'Client Pro France',
            'type' => 'client',
            'address' => '20 avenue Lyon, 69001 Lyon',
            'country_code' => 'FR',
            'registration_number' => '12345678901234',
            'vat_number' => 'FR98765432109',
            'email' => 'client@test.fr',
        ]);

        $this->article = Article::query()->create([
            'user_id' => $this->user->id,
            'designation' => 'Prestation conseil',
            'sku' => 'PREST-001',
            'type' => Article::TYPE_SERVICE,
            'operation_category' => Article::OPERATION_SERVICE,
            'price_ht' => 150.00,
            'price_type' => 'fixed',
            'is_active' => true,
        ]);

        $this->mockDocumentPipeline();
    }

    public function test_emission_facture_b2b_et_job(): void
    {
        Http::fake([
            'https://pa.test/api/v1/invoices' => Http::response(['id' => 'PA-12345'], 201),
        ]);

        $document = $this->createDraftFactureB2B();

        $document->update(['status' => Document::STATUS_SENT]);

        TransmitInvoiceToPaJob::dispatchSync($document->id);

        $document->refresh();

        Http::assertSent(function ($request): bool {
            return $request->method() === 'POST'
                && str_contains($request->url(), '/v1/invoices');
        });

        $this->assertSame('PA-12345', $document->pa_document_id);
        $this->assertSame(Document::STATUS_SENT, $document->status);
        $this->assertSame(Document::CDAR_DEPOSEE, $document->cdar_status);

        $this->assertDatabaseHas('document_events', [
            'document_id' => $document->id,
            'event_type' => DocumentEvent::TYPE_CDAR_STATUS_CHANGED,
        ]);
    }

    public function test_webhook_reception_statut_rejete_puis_approuve(): void
    {
        $document = $this->createDraftFactureB2B([
            'status' => Document::STATUS_SENT,
            'pa_document_id' => 'PA-WEBHOOK-001',
            'cdar_status' => Document::CDAR_DEPOSEE,
        ]);

        $headers = ['X-PA-Signature' => 'test-secret'];

        $this->postJson('/api/pa/webhook', [
            'event_type' => 'STATUS_UPDATE',
            'pa_document_id' => 'PA-WEBHOOK-001',
            'cdar_status' => 'rejetée',
            'reason' => 'Données émetteur invalides.',
        ], $headers)
            ->assertOk()
            ->assertJsonPath('cdar_status', Document::CDAR_REJETEE);

        $document->refresh();

        $this->assertSame(Document::CDAR_REJETEE, $document->cdar_status);
        $this->assertDatabaseHas('document_events', [
            'document_id' => $document->id,
            'event_type' => DocumentEvent::TYPE_CDAR_STATUS_CHANGED,
        ]);

        $this->postJson('/api/pa/webhook', [
            'event_type' => 'STATUS_UPDATE',
            'pa_document_id' => 'PA-WEBHOOK-001',
            'cdar_status' => 'approuvée',
            'reason' => 'Validation manuelle PA.',
        ], $headers)
            ->assertOk()
            ->assertJsonPath('cdar_status', Document::CDAR_APPROUVEE);

        $document->refresh();

        $this->assertSame(Document::CDAR_APPROUVEE, $document->cdar_status);
        $this->assertSame(
            2,
            DocumentEvent::query()
                ->where('document_id', $document->id)
                ->where('event_type', DocumentEvent::TYPE_CDAR_STATUS_CHANGED)
                ->count(),
        );
    }

    public function test_webhook_reception_facture_fournisseur(): void
    {
        $response = $this->postJson('/api/pa/webhook', [
            'event_type' => 'NEW_INCOMING_INVOICE',
            'pa_document_id' => 'PA-IN-789',
            'recipient_siret' => $this->companySettings->registration_number,
            'supplier_name' => 'Fournisseur Acme SAS',
            'supplier_siret' => '98765432109876',
            'reference' => 'FF-2026-042',
            'issue_date' => '2026-07-01',
            'amount_ht' => 850.00,
            'amount_ttc' => 1020.00,
            'cdar_status' => 'déposée',
        ], [
            'X-PA-Signature' => 'test-secret',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('factures_fournisseurs', [
            'user_id' => $this->user->id,
            'pa_document_id' => 'PA-IN-789',
            'supplier_name' => 'Fournisseur Acme SAS',
            'reference' => 'FF-2026-042',
            'amount_ht' => 850.00,
            'amount_ttc' => 1020.00,
            'cdar_status' => Document::CDAR_DEPOSEE,
        ]);

        $factureFournisseur = FactureFournisseur::query()
            ->where('pa_document_id', 'PA-IN-789')
            ->first();

        $this->assertNotNull($factureFournisseur);
        $this->assertSame($this->user->id, $factureFournisseur->user_id);
    }

    public function test_declenchement_ereporting(): void
    {
        Http::fake([
            'https://pa.test/api/v1/ereporting' => Http::response(['status' => 'accepted'], 200),
        ]);

        $clientInternational = Tier::query()->create([
            'user_id' => $this->user->id,
            'name' => 'Client Export GmbH',
            'type' => 'client',
            'address' => 'Berliner Str. 1, 10115 Berlin',
            'country_code' => 'DE',
            'vat_number' => 'DE123456789',
            'email' => 'export@test.de',
        ]);

        $document = Document::query()->create([
            'tiers_id' => $clientInternational->id,
            'type' => Document::TYPE_FACTURE,
            'reference' => 'FAC-INT-001',
            'issue_date' => now()->subDays(2),
            'due_date' => now()->addDays(28),
            'status' => Document::STATUS_SENT,
            'operation_category' => Document::OPERATION_SERVICE,
            'currency_code' => 'EUR',
            'exchange_rate' => 1,
            'ereported_at' => null,
        ]);

        LigneDocument::query()->create([
            'document_id' => $document->id,
            'article_id' => $this->article->id,
            'label' => $this->article->designation,
            'quantity' => 2,
            'unit_price_ht' => 500,
            'vat_rate' => 20,
        ]);

        $this->artisan('finflow:process-ereporting')
            ->assertSuccessful();

        Http::assertSent(function ($request): bool {
            return $request->method() === 'POST'
                && str_contains($request->url(), '/v1/ereporting');
        });

        $document->refresh();

        $this->assertNotNull($document->ereported_at);
    }

    public function test_webhook_idempotence_rejeu_du_meme_evenement(): void
    {
        $document = $this->createDraftFactureB2B([
            'status' => Document::STATUS_SENT,
            'pa_document_id' => 'PA-IDEM-001',
            'cdar_status' => Document::CDAR_DEPOSEE,
        ]);

        $payload = [
            'event_type' => 'STATUS_UPDATE',
            'pa_document_id' => 'PA-IDEM-001',
            'cdar_status' => 'approuvée',
            'reason' => 'Test idempotence webhook.',
        ];
        $headers = ['X-PA-Signature' => 'test-secret'];
        $eventId = md5(json_encode($payload, JSON_THROW_ON_ERROR));

        $this->postJson('/api/pa/webhook', $payload, $headers)
            ->assertOk()
            ->assertJsonPath('cdar_status', Document::CDAR_APPROUVEE);

        $this->postJson('/api/pa/webhook', $payload, $headers)
            ->assertOk()
            ->assertJsonPath('message', 'Événement PA déjà traité.');

        $this->assertSame(
            1,
            DocumentEvent::query()
                ->where('document_id', $document->id)
                ->where('event_type', DocumentEvent::TYPE_CDAR_STATUS_CHANGED)
                ->count(),
        );

        $this->assertDatabaseHas('processed_pa_webhooks', [
            'event_id' => $eventId,
        ]);

        $this->assertSame(1, ProcessedPaWebhook::query()->where('event_id', $eventId)->count());
    }

    public function test_record_cdar_status_change_ignore_statut_identique(): void
    {
        $document = $this->createDraftFactureB2B([
            'status' => Document::STATUS_SENT,
            'pa_document_id' => 'PA-DUP-CDAR',
            'cdar_status' => Document::CDAR_DEPOSEE,
        ]);

        DocumentEvent::query()->create([
            'document_id' => $document->id,
            'event_type' => DocumentEvent::TYPE_CDAR_STATUS_CHANGED,
            'description' => 'Statut CDAR initial',
        ]);

        $headers = ['X-PA-Signature' => 'test-secret'];

        $this->postJson('/api/pa/webhook', [
            'event_type' => 'STATUS_UPDATE',
            'event_id' => 'pa-event-dup-cdar-001',
            'pa_document_id' => 'PA-DUP-CDAR',
            'cdar_status' => 'déposée',
            'reason' => 'Rejeu PA.',
        ], $headers)->assertOk();

        $this->assertSame(
            1,
            DocumentEvent::query()
                ->where('document_id', $document->id)
                ->where('event_type', DocumentEvent::TYPE_CDAR_STATUS_CHANGED)
                ->count(),
        );
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createDraftFactureB2B(array $overrides = []): Document
    {
        $document = Document::query()->create(array_merge([
            'tiers_id' => $this->clientFr->id,
            'type' => Document::TYPE_FACTURE,
            'reference' => 'FAC-B2B-'.fake()->unique()->numerify('###'),
            'issue_date' => now(),
            'due_date' => now()->addDays(30),
            'status' => Document::STATUS_DRAFT,
            'operation_category' => Document::OPERATION_SERVICE,
            'currency_code' => 'EUR',
            'exchange_rate' => 1,
        ], $overrides));

        LigneDocument::query()->create([
            'document_id' => $document->id,
            'article_id' => $this->article->id,
            'label' => $this->article->designation,
            'quantity' => 1,
            'unit_price_ht' => 100,
            'vat_rate' => 20,
        ]);

        return $document->fresh(['tier', 'lignes']);
    }

    private function mockDocumentPipeline(): void
    {
        $this->mock(DocumentPdfService::class, function ($mock): void {
            $mock->shouldReceive('render')
                ->andReturn('%PDF-1.4 test content');
            $mock->shouldReceive('renderFacturX')
                ->andReturn('%PDF-1.4 factur-x test content');
            $mock->shouldReceive('facturXFilename')
                ->andReturnUsing(fn (Document $document): string => sprintf('%s-facturx.pdf', $document->reference));
        });

        $this->mock(FacturXCiiGenerator::class, function ($mock): void {
            $mock->shouldReceive('generate')
                ->andReturn('<?xml version="1.0"?><CrossIndustryInvoice/>');
        });

        $this->mock(FacturXAssembler::class, function ($mock): void {
            $mock->shouldReceive('assemble')
                ->andReturn('%PDF-1.4 factur-x test content');
        });
    }
}
