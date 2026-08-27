import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatHours, formatMoney } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, UsersThree } from '@phosphor-icons/react';

export default function Show({ object, brigades = [], stats = {}, settlement = null }) {
    const isClosed = Boolean(object?.closed_at) || object?.status === 'closed';
    const settlementData = settlement ?? object?.settlement;

    const handleClose = () => {
        if (confirm('Закрыть объект? Это действие нельзя отменить.')) {
            router.post(route('manager.objects.close', object.id));
        }
    };

    return (
        <AppLayout>
            <Head title={object?.name ?? 'Объект'} />

            <PageHeader
                eyebrow="Объект"
                title={object?.name ?? '—'}
                subtitle={object?.address}
                actions={
                    <div className="flex flex-wrap gap-3">
                        <IslandButton
                            href={route('manager.objects.index')}
                            icon={ArrowLeft}
                            variant="secondary"
                        >
                            Назад
                        </IslandButton>
                        {!isClosed && (
                            <IslandButton
                                onClick={handleClose}
                                icon={Lock}
                                variant="danger"
                            >
                                Закрыть объект
                            </IslandButton>
                        )}
                    </div>
                }
            />

            <div className="mb-6">
                <StatusBadge status={isClosed ? 'closed' : 'open'} />
            </div>

            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                <BezelCard padding="p-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Бригад</p>
                    <p className="mt-1 text-2xl font-bold">{stats.brigades_count ?? brigades.length}</p>
                </BezelCard>
                <BezelCard padding="p-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">На объекте</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--accent)]">{stats.workers_count ?? 0}</p>
                </BezelCard>
                <BezelCard padding="p-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Часы сегодня</p>
                    <p className="mt-1 text-2xl font-bold">{formatHours(stats.hours_today ?? 0)}</p>
                </BezelCard>
                <BezelCard padding="p-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Открыт</p>
                    <p className="mt-1 text-sm font-semibold">{formatDate(object?.start_date ?? object?.created_at)}</p>
                </BezelCard>
            </div>

            <BezelCard padding="p-0" className="mb-8">
                <div className="flex items-center gap-2 border-b border-[var(--bezel-ring)] px-6 py-4">
                    <UsersThree size={20} weight="light" className="text-[var(--accent)]" />
                    <h2 className="font-bold">Бригады на объекте</h2>
                </div>
                <ul className="divide-y divide-[var(--bezel-ring)]">
                    {brigades.length === 0 ? (
                        <li className="px-6 py-8 text-center text-[var(--muted)]">Нет бригад</li>
                    ) : (
                        brigades.map((brigade, i) => (
                            <motion.li
                                key={brigade.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                className="flex items-center justify-between px-6 py-4"
                            >
                                <div>
                                    <p className="font-semibold">{brigade.name}</p>
                                    {brigade.brigadier && (
                                        <p className="text-sm text-[var(--muted)]">
                                            {brigade.brigadier.name}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[var(--accent)]">
                                        {brigade.at_work ?? 0} / {brigade.members_count ?? 0}
                                    </p>
                                    <p className="text-xs text-[var(--muted)]">на объекте</p>
                                </div>
                            </motion.li>
                        ))
                    )}
                </ul>
            </BezelCard>

            {settlementData?.employees && (
                <BezelCard padding="p-0">
                    <div className="border-b border-[var(--bezel-ring)] px-6 py-4">
                        <h2 className="font-bold">Итоговый расчёт</h2>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            К выплате всем: {formatMoney(settlementData.total_remaining ?? 0)}
                        </p>
                    </div>
                    <div className="table-scroll">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-[var(--bezel-ring)] bg-[var(--surface-muted)]">
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Сотрудник</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Начислено</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Авансы</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Выплачено</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Остаток</th>
                                </tr>
                            </thead>
                            <tbody>
                                {settlementData.employees.map((row) => (
                                    <tr key={row.user_id} className="border-b border-[var(--bezel-ring)] last:border-0">
                                        <td className="px-6 py-4 font-semibold">{row.name}</td>
                                        <td className="px-6 py-4">{formatMoney(row.accrued)}</td>
                                        <td className="px-6 py-4">{formatMoney(row.advances)}</td>
                                        <td className="px-6 py-4">{formatMoney(row.paid)}</td>
                                        <td className="px-6 py-4 font-bold text-[var(--accent)]">{formatMoney(row.remaining)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </BezelCard>
            )}
        </AppLayout>
    );
}
