import {
    notificationsSupported,
    registerServiceWorker,
    showLocalNotification,
} from '@/lib/pwa';
import { useCallback, useEffect, useState } from 'react';

function readPermission() {
    if (!notificationsSupported()) {
        return 'unsupported';
    }

    return Notification.permission;
}

export default function useNotificationPermission() {
    const [permission, setPermission] = useState(readPermission);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setPermission(readPermission());
        registerServiceWorker();
    }, []);

    const requestPermission = useCallback(async () => {
        if (!notificationsSupported()) {
            setPermission('unsupported');
            setError('Уведомления не поддерживаются в этом браузере');
            return 'unsupported';
        }

        setBusy(true);
        setError(null);

        try {
            await registerServiceWorker();
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                await showLocalNotification({
                    title: 'Legionis Group',
                    body: 'Уведомления включены',
                    url: '/settings',
                });
            } else if (result === 'denied') {
                setError(
                    'Доступ запрещён. Разрешите уведомления в настройках браузера.',
                );
            }

            return result;
        } catch (err) {
            setError('Не удалось запросить разрешение');
            return 'default';
        } finally {
            setBusy(false);
        }
    }, []);

    return {
        permission,
        busy,
        error,
        supported: permission !== 'unsupported',
        isGranted: permission === 'granted',
        isDenied: permission === 'denied',
        isDefault: permission === 'default',
        requestPermission,
    };
}
