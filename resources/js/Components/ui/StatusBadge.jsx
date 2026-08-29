const STATUS_STYLES = {
    pending:
        'bg-[var(--bezel)] text-[var(--ink)] ring-[var(--bezel-ring)]',
    approved:
        'bg-emerald-500/20 text-emerald-700 ring-emerald-500/35 shadow-[0_0_10px_rgba(16,185,129,0.25)] [data-theme=dark]:bg-emerald-500/25 [data-theme=dark]:text-emerald-300 [data-theme=dark]:ring-emerald-400/40 [data-theme=dark]:shadow-[0_0_14px_rgba(52,211,153,0.35)]',
    rejected:
        'bg-[var(--surface)] text-[var(--muted)] ring-[var(--bezel-ring)] line-through decoration-[var(--muted)]',
    paid: 'bg-[var(--surface-muted)] text-[var(--ink)] ring-[var(--bezel-ring)]',
    active: 'bg-[var(--accent)] text-[var(--bg)] ring-[var(--accent)]',
    working:
        'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 [data-theme=dark]:text-emerald-300',
    awaiting:
        'bg-amber-500/15 text-amber-800 ring-amber-500/30 [data-theme=dark]:text-amber-300',
    absent: 'bg-red-500/15 text-red-700 ring-red-500/30 [data-theme=dark]:text-red-300',
    late: 'bg-amber-500/15 text-amber-800 ring-amber-500/30 [data-theme=dark]:text-amber-300',
    planned: 'bg-[var(--bezel)] text-[var(--ink)] ring-[var(--bezel-ring)]',
    completed: 'bg-[var(--surface-muted)] text-[var(--ink)] ring-[var(--bezel-ring)]',
    closed: 'bg-[var(--bezel)] text-[var(--muted)] ring-[var(--bezel-ring)]',
    open: 'bg-[var(--accent)] text-[var(--bg)] ring-[var(--accent)]',
};

const STATUS_LABELS = {
    pending: 'Ожидает',
    approved: 'Одобрено',
    rejected: 'Отклонено',
    paid: 'Выплачено',
    active: 'В работе',
    working: 'На объекте',
    awaiting: 'Ожидает подтверждения',
    absent: 'Не на объекте',
    late: 'Опоздал',
    planned: 'Планируется',
    completed: 'Завершён',
    closed: 'Закрыт',
    open: 'Открыт',
};

export default function StatusBadge({ status, label, className = '' }) {
    const key = (status ?? '').toLowerCase();
    const styles =
        STATUS_STYLES[key] ??
        'bg-[var(--bezel)] text-[var(--ink)] ring-[var(--bezel-ring)]';
    const text = label ?? STATUS_LABELS[key] ?? status;

    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 ${styles} ${className}`}
        >
            {text}
        </span>
    );
}
