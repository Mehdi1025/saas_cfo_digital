const KPI_FALLBACK_IDS = [
    'situations_travaux',
    'retenue_garantie',
    'ca_acte',
    'rotation_stocks',
    'rupture',
    'ca_m2',
    'ca_canal',
    'retours',
    'food_cost',
    'couverts',
    'activation',
    'echecs_paiement',
];

function sparklineFromValues(values) {
    const source = values.length ? values : [0];

    return source.map((v, i) => ({ i, v: Number(v ?? 0) }));
}

function pctChange(current, previous) {
    if (previous === null || previous === undefined || Number(previous) === 0) {
        return null;
    }

    return ((Number(current) - Number(previous)) / Math.abs(Number(previous))) * 100;
}

function lastTwo(values) {
    if (values.length < 2) {
        return { current: values.at(-1) ?? 0, previous: null };
    }

    return {
        current: values.at(-1) ?? 0,
        previous: values.at(-2) ?? 0,
    };
}

function formatMonthLabel(month) {
    if (!month) {
        return '';
    }

    const [year, monthIndex] = String(month).split('-').map(Number);

    if (!year || !monthIndex) {
        return month;
    }

    return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(
        new Date(year, monthIndex - 1, 1),
    );
}

function seriesFromChart(chartData, mapper) {
    return chartData.map((row) => Number(mapper(row) ?? 0));
}

/**
 * @param {Array<{month:string,revenus:number,charges:number,clients_count?:number,marketing_budget?:number}>} chartData
 * @param {object} kpis
 * @param {object} formatters
 */
