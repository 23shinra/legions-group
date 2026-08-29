import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
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
    WarningCircle,
} from '@phosphor-icons/react';

const EASE = [0.32, 0.72, 0, 1];

function scrollToId(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function PresenceBar({ atWork, awaiting, late, absent, total }) {
    const safeTotal = Math.max(total, 1);
    const onTime = Math.max(0, atWork - late);
    const segments = [
        {
            key: 'atWork',
            label: 'На объекте',
            value: atWork,
            barValue: onTime,
            className: 'bg-emerald-500',
            target: 'section-objects',
        },
        {
            key: 'awaiting',
            label: 'Ждут',
            value: awaiting,
            barValue: awaiting,
            className: 'bg-amber-400',
            target: 'section-attention',
        },
        {
            key: 'late',
            label: 'Опоздали',
            value: late,
            barValue: late,
            className: 'bg-violet-500',
            target: 'section-attention',
        },
        {
            key: 'absent',
            label: 'Нет',
            value: absent,
            barValue: absent,
            className: 'bg-red-400/80',
            target: 'section-absent',
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-[var(--bezel)]">
                {segments.map((segment) => {
                    if (segment.barValue <= 0) {
                        return null;
                    }

                    return (
                        <button
                            key={segment.key}
                            type="button"
                            title={`${segment.label}: ${segment.value}`}
                            onClick={() => scrollToId(segment.target)}
                            className={`${segment.className} transition-fluid hover:opacity-90`}
                            style={{ width: `${(segment.barValue / safeTotal) * 100}%` }}
                        />
                    );
                })}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {segments.map((segment) => (
                    <button
                        key={segment.key}
                        type="button"
                        onClick={() => scrollToId(segment.target)}
                        className={`rounded-2xl px-3 py-3 text-left transition-fluid hover:ring-1 hover:ring-[var(--bezel-ring)] ${
                            segment.key === 'late'
                                ? 'bg-violet-500/12 hover:bg-violet-500/20'
                                : 'bg-[var(--surface-muted)]'
                        }`}
                    >
                        <div className="mb-1.5 flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${segment.className}`} />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                {segment.label}
                            </span>
                        </div>
                        <p className="text-xl font-extrabold tracking-tight text-[var(--ink)]">
                            {segment.value}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}

const ATTENTION_TONES = {
    advance: {
        label: 'Аванс',
        row: 'bg-amber-500/12 hover:bg-amber-500/20',
        bar: 'bg-amber-500',
        chip: 'bg-amber-500 text-white',
        amount: 'text-amber-900 [data-theme=dark]:text-amber-200',
    },
    awaiting: {
        label: 'Ждёт',
        row: 'bg-amber-400/14 hover:bg-amber-400/22',
        bar: 'bg-amber-400',
        chip: 'bg-amber-500 text-white',
        amount: '',
    },
    late: {
        label: 'Опоздал',
        row: 'bg-violet-500/12 hover:bg-violet-500/20',
        bar: 'bg-violet-500',
        chip: 'bg-violet-600 text-white',
        amount: '',
    },
};

function PersonRow({ person, badge, meta, onClick, tone }) {
    const look = tone ? ATTENTION_TONES[tone] : null;

    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                className={`relative flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-fluid sm:px-6 ${
                    look
                        ? look.row
                        : 'hover:bg-[var(--surface-muted)]'
                }`}
            >
                {look ? (
                    <span
                        className={`absolute inset-y-0 left-0 w-1.5 ${look.bar}`}
                        aria-hidden="true"
                    />
                ) : null}
                <div className="min-w-0">
                    {look ? (
                        <span
                            className={`mb-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${look.chip}`}
                        >
                            {look.label}
                        </span>
                    ) : null}
                    <p className="truncate font-semibold text-[var(--ink)]">{person.name}</p>
                    {meta ? (
                        <p className="truncate text-xs text-[var(--muted)]">{meta}</p>
                    ) : null}
                </div>
                {badge}
            </button>
        </li>
    );
}

export default function Dashboard({
    stats = {},
    awaiting = [],
    late = [],
    absent = [],
    pendingAdvances = [],
    brigades = [],
    objectPresence = [],
}) {
    const overview = {
        totalEmployees: stats.totalEmployees ?? 0,
        atWork: stats.atWork ?? 0,
        awaitingCount: stats.awaitingCount ?? awaiting.length,
        lateCount: stats.lateCount ?? late.length,
        absent: stats.absent ?? absent.length,
        hoursToday: stats.hoursToday ?? 0,
        advanceRequestsCount: stats.advanceRequestsCount ?? pendingAdvances.length,
        advanceRequestsSum: stats.advanceRequestsSum ?? 0,
        activeObjects: stats.activeObjects ?? 0,
    };

    const attentionItems = [
        ...pendingAdvances.map((advance) => ({
            key: `adv-${advance.id}`,
            kind: 'advance',
            name: advance.user?.name ?? '—',
            meta: advance.user?.position ?? 'Заявка на аванс',
            amount: advance.amount,
            href: route('manager.advances.index'),
        })),
        ...awaiting.map((person) => ({
            key: `await-${person.id}`,
            kind: 'awaiting',
            name: person.name,
            meta: [person.object, person.started_at ? `с ${formatTime(person.started_at)}` : null]
                .filter(Boolean)
                .join(' · '),
            personId: person.id,
        })),
        ...late.map((person) => ({
            key: `late-${person.id}`,
            kind: 'late',
            name: person.name,
            meta: [person.object, person.started_at ? `с ${formatTime(person.started_at)}` : null]
                .filter(Boolean)
                .join(' · '),
            personId: person.id,
        })),
    ];

    return (
        <AppLayout>
            <Head title="Обзор" />

            <PageHeader
                eyebrow="Сегодня"
                title="Обзор"
                subtitle="Кто на объекте, кого нет и что требует решения"
            />

            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
            >
                <BezelCard padding="p-5 sm:p-6">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bezel)]">
                                <Users size={22} weight="light" className="text-[var(--accent)]" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--ink)]">Присутствие</p>
                                <p className="text-sm text-[var(--muted)]">
                                    {overview.atWork} из {overview.totalEmployees} на объекте
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3.5 py-2 text-sm text-[var(--muted)]">
                            <Clock size={16} weight="light" />
                            <span>{formatHours(overview.hoursToday)} сегодня</span>
                        </div>
                    </div>

                    <PresenceBar
                        atWork={overview.atWork}
                        awaiting={overview.awaitingCount}
                        late={overview.lateCount}
                        absent={overview.absent}
                        total={overview.totalEmployees}
                    />
                </BezelCard>
            </motion.div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <motion.section
                    id="section-attention"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.7, ease: EASE }}
                >
                    <BezelCard padding="p-0" className="h-full" innerClassName="flex h-full flex-col overflow-hidden p-0">
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--bezel-ring)] bg-amber-500/8 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2">
                                <WarningCircle size={20} weight="fill" className="text-amber-600" />
                                <h2 className="font-bold text-[var(--ink)]">Требует внимания</h2>
                                {attentionItems.length > 0 ? (
                                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
                                        {attentionItems.length}
                                    </span>
                                ) : null}
                            </div>
                            {overview.advanceRequestsCount > 0 ? (
                                <Link
                                    href={route('manager.advances.index')}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
                                >
                                    Авансы
                                    <ArrowRight size={12} weight="bold" />
                                </Link>
                            ) : null}
                        </div>

                        {attentionItems.length === 0 ? (
                            <p className="px-5 py-10 text-center text-sm text-[var(--muted)] sm:px-6">
                                Всё спокойно — заявок и опозданий нет
                            </p>
                        ) : (
                            <ul className="max-h-[28rem] divide-y divide-[var(--bezel-ring)] overflow-y-auto">
                                {attentionItems.map((item) => (
                                    <PersonRow
                                        key={item.key}
                                        person={{ name: item.name }}
                                        meta={item.meta}
                                        tone={item.kind}
                                        badge={
                                            item.kind === 'advance' ? (
                                                <span className="shrink-0 text-base font-extrabold text-amber-900 [data-theme=dark]:text-amber-200 sm:text-lg">
                                                    {formatMoney(item.amount)}
                                                </span>
                                            ) : (
                                                <StatusBadge
                                                    status={item.kind}
                                                    className="shrink-0 self-center"
                                                />
                                            )
                                        }
                                        onClick={() => {
                                            if (item.href) {
                                                router.visit(item.href);
                                                return;
                                            }
                                            if (item.personId) {
                                                router.visit(
                                                    route('manager.employees.show', item.personId),
                                                );
                                            }
                                        }}
                                    />
                                ))}
                            </ul>
                        )}

                        {overview.advanceRequestsCount > 0 ? (
                            <div className="mt-auto border-t border-[var(--bezel-ring)] px-5 py-3 sm:px-6">
                                <p className="text-xs text-[var(--muted)]">
                                    {overview.advanceRequestsCount} заявок ·{' '}
                                    {formatMoney(overview.advanceRequestsSum)}
                                </p>
                            </div>
                        ) : null}
                    </BezelCard>
                </motion.section>

                <motion.section
                    id="section-absent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.7, ease: EASE }}
                >
                    <BezelCard padding="p-0" className="h-full" innerClassName="flex h-full flex-col overflow-hidden p-0">
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--bezel-ring)] px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2">
                                <UsersThree size={18} weight="light" className="text-[var(--accent)]" />
                                <h2 className="font-bold text-[var(--ink)]">Сейчас нет на объекте</h2>
                            </div>
                            <span className="rounded-full bg-[var(--bezel)] px-2.5 py-1 text-xs font-semibold">
                                {absent.length}
                            </span>
                        </div>

                        {absent.length === 0 ? (
                            <p className="px-5 py-10 text-center text-sm text-[var(--muted)] sm:px-6">
                                Все на месте
                            </p>
                        ) : (
                            <ul className="max-h-[28rem] divide-y divide-[var(--bezel-ring)] overflow-y-auto">
                                {absent.map((person) => (
                                    <PersonRow
                                        key={person.id}
                                        person={person}
                                        meta={[person.brigade, person.position]
                                            .filter(Boolean)
                                            .join(' · ')}
                                        badge={
                                            <StatusBadge
                                                status="absent"
                                                className="shrink-0 self-center"
                                            />
                                        }
                                        onClick={() =>
                                            router.visit(route('manager.employees.show', person.id))
                                        }
                                    />
                                ))}
                            </ul>
                        )}
                    </BezelCard>
                </motion.section>
            </div>

            <section id="section-objects" className="mt-10 sm:mt-12">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
                    <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                            Присутствие
                        </p>
                        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
                            Объекты сегодня
                        </h2>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                        Активных: {overview.activeObjects}
                    </p>
                </div>

                {objectPresence.length === 0 ? (
                    <BezelCard padding="p-10">
                        <p className="text-center text-[var(--muted)]">Активных объектов нет</p>
                    </BezelCard>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {objectPresence.map((object, i) => {
                            const assigned = object.assigned ?? 0;
                            const present = object.count ?? 0;
                            const fill = assigned > 0 ? Math.min(100, (present / assigned) * 100) : present > 0 ? 100 : 0;
                            const empty = present === 0;

                            return (
                                <motion.div
                                    key={object.id ?? `none-${i}`}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.06 + i * 0.04,
                                        duration: 0.65,
                                        ease: EASE,
                                    }}
                                >
                                    <BezelCard
                                        className={`h-full ${empty ? 'ring-1 ring-red-500/25' : ''}`}
                                        padding="p-0"
                                        innerClassName="flex h-full flex-col overflow-hidden p-0"
                                    >
                                        <div className="border-b border-[var(--bezel-ring)] px-5 py-4 sm:px-6">
                                            <div className="flex items-start justify-between gap-3">
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
                                                    {object.address ? (
                                                        <p className="mt-1 truncate text-sm text-[var(--muted)]">
                                                            {object.address}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <span className="shrink-0 rounded-full bg-[var(--bezel)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)]">
                                                    {present}
                                                    {assigned > 0 ? ` / ${assigned}` : ''}
                                                </span>
                                            </div>
                                            <div className="mt-3">
                                                <div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                                    <span>Загрузка</span>
                                                    <span>
                                                        {assigned > 0
                                                            ? `${present} из ${assigned}`
                                                            : empty
                                                              ? 'Пусто'
                                                              : `${present} на месте`}
                                                    </span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-[var(--bezel)]">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            empty ? 'bg-red-400/70' : 'bg-emerald-500'
                                                        }`}
                                                        style={{ width: `${fill}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <ul className="flex max-h-64 flex-1 flex-col divide-y divide-[var(--bezel-ring)] overflow-y-auto">
                                            {(object.workers ?? []).length === 0 ? (
                                                <li className="px-5 py-8 text-center text-sm text-[var(--muted)] sm:px-6">
                                                    Сейчас никого нет
                                                </li>
                                            ) : (
                                                object.workers.map((worker) => (
                                                    <PersonRow
                                                        key={worker.id}
                                                        person={worker}
                                                        meta={[
                                                            worker.position,
                                                            worker.started_at
                                                                ? `с ${formatTime(worker.started_at)}`
                                                                : null,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ')}
                                                        badge={
                                                            <StatusBadge
                                                                status={
                                                                    worker.is_late ? 'late' : 'working'
                                                                }
                                                                className="shrink-0 self-center"
                                                            />
                                                        }
                                                        onClick={() =>
                                                            worker.id &&
                                                            router.visit(
                                                                route(
                                                                    'manager.employees.show',
                                                                    worker.id,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                ))
                                            )}
                                        </ul>

                                        {object.id ? (
                                            <div className="border-t border-[var(--bezel-ring)] px-5 py-3 sm:px-6">
                                                <Link
                                                    href={route('manager.objects.show', object.id)}
                                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted)] transition-fluid hover:text-[var(--ink)]"
                                                >
                                                    Открыть объект
                                                    <ArrowRight size={14} weight="light" />
                                                </Link>
                                            </div>
                                        ) : null}
                                    </BezelCard>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="mt-12 sm:mt-16">
                <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:mb-8 sm:text-3xl">
                    Бригады
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
                    {brigades.length === 0 ? (
                        <BezelCard className="lg:col-span-2" padding="p-10">
                            <p className="text-center text-[var(--muted)]">Бригады не найдены</p>
                        </BezelCard>
                    ) : (
                        brigades.map((brigade, i) => {
                            const membersCount = brigade.membersCount ?? 0;
                            const atWork = brigade.atWork ?? 0;
                            const fill =
                                membersCount > 0
                                    ? Math.min(100, (atWork / membersCount) * 100)
                                    : 0;
                            const pending = brigade.pendingAdvances ?? 0;

                            return (
                                <motion.div
                                    key={brigade.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.06 + i * 0.05,
                                        duration: 0.7,
                                        ease: EASE,
                                    }}
                                    className="group h-full cursor-pointer outline-none transition-fluid active:scale-[0.99]"
                                    onClick={() =>
                                        router.visit(route('manager.brigades.show', brigade.id))
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            router.visit(
                                                route('manager.brigades.show', brigade.id),
                                            );
                                        }
                                    }}
                                    tabIndex={0}
                                    role="link"
                                >
                                    <BezelCard
                                        className="h-full transition-fluid group-hover:shadow-lift"
                                        padding="p-5 sm:p-6"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <span className="inline-flex rounded-full bg-[var(--bezel)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                                    Бригада
                                                </span>
                                                <h3 className="mt-2 truncate text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl">
                                                    {brigade.name}
                                                </h3>
                                                {brigade.object ? (
                                                    <p className="mt-1.5 flex items-center gap-2 text-sm text-[var(--muted)]">
                                                        <Buildings
                                                            size={16}
                                                            weight="light"
                                                            className="shrink-0"
                                                        />
                                                        <span className="truncate">
                                                            {brigade.object.name}
                                                        </span>
                                                    </p>
                                                ) : (
                                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                                        Объект не назначен
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end gap-2">
                                                {pending > 0 ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-500/30 [data-theme=dark]:text-amber-300">
                                                        <CurrencyCircleDollar size={12} />
                                                        {pending}{' '}
                                                        {pending === 1 ? 'аванс' : 'аванса'}
                                                    </span>
                                                ) : null}
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bezel)] transition-fluid group-hover:bg-[var(--accent)] group-hover:text-[var(--bg)]">
                                                    <ArrowRight size={16} weight="light" />
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                                <span className="font-semibold text-[var(--ink)]">
                                                    {atWork} из {membersCount} на объекте
                                                </span>
                                                <span className="text-[var(--muted)]">
                                                    {formatHours(brigade.hoursToday ?? 0)}
                                                </span>
                                            </div>
                                            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bezel)]">
                                                <div
                                                    className="h-full rounded-full bg-[var(--accent)] transition-all"
                                                    style={{ width: `${fill}%` }}
                                                />
                                            </div>
                                        </div>

                                        {brigade.brigadier ? (
                                            <div className="mt-5 flex items-center gap-3 border-t border-[var(--bezel-ring)] pt-4">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bezel)]">
                                                    <UsersThree size={16} weight="light" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                                                        Бригадир
                                                    </p>
                                                    <p className="truncate text-sm font-semibold text-[var(--ink)]">
                                                        {brigade.brigadier.name}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null}
                                    </BezelCard>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </section>
        </AppLayout>
    );
}
