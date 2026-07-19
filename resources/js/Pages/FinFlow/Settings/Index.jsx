import FacturationLayout from '@/Layouts/FacturationLayout';
import ModalMandatFacturation from '@/Components/FinFlow/ModalMandatFacturation';
import { companyBrandColor } from '@/utils/company';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CreditCard,
    FileCheck2,
    Mail,
    Palette,
    MapPin,
    Plug,
    Plus,
    Shield,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

const inputClass =
    'w-full rounded-lg border border-slate-600/50 bg-[#0f172a] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30';

const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400';

function formatAcceptedAt(isoString) {
    if (!isoString) {
        return null;
    }

    return new Date(isoString).toLocaleString('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
    });
}

function ElectronicInvoicingToggle({ checked, disabled, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:ring-offset-2 focus:ring-offset-[#111827] ${
                disabled
                    ? 'cursor-not-allowed border-slate-700 bg-slate-800 opacity-50'
                    : checked
                      ? 'border-violet-500/50 bg-violet-600'
                      : 'border-slate-600 bg-slate-700'
            }`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    checked ? 'translate-x-5' : 'translate-x-1'
                } mt-0.5`}
            />
        </button>
    );
}

const TABS = [
    { id: 'branding', label: 'Profil & Branding', icon: Building2 },
    { id: 'billing', label: 'Facturation & Taxes', icon: CreditCard },
    { id: 'email', label: 'Emails & SMTP', icon: Mail },
    { id: 'integrations', label: 'Intégrations', icon: Plug },
    { id: 'security', label: 'Sécurité & 2FA', icon: Shield },
];

function SettingsTopBar({ processing, onCancel }) {
    return (
        <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-finflow-border/50 bg-finflow-sidebar px-6 shadow-sm lg:px-10">
            <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Configuration</p>
                <h1 className="text-lg font-semibold text-white">Paramètres de l&apos;application</h1>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border border-slate-600/60 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    form="settings-form"
                    disabled={processing}
                    className="rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] transition hover:bg-blue-600 disabled:opacity-50"
                >
                    {processing ? 'Enregistrement…' : 'Enregistrer'}
                </button>
            </div>
        </header>
    );
}

