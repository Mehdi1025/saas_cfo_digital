import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import CfoPageShell from '@/Components/CfoPageShell';
import AppDashboardLayout from '@/Layouts/AppDashboardLayout';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Calculator,
    ChartLine,
    HelpCircle,
    Megaphone,
    Sparkles,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { useMemo } from 'react';

const GLASS_PANEL =
    'border border-glassBorder bg-[linear-gradient(145deg,rgba(11,16,24,0.94)_0%,rgba(8,12,18,0.9)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)]';

const FIELD_GROUPS = [
    {
        id: 'activity',
        icon: TrendingUp,
        title: 'Activite commerciale',
        subtitle: 'Le coeur de vos indicateurs de rentabilite',
        accent: 'text-neonMint',
        border: 'border-neonMint/20',
        bg: 'bg-neonMint/10',
        fields: [
            {
                key: 'month',
                label: 'Mois concerne',
                hint: 'Un enregistrement par mois. Si le mois existe deja, il sera mis a jour.',
                wide: true,
                type: 'month',
                kpis: ['Periode', 'Graphiques'],
            },
            {
                key: 'revenue',
                label: "Chiffre d'affaires du mois",
                hint: 'Total facture ou encaisse ce mois (HT ou TTC — gardez la meme regle chaque mois).',
                type: 'number',
                placeholder: 'Ex. 18500',
                kpis: ['CA', 'Marge', 'LTV'],
            },
            {
                key: 'charges',
                label: 'Charges totales du mois',
                hint: 'Salaires, loyer, outils, achats, sous-traitance… tout ce qui reduit votre marge.',
                type: 'number',
                placeholder: 'Ex. 11200',
                kpis: ['Marge', 'Burn rate'],
            },
        ],
    },
    {
        id: 'acquisition',
        icon: Users,
        title: 'Clients & acquisition',
        subtitle: 'Pour le CAC, la LTV et la dependance client',
        accent: 'text-neonBlue',
        border: 'border-neonBlue/20',
        bg: 'bg-neonBlue/10',
        fields: [
            {
                key: 'clients_count',
                label: 'Clients actifs ce mois',
                hint: 'Nombre de clients distincts ayant genere du CA (pas les prospects ni les devis seuls).',
                type: 'number',
                step: '1',
                placeholder: 'Ex. 12',
                kpis: ['CAC', 'LTV', 'Top clients'],
            },
            {
                key: 'marketing_budget',
                label: 'Budget marketing & publicite',
                hint: 'Ads, SEO, salons, commissions apporteurs… depenses pour acquérir ces clients.',
                type: 'number',
                placeholder: 'Ex. 800',
                kpis: ['CAC'],
            },
        ],
    },
];

function KpiChip({ label }) {
    return (
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
        </span>
    );
}

function formatCurrency(value) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
}

function formatMonthLabel(month) {
    if (!month) {
        return '—';
    }

    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);

    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
}

function currentMonthValue() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function computePreview(data) {
    const revenue = Number(data.revenue) || 0;
    const charges = Number(data.charges) || 0;
    const marketing = Number(data.marketing_budget) || 0;
    const clients = Number(data.clients_count) || 0;
    const margin = revenue - charges;
    const marginPct = revenue > 0 ? (margin / revenue) * 100 : null;
    const cac = clients > 0 ? marketing / clients : null;
    const ltv = clients > 0 ? revenue / clients : null;

    return { revenue, charges, marketing, clients, margin, marginPct, cac, ltv };
}

