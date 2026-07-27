/** Profile column order: free, agence, btp, retail, ecom, chr, lib, saas */
export const KPI_PROFILES = [
    { id: 'free', icon: '👤', name: 'Freelance / Micro', sub: 'prestation solo' },
    { id: 'agence', icon: '◈', name: 'Services B2B', sub: 'agence, conseil' },
    { id: 'btp', icon: '🔨', name: 'Artisan / BTP', sub: 'chantiers' },
    { id: 'retail', icon: '🏪', name: 'Commerce détail', sub: 'boutique' },
    { id: 'ecom', icon: '🛒', name: 'E-commerce', sub: 'vente en ligne' },
    { id: 'chr', icon: '🍽', name: 'Restauration / CHR', sub: 'couverts' },
    { id: 'lib', icon: '⚕', name: 'Libéral', sub: 'santé, juridique' },
    { id: 'saas', icon: '⟳', name: 'SaaS / Abonnement', sub: 'récurrent' },
];

export const DEFAULT_KPI_PROFILE = 'agence';

/** 0 = masqué · 1 = secondaire · 2 = essentiel · 2a = essentiel + alerte */
export const KPI_GROUPS = [
    {
        id: 'socle',
        name: 'Socle commun',
        kpis: [
            { id: 'tresorerie', name: 'Trésorerie dispo & prévisionnelle', sub: 'le cœur du réacteur', levels: [2, 2, 2, 2, 2, 2, 2, 2] },
            { id: 'ca_periode', name: 'CA de la période + comparatif N-1', sub: '', levels: [2, 2, 2, 2, 2, 2, 2, 2], dashboardWidget: 'revenue' },
            { id: 'marge_globale', name: 'Marge globale', sub: '', levels: [2, 2, 2, 2, 2, 2, 2, 2], dashboardWidget: 'net_margin' },
            { id: 'provisions_tva', name: 'Provisions TVA & charges à venir', sub: '', levels: ['2a', '2a', '2a', '2a', '2a', '2a', '2a', '2a'] },
            { id: 'encours', name: 'Encours total à recouvrer', sub: 'factures émises non payées', levels: [2, 2, 2, 1, 1, 0, 2, 2] },
            { id: 'top_clients', name: 'Top clients / top impayés', sub: '', levels: [2, 2, 2, 1, 1, 1, 2, 2] },
        ],
    },
    {
        id: 'tresorerie',
        name: 'Trésorerie & recouvrement',
        kpis: [
            { id: 'dso', name: 'DSO — délai moyen de paiement client', sub: '', levels: [2, 2, 2, 0, 0, 0, 2, 1] },
            { id: 'impayes', name: "Taux d'impayés", sub: '', levels: ['2a', '2a', '2a', 1, 1, 0, '2a', '2a'] },
            { id: 'bfr', name: 'BFR — besoin en fonds de roulement', sub: '', levels: [1, 1, 2, 2, 2, 1, 0, 1] },
            { id: 'burn_rate', name: 'Burn rate', sub: 'rythme de consommation du cash', levels: [0, 1, 0, 0, 1, 0, 0, '2a'] },
            { id: 'runway', name: "Runway — mois d'autonomie", sub: '', levels: [0, 0, 0, 0, 1, 0, 0, '2a'] },
        ],
    },
    {
        id: 'commercial',
        name: 'Commercial & offre',
        kpis: [
            { id: 'transformation_devis', name: 'Taux de transformation devis → facture', sub: '', levels: [1, 2, 2, 0, 0, 0, 1, 1] },
            { id: 'dependance_client', name: 'CA par client & taux de dépendance', sub: '', levels: ['2a', 2, 1, 0, 0, 0, 2, 1] },
            { id: 'ticket_moyen', name: 'Panier / ticket moyen', sub: '', levels: [0, 0, 0, 2, 2, 2, 0, 1] },
            { id: 'ca_recurrent', name: 'Part de CA récurrent (abo vs one-shot)', sub: '', levels: [1, 2, 0, 0, 1, 0, 1, 2] },
            { id: 'saisonnalite', name: 'Saisonnalité (N vs N-1)', sub: '', levels: [0, 1, 1, 2, 1, 2, 0, 1] },
        ],
    },
    {
        id: 'metier',
        name: 'Métier — spécifique secteur',
        kpis: [
            { id: 'plafond_micro', name: 'Plafond micro & seuil franchise TVA', sub: 'alerte de dépassement', levels: ['2a', 0, 1, 0, 0, 0, 1, 0] },
            { id: 'provision_urssaf', name: 'Provision cotisations sociales (URSSAF)', sub: '', levels: ['2a', 0, 1, 0, 0, 0, '2a', 0] },
            { id: 'taux_occupation', name: "Taux d'occupation / jours facturés", sub: '', levels: [2, 1, 0, 0, 0, 0, 2, 0] },
            { id: 'marge_mission', name: 'Marge par mission / projet', sub: '', levels: [1, 2, 0, 0, 0, 0, 1, 0] },
            { id: 'marge_chantier', name: 'Marge par chantier', sub: 'matériaux + MO vs facturé', levels: [0, 0, 2, 0, 0, 0, 0, 0] },
            { id: 'situations_travaux', name: 'Situations de travaux & acomptes', sub: '', levels: [0, 0, 2, 0, 0, 0, 0, 0] },
            { id: 'retenue_garantie', name: 'Retenue de garantie en cours', sub: '', levels: [0, 0, '2a', 0, 0, 0, 0, 0] },
            { id: 'ca_acte', name: 'CA par acte / dossier / consultation', sub: '', levels: [0, 0, 0, 0, 0, 0, 2, 0] },
        ],
    },
    {
        id: 'volume',
        name: 'Volume, stock & point de vente',
        kpis: [
            { id: 'rotation_stocks', name: 'Rotation des stocks', sub: '', levels: [0, 0, 1, 2, 2, 1, 0, 0] },
            { id: 'rupture', name: 'Taux de rupture', sub: '', levels: [0, 0, 0, 2, 1, 1, 0, 0] },
            { id: 'ca_m2', name: 'CA par m² / par vendeur', sub: '', levels: [0, 0, 0, 2, 0, 0, 0, 0] },
            { id: 'ca_canal', name: 'CA par canal (site, marketplace, RS)', sub: '', levels: [0, 1, 0, 1, 2, 0, 0, 0] },
            { id: 'retours', name: 'Taux de retour produits', sub: 'impact sur le CA net', levels: [0, 0, 0, 1, 2, 0, 0, 0] },
            { id: 'food_cost', name: 'Food cost / ratio matières (~30 %)', sub: '', levels: [0, 0, 0, 0, 0, '2a', 0, 0] },
            { id: 'masse_salariale', name: 'Ratio masse salariale / CA', sub: '', levels: [0, 1, 1, 1, 0, '2a', 0, 1] },
            { id: 'couverts', name: 'Couverts & CA par service', sub: '', levels: [0, 0, 0, 0, 0, 2, 0, 0] },
        ],
    },
    {
        id: 'recurrent',
        name: 'Récurrent / SaaS',
        kpis: [
            { id: 'mrr', name: 'MRR / ARR', sub: '', levels: [0, 1, 0, 0, 0, 0, 0, 2] },
            { id: 'churn', name: 'Churn (revenu & logo)', sub: '', levels: [0, 1, 0, 0, 1, 0, 0, '2a'] },
            { id: 'arpu', name: 'ARPU — revenu moyen par compte', sub: '', levels: [0, 0, 0, 0, 0, 0, 0, 2] },
            { id: 'cac_ltv', name: 'CAC & ratio LTV / CAC', sub: '', levels: [0, 1, 0, 1, 2, 0, 0, 2], dashboardWidget: 'cac_ltv' },
            { id: 'activation', name: "Taux d'activation / onboarding réussi", sub: '', levels: [0, 0, 0, 0, 1, 0, 0, 2] },
            { id: 'echecs_paiement', name: 'Échecs de paiement récurrent', sub: '', levels: [0, 1, 0, 0, 1, 0, 0, '2a'] },
        ],
    },
];

