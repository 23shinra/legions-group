import { showLocalNotification } from '@/lib/pwa';
import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

const LIVE_PREFIXES = [
    'time.',
    'advance.',
    'payment.',
    'object.',
    'attendance.',
    'roster.',
    'activity.',
];

function payloadMarkers(payload) {
    return [
        payload?.event,
        payload?.type,
        payload?.data?.event,
        payload?.data?.type,
    ]
        .filter(Boolean)
        .map((value) => String(value));
}

function isLiveEvent(payload) {
    const markers = payloadMarkers(payload);

    return markers.some((value) =>
        LIVE_PREFIXES.some((prefix) => value.includes(prefix)),
    );
}

function notificationTitle(payload) {
    const markers = payloadMarkers(payload).join(' ');

    if (markers.includes('advance')) {
        return 'Аванс';
    }

    if (markers.includes('payment')) {
        return 'Выплата';
    }

    if (markers.includes('arrival') || markers.includes('time.')) {
        return 'Смена';
    }

    if (markers.includes('object')) {
        return 'Объект';
    }

    if (markers.includes('attendance')) {
        return 'Посещаемость';
    }

    return 'Legionis Group';
}

function normalizeNotification(raw) {
    const data = raw?.data && typeof raw.data === 'object' ? raw.data : raw;

    return {
        id: raw.id ?? data.id ?? null,
        type: data.type ?? raw.type ?? null,
        message: data.message ?? raw.message ?? '',
        url: data.url ?? raw.url ?? null,
        created_at: raw.created_at ?? data.created_at ?? new Date().toISOString(),
    };
}

export default function useRealtimeNotifications() {
    const { auth, notifications: initial = [] } = usePage().props;
    const [notifications, setNotifications] = useState(initial);
    const seenIds = useRef(new Set(initial.map((item) => item.id)));
    const reloadTimer = useRef(null);

    const requestReload = useCallback(() => {
        if (reloadTimer.current) {
            return;
        }

        reloadTimer.current = window.setTimeout(() => {
            reloadTimer.current = null;
            router.reload({ preserveScroll: true });
        }, 120);
    }, []);

    useEffect(() => {
        setNotifications(initial);
        seenIds.current = new Set(initial.map((item) => item.id));
    }, [initial]);

    useEffect(() => {
        const userId = auth?.user?.id;

        if (!userId || !window.Echo) {
            return undefined;
        }

        const channelName = `App.Models.User.${userId}`;
        const channel = window.Echo.private(channelName);

        channel.notification((payload) => {
            const item = normalizeNotification(payload);

            if (isLiveEvent(payload) || isLiveEvent(item)) {
                requestReload();
            }

            if (!item.message) {
                return;
            }

            if (!item.id || seenIds.current.has(item.id)) {
                return;
            }

            seenIds.current.add(item.id);
            setNotifications((previous) => [item, ...previous].slice(0, 20));

            showLocalNotification({
                title: notificationTitle(payload),
                body: item.message,
                url: item.url ?? '/',
            });
        });

        return () => {
            window.Echo.leave(`private-${channelName}`);

            if (reloadTimer.current) {
                window.clearTimeout(reloadTimer.current);
                reloadTimer.current = null;
            }
        };
    }, [auth?.user?.id, requestReload]);

    useEffect(() => {
        const userId = auth?.user?.id;

        if (!userId) {
            return undefined;
        }

        let cancelled = false;

        const sync = async () => {
            if (cancelled) {
                return;
            }

            try {
                const response = await fetch(route('notifications.index'), {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok || cancelled) {
                    return;
                }

                const data = await response.json();
                const items = data.notifications ?? [];

                setNotifications(items);
                seenIds.current = new Set(items.map((item) => item.id));
            } catch {
                // Ignore transient network errors — Echo remains primary.
            }
        };

        sync();
        const intervalId = window.setInterval(sync, 8000);
        const onVisible = () => {
            if (!document.hidden) {
                sync();
            }
        };

        document.addEventListener('visibilitychange', onVisible);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [auth?.user?.id]);

    const removeNotification = useCallback((id) => {
        setNotifications((previous) => previous.filter((item) => item.id !== id));
        seenIds.current.delete(id);
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
        seenIds.current.clear();
    }, []);

    return {
        notifications,
        removeNotification,
        clearNotifications,
    };
}
