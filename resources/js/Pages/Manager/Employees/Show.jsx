import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import StatPill from '@/Components/ui/StatPill';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatHours, formatMoney, formatTime } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CurrencyCircleDollar, Wallet } from '@phosphor-icons/react';

export default function Show({ employee, balance = {}, recentEntries = [], recentAdvances = [] }) {
    return (
        <AppLayout>
            <Head title={employee?.name ?? 'Сотрудник'} />

            <PageHeader
                eyebrow="Сотрудник"
                title={employee?.name ?? '—'}
                subtitle={[employee?.position, employee?.brigade?.name, employee?.phone]
                    .filter(Boolean)
                    .join(' · ') || undefined}
                actions={
                    <IslandButton
                        href={route('manager.employees.index')}
                        icon={ArrowLeft}
                        variant="secondary"
                    >
                        Назад
                    </IslandButton>
                }
            />

            <div className="mb-6 flex flex-wrap gap-3">
                <StatusBadge
                    status={employee?.is_working ? 'working' : 'absent'}
                />
                {employee?.brigade && (
                    <span className="rounded-full bg-[var(--bezel)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                        {employee.brigade.name}
                    </span>
                )}
                {employee?.role && (
                    <span className="rounded-full bg-[var(--bezel)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                        {employee.role}
                    </span>
                )}
            </div>

            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatPill label="Начислено" value={formatMoney(balance.accrued)} icon={Wallet} />
                <StatPill label="Авансы" value={formatMoney(balance.advances)} icon={CurrencyCircleDollar} />
                <StatPill label="Выплачено" value={formatMoney(balance.paid)} />
                <StatPill label="К выплате" value={formatMoney(balance.remaining)} accent />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <BezelCard padding="p-0">
                    <div className="flex items-center gap-2 border-b border-[var(--bezel-ring)] px-6 py-4">
                        <Clock size={20} weight="light" className="text-[var(--accent)]" />
                        <h2 className="font-bold">Последние смены</h2>
                    </div>
                    <ul className="divide-y divide-[var(--bezel-ring)]">
                        {recentEntries.length === 0 ? (
                            <li className="px-6 py-8 text-center text-[var(--muted)]">Нет записей</li>
                        ) : (
                            recentEntries.map((entry) => (
                                <li key={entry.id} className="px-6 py-4">
                                    <div className="flex justify-between gap-4">
                                        <div>
                                            <p className="font-medium">{formatDate(entry.started_at)}</p>
                                            <p className="text-sm text-[var(--muted)]">
                                                {entry.object?.name ?? '—'}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p>{formatTime(entry.started_at)} — {entry.ended_at ? formatTime(entry.ended_at) : '…'}</p>
                                            <p className="font-semibold text-[var(--accent)]">
                                                {formatHours(entry.duration_minutes)}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </BezelCard>

                <BezelCard padding="p-0">
                    <div className="flex items-center gap-2 border-b border-[var(--bezel-ring)] px-6 py-4">
                        <CurrencyCircleDollar size={20} weight="light" className="text-[var(--accent)]" />
                        <h2 className="font-bold">Авансы</h2>
                    </div>
                    <ul className="divide-y divide-[var(--bezel-ring)]">
                        {recentAdvances.length === 0 ? (
                            <li className="px-6 py-8 text-center text-[var(--muted)]">Нет авансов</li>
                        ) : (
                            recentAdvances.map((advance) => (
                                <li key={advance.id} className="flex items-center justify-between px-6 py-4">
                                    <div>
                                        <p className="font-semibold">{formatMoney(advance.amount)}</p>
                                        <p className="text-sm text-[var(--muted)]">{formatDate(advance.created_at)}</p>
                                    </div>
                                    <StatusBadge status={advance.status} />
                                </li>
                            ))
                        )}
                    </ul>
                </BezelCard>
            </div>

            {employee?.phone && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 text-sm text-[var(--muted)]"
                >
                    Телефон: {employee.phone}
                </motion.p>
            )}
        </AppLayout>
    );
}
