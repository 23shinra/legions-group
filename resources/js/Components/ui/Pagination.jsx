import { CaretLeft, CaretRight } from '@phosphor-icons/react';

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className = '',
}) {
    if (totalPages <= 1) {
        return null;
    }

    const buttonClass = (disabled) =>
        `inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold transition-fluid ${
            disabled
                ? 'cursor-not-allowed text-[var(--muted)] opacity-40'
                : 'text-[var(--ink)] hover:bg-[var(--bezel)] active:scale-[0.98]'
        }`;

    return (
        <div
            className={`flex items-center justify-between gap-3 border-t border-[var(--bezel-ring)] px-4 py-3 sm:px-6 ${className}`}
        >
            <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className={buttonClass(currentPage <= 1)}
            >
                <CaretLeft size={16} weight="bold" />
                Назад
            </button>

            <p className="text-sm font-medium text-[var(--muted)]">
                Страница {currentPage} из {totalPages}
            </p>

            <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className={buttonClass(currentPage >= totalPages)}
            >
                Далее
                <CaretRight size={16} weight="bold" />
            </button>
        </div>
    );
}
