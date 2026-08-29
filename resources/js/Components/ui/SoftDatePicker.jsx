import { CalendarBlank, CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const EASE = [0.32, 0.72, 0, 1];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
];
const MONTHS_GENITIVE = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
];

function pad(value) {
    return String(value).padStart(2, '0');
}

function todayParts() {
    const now = new Date();

    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

function toDateValue(year, month, day) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function toMonthValue(year, month) {
    return `${year}-${pad(month + 1)}`;
}

function parseValue(value, mode) {
    if (!value) {
        return null;
    }

    const [year, month, day] = String(value).split('-').map(Number);

    if (!year || !month) {
        return null;
    }

    return {
        year,
        month: month - 1,
        day: mode === 'month' ? 1 : day || 1,
    };
}

function formatDisplay(value, mode, placeholder) {
    const parsed = parseValue(value, mode);

    if (!parsed) {
        return placeholder;
    }

    if (mode === 'month') {
        return `${MONTHS[parsed.month]} ${parsed.year}`;
    }

    return `${parsed.day} ${MONTHS_GENITIVE[parsed.month]} ${parsed.year}`;
}

function calendarDays(year, month) {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const cells = [];

    for (let index = 0; index < startOffset; index += 1) {
        const day = daysInPrev - startOffset + index + 1;
        const date = new Date(year, month - 1, day);
        cells.push({
            key: `prev-${day}`,
            day,
            value: toDateValue(date.getFullYear(), date.getMonth(), day),
            current: false,
        });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push({
            key: `cur-${day}`,
            day,
            value: toDateValue(year, month, day),
            current: true,
        });
    }

    const remainder = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);

    for (let day = 1; day <= remainder; day += 1) {
        const date = new Date(year, month + 1, day);
        cells.push({
            key: `next-${day}`,
            day,
            value: toDateValue(date.getFullYear(), date.getMonth(), day),
            current: false,
        });
    }

    return cells;
}

