import '../css/app.css';
import './bootstrap';
import './echo';

import ErrorBoundary from '@/Components/ErrorBoundary';
import { registerServiceWorker } from './lib/pwa';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Legionis Group';

function scheduleServiceWorkerRegistration() {
    if (typeof window === 'undefined' || window.__lgSwScheduled) {
        return;
    }

    window.__lgSwScheduled = true;

    window.setTimeout(() => {
        registerServiceWorker().catch(() => {});
    }, 3000);
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ErrorBoundary>
                <App {...props} />
            </ErrorBoundary>,
        );
        el.dataset.mounted = '1';

        scheduleServiceWorkerRegistration();
    },
    progress: {
        color: '#4B5563',
    },
});
