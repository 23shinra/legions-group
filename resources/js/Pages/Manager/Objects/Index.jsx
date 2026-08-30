import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import SoftDatePicker from '@/Components/ui/SoftDatePicker';
import SoftSelect from '@/Components/ui/SoftSelect';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { brigadeTitle, formatDate } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Buildings, Plus } from '@phosphor-icons/react';
import { useState } from 'react';

export default function Index({ objects = [], brigades = [] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        address: '',
        brigade_id: brigades[0]?.id ?? '',
        start_date: new Date().toISOString().slice(0, 10),
        work_days: 30,
        status: 'active',
    });

    const openObject = (id) => {
        router.visit(route('manager.objects.show', id));
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('manager.objects.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setCreateOpen(false);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Объекты" />

            <PageHeader
                eyebrow="Стройка"
                title="Объекты"
                subtitle={`${objects.length} объектов`}
                actions={
                    <IslandButton
                        icon={Plus}
                        onClick={() => setCreateOpen((v) => !v)}
                    >
                        {createOpen ? 'Скрыть' : 'Новый объект'}
                    </IslandButton>
                }
            />

            {createOpen && (
                <BezelCard className="mb-6" padding="p-5 sm:p-6">
                    <h2 className="mb-4 text-lg font-bold">Создать объект</h2>
                    <form onSubmit={submitCreate} className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Название
                            </label>
                            <input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="input-soft"
                                placeholder="Объект №5"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Адрес
                            </label>
                            <input
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className="input-soft"
                                placeholder="г. Алматы, ул. ..."
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Бригада
                            </label>
                            <SoftSelect
                                value={data.brigade_id}
                                onChange={(next) => setData('brigade_id', next)}
                                options={[
                                    { value: '', label: 'Без бригады' },
                                    ...brigades.map((brigade) => ({
                                        value: brigade.id,
                                        label: brigadeTitle(brigade),
                                    })),
                                ]}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Смен на объекте
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={data.work_days}
                                onChange={(e) => setData('work_days', e.target.value)}
                                className="input-soft"
                            />
                            {errors.work_days && (
                                <p className="mt-1 text-sm text-red-600">{errors.work_days}</p>
                            )}
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Дата начала
                            </label>
                            <SoftDatePicker
                                value={data.start_date}
                                onChange={(next) => setData('start_date', next)}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Статус
                            </label>
                            <SoftSelect
                                value={data.status}
                                onChange={(next) => setData('status', next)}
                                options={[
                                    { value: 'planned', label: 'Планируется' },
                                    { value: 'active', label: 'В работе' },
                                    { value: 'completed', label: 'Завершён' },
                                ]}
                            />
                        </div>
                        <div className="flex items-end sm:col-span-2">
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

                                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                                    <div>
                                        <span className="text-[var(--muted)]">Смен: </span>
                                        <span className="font-semibold">{object.work_days ?? '—'}</span>
                                    </div>
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
