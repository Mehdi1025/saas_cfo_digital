<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Document;
use App\Services\CompanySettingsService;
use App\Services\DocumentPdfService;
use App\Support\DocumentTotals;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DocumentSentMail extends Mailable
{
    use SerializesModels;

    public function __construct(public Document $document)
    {
        $this->document->loadMissing(['tier', 'lignes']);
    }

    public function envelope(): Envelope
    {
        $company = app(CompanySettingsService::class)->forFrontend()['name'];

        return new Envelope(
            subject: "Votre facture {$this->document->reference} de la part de {$company}",
        );
    }

    public function content(): Content
    {
        $company = app(CompanySettingsService::class)->forFrontend()['name'];

        return new Content(
            view: 'emails.document-sent',
            with: [
                'document' => $this->document,
                'clientName' => $this->document->tier?->name,
                'companyName' => $company,
                'totalTtc' => DocumentTotals::totalTtc($this->document),
                'currencyCode' => $this->document->currency_code ?? 'EUR',
                'dueDateLabel' => $this->document->due_date?->translatedFormat('d F Y'),
                'documentUrl' => route('factures.edit', $this->document),
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $pdfService = app(DocumentPdfService::class);

        return [
            Attachment::fromData(
                fn () => $pdfService->renderFacturX($this->document),
                $pdfService->facturXFilename($this->document),
            )->withMime('application/pdf'),
        ];
    }
}
