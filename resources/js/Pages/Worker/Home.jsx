import RequestAdvanceModal from '@/Components/RequestAdvanceModal';
import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import StatPill from '@/Components/ui/StatPill';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatMoney, formatTime } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    Buildings,
    Clock,
    CurrencyCircleDollar,
    Play,
    Stop,
    UsersThree,
    Wallet,
} from '@phosphor-icons/react';
import { useState } from 'react';

export default function Home({
    auth,
    todayObject,
    brigade,
    activeEntry,
    balance = {},
    recentAdvances = [],
    advanceEligibility = {},
}) {
    const isWorking = Boolean(activeEntry);
    const user = auth?.user;
    const [endOpen, setEndOpen] = useState(false);
    const [ending, setEnding] = useState(false);
    const [advanceOpen, setAdvanceOpen] = useState(false);

    const handleTimeAction = () => {
        if (isWorking) {
            setEndOpen(true);
            return;
        }

        router.post(route('time.start'));
    };

    const confirmEnd = () => {
        setEnding(true);
        router.post(route('time.end'), {}, {
            onFinish: () => {
                setEnding(false);
                setEndOpen(false);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Главная" />

            <PageHeader
                eyebrow="Рабочий день"
                title={`Здравствуйте, ${user?.name ?? ''}`}
                subtitle={
                    todayObject
                        ? `${todayObject.name}${todayObject.address ? ` · ${todayObject.address}` : ''}`
                        : 'Объект на сегодня не назначен'
                }
            />

            <div className="flex flex-col gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                >
                    <BezelCard padding="p-6 md:p-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <StatusBadge
                                    status={isWorking ? 'working' : 'absent'}
                                />
                                {isWorking && activeEntry?.started_at && (
                                    <span className="text-sm text-[var(--muted)]">
                                        Начало: {formatTime(activeEntry.started_at)}
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleTimeAction}
                                className={`group flex w-full flex-col items-center justify-center gap-2 rounded-[1.5rem] px-4 py-6 text-center text-base font-bold leading-tight transition-fluid active:scale-[0.98] sm:flex-row sm:gap-4 sm:rounded-[1.75rem] sm:px-8 sm:py-8 sm:text-xl md:py-10 md:text-2xl ${
                                    isWorking
                                        ? 'bg-[var(--ink)] text-[var(--bg)] shadow-lift hover:opacity-90'
                                        : 'bg-[var(--accent)] text-[var(--bg)] shadow-lift hover:opacity-90'
                                }`}
                            >
                                {isWorking ? (
                                    <>
                                        <Stop size={28} weight="light" className="sm:hidden" />
                                        <Stop size={32} weight="light" className="hidden sm:block" />
                                        <span>ЗАКОНЧИТЬ РАБОТУ</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={28} weight="light" className="sm:hidden" />
                                        <Play size={32} weight="light" className="hidden sm:block" />
                                        <span>НАЧАТЬ РАБОТУ</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </BezelCard>
                </motion.div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <BezelCard padding="p-5">
                        <div className="flex items-start gap-3">
                            <Buildings
                                size={24}
                                weight="light"
                                className="mt-0.5 text-[var(--accent)]"
                            />
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                    Объект
                                </p>
                                <p className="mt-1 font-semibold text-[var(--ink)]">
                                    {todayObject?.name ?? 'Не назначен'}
                                </p>
                            </div>
                        </div>
                    </BezelCard>

                    <BezelCard padding="p-5">
                        <div className="flex items-start gap-3">
                            <UsersThree
                                size={24}
                                weight="light"
                                className="mt-0.5 text-[var(--accent)]"
                            />
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                    Бригада
                                </p>
                                <p className="mt-1 font-semibold text-[var(--ink)]">
                                    {brigade?.name ?? '—'}
                                </p>
                            </div>
                        </div>
                    </BezelCard>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <StatPill
                        label="К выплате"
                        value={formatMoney(balance.remaining)}
                        accent
                        delay={0.1}
                    />
                    <StatPill
                        label="Начислено"
                        value={formatMoney(balance.accrued)}
                        delay={0.15}
                    />
                </div>

                <div>
                    <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                        Быстрые действия
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href={route('worker.salary')}
                            className="flex items-center gap-3 rounded-[1.25rem] bg-[var(--surface)] p-4 shadow-soft transition-fluid hover:shadow-lift"
                        >
                            <Wallet size={22} weight="light" className="text-[var(--accent)]" />
                            <span className="text-sm font-semibold text-[var(--ink)]">Зарплата</span>
                        </Link>
                        <Link
                            href={route('worker.advances')}
                            className="flex items-center gap-3 rounded-[1.25rem] bg-[var(--surface)] p-4 shadow-soft transition-fluid hover:shadow-lift"
                        >
                            <CurrencyCircleDollar
                                size={22}
                                weight="light"
                                className="text-[var(--accent)]"
                            />
                            <span className="text-sm font-semibold text-[var(--ink)]">Авансы</span>
                        </Link>
                        <Link
                            href={route('worker.hours')}
                            className="flex items-center gap-3 rounded-[1.25rem] bg-[var(--surface)] p-4 shadow-soft transition-fluid hover:shadow-lift"
                        >
                            <Clock size={22} weight="light" className="text-[var(--accent)]" />
                            <span className="text-sm font-semibold text-[var(--ink)]">Часы</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setAdvanceOpen(true)}
                            className="flex items-center gap-3 rounded-[1.25rem] bg-[var(--accent)] p-4 text-[var(--bg)] shadow-soft transition-fluid hover:opacity-90 active:scale-[0.98]"
                        >
                            <ArrowRight size={22} weight="light" />
                            <span className="text-sm font-semibold">Запросить аванс</span>
                        </button>
                    </div>
                </div>

                {recentAdvances.length > 0 && (
                    <BezelCard padding="p-6">
                        <h2 className="mb-4 text-lg font-bold text-[var(--ink)]">
                            Последние авансы
                        </h2>
                        <ul className="divide-y divide-[var(--bezel-ring)]">
                            {recentAdvances.map((advance) => (
                                <li
                                    key={advance.id}
                                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                >
                                    <div>
                                        <p className="font-semibold text-[var(--ink)]">
                                            {formatMoney(advance.amount)}
                                        </p>
                                        <p className="text-xs text-[var(--muted)]">
                                            {formatDate(advance.created_at)}
                                        </p>
                                    </div>
                                    <StatusBadge status={advance.status} />
                                </li>
                            ))}
                        </ul>
                    </BezelCard>
                )}
            </div>

            <RequestAdvanceModal
                open={advanceOpen}
                onClose={() => setAdvanceOpen(false)}
                eligibility={advanceEligibility}
            />

            <AnimatePresence>
                {endOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] px-4 pb-[max(1rem,var(--safe-bottom))] backdrop-blur-sm sm:items-center sm:pb-4"
                        onClick={() => !ending && setEndOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.98 }}
                            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                            className="w-full max-w-sm rounded-[1.75rem] bg-[var(--bezel)] p-1.5 shadow-lift sm:rounded-[2rem]"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="end-work-title"
                        >
                            <div className="rounded-[calc(1.75rem-0.375rem)] bg-[var(--surface)] p-5 sm:rounded-[calc(2rem-0.375rem)] sm:p-8">
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)] sm:mb-5 sm:h-12 sm:w-12">
                                    <Stop size={22} weight="light" />
                                </div>
                                <h2
                                    id="end-work-title"
                                    className="text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl"
                                >
                                    Закончить работу?
                                </h2>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    Смена будет закрыта
                                    {activeEntry?.started_at
                                        ? ` (начало в ${formatTime(activeEntry.started_at)})`
                                        : ''}
                                    . Часы зафиксируются автоматически.
                                </p>

                                <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row-reverse sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={confirmEnd}
                                        disabled={ending}
                                        className="min-h-12 flex-1 rounded-full bg-[var(--accent)] px-5 py-3 text-base font-semibold text-[var(--bg)] transition-fluid hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                                    >
                                        {ending ? 'Сохранение…' : 'Да, закончить'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEndOpen(false)}
                                        disabled={ending}
                                        className="min-h-12 flex-1 rounded-full bg-[var(--surface)] px-5 py-3 text-base font-semibold text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] transition-fluid hover:bg-[var(--surface-muted)] active:scale-[0.98] disabled:opacity-60"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
