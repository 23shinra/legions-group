import { showLocalNotification } from '@/lib/pwa';
import { router, usePage } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

const LIVE_PREFIXES = [
    'time.',
    'advance.',
    'payment.',
    'object.',
    'attendance.',
    'roster.',
    'activity.',
];

const FALLBACK_POLL_MS = 45_000;

const RealtimeContext = createContext(null);

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

function echoAvailable() {
    return typeof window !== 'undefined' && Boolean(window.Echo);
}

function echoConnected() {
    const state = window.Echo?.connector?.pusher?.connection?.state;

    return state === 'connected';
}

export function RealtimeProvider({ children }) {
    const { auth, notifications: initial = [] } = usePage().props;
    const userId = auth?.user?.id;
    const [notifications, setNotifications] = useState(initial);
    const [socketConnected, setSocketConnected] = useState(
        () => echoAvailable() && echoConnected(),
    );
    const seenIds = useRef(new Set(initial.map((item) => item.id)));
    const reloadTimer = useRef(null);
    const resyncTimer = useRef(null);
    const wasDisconnected = useRef(false);

    const requestReload = useCallback(() => {
        if (reloadTimer.current) {
            return;
        }

        reloadTimer.current = window.setTimeout(() => {
            reloadTimer.current = null;
            router.reload({
                preserveScroll: true,
                preserveState: true,
            });
        }, 120);
    }, []);

    const syncNotifications = useCallback(async () => {
        if (!userId) {
            return;
        }

        try {
            const response = await fetch(route('notifications.index'), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            const items = data.notifications ?? [];

            setNotifications(items);
            seenIds.current = new Set(items.map((item) => item.id));
        } catch {
            // Ignore transient network errors.
        }
    }, [userId]);

    const resyncState = useCallback(() => {
        if (resyncTimer.current) {
            return;
        }

        resyncTimer.current = window.setTimeout(async () => {
            resyncTimer.current = null;
            await syncNotifications();
            requestReload();
        }, 200);
    }, [requestReload, syncNotifications]);

    useEffect(() => {
        setNotifications(initial);
        seenIds.current = new Set(initial.map((item) => item.id));
    }, [initial]);

    useEffect(() => {
        if (!userId || !echoAvailable()) {
            setSocketConnected(false);

            return undefined;
        }

        const channelName = `App.Models.User.${userId}`;
        const channel = window.Echo.private(channelName);
        const pusher = window.Echo.connector?.pusher;

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
                tag: item.id,
            });
        });

        const onStateChange = (states) => {
            const connected = states.current === 'connected';

            setSocketConnected(connected);

            if (connected && wasDisconnected.current) {
                wasDisconnected.current = false;
                resyncState();
            }

            if (
                states.previous === 'connected' &&
                states.current !== 'connected'
            ) {
                wasDisconnected.current = true;
            }
        };

        pusher?.connection.bind('state_change', onStateChange);
        setSocketConnected(echoConnected());

        return () => {
            window.Echo.leave(channelName);
            pusher?.connection.unbind('state_change', onStateChange);

            if (reloadTimer.current) {
                window.clearTimeout(reloadTimer.current);
                reloadTimer.current = null;
            }

            if (resyncTimer.current) {
                window.clearTimeout(resyncTimer.current);
                resyncTimer.current = null;
            }
        };
    }, [userId, requestReload, resyncState]);

    useEffect(() => {
        if (!userId) {
            return undefined;
        }

        const onOnline = () => resyncState();
        const onVisible = () => {
            if (!document.hidden) {
                resyncState();
            }
        };

        window.addEventListener('online', onOnline);
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            window.removeEventListener('online', onOnline);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [userId, resyncState]);

    useEffect(() => {
        if (!userId || socketConnected) {
            return undefined;
        }

        syncNotifications();
        const intervalId = window.setInterval(syncNotifications, FALLBACK_POLL_MS);

        return () => window.clearInterval(intervalId);
    }, [userId, socketConnected, syncNotifications]);

    const removeNotification = useCallback((id) => {
        setNotifications((previous) => previous.filter((item) => item.id !== id));
        seenIds.current.delete(id);
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
        seenIds.current.clear();
    }, []);

    const value = useMemo(
        () => ({
            notifications,
            removeNotification,
            clearNotifications,
        }),
        [notifications, removeNotification, clearNotifications],
    );

    return (
        <RealtimeContext.Provider value={value}>
            {children}
        </RealtimeContext.Provider>
    );
}

export default function useRealtimeNotifications() {
    const context = useContext(RealtimeContext);

    if (!context) {
        throw new Error(
            'useRealtimeNotifications must be used within RealtimeProvider',
        );
    }

    return context;
}
