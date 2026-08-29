import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatHours, formatTime } from '@/lib/format';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Clock } from '@phosphor-icons/react';

export default function Hours({ entries = [], totalMinutes = 0 }) {
    return (
        <AppLayout>
            <Head title="Часы" />

            <PageHeader
                eyebrow="Учёт времени"
                title="Отработанные часы"
                subtitle={`Всего: ${formatHours(totalMinutes)}`}
            />

            <BezelCard padding="p-0">
                <div className="table-scroll">
                    <table className="w-full min-w-[480px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-[var(--bezel-ring)] bg-[var(--surface-muted)]">
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Дата
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Объект
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Начало
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Конец
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Длительность
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-12 text-center text-[var(--muted)]"
                                    >
                                        <Clock
                                            size={32}
                                            weight="light"
                                            className="mx-auto mb-3 opacity-40"
                                        />
                                        Записей пока нет
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry, i) => (
                                    <motion.tr
                                        key={entry.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: i * 0.04,
                                            duration: 0.6,
                                            ease: [0.32, 0.72, 0, 1],
                                        }}
                                        className="border-b border-[var(--bezel-ring)] last:border-0"
                                    >
                                        <td className="px-6 py-4 text-[var(--ink)]">
                                            {formatDate(entry.started_at)}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--muted)]">
                                            {entry.work_object?.name ?? '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {formatTime(entry.started_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {entry.ended_at
                                                ? formatTime(entry.ended_at)
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-[var(--accent)]">
                                            {formatHours(entry.worked_minutes)}
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </BezelCard>
        </AppLayout>
    );
}
