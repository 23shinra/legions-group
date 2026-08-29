import BezelCard from '@/Components/ui/BezelCard';
import { formatHours, formatMoney } from '@/lib/format';

function DetailRow({ label, value, accent = false }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-[var(--bezel-ring)] px-4 py-4 last:border-0 sm:px-6">
            <span className="text-sm text-[var(--muted)]">{label}</span>
            <span
                className={`max-w-[55%] break-words text-right text-sm font-semibold ${
                    accent ? 'text-[var(--accent)]' : 'text-[var(--ink)]'
                }`}
            >
                {value}
            </span>
        </div>
    );
}

export default function EmployeeReportDetail({ report = {} }) {
    return (
        <BezelCard padding="p-0">
            <div className="border-b border-[var(--bezel-ring)] px-4 py-4 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                    Период
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                    {report.period ?? '—'}
                </p>
                {report.brigade && (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        {report.brigade}
                    </p>
                )}
            </div>

            <DetailRow
                label="Отработано смен"
                value={`${report.days ?? 0}`}
            />
            <DetailRow label="Часы" value={formatHours(report.hours ?? 0)} />
            <DetailRow
                label="Опоздания"
                value={`${report.lates ?? 0}`}
            />
            <DetailRow
                label="Заработано"
                value={formatMoney(report.accrued ?? 0)}
            />
            <DetailRow
                label="Авансы"
                value={formatMoney(report.advances ?? 0)}
            />
            <DetailRow
                label="Выплачено"
                value={formatMoney(report.paid ?? 0)}
            />
            <DetailRow
                label="Остаток к выплате"
                value={formatMoney(report.remaining ?? 0)}
                accent
            />
        </BezelCard>
    );
}
