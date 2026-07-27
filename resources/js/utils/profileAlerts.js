import { getKpiMetric } from '@/utils/kpiAnalytics';

function parsePercent(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const numeric = Number(String(value).replace(/[^\d,.-]/g, '').replace(',', '.'));

    return Number.isFinite(numeric) ? numeric : null;
}

function parseMonths(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const match = String(value).match(/(\d+)/);

    return match ? Number(match[1]) : null;
}

function evaluateAlertKpi(kpi, metric, kpis) {
    switch (kpi.id) {
        case 'provisions_tva': {
            if ((kpis.chiffre_affaires ?? 0) <= 0) {
                return null;
            }

            return {
                tone: 'attention',
                title: `${kpi.name} — provision a anticiper`,
                message: `Provision TVA estimee : ${metric.value}. Anticipez le paiement sur votre tresorerie.`,
                kpiId: kpi.id,
            };
        }
        case 'impayes': {
            const rate = parsePercent(metric.value);

            if (rate === null) {
                return null;
            }

            if (rate > 5) {
                return {
                    tone: 'critique',
                    title: `${kpi.name} — niveau critique`,
                    message: `Taux estime a ${metric.value}. Renforcez le recouvrement des factures en attente.`,
                    kpiId: kpi.id,
                };
            }

            if (rate > 2.5) {
                return {
                    tone: 'attention',
                    title: `${kpi.name} — a surveiller`,
                    message: `Taux estime a ${metric.value}. Verifiez vos relances clients.`,
                    kpiId: kpi.id,
                };
            }

            return null;
        }
        case 'dependance_client': {
            if ((kpis.clients_count ?? 0) <= 2 && (kpis.chiffre_affaires ?? 0) > 0) {
                return {
                    tone: 'attention',
                    title: `${kpi.name} — concentration elevee`,
                    message: `Seulement ${kpis.clients_count} client(s) actif(s). Diversifiez votre portefeuille pour reduire le risque.`,
                    kpiId: kpi.id,
                };
            }

            return null;
        }
        case 'plafond_micro': {
            const usage = parsePercent(metric.value);

            if (usage === null) {
                return null;
            }

            if (usage > 90) {
                return {
                    tone: 'critique',
                    title: `${kpi.name} — depassement imminent`,
                    message: `Vous avez utilise ${metric.value} du plafond micro (prorata mensuel).`,
                    kpiId: kpi.id,
                };
            }

            if (usage > 75) {
                return {
                    tone: 'attention',
                    title: `${kpi.name} — seuil approche`,
                    message: `${metric.value} du plafond micro consomme ce mois-ci.`,
                    kpiId: kpi.id,
                };
            }

            return null;
        }
        case 'provision_urssaf': {
            if ((kpis.marge_nette ?? 0) <= 0) {
                return null;
            }

            return {
                tone: 'attention',
                title: `${kpi.name} — charge a provisionner`,
                message: `Provision URSSAF estimee : ${metric.value}.`,
                kpiId: kpi.id,
            };
        }
        case 'burn_rate': {
            if ((kpis.charges_totales ?? 0) > (kpis.chiffre_affaires ?? 0)) {
                return {
                    tone: 'critique',
                    title: `${kpi.name} — cash consomme`,
                    message: `Vos charges (${metric.value}) depassent le CA du mois. Burn rate non soutenable.`,
                    kpiId: kpi.id,
                };
            }

            return null;
        }
        case 'runway': {
            const months = parseMonths(metric.value);

            if (months === null) {
                return null;
            }

            if (months < 3) {
                return {
                    tone: 'critique',
                    title: `${kpi.name} — autonomie critique`,
                    message: `Autonomie estimee : ${metric.value}. Agissez sur les charges ou le CA rapidement.`,
                    kpiId: kpi.id,
                };
            }

            if (months < 6) {
                return {
                    tone: 'attention',
                    title: `${kpi.name} — marge de manoeuvre reduite`,
                    message: `Autonomie estimee : ${metric.value}.`,
                    kpiId: kpi.id,
                };
            }

            return null;
        }
        case 'churn': {
            const churn = parsePercent(metric.value);

            if (churn === null) {
                return null;
            }

            if (churn > 5) {
                return {
                    tone: 'critique',
                    title: `${kpi.name} — fuite clients`,
                    message: `Churn logo estime a ${metric.value} sur le dernier mois.`,
                    kpiId: kpi.id,
                };
            }

            if (churn > 2) {
                return {
                    tone: 'attention',
                    title: `${kpi.name} — attrition detectee`,
                    message: `Churn logo estime a ${metric.value}.`,
                    kpiId: kpi.id,
                };
            }

            return null;
        }
        case 'masse_salariale': {
            const ratio = parsePercent(metric.value);

            if (ratio !== null && ratio > 70) {
                return {
                    tone: 'attention',
                    title: `${kpi.name} — ratio eleve`,
                    message: `Ratio charges/CA estime a ${metric.value}. Verifiez la masse salariale.`,
                    kpiId: kpi.id,
                };
            }

            return null;
        }
        case 'food_cost': {
            const ratio = parsePercent(metric.value);

            if (ratio !== null && ratio > 35) {
                return {
                    tone: 'critique',
                    title: `${kpi.name} — matieres trop elevees`,
                    message: `Food cost estime a ${metric.value} (cible ~30 %).`,
                    kpiId: kpi.id,
                };
            }

            return null;
        }
        case 'marge_globale': {
            const margin = parsePercent(metric.value);

            if (margin !== null && margin < 10) {
                return {
                    tone: 'attention',
                    title: `${kpi.name} — marge sous pression`,
                    message: `Marge nette a ${metric.value}. Analysez vos charges variables.`,
                    kpiId: kpi.id,
                };
            }

            return null;
        }
        case 'cac_ltv': {
            if (kpis.cac !== null && kpis.ltv !== null && Number(kpis.ltv) < Number(kpis.cac)) {
                return {
                    tone: 'critique',
                    title: `${kpi.name} — economie unitaire deficitaire`,
                    message: `LTV inferieure au CAC ce mois-ci (${metric.hint ?? ''}).`,
                    kpiId: kpi.id,
                };
            }

            return null;
        }
        default:
            return null;
    }
}

