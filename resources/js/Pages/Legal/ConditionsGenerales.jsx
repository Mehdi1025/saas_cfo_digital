import { Head, Link } from '@inertiajs/react';

const sections = [
    {
        title: 'Objet des conditions générales',
        content: [
            'Les présentes conditions générales encadrent l’accès et l’utilisation de Mini CFO Digital, une solution SaaS destinée à aider les entreprises à suivre leurs indicateurs financiers, leur facturation et leur pilotage mensuel.',
            'Elles ont pour objectif de préciser les règles principales applicables à l’utilisation du service, aux comptes utilisateurs, aux abonnements et aux responsabilités de chaque partie.',
        ],
    },
    {
        title: 'Accès au service',
        content: [
            'L’accès à certaines fonctionnalités nécessite la création d’un compte utilisateur, la vérification de l’adresse e-mail et, lorsque cela est requis, la souscription à une offre active.',
            'L’utilisateur s’engage à fournir des informations exactes, à conserver la confidentialité de ses identifiants et à signaler toute utilisation non autorisée de son compte.',
        ],
    },
    {
        title: 'Abonnement et paiement',
        content: [
            'Les fonctionnalités premium peuvent être soumises à abonnement. Les conditions tarifaires, la durée de l’abonnement et les modalités de paiement sont présentées avant toute validation.',
            'En cas d’échec de paiement, de suspension ou d’expiration de l’abonnement, l’accès à certaines fonctionnalités peut être limité jusqu’à régularisation.',
        ],
    },
    {
        title: 'Utilisation des données financières',
        content: [
            'L’utilisateur reste responsable des données financières, comptables ou commerciales qu’il saisit dans l’application.',
            'Mini CFO Digital fournit des outils d’analyse, de suivi et d’aide à la décision, mais ne remplace pas l’avis d’un expert-comptable, d’un conseiller financier ou d’un professionnel habilité.',
        ],
    },
    {
        title: 'Disponibilité et maintenance',
        content: [
            'L’équipe technique met en œuvre des moyens raisonnables pour assurer la disponibilité du service.',
            'Des interruptions temporaires peuvent toutefois intervenir pour des opérations de maintenance, de sécurité, d’amélioration ou en cas d’incident indépendant de la volonté de l’éditeur.',
        ],
    },
    {
        title: 'Responsabilités',
        content: [
            'L’utilisateur s’engage à utiliser le service conformément à sa destination, dans le respect de la loi et des droits des tiers.',
            'L’éditeur ne saurait être tenu responsable d’une mauvaise interprétation des indicateurs, d’une saisie erronée ou d’une décision prise exclusivement sur la base des données affichées dans l’application.',
        ],
    },
    {
        title: 'Évolution des conditions',
        content: [
            'Les présentes conditions générales peuvent être adaptées afin de tenir compte de l’évolution du service, du cadre légal ou des besoins opérationnels.',
            'La version publiée sur le site fait foi. Avant une mise en production officielle, les informations juridiques définitives devront être validées par l’entreprise ou son conseil.',
        ],
    },
];

export default function ConditionsGenerales() {
    return (
        <>
            <Head title="Conditions générales — Mini CFO Digital">
                <meta
                    name="description"
                    content="Consultez les conditions générales d'utilisation de Mini CFO Digital : accès au service, abonnement, données financières et responsabilités."
                />
            </Head>

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
                            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
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
                            Cadre d’utilisation
                        </p>
                        <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                            Conditions générales
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                            Cette page présente les règles principales liées à l’utilisation de Mini CFO Digital.
                            Elle doit servir de base claire avant validation juridique définitive.
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
