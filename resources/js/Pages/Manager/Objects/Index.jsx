import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Buildings } from '@phosphor-icons/react';

export default function Index({ objects = [] }) {
    const openObject = (id) => {
        router.visit(route('manager.objects.show', id));
    };

    return (
        <AppLayout>
            <Head title="Объекты" />

            <PageHeader
                eyebrow="Стройка"
                title="Объекты"
                subtitle={`${objects.length} объектов`}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {objects.length === 0 ? (
                    <BezelCard className="md:col-span-2" padding="p-10">
                        <Buildings size={32} weight="light" className="mx-auto mb-3 text-[var(--muted)] opacity-40" />
                        <p className="text-center text-[var(--muted)]">Объекты не найдены</p>
                    </BezelCard>
                ) : (
                    objects.map((object, i) => (
                        <motion.div
                            key={object.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                            onClick={() => openObject(object.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    openObject(object.id);
                                }
                            }}
                            tabIndex={0}
                            role="link"
                            className="cursor-pointer outline-none transition-fluid active:scale-[0.99]"
                        >
                            <BezelCard padding="p-6" className="h-full transition-fluid hover:shadow-lift">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h3 className="truncate text-xl font-extrabold tracking-tight">
                                            {object.name}
                                        </h3>
                                        {object.address && (
                                            <p className="mt-1 truncate text-sm text-[var(--muted)]">
                                                {object.address}
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs text-[var(--muted)]">
                                            Открыт: {formatDate(object.opened_at ?? object.created_at ?? object.start_date)}
                                        </p>
                                    </div>
                                    <StatusBadge status={object.status ?? (object.closed_at ? 'closed' : 'open')} />
                                </div>

                                <div className="mt-4 flex items-center gap-6 text-sm">
                                    <div>
                                        <span className="text-[var(--muted)]">Бригад: </span>
                                        <span className="font-semibold">{object.brigades_count ?? (object.brigade ? 1 : 0)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[var(--muted)]">На объекте: </span>
                                        <span className="font-semibold text-[var(--accent)]">
                                            {object.workers_count ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </BezelCard>
                        </motion.div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