export default function SoftDatePicker({
    value = '',
    onChange,
    mode = 'date',
    placeholder,
    disabled = false,
    className = '',
    id,
    name,
}) {
    const listId = useId();
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState(null);
    const [view, setView] = useState('days');
    const parsed = parseValue(value, mode);
    const [cursor, setCursor] = useState(() => {
        const seed = parsed ?? todayParts();

        return { year: seed.year, month: seed.month };
    });

    const emptyLabel = placeholder ?? (mode === 'month' ? 'Выберите месяц' : 'Выберите дату');
    const display = formatDisplay(value, mode, emptyLabel);
    const isEmpty = !parsed;
    const today = todayParts();
    const todayValue = mode === 'month'
        ? toMonthValue(today.year, today.month)
        : toDateValue(today.year, today.month, today.day);
    const days = useMemo(
        () => calendarDays(cursor.year, cursor.month),
        [cursor.year, cursor.month],
    );
    const yearStart = Math.floor(cursor.year / 12) * 12;
    const years = Array.from({ length: 12 }, (_, index) => yearStart + index);

    const updateCoords = () => {
        const trigger = triggerRef.current;

        if (!trigger) {
            return;
        }

        const rect = trigger.getBoundingClientRect();
        const gap = 8;
        const width = Math.min(Math.max(rect.width, 308), window.innerWidth - 24);
        const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
        const estimatedHeight = mode === 'month' || view !== 'days' ? 280 : 360;
        const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
        const spaceAbove = rect.top - gap - 12;
        const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

        setCoords({
            top: openUp ? undefined : rect.bottom + gap,
            bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
            left,
            width,
        });
    };

    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        updateCoords();
    }, [open, view, cursor.year, cursor.month, mode]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const seed = parseValue(value, mode) ?? todayParts();
        setCursor({ year: seed.year, month: seed.month });
        setView(mode === 'month' ? 'months' : 'days');
    }, [open, mode]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const onPointer = (event) => {
            const target = event.target;

            if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
                return;
            }

            setOpen(false);
        };

        const onKey = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
                triggerRef.current?.focus();
            }
        };

        const onReposition = () => updateCoords();

        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);

        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [open]);

    const pick = (next) => {
        onChange(next);
        setOpen(false);
        triggerRef.current?.focus();
    };

    const shiftCursor = (delta) => {
        if (view === 'years') {
            setCursor((current) => ({ ...current, year: current.year + delta * 12 }));
            return;
        }

        if (view === 'months' || mode === 'month') {
            setCursor((current) => ({ ...current, year: current.year + delta }));
            return;
        }

        setCursor((current) => {
            const date = new Date(current.year, current.month + delta, 1);

            return { year: date.getFullYear(), month: date.getMonth() };
        });
    };

    const headerLabel =
        view === 'years'
            ? `${years[0]} – ${years[years.length - 1]}`
            : view === 'months' || mode === 'month'
              ? String(cursor.year)
              : `${MONTHS[cursor.month]} ${cursor.year}`;

    const cycleView = () => {
        if (mode === 'month') {
            setView((current) => (current === 'years' ? 'months' : 'years'));
            return;
        }

        setView((current) => {
            if (current === 'days') {
                return 'months';
            }

            if (current === 'months') {
                return 'years';
            }

            return 'days';
        });
    };

    return (
        <div className={`relative ${className}`}>
            {name ? <input type="hidden" name={name} value={value ?? ''} /> : null}
            <button
                ref={triggerRef}
                id={id}
                type="button"
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                onClick={() => !disabled && setOpen((current) => !current)}
                className={`input-soft flex w-full items-center justify-between gap-3 text-left ${
                    open ? 'ring-2 ring-[var(--accent)]' : ''
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
                <span className="flex min-w-0 items-center gap-2.5">
                    <CalendarBlank size={18} weight="light" className="shrink-0 text-[var(--muted)]" />
                    <span className={`min-w-0 truncate ${isEmpty ? 'text-[var(--muted)]' : ''}`}>
                        {display}
                    </span>
                </span>
                <CaretDown
                    size={16}
                    weight="bold"
                    className={`shrink-0 text-[var(--muted)] transition-transform duration-300 ease-fluid ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {open && coords ? (
                            <motion.div
                                ref={panelRef}
                                id={listId}
                                role="dialog"
                                initial={{ opacity: 0, y: coords.bottom ? 6 : -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: coords.bottom ? 4 : -4, scale: 0.98 }}
                                transition={{ duration: 0.22, ease: EASE }}
                                style={{
                                    position: 'fixed',
                                    top: coords.top,
                                    bottom: coords.bottom,
                                    left: coords.left,
                                    width: coords.width,
                                    zIndex: 80,
                                }}
                                className="overflow-hidden rounded-[1.25rem] bg-[var(--bezel)] p-1 shadow-lift ring-1 ring-bezel sm:rounded-[1.5rem]"
                            >
                                <div className="rounded-[calc(1.25rem-0.25rem)] bg-[var(--surface)] p-3 sm:rounded-[calc(1.5rem-0.25rem)] sm:p-3.5">
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => shiftCursor(-1)}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] transition-fluid hover:ring-[var(--accent)]"
                                            aria-label="Назад"
                                        >
                                            <CaretLeft size={16} weight="bold" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cycleView}
                                            className="min-w-0 flex-1 truncate rounded-full px-2 py-2 text-sm font-semibold text-[var(--ink)] transition-fluid hover:bg-[var(--surface-muted)]"
                                        >
                                            {headerLabel}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => shiftCursor(1)}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] transition-fluid hover:ring-[var(--accent)]"
                                            aria-label="Вперёд"
                                        >
                                            <CaretRight size={16} weight="bold" />
                                        </button>
                                    </div>

                                    {view === 'days' && mode === 'date' ? (
                                        <>
                                            <div className="mb-1 grid grid-cols-7 gap-1">
                                                {WEEKDAYS.map((day) => (
                                                    <div
                                                        key={day}
                                                        className="py-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
                                                    >
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {days.map((cell) => {
                                                    const selected = cell.value === value;
                                                    const isToday = cell.value === todayValue;

                                                    return (
                                                        <button
                                                            key={cell.key}
                                                            type="button"
                                                            onClick={() => pick(cell.value)}
                                                            className={`flex h-9 items-center justify-center rounded-full text-sm transition-colors ${
                                                                selected
                                                                    ? 'bg-[var(--accent)] font-semibold text-[var(--bg)]'
                                                                    : isToday
                                                                      ? 'font-semibold text-[var(--ink)] ring-1 ring-[var(--accent)]'
                                                                      : cell.current
                                                                        ? 'text-[var(--ink)] hover:bg-[var(--surface-muted)]'
                                                                        : 'text-[var(--muted)] hover:bg-[var(--surface-muted)]'
                                                            }`}
                                                        >
                                                            {cell.day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : null}

                                    {view === 'months' ? (
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {MONTHS.map((label, month) => {
                                                const next = toMonthValue(cursor.year, month);
                                                const selected =
                                                    mode === 'month'
                                                        ? next === value
                                                        : parsed?.year === cursor.year &&
                                                          parsed?.month === month;

                                                return (
                                                    <button
                                                        key={label}
                                                        type="button"
                                                        onClick={() => {
                                                            if (mode === 'month') {
                                                                pick(next);
                                                                return;
                                                            }

                                                            setCursor((current) => ({
                                                                ...current,
                                                                month,
                                                            }));
                                                            setView('days');
                                                        }}
                                                        className={`rounded-xl px-2 py-2.5 text-sm transition-colors ${
                                                            selected
                                                                ? 'bg-[var(--accent)] font-semibold text-[var(--bg)]'
                                                                : 'text-[var(--ink)] hover:bg-[var(--surface-muted)]'
                                                        }`}
                                                    >
                                                        {label.slice(0, 3)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : null}

                                    {view === 'years' ? (
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {years.map((year) => {
                                                const selected = (parsed?.year ?? today.year) === year;

                                                return (
                                                    <button
                                                        key={year}
                                                        type="button"
                                                        onClick={() => {
                                                            setCursor((current) => ({ ...current, year }));
                                                            setView('months');
                                                        }}
                                                        className={`rounded-xl px-2 py-2.5 text-sm transition-colors ${
                                                            selected
                                                                ? 'bg-[var(--accent)] font-semibold text-[var(--bg)]'
                                                                : 'text-[var(--ink)] hover:bg-[var(--surface-muted)]'
                                                        }`}
                                                    >
                                                        {year}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : null}

                                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--bezel-ring)] pt-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (mode === 'month') {
                                                    pick(todayValue);
                                                    return;
                                                }

                                                pick(todayValue);
                                            }}
                                            className="rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition-fluid hover:bg-[var(--surface-muted)]"
                                        >
                                            {mode === 'month' ? 'Этот месяц' : 'Сегодня'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => pick('')}
                                            className="rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition-fluid hover:bg-[var(--surface-muted)]"
                                        >
                                            Очистить
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>,
                    document.body,
                )}
        </div>
    );
}
