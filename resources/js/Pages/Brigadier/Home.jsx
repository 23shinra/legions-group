import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import SoftSelect from '@/Components/ui/SoftSelect';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatHours, formatTime } from '@/lib/format';
import { Head, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowsLeftRight,
    Buildings,
    Clock,
    Play,
    Stop,
    UsersThree,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

function currentTimeValue() {
    const now = new Date();

    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function timeFromIso(iso) {
    if (!iso) {
        return currentTimeValue();
    }

    const date = new Date(iso);

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Build an absolute ISO instant from today's local H:i (matches the time input). */
function localTimeToIso(timeValue) {
    const [hours, minutes] = String(timeValue || '')
        .split(':')
        .map((part) => Number.parseInt(part, 10));

    if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return new Date().toISOString();
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toISOString();
}

function firstError(errors, keys) {
    for (const key of keys) {
        const value = errors?.[key];
        if (typeof value === 'string' && value.length > 0) {
            return value;
        }
        if (Array.isArray(value) && value[0]) {
            return value[0];
        }
    }

    return null;
}

export default function Home({
    brigade,
    members = [],
    objects = [],
    selectedObjectId = null,
    selectedObject = null,
}) {
    const { errors = {} } = usePage().props;
    const [arrivalMember, setArrivalMember] = useState(null);
    const [transferMember, setTransferMember] = useState(null);
    const [startedTime, setStartedTime] = useState(currentTimeValue());
    const [busyMemberId, setBusyMemberId] = useState(null);
    const [targetObjectId, setTargetObjectId] = useState('');
    const [formError, setFormError] = useState(null);

    const visibleMembers = useMemo(() => {
        if (!selectedObjectId) {
            return members;
        }

        return members.filter(
            (member) =>
                member.on_selected_object || !member.assigned_object_id,
        );
    }, [members, selectedObjectId]);

    const otherObjects = useMemo(
        () =>
            objects.filter(
                (object) => Number(object.id) !== Number(selectedObjectId),
            ),
        [objects, selectedObjectId],
    );

    const selectObject = (objectId) => {
        router.get(
            route('brigadier.home', { object: objectId }),
            {},
            { preserveState: false, preserveScroll: true },
        );
    };

    const canConfirmArrival = (member) =>
        member.on_selected_object && member.status === 'awaiting';

    const openConfirmModal = (member) => {
        if (!canConfirmArrival(member)) {
            return;
        }

        setFormError(null);
        setStartedTime(timeFromIso(member.pending_started_at));
        setArrivalMember(member);
    };

    const confirmArrival = () => {
        if (!arrivalMember || !selectedObjectId) {
            return;
        }

        setFormError(null);
        setBusyMemberId(arrivalMember.id);
        router.post(
            route('brigadier.members.time.confirm', arrivalMember.id),
            {
                started_at: localTimeToIso(startedTime),
                work_object_id: selectedObjectId,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setArrivalMember(null);
                    setFormError(null);
                },
                onError: (pageErrors) => {
                    setFormError(
                        firstError(pageErrors, [
                            'started_at',
                            'started_time',
                            'work_object_id',
                            'time',
                            'member',
                            'object',
                            'brigade',
                        ]) ?? 'Не удалось подтвердить приход.',
                    );
                },
                onFinish: () => {
                    setBusyMemberId(null);
                },
            },
        );
    };

    const endShift = (memberId) => {
        setBusyMemberId(memberId);
        router.post(route('brigadier.members.time.end', memberId), {}, {
            preserveScroll: true,
            onFinish: () => setBusyMemberId(null),
        });
    };

    const openTransferModal = (member) => {
        setFormError(null);
        setTargetObjectId(otherObjects[0]?.id ?? '');
        setTransferMember(member);
    };

    const confirmTransfer = () => {
        if (!transferMember || !targetObjectId) {
            return;
        }

        setFormError(null);
        setBusyMemberId(transferMember.id);
        router.post(
            route('brigadier.members.transfer', transferMember.id),
            { work_object_id: targetObjectId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setTransferMember(null);
                    setFormError(null);
                },
                onError: (pageErrors) => {
                    setFormError(
                        firstError(pageErrors, [
                            'work_object_id',
                            'member',
                            'brigade',
                        ]) ?? 'Не удалось перенести строителя.',
                    );
                },
                onFinish: () => {
                    setBusyMemberId(null);
                },
            },
        );
    };

    const arrivalError =
        formError ??
        (arrivalMember
            ? firstError(errors, [
                  'started_at',
                  'started_time',
                  'work_object_id',
                  'time',
                  'member',
              ])
            : null);

    return (
        <AppLayout>
            <Head title="Бригада" />

            <PageHeader
                eyebrow="Бригадир"
                title={brigade?.name ?? 'Моя бригада'}
                subtitle={
                    selectedObject
                        ? `${selectedObject.name}${selectedObject.address ? ` · ${selectedObject.address}` : ''}`
                        : 'Выберите объект'
                }
            />

            {objects.length > 0 && (
                <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {objects.map((object) => {
                        const active =
                            Number(object.id) === Number(selectedObjectId);

                        return (
                            <button
                                key={object.id}
                                type="button"
                                onClick={() => selectObject(object.id)}
                                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-fluid ${
                                    active
                                        ? 'bg-[var(--accent)] text-[var(--bg)]'
                                        : 'bg-[var(--surface)] text-[var(--muted)] ring-1 ring-[var(--bezel-ring)] hover:text-[var(--ink)]'
                                }`}
                            >
                                {object.name}
                            </button>
                        );
                    })}
                </div>
            )}

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
                                {selectedObject?.name ?? '—'}
                            </p>
                            {selectedObject?.work_days && (
                                <p className="mt-0.5 text-sm text-[var(--muted)]">
                                    {selectedObject.work_days} смен
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
                                На объекте
                            </p>
                            <p className="mt-1 font-semibold">
                                {
                                    visibleMembers.filter(
                                        (m) => m.status === 'working',
                                    ).length
                                }{' '}
                                / {visibleMembers.length}
                            </p>
                            <p className="mt-0.5 text-sm text-[var(--muted)]">
                                {objects.length} объектов в работе
                            </p>
                        </div>
                    </div>
                </BezelCard>
            </div>

            <BezelCard padding="p-0">
                <div className="border-b border-[var(--bezel-ring)] px-4 py-4 sm:px-6">
                    <h2 className="text-lg font-bold text-[var(--ink)]">
                        Учёт рабочего времени
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Подтверждайте приход после отметки строителя
                    </p>
                </div>
                <ul className="divide-y divide-[var(--bezel-ring)]">
                    {!selectedObjectId ? (
                        <li className="px-6 py-10 text-center text-[var(--muted)]">
                            Выберите объект
                        </li>
                    ) : visibleMembers.length === 0 ? (
                        <li className="px-6 py-10 text-center text-[var(--muted)]">
                            Нет строителей на этом объекте
                        </li>
                    ) : (
                        visibleMembers.map((member, i) => (
                            <motion.li
                                key={member.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: i * 0.04,
                                    duration: 0.6,
                                    ease: [0.32, 0.72, 0, 1],
                                }}
                                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-[var(--ink)]">
                                            {member.name}
                                        </p>
                                        <StatusBadge
                                            status={
                                                member.status === 'working'
                                                    ? 'working'
                                                    : member.status === 'awaiting'
                                                      ? 'awaiting'
                                                      : 'absent'
                                            }
                                        />
                                        {member.is_late && (
                                            <StatusBadge status="late" />
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-[var(--muted)]">
                                        {member.position ?? 'Строитель'}
                                        {` · сегодня ${formatHours(member.today_minutes ?? 0)}`}
                                        {member.assigned_object_name &&
                                            !member.on_selected_object &&
                                            ` · ${member.assigned_object_name}`}
                                        {!member.on_selected_object &&
                                            !member.assigned_object_name &&
                                            ' · не назначен на объект'}
                                        {member.status === 'working' &&
                                            member.started_at &&
                                            ` · с ${formatTime(member.started_at)}`}
                                        {member.status === 'awaiting' &&
                                            member.pending_started_at &&
                                            ` · отметил в ${formatTime(member.pending_started_at)}`}
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                    {member.status === 'working' ? (
                                        <button
                                            type="button"
                                            disabled={busyMemberId === member.id}
                                            onClick={() => endShift(member.id)}
                                            className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] transition-fluid hover:bg-[var(--surface-muted)] active:scale-[0.98] disabled:opacity-60"
                                        >
                                            <Stop size={16} weight="bold" />
                                            Завершить
                                        </button>
                                    ) : member.status === 'awaiting' ? (
                                        <button
                                            type="button"
                                            disabled={
                                                busyMemberId === member.id ||
                                                !canConfirmArrival(member)
                                            }
                                            onClick={() =>
                                                openConfirmModal(member)
                                            }
                                            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-soft transition-fluid hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Play size={16} weight="bold" />
                                            Подтвердить приход
                                        </button>
                                    ) : null}
                                    {otherObjects.length > 0 && (
                                        <button
                                            type="button"
                                            disabled={
                                                busyMemberId === member.id ||
                                                member.status === 'working' ||
                                                member.status === 'awaiting'
                                            }
                                            onClick={() =>
                                                openTransferModal(member)
                                            }
                                            className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] transition-fluid hover:bg-[var(--surface-muted)] active:scale-[0.98] disabled:opacity-60"
                                        >
                                            <ArrowsLeftRight
                                                size={16}
                                                weight="bold"
                                            />
                                            Перенести
                                        </button>
                                    )}
                                </div>
                            </motion.li>
                        ))
                    )}
                </ul>
            </BezelCard>

            <AnimatePresence>
                {arrivalMember && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] px-4 pb-[max(1rem,var(--safe-bottom))] backdrop-blur-sm sm:items-center sm:pb-4"
                        onClick={() =>
                            busyMemberId === null && setArrivalMember(null)
                        }
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.98 }}
                            className="w-full max-w-sm rounded-[1.75rem] bg-[var(--bezel)] p-1.5 shadow-lift sm:rounded-[2rem]"
                            onClick={(event) => event.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="rounded-[calc(1.75rem-0.375rem)] bg-[var(--surface)] p-5 sm:rounded-[calc(2rem-0.375rem)] sm:p-8">
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)]">
                                    <Clock size={22} weight="light" />
                                </div>
                                <h2 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">
                                    Подтвердить приход
                                </h2>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    {arrivalMember.name} · {selectedObject?.name ?? 'Объект'}
                                </p>

                                <label className="mt-5 block">
                                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                        Время прихода
                                    </span>
                                    <input
                                        type="time"
                                        value={startedTime}
                                        onChange={(event) =>
                                            setStartedTime(event.target.value)
                                        }
                                        className="w-full rounded-2xl border-0 bg-[var(--surface-muted)] px-4 py-3 text-lg font-semibold text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    />
                                </label>

                                {arrivalError && (
                                    <p className="mt-3 text-sm font-medium text-red-600">
                                        {arrivalError}
                                    </p>
                                )}

                                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={confirmArrival}
                                        disabled={busyMemberId !== null}
                                        className="min-h-12 flex-1 rounded-full bg-[var(--accent)] px-5 py-3 text-base font-semibold text-[var(--bg)] transition-fluid hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                                    >
                                        {busyMemberId ? 'Сохранение…' : 'Подтвердить'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setArrivalMember(null);
                                            setFormError(null);
                                        }}
                                        disabled={busyMemberId !== null}
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

            <AnimatePresence>
                {transferMember && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] px-4 pb-[max(1rem,var(--safe-bottom))] backdrop-blur-sm sm:items-center sm:pb-4"
                        onClick={() =>
                            busyMemberId === null && setTransferMember(null)
                        }
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.98 }}
                            className="w-full max-w-sm rounded-[1.75rem] bg-[var(--bezel)] p-1.5 shadow-lift sm:rounded-[2rem]"
                            onClick={(event) => event.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="rounded-[calc(1.75rem-0.375rem)] bg-[var(--surface)] p-5 sm:rounded-[calc(2rem-0.375rem)] sm:p-8">
                                <h2 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">
                                    Перенести {transferMember.name}
                                </h2>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    Выберите объект назначения
                                </p>

                                <label className="mt-5 block">
                                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                        Объект
                                    </span>
                                    <SoftSelect
                                        value={targetObjectId}
                                        onChange={setTargetObjectId}
                                        options={otherObjects.map((object) => ({
                                            value: object.id,
                                            label: object.name,
                                        }))}
                                    />
                                </label>

                                {formError && transferMember && (
                                    <p className="mt-3 text-sm font-medium text-red-600">
                                        {formError}
                                    </p>
                                )}

                                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={confirmTransfer}
                                        disabled={
                                            busyMemberId !== null ||
                                            !targetObjectId
                                        }
                                        className="min-h-12 flex-1 rounded-full bg-[var(--accent)] px-5 py-3 text-base font-semibold text-[var(--bg)] transition-fluid hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                                    >
                                        {busyMemberId
                                            ? 'Перенос…'
                                            : 'Перенести'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTransferMember(null);
                                            setFormError(null);
                                        }}
                                        disabled={busyMemberId !== null}
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
