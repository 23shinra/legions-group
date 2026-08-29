import RequestAdvanceModal from '@/Components/RequestAdvanceModal';
import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import StatPill from '@/Components/ui/StatPill';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatHours, formatMoney, formatTime } from '@/lib/format';
import { ensurePushSubscription } from '@/lib/pwa';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Buildings,
    CalendarBlank,
    Clock,
    CurrencyCircleDollar,
    Play,
    Stop,
    UsersThree,
    Wallet,
} from '@phosphor-icons/react';
import { useState } from 'react';

function readGeolocation(timeoutMs = 1500) {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({});
            return;
        }

        const timer = window.setTimeout(() => resolve({}), timeoutMs);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                window.clearTimeout(timer);
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => {
                window.clearTimeout(timer);
                resolve({});
            },
            { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 120_000 },
        );
    });
}

export default function Home({
    auth,
    todayObject,
    tomorrowObject = null,
    brigade,
    activeEntry,
    pendingEntry,
    balance = {},
    recentAdvances = [],
    advanceEligibility = {},
}) {
    const isWorking = Boolean(activeEntry);
    const isAwaiting = Boolean(pendingEntry);
    const user = auth?.user;
    const vapidPublicKey = usePage().props.vapidPublicKey;
    const [advanceOpen, setAdvanceOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [endOpen, setEndOpen] = useState(false);

    const markArrival = async () => {
        if (busy || isWorking || isAwaiting || !todayObject) {
            return;
        }

        setBusy(true);
        await ensurePushSubscription(vapidPublicKey);
        // GPS опционален: ждём максимум ~1.2с, иначе отправляем сразу без координат.
        const coords = await readGeolocation(1200);
        router.post(route('worker.time.arrival'), coords, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    };

    const endShift = async () => {
        if (busy || !isWorking) {
            return;
        }

        setBusy(true);
        await ensurePushSubscription(vapidPublicKey);
        router.post(
            route('worker.time.end'),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setBusy(false);
                    setEndOpen(false);
                },
            },
        );
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
                    <BezelCard padding="p-5 sm:p-6">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge
                                    status={
                                        isWorking
                                            ? 'working'
                                            : isAwaiting
                                              ? 'awaiting'
                                              : 'absent'
                                    }
                                />
                                {isWorking && activeEntry?.started_at && (
                                    <span className="text-sm text-[var(--muted)]">
                                        с {formatTime(activeEntry.started_at)}
                                    </span>
                                )}
                                {isAwaiting && pendingEntry?.started_at && (
                                    <span className="text-sm text-[var(--muted)]">
                                        отметили в {formatTime(pendingEntry.started_at)}
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                                {isWorking
                                    ? 'Вы на объекте. Когда закончите — завершите смену.'
                                    : isAwaiting
                                      ? 'Бригадир подтвердит ваш приход на объект.'
                                      : todayObject
                                        ? 'Когда приедете на объект, отметьте приход — бригадир подтвердит.'
                                        : 'Объект не назначен. Обратитесь к бригадиру.'}
                            </p>

                            {!isWorking && !isAwaiting && todayObject && (
                                <button
                                    type="button"
                                    onClick={markArrival}
                                    disabled={busy}
                                    className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg)] shadow-soft transition-fluid hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                                >
                                    <Play size={18} weight="bold" />
                                    {busy ? 'Отправка…' : 'Я пришёл'}
                                </button>
                            )}

                            {isWorking && !endOpen && (
                                <button
                                    type="button"
                                    onClick={() => setEndOpen(true)}
                                    disabled={busy}
                                    className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] shadow-soft transition-fluid hover:bg-[var(--surface-muted)] active:scale-[0.98] disabled:opacity-60"
                                >
                                    <Stop size={18} weight="bold" />
                                    Закончить работу
                                </button>
                            )}

                            {isWorking && endOpen && (
                                <div className="mt-4 space-y-3 rounded-2xl bg-[var(--surface-muted)] p-4 ring-1 ring-[var(--bezel-ring)]">
                                    <p className="text-sm text-[var(--muted)]">
                                        Завершить смену сейчас?
                                    </p>
                                    <div className="flex flex-col gap-2 sm:flex-row-reverse">
                                        <button
                                            type="button"
                                            onClick={endShift}
                                            disabled={busy}
                                            className="min-h-12 flex-1 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg)] transition-fluid hover:opacity-90 disabled:opacity-60"
                                        >
                                            {busy ? 'Сохранение…' : 'Подтвердить окончание'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEndOpen(false)}
                                            disabled={busy}
                                            className="min-h-12 flex-1 rounded-full bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] disabled:opacity-60"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            )}
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

                    <BezelCard padding="p-5" className="sm:col-span-2">
                        <div className="flex items-start gap-3">
                            <CalendarBlank
                                size={24}
                                weight="light"
                                className="mt-0.5 text-[var(--accent)]"
                            />
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                    Завтра
                                </p>
                                <p className="mt-1 font-semibold text-[var(--ink)]">
                                    {tomorrowObject
                                        ? `${tomorrowObject.name}${
                                              tomorrowObject.address
                                                  ? ` · ${tomorrowObject.address}`
                                                  : ''
                                          }`
                                        : 'Объект ещё не назначен'}
                                </p>
                            </div>
                        </div>
                    </BezelCard>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <StatPill
                        label="Смен отработано"
                        value={
                            balance.work_days
                                ? `${balance.days ?? 0} / ${balance.work_days}`
                                : String(balance.days ?? 0)
                        }
                        delay={0.05}
                    />
                    <StatPill
                        label="Часов"
                        value={formatHours(balance.minutes ?? 0)}
                        icon={Clock}
                        delay={0.08}
                    />
                    <StatPill
                        label="Заработано"
                        value={formatMoney(balance.accrued ?? 0)}
                        delay={0.1}
                    />
                    <StatPill
                        label="К авансу"
                        value={formatMoney(
                            Math.min(
                                balance.available_for_advance ?? 0,
                                balance.accrued ?? 0,
                            ),
                        )}
                        accent
                        delay={0.12}
                    />
                </div>

                {balance.days_left != null && (
                    <BezelCard padding="p-5">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                            По объекту
                        </p>
                        <p className="mt-2 text-sm text-[var(--ink)]">
                            Осталось смен:{' '}
                            <span className="font-semibold">{balance.days_left}</span>
                            {balance.projected_remaining > 0 && (
                                <>
                                    {' '}
                                    · ещё можно заработать{' '}
                                    <span className="font-semibold text-[var(--accent)]">
                                        {formatMoney(balance.projected_remaining)}
                                    </span>
                                </>
                            )}
                        </p>
                    </BezelCard>
                )}

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
        </AppLayout>
    );
}
