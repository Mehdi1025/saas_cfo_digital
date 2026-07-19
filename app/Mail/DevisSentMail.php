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

class DevisSentMail extends Mailable
{
    use SerializesModels;

    public function __construct(public Document $document)
    {
        $this->document->loadMissing(['tier', 'lignes']);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Votre proposition commerciale — {$this->document->reference}",
        );
    }

    public function content(): Content
    {
        $company = app(CompanySettingsService::class)->forFrontend()['name'];

        return new Content(
            view: 'emails.devis-sent',
            with: [
                'document' => $this->document,
                'clientName' => $this->document->tier?->name,
                'companyName' => $company,
                'totalTtc' => DocumentTotals::totalTtc($this->document),
                'currencyCode' => $this->document->currency_code ?? 'EUR',
                'validityLabel' => $this->document->due_date?->translatedFormat('d F Y'),
                'projectTitle' => $this->document->project_title,
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
                fn () => $pdfService->render($this->document),
                $pdfService->filename($this->document),
            )->withMime('application/pdf'),
        ];
    }
}
