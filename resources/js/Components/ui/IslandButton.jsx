import { Link } from '@inertiajs/react';

const ICON_WRAPPER = {
    primary: 'bg-[var(--bg)]/15',
    secondary: 'bg-[var(--bezel)]',
    danger: 'bg-[var(--bg)]/15',
    ghost: 'bg-[var(--bezel)]',
};

export default function IslandButton({
    children,
    href,
    onClick,
    type = 'button',
    method,
    as,
    icon: Icon,
    variant = 'primary',
    disabled = false,
    className = '',
}) {
    const variants = {
        primary:
            'bg-[var(--accent)] text-[var(--bg)] hover:opacity-90 shadow-soft',
        secondary:
            'bg-[var(--surface)] text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] hover:bg-[var(--surface-muted)] shadow-soft',
        danger: 'bg-[var(--ink)] text-[var(--bg)] hover:opacity-90 shadow-soft',
        ghost: 'bg-transparent text-[var(--ink)] hover:bg-[var(--bezel)]',
    };

    const baseClass = `group inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-semibold transition-fluid active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`;

    const content = (
        <>
            <span>{children}</span>
            {Icon && (
                <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-fluid group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 group-active:scale-95 ${ICON_WRAPPER[variant]}`}
                >
                    <Icon size={16} weight="light" />
                </span>
            )}
        </>
    );

    if (href) {
        return (
            <Link
                href={href}
                method={method}
                as={as}
                className={baseClass}
                onClick={onClick}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            type={type}
            className={baseClass}
            onClick={onClick}
            disabled={disabled}
        >
            {content}
        </button>
    );
}
