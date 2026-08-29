import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import SoftSelect from '@/Components/ui/SoftSelect';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Buildings, Plus, UsersThree } from '@phosphor-icons/react';
import { useState } from 'react';

export default function Index({ brigades = [], brigadiers = [] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        brigadier_id: '',
    });

    const openBrigade = (id) => {
        router.visit(route('manager.brigades.show', id));
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('manager.brigades.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setCreateOpen(false);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Бригады" />

            <PageHeader
                eyebrow="Структура"
                title="Бригады"
                subtitle={`${brigades.length} бригад в системе`}
                actions={
                    <IslandButton
                        icon={Plus}
                        onClick={() => setCreateOpen((v) => !v)}
                    >
                        {createOpen ? 'Скрыть' : 'Новая бригада'}
                    </IslandButton>
                }
            />

            {createOpen && (
                <BezelCard className="mb-6" padding="p-5 sm:p-6">
                    <h2 className="mb-4 text-lg font-bold">Создать бригаду</h2>
                    <form onSubmit={submitCreate} className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Название
                            </label>
                            <input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="input-soft"
                                placeholder="Бригада №5"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Бригадир
                            </label>
                            <SoftSelect
                                value={data.brigadier_id}
                                onChange={(next) => setData('brigadier_id', next)}
                                options={[
                                    { value: '', label: 'Позже' },
                                    ...brigadiers.map((user) => ({
                                        value: user.id,
                                        label: user.name,
                                    })),
                                ]}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] disabled:opacity-50"
                            >
                                Создать
                            </button>
                        </div>
                    </form>
                </BezelCard>
            )}

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
                                            {brigade.members_count ?? 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                                            На объекте
                                        </p>
                                        <p className="text-lg font-bold text-[var(--accent)]">
                                            {brigade.at_work ?? 0}
                                        </p>
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
