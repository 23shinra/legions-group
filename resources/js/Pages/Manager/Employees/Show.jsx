import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import SoftSelect from '@/Components/ui/SoftSelect';
import StatPill from '@/Components/ui/StatPill';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatHours, formatMoney, formatTime } from '@/lib/format';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowCounterClockwise,
    ArrowLeft,
    Buildings,
    Clock,
    CurrencyCircleDollar,
    Trash,
    Wallet,
} from '@phosphor-icons/react';

export default function Show({
    employee,
    balance = {},
    recentEntries = [],
    recentAdvances = [],
    assignments = [],
    brigades = [],
    payTypes = [],
}) {
    const page = usePage();
    const payroll = page.props.payroll ?? {};
    const flash = page.props.flash ?? {};
    const payTypeValue =
        typeof employee?.pay_type === 'object'
            ? employee?.pay_type?.value
            : employee?.pay_type;

    const { data, setData, patch, processing, errors } = useForm({
        name: employee?.name ?? '',
        phone: employee?.phone ?? '',
        position: employee?.position ?? '',
        brigade_id: employee?.brigade_id ?? '',
        pay_type: payTypeValue ?? 'hourly',
        rate: employee?.rate ?? '',
        max_advance: employee?.max_advance ?? '',
        is_active: employee?.is_active ?? true,
        rate_note: '',
    });

    const save = (event) => {
        event.preventDefault();
        patch(route('manager.employees.update', employee.id), {
            preserveScroll: true,
        });
    };

    const removeEmployee = () => {
        if (
            !confirm(
                `Убрать ${employee.name} из работы? История смен и зарплата останутся.`,
            )
        ) {
            return;
        }

        router.delete(route('manager.employees.destroy', employee.id));
    };

    const restoreEmployee = () => {
        router.post(route('manager.employees.restore', employee.id), {}, {
            preserveScroll: true,
        });
    };

    const salaryHistory = employee?.salary_histories ?? [];

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
                    <div className="flex flex-wrap gap-3">
                        <IslandButton
                            href={route('manager.employees.index')}
                            icon={ArrowLeft}
                            variant="secondary"
                        >
                            Назад
                        </IslandButton>
                        {employee?.is_active === false ? (
                            <IslandButton
                                onClick={restoreEmployee}
                                icon={ArrowCounterClockwise}
                            >
                                Вернуть
                            </IslandButton>
                        ) : (
                            <IslandButton
                                onClick={removeEmployee}
                                icon={Trash}
                                variant="danger"
                            >
                                Удалить
                            </IslandButton>
                        )}
                    </div>
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

            {flash.success && (
                <div className="mb-4 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium ring-1 ring-[var(--bezel-ring)]">
                    {flash.success}
                </div>
            )}

            {employee?.is_active === false && (
                <div className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-500/20">
                    Сотрудник убран из работы. Ставка и история сохранены.
                </div>
            )}

            <BezelCard className="mb-8" padding="p-5 sm:p-6">
                <h2 className="mb-1 font-bold">Карточка сотрудника</h2>
                <p className="mb-4 text-sm text-[var(--muted)]">
                    Ставка одна на человека. На любом объекте будет эта же сумма —
                    бухгалтеру заново вбивать не нужно.
                </p>
                <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                            ФИО
                        </label>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="input-soft"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                            Телефон
                        </label>
                        <input
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="input-soft"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                            Должность
                        </label>
                        <input
                            value={data.position}
                            onChange={(e) => setData('position', e.target.value)}
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
                            Тип оплаты
                        </label>
                        <SoftSelect
                            value={data.pay_type}
                            onChange={(next) => {
                                setData('pay_type', next);
                                if (next === 'daily') {
                                    setData('rate', payroll.daily_rate ?? 18000);
                                } else if (next === 'hourly' || next === 'custom') {
                                    setData('rate', payroll.hourly_rate ?? 1800);
                                }
                            }}
                            options={payTypes.map((type) => ({
                                value: type.value,
                                label: type.label,
                            }))}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                            Ставка
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.rate}
                            onChange={(e) => setData('rate', e.target.value)}
                            className="input-soft"
                        />
                        <p className="mt-1.5 text-xs text-[var(--muted)]">
                            Стандарт: {payroll.daily_rate ?? 18000} ₸ за{' '}
                            {payroll.workday_hours ?? 10} ч (
                            {payroll.hourly_rate ?? 1800} ₸/ч). Переработка —{' '}
                            {payroll.overtime_rate ?? 1500} ₸/ч.
                        </p>
                        {errors.rate && (
                            <p className="mt-1 text-sm text-red-600">{errors.rate}</p>
                        )}
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                            Лимит аванса
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.max_advance}
                            onChange={(e) => setData('max_advance', e.target.value)}
                            className="input-soft"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                            Комментарий к ставке
                        </label>
                        <input
                            value={data.rate_note}
                            onChange={(e) => setData('rate_note', e.target.value)}
                            className="input-soft"
                            placeholder="При изменении ставки"
                        />
                    </div>
                    <div className="flex items-center gap-3 sm:col-span-2">
                        <label className="inline-flex items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={Boolean(data.is_active)}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-[var(--bezel-ring)]"
                            />
                            Активен
                        </label>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] disabled:opacity-50"
                        >
                            {processing ? 'Сохранение…' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </BezelCard>

            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <BezelCard padding="p-0">
                    <div className="flex items-center gap-2 border-b border-[var(--bezel-ring)] px-6 py-4">
                        <Wallet size={20} weight="light" className="text-[var(--accent)]" />
                        <h2 className="font-bold">История ставки</h2>
                    </div>
                    <ul className="divide-y divide-[var(--bezel-ring)]">
                        {salaryHistory.length === 0 ? (
                            <li className="px-6 py-8 text-center text-[var(--muted)]">Нет записей</li>
                        ) : (
                            salaryHistory.map((row) => (
                                <li key={row.id} className="px-6 py-4">
                                    <div className="flex justify-between gap-4">
                                        <div>
                                            <p className="font-medium">
                                                {formatMoney(row.rate)} ·{' '}
                                                {row.pay_type?.label ??
                                                    row.pay_type ??
                                                    '—'}
                                            </p>
                                            <p className="text-sm text-[var(--muted)]">
                                                с {formatDate(row.effective_from)}
                                                {row.note ? ` · ${row.note}` : ''}
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
                        <Buildings size={20} weight="light" className="text-[var(--accent)]" />
                        <h2 className="font-bold">История объектов</h2>
                    </div>
                    <ul className="divide-y divide-[var(--bezel-ring)]">
                        {assignments.length === 0 ? (
                            <li className="px-6 py-8 text-center text-[var(--muted)]">Нет назначений</li>
                        ) : (
                            assignments.map((row) => (
                                <li key={row.id} className="px-6 py-4">
                                    <p className="font-medium">
                                        {row.work_object?.name ?? '—'}
                                    </p>
                                    <p className="text-sm text-[var(--muted)]">
                                        {formatDate(row.started_on)}
                                        {' — '}
                                        {row.ended_on
                                            ? formatDate(row.ended_on)
                                            : 'н.в.'}
                                    </p>
                                </li>
                            ))
                        )}
                    </ul>
                </BezelCard>
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
                                                {entry.work_object?.name ?? '—'}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p>
                                                {formatTime(entry.started_at)} —{' '}
                                                {entry.ended_at
                                                    ? formatTime(entry.ended_at)
                                                    : '…'}
                                            </p>
                                            <p className="font-semibold text-[var(--accent)]">
                                                {formatHours(entry.worked_minutes)}
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
                                <li
                                    key={advance.id}
                                    className="flex items-center justify-between px-6 py-4"
                                >
                                    <div>
                                        <p className="font-semibold">
                                            {formatMoney(advance.amount)}
                                        </p>
                                        <p className="text-sm text-[var(--muted)]">
                                            {formatDate(advance.created_at)}
                                        </p>
                                    </div>
                                    <StatusBadge status={advance.status} />
                                </li>
                            ))
                        )}
                    </ul>
                </BezelCard>
            </div>
        </AppLayout>
    );
}
