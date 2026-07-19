<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Article;
use App\Models\CompanySetting;
use App\Models\Document;
use App\Models\DocumentEvent;
use App\Models\LigneDocument;
use App\Models\Payment;
use App\Models\Tier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class FacturationDemoSeeder extends Seeder
{
    private const DEMO_USER_EMAIL = 'client@minicfo.test';

    public function run(): void
    {
        $user = User::query()->where('email', self::DEMO_USER_EMAIL)->first();

        if ($user === null) {
            $this->command?->warn('Utilisateur demo introuvable ('.self::DEMO_USER_EMAIL.'). Lancez d\'abord DatabaseSeeder.');

            return;
        }

        $this->purgeFacturationData($user);

        $tiers = $this->seedTiers($user);
        $articles = $this->seedArticles($user);
        $this->seedCompanySettings($user);
        $this->seedDocuments($tiers, $articles);

        $this->command?->info('Donnees facturation demo injectees pour '.self::DEMO_USER_EMAIL);
    }

    private function purgeFacturationData(User $user): void
    {
        $tierIds = Tier::query()
            ->withoutGlobalScope('authenticatedUser')
            ->where('user_id', $user->id)
            ->pluck('id');

        if ($tierIds->isEmpty()) {
            Article::query()
                ->withoutGlobalScope('authenticatedUser')
                ->where('user_id', $user->id)
                ->delete();

            CompanySetting::query()
                ->withoutGlobalScope('authenticatedUser')
                ->where('user_id', $user->id)
                ->delete();

            return;
        }

        $documentIds = Document::query()
            ->withoutGlobalScope('forAuthenticatedUser')
            ->whereIn('tiers_id', $tierIds)
            ->pluck('id');

        Payment::query()
            ->withoutGlobalScope('forAuthenticatedUser')
            ->whereIn('tiers_id', $tierIds)
            ->delete();

        if ($documentIds->isNotEmpty()) {
            DocumentEvent::query()->whereIn('document_id', $documentIds)->delete();
            LigneDocument::query()->whereIn('document_id', $documentIds)->delete();
            Document::query()
                ->withoutGlobalScope('forAuthenticatedUser')
                ->whereIn('id', $documentIds)
                ->delete();
        }

        Tier::query()
            ->withoutGlobalScope('authenticatedUser')
            ->where('user_id', $user->id)
            ->delete();

        Article::query()
            ->withoutGlobalScope('authenticatedUser')
            ->where('user_id', $user->id)
            ->delete();

        CompanySetting::query()
            ->withoutGlobalScope('authenticatedUser')
            ->where('user_id', $user->id)
            ->delete();
    }

    /**
     * @return array<string, Tier>
     */
    private function seedTiers(User $user): array
    {
        return [
            'nova' => Tier::query()->create([
                'user_id' => $user->id,
                'name' => 'Atelier Nova',
                'email' => 'contact@atelier-nova.fr',
                'type' => 'client',
                'address' => '12 rue des Artisans, 69002 Lyon',
                'country_code' => 'FR',
                'vat_number' => 'FR12345678901',
            ]),
            'lumiere' => Tier::query()->create([
                'user_id' => $user->id,
                'name' => 'Studio Lumiere',
                'email' => 'facturation@studio-lumiere.fr',
                'type' => 'client',
                'address' => '8 avenue Victor Hugo, 75016 Paris',
                'country_code' => 'FR',
                'vat_number' => 'FR98765432109',
            ]),
            'horizon' => Tier::query()->create([
                'user_id' => $user->id,
                'name' => 'Agence Horizon',
                'email' => 'devis@agence-horizon.fr',
                'type' => 'prospect',
                'address' => '3 quai du Port, 13002 Marseille',
                'country_code' => 'FR',
                'vat_number' => null,
            ]),
        ];
    }

    /**
     * @return array<string, Article>
     */
    private function seedArticles(User $user): array
    {
        return [
            'audit' => Article::query()->create([
                'user_id' => $user->id,
                'sku' => 'DEMO-AUDIT-001',
                'designation' => 'Audit financier express',
                'description' => 'Diagnostic rapide de la sante financiere (2h)',
                'type' => Article::TYPE_SERVICE,
                'category' => 'Conseil',
                'price_ht' => 2500,
                'price_type' => 'fixed',
                'is_active' => true,
            ]),
            'cfo' => Article::query()->create([
                'user_id' => $user->id,
                'sku' => 'DEMO-CFO-002',
                'designation' => 'Accompagnement CFO mensuel',
                'description' => 'Pilotage KPI, alertes et recommandations IA',
                'type' => Article::TYPE_SERVICE,
                'category' => 'Abonnement',
                'price_ht' => 1200,
                'price_type' => 'month',
                'is_active' => true,
            ]),
            'formation' => Article::query()->create([
                'user_id' => $user->id,
                'sku' => 'DEMO-FORM-003',
                'designation' => 'Formation equipe finance',
                'description' => 'Atelier demi-journee sur la lecture des KPI',
                'type' => Article::TYPE_PRODUCT,
                'category' => 'Formation',
                'price_ht' => 800,
                'price_type' => 'fixed',
                'is_active' => true,
            ]),
        ];
    }

    private function seedCompanySettings(User $user): void
    {
        CompanySetting::query()->create([
            'user_id' => $user->id,
            'name' => 'Client Demo SARL',
            'address' => "15 rue de la Republique\n69001 Lyon",
            'registration_number' => '912 345 678 00012',
            'email' => self::DEMO_USER_EMAIL,
            'phone' => '+33 6 12 34 56 78',
            'brand_color' => '#00F0FF',
        ]);
    }

    /**
     * @param  array<string, Tier>  $tiers
     * @param  array<string, Article>  $articles
     */
    private function seedDocuments(array $tiers, array $articles): void
    {
        $devisEnAttente = $this->createDocument(
            tier: $tiers['horizon'],
            type: Document::TYPE_DEVIS,
            reference: 'DEV-2026-0012',
            projectTitle: 'Formation KPI equipe commerciale',
            issueDate: '2026-06-05',
            dueDate: '2026-07-05',
            status: Document::STATUS_SENT,
            lignes: [
                ['article' => $articles['formation'], 'label' => 'Formation equipe finance', 'quantity' => 5, 'unit_price_ht' => 800, 'vat_rate' => 20],
                ['article' => $articles['cfo'], 'label' => 'Support post-formation (1 mois)', 'quantity' => 1, 'unit_price_ht' => 1200, 'vat_rate' => 20],
            ],
        );

        $devisAccepte = $this->createDocument(
            tier: $tiers['nova'],
            type: Document::TYPE_DEVIS,
            reference: 'DEV-2026-0008',
            projectTitle: 'Audit financier T2',
            issueDate: '2026-04-18',
            dueDate: '2026-05-18',
            status: Document::STATUS_ACCEPTED,
            lignes: [
                ['article' => $articles['audit'], 'label' => 'Audit financier express', 'quantity' => 1, 'unit_price_ht' => 2500, 'vat_rate' => 20],
                ['article' => $articles['cfo'], 'label' => 'Accompagnement CFO mensuel', 'quantity' => 1, 'unit_price_ht' => 1000, 'vat_rate' => 20],
            ],
        );

        $facturePayeeMai = $this->createDocument(
            tier: $tiers['nova'],
            type: Document::TYPE_FACTURE,
            reference: 'FAC-2026-0032',
            projectTitle: 'Mission audit T2',
            issueDate: '2026-05-20',
            dueDate: '2026-06-20',
            status: Document::STATUS_PAID,
            lignes: [
                ['article' => $articles['audit'], 'label' => 'Audit financier express', 'quantity' => 1, 'unit_price_ht' => 2500, 'vat_rate' => 20],
                ['article' => $articles['cfo'], 'label' => 'Accompagnement CFO mensuel', 'quantity' => 1, 'unit_price_ht' => 1000, 'vat_rate' => 20],
            ],
        );

        $facturePayeeJuin = $this->createDocument(
            tier: $tiers['lumiere'],
            type: Document::TYPE_FACTURE,
            reference: 'FAC-2026-0045',
            projectTitle: 'Pilotage CFO juin',
            issueDate: '2026-06-15',
            dueDate: '2026-07-15',
            status: Document::STATUS_PAID,
            lignes: [
                ['article' => $articles['cfo'], 'label' => 'Accompagnement CFO mensuel', 'quantity' => 5, 'unit_price_ht' => 1200, 'vat_rate' => 20],
                ['article' => $articles['audit'], 'label' => 'Audit financier express', 'quantity' => 1, 'unit_price_ht' => 1000, 'vat_rate' => 20],
            ],
        );

        $factureEnRetard = $this->createDocument(
            tier: $tiers['lumiere'],
            type: Document::TYPE_FACTURE,
            reference: 'FAC-2026-0038',
            projectTitle: 'Renouvellement accompagnement',
            issueDate: '2026-05-28',
            dueDate: '2026-06-10',
            status: Document::STATUS_SENT,
            lignes: [
                ['article' => $articles['cfo'], 'label' => 'Accompagnement CFO mensuel', 'quantity' => 3, 'unit_price_ht' => 1200, 'vat_rate' => 20],
            ],
        );

        $factureEnCours = $this->createDocument(
            tier: $tiers['nova'],
            type: Document::TYPE_FACTURE,
            reference: 'FAC-2026-0048',
            projectTitle: 'Mission conseil Q3',
            issueDate: '2026-06-18',
            dueDate: '2026-07-18',
            status: Document::STATUS_SENT,
            lignes: [
                ['article' => $articles['audit'], 'label' => 'Audit financier express', 'quantity' => 1, 'unit_price_ht' => 2500, 'vat_rate' => 20],
                ['article' => null, 'label' => 'Frais de deplacement', 'quantity' => 1, 'unit_price_ht' => 300, 'vat_rate' => 20],
            ],
        );

        $this->createPayment($facturePayeeMai, 4200, '2026-05-25');
        $this->createPayment($facturePayeeJuin, 8400, '2026-06-18');

        $this->recordEvent($devisEnAttente, DocumentEvent::TYPE_SENT, 'Devis envoye par email');
        $this->recordEvent($devisAccepte, DocumentEvent::TYPE_ACCEPTED, 'Devis accepte par le client');
        $this->recordEvent($facturePayeeMai, DocumentEvent::TYPE_PAID, 'Paiement recu par virement');
        $this->recordEvent($facturePayeeJuin, DocumentEvent::TYPE_PAID, 'Paiement recu par carte');
        $this->recordEvent($factureEnRetard, DocumentEvent::TYPE_SENT, 'Facture envoyee — en attente de reglement');
        $this->recordEvent($factureEnCours, DocumentEvent::TYPE_SENT, 'Facture envoyee');
    }

    /**
     * @param  list<array{article: ?Article, label: string, quantity: float|int, unit_price_ht: float|int, vat_rate: float|int}>  $lignes
     */
    private function createDocument(
        Tier $tier,
        string $type,
        string $reference,
        string $projectTitle,
        string $issueDate,
        ?string $dueDate,
        string $status,
        array $lignes,
    ): Document {
        $document = Document::query()->create([
            'tiers_id' => $tier->id,
            'type' => $type,
            'reference' => $reference,
            'project_title' => $projectTitle,
            'issue_date' => $issueDate,
            'due_date' => $dueDate,
            'status' => $status,
            'currency_code' => 'EUR',
            'exchange_rate' => 1,
            'payment_terms' => 'Paiement a 30 jours',
        ]);

        foreach ($lignes as $ligne) {
            LigneDocument::query()->create([
                'document_id' => $document->id,
                'article_id' => $ligne['article']?->id,
                'label' => $ligne['label'],
                'quantity' => $ligne['quantity'],
                'unit_price_ht' => $ligne['unit_price_ht'],
                'vat_rate' => $ligne['vat_rate'],
            ]);
        }

        $this->recordEvent($document, DocumentEvent::TYPE_CREATED, 'Document cree');

        return $document;
    }

    private function createPayment(Document $document, float $amount, string $paidAt): void
    {
        Payment::query()->create([
            'tiers_id' => $document->tiers_id,
            'document_id' => $document->id,
            'kind' => Payment::KIND_PAYMENT,
            'amount' => $amount,
            'transaction_fee' => 0,
            'payment_method' => Payment::METHOD_SEPA,
            'payment_method_detail' => 'Virement SEPA',
            'status' => Payment::STATUS_SUCCESS,
            'paid_at' => Carbon::parse($paidAt),
            'notes' => 'Paiement demo seed',
        ]);
    }

    private function recordEvent(Document $document, string $type, string $description): void
    {
        DocumentEvent::query()->create([
            'document_id' => $document->id,
            'event_type' => $type,
            'description' => $description,
        ]);
    }
}
