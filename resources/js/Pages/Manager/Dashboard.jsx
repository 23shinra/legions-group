import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import StatPill from '@/Components/ui/StatPill';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatHours, formatMoney, formatTime } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Buildings,
    Clock,
    CurrencyCircleDollar,
    Users,
    UsersThree,
} from '@phosphor-icons/react';

export default function Dashboard({
    stats = {},
    brigades = [],
    objectPresence = [],
}) {
    const overview = {
        totalEmployees: stats.totalEmployees ?? 0,
        atWork: stats.atWork ?? 0,
        absent: stats.absent ?? 0,
        hoursToday: stats.hoursToday ?? 0,
        advanceRequestsCount: stats.advanceRequestsCount ?? 0,
        advanceRequestsSum: stats.advanceRequestsSum ?? 0,
        activeObjects: stats.activeObjects ?? 0,
    };

    return (
        <AppLayout>
            <Head title="Обзор" />

            <PageHeader
                eyebrow="Сегодня"
                title="Обзор"
                subtitle="Сводка по персоналу, объектам и заявкам на сегодня"
            />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <StatPill
                    label="На объекте"
                    value={`${overview.atWork} / ${overview.totalEmployees}`}
                    icon={Users}
                    accent
                    delay={0}
                />
                <StatPill
                    label="Отсутствуют"
                    value={overview.absent}
                    icon={UsersThree}
                    delay={0.05}
                />
                <StatPill
                    label="Часы сегодня"
                    value={formatHours(overview.hoursToday)}
                    icon={Clock}
                    delay={0.1}
                />
                <StatPill
                    label="Заявок на аванс"
                    value={overview.advanceRequestsCount}
                    icon={CurrencyCircleDollar}
                    accent
                    delay={0.15}
                    href={route('manager.advances.index')}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.75, ease: [0.32, 0.72, 0, 1] }}
                className="mt-4 md:mt-5"
            >
                <BezelCard padding="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bezel)]">
                                <CurrencyCircleDollar
                                    size={22}
                                    weight="light"
                                    className="text-[var(--accent)]"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--ink)]">
                                    Заявки на аванс
                                </p>
                                <p className="text-sm text-[var(--muted)]">
                                    {overview.advanceRequestsCount} ожидают ·{' '}
                                    {formatMoney(overview.advanceRequestsSum)}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            <Link
                                href={route('manager.advances.index')}
                                className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-soft transition-fluid hover:opacity-90"
                            >
                                Открыть заявки
                            </Link>
                            <Link
                                href={route('manager.employees.index')}
                                className="rounded-full bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-soft ring-1 ring-[var(--bezel-ring)] transition-fluid hover:shadow-lift"
                            >
                                Сотрудники
                            </Link>
                        </div>
                    </div>
                </BezelCard>
            </motion.div>

            <section className="mt-10 sm:mt-12">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
                    <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                            Присутствие
                        </p>
                        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
                            Кто на каком объекте
                        </h2>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                        Активных объектов: {overview.activeObjects}
                    </p>
                </div>

                {objectPresence.length === 0 ? (
                    <BezelCard padding="p-10">
                        <p className="text-center text-[var(--muted)]">
                            Активных объектов нет
                        </p>
                    </BezelCard>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {objectPresence.map((object, i) => (
                            <motion.div
                                key={object.id ?? `none-${i}`}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: 0.06 + i * 0.05,
                                    duration: 0.7,
                                    ease: [0.32, 0.72, 0, 1],
                                }}
                            >
                                <BezelCard
                                    className="h-full"
                                    padding="p-0"
                                    innerClassName="flex h-full flex-col overflow-hidden p-0"
                                >
                                    <div className="flex items-start justify-between gap-3 border-b border-[var(--bezel-ring)] px-5 py-4 sm:px-6">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Buildings
                                                    size={18}
                                                    weight="light"
                                                    className="shrink-0 text-[var(--accent)]"
                                                />
                                                <h3 className="truncate text-lg font-extrabold tracking-tight text-[var(--ink)]">
                                                    {object.name}
                                                </h3>
                                            </div>
                                            {object.address && (
                                                <p className="mt-1 truncate text-sm text-[var(--muted)]">
                                                    {object.address}
                                                </p>
                                            )}
                                        </div>
                                        <span className="shrink-0 rounded-full bg-[var(--bezel)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)]">
                                            {object.count}
                                        </span>
                                    </div>

                                    <ul className="flex max-h-72 flex-1 flex-col divide-y divide-[var(--bezel-ring)] overflow-y-auto">
                                        {(object.workers ?? []).length === 0 ? (
                                            <li className="px-5 py-8 text-center text-sm text-[var(--muted)] sm:px-6">
                                                Сейчас никого нет
                                            </li>
                                        ) : (
                                            object.workers.map((worker) => (
                                                <li
                                                    key={worker.id}
                                                    className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3.5 transition-fluid hover:bg-[var(--surface-muted)] sm:px-6"
                                                    onClick={() =>
                                                        worker.id &&
                                                        router.visit(
                                                            route(
                                                                'manager.employees.show',
                                                                worker.id,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-[var(--ink)]">
                                                            {worker.name}
                                                        </p>
                                                        <p className="truncate text-xs text-[var(--muted)]">
                                                            {[
                                                                worker.brigade,
                                                                worker.position,
                                                                worker.started_at
                                                                    ? `с ${formatTime(worker.started_at)}`
                                                                    : null,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' · ')}
                                                        </p>
                                                    </div>
                                                    <StatusBadge status="working" />
                                                </li>
                                            ))
                                        )}
                                    </ul>

                                    {object.id && (
                                        <div className="border-t border-[var(--bezel-ring)] px-5 py-3 sm:px-6">
                                            <Link
                                                href={route(
                                                    'manager.objects.show',
                                                    object.id,
                                                )}
                                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted)] transition-fluid hover:text-[var(--ink)]"
                                            >
                                                Открыть объект
                                                <ArrowRight
                                                    size={14}
                                                    weight="light"
                                                />
                                            </Link>
                                        </div>
                                    )}
                                </BezelCard>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            <div className="mt-12 sm:mt-16">
                <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:mb-8 sm:text-3xl">
                    Бригады
                </h2>

                <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
                    {brigades.length === 0 ? (
                        <BezelCard className="lg:col-span-2" padding="p-10">
                            <p className="text-center text-[var(--muted)]">
                                Бригады не найдены
                            </p>
                        </BezelCard>
                    ) : (
                        brigades.map((brigade, i) => (
                            <motion.div
                                key={brigade.id}
                                initial={{ opacity: 0, y: 28 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: 0.08 + i * 0.07,
                                    duration: 0.85,
                                    ease: [0.32, 0.72, 0, 1],
                                }}
                                className="group h-full cursor-pointer outline-none transition-fluid active:scale-[0.99]"
                                onClick={() =>
                                    router.visit(
                                        route('manager.brigades.show', brigade.id),
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        router.visit(
                                            route(
                                                'manager.brigades.show',
                                                brigade.id,
                                            ),
                                        );
                                    }
                                }}
                                tabIndex={0}
                                role="link"
                            >
                                <BezelCard
                                    className="h-full transition-fluid group-hover:shadow-lift"
                                    padding="p-6 sm:p-8"
                                >
                                    <div className="flex h-full flex-col gap-6 sm:gap-8">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 space-y-2">
                                                <span className="inline-flex rounded-full bg-[var(--bezel)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                                    Бригада
                                                </span>
                                                <h3 className="truncate text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
                                                    {brigade.name}
                                                </h3>
                                                {brigade.object ? (
                                                    <p className="flex items-center gap-2 text-sm text-[var(--muted)] sm:text-base">
                                                        <Buildings
                                                            size={18}
                                                            weight="light"
                                                            className="shrink-0"
                                                        />
                                                        <span className="truncate">
                                                            {brigade.object.name}
                                                        </span>
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-[var(--muted)]">
                                                        Объект не назначен
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end gap-3">
                                                {brigade.object && (
                                                    <StatusBadge
                                                        status="active"
                                                        label="На объекте"
                                                    />
                                                )}
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bezel)] transition-fluid group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 group-hover:bg-[var(--accent)] group-hover:text-[var(--bg)]">
                                                    <ArrowRight
                                                        size={16}
                                                        weight="light"
                                                    />
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                                            <div className="rounded-[1.25rem] bg-[var(--surface-muted)] px-4 py-4 sm:rounded-[1.5rem] sm:px-5 sm:py-5">
                                                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                                                    Всего
                                                </p>
                                                <p className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                                                    {brigade.membersCount ??
                                                        brigade.members_count ??
                                                        0}
                                                </p>
                                            </div>
                                            <div className="rounded-[1.25rem] bg-[var(--surface-muted)] px-4 py-4 sm:rounded-[1.5rem] sm:px-5 sm:py-5">
                                                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                                                    На объекте
                                                </p>
                                                <p className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--accent)] sm:text-3xl">
                                                    {brigade.atWork ??
                                                        brigade.at_work ??
                                                        0}
                                                </p>
                                            </div>
                                            <div className="rounded-[1.25rem] bg-[var(--surface-muted)] px-4 py-4 sm:rounded-[1.5rem] sm:px-5 sm:py-5">
                                                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                                                    Часы
                                                </p>
                                                <p className="mt-2 text-lg font-extrabold tracking-tight sm:text-xl">
                                                    {formatHours(
                                                        brigade.hoursToday ??
                                                            brigade.hours_today ??
                                                            0,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="rounded-[1.25rem] bg-[var(--surface-muted)] px-4 py-4 sm:rounded-[1.5rem] sm:px-5 sm:py-5">
                                                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                                                    Авансы
                                                </p>
                                                <p className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                                                    {brigade.pendingAdvances ??
                                                        brigade.pending_advances ??
                                                        0}
                                                </p>
                                            </div>
                                        </div>

                                        {brigade.brigadier && (
                                            <div className="flex items-center gap-3 border-t border-[var(--bezel-ring)] pt-5">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bezel)]">
                                                    <UsersThree
                                                        size={16}
                                                        weight="light"
                                                    />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                                                        Бригадир
                                                    </p>
                                                    <p className="truncate text-sm font-semibold text-[var(--ink)] sm:text-base">
                                                        {brigade.brigadier.name}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </BezelCard>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