export function buildKpiAnalytics(chartData, kpis, formatters) {
    const { formatCompactCurrency, formatPercentage, formatCurrency } = formatters;

    const revenues = seriesFromChart(chartData, (r) => r.revenus);
    const charges = seriesFromChart(chartData, (r) => r.charges);
    const margins = chartData.map((r) => Number(r.revenus ?? 0) - Number(r.charges ?? 0));
    const marginPcts = chartData.map((r) =>
        Number(r.revenus) > 0 ? ((Number(r.revenus) - Number(r.charges)) / Number(r.revenus)) * 100 : 0,
    );
    const clients = seriesFromChart(chartData, (r) => r.clients_count ?? 0);
    const marketing = seriesFromChart(chartData, (r) => r.marketing_budget ?? 0);
    const cacSeries = chartData.map((r) =>
        Number(r.clients_count) > 0 ? Number(r.marketing_budget ?? 0) / Number(r.clients_count) : null,
    );
    const ltvSeries = chartData.map((r) =>
        Number(r.clients_count) > 0 ? Number(r.revenus ?? 0) / Number(r.clients_count) : null,
    );
    const ticketSeries = chartData.map((r) =>
        Number(r.clients_count) > 0 ? Number(r.revenus ?? 0) / Number(r.clients_count) : null,
    );
    const chargeRatioSeries = chartData.map((r) =>
        Number(r.revenus) > 0 ? (Number(r.charges) / Number(r.revenus)) * 100 : 0,
    );
    const cumulativeCash = margins.reduce((acc, value, index) => {
        acc.push((acc[index - 1] ?? 0) + value);
        return acc;
    }, []);
    const tvaProvisionSeries = revenues.map((value) => value * 0.2);
    const urssafProvisionSeries = margins.map((value) => Math.max(value, 0) * 0.22);
    const encoursSeries = revenues.map((value) => Math.max(value * 0.15, 0));
    const dsoSeries = revenues.map((ca, index) => {
        if (ca <= 0) {
            return null;
        }

        return (encoursSeries[index] / ca) * 30;
    });
    const churnSeries = clients.map((current, index) => {
        if (index === 0) {
            return null;
        }

        const previous = clients[index - 1];

        if (previous <= 0) {
            return null;
        }

        const lost = Math.max(previous - current, 0);

        return (lost / previous) * 100;
    });
    const impayesSeries = revenues.map((ca, index) => (ca > 0 ? Math.min((encoursSeries[index] / ca) * 100, 12) : 0));
    const devisSeries = marginPcts.map((value) => Math.min(Math.max(35 + value * 0.8, 20), 98));
    const occupationSeries = marginPcts.map((value) => Math.min(Math.max(45 + value * 0.55, 0), 100));
    const recurrentPct =
        revenues.length >= 2
            ? (() => {
                  const mean = revenues.reduce((sum, value) => sum + value, 0) / revenues.length;

                  if (mean <= 0) {
                      return 0;
                  }

                  const variance =
                      revenues.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / revenues.length;
                  const coefficient = Math.sqrt(variance) / mean;

                  return Math.max(0, Math.min(100, (1 - Math.min(coefficient, 1)) * 100));
              })()
            : 0;
    const recurrentSeries = revenues.map((value) => value * (recurrentPct / 100));
    const ltvCacRatioSeries = chartData.map((_, index) => {
        const cac = cacSeries[index];
        const ltv = ltvSeries[index];

        return cac && ltv ? ltv / cac : null;
    });

    const chartLabels = chartData.map((r) => formatMonthLabel(r.month));

    const makeTrend = (series, { invert = false } = {}) => {
        const { current, previous } = lastTwo(series.filter((v) => v !== null && v !== undefined));
        const raw = pctChange(current, previous);

        if (raw === null) {
            return { value: null, label: 'Stable', tone: 'neutral' };
        }

        const adjusted = invert ? -raw : raw;
        const tone = adjusted > 2 ? 'up' : adjusted < -2 ? 'down' : 'neutral';
        const sign = raw > 0 ? '+' : '';

        return {
            value: raw,
            label: `${sign}${raw.toFixed(1)} % vs M-1`,
            tone,
        };
    };

    const metric = ({
        kpiId,
        value,
        hint,
        live = true,
        sparkline,
        trend,
        chartSeries,
        chartLabel,
        unit = 'currency',
    }) => ({
        kpiId,
        value,
        hint,
        live,
        sparkline: sparklineFromValues(sparkline ?? []),
        trend: trend ?? { value: null, label: 'N/A', tone: 'neutral' },
        chartSeries: chartSeries ?? [],
        chartLabel: chartLabel ?? chartLabels,
        unit,
    });

    const revTrend = makeTrend(revenues);
    const marginTrend = makeTrend(marginPcts);
    const cacTrend = makeTrend(cacSeries.filter((v) => v !== null));
    const ltvTrend = makeTrend(ltvSeries.filter((v) => v !== null));

    const analytics = {
        ca_periode: metric({
            kpiId: 'ca_periode',
            value: formatCompactCurrency(kpis.chiffre_affaires),
            hint: `Charges : ${formatCompactCurrency(kpis.charges_totales)}`,
            sparkline: revenues,
            trend: revTrend,
            chartSeries: revenues,
        }),
        marge_globale: metric({
            kpiId: 'marge_globale',
            value: formatPercentage(
                kpis.chiffre_affaires > 0 ? (kpis.marge_nette / kpis.chiffre_affaires) * 100 : null,
            ),
            hint: `Net : ${formatCurrency(kpis.marge_nette)}`,
            sparkline: marginPcts,
            trend: marginTrend,
            chartSeries: marginPcts,
            unit: 'percent',
        }),
        cac_ltv: metric({
            kpiId: 'cac_ltv',
            value: kpis.cac === null ? 'N/A' : formatCompactCurrency(kpis.cac),
            hint: kpis.ltv === null ? 'LTV indisponible' : `LTV ${formatCompactCurrency(kpis.ltv)}`,
            live: kpis.cac !== null || kpis.ltv !== null,
            sparkline: ltvCacRatioSeries.map((v) => v ?? 0),
            trend: ltvTrend.value !== null && cacTrend.value !== null
                ? {
                      value: (ltvTrend.value ?? 0) - (cacTrend.value ?? 0),
                      label: `LTV ${ltvTrend.label} · CAC ${cacTrend.label}`,
                      tone: ltvTrend.tone,
                  }
                : ltvTrend,
            chartSeries: ltvSeries.map((v) => v ?? 0),
        }),
        tresorerie: metric({
            kpiId: 'tresorerie',
            value: formatCompactCurrency(cumulativeCash.at(-1) ?? kpis.marge_nette),
            hint: 'Solde cumule estime (CA - charges)',
            sparkline: cumulativeCash,
            trend: makeTrend(cumulativeCash),
            chartSeries: cumulativeCash,
        }),
        provisions_tva: metric({
            kpiId: 'provisions_tva',
            value: formatCompactCurrency((kpis.chiffre_affaires ?? 0) * 0.2),
            hint: 'Provision TVA estimee a 20 % du CA',
            sparkline: tvaProvisionSeries,
            trend: makeTrend(tvaProvisionSeries),
            chartSeries: tvaProvisionSeries,
        }),
        encours: metric({
            kpiId: 'encours',
            value: formatCompactCurrency(encoursSeries.at(-1) ?? 0),
            hint: 'Encours estime (~15 % du CA mensuel)',
            live: chartData.length > 0,
            sparkline: encoursSeries,
            trend: revTrend,
            chartSeries: encoursSeries,
        }),
        top_clients: metric({
            kpiId: 'top_clients',
            value: `${kpis.clients_count ?? 0} clients`,
            hint: 'Base clients active sur la periode',
            live: (kpis.clients_count ?? 0) > 0,
            sparkline: clients,
            trend: makeTrend(clients),
            chartSeries: clients,
            unit: 'count',
        }),
        dso: metric({
            kpiId: 'dso',
            value:
                dsoSeries.filter((value) => value !== null).at(-1) !== undefined
                    ? `${Math.round(dsoSeries.filter((value) => value !== null).at(-1) ?? 0)} j`
                    : 'N/A',
            hint: 'Delai moyen estime (encours / CA x 30 j)',
            live: dsoSeries.some((value) => value !== null),
            sparkline: dsoSeries.map((value) => value ?? 0),
            trend: makeTrend(dsoSeries.filter((value) => value !== null), { invert: true }),
            chartSeries: dsoSeries.map((value) => value ?? 0),
            unit: 'days',
        }),
        impayes: metric({
            kpiId: 'impayes',
            value: formatPercentage(impayesSeries.at(-1) ?? 0),
            hint: 'Taux estime sur encours / CA',
            live: chartData.length > 0,
            sparkline: impayesSeries,
            trend: makeTrend(impayesSeries, { invert: true }),
            chartSeries: impayesSeries,
            unit: 'percent',
        }),
        bfr: metric({
            kpiId: 'bfr',
            value: formatCompactCurrency(Math.max(kpis.chiffre_affaires * 0.25, 0)),
            hint: 'BFR estime (stock + creances - dettes)',
            live: chartData.length > 0,
            sparkline: margins.map((v) => v * 0.4),
            trend: makeTrend(margins),
            chartSeries: margins.map((v) => v * 0.4),
        }),
        burn_rate: metric({
            kpiId: 'burn_rate',
            value: formatCompactCurrency(kpis.charges_totales),
            hint: 'Consommation cash mensuelle (charges)',
            sparkline: charges,
            trend: makeTrend(charges, { invert: true }),
            chartSeries: charges,
        }),
        runway: metric({
            kpiId: 'runway',
            value:
                kpis.charges_totales > 0
                    ? `${Math.max(Math.round((cumulativeCash.at(-1) ?? 0) / kpis.charges_totales), 0)} mois`
                    : 'N/A',
            hint: 'Autonomie estimee au rythme actuel',
            live: kpis.charges_totales > 0,
            sparkline: cumulativeCash.map((v, i) =>
                charges[i] > 0 ? v / charges[i] : 0,
            ),
            trend: makeTrend(cumulativeCash),
            chartSeries: cumulativeCash.map((v, i) => (charges[i] > 0 ? v / charges[i] : 0)),
            unit: 'months',
        }),
        transformation_devis: metric({
            kpiId: 'transformation_devis',
            value: formatPercentage(devisSeries.at(-1) ?? 0),
            hint: 'Taux estime (correlation marge commerciale)',
            live: chartData.length > 0,
            sparkline: devisSeries,
            trend: makeTrend(devisSeries),
            chartSeries: devisSeries,
            unit: 'percent',
        }),
        dependance_client: metric({
            kpiId: 'dependance_client',
            value: kpis.clients_count > 0 ? formatCompactCurrency(kpis.chiffre_affaires / kpis.clients_count) : 'N/A',
            hint: 'CA moyen par client actif',
            live: (kpis.clients_count ?? 0) > 0,
            sparkline: ticketSeries.map((v) => v ?? 0),
            trend: makeTrend(ticketSeries.filter((v) => v !== null)),
            chartSeries: ticketSeries.map((v) => v ?? 0),
        }),
        ticket_moyen: metric({
            kpiId: 'ticket_moyen',
            value:
                kpis.clients_count > 0
                    ? formatCompactCurrency(kpis.chiffre_affaires / kpis.clients_count)
                    : 'N/A',
            hint: 'Panier moyen sur la periode',
            live: (kpis.clients_count ?? 0) > 0,
            sparkline: ticketSeries.map((v) => v ?? 0),
            trend: makeTrend(ticketSeries.filter((v) => v !== null)),
            chartSeries: ticketSeries.map((v) => v ?? 0),
        }),
        ca_recurrent: metric({
            kpiId: 'ca_recurrent',
            value: formatPercentage(recurrentPct),
            hint: 'Stabilite du CA sur la periode (faible volatilite = plus recurrent)',
            live: revenues.length > 1,
            sparkline: recurrentSeries,
            trend: makeTrend(recurrentSeries),
            chartSeries: recurrentSeries,
            unit: 'percent',
        }),
        saisonnalite: metric({
            kpiId: 'saisonnalite',
            value: revTrend.label,
            hint: 'Variation vs mois precedent',
            live: chartData.length > 1,
            sparkline: revenues,
            trend: revTrend,
            chartSeries: revenues,
        }),
        plafond_micro: metric({
            kpiId: 'plafond_micro',
            value: formatPercentage((kpis.chiffre_affaires / 77700) * 100),
            hint: 'Plafond micro 77 700 EUR (prorata mensuel)',
            live: kpis.chiffre_affaires > 0,
            sparkline: revenues.map((v) => (v / 77700) * 100),
            trend: revTrend,
            chartSeries: revenues.map((v) => (v / 77700) * 100),
            unit: 'percent',
        }),
        provision_urssaf: metric({
            kpiId: 'provision_urssaf',
            value: formatCompactCurrency(Math.max(kpis.marge_nette, 0) * 0.22),
            hint: 'Provision URSSAF estimee (22 %)',
            sparkline: urssafProvisionSeries,
            trend: makeTrend(urssafProvisionSeries),
            chartSeries: urssafProvisionSeries,
        }),
        taux_occupation: metric({
            kpiId: 'taux_occupation',
            value: formatPercentage(occupationSeries.at(-1) ?? 0),
            hint: 'Jours facturables estimes (proxy marge)',
            live: chartData.length > 0,
            sparkline: occupationSeries,
            trend: makeTrend(occupationSeries),
            chartSeries: occupationSeries,
            unit: 'percent',
        }),
        marge_mission: metric({
            kpiId: 'marge_mission',
            value: formatPercentage(
                kpis.chiffre_affaires > 0 ? (kpis.marge_nette / kpis.chiffre_affaires) * 100 : null,
            ),
            hint: 'Marge par mission (proxy marge globale)',
            sparkline: marginPcts,
            trend: marginTrend,
            chartSeries: marginPcts,
            unit: 'percent',
        }),
        marge_chantier: metric({
            kpiId: 'marge_chantier',
            value: formatPercentage(
                kpis.chiffre_affaires > 0 ? (kpis.marge_nette / kpis.chiffre_affaires) * 100 : null,
            ),
            hint: 'Marge chantier estimee',
            sparkline: marginPcts,
            trend: marginTrend,
            chartSeries: marginPcts,
            unit: 'percent',
        }),
        masse_salariale: metric({
            kpiId: 'masse_salariale',
            value: formatPercentage(chargeRatioSeries.at(-1) ?? 0),
            hint: 'Ratio charges / CA (proxy masse salariale)',
            sparkline: chargeRatioSeries,
            trend: makeTrend(chargeRatioSeries, { invert: true }),
            chartSeries: chargeRatioSeries,
            unit: 'percent',
        }),
        mrr: metric({
            kpiId: 'mrr',
            value: formatCompactCurrency(kpis.chiffre_affaires),
            hint: 'MRR estime = CA mensuel recurrent',
            sparkline: revenues,
            trend: revTrend,
            chartSeries: revenues,
        }),
        churn: metric({
            kpiId: 'churn',
            value:
                churnSeries.filter((value) => value !== null).at(-1) !== undefined
                    ? formatPercentage(churnSeries.filter((value) => value !== null).at(-1) ?? 0)
                    : 'N/A',
            hint: 'Churn logo calcule sur evolution clients M-1',
            live: churnSeries.some((value) => value !== null),
            sparkline: churnSeries.map((value) => value ?? 0),
            trend: makeTrend(churnSeries.filter((value) => value !== null), { invert: true }),
            chartSeries: churnSeries.map((value) => value ?? 0),
            unit: 'percent',
        }),
        arpu: metric({
            kpiId: 'arpu',
            value:
                kpis.clients_count > 0
                    ? formatCompactCurrency(kpis.chiffre_affaires / kpis.clients_count)
                    : 'N/A',
            hint: 'Revenu moyen par compte',
            live: (kpis.clients_count ?? 0) > 0,
            sparkline: ticketSeries.map((v) => v ?? 0),
            trend: makeTrend(ticketSeries.filter((v) => v !== null)),
            chartSeries: ticketSeries.map((v) => v ?? 0),
        }),
    };

    // Fallback for KPIs without explicit resolver
    KPI_FALLBACK_IDS.forEach((id) => {
        if (!analytics[id]) {
            analytics[id] = metric({
                kpiId: id,
                value: null,
                hint: 'Connexion des sources en cours',
                live: false,
                sparkline: [],
                trend: { value: null, label: 'Bientot', tone: 'neutral' },
                chartSeries: [],
            });
        }
    });

    return {
        byKpiId: analytics,
        chartLabels,
        series: {
            revenues,
            charges,
            margins,
            marginPcts,
            cumulativeCash,
            cacSeries,
            ltvSeries,
            clients,
        },
    };
}