export default function SettingsIndex({ settings, destinations = [], mail, tax_rates, integrations }) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('branding');
    const [logoPreview, setLogoPreview] = useState(settings.logo_url);
    const [mandateModalOpen, setMandateModalOpen] = useState(false);
    const fileInputRef = useRef(null);

    const form = useForm({
        name: settings.name ?? '',
        address: settings.address ?? '',
        registration_number: settings.registration_number ?? '',
        vat_number: settings.vat_number ?? '',
        email: settings.email ?? '',
        phone: settings.phone ?? '',
        brand_color: settings.brand_color ?? '#3B82F6',
        electronic_invoicing_active: settings.electronic_invoicing_active ?? false,
        logo: null,
        remove_logo: false,
        destinations: destinations.map((item) => ({
            id: item.id,
            name: item.name,
            fee_per_day: item.fee_per_day,
        })),
    });

    const canActivateElectronicInvoicing = useMemo(() => {
        return Boolean(form.data.registration_number?.trim() && form.data.vat_number?.trim());
    }, [form.data.registration_number, form.data.vat_number]);

    const mandateAcceptedLabel = useMemo(
        () => formatAcceptedAt(settings.billing_mandate_accepted_at),
        [settings.billing_mandate_accepted_at],
    );

    const brandColor = useMemo(() => companyBrandColor(form.data), [form.data.brand_color]);

    function submit(e) {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            _method: 'put',
            electronic_invoicing_active: data.electronic_invoicing_active ? '1' : '0',
        }));
        form.post(route('parametres.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (form.data.logo) {
                    setLogoPreview(URL.createObjectURL(form.data.logo));
                } else if (form.data.remove_logo) {
                    setLogoPreview(null);
                }
                form.setData('logo', null);
                form.setData('remove_logo', false);
            },
        });
    }

    function onLogoChange(file) {
        if (!file) {
            return;
        }

        form.setData('logo', file);
        form.setData('remove_logo', false);
        setLogoPreview(URL.createObjectURL(file));
    }

    function removeLogo() {
        form.setData('logo', null);
        form.setData('remove_logo', true);
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function resetForm() {
        form.reset();
        form.setData(
            'destinations',
            destinations.map((item) => ({
                id: item.id,
                name: item.name,
                fee_per_day: item.fee_per_day,
            })),
        );
        setLogoPreview(settings.logo_url);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function addDestination() {
        form.setData('destinations', [
            ...form.data.destinations,
            { id: null, name: '', fee_per_day: 10 },
        ]);
    }

    function updateDestination(index, field, value) {
        const next = [...form.data.destinations];
        next[index] = { ...next[index], [field]: value };
        form.setData('destinations', next);
    }

    function removeDestination(index) {
        if (form.data.destinations.length <= 1) {
            return;
        }
        form.setData(
            'destinations',
            form.data.destinations.filter((_, i) => i !== index),
        );
    }

    function handleElectronicInvoicingToggle(nextChecked) {
        if (nextChecked) {
            if (!canActivateElectronicInvoicing) {
                return;
            }

            setMandateModalOpen(true);
            return;
        }

        form.setData('electronic_invoicing_active', false);
    }

    function confirmMandate() {
        form.setData('electronic_invoicing_active', true);
        setMandateModalOpen(false);
    }

    return (
        <>
            <Head title="Paramètres — Copifi" />
            <FacturationLayout
                title="Paramètres"
                showPageHeading={false}
                mainClassName="!px-0 !py-0"
                topBar={<SettingsTopBar processing={form.processing} onCancel={resetForm} />}
            >
                <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
                    <p className="mb-8 text-sm text-slate-400">
                        Gérez la configuration globale, le branding, la facturation et les intégrations.
                    </p>

                    {flash?.success ? (
                        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                            {flash.success}
                        </div>
                    ) : null}

                    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
                        <nav className="space-y-1">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const active = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                            active
                                                ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="rounded-2xl border border-slate-700/80 bg-[#111827] p-6 shadow-sm lg:p-8">
                            <form id="settings-form" onSubmit={submit}>
                                {activeTab === 'branding' ? (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">Profil Entreprise & Branding</h2>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Informations affichées sur vos factures et devis
                                            </p>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Logo de l&apos;entreprise</label>
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-600/50 bg-[#0f172a]">
                                                    {logoPreview ? (
                                                        <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                                                    ) : (
                                                        <div
                                                            className="flex h-12 w-12 items-center justify-center rounded-lg"
                                                            style={{ backgroundColor: brandColor }}
                                                        >
                                                            <div className="h-5 w-5 rotate-45 border-2 border-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div
                                                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-600/60 bg-[#0f172a]/60 px-6 py-8 text-center transition hover:border-blue-500/50"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            const file = e.dataTransfer.files?.[0];
                                                            if (file) {
                                                                onLogoChange(file);
                                                            }
                                                        }}
                                                    >
                                                        <Upload className="mb-2 h-6 w-6 text-slate-500" />
                                                        <p className="text-sm text-slate-300">
                                                            Glissez-déposez votre logo ici
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            PNG, JPG, SVG jusqu&apos;à 5 Mo (recommandé : 512×512 px)
                                                        </p>
                                                        <button
                                                            type="button"
                                                            className="mt-4 rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
                                                        >
                                                            Parcourir
                                                        </button>
                                                    </div>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                                        className="hidden"
                                                        onChange={(e) => onLogoChange(e.target.files?.[0])}
                                                    />
                                                    {logoPreview ? (
                                                        <button
                                                            type="button"
                                                            onClick={removeLogo}
                                                            className="mt-2 inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                            Supprimer le logo
                                                        </button>
                                                    ) : null}
                                                    {form.errors.logo ? (
                                                        <p className="mt-2 text-xs text-red-400">{form.errors.logo}</p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className={labelClass}>Nom de l&apos;entreprise</label>
                                                <input
                                                    value={form.data.name}
                                                    onChange={(e) => form.setData('name', e.target.value)}
                                                    className={inputClass}
                                                />
                                                {form.errors.name ? (
                                                    <p className="mt-1 text-xs text-red-400">{form.errors.name}</p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label className={labelClass}>SIRET</label>
                                                <input
                                                    value={form.data.registration_number}
                                                    onChange={(e) => form.setData('registration_number', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="14 chiffres"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>N° TVA intracommunautaire</label>
                                                <input
                                                    value={form.data.vat_number}
                                                    onChange={(e) => form.setData('vat_number', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="FR…"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Téléphone</label>
                                                <input
                                                    value={form.data.phone}
                                                    onChange={(e) => form.setData('phone', e.target.value)}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className={labelClass}>Adresse de facturation</label>
                                                <input
                                                    value={form.data.address}
                                                    onChange={(e) => form.setData('address', e.target.value)}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Email de contact</label>
                                                <input
                                                    type="email"
                                                    value={form.data.email}
                                                    onChange={(e) => form.setData('email', e.target.value)}
                                                    className={inputClass}
                                                />
                                                {form.errors.email ? (
                                                    <p className="mt-1 text-xs text-red-400">{form.errors.email}</p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                                                <Palette className="h-4 w-4 text-blue-400" />
                                                Couleurs de marque (PDF)
                                            </h3>
                                            <div className="max-w-xs">
                                                <label className={labelClass}>Couleur principale</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={form.data.brand_color}
                                                        onChange={(e) => form.setData('brand_color', e.target.value)}
                                                        className="h-11 w-14 cursor-pointer rounded-lg border border-slate-600 bg-transparent"
                                                    />
                                                    <input
                                                        value={form.data.brand_color}
                                                        onChange={(e) => form.setData('brand_color', e.target.value)}
                                                        className={`${inputClass} font-mono uppercase`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {activeTab === 'billing' ? (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">
                                                Conformité et Facturation Électronique
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Activez la transmission de vos factures via une Plateforme Agréée (Factur-X, CDAR).
                                            </p>

                                            <div className="mt-5 rounded-xl border border-slate-700/60 bg-[#0f172a] p-5">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                                                            <FileCheck2 className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">
                                                                Facturation électronique
                                                            </p>
                                                            <p className="mt-1 text-sm text-slate-400">
                                                                {form.data.electronic_invoicing_active
                                                                    ? 'Service activé — vos factures peuvent être transmises à la PA.'
                                                                    : 'Service désactivé — envoi par e-mail classique uniquement.'}
                                                            </p>
                                                            {mandateAcceptedLabel ? (
                                                                <p className="mt-2 text-xs text-slate-500">
                                                                    Mandat accepté le {mandateAcceptedLabel}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <ElectronicInvoicingToggle
                                                        checked={form.data.electronic_invoicing_active}
                                                        disabled={!canActivateElectronicInvoicing && !form.data.electronic_invoicing_active}
                                                        onChange={handleElectronicInvoicingToggle}
                                                    />
                                                </div>

                                                {!canActivateElectronicInvoicing && !form.data.electronic_invoicing_active ? (
                                                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                                                        <p>
                                                            Renseignez le SIRET et le numéro de TVA intracommunautaire dans
                                                            l&apos;onglet « Profil & Branding » avant d&apos;activer la
                                                            facturation électronique.
                                                        </p>
                                                    </div>
                                                ) : null}

                                                {form.errors.electronic_invoicing_active ? (
                                                    <p className="mt-3 text-xs text-red-400">
                                                        {form.errors.electronic_invoicing_active}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div>
                                            <h2 className="text-lg font-semibold text-white">Facturation & Taxes</h2>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Taux de TVA utilisés sur les factures et devis (configuration système).
                                            </p>
                                            <ul className="mt-4 space-y-2">
                                                {Object.entries(tax_rates || {}).map(([code, rate]) => (
                                                    <li
                                                        key={code}
                                                        className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-[#0f172a] px-4 py-3 text-sm"
                                                    >
                                                        <span className="text-slate-300">{code}</span>
                                                        <span className="font-semibold text-white">{rate}%</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <div className="mb-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                                                        <MapPin className="h-4 w-4 text-blue-400" />
                                                        Destinations & frais de port
                                                    </h3>
                                                    <p className="mt-1 text-sm text-slate-400">
                                                        Destinations proposées lors de la création de factures / devis produits.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addDestination}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Ajouter
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {form.data.destinations.map((destination, index) => (
                                                    <div
                                                        key={destination.id ?? `new-${index}`}
                                                        className="grid gap-3 rounded-lg border border-slate-700/60 bg-[#0f172a] p-4 sm:grid-cols-[1fr_140px_auto]"
                                                    >
                                                        <div>
                                                            <label className={labelClass}>Destination</label>
                                                            <input
                                                                value={destination.name}
                                                                onChange={(e) =>
                                                                    updateDestination(index, 'name', e.target.value)
                                                                }
                                                                className={inputClass}
                                                                placeholder="Ex. France"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={labelClass}>Frais / jour (€)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={destination.fee_per_day}
                                                                onChange={(e) =>
                                                                    updateDestination(
                                                                        index,
                                                                        'fee_per_day',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                className={inputClass}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="flex items-end justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeDestination(index)}
                                                                disabled={form.data.destinations.length <= 1}
                                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                                                                aria-label="Supprimer la destination"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {form.errors.destinations ? (
                                                <p className="mt-2 text-xs text-red-400">{form.errors.destinations}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}

                                {activeTab === 'email' ? (
                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold text-white">Emails & SMTP</h2>
                                        <p className="text-sm text-slate-400">
                                            Configuration lue depuis le fichier <code className="text-slate-300">.env</code> (sécurité).
                                        </p>
                                        <dl className="grid gap-3 sm:grid-cols-2">
                                            {[
                                                ['Transport', mail.mailer],
                                                ['Hôte SMTP', mail.host],
                                                ['Port', mail.port],
                                                ['Expéditeur', mail.from_address],
                                                ['Nom expéditeur', mail.from_name],
                                            ].map(([label, value]) => (
                                                <div key={label} className="rounded-lg border border-slate-700/60 bg-[#0f172a] px-4 py-3">
                                                    <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
                                                    <dd className="mt-1 text-sm font-medium text-white">{value ?? '—'}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                ) : null}

                                {activeTab === 'integrations' ? (
                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold text-white">Intégrations</h2>
                                        <div className="rounded-lg border border-slate-700/60 bg-[#0f172a] px-4 py-4">
                                            <p className="text-sm font-medium text-white">Groq — Analyse financière IA</p>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Statut :{' '}
                                                {integrations.groq_configured ? (
                                                    <span className="text-emerald-400">Configurée</span>
                                                ) : (
                                                    <span className="text-amber-400">Clé API manquante</span>
                                                )}
                                            </p>
                                            <p className="mt-2 text-xs text-slate-500">Modèle : {integrations.groq_model}</p>
                                        </div>
                                    </div>
                                ) : null}

                                {activeTab === 'security' ? (
                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold text-white">Sécurité & 2FA</h2>
                                        <p className="text-sm text-slate-400">
                                            Authentification à deux facteurs et politiques de sécurité — à venir dans une prochaine version.
                                        </p>
                                    </div>
                                ) : null}
                            </form>
                        </div>
                    </div>
                </div>
            </FacturationLayout>

            <ModalMandatFacturation
                isOpen={mandateModalOpen}
                onClose={() => setMandateModalOpen(false)}
                onConfirm={confirmMandate}
                companyName={form.data.name}
            />
        </>
    );
}
