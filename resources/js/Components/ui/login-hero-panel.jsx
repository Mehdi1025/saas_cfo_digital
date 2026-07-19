import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const HERO_IMAGE =
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=2000&q=80';

export default function LoginHeroPanel() {
    return (
        <div className="relative hidden h-full w-full items-center justify-center overflow-hidden bg-gray-900 lg:flex">
            <motion.img
                src={HERO_IMAGE}
                alt="Gestion de factures et documents comptables"
                className="absolute inset-0 h-full w-full object-cover opacity-60"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />

            <motion.div
                className="absolute bottom-12 left-12 right-12 rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            >
                <Quote
                    className="mb-4 h-8 w-8 text-indigo-300/80"
                    strokeWidth={1.5}
                    aria-hidden="true"
                />
                <p className="text-lg leading-relaxed text-white/90">
                    Copifi a complètement transformé notre manière de gérer
                    notre facturation. Fluide, rapide et d&apos;une précision
                    chirurgicale.
                </p>
                <p className="mt-4 text-sm font-medium text-white/50">
                    Alexandre V. — CEO, Nexus Finance
                </p>
            </motion.div>
        </div>
    );
}
