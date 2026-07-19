<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Article;
use App\Models\CompanySetting;
use App\Models\Document;
use App\Models\DocumentEvent;
use App\Models\FactureFournisseur;
use App\Models\LigneDocument;
use App\Models\Payment;
use App\Models\Tier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class FacturationDemoSeeder extends Seeder
{
    /**
     * @var list<string>
     */
    private const SEED_EMAILS = [
        'client@copifi.test',
        'marie@copifi.test',
        'thomas@copifi.test',
    ];

    public function run(): void
    {
        foreach (self::SEED_EMAILS as $email) {
            $user = User::query()->where('email', $email)->first();

            if ($user === null) {
                $this->command?->warn("Utilisateur introuvable ({$email}).");

                continue;
            }

            $this->seedForUser($user, $this->profileFor($email));
            $this->command?->info("Donnees facturation injectees pour {$email}.");
        }
    }

    /**
     * @return array{prefix: string, company: string, address: string, registration_number: string, vat_number: string, phone: string, brand_color: string}
     */
    private function profileFor(string $email): array
    {
        return match ($email) {
            'marie@copifi.test' => [
                'prefix' => 'MAR',
                'company' => 'Marie Dupont EI',
                'address' => "8 rue des Lilas\n44000 Nantes",
                'registration_number' => '823 456 789 00023',
                'vat_number' => 'FR82345678900',
                'phone' => '+33 6 98 76 54 32',
                'brand_color' => '#6366F1',
            ],
            'thomas@copifi.test' => [
                'prefix' => 'THO',
                'company' => 'Bernard & Co SAS',
                'address' => "22 boulevard Haussmann\n75009 Paris",
                'registration_number' => '834 567 890 00034',
                'vat_number' => 'FR83456789000',
                'phone' => '+33 6 11 22 33 44',
                'brand_color' => '#10B981',
            ],
            default => [
                'prefix' => 'COP',
                'company' => 'Copifi Consulting SARL',
                'address' => "15 rue de la Republique\n69001 Lyon",
                'registration_number' => '912 345 678 00012',
                'vat_number' => 'FR91234567800',
                'phone' => '+33 6 12 34 56 78',
                'brand_color' => '#00F0FF',
            ],
        };
    }

    /**
     * @param  array{prefix: string, company: string, address: string, registration_number: string, vat_number: string, phone: string, brand_color: string}  $profile
     */
    private function seedForUser(User $user, array $profile): void
    {
        $this->purgeFacturationData($user);

        $prefix = $profile['prefix'];
        $tiers = $this->seedTiers($user, $profile['prefix']);
        $articles = $this->seedArticles($user, $profile['prefix']);
        $this->seedCompanySettings($user, $profile);
        $this->seedDocuments($tiers, $articles, $prefix);
        $this->seedFacturesFournisseurs($user, $prefix);
    }

    private function purgeFacturationData(User $user): void
    {
        FactureFournisseur::query()
            ->withoutGlobalScope('authenticatedUser')
            ->where('user_id', $user->id)
            ->delete();

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
    private function seedTiers(User $user, string $prefix): array
    {
        $tiers = [
            'nova' => Tier::query()->create([
                'user_id' => $user->id,
                'name' => 'Atelier Nova',
                'email' => "contact-{$prefix}@atelier-nova.fr",
                'type' => 'client',
                'address' => '12 rue des Artisans, 69002 Lyon',
                'country_code' => 'FR',
                'registration_number' => '81234567800019',
                'vat_number' => 'FR12345678901',
            ]),
            'lumiere' => Tier::query()->create([
                'user_id' => $user->id,
                'name' => 'Studio Lumiere',
                'email' => "facturation-{$prefix}@studio-lumiere.fr",
                'type' => 'client',
                'address' => '8 avenue Victor Hugo, 75016 Paris',
                'country_code' => 'FR',
                'registration_number' => '82345678900028',
                'vat_number' => 'FR98765432109',
            ]),
            'horizon' => Tier::query()->create([
                'user_id' => $user->id,
                'name' => 'Agence Horizon',
                'email' => "devis-{$prefix}@agence-horizon.fr",
                'type' => 'prospect',
                'address' => '3 quai du Port, 13002 Marseille',
                'country_code' => 'FR',
                'registration_number' => null,
                'vat_number' => null,
            ]),
            'berlin' => Tier::query()->create([
                'user_id' => $user->id,
                'name' => 'TechWerk GmbH',
                'email' => "billing-{$prefix}@techwerk.de",
                'type' => 'client',
                'address' => 'Friedrichstrasse 12, 10117 Berlin',
                'country_code' => 'DE',
                'registration_number' => 'HRB 123456 B',
                'vat_number' => 'DE123456789',
            ]),
        ];

        if ($prefix === 'COP') {
            $tiers['solstice'] = Tier::query()->create([
                'user_id' => $user->id,
                'name' => 'Solstice Digital',
                'email' => 'compta@solstice-digital.fr',
                'type' => 'client',
                'address' => '45 rue du Commerce, 33000 Bordeaux',
                'country_code' => 'FR',
                'registration_number' => '84567890100045',
                'vat_number' => 'FR84567890100',
            ]);
            $tiers['alpine'] = Tier::query()->create([
                'user_id' => $user->id,
                'name' => 'Alpine Ventures',
                'email' => 'finance@alpine-ventures.fr',
                'type' => 'prospect',
                'address' => '2 place Bellecour, 69002 Lyon',
                'country_code' => 'FR',
                'registration_number' => null,
                'vat_number' => null,
            ]);
        }

        return $tiers;
    }

    /**
     * @return array<string, Article>
     */
    private function seedArticles(User $user, string $prefix): array
    {
        $articles = [
            'audit' => Article::query()->create([
                'user_id' => $user->id,
                'sku' => "{$prefix}-AUDIT-001",
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
                'sku' => "{$prefix}-CFO-002",
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
                'sku' => "{$prefix}-FORM-003",
                'designation' => 'Formation equipe finance',
                'description' => 'Atelier demi-journee sur la lecture des KPI',
                'type' => Article::TYPE_PRODUCT,
                'category' => 'Formation',
                'price_ht' => 800,
                'price_type' => 'fixed',
                'is_active' => true,
            ]),
            'reporting' => Article::query()->create([
                'user_id' => $user->id,
                'sku' => "{$prefix}-REP-004",
                'designation' => 'Pack e-reporting',
                'description' => 'Parametrage et transmission des flux reglementaires',
                'type' => Article::TYPE_SERVICE,
                'category' => 'Conformite',
                'price_ht' => 450,
                'price_type' => 'fixed',
                'is_active' => true,
            ]),
        ];

        if ($prefix === 'COP') {
            $articles['legacy'] = Article::query()->create([
                'user_id' => $user->id,
                'sku' => "{$prefix}-LEG-005",
                'designation' => 'Prestation archivee',
                'description' => 'Article desactive conserve pour historique',
                'type' => Article::TYPE_SERVICE,
                'category' => 'Archive',
                'price_ht' => 350,
                'price_type' => 'fixed',
                'is_active' => false,
            ]);
        }

        return $articles;
    }

    /**
     * @param  array{prefix: string, company: string, address: string, registration_number: string, vat_number: string, phone: string, brand_color: string}  $profile
     */
    private function seedCompanySettings(User $user, array $profile): void
    {
        CompanySetting::query()->create([
            'user_id' => $user->id,
            'name' => $profile['company'],
            'address' => $profile['address'],
            'registration_number' => $profile['registration_number'],
            'vat_number' => $profile['vat_number'],
            'email' => $user->email,
            'phone' => $profile['phone'],
            'brand_color' => $profile['brand_color'],
            'electronic_invoicing_active' => true,
            'billing_mandate_accepted_at' => now()->subMonths(2),
        ]);
    }

    /**
     * @param  array<string, Tier>  $tiers
     * @param  array<string, Article>  $articles
     */
    private function seedDocuments(array $tiers, array $articles, string $prefix): void
    {
        $ref = fn (string $suffix): string => "{$prefix}-{$suffix}";

        $devisBrouillon = $this->createDocument(
            tier: $tiers['alpine'] ?? $tiers['horizon'],
            type: Document::TYPE_DEVIS,
            reference: $ref('DEV-2026-0001'),
            projectTitle: 'Diagnostic tresorerie Q3',
            issueDate: '2026-07-10',
            dueDate: '2026-08-10',
            status: Document::STATUS_DRAFT,
            lignes: [
                ['article' => $articles['audit'], 'label' => 'Audit financier express', 'quantity' => 1, 'unit_price_ht' => 2500, 'vat_rate' => 20],
            ],
        );

        $devisEnAttente = $this->createDocument(
            tier: $tiers['horizon'],
            type: Document::TYPE_DEVIS,
            reference: $ref('DEV-2026-0012'),
            projectTitle: 'Formation KPI equipe commerciale',
            issueDate: '2026-06-05',
            dueDate: '2026-07-05',
            status: Document::STATUS_SENT,
            lignes: [
                ['article' => $articles['formation'], 'label' => 'Formation equipe finance', 'quantity' => 5, 'unit_price_ht' => 800, 'vat_rate' => 20],
                ['article' => $articles['cfo'], 'label' => 'Support post-formation (1 mois)', 'quantity' => 1, 'unit_price_ht' => 1200, 'vat_rate' => 20],
            ],
        );

        $devisRefuse = $this->createDocument(
            tier: $tiers['horizon'],
            type: Document::TYPE_DEVIS,
            reference: $ref('DEV-2026-0004'),
            projectTitle: 'Mission audit express',
            issueDate: '2026-03-12',
            dueDate: '2026-04-12',
            status: Document::STATUS_REJECTED,
            lignes: [
                ['article' => $articles['audit'], 'label' => 'Audit financier express', 'quantity' => 1, 'unit_price_ht' => 2500, 'vat_rate' => 20],
            ],
        );

        $devisExpire = $this->createDocument(
            tier: $tiers['lumiere'],
            type: Document::TYPE_DEVIS,
            reference: $ref('DEV-2026-0003'),
            projectTitle: 'Pack reporting reglementaire',
            issueDate: '2026-01-15',
            dueDate: '2026-02-15',
            status: Document::STATUS_EXPIRED,
            lignes: [
                ['article' => $articles['reporting'], 'label' => 'Pack e-reporting', 'quantity' => 2, 'unit_price_ht' => 450, 'vat_rate' => 20],
            ],
        );

        $devisAccepte = $this->createDocument(
            tier: $tiers['nova'],
            type: Document::TYPE_DEVIS,
            reference: $ref('DEV-2026-0008'),
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
            reference: $ref('FAC-2026-0032'),
            projectTitle: 'Mission audit T2',
            issueDate: '2026-05-20',
            dueDate: '2026-06-20',
            status: Document::STATUS_PAID,
            lignes: [
                ['article' => $articles['audit'], 'label' => 'Audit financier express', 'quantity' => 1, 'unit_price_ht' => 2500, 'vat_rate' => 20],
                ['article' => $articles['cfo'], 'label' => 'Accompagnement CFO mensuel', 'quantity' => 1, 'unit_price_ht' => 1000, 'vat_rate' => 20],
            ],
            extra: [
                'cdar_status' => Document::CDAR_ENCAISSEE,
                'pa_document_id' => "pa-{$prefix}-0032",
                'ereported_at' => Carbon::parse('2026-05-26'),
            ],
        );

        $facturePayeeJuin = $this->createDocument(
            tier: $tiers['lumiere'],
            type: Document::TYPE_FACTURE,
            reference: $ref('FAC-2026-0045'),
            projectTitle: 'Pilotage CFO juin',
            issueDate: '2026-06-15',
            dueDate: '2026-07-15',
            status: Document::STATUS_PAID,
            lignes: [
                ['article' => $articles['cfo'], 'label' => 'Accompagnement CFO mensuel', 'quantity' => 5, 'unit_price_ht' => 1200, 'vat_rate' => 20],
                ['article' => $articles['audit'], 'label' => 'Audit financier express', 'quantity' => 1, 'unit_price_ht' => 1000, 'vat_rate' => 20],
            ],
            extra: [
                'cdar_status' => Document::CDAR_APPROUVEE,
                'pa_document_id' => "pa-{$prefix}-0045",
            ],
        );

        $factureEnRetard = $this->createDocument(
            tier: $tiers['lumiere'],
            type: Document::TYPE_FACTURE,
            reference: $ref('FAC-2026-0038'),
            projectTitle: 'Renouvellement accompagnement',
            issueDate: '2026-05-28',
            dueDate: '2026-06-10',
            status: Document::STATUS_SENT,
            lignes: [
                ['article' => $articles['cfo'], 'label' => 'Accompagnement CFO mensuel', 'quantity' => 3, 'unit_price_ht' => 1200, 'vat_rate' => 20],
            ],
            extra: [
                'cdar_status' => Document::CDAR_DEPOSEE,
                'pa_document_id' => "pa-{$prefix}-0038",
            ],
        );

        $factureEnCours = $this->createDocument(
            tier: $tiers['nova'],
            type: Document::TYPE_FACTURE,
            reference: $ref('FAC-2026-0048'),
            projectTitle: 'Mission conseil Q3',
            issueDate: '2026-06-18',
            dueDate: '2026-07-18',
            status: Document::STATUS_SENT,
            lignes: [
                ['article' => $articles['audit'], 'label' => 'Audit financier express', 'quantity' => 1, 'unit_price_ht' => 2500, 'vat_rate' => 20],
                ['article' => null, 'label' => 'Frais de deplacement', 'quantity' => 1, 'unit_price_ht' => 300, 'vat_rate' => 20],
            ],
            extra: [
                'financial_discount_percent' => 2,
                'financial_discount_days' => 10,
            ],
        );

        $factureInternational = $this->createDocument(
            tier: $tiers['berlin'],
            type: Document::TYPE_FACTURE,
            reference: $ref('FAC-2026-0050'),
            projectTitle: 'Consulting export DE',
            issueDate: '2026-06-22',
            dueDate: '2026-07-22',
            status: Document::STATUS_SENT,
            lignes: [
                ['article' => $articles['cfo'], 'label' => 'Accompagnement CFO mensuel', 'quantity' => 2, 'unit_price_ht' => 1200, 'vat_rate' => 0],
            ],
            extra: [
                'currency_code' => 'EUR',
                'operation_category' => Document::OPERATION_SERVICE,
                'destination' => 'DE',
            ],
        );

        $factureBrouillon = $this->createDocument(
            tier: $tiers['nova'],
            type: Document::TYPE_FACTURE,
            reference: $ref('FAC-2026-0052'),
            projectTitle: 'Facture a finaliser',
            issueDate: '2026-07-12',
            dueDate: '2026-08-12',
            status: Document::STATUS_DRAFT,
            lignes: [
                ['article' => $articles['reporting'], 'label' => 'Pack e-reporting', 'quantity' => 1, 'unit_price_ht' => 450, 'vat_rate' => 20],
            ],
        );

        $avoir = $this->createDocument(
            tier: $tiers['lumiere'],
            type: Document::TYPE_AVOIR,
            reference: $ref('AVO-2026-0002'),
            projectTitle: 'Avoir sur FAC-2026-0045',
            issueDate: '2026-06-25',
            dueDate: null,
            status: Document::STATUS_SENT,
            lignes: [
                ['article' => $articles['audit'], 'label' => 'Remise commerciale', 'quantity' => 1, 'unit_price_ht' => 200, 'vat_rate' => 20],
            ],
            extra: [
                'parent_id' => $facturePayeeJuin->id,
            ],
        );

        if ($prefix === 'COP' && isset($tiers['solstice'])) {
            $this->createDocument(
                tier: $tiers['solstice'],
                type: Document::TYPE_FACTURE,
                reference: $ref('FAC-2026-0055'),
                projectTitle: 'Mission Solstice — juillet',
                issueDate: '2026-07-01',
                dueDate: '2026-07-31',
                status: Document::STATUS_SENT,
                lignes: [
                    ['article' => $articles['cfo'], 'label' => 'Accompagnement CFO mensuel', 'quantity' => 1, 'unit_price_ht' => 1200, 'vat_rate' => 20],
                    ['article' => $articles['reporting'], 'label' => 'Pack e-reporting', 'quantity' => 1, 'unit_price_ht' => 450, 'vat_rate' => 20],
                ],
                extra: [
                    'cdar_status' => Document::CDAR_REJETEE,
                    'pa_document_id' => "pa-{$prefix}-0055",
                ],
            );
        }

        $this->createPayment($facturePayeeMai, 4200, '2026-05-25');
        $this->createPayment($facturePayeeJuin, 8400, '2026-06-18');
        $this->createPayment($factureEnRetard, 2160, '2026-06-05', Payment::STATUS_PENDING);

        $this->recordEvent($devisBrouillon, DocumentEvent::TYPE_CREATED, 'Devis en cours de redaction');
        $this->recordEvent($devisEnAttente, DocumentEvent::TYPE_SENT, 'Devis envoye par email');
        $this->recordEvent($devisRefuse, DocumentEvent::TYPE_REJECTED, 'Devis refuse par le prospect');
        $this->recordEvent($devisExpire, DocumentEvent::TYPE_SENT, 'Devis expire sans reponse');
        $this->recordEvent($devisAccepte, DocumentEvent::TYPE_ACCEPTED, 'Devis accepte par le client');
        $this->recordEvent($facturePayeeMai, DocumentEvent::TYPE_PAID, 'Paiement recu par virement');
        $this->recordEvent($facturePayeeJuin, DocumentEvent::TYPE_PAID, 'Paiement recu par carte');
        $this->recordEvent($factureEnRetard, DocumentEvent::TYPE_SENT, 'Facture envoyee — en attente de reglement');
        $this->recordEvent($factureEnCours, DocumentEvent::TYPE_SENT, 'Facture envoyee');
        $this->recordEvent($factureInternational, DocumentEvent::TYPE_SENT, 'Facture export envoyee');
        $this->recordEvent($avoir, DocumentEvent::TYPE_SENT, 'Avoir emis');
    }

    private function seedFacturesFournisseurs(User $user, string $prefix): void
    {
        $rows = [
            [
                'supplier_name' => 'OVHcloud',
                'supplier_siret' => '42476141900045',
                'reference' => "{$prefix}-ACH-2026-014",
                'issue_date' => '2026-06-03',
                'amount_ht' => 89.90,
                'amount_ttc' => 107.88,
                'cdar_status' => Document::CDAR_APPROUVEE,
                'pa_document_id' => "pa-in-{$prefix}-014",
            ],
            [
                'supplier_name' => 'Google Workspace',
                'supplier_siret' => '44306184100047',
                'reference' => "{$prefix}-ACH-2026-018",
                'issue_date' => '2026-06-12',
                'amount_ht' => 144.00,
                'amount_ttc' => 172.80,
                'cdar_status' => Document::CDAR_DEPOSEE,
                'pa_document_id' => "pa-in-{$prefix}-018",
            ],
            [
                'supplier_name' => 'Cabinet Comptable Leroy',
                'supplier_siret' => '51234567800012',
                'reference' => "{$prefix}-ACH-2026-021",
                'issue_date' => '2026-07-02',
                'amount_ht' => 350.00,
                'amount_ttc' => 420.00,
                'cdar_status' => Document::CDAR_ENCAISSEE,
                'pa_document_id' => "pa-in-{$prefix}-021",
            ],
        ];

        if ($prefix !== 'COP') {
            $rows = array_slice($rows, 0, 2);
        }

        foreach ($rows as $row) {
            FactureFournisseur::query()->create(array_merge($row, [
                'user_id' => $user->id,
            ]));
        }
    }

    /**
     * @param  list<array{article: ?Article, label: string, quantity: float|int, unit_price_ht: float|int, vat_rate: float|int}>  $lignes
     * @param  array<string, mixed>  $extra
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
        array $extra = [],
    ): Document {
        $document = Document::query()->create(array_merge([
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
        ], $extra));

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

    private function createPayment(
        Document $document,
        float $amount,
        string $paidAt,
        string $status = Payment::STATUS_SUCCESS,
    ): void {
        Payment::query()->create([
            'tiers_id' => $document->tiers_id,
            'document_id' => $document->id,
            'kind' => Payment::KIND_PAYMENT,
            'amount' => $amount,
            'transaction_fee' => $status === Payment::STATUS_SUCCESS ? 0 : 0,
            'payment_method' => Payment::METHOD_SEPA,
            'payment_method_detail' => $status === Payment::STATUS_PENDING ? 'Virement en attente' : 'Virement SEPA',
            'status' => $status,
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
