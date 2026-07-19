<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Mail\DocumentSentMail;
use App\Models\Article;
use App\Models\CompanySetting;
use App\Models\Document;
use App\Models\LigneDocument;
use App\Models\Tier;
use App\Models\User;
use App\Services\DocumentMailerService;
use App\Services\DocumentPdfService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class DocumentSentMailTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Document $document;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        CompanySetting::query()->create([
            'user_id' => $this->user->id,
            'name' => 'Copifi Test SAS',
            'address' => '10 rue de Paris, 75001 Paris',
            'registration_number' => '91234567800012',
            'vat_number' => 'FR12345678901',
            'email' => 'billing@copifi.test',
        ]);

        $client = Tier::query()->create([
            'user_id' => $this->user->id,
            'name' => 'Client Pro France',
            'type' => 'client',
            'address' => '20 avenue Lyon, 69001 Lyon',
            'country_code' => 'FR',
            'registration_number' => '12345678901234',
            'vat_number' => 'FR98765432109',
            'email' => 'client@test.fr',
        ]);

        $article = Article::query()->create([
            'user_id' => $this->user->id,
            'designation' => 'Prestation conseil',
            'sku' => 'PREST-001',
            'type' => Article::TYPE_SERVICE,
            'operation_category' => Article::OPERATION_SERVICE,
            'price_ht' => 150.00,
            'price_type' => 'fixed',
            'is_active' => true,
        ]);

        $this->document = Document::query()->create([
            'tiers_id' => $client->id,
            'type' => Document::TYPE_FACTURE,
            'reference' => 'FAC-MAIL-001',
            'issue_date' => now(),
            'due_date' => now()->addDays(30),
            'status' => Document::STATUS_SENT,
            'operation_category' => Document::OPERATION_SERVICE,
            'currency_code' => 'EUR',
            'exchange_rate' => 1,
        ]);

        LigneDocument::query()->create([
            'document_id' => $this->document->id,
            'article_id' => $article->id,
            'label' => $article->designation,
            'quantity' => 1,
            'unit_price_ht' => 150,
            'vat_rate' => 20,
        ]);

        $this->mock(DocumentPdfService::class, function ($mock): void {
            $mock->shouldReceive('renderFacturX')
                ->andReturn('%PDF-1.4 factur-x test content');
            $mock->shouldReceive('facturXFilename')
                ->andReturn('FAC-MAIL-001-facturx.pdf');
        });
    }

    public function test_invoice_email_attaches_factur_x_pdf(): void
    {
        $mail = new DocumentSentMail($this->document);
        $attachments = $mail->attachments();

        $this->assertCount(1, $attachments);
        $this->assertSame('FAC-MAIL-001-facturx.pdf', $attachments[0]->as);
        $this->assertSame('application/pdf', $attachments[0]->mime);
    }

    public function test_document_mailer_sends_invoice_email_to_client(): void
    {
        Mail::fake();

        app(DocumentMailerService::class)->send($this->document);

        Mail::assertSent(DocumentSentMail::class, function (DocumentSentMail $mail): bool {
            return $mail->document->is($this->document);
        });
    }
}
