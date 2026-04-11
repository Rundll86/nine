import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: [],
        include: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
