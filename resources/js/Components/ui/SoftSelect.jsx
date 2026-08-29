import { CaretDown, Check, MagnifyingGlass } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const EASE = [0.32, 0.72, 0, 1];

function sameValue(a, b) {
    return String(a ?? '') === String(b ?? '');
}

export default function SoftSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Выберите',
    disabled = false,
    searchable,
    className = '',
    id,
    name,
}) {
    const listId = useId();
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const searchRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlight, setHighlight] = useState(-1);
    const [coords, setCoords] = useState(null);

    const selected = options.find((option) => sameValue(option.value, value));
    const isPlaceholder = !selected || sameValue(selected.value, '');
    const showSearch = searchable ?? options.length > 8;

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();

        if (!needle) {
            return options;
        }

        return options.filter((option) =>
            String(option.label).toLowerCase().includes(needle),
        );
    }, [options, query]);

    const updateCoords = () => {
        const trigger = triggerRef.current;

        if (!trigger) {
            return;
        }

        const rect = trigger.getBoundingClientRect();
        const gap = 8;
        const maxHeight = 280;
        const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
        const spaceAbove = rect.top - gap - 12;
        const openUp = spaceBelow < 168 && spaceAbove > spaceBelow;
        const available = openUp ? spaceAbove : spaceBelow;

        setCoords({
            top: openUp ? undefined : rect.bottom + gap,
            bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
            left: Math.max(12, Math.min(rect.left, window.innerWidth - rect.width - 12)),
            width: rect.width,
            maxHeight: Math.max(140, Math.min(maxHeight, available)),
        });
    };

    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        updateCoords();
    }, [open, filtered.length]);

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

    useEffect(() => {
        if (!open) {
            setQuery('');
            setHighlight(-1);

            return;
        }

        const selectedIndex = filtered.findIndex((option) => sameValue(option.value, value));
        setHighlight(selectedIndex >= 0 ? selectedIndex : 0);

        requestAnimationFrame(() => {
            if (showSearch) {
                searchRef.current?.focus();
            }
        });
    }, [open]);

    const pick = (option) => {
        onChange(String(option.value ?? ''));
        setOpen(false);
        triggerRef.current?.focus();
    };

    const moveHighlight = (delta) => {
        if (filtered.length === 0) {
            return;
        }

        setHighlight((current) => {
            const next = current < 0 ? 0 : (current + delta + filtered.length) % filtered.length;

            requestAnimationFrame(() => {
                panelRef.current
                    ?.querySelector(`[data-option-index="${next}"]`)
                    ?.scrollIntoView({ block: 'nearest' });
            });

            return next;
        });
    };

    const onTriggerKeyDown = (event) => {
        if (disabled) {
            return;
        }

        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
        }
    };

    const onPanelKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveHighlight(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveHighlight(-1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const option = filtered[highlight];

            if (option) {
                pick(option);
            }
        }
    };

    return (
        <div className={`relative ${className}`}>
            {name ? <input type="hidden" name={name} value={value ?? ''} /> : null}
            <button
                ref={triggerRef}
                id={id}
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                onClick={() => !disabled && setOpen((current) => !current)}
                onKeyDown={onTriggerKeyDown}
                className={`input-soft flex w-full items-center justify-between gap-3 text-left ${
                    open ? 'ring-2 ring-[var(--accent)]' : ''
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
                <span className={`min-w-0 truncate ${isPlaceholder ? 'text-[var(--muted)]' : ''}`}>
                    {selected?.label || placeholder}
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
                                role="listbox"
                                id={listId}
                                initial={{ opacity: 0, y: coords.bottom ? 6 : -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: coords.bottom ? 4 : -4, scale: 0.98 }}
                                transition={{ duration: 0.22, ease: EASE }}
                                onKeyDown={onPanelKeyDown}
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
                                <div className="overflow-hidden rounded-[calc(1.25rem-0.25rem)] bg-[var(--surface)] sm:rounded-[calc(1.5rem-0.25rem)]">
                                    {showSearch ? (
                                        <div className="border-b border-[var(--bezel-ring)] p-2">
                                            <label className="flex items-center gap-2 rounded-xl bg-[var(--surface-muted)] px-3 py-2 ring-1 ring-[var(--bezel-ring)]">
                                                <MagnifyingGlass
                                                    size={16}
                                                    className="shrink-0 text-[var(--muted)]"
                                                />
                                                <input
                                                    ref={searchRef}
                                                    value={query}
                                                    onChange={(event) => {
                                                        setQuery(event.target.value);
                                                        setHighlight(0);
                                                    }}
                                                    className="w-full border-0 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                                                    placeholder="Поиск"
                                                />
                                            </label>
                                        </div>
                                    ) : null}
                                    <div
                                        className="overflow-y-auto overscroll-contain p-1"
                                        style={{ maxHeight: coords.maxHeight }}
                                    >
                                        {filtered.length === 0 ? (
                                            <p className="px-3 py-3 text-sm text-[var(--muted)]">
                                                Ничего не найдено
                                            </p>
                                        ) : (
                                            filtered.map((option, index) => {
                                                const active = sameValue(option.value, value);
                                                const highlighted = index === highlight;

                                                return (
                                                    <button
                                                        key={`${option.value}-${index}`}
                                                        type="button"
                                                        role="option"
                                                        aria-selected={active}
                                                        data-option-index={index}
                                                        onMouseEnter={() => setHighlight(index)}
                                                        onClick={() => pick(option)}
                                                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                                            highlighted
                                                                ? 'bg-[var(--surface-muted)] text-[var(--ink)]'
                                                                : 'text-[var(--ink)]'
                                                        } ${sameValue(option.value, '') ? 'text-[var(--muted)]' : ''}`}
                                                    >
                                                        <span className="min-w-0 truncate">{option.label}</span>
                                                        {active ? (
                                                            <Check
                                                                size={16}
                                                                weight="bold"
                                                                className="shrink-0 text-[var(--ink)]"
                                                            />
                                                        ) : null}
                                                    </button>
                                                );
                                            })
                                        )}
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
