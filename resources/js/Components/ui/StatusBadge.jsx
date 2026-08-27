const STATUS_STYLES = {
    pending: 'bg-neutral-100 text-neutral-700 ring-neutral-300/70',
    approved: 'bg-neutral-900 text-white ring-neutral-900',
    rejected: 'bg-white text-neutral-500 ring-neutral-300 line-through decoration-neutral-400',
    paid: 'bg-neutral-200 text-neutral-900 ring-neutral-400/60',
    active: 'bg-neutral-900 text-white ring-neutral-900',
    working: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 [data-theme=dark]:text-emerald-300',
    absent: 'bg-red-500/15 text-red-700 ring-red-500/30 [data-theme=dark]:text-red-300',
    closed: 'bg-neutral-100 text-neutral-500 ring-neutral-200/80',
    open: 'bg-neutral-900 text-white ring-neutral-900',
};

const STATUS_LABELS = {
    pending: 'Ожидает',
    approved: 'Одобрено',
    rejected: 'Отклонено',
    paid: 'Выплачено',
    active: 'Активен',
    working: 'На объекте',
    absent: 'Не на объекте',
    closed: 'Закрыт',
    open: 'Открыт',
};

export default function StatusBadge({ status, label, className = '' }) {
    const key = (status ?? '').toLowerCase();
    const styles = STATUS_STYLES[key] ?? 'bg-neutral-100 text-neutral-600 ring-neutral-200/60';
    const text = label ?? STATUS_LABELS[key] ?? status;

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 ${styles} ${className}`}
        >
            {text}
        </span>
    );
}