export const PROFILE_SIGNALS = {
    free: ['APE prestation', 'statut micro/EI', '1–3 clients distincts', 'franchise TVA active'],
    agence: ['APE conseil/comm.', 'devis convertis', 'clients récurrents B2B', 'ticket moyen élevé'],
    btp: ['APE construction (41–43)', 'libellés « chantier/acompte »', 'TVA 10/20 %', 'retenue de garantie'],
    retail: ['APE commerce détail (47)', 'volume factures/j élevé', 'ticket faible', 'encaissement immédiat'],
    ecom: ['APE 47.91', 'flux marketplace/Stripe', 'frais de port en ligne', 'clients nombreux + récurrents'],
    chr: ['APE 56 (restauration)', 'libellés « menu/couvert »', 'pics midi/soir', 'ratio matières'],
    lib: ['APE libéral (69–86)', 'libellés « honoraires »', 'clients = dossiers/patients', 'TVA souvent exonérée'],
    saas: ['montants identiques mensuels', 'même client, récurrence stricte', 'libellé « abonnement »', 'prélèvement automatique'],
};

export const DASHBOARD_WIDGETS = [
    { id: 'revenue', label: "Chiffre d'affaires", matrixId: 'ca_periode' },
    { id: 'net_margin', label: 'Marge nette', matrixId: 'marge_globale' },
    { id: 'cac', label: 'CAC', matrixId: 'cac_ltv' },
    { id: 'ltv', label: 'LTV', matrixId: 'cac_ltv' },
];

