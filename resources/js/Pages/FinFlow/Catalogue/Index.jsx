import FacturationLayout from '@/Layouts/FacturationLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Box,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    ImagePlus,
    Layers,
    LayoutGrid,
    List,
    MoreVertical,
    Package,
    Plus,
    Search,
    Wrench,
    X,
} from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

const cardClass = 'relative overflow-hidden rounded-xl border border-[#1e293b] bg-[#111827] p-5 shadow-sm';

function formatMoney(amount, decimals = 2) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount || 0);
}

function typeBadgeClass(type) {
    if (type === 'bundle') {
        return 'bg-violet-500/15 text-violet-400';
    }
    if (type === 'product') {
        return 'bg-emerald-500/15 text-emerald-400';
    }
    return 'bg-blue-500/15 text-blue-400';
}

function ProductIcon({ type, className = 'h-5 w-5' }) {
    if (type === 'bundle') {
        return <Layers className={className} strokeWidth={2} />;
    }
    if (type === 'product') {
        return <Package className={className} strokeWidth={2} />;
    }
    return <Wrench className={className} strokeWidth={2} />;
}

function ArticleThumbnail({ article, size = 'md' }) {
    const sizeClass = size === 'lg' ? 'h-14 w-14 rounded-xl' : 'h-9 w-9 rounded-lg';

    if (article.image_url) {
        return (
            <img
                src={article.image_url}
                alt={article.designation}
                className={`${sizeClass} shrink-0 border border-slate-700 object-cover`}
            />
        );
    }

    return (
        <div
            className={`flex shrink-0 items-center justify-center ${sizeClass} ${iconWrapClass(article.type)}`}
        >
            <ProductIcon type={article.type} className={size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} />
        </div>
    );
}

function iconWrapClass(type) {
    if (type === 'bundle') {
        return 'bg-violet-500/15 text-violet-400';
    }
    if (type === 'product') {
        return 'bg-emerald-500/15 text-emerald-400';
    }
    return 'bg-blue-500/15 text-blue-400';
}

const OPERATION_CATEGORY_OPTIONS = [
    { value: 'bien', label: 'Bien' },
    { value: 'service', label: 'Service' },
    { value: 'mixte', label: 'Mixte' },
];

function operationCategoryFromType(type) {
    if (type === 'product') {
        return 'bien';
    }
    if (type === 'bundle') {
        return 'mixte';
    }
    return 'service';
}

function initialValues(article) {
    return {
        designation: article?.designation ?? '',
        sku: article?.sku ?? '',
        description: article?.description ?? '',
        type: article?.type ?? 'service',
        operation_category:
            article?.operation_category ?? operationCategoryFromType(article?.type ?? 'service'),
        category: article?.category ?? '',
        price_ht: article?.price_ht ?? '',
        price_type: article?.price_type ?? 'fixed',
        photo: null,
        remove_image: false,
    };
}

