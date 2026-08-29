const MARK_SRC = '/icon-192.png?v=3';
const LOGO_SRC = '/images/logo.png?v=3';

function Mark({ size = 'h-8 w-8' }) {
    return (
        <img
            src={MARK_SRC}
            alt=""
            aria-hidden="true"
            className={`${size} shrink-0 rounded-xl object-cover ring-1 ring-[var(--bezel-ring)]`}
        />
    );
}

function Wordmark({ compact = false }) {
    return (
        <span className="text-left leading-tight">
            <span
                className={`block font-extrabold tracking-tight text-[var(--ink)] ${
                    compact ? 'text-sm sm:text-base' : 'text-sm sm:text-base'
                }`}
            >
                Legionis Group
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Control
            </span>
        </span>
    );
}

export default function BrandLogo({
    variant = 'full',
    className = '',
}) {
    if (variant === 'mark') {
        return (
            <span className={`inline-flex ${className}`}>
                <Mark />
            </span>
        );
    }

    if (variant === 'nav') {
        return (
            <img
                src={MARK_SRC}
                alt="Legionis Group"
                className={`h-full w-full object-cover ${className}`}
            />
        );
    }

    return (
        <span
            className={`inline-flex flex-col items-center gap-3 ${className}`}
        >
            <img
                src={LOGO_SRC}
                alt="Legionis Group"
                className="h-16 w-auto max-w-[220px] rounded-2xl object-contain ring-1 ring-[var(--bezel-ring)] sm:h-20 sm:max-w-[260px]"
            />
            <span className="text-center">
                <span className="block text-lg font-extrabold tracking-tight text-[var(--ink)] sm:text-xl">
                    Legionis Group
                </span>
                <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                    Control
                </span>
            </span>
        </span>
    );
}