const PROFILE_INDEX = Object.fromEntries(KPI_PROFILES.map((profile, index) => [profile.id, index]));

export function parseKpiLevel(raw) {
    const value = String(raw);
    const alert = value.includes('a');
    const level = parseInt(value, 10);

    if (level === 2) {
        return { tier: 'essential', alert };
    }

    if (level === 1) {
        return { tier: 'secondary', alert: false };
    }

    return { tier: 'hidden', alert: false };
}

export function getKpiLevelForProfile(kpi, profileId) {
    const index = PROFILE_INDEX[profileId] ?? PROFILE_INDEX[DEFAULT_KPI_PROFILE];
    return parseKpiLevel(kpi.levels[index]);
}

export function getProfileKpiBreakdown(profileId) {
    const essential = [];
    const secondary = [];
    const hidden = [];

    KPI_GROUPS.forEach((group) => {
        group.kpis.forEach((kpi) => {
            const { tier, alert } = getKpiLevelForProfile(kpi, profileId);
            const entry = { ...kpi, group: group.name, alert };

            if (tier === 'essential') {
                essential.push(entry);
            } else if (tier === 'secondary') {
                secondary.push(entry);
            } else {
                hidden.push(entry);
            }
        });
    });

    return { essential, secondary, hidden };
}

export function getProfileById(profileId) {
    return KPI_PROFILES.find((profile) => profile.id === profileId) ?? KPI_PROFILES.find((p) => p.id === DEFAULT_KPI_PROFILE);
}

export function isDashboardWidgetVisible(widgetId, profileId, preferences = {}) {
    const widget = DASHBOARD_WIDGETS.find((item) => item.id === widgetId);

    if (!widget) {
        return true;
    }

    const matrixKpi = KPI_GROUPS.flatMap((group) => group.kpis).find((kpi) => kpi.id === widget.matrixId);

    if (!matrixKpi) {
        return true;
    }

    const { tier } = getKpiLevelForProfile(matrixKpi, profileId ?? DEFAULT_KPI_PROFILE);
    const enabledSecondary = preferences?.enabled_secondary ?? [];

    if (tier === 'essential') {
        return true;
    }

    if (tier === 'secondary') {
        return enabledSecondary.includes(matrixKpi.id);
    }

    return false;
}

export function getDefaultEnabledSecondary(profileId) {
    const { secondary } = getProfileKpiBreakdown(profileId);

    return secondary.slice(0, 4).map((kpi) => kpi.id);
}
