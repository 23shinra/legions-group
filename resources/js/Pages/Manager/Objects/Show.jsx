import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import SoftDatePicker from '@/Components/ui/SoftDatePicker';
import SoftSelect from '@/Components/ui/SoftSelect';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatHours, formatMoney } from '@/lib/format';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Plus, Trash, UsersThree } from '@phosphor-icons/react';
import { useState } from 'react';

export default function Show({
    object,
    brigadesOnObject = [],
    brigades = [],
    workers = [],
    availableWorkers = [],
    stats = {},
    settlement = null,
}) {
    const flash = usePage().props.flash ?? {};
    const isClosed = Boolean(object?.closed_at) || object?.status === 'closed';
    const settlementData = settlement ?? object?.settlement;
    const [memberId, setMemberId] = useState('');

    const { data, setData, patch, processing, errors } = useForm({
        name: object?.name ?? '',
        address: object?.address ?? '',
        brigade_id: object?.brigade_id ?? '',
        start_date: object?.start_date?.slice?.(0, 10) ?? '',
        work_days: object?.work_days ?? 30,
        status: object?.status ?? 'active',
    });

    const handleClose = () => {
        if (confirm('Закрыть объект? Это действие нельзя отменить.')) {
            router.post(route('manager.objects.close', object.id));
        }
    };

    const saveObject = (e) => {
        e.preventDefault();
        patch(route('manager.objects.update', object.id), {
            preserveScroll: true,
        });
    };

    const addWorker = (e) => {
        e.preventDefault();
        if (!memberId) {
            return;
        }

        router.post(
            route('manager.objects.members.store', object.id),
            { user_id: memberId },
            {
                preserveScroll: true,
                onSuccess: () => setMemberId(''),
            },
        );
    };

    const removeWorker = (worker) => {
        if (!confirm(`Снять ${worker.name} с объекта? Ставка не изменится.`)) {
            return;
        }

        router.delete(
            route('manager.objects.members.destroy', [object.id, worker.id]),
            { preserveScroll: true },
        );
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
                <StatusBadge status={isClosed ? 'closed' : (object?.status ?? 'open')} />
            </div>

            {flash.success && (
                <div className="mb-4 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium ring-1 ring-[var(--bezel-ring)]">
                    {flash.success}
                </div>
            )}

            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                <BezelCard padding="p-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Бригад</p>
                    <p className="mt-1 text-2xl font-bold">{stats.brigades_count ?? brigadesOnObject.length}</p>
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
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Смен</p>
                    <p className="mt-1 text-2xl font-bold">{object?.work_days ?? '—'}</p>
                </BezelCard>
            </div>

            {!isClosed && (
                <BezelCard className="mb-8" padding="p-5 sm:p-6">
                    <h2 className="mb-4 font-bold">Параметры объекта</h2>
                    <form onSubmit={saveObject} className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Название
                            </label>
                            <input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="input-soft"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Адрес
                            </label>
                            <input
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className="input-soft"
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
                                        label: brigade.name,
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
                                Сохранить
                            </button>
                        </div>
                    </form>
                </BezelCard>
            )}

            <BezelCard padding="p-0" className="mb-8">
                <div className="border-b border-[var(--bezel-ring)] px-6 py-4">
                    <div className="flex items-center gap-2">
                        <UsersThree size={20} weight="light" className="text-[var(--accent)]" />
                        <h2 className="font-bold">Сотрудники на объекте</h2>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Зарплата берётся из карточки сотрудника и здесь не меняется.
                    </p>
                </div>
                {!isClosed && (
                    <form
                        onSubmit={addWorker}
                        className="flex flex-col gap-3 border-b border-[var(--bezel-ring)] px-6 py-4 sm:flex-row sm:items-end"
                    >
                        <div className="min-w-0 flex-1">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Добавить сотрудника
                            </label>
                            <SoftSelect
                                value={memberId}
                                onChange={setMemberId}
                                options={[
                                    { value: '', label: 'Выберите сотрудника' },
                                    ...availableWorkers.map((worker) => ({
                                        value: worker.id,
                                        label: worker.position
                                            ? `${worker.name} · ${worker.position}`
                                            : worker.name,
                                    })),
                                ]}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!memberId}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg)] disabled:opacity-50"
                        >
                            <Plus size={16} weight="light" />
                            Добавить
                        </button>
                    </form>
                )}
                <ul className="divide-y divide-[var(--bezel-ring)]">
                    {workers.length === 0 ? (
                        <li className="px-6 py-8 text-center text-[var(--muted)]">
                            На объекте пока никого нет
                        </li>
                    ) : (
                        workers.map((worker, i) => (
                            <motion.li
                                key={worker.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                                className="flex items-center justify-between gap-3 px-6 py-4"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.visit(
                                            route('manager.employees.show', worker.id),
                                        )
                                    }
                                    className="min-w-0 flex-1 text-left"
                                >
                                    <p className="truncate font-semibold">{worker.name}</p>
                                    <p className="truncate text-sm text-[var(--muted)]">
                                        {worker.position ?? 'Сотрудник'}
                                        {worker.rate != null
                                            ? ` · ${formatMoney(worker.rate)}`
                                            : ''}
                                        {worker.pay_type_label
                                            ? ` ${worker.pay_type_label.toLowerCase()}`
                                            : ''}
                                    </p>
                                </button>
                                <div className="flex shrink-0 items-center gap-2">
                                    <StatusBadge
                                        status={worker.is_working ? 'working' : 'absent'}
                                    />
                                    {!isClosed && (
                                        <button
                                            type="button"
                                            onClick={() => removeWorker(worker)}
                                            className="rounded-full p-2 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-600"
                                            aria-label="Снять с объекта"
                                        >
                                            <Trash size={16} weight="light" />
                                        </button>
                                    )}
                                </div>
                            </motion.li>
                        ))
                    )}
                </ul>
            </BezelCard>

            <BezelCard padding="p-0" className="mb-8">
                <div className="flex items-center gap-2 border-b border-[var(--bezel-ring)] px-6 py-4">
                    <UsersThree size={20} weight="light" className="text-[var(--accent)]" />
                    <h2 className="font-bold">Бригады на объекте</h2>
                </div>
                <ul className="divide-y divide-[var(--bezel-ring)]">
                    {brigadesOnObject.length === 0 ? (
                        <li className="px-6 py-8 text-center text-[var(--muted)]">Нет бригад</li>
                    ) : (
                        brigadesOnObject.map((brigade, i) => (
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
