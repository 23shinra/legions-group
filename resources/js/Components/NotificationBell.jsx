import useRealtimeNotifications from '@/hooks/useRealtimeNotifications';
import { router } from '@inertiajs/react';
import { Bell, Checks } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

function timeAgo(iso) {
    if (!iso) {
        return '';
    }

    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const mins = Math.floor(diff / 60000);

    if (mins < 1) {
        return 'только что';
    }
    if (mins < 60) {
        return `${mins} мин назад`;
    }

    const hours = Math.floor(mins / 60);
    if (hours < 24) {
        return `${hours} ч назад`;
    }

    return `${Math.floor(hours / 24)} дн назад`;
}

export default function NotificationBell() {
    const { notifications, removeNotification, clearNotifications } =
        useRealtimeNotifications();
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const count = notifications.length;

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const onPointer = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', onPointer);

        return () => document.removeEventListener('pointerdown', onPointer);
    }, [open]);

    const openItem = (item) => {
        setOpen(false);
        removeNotification(item.id);
        router.post(route('notifications.read', item.id));
    };

    const markAll = () => {
        router.post(route('notifications.read-all'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                clearNotifications();
                setOpen(false);
            },
        });
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-label="Уведомления"
                className={`relative flex h-10 w-10 items-center justify-center rounded-full shadow-soft backdrop-blur-xl transition-fluid ${
                    open
                        ? 'bg-[var(--accent)] text-[var(--bg)]'
                        : 'bg-[var(--nav-glass)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
            >
                <Bell size={18} weight="light" />
                {count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ink)] px-1 text-[10px] font-bold text-[var(--bg)]">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {open ? (
                    <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.5rem] bg-[var(--bezel)] p-1.5 shadow-lift">
                        <div className="rounded-[calc(1.5rem-0.375rem)] bg-[var(--surface)]">
                            <div className="flex items-center justify-between gap-2 border-b border-[var(--bezel-ring)] px-4 py-3">
                                <p className="text-sm font-bold text-[var(--ink)]">
                                    Уведомления
                                </p>
                                {count > 0 && (
                                    <button
                                        type="button"
                                        onClick={markAll}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted)] transition-fluid hover:text-[var(--ink)]"
                                    >
                                        <Checks size={14} weight="light" />
                                        Прочитать все
                                    </button>
                                )}
                            </div>

                            <ul className="max-h-80 overflow-y-auto">
                                {count === 0 ? (
                                    <li className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                                        Новых уведомлений нет
                                    </li>
                                ) : (
                                    notifications.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                type="button"
                                                onClick={() => openItem(item)}
                                                className="flex w-full flex-col gap-1 border-b border-[var(--bezel-ring)] px-4 py-3 text-left transition-fluid last:border-0 hover:bg-[var(--surface-muted)]"
                                            >
                                                <span className="text-sm font-semibold leading-snug text-[var(--ink)]">
                                                    {item.message}
                                                </span>
                                                <span className="text-[11px] text-[var(--muted)]">
                                                    {timeAgo(item.created_at)}
                                                </span>
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                ) : null}
        </div>
    );
}
