import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                'vs-dark': '#0F172A',
                'vs-card': '#1E293B',
                'vs-accent': '#3B82F6',
                'vs-success': '#10B981',
                'vs-warning': '#F59E0B',
                'vs-error': '#EF4444',
                'vs-text': '#F1F5F9',
                'vs-text-secondary': '#94A3B8',
                'vs-border': '#334155',
            },
        },
    },
    plugins: [],
};

export default config;
