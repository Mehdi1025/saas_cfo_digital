import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function FinancialEntry() {
    const { latestRecord } = usePage().props;
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        recentlySuccessful,
    } = useForm({
        month: '',
        revenue: '',
        charges: '',
        marketing_budget: '',
        clients_count: '',
    });

    const formatCurrency = (value) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(Number(value ?? 0));

    const submit = (event) => {
        event.preventDefault();

        post(route('financial-records.store'), {
            onSuccess: () =>
                reset(
                    'month',
                    'revenue',
                    'charges',
                    'marketing_budget',
                    'clients_count',
                ),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-semibold text-white">
                            Saisie mensuelle
                        </h2>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                            Mise a jour des donnees
                        </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                        Ajoutez ou mettez a jour vos chiffres pour alimenter le
                        tableau de bord.
                    </p>
                </div>
            }
        >
            <Head title="Saisie mensuelle" />

            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
                <section className="rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.015))] p-6 shadow-[0_25px_60px_rgba(2,6,23,0.22)]">
                    <h3 className="text-xl font-semibold text-white">
                        Formulaire du mois
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                        Les montants acceptent jusqu&apos;a 9 999 999 999,99 EUR.
                    </p>

                    <form onSubmit={submit} className="mt-6 space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <InputLabel
                                    htmlFor="month"
                                    value="Mois"
                                    className="text-slate-300"
                                />
                                <TextInput
                                    id="month"
                                    type="month"
                                    className="mt-2 block w-full border-white/10 bg-white/[0.03] text-white"
                                    value={data.month}
                                    onChange={(event) =>
                                        setData('month', event.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.month}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="revenue"
                                    value="Chiffre d'affaires"
                                    className="text-slate-300"
                                />
                                <TextInput
                                    id="revenue"
                                    type="number"
                                    min="0"
                                    max="9999999999.99"
                                    step="0.01"
                                    className="mt-2 block w-full border-white/10 bg-white/[0.03] text-white"
                                    value={data.revenue}
                                    onChange={(event) =>
                                        setData('revenue', event.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.revenue}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="charges"
                                    value="Charges"
                                    className="text-slate-300"
                                />
                                <TextInput
                                    id="charges"
                                    type="number"
                                    min="0"
                                    max="9999999999.99"
                                    step="0.01"
                                    className="mt-2 block w-full border-white/10 bg-white/[0.03] text-white"
                                    value={data.charges}
                                    onChange={(event) =>
                                        setData('charges', event.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.charges}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="marketing_budget"
                                    value="Budget marketing"
                                    className="text-slate-300"
                                />
                                <TextInput
                                    id="marketing_budget"
                                    type="number"
                                    min="0"
                                    max="9999999999.99"
                                    step="0.01"
                                    className="mt-2 block w-full border-white/10 bg-white/[0.03] text-white"
                                    value={data.marketing_budget}
                                    onChange={(event) =>
                                        setData(
                                            'marketing_budget',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={errors.marketing_budget}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="clients_count"
                                    value="Clients"
                                    className="text-slate-300"
                                />
                                <TextInput
                                    id="clients_count"
                                    type="number"
                                    min="0"
                                    max="999999"
                                    step="1"
                                    className="mt-2 block w-full border-white/10 bg-white/[0.03] text-white"
                                    value={data.clients_count}
                                    onChange={(event) =>
                                        setData(
                                            'clients_count',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={errors.clients_count}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        {recentlySuccessful && (
                            <p className="text-sm font-medium text-emerald-300">
                                Donnees enregistrees avec succes.
                            </p>
                        )}

                        <div className="pt-2">
                            <PrimaryButton disabled={processing}>
                                Enregistrer
                            </PrimaryButton>
                        </div>
                    </form>
                </section>

                <div className="space-y-6">
                    <section className="rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.015))] p-6 shadow-[0_25px_60px_rgba(2,6,23,0.22)]">
                        <h3 className="text-xl font-semibold text-white">
                            Derniere periode enregistree
                        </h3>
                        {latestRecord ? (
                            <div className="mt-5 space-y-4">
                                <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                                    <p className="text-sm text-slate-400">
                                        Mois
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold text-white">
                                        {latestRecord.month}
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                                        <p className="text-sm text-slate-400">
                                            Revenus
                                        </p>
                                        <p className="mt-2 text-xl font-semibold text-white">
                                            {formatCurrency(latestRecord.revenue)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                                        <p className="text-sm text-slate-400">
                                            Charges
                                        </p>
                                        <p className="mt-2 text-xl font-semibold text-white">
                                            {formatCurrency(latestRecord.charges)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                                        <p className="text-sm text-slate-400">
                                            Budget marketing
                                        </p>
                                        <p className="mt-2 text-xl font-semibold text-white">
                                            {formatCurrency(latestRecord.marketing_budget)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                                        <p className="text-sm text-slate-400">
                                            Clients
                                        </p>
                                        <p className="mt-2 text-xl font-semibold text-white">
                                            {latestRecord.clients_count}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5">
                                <p className="text-sm text-slate-300">
                                    Aucune periode n&apos;a encore ete enregistree.
                                </p>
                                <p className="mt-2 text-sm text-slate-400">
                                    Votre premiere saisie alimentera
                                    automatiquement le tableau de bord.
                                </p>
                            </div>
                        )}
                    </section>

                    <section className="rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.015))] p-6 shadow-[0_25px_60px_rgba(2,6,23,0.22)]">
                        <h3 className="text-xl font-semibold text-white">
                            Bonnes pratiques
                        </h3>
                        <ul className="mt-4 space-y-3 text-sm text-slate-400">
                            <li>Enregistrez un seul mois par ligne pour garder des KPI fiables.</li>
                            <li>Le nombre de clients doit rester coherent avec vos revenus du mois.</li>
                            <li>Apres chaque saisie, revenez au dashboard pour relire vos alertes.</li>
                        </ul>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
