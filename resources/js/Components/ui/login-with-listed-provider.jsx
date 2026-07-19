import FinFlowBrandLogo from '@/Components/FinFlow/FinFlowBrandLogo';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            delayChildren: 0.15,
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
};

const formVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.09, delayChildren: 0.05 },
    },
};

/**
 * Formulaire de connexion Copifi (sans layout — utilisé dans le split screen).
 */
export default function LoginWithListedProvider({
    email,
    password,
    remember,
    errors = {},
    processing = false,
    status,
    onEmailChange,
    onPasswordChange,
    onRememberChange,
    onSubmit,
}) {
    return (
        <motion.div
            className="w-full max-w-md space-y-8 text-gray-600"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="text-center" variants={itemVariants}>
                <FinFlowBrandLogo variant="color" size="md" className="mx-auto" />
                <div className="mt-6 space-y-2">
                    <h3 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                        Connectez-vous
                    </h3>
                    <p className="text-sm text-gray-500">
                        Gérez vos devis, factures et paiements en un seul
                        endroit.
                    </p>
                </div>
            </motion.div>

            {status ? (
                <motion.div
                    className="text-center text-sm font-medium text-green-600"
                    variants={itemVariants}
                >
                    {status}
                </motion.div>
            ) : null}

            <motion.form onSubmit={onSubmit} variants={formVariants}>
                <motion.div variants={itemVariants}>
                    <label className="font-medium">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={onEmailChange}
                        autoComplete="username"
                        required
                        autoFocus
                        className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2.5 text-gray-700 shadow-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    />
                    {errors.email ? (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.email}
                        </p>
                    ) : null}
                </motion.div>

                <motion.div className="mt-4" variants={itemVariants}>
                    <label className="font-medium">Mot de passe</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={password}
                        onChange={onPasswordChange}
                        autoComplete="current-password"
                        required
                        className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2.5 text-gray-700 shadow-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    />
                    {errors.password ? (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.password}
                        </p>
                    ) : null}
                </motion.div>

                <motion.div className="mt-4 block" variants={itemVariants}>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={remember}
                            onChange={onRememberChange}
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Se souvenir de moi
                        </span>
                    </label>
                </motion.div>

                <motion.button
                    type="submit"
                    disabled={processing}
                    variants={itemVariants}
                    whileHover={
                        processing ? undefined : { scale: 1.02, opacity: 0.95 }
                    }
                    whileTap={processing ? undefined : { scale: 0.98 }}
                    className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white duration-150 hover:bg-indigo-500 active:bg-indigo-600 disabled:opacity-50"
                >
                    <motion.span
                        animate={
                            processing
                                ? { opacity: [1, 0.45, 1] }
                                : { opacity: 1 }
                        }
                        transition={
                            processing
                                ? {
                                      duration: 1.2,
                                      repeat: Infinity,
                                      ease: 'easeInOut',
                                  }
                                : undefined
                        }
                    >
                        {processing
                            ? 'Connexion en cours...'
                            : 'Se connecter'}
                    </motion.span>
                </motion.button>
            </motion.form>
        </motion.div>
    );
}
