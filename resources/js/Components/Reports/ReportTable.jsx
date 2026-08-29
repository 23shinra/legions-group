import { formatHours, formatMoney } from '@/lib/format';
import { Link } from '@inertiajs/react';

function lateClass(count) {
    return count > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-[var(--muted)]';
}

export default function ReportTable({
    rows = [],
    nameKey = 'employee',
    nameLabel = 'Сотрудник',
    secondaryKey = null,
    secondaryLabel = null,
    showRouteName = null,
    empty = 'Нет данных за выбранный период',
}) {
    if (rows.length === 0) {
        return (
            <div className="px-4 py-12 text-center text-sm text-[var(--muted)] sm:px-6">
                {empty}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-[var(--bezel-ring)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                        <th className="px-4 py-3 sm:px-6">{nameLabel}</th>
                        {secondaryLabel ? (
                            <th className="px-3 py-3">{secondaryLabel}</th>
                        ) : null}
                        <th className="px-3 py-3 text-right">Часы</th>
                        <th className="px-3 py-3 text-right">Заработано</th>
                        <th className="px-3 py-3 text-right">Опоздания</th>
                        <th className="px-4 py-3 text-right sm:px-6">Остаток</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bezel-ring)]">
                    {rows.map((row, index) => {
                        const name = row[nameKey] ?? row.employee ?? row.brigade ?? '—';
                        const href =
                            showRouteName && row.id
                                ? route(showRouteName, row.id)
                                : null;

                        return (
                            <tr key={row.id ?? `${name}-${index}`}>
                                <td className="px-4 py-3.5 font-semibold text-[var(--ink)] sm:px-6">
                                    {href ? (
                                        <Link
                                            href={href}
                                            className="underline-offset-2 hover:underline"
                                        >
                                            {name}
                                        </Link>
                                    ) : (
                                        name
                                    )}
                                </td>
                                {secondaryLabel ? (
                                    <td className="px-3 py-3.5 text-[var(--muted)]">
                                        {row[secondaryKey] ?? '—'}
                                    </td>
                                ) : null}
                                <td className="whitespace-nowrap px-3 py-3.5 text-right text-[var(--ink)]">
                                    {formatHours(row.hours ?? 0)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3.5 text-right font-medium text-[var(--ink)]">
                                    {formatMoney(row.accrued ?? 0)}
                                </td>
                                <td
                                    className={`whitespace-nowrap px-3 py-3.5 text-right font-semibold ${lateClass(row.lates ?? 0)}`}
                                >
                                    {row.lates ?? 0}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3.5 text-right font-bold text-[var(--accent)] sm:px-6">
                                    {formatMoney(row.remaining ?? 0)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
