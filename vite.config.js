import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    build: {
        // Chemin attendu par Laravel : public/build/manifest.json (pas .vite/manifest.json)
        manifest: 'manifest.json',
        outDir: 'public/build',
        emptyOutDir: true,
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/recharts')) {
                        return 'recharts';
                    }
                    if (id.includes('node_modules/framer-motion')) {
                        return 'framer-motion';
                    }
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
            },
        },
    },
});
