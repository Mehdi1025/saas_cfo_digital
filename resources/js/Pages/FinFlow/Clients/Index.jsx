import FacturationLayout from '@/Layouts/FacturationLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { countryOptionsForClientForm } from '@/utils/taxRates';
import {
    Building2,
    CircleDollarSign,
    Mail,
    Pencil,
    Phone,
    Plus,
    Search,
    Trash2,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const cardClass = 'rounded-xl border border-[#1e293b] bg-[#111827] p-5 shadow-sm';
const tableHeaderClass =
    'border-b border-slate-800/80 bg-[#151d2c] text-[10px] font-semibold uppercase tracking-wide text-slate-500';

function formatMoney(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(amount || 0);
}

function statusBadge(status) {
    if (status === 'Actif') {
        return 'bg-emerald-500/15 text-emerald-400';
    }

    return 'bg-amber-500/15 text-amber-400';
}

function initialValues(client) {
    return {
        name: client?.name ?? '',
        email: client?.email ?? '',
        type: client?.type ?? 'client',
        address: client?.address ?? '',
        delivery_address: client?.delivery_address ?? '',
        country_code: client ? (client.country_code || '') : 'FR',
        vat_number: client?.vat_number ?? '',
    };
}

function ClientModal({ open, onClose, selectedClient, countryOptions }) {
    const isEditing = Boolean(selectedClient);
    const form = useForm(initialValues(selectedClient));
    const [submitError, setSubmitError] = useState(null);

    function submit(e) {
        e.preventDefault();
        setSubmitError(null);

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (errors) => {
                if (Object.keys(errors).length === 0) {
                    setSubmitError(
                        'La session a expiré ou la requête a été rejetée. Rechargez la page puis réessayez.',
                    );
                }
            },
        };

        if (isEditing) {
            form.put(route('clients.update', selectedClient.id), options);
            return;
        }

        form.post(route('clients.store'), options);
    }

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#111827] shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">
                        {isEditing ? 'Modifier le client' : 'Ajouter un client'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4 px-6 py-5">
                    {submitError ? (
                        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                            {submitError}
                        </p>
                    ) : null}
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Nom
                        </label>
                        <input
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                        {form.errors.name ? <p className="mt-1 text-xs text-red-400">{form.errors.name}</p> : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Email
                            </label>
                            <input
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                            />
                            {form.errors.email ? (
                                <p className="mt-1 text-xs text-red-400">{form.errors.email}</p>
                            ) : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Type
                            </label>
                            <select
                                value={form.data.type}
                                onChange={(e) => form.setData('type', e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                            >
                                <option value="client">Client</option>
                                <option value="prospect">Prospect</option>
                            </select>
                            {form.errors.type ? <p className="mt-1 text-xs text-red-400">{form.errors.type}</p> : null}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Pays (TVA)
                        </label>
                        <select
                            value={form.data.country_code}
                            onChange={(e) => form.setData('country_code', e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        >
                            {countryOptions.map((country) => (
                                <option key={country.code || 'export'} value={country.code}>
                                    {country.label}
                                </option>
                            ))}
                        </select>
                        {form.errors.country_code ? (
                            <p className="mt-1 text-xs text-red-400">{form.errors.country_code}</p>
                        ) : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Numéro TVA
                        </label>
                        <input
                            value={form.data.vat_number}
                            onChange={(e) => form.setData('vat_number', e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                        {form.errors.vat_number ? (
                            <p className="mt-1 text-xs text-red-400">{form.errors.vat_number}</p>
                        ) : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Adresse
                        </label>
                        <textarea
                            value={form.data.address}
                            onChange={(e) => form.setData('address', e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                        {form.errors.address ? (
                            <p className="mt-1 text-xs text-red-400">{form.errors.address}</p>
                        ) : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Adresse de livraison
                        </label>
                        <textarea
                            value={form.data.delivery_address}
                            onChange={(e) => form.setData('delivery_address', e.target.value)}
                            rows={3}
                            placeholder="Si différente de l'adresse de facturation"
                            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                        {form.errors.delivery_address ? (
                            <p className="mt-1 text-xs text-red-400">{form.errors.delivery_address}</p>
                        ) : null}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                        >
                            {isEditing ? 'Enregistrer' : 'Créer client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ClientsIndex({ clients, stats, filters }) {
    const { tax_rates: taxRates = {} } = usePage().props;
    const countryOptions = useMemo(
        () => countryOptionsForClientForm(taxRates),
        [taxRates],
    );

    const [selectedId, setSelectedId] = useState(clients.data[0]?.id ?? null);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const selectedClient = useMemo(
        () => clients.data.find((client) => client.id === selectedId) ?? clients.data[0] ?? null,
        [clients.data, selectedId],
    );

    function openCreateModal() {
        setEditingClient(null);
        setShowModal(true);
    }

    function openEditModal() {
        if (!selectedClient) return;
        setEditingClient(selectedClient);
        setShowModal(true);
    }

    function runSearch(e) {
        e.preventDefault();
        router.get(
            route('clients.index'),
            { search },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function deleteSelected() {
        if (!selectedClient) return;
        if (!window.confirm(`Supprimer ${selectedClient.name} ?`)) return;

        router.delete(route('clients.destroy', selectedClient.id), {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Gestion des clients — Copifi" />
            <FacturationLayout
                title="Gestion des clients"
                description="Suivez vos clients, leurs revenus et les encours."
                headerActions={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-700 bg-[#111827] px-4 py-2 text-sm text-slate-200 transition hover:bg-[#1e293b]"
                        >
                            Importer CSV
                        </button>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                            <Plus className="h-4 w-4" />
                            Ajouter client
                        </button>
                    </div>
                }
            >
                <div className="min-w-0 space-y-6">
                    <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <article className={`${cardClass} min-w-0`}>
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-slate-400">Total Clients</p>
                                <Users className="h-5 w-5 text-blue-400" />
                            </div>
                            <p className="mt-2 text-3xl font-bold text-white">{stats.total_clients}</p>
                        </article>
                        <article className={`${cardClass} min-w-0`}>
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-slate-400">Clients Actifs</p>
                                <Building2 className="h-5 w-5 text-emerald-400" />
                            </div>
                            <p className="mt-2 text-3xl font-bold text-white">{stats.active_clients}</p>
                        </article>
                        <article className={`${cardClass} min-w-0`}>
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-slate-400">Chiffre d&apos;affaires</p>
                                <CircleDollarSign className="h-5 w-5 text-amber-400" />
                            </div>
                            <p className="mt-2 text-3xl font-bold text-white">{formatMoney(stats.total_revenue)}</p>
                        </article>
                        <article className={`${cardClass} min-w-0`}>
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-slate-400">Encours</p>
                                <Wallet className="h-5 w-5 text-red-400" />
                            </div>
                            <p className="mt-2 text-3xl font-bold text-white">
                                {formatMoney(stats.total_outstanding)}
                            </p>
                        </article>
                    </section>

                    <section className="grid min-w-0 gap-6 xl:grid-cols-12">
                        <div className="min-w-0 xl:col-span-8">
                            <div className="min-w-0 overflow-hidden rounded-xl border border-[#1e293b] bg-[#111827]">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                                    <form onSubmit={runSearch} className="relative w-full min-w-0 max-w-sm">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                        <input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Rechercher un client..."
                                            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500"
                                        />
                                    </form>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[760px] text-left text-sm">
                                        <thead>
                                            <tr className={tableHeaderClass}>
                                                <th className="px-4 py-3 font-medium">Client</th>
                                                <th className="px-4 py-3 font-medium">Statut</th>
                                                <th className="px-4 py-3 font-medium">Type</th>
                                                <th className="px-4 py-3 font-medium text-right">CA généré</th>
                                                <th className="px-4 py-3 font-medium text-right">Encours</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clients.data.map((client) => {
                                                const isSelected = client.id === selectedClient?.id;
                                                return (
                                                    <tr
                                                        key={client.id}
                                                        onClick={() => setSelectedId(client.id)}
                                                        className={`cursor-pointer border-t border-slate-800/80 transition ${
                                                            isSelected ? 'bg-blue-500/10' : 'hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3.5">
                                                            <p className="font-semibold text-slate-100">
                                                                {client.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {client.email || 'Aucun email'}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <span
                                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(client.status)}`}
                                                            >
                                                                {client.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-slate-300">
                                                            {client.type}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-semibold text-slate-100">
                                                            {formatMoney(client.revenue)}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-semibold text-amber-400">
                                                            {formatMoney(client.outstanding)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {clients.data.length === 0 ? (
                                                <tr className="border-t border-slate-800/80">
                                                    <td
                                                        colSpan={5}
                                                        className="px-4 py-10 text-center text-sm text-slate-500"
                                                    >
                                                        Aucun client trouvé.
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <aside className="min-w-0 xl:col-span-4">
                            <div className="min-w-0 rounded-xl border border-[#1e293b] bg-[#111827] p-5">
                                {selectedClient ? (
                                    <>
                                        <div className="mb-4">
                                            <h2 className="break-words text-xl font-semibold text-white">{selectedClient.name}</h2>
                                            <p className="mt-1 text-xs text-slate-500">ID: CLI-{selectedClient.id}</p>
                                        </div>

                                        <div className="mb-5 flex gap-2">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(
                                                    selectedClient.status,
                                                )}`}
                                            >
                                                {selectedClient.status}
                                            </span>
                                            <span className="inline-flex rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-400">
                                                {selectedClient.type.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="mb-6 grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                                            >
                                                Nouv. Devis
                                            </button>
                                            <button
                                                type="button"
                                                onClick={openEditModal}
                                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Modifier
                                            </button>
                                        </div>

                                        <div className="space-y-3 border-t border-slate-800 pt-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Contact principal
                                            </p>
                                            <p className="flex min-w-0 items-center gap-2 break-words text-sm text-slate-200">
                                                <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                                                {selectedClient.email || 'Email non renseigné'}
                                            </p>
                                            <p className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
                                                <Phone className="h-4 w-4 shrink-0 text-slate-500" />
                                                +33 00 00 00 00
                                            </p>
                                            <p className="break-words text-sm text-slate-400">
                                                {selectedClient.address || 'Adresse non renseignée'}
                                            </p>
                                            {selectedClient.delivery_address ? (
                                                <p className="break-words text-sm text-slate-400">
                                                    Livraison : {selectedClient.delivery_address}
                                                </p>
                                            ) : null}
                                            <p className="text-sm text-slate-400">
                                                Pays : {selectedClient.country_code || 'Export (0 %)'}
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                N° TVA : {selectedClient.vat_number || 'N/A'}
                                            </p>
                                        </div>

                                        <div className="mt-6 border-t border-slate-800 pt-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Santé financière
                                            </p>
                                            <div className="mt-3 rounded-lg border border-slate-800 bg-[#0f172a] p-3">
                                                <p className="text-sm text-slate-400">CA total</p>
                                                <p className="text-lg font-bold text-white">
                                                    {formatMoney(selectedClient.revenue)}
                                                </p>
                                                <p className="mt-2 text-sm text-slate-400">Encours</p>
                                                <p className="text-lg font-bold text-amber-400">
                                                    {formatMoney(selectedClient.outstanding)}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={deleteSelected}
                                            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Supprimer client
                                        </button>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-400">Sélectionnez un client pour voir les détails.</p>
                                )}
                            </div>
                        </aside>
                    </section>
                </div>
            </FacturationLayout>

            <ClientModal
                key={editingClient?.id ?? 'new'}
                open={showModal}
                onClose={() => setShowModal(false)}
                selectedClient={editingClient}
                countryOptions={countryOptions}
            />
        </>
    );
}