export default function FinancialEntry() {
    const { latestRecord, recentRecords = [], recordsCount = 0, banking, flash } = usePage().props;
    const {
        data,
        setData,
        post,
        processing,
        errors,
        recentlySuccessful,
    } = useForm({
        month: currentMonthValue(),
        revenue: '',
        charges: '',
        marketing_budget: '',
        clients_count: '',
    });

    const preview = useMemo(() => computePreview(data), [data]);
    const hasBanking = (banking?.accounts?.length ?? 0) > 0;
    const showSuccess = recentlySuccessful || Boolean(flash?.success);

    const submit = (event) => {
        event.preventDefault();

        post(route('financial-records.store'), {
            preserveScroll: true,
        });
    };

    return (
        <AppDashboardLayout title="Saisie mensuelle" badge="Pilotage Fio">
            <CfoPageShell>
                <div className="mx-auto max-w-[1600px] space-y-8">
                    {flash?.success ? (
                        <div className="rounded-2xl border border-neonMint/30 bg-neonMint/10 px-4 py-3 text-sm text-neonMint">
                            {flash.success}
                        </div>
                    ) : null}

                    <section className={`${GLASS_PANEL} relative overflow-hidden rounded-3xl p-1`}>
                        <div className="relative overflow-hidden rounded-[23px] bg-obsidian/80 px-6 py-8 sm:px-8">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,157,0.1),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(0,240,255,0.08),transparent_40%)]" />
                            <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                                <div>
                                    <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-neonMint">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Saisie mensuelle
                                    </p>
                                    <h2 className="font-display mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                        Votre photo de mois pour Fio
                                    </h2>
                                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
                                        Chaque champ alimente des KPI precis du dashboard : marge, CAC, LTV, burn rate,
                                        graphiques et alertes. Ce n&apos;est pas un doublon de la banque Bridge — c&apos;est
                                        votre <span className="text-slate-200">vue business</span> (CA, charges, clients).
                                    </p>
                                    {hasBanking ? (
                                        <p className="mt-3 flex items-start gap-2 text-xs text-cyan-300/90">
                                            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            Banque connectee : Bridge couvre soldes et flux. Completez ici le CA et les
                                            charges pour une analyse dirigeant complete.
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                                        {recordsCount} mois enregistre{recordsCount > 1 ? 's' : ''}
                                    </span>
                                    {latestRecord ? (
                                        <span className="rounded-full border border-neonMint/20 bg-neonMint/10 px-3 py-1.5 text-xs text-neonMint">
                                            Dernier : {formatMonthLabel(latestRecord.month)}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                        <form onSubmit={submit} className="space-y-6 xl:col-span-2">
                            {FIELD_GROUPS.map((group) => {
                                const Icon = group.icon;

                                return (
                                    <section key={group.id} className={`${GLASS_PANEL} rounded-3xl p-6 sm:p-7`}>
                                        <div className="mb-6 flex items-start gap-4">
                                            <span
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${group.border} ${group.bg}`}
                                            >
                                                <Icon className={`h-5 w-5 ${group.accent}`} />
                                            </span>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                                                <p className="mt-1 text-sm text-slate-400">{group.subtitle}</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-5 md:grid-cols-2">
                                            {group.fields.map((field) => (
                                                <div
                                                    key={field.key}
                                                    className={field.wide ? 'md:col-span-2' : ''}
                                                >
                                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                        <InputLabel
                                                            htmlFor={field.key}
                                                            value={field.label}
                                                            className="text-gray-200"
                                                        />
                                                        <div className="flex flex-wrap gap-1">
                                                            {field.kpis.map((kpi) => (
                                                                <KpiChip key={kpi} label={kpi} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <TextInput
                                                        id={field.key}
                                                        type={field.type}
                                                        min={field.type === 'number' ? '0' : undefined}
                                                        max={field.key === 'clients_count' ? '999999' : '9999999999.99'}
                                                        step={field.step ?? (field.key === 'clients_count' ? '1' : '0.01')}
                                                        placeholder={field.placeholder}
                                                        className="mt-1 block w-full border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-neonMint focus:ring-neonMint"
                                                        value={data[field.key]}
                                                        onChange={(event) =>
                                                            setData(field.key, event.target.value)
                                                        }
                                                    />
                                                    <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                                                        <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
                                                        {field.hint}
                                                    </p>
                                                    <InputError message={errors[field.key]} className="mt-2" />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}

                            {showSuccess && !flash?.success ? (
                                <p className="text-sm font-medium text-emerald-300">
                                    Donnees enregistrees avec succes.
                                </p>
                            ) : null}

                            <div className="flex flex-wrap items-center gap-4">
                                <PrimaryButton
                                    type="submit"
                                    disabled={processing}
                                    className="border-neonMint/20 bg-neonMint px-6 text-obsidian hover:bg-neonMint/90 focus:bg-neonMint/90 focus:ring-neonMint"
                                >
                                    Enregistrer ce mois
                                </PrimaryButton>
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-neonBlue transition hover:text-neonMint"
                                >
                                    Voir le dashboard
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </form>

                        <div className="space-y-6">
                            <section className={`${GLASS_PANEL} rounded-3xl p-6`}>
                                <div className="mb-5 flex items-center gap-2">
                                    <Calculator className="h-5 w-5 text-neonMint" />
                                    <h3 className="text-lg font-semibold text-white">Apercu instantane</h3>
                                </div>
                                <p className="mb-5 text-xs text-slate-500">
                                    Calcul live a partir de vos champs — identique a la logique du dashboard.
                                </p>
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Marge nette</p>
                                        <p
                                            className={`font-display mt-1 text-2xl font-bold ${
                                                preview.margin >= 0 ? 'text-neonMint' : 'text-orange-300'
                                            }`}
                                        >
                                            {formatCurrency(preview.margin)}
                                        </p>
                                        {preview.marginPct !== null ? (
                                            <p className="mt-1 text-xs text-slate-400">
                                                {preview.marginPct.toFixed(1)} % du CA
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                                            <p className="text-[10px] uppercase tracking-wider text-slate-500">CAC</p>
                                            <p className="mt-1 text-lg font-bold text-white">
                                                {preview.cac !== null ? formatCurrency(preview.cac) : 'N/A'}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-500">Marketing / clients</p>
                                        </div>
                                        <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                                            <p className="text-[10px] uppercase tracking-wider text-slate-500">LTV</p>
                                            <p className="mt-1 text-lg font-bold text-white">
                                                {preview.ltv !== null ? formatCurrency(preview.ltv) : 'N/A'}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-500">CA / clients</p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-neonBlue/15 bg-neonBlue/5 p-3">
                                        <p className="flex items-center gap-1.5 text-xs text-neonBlue">
                                            <ChartLine className="h-3.5 w-3.5" />
                                            Burn rate = {formatCurrency(preview.charges)} / mois
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className={`${GLASS_PANEL} rounded-3xl p-6`}>
                                <div className="mb-4 flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-slate-400" />
                                    <h3 className="text-lg font-semibold text-white">Historique recent</h3>
                                </div>
                                {recentRecords.length > 0 ? (
                                    <div className="space-y-2">
                                        {recentRecords.map((record) => {
                                            const margin = Number(record.revenue) - Number(record.charges);

                                            return (
                                                <div
                                                    key={record.month}
                                                    className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium capitalize text-white">
                                                            {formatMonthLabel(record.month)}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {record.clients_count} client
                                                            {record.clients_count > 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-white">
                                                            {formatCurrency(record.revenue)}
                                                        </p>
                                                        <p
                                                            className={`text-xs ${
                                                                margin >= 0 ? 'text-neonMint' : 'text-orange-300'
                                                            }`}
                                                        >
                                                            Marge {formatCurrency(margin)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
                                        Votre premier mois saisi apparaitra ici et alimentera le dashboard Fio.
                                    </div>
                                )}
                            </section>

                            <section className={`${GLASS_PANEL} rounded-3xl p-6`}>
                                <div className="mb-3 flex items-center gap-2">
                                    <Megaphone className="h-5 w-5 text-amber-300/80" />
                                    <h3 className="text-sm font-semibold text-white">Conseils</h3>
                                </div>
                                <ul className="space-y-2.5 text-xs leading-relaxed text-slate-400">
                                    <li>Saisissez un mois par ligne — re-soumettre le meme mois met a jour les chiffres.</li>
                                    <li>Clients = ceux qui ont paye ou ete factures, pas votre pipeline complet.</li>
                                    <li>Si marketing = 0, le CAC sera N/A — c&apos;est normal pour l&apos;organique.</li>
                                    <li>Après enregistrement, consultez Console Fio et les alertes sur le dashboard.</li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </div>
            </CfoPageShell>
        </AppDashboardLayout>
    );
}
