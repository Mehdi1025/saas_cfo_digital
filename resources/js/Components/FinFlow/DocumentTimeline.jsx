import { motion } from 'framer-motion';
import {
    Ban,
    Banknote,
    Eye,
    FileCheck2,
    FilePlus,
    Send,
} from 'lucide-react';

const EVENT_CONFIG = {
    created: {
        label: 'Création',
        Icon: FilePlus,
        ring: 'ring-slate-500/30',
        bg: 'bg-slate-500/15',
        text: 'text-slate-300',
        dot: 'bg-slate-400',
    },
    sent: {
        label: 'Envoi',
        Icon: Send,
        ring: 'ring-blue-500/30',
        bg: 'bg-blue-500/15',
        text: 'text-blue-300',
        dot: 'bg-blue-400',
    },
    opened: {
        label: 'Ouverture email',
        Icon: Eye,
        ring: 'ring-fuchsia-500/30',
        bg: 'bg-fuchsia-500/15',
        text: 'text-fuchsia-300',
        dot: 'bg-fuchsia-400',
    },
    paid: {
        label: 'Paiement',
        Icon: Banknote,
        ring: 'ring-emerald-500/30',
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-300',
        dot: 'bg-emerald-400',
    },
    voided: {
        label: 'Avoir émis',
        Icon: Ban,
        ring: 'ring-amber-500/30',
        bg: 'bg-amber-500/15',
        text: 'text-amber-300',
        dot: 'bg-amber-400',
    },
    CDAR_STATUS_CHANGED: {
        label: 'Statut CDAR',
        Icon: FileCheck2,
        ring: 'ring-violet-500/30',
        bg: 'bg-violet-500/15',
        text: 'text-violet-300',
        dot: 'bg-violet-400',
    },
};

const listVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 320,
            damping: 24,
        },
    },
};

function resolveConfig(eventType) {
    return EVENT_CONFIG[eventType] ?? EVENT_CONFIG.created;
}

export default function DocumentTimeline({ events = [] }) {
    if (!events.length) {
        return (
            <div className="rounded-xl border border-slate-800/80 bg-[#111827]/60 p-4">
                <p className="text-xs text-slate-500">
                    Aucun événement enregistré pour le moment.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-800/80 bg-[#111827]/60 p-4">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Historique du document
            </p>
            <div className="relative pl-1">
                <div
                    className="absolute bottom-2 left-[15px] top-2 w-px bg-slate-700/80"
                    aria-hidden
                />
                <motion.ul
                    className="relative space-y-5"
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {events.map((event) => {
                        const config = resolveConfig(event.event_type);
                        const Icon = config.Icon;

                        return (
                            <motion.li
                                key={event.id}
                                variants={itemVariants}
                                className="relative flex gap-3 pl-0"
                            >
                                <div
                                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ${config.ring} ${config.bg}`}
                                >
                                    <Icon className={`h-3.5 w-3.5 ${config.text}`} strokeWidth={2} />
                                </div>
                                <div className="min-w-0 pt-0.5">
                                    <p className={`text-sm font-semibold ${config.text}`}>
                                        {event.description || config.label}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {event.created_at_label ?? '—'}
                                    </p>
                                </div>
                            </motion.li>
                        );
                    })}
                </motion.ul>
            </div>
        </div>
    );
}
