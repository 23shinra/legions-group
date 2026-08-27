import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Buildings, UsersThree } from '@phosphor-icons/react';

export default function Index({ brigades = [] }) {
    const openBrigade = (id) => {
        router.visit(route('manager.brigades.show', id));
    };

    return (
        <AppLayout>
            <Head title="Бригады" />

            <PageHeader
                eyebrow="Структура"
                title="Бригады"
                subtitle={`${brigades.length} бригад в системе`}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {brigades.length === 0 ? (
                    <BezelCard className="md:col-span-2 lg:col-span-3" padding="p-10">
                        <p className="text-center text-[var(--muted)]">Бригады не найдены</p>
                    </BezelCard>
                ) : (
                    brigades.map((brigade, i) => (
                        <motion.div
                            key={brigade.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                            onClick={() => openBrigade(brigade.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    openBrigade(brigade.id);
                                }
                            }}
                            tabIndex={0}
                            role="link"
                            className="cursor-pointer outline-none transition-fluid active:scale-[0.99]"
                        >
                            <BezelCard padding="p-6" className="h-full transition-fluid hover:shadow-lift">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                            Бригада
                                        </p>
                                        <h3 className="mt-1 truncate text-xl font-extrabold tracking-tight">
                                            {brigade.name}
                                        </h3>
                                    </div>
                                    <UsersThree size={24} weight="light" className="shrink-0 text-[var(--accent)]" />
                                </div>

                                {brigade.brigadier && (
                                    <p className="mt-3 truncate text-sm text-[var(--muted)]">
                                        Бригадир: {brigade.brigadier.name}
                                    </p>
                                )}

                                {brigade.object && (
                                    <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                                        <Buildings size={16} weight="light" className="shrink-0" />
                                        <span className="truncate">{brigade.object.name}</span>
                                    </p>
                                )}

                                <div className="mt-4 flex items-center gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                                            Участников
                                        </p>
                                        <p className="text-lg font-bold">
                                            {brigade.members_count ?? brigade.membersCount ?? 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                                            На объекте
                                        </p>
                                        <p className="text-lg font-bold text-[var(--accent)]">
                                            {brigade.at_work ?? brigade.atWork ?? 0}
                                        </p>
                                    </div>
                                </div>

                                {brigade.status && (
                                    <div className="mt-4">
                                        <StatusBadge status={brigade.status} />
                                    </div>
                                )}
                            </BezelCard>
                        </motion.div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