function SalesSparkline({ data }) {
    const gradId = useId().replace(/:/g, '');

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-80" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`sales-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        fill={`url(#sales-${gradId})`}
                        dot={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function ArticleModal({ open, onClose, selectedArticle, categories }) {
    const isEditing = Boolean(selectedArticle);
    const form = useForm(initialValues(selectedArticle));
    const [previewUrl, setPreviewUrl] = useState(selectedArticle?.image_url ?? null);

    useEffect(() => {
        if (!open) {
            return;
        }

        form.setData(initialValues(selectedArticle));
        setPreviewUrl(selectedArticle?.image_url ?? null);
    }, [open, selectedArticle?.id]);

    useEffect(() => {
        if (!form.data.photo) {
            if (!form.data.remove_image) {
                setPreviewUrl(selectedArticle?.image_url ?? null);
            }
            return;
        }

        const objectUrl = URL.createObjectURL(form.data.photo);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [form.data.photo, form.data.remove_image, selectedArticle?.image_url]);

    function submit(e) {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => onClose(),
        };

        if (isEditing) {
            form.transform((data) => ({
                ...data,
                _method: 'put',
            }));
            form.post(route('catalogue.update', selectedArticle.id), options);
            return;
        }

        form.post(route('catalogue.store'), options);
    }

    function handlePhotoChange(e) {
        const file = e.target.files?.[0] ?? null;
        form.setData('photo', file);
        if (file) {
            form.setData('remove_image', false);
        }
    }

    function removePhoto() {
        form.setData('photo', null);
        form.setData('remove_image', true);
        setPreviewUrl(null);
    }

    if (!open) {
        return null;
    }

    const inputClass =
        'w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#111827] shadow-2xl">
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-[#111827] px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">
                        {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
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
                    <div className="rounded-xl border border-dashed border-slate-700 bg-[#0f172a]/60 p-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Photo du produit
                        </label>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-[#111827]">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Aperçu"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ImagePlus className="h-8 w-8 text-slate-600" strokeWidth={1.5} />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500">
                                    <ImagePlus className="h-4 w-4" />
                                    Choisir une photo
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handlePhotoChange}
                                    />
                                </label>
                                {previewUrl ? (
                                    <button
                                        type="button"
                                        onClick={removePhoto}
                                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                                    >
                                        Retirer
                                    </button>
                                ) : null}
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">JPG, PNG ou WebP — max. 2 Mo</p>
                        {form.errors.photo ? (
                            <p className="mt-1 text-xs text-red-400">{form.errors.photo}</p>
                        ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Nom du produit / service
                            </label>
                            <input
                                value={form.data.designation}
                                onChange={(e) => form.setData('designation', e.target.value)}
                                className={inputClass}
                            />
                            {form.errors.designation ? (
                                <p className="mt-1 text-xs text-red-400">{form.errors.designation}</p>
                            ) : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                SKU
                            </label>
                            <input
                                value={form.data.sku}
                                onChange={(e) => form.setData('sku', e.target.value.toUpperCase())}
                                className={inputClass}
                                placeholder="LIC-ENT-Y"
                            />
                            {form.errors.sku ? <p className="mt-1 text-xs text-red-400">{form.errors.sku}</p> : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Type
                            </label>
                            <select
                                value={form.data.type}
                                onChange={(e) => {
                                    const type = e.target.value;
                                    form.setData((data) => ({
                                        ...data,
                                        type,
                                        operation_category: operationCategoryFromType(type),
                                    }));
                                }}
                                className={inputClass}
                            >
                                <option value="service">Service</option>
                                <option value="bundle">Bundle</option>
                                <option value="product">Produit</option>
                            </select>
                            {form.errors.type ? <p className="mt-1 text-xs text-red-400">{form.errors.type}</p> : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Catégorie d&apos;opération
                            </label>
                            <select
                                value={form.data.operation_category}
                                onChange={(e) => form.setData('operation_category', e.target.value)}
                                className={inputClass}
                            >
                                {OPERATION_CATEGORY_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {form.errors.operation_category ? (
                                <p className="mt-1 text-xs text-red-400">{form.errors.operation_category}</p>
                            ) : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Catégorie
                            </label>
                            <input
                                list="catalog-categories"
                                value={form.data.category}
                                onChange={(e) => form.setData('category', e.target.value)}
                                className={inputClass}
                                placeholder="Logiciel SaaS"
                            />
                            <datalist id="catalog-categories">
                                {categories.map((cat) => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                            {form.errors.category ? (
                                <p className="mt-1 text-xs text-red-400">{form.errors.category}</p>
                            ) : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Prix HT
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.data.price_ht}
                                onChange={(e) => form.setData('price_ht', e.target.value)}
                                className={inputClass}
                            />
                            {form.errors.price_ht ? (
                                <p className="mt-1 text-xs text-red-400">{form.errors.price_ht}</p>
                            ) : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Unité de prix
                            </label>
                            <select
                                value={form.data.price_type}
                                onChange={(e) => form.setData('price_type', e.target.value)}
                                className={inputClass}
                            >
                                <option value="fixed">Forfait (/fixe)</option>
                                <option value="year">Annuel (/an)</option>
                                <option value="hour">Horaire (/h)</option>
                                <option value="month">Mensuel (/mois)</option>
                                <option value="unit">Unitaire (/unité)</option>
                            </select>
                            {form.errors.price_type ? (
                                <p className="mt-1 text-xs text-red-400">{form.errors.price_type}</p>
                            ) : null}
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Description
                            </label>
                            <textarea
                                rows={3}
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                className={inputClass}
                            />
                            {form.errors.description ? (
                                <p className="mt-1 text-xs text-red-400">{form.errors.description}</p>
                            ) : null}
                        </div>
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
                            {isEditing ? 'Enregistrer' : 'Créer le produit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function RowActions({ article, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
                aria-label="Actions"
            >
                <MoreVertical className="h-4 w-4" />
            </button>
            {open ? (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                        aria-label="Fermer le menu"
                    />
                    <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-slate-700 bg-[#0f172a] py-1 shadow-xl">
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onEdit(article);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                        >
                            Modifier
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onDelete(article);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                        >
                            Supprimer
                        </button>
                    </div>
                </>
            ) : null}
        </div>
    );
}

export default function CatalogueIndex({ articles, stats, filters, categories }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [viewMode, setViewMode] = useState('list');
    const [showModal, setShowModal] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filterType, setFilterType] = useState(filters.type ?? '');
    const [selectedIds, setSelectedIds] = useState([]);

    const exportUrl = useMemo(() => {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.category) params.set('category', filters.category);
        if (filters.type) params.set('type', filters.type);
        const qs = params.toString();
        return route('catalogue.export') + (qs ? `?${qs}` : '');
    }, [filters]);

    function applyFilters(overrides = {}) {
        router.get(
            route('catalogue.index'),
            {
                search,
                category: overrides.category ?? filters.category,
                type: overrides.type ?? filterType,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function runSearch(e) {
        e.preventDefault();
        applyFilters({ category: filters.category, type: filterType });
    }

    function clearCategoryFilter() {
        applyFilters({ category: '', type: filterType });
    }

    function openCreate() {
        setEditingArticle(null);
        setShowModal(true);
    }

    function openEdit(article) {
        setEditingArticle(article);
        setShowModal(true);
    }

    function deleteArticle(article) {
        if (!window.confirm(`Supprimer « ${article.designation} » ?`)) return;
        router.delete(route('catalogue.destroy', article.id), { preserveScroll: true });
    }

    function toggleSelectAll(checked) {
        setSelectedIds(checked ? articles.data.map((a) => a.id) : []);
    }

    function toggleSelect(id) {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    const allSelected = articles.data.length > 0 && selectedIds.length === articles.data.length;

    return (
        <>
            <Head title="Catalogue de Produits — Copifi" />
            <FacturationLayout
                title="Catalogue de Produits"
                description="Gérez vos articles, services et bundles d'abonnement."
                showPageHeading={false}
                mainClassName="!px-6 !py-6 lg:!px-10"
            >
                <nav className="mb-4 text-sm text-slate-500">
                    <Link href={route('catalogue.index')} className="hover:text-slate-300">
                        Catalogue
                    </Link>
                    <span className="mx-2">›</span>
                    <span className="text-slate-300">Produits &amp; Services</span>
                </nav>

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Catalogue de Produits
                        </h1>
                        <p className="mt-1 text-sm text-slate-400 sm:text-base">
                            Gérez vos articles, services et bundles d&apos;abonnement.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={exportUrl}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/5"
                        >
                            <Download className="h-4 w-4" strokeWidth={2} />
                            Exporter
                        </a>
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] transition hover:bg-blue-600"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            Nouveau Produit
                        </button>
                    </div>
                </div>

                <section className="mb-6 grid gap-4 lg:grid-cols-3">
                    <article className={cardClass}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Total SKUs</p>
                                <p className="mt-2 text-3xl font-bold text-white">{stats.total_skus}</p>
                                <p className="mt-1 text-xs font-medium text-emerald-400">
                                    +{stats.skus_this_week} cette semaine
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
                                <Box className="h-5 w-5" strokeWidth={2} />
                            </div>
                        </div>
                    </article>

                    <article className={`${cardClass} min-h-[120px]`}>
                        <SalesSparkline data={stats.sales_chart} />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Ventes du Mois</p>
                                <p className="mt-2 text-3xl font-bold text-white">
                                    {formatMoney(stats.monthly_sales, 0)}
                                </p>
                                <span className="mt-1 inline-flex rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                                    +{stats.sales_growth}%
                                </span>
                            </div>
                        </div>
                    </article>

                    <article className={cardClass}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Bundles Actifs</p>
                                <p className="mt-2 text-3xl font-bold text-white">{stats.active_bundles}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Générant {stats.bundle_revenue_share}% du CA global
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                                <Layers className="h-5 w-5" strokeWidth={2} />
                            </div>
                        </div>
                    </article>
                </section>

                <section className="overflow-hidden rounded-xl border border-[#1e293b] bg-[#111827]">
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-4 py-3">
                        <form onSubmit={runSearch} className="relative min-w-[220px] flex-1 sm:max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher par SKU, nom..."
                                className="w-full rounded-lg border border-slate-700 bg-[#0f172a] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500"
                            />
                        </form>

                        <button
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                        >
                            <Filter className="h-4 w-4" />
                            Filtres
                        </button>

                        {filters.category ? (
                            <button
                                type="button"
                                onClick={clearCategoryFilter}
                                className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-400"
                            >
                                {filters.category}
                                <X className="h-3 w-3" />
                            </button>
                        ) : null}

                        <div className="ml-auto flex rounded-lg border border-slate-700 bg-[#0f172a] p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`rounded-md p-2 transition ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                aria-label="Vue liste"
                            >
                                <List className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`rounded-md p-2 transition ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                aria-label="Vue grille"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {showFilters ? (
                        <div className="flex flex-wrap items-end gap-3 border-b border-slate-800 bg-[#0f172a]/50 px-4 py-3">
                            <label className="block">
                                <span className="mb-1 block text-xs text-slate-500">Type</span>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white"
                                >
                                    <option value="">Tous</option>
                                    <option value="service">Service</option>
                                    <option value="bundle">Bundle</option>
                                    <option value="product">Produit</option>
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs text-slate-500">Catégorie</span>
                                <select
                                    defaultValue={filters.category}
                                    id="filter-category"
                                    className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white"
                                >
                                    <option value="">Toutes</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    const cat = document.getElementById('filter-category')?.value ?? '';
                                    applyFilters({ category: cat, type: filterType });
                                    setShowFilters(false);
                                }}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                            >
                                Appliquer
                            </button>
                        </div>
                    ) : null}

                    {viewMode === 'list' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-[#151d2c] text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                        <th className="w-10 px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={(e) => toggleSelectAll(e.target.checked)}
                                                className="rounded border-slate-600 bg-transparent"
                                            />
                                        </th>
                                        <th className="px-4 py-3 font-medium">Produit / SKU</th>
                                        <th className="px-4 py-3 font-medium">Type</th>
                                        <th className="px-4 py-3 font-medium">Catégorie</th>
                                        <th className="px-4 py-3 font-medium">Prix HT</th>
                                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {articles.data.map((article) => (
                                        <tr
                                            key={article.id}
                                            className="border-t border-slate-800/80 transition hover:bg-white/[0.02]"
                                        >
                                            <td className="px-4 py-3.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(article.id)}
                                                    onChange={() => toggleSelect(article.id)}
                                                    className="rounded border-slate-600 bg-transparent"
                                                />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <ArticleThumbnail article={article} />
                                                    <div>
                                                        <p className="font-semibold text-slate-100">
                                                            {article.designation}
                                                        </p>
                                                        <p className="text-xs text-slate-500">{article.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadgeClass(article.type)}`}
                                                >
                                                    {article.type_label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-300">{article.category}</td>
                                            <td className="px-4 py-3.5 font-semibold tabular-nums text-slate-100">
                                                {formatMoney(article.price_ht)}{' '}
                                                <span className="font-normal text-slate-500">
                                                    {article.price_suffix}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <RowActions
                                                    article={article}
                                                    onEdit={openEdit}
                                                    onDelete={deleteArticle}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {articles.data.length === 0 ? (
                                        <tr className="border-t border-slate-800/80">
                                            <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                                                Aucun produit trouvé.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                            {articles.data.map((article) => (
                                <article
                                    key={article.id}
                                    className="overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a] transition hover:border-slate-600"
                                >
                                    {article.image_url ? (
                                        <div className="relative h-36 w-full bg-[#111827]">
                                            <img
                                                src={article.image_url}
                                                alt={article.designation}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : null}
                                    <div className="p-4">
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        {!article.image_url ? (
                                            <ArticleThumbnail article={article} size="lg" />
                                        ) : (
                                            <div className="min-w-0 flex-1" />
                                        )}
                                        <RowActions article={article} onEdit={openEdit} onDelete={deleteArticle} />
                                    </div>
                                    <h3 className="font-semibold text-white">{article.designation}</h3>
                                    <p className="text-xs text-slate-500">{article.sku}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${typeBadgeClass(article.type)}`}
                                        >
                                            {article.type_label}
                                        </span>
                                        <span className="text-xs text-slate-400">{article.category}</span>
                                    </div>
                                    <p className="mt-3 text-lg font-bold text-white">
                                        {formatMoney(article.price_ht)}{' '}
                                        <span className="text-sm font-normal text-slate-500">
                                            {article.price_suffix}
                                        </span>
                                    </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-sm text-slate-400">
                        <p>
                            Affichage de {articles.meta.from} à {articles.meta.to} sur {articles.meta.total}
                        </p>
                        <div className="flex items-center gap-1">
                            {articles.links.map((link, index) => {
                                if (link.label.includes('Previous') || link.label.includes('&laquo;')) {
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`rounded-lg border border-slate-700 p-2 transition ${link.url ? 'hover:bg-white/5' : 'pointer-events-none opacity-40'}`}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Link>
                                    );
                                }
                                if (link.label.includes('Next') || link.label.includes('&raquo;')) {
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`rounded-lg border border-slate-700 p-2 transition ${link.url ? 'hover:bg-white/5' : 'pointer-events-none opacity-40'}`}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                </section>
            </FacturationLayout>

            <ArticleModal
                key={editingArticle?.id ?? 'new'}
                open={showModal}
                onClose={() => setShowModal(false)}
                selectedArticle={editingArticle}
                categories={categories}
            />
        </>
    );
}
