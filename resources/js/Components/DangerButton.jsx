export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-full border border-transparent bg-[var(--ink)] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--bg)] shadow-soft transition-fluid hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--ink)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${className}`
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
