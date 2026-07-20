import { Head, Link } from '@inertiajs/react';

const sections = [
    {
        title: 'Éditeur du site',
        content: [
            'Le site Mini CFO Digital est édité dans le cadre du projet SaaS CFO Digital.',
            'Les informations légales définitives de la société éditrice devront être complétées avant la mise en production : dénomination sociale, forme juridique, capital social, adresse du siège, numéro SIRET/RCS et numéro de TVA intracommunautaire.',
        ],
    },
    {
        title: 'Responsable de publication',
        content: [
            'Le responsable de publication est le représentant légal de l’éditeur du site.',
            'Pour toute demande liée au contenu publié sur le site, vous pouvez utiliser l’adresse de contact indiquée dans la section contact.',
        ],
    },
    {
        title: 'Hébergement',
        content: [
            'Le site est hébergé par le prestataire technique choisi pour l’exploitation de l’application.',
            'Les coordonnées complètes de l’hébergeur devront être renseignées avant le déploiement en production.',
        ],
    },
    {
        title: 'Propriété intellectuelle',
        content: [
            'L’ensemble des contenus présents sur le site, notamment les textes, interfaces, éléments graphiques, logos et composants visuels, est protégé par les règles relatives à la propriété intellectuelle.',
            'Toute reproduction, représentation, modification ou diffusion sans autorisation préalable est interdite.',
        ],
    },
    {
        title: 'Données personnelles',
        content: [
            'Mini CFO Digital peut traiter certaines données personnelles nécessaires à la création de compte, à l’authentification, à la gestion de l’abonnement, à la facturation et à l’utilisation du tableau de bord financier.',
            'Ces traitements doivent respecter la réglementation applicable, notamment le RGPD. Les modalités détaillées sont précisées dans la politique de confidentialité.',
        ],
    },
    {
        title: 'Cookies',
        content: [
            'Le site peut utiliser des cookies nécessaires au fonctionnement de l’application, notamment pour la session utilisateur, la sécurité et l’authentification.',
            'Des cookies de mesure ou de services tiers ne doivent être activés qu’avec les informations et consentements requis.',
        ],
    },
    {
        title: 'Contact',
        content: [
            'Pour toute question concernant les mentions légales ou le fonctionnement du site, vous pouvez contacter l’équipe Mini CFO Digital à l’adresse suivante : contact@mini-cfo-digital.test.',
            'Cette adresse devra être remplacée par l’adresse officielle avant la mise en production.',
        ],
    },
];

export default function MentionsLegales() {
    return (
        <>
            <Head title="Mentions légales — Mini CFO Digital" />

            <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
                <div
                    className="pointer-events-none fixed inset-0"
                    aria-hidden
                    style={{
                        background:
                            'radial-gradient(ellipse at top left, rgba(17,83,77,0.42) 0%, transparent 34%), radial-gradient(circle at 80% 10%, rgba(16,185,129,0.12) 0%, transparent 28%)',
                    }}
                />
                <div
                    className="pointer-events-none fixed inset-0 opacity-70"
                    aria-hidden
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                        backgroundSize: '64px 64px',
                    }}
                />

                <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-8 lg:px-10">
                    <header className="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
                        <Link href="/" className="inline-flex w-fit items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-sm font-black text-black shadow-[0_0_28px_rgba(16,185,129,0.28)]">
                                CFO
                            </span>
                            <span className="leading-tight">
                                <span className="block text-sm font-black tracking-tight text-white">Mini CFO</span>
                                <span className="block text-xs font-semibold text-emerald-300">Digital</span>
                            </span>
                        </Link>

                        <Link
                            href="/"
                            className="inline-flex w-fit items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-white"
                        >
                            Retour à l’accueil
                        </Link>
                    </header>

                    <section className="py-12 sm:py-16">
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-300">
                            Informations légales
                        </p>
                        <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                            Mentions légales
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                            Cette page regroupe les informations légales relatives à l’édition, l’hébergement et
                            l’utilisation du site Mini CFO Digital. Certaines informations doivent être finalisées
                            avec les données officielles de l’entreprise avant la mise en production.
                        </p>
                    </section>

                    <section className="grid gap-4 pb-12">
                        {sections.map((section) => (
                            <article
                                key={section.title}
                                className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur"
                            >
                                <h2 className="text-lg font-bold text-white">{section.title}</h2>
                                <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
                                    {section.content.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </section>
                </div>
            </main>
        </>
    );
}
