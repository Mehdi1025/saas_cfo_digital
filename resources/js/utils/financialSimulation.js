export const PROJECTION_MONTHS = 6;

function addMonths(monthKey, offset) {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function calculateHealthScore(kpis, hasFinancialData = true) {
    if (!hasFinancialData) {
        return 0;
    }

    const margin = Number(kpis.marge_nette ?? 0);
    const revenue = Number(kpis.chiffre_affaires ?? 0);
    const charges = Number(kpis.charges_totales ?? 0);
    const cac = kpis.cac;
    const ltv = kpis.ltv;

    let score = 50;

    if (margin > 0) {
        score += 20;
    } else if (margin < 0) {
        score -= 25;
    }

    if (cac !== null && ltv !== null && Number(cac) > 0) {
        const ratio = Number(ltv) / Number(cac);
        if (ratio > 3) {
            score += 20;
        } else if (ratio >= 1) {
            score += 8;
        } else {
            score -= 18;
        }
    }

    if (revenue > 0) {
        const chargesRatio = charges / revenue;
        if (chargesRatio <= 0.5) {
            score += 10;
        } else if (chargesRatio <= 0.7) {
            score += 5;
        } else {
            score -= 10;
        }
    }

    return Math.max(0, Math.min(100, score));
}

export function healthScoreTone(score) {
    if (score >= 70) {
        return {
            color: '#00FF9D',
            glow: 'drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]',
            label: 'Solide',
        };
    }

    if (score >= 45) {
        return {
            color: '#FF8A00',
            glow: 'drop-shadow-[0_0_15px_rgba(255,138,0,0.45)]',
            label: 'A surveiller',
        };
    }

    return {
        color: '#F87171',
        glow: 'drop-shadow-[0_0_18px_rgba(248,113,113,0.55)]',
        label: 'Risque eleve',
    };
}

/**
 * @param {Array<{month: string, revenus: number, charges: number}>} historical
 * @param {{ marketing_budget: number, clients_count: number, chiffre_affaires: number, charges_totales: number }} baselineKpis
 * @param {{ marketingBudgetDelta: number, newClientsPerMonth: number, fixedChargesDelta: number }} sliders
 */
export function buildSimulationChartData(historical, baselineKpis, sliders) {
    if (!historical.length) {
        return { chartData: [], horizonKpis: null };
    }

    const lastHistorical = historical[historical.length - 1];
    const baseline = {
        month: lastHistorical.month,
        revenue: Number(baselineKpis.chiffre_affaires ?? lastHistorical.revenus ?? 0),
        charges: Number(baselineKpis.charges_totales ?? lastHistorical.charges ?? 0),
        marketingBudget: Number(baselineKpis.marketing_budget ?? 0),
        clientsCount: Number(baselineKpis.clients_count ?? 0),
    };

    const fixedCharges = Math.max(0, baseline.charges - baseline.marketingBudget);
    const revenuePerClient =
        baseline.clientsCount > 0 ? baseline.revenue / baseline.clientsCount : baseline.revenue;

    const historicalRows = historical.map((row, index) => ({
        month: row.month,
        revenusHist: row.revenus,
        chargesHist: row.charges,
        revenusSim: null,
        chargesSim: null,
        isProjected: false,
        isBridge: index === historical.length - 1,
    }));

    const projectedRows = [];
    let horizonKpis = null;

    for (let monthIndex = 1; monthIndex <= PROJECTION_MONTHS; monthIndex += 1) {
        const marketingBudget = baseline.marketingBudget * (1 + sliders.marketingBudgetDelta / 100);
        const fixedComponent = fixedCharges * (1 + sliders.fixedChargesDelta / 100);
        const projectedRevenue =
            baseline.revenue +
            baseline.revenue * 0.015 * monthIndex +
            revenuePerClient * sliders.newClientsPerMonth * monthIndex;
        const projectedCharges = fixedComponent + marketingBudget;
        const projectedClients = Math.max(
            1,
            baseline.clientsCount + Math.round(sliders.newClientsPerMonth * monthIndex),
        );

        const month = addMonths(baseline.month, monthIndex);

        projectedRows.push({
            month,
            revenusHist: null,
            chargesHist: null,
            revenusSim: Math.round(projectedRevenue),
            chargesSim: Math.round(projectedCharges),
            isProjected: true,
            isBridge: monthIndex === 1,
        });

        const margin = projectedRevenue - projectedCharges;
        const cac =
            projectedClients > 0 && marketingBudget > 0
                ? marketingBudget / projectedClients
                : null;
        const ltv = projectedClients > 0 ? projectedRevenue / projectedClients : null;

        horizonKpis = {
            mois_actuel: month,
            chiffre_affaires: Math.round(projectedRevenue),
            charges_totales: Math.round(projectedCharges),
            marge_nette: Math.round(margin),
            cac,
            ltv,
            marketing_budget: Math.round(marketingBudget),
            clients_count: projectedClients,
        };
    }

    if (projectedRows.length > 0) {
        const bridgeIndex = historicalRows.length - 1;
        historicalRows[bridgeIndex] = {
            ...historicalRows[bridgeIndex],
            revenusSim: historicalRows[bridgeIndex].revenusHist,
            chargesSim: historicalRows[bridgeIndex].chargesHist,
        };
        projectedRows[0] = {
            ...projectedRows[0],
            revenusHist: historicalRows[bridgeIndex].revenusHist,
            chargesHist: historicalRows[bridgeIndex].chargesHist,
        };
    }

    return {
        chartData: [...historicalRows, ...projectedRows],
        horizonKpis,
    };
}

export function buildHorizonKpisFromSliders(baselineKpis, sliders) {
    const historical = [
        {
            month: baselineKpis.mois_actuel ?? '2026-01',
            revenus: Number(baselineKpis.chiffre_affaires ?? 0),
            charges: Number(baselineKpis.charges_totales ?? 0),
        },
    ];

    return buildSimulationChartData(historical, baselineKpis, sliders).horizonKpis;
}
