import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                obsidian: '#09090B',
                neonBlue: '#00F0FF',
                neonMint: '#00FF9D',
                glass: 'rgba(255, 255, 255, 0.03)',
                glassBorder: 'rgba(255, 255, 255, 0.08)',
                finflow: {
                    bg: '#0b1120',
                    sidebar: '#151d2c',
                    surface: '#1e293b',
                    border: '#334155',
                    text: '#f8fafc',
                    muted: '#94a3b8',
                    accent: '#3b82f6',
                    teal: '#6ee7b7',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                },
            },
            boxShadow: {
                'finflow-glow': '0 0 20px rgba(59, 130, 246, 0.15)',
            },
            fontFamily: {
                /** Inter : corps, données, UI — chargée via Bunny dans `app.blade.php`. */
                sans: ['Inter', 'sans-serif'],
                /** PP Neue Montreal : titres — fichiers locaux + `@font-face` requis (voir doc équipe). */
                display: ['Syne', 'Inter', 'sans-serif'],
                finflow: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'neon-gradient':
                    'radial-gradient(circle at top left, rgba(0, 240, 255, 0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(0, 255, 157, 0.1), transparent 40%)',
                'card-gradient':
                    'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
            },
        },
    },

    plugins: [forms],
};
