export default function SecondaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-full border border-transparent bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--ink)] shadow-soft ring-1 ring-[var(--bezel-ring)] transition-fluid hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${className}`
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
