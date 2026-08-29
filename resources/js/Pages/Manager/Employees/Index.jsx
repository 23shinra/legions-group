import ManagerEmployeesSettings from '@/Components/ManagerEmployeesSettings';
import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatMoney } from '@/lib/format';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Plus, Trash, ArrowCounterClockwise, Users } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

function groupByBrigade(employees) {
    const groups = new Map();

    for (const employee of employees) {
        const key = employee.brigade?.id ?? 'none';
        const label = employee.brigade?.name ?? 'Без бригады';

        if (!groups.has(key)) {
            groups.set(key, { id: key, name: label, members: [] });
        }

        groups.get(key).members.push(employee);
    }

    return Array.from(groups.values()).sort((a, b) =>
        a.name.localeCompare(b.name, 'ru'),
    );
}

export default function Index({
    employees = [],
    filters = {},
    status,
    brigades = [],
    payTypes = [],
}) {
    const flash = usePage().props.flash ?? {};
    const [query, setQuery] = useState('');
    const [owedOnly, setOwedOnly] = useState(Boolean(filters.owed));
    const [showInactive, setShowInactive] = useState(false);
    const [showAdd, setShowAdd] = useState(false);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return employees.filter((employee) => {
            if (!showInactive && employee.is_active === false) {
                return false;
            }

            if (owedOnly && !(Number(employee.remaining) > 0)) {
                return false;
            }

            if (!q) {
                return true;
            }

            const haystack = [
                employee.name,
                employee.phone,
                employee.position,
                employee.brigade?.name,
                employee.email,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(q);
        });
    }, [employees, query, owedOnly, showInactive]);

    const brigadeGroups = useMemo(
        () => groupByBrigade(filtered),
        [filtered],
    );

    const openEmployee = (id) => {
        router.visit(route('manager.employees.show', id));
    };

    const removeEmployee = (event, employee) => {
        event.stopPropagation();
        event.preventDefault();

        if (
            !confirm(
                `Убрать ${employee.name} из работы? История смен и зарплата останутся.`,
            )
        ) {
            return;
        }

        router.delete(route('manager.employees.destroy', employee.id), {
            preserveScroll: true,
        });
    };

    const restoreEmployee = (event, employee) => {
        event.stopPropagation();
        event.preventDefault();
        router.post(route('manager.employees.restore', employee.id), {}, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <Head title="Сотрудники" />

            <PageHeader
                eyebrow="Персонал"
                title="Сотрудники"
                subtitle="Ставка ставится один раз в карточке — на всех объектах одна и та же. Бухгалтеру заново вбивать не нужно."
                actions={
                    <IslandButton
                        onClick={() => setShowAdd((open) => !open)}
                        icon={Plus}
                    >
                        {showAdd ? 'Скрыть форму' : 'Добавить'}
                    </IslandButton>
                }
            />

            {(flash.success || status === 'employee-created') && (
                <div className="mb-4 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium ring-1 ring-[var(--bezel-ring)]">
                    {flash.success || 'Сотрудник добавлен'}
                </div>
            )}

            {showAdd && (
                <div className="mb-6">
                    <ManagerEmployeesSettings
                        brigades={brigades}
                        payTypes={payTypes}
                        status={status}
                    />
                </div>
            )}

            <BezelCard className="mb-6" padding="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="input-soft flex-1"
                        placeholder="Поиск по ФИО, бригаде, телефону…"
                    />
                    <label className="inline-flex shrink-0 items-center gap-2 text-sm font-medium">
                        <input
                            type="checkbox"
                            checked={owedOnly}
                            onChange={(e) => setOwedOnly(e.target.checked)}
                            className="rounded border-[var(--bezel-ring)]"
                        />
                        Кому должны зарплату
                    </label>
                    <label className="inline-flex shrink-0 items-center gap-2 text-sm font-medium">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="rounded border-[var(--bezel-ring)]"
                        />
                        Показать удалённых
                    </label>
                </div>
            </BezelCard>

            {filtered.length === 0 ? (
                <BezelCard padding="p-10">
                    <div className="text-center text-[var(--muted)]">
                        <Users
                            size={32}
                            weight="light"
                            className="mx-auto mb-3 opacity-40"
                        />
                        Сотрудники не найдены
                    </div>
                </BezelCard>
            ) : (
                <div className="space-y-6">
                    {brigadeGroups.map((group, groupIndex) => (
                        <BezelCard key={group.id} padding="p-0">
                            <div className="border-b border-[var(--bezel-ring)] px-4 py-4 sm:px-6">
                                <h2 className="font-bold text-[var(--ink)]">
                                    {group.name}
                                </h2>
                                <p className="mt-1 text-sm text-[var(--muted)]">
                                    {group.members.length} чел.
                                </p>
                            </div>

                            <ul className="divide-y divide-[var(--bezel-ring)] md:hidden">
                                {group.members.map((employee, i) => (
                                    <motion.li
                                        key={employee.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay:
                                                groupIndex * 0.05 + i * 0.03,
                                            duration: 0.6,
                                            ease: [0.32, 0.72, 0, 1],
                                        }}
                                        className="flex items-center"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEmployee(employee.id)
                                            }
                                            className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left transition-fluid active:bg-[var(--surface-muted)]"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-[var(--ink)]">
                                                    {employee.name}
                                                </p>
                                                <p className="truncate text-xs text-[var(--muted)]">
                                                    {employee.position ?? '—'}
                                                    {employee.rate != null
                                                        ? ` · ${formatMoney(employee.rate)}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                status={
                                                    employee.is_active === false
                                                        ? 'closed'
                                                        : employee.is_working
                                                          ? 'working'
                                                          : 'absent'
                                                }
                                                label={
                                                    employee.is_active === false
                                                        ? 'Удалён'
                                                        : undefined
                                                }
                                                className="shrink-0 whitespace-nowrap"
                                            />
                                        </button>
                                        {employee.is_active === false ? (
                                            <button
                                                type="button"
                                                onClick={(event) =>
                                                    restoreEmployee(
                                                        event,
                                                        employee,
                                                    )
                                                }
                                                className="shrink-0 rounded-full p-2 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
                                                aria-label="Вернуть"
                                            >
                                                <ArrowCounterClockwise
                                                    size={16}
                                                    weight="light"
                                                />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(event) =>
                                                    removeEmployee(
                                                        event,
                                                        employee,
                                                    )
                                                }
                                                className="shrink-0 rounded-full p-2 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-600"
                                                aria-label="Удалить"
                                            >
                                                <Trash
                                                    size={16}
                                                    weight="light"
                                                />
                                            </button>
                                        )}
                                    </motion.li>
                                ))}
                            </ul>

                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--bezel-ring)] bg-[var(--surface-muted)]">
                                            <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                                Имя
                                            </th>
                                            <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                                Должность
                                            </th>
                                            <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                                Ставка
                                            </th>
                                            <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                                К выплате
                                            </th>
                                            <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                                Статус
                                            </th>
                                            <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                                {' '}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.members.map((employee, i) => (
                                            <motion.tr
                                                key={employee.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    delay:
                                                        groupIndex * 0.05 +
                                                        i * 0.03,
                                                    duration: 0.6,
                                                    ease: [0.32, 0.72, 0, 1],
                                                }}
                                                onClick={() =>
                                                    openEmployee(employee.id)
                                                }
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === 'Enter' ||
                                                        e.key === ' '
                                                    ) {
                                                        e.preventDefault();
                                                        openEmployee(
                                                            employee.id,
                                                        );
                                                    }
                                                }}
                                                tabIndex={0}
                                                role="link"
                                                className="cursor-pointer border-b border-[var(--bezel-ring)] transition-fluid last:border-0 hover:bg-[var(--surface-muted)]"
                                            >
                                                <td className="px-6 py-4 font-semibold text-[var(--ink)]">
                                                    {employee.name}
                                                </td>
                                                <td className="px-6 py-4 text-[var(--muted)]">
                                                    {employee.position ?? '—'}
                                                </td>
                                                <td className="px-6 py-4 text-[var(--muted)]">
                                                    {formatMoney(employee.rate ?? 0)}
                                                    {employee.pay_type_label
                                                        ? ` · ${employee.pay_type_label}`
                                                        : ''}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-[var(--accent)]">
                                                    {formatMoney(employee.remaining ?? 0)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge
                                                        status={
                                                            employee.is_active ===
                                                            false
                                                                ? 'closed'
                                                                : employee.is_working
                                                                  ? 'working'
                                                                  : 'absent'
                                                        }
                                                        label={
                                                            employee.is_active ===
                                                            false
                                                                ? 'Удалён'
                                                                : undefined
                                                        }
                                                        className="whitespace-nowrap"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {employee.is_active ===
                                                    false ? (
                                                        <button
                                                            type="button"
                                                            onClick={(event) =>
                                                                restoreEmployee(
                                                                    event,
                                                                    employee,
                                                                )
                                                            }
                                                            className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                                                            aria-label="Вернуть"
                                                        >
                                                            <ArrowCounterClockwise
                                                                size={16}
                                                                weight="light"
                                                            />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={(event) =>
                                                                removeEmployee(
                                                                    event,
                                                                    employee,
                                                                )
                                                            }
                                                            className="rounded-full p-2 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-600"
                                                            aria-label="Удалить"
                                                        >
                                                            <Trash
                                                                size={16}
                                                                weight="light"
                                                            />
                                                        </button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </BezelCard>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
