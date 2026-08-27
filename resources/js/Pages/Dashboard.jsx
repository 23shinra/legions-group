import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Spinner } from '@phosphor-icons/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Перенаправление" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                className="flex min-h-[50dvh] flex-col items-center justify-center text-center"
            >
                <Spinner
                    size={32}
                    weight="light"
                    className="animate-spin text-[var(--accent)]"
                />
                <h1 className="mt-6 text-2xl font-bold text-[var(--ink)]">
                    Перенаправление…
                </h1>
                <p className="mt-2 max-w-sm text-[var(--muted)]">
                    Система определит вашу роль и откроет нужный раздел автоматически.
                </p>
            </motion.div>
        </AuthenticatedLayout>
    );
}