/**
 * Alertes filtrees par profil KPI actif (indicateurs marques 2a + regles metier).
 */
export function buildProfileAlerts({
    activeKpis,
    analytics,
    kpis,
    backendAlert = null,
    simulationMode = false,
}) {
    const items = [];
    const triggeredKpiIds = new Set();
    const prefix = simulationMode ? '[Projection 6M] ' : '';

    if (backendAlert) {
        items.push({
            tone: backendAlert.niveau,
            title:
                backendAlert.niveau === 'critique'
                    ? `${prefix}Alerte critique`
                    : backendAlert.niveau === 'attention'
                      ? `${prefix}Attention metier`
                      : `${prefix}Indicateurs favorables`,
            message: backendAlert.message,
            source: 'backend',
        });
    }

    activeKpis
        .filter((kpi) => kpi.alert)
        .forEach((kpi) => {
            const metric = getKpiMetric(analytics, kpi.id);
            const evaluation = evaluateAlertKpi(kpi, metric, kpis);

            if (!evaluation) {
                return;
            }

            triggeredKpiIds.add(kpi.id);
            items.push({
                tone: evaluation.tone,
                title: `${prefix}${evaluation.title}`,
                message: evaluation.message,
                source: 'profile',
                kpiId: evaluation.kpiId,
            });
        });

    if (!items.length) {
        items.push({
            tone: 'sain',
            title: simulationMode ? `${prefix}Scenario stable` : 'Profil sous controle',
            message: simulationMode
                ? 'Aucune alerte profil declenchee sur la projection a 6 mois.'
                : 'Vos KPI essentiels du profil ne declenchent pas d alerte ce mois-ci.',
            source: 'default',
        });
    }

    return { items, triggeredKpiIds: [...triggeredKpiIds] };
}