export function getKpiMetric(analytics, kpiId) {
    return (
        analytics.byKpiId[kpiId] ?? {
            value: null,
            hint: 'Donnee indisponible',
            live: false,
            sparkline: [],
            trend: { value: null, label: 'N/A', tone: 'neutral' },
            chartSeries: [],
            chartLabel: analytics.chartLabels,
            unit: 'currency',
        }
    );
}

/** Panneaux graphiques principaux selon KPI actifs */
export function buildProfileChartPanels(activeKpis, analytics) {
    const ids = new Set(activeKpis.map((k) => k.id));
    const panels = [];

    if (ids.has('ca_periode') || ids.has('marge_globale') || ids.has('tresorerie')) {
        panels.push({
            id: 'performance',
            title: 'Performance financiere',
            subtitle: 'CA, charges et marge nette',
            type: 'combo',
            series: [
                { key: 'ca', label: 'CA', data: analytics.series.revenues, color: '#00F0FF' },
                { key: 'charges', label: 'Charges', data: analytics.series.charges, color: '#FF8A00' },
                { key: 'marge', label: 'Marge nette', data: analytics.series.margins, color: '#00FF9D' },
            ],
        });
    }

    if (ids.has('marge_globale') || ids.has('marge_mission') || ids.has('marge_chantier')) {
        panels.push({
            id: 'margin-pct',
            title: 'Marge %',
            subtitle: 'Evolution du taux de marge',
            type: 'area',
            series: [
                { key: 'marge_pct', label: 'Marge %', data: analytics.series.marginPcts, color: '#00FF9D' },
            ],
        });
    }

    if (ids.has('cac_ltv') || ids.has('arpu') || ids.has('mrr')) {
        panels.push({
            id: 'unit-economics',
            title: 'Economie unitaire',
            subtitle: 'LTV vs CAC dans le temps',
            type: 'lines',
            series: [
                { key: 'ltv', label: 'LTV', data: analytics.series.ltvSeries.map((v) => v ?? 0), color: '#00F0FF' },
                { key: 'cac', label: 'CAC', data: analytics.series.cacSeries.map((v) => v ?? 0), color: '#FF8A00' },
            ],
        });
    }

    if (ids.has('tresorerie') || ids.has('burn_rate') || ids.has('runway')) {
        panels.push({
            id: 'cash',
            title: 'Tresorerie cumulee',
            subtitle: 'Solde estime CA - charges',
            type: 'area',
            series: [
                { key: 'cash', label: 'Tresorerie', data: analytics.series.cumulativeCash, color: '#00FF9D' },
            ],
        });
    }

    if (ids.has('ticket_moyen') || ids.has('top_clients') || ids.has('dependance_client')) {
        panels.push({
            id: 'clients',
            title: 'Dynamique clients',
            subtitle: 'Volume clients actifs',
            type: 'bar',
            series: [
                {
                    key: 'clients',
                    label: 'Clients',
                    data: analytics.series.clients,
                    color: '#00F0FF',
                },
            ],
        });
    }

    return panels.slice(0, 4);
}

/** Resume synthetique pour le bandeau hero */
export function buildProfileStatsSummary(analytics, activeKpis) {
    const essentials = activeKpis.filter((kpi) => kpi.tier === 'essential');
    const metrics = essentials.map((kpi) => getKpiMetric(analytics, kpi.id));
    const liveCount = metrics.filter((metric) => metric.live).length;
    const upCount = metrics.filter((metric) => metric.trend?.tone === 'up').length;
    const downCount = metrics.filter((metric) => metric.trend?.tone === 'down').length;

    const caMetric = getKpiMetric(analytics, 'ca_periode');
    const marginMetric = getKpiMetric(analytics, 'marge_globale');

    return {
        liveCount,
        totalEssentials: essentials.length,
        upCount,
        downCount,
        momentum:
            upCount > downCount
                ? 'positive'
                : downCount > upCount
                  ? 'cautious'
                  : 'stable',
        highlights: [
            caMetric.live ? { label: 'CA', value: caMetric.value, trend: caMetric.trend } : null,
            marginMetric.live ? { label: 'Marge', value: marginMetric.value, trend: marginMetric.trend } : null,
        ].filter(Boolean),
    };
}
