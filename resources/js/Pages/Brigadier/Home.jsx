import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatMoney } from '@/lib/format';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Buildings, CurrencyCircleDollar, UsersThree } from '@phosphor-icons/react';

export default function Home({
    brigade,
    members = [],
    todayObject,
    pendingAdvances = [],
}) {
    return (
        <AppLayout>
            <Head title="Бригада" />

            <PageHeader
                eyebrow="Бригадир"
                title={brigade?.name ?? 'Моя бригада'}
                subtitle={
                    todayObject
                        ? `Объект: ${todayObject.name}`
                        : 'Объект на сегодня не назначен'
                }
            />

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <BezelCard padding="p-5">
                    <div className="flex items-start gap-3">
                        <Buildings
                            size={24}
                            weight="light"
                            className="text-[var(--accent)]"
                        />
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                Объект
                            </p>
                            <p className="mt-1 font-semibold">
                                {todayObject?.name ?? '—'}
                            </p>
                            {todayObject?.address && (
                                <p className="mt-0.5 text-sm text-[var(--muted)]">
                                    {todayObject.address}
                                </p>
                            )}
                        </div>
                    </div>
                </BezelCard>

                <BezelCard padding="p-5">
                    <div className="flex items-start gap-3">
                        <UsersThree
                            size={24}
                            weight="light"
                            className="text-[var(--accent)]"
                        />
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                Состав
                            </p>
                            <p className="mt-1 font-semibold">
                                {members.length} человек
                            </p>
                            <p className="mt-0.5 text-sm text-[var(--muted)]">
                                {members.filter((m) => m.status === 'working').length}{' '}
                                на объекте
                            </p>
                        </div>
                    </div>
                </BezelCard>
            </div>

            <BezelCard className="mb-6" padding="p-0">
                <div className="border-b border-[var(--bezel-ring)] px-6 py-4">
                    <h2 className="text-lg font-bold text-[var(--ink)]">
                        Состав бригады
                    </h2>
                </div>
                <ul className="divide-y divide-[var(--bezel-ring)]">
                    {members.length === 0 ? (
                        <li className="px-6 py-10 text-center text-[var(--muted)]">
                            Нет участников
                        </li>
                    ) : (
                        members.map((member, i) => (
                            <motion.li
                                key={member.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: i * 0.04,
                                    duration: 0.6,
                                    ease: [0.32, 0.72, 0, 1],
                                }}
                                className="flex items-center justify-between gap-4 px-6 py-4"
                            >
                                <div>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {member.name}
                                    </p>
                                    {member.phone && (
                                        <p className="text-sm text-[var(--muted)]">
                                            {member.phone}
                                        </p>
                                    )}
                                </div>
                                <StatusBadge
                                    status={
                                        member.status === 'working'
                                            ? 'working'
                                            : 'absent'
                                    }
                                />
                            </motion.li>
                        ))
                    )}
                </ul>
            </BezelCard>

            {pendingAdvances.length > 0 && (
                <BezelCard padding="p-0">
                    <div className="flex items-center gap-2 border-b border-[var(--bezel-ring)] px-6 py-4">
                        <CurrencyCircleDollar
                            size={20}
                            weight="light"
                            className="text-[var(--accent)]"
                        />
                        <h2 className="text-lg font-bold text-[var(--ink)]">
                            Заявки на аванс
                        </h2>
                    </div>
                    <ul className="divide-y divide-[var(--bezel-ring)]">
                        {pendingAdvances.map((advance) => (
                            <li
                                key={advance.id}
                                className="flex items-center justify-between gap-4 px-6 py-4"
                            >
                                <div>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {advance.user?.name ?? 'Сотрудник'}
                                    </p>
                                    <p className="text-sm text-[var(--muted)]">
                                        {formatDate(advance.created_at)}
                                        {advance.comment && ` · ${advance.comment}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[var(--accent)]">
                                        {formatMoney(advance.amount)}
                                    </p>
                                    <StatusBadge status={advance.status} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </BezelCard>
            )}
        </AppLayout>
    );
}
