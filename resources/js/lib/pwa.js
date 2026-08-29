export async function registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return null;
    }

    try {
        return await navigator.serviceWorker.register('/sw.js?v=3', {
            scope: '/',
        });
    } catch (error) {
        console.warn('Service worker registration failed', error);
        return null;
    }
}

export function notificationsSupported() {
    return (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator
    );
}

export async function showLocalNotification({
    title = 'Legionis Group',
    body = '',
    url = '/',
    tag = undefined,
} = {}) {
    if (!notificationsSupported() || Notification.permission !== 'granted') {
        return false;
    }

    const registration = await navigator.serviceWorker.ready;

    if (registration?.showNotification) {
        await registration.showNotification(title, {
            body,
            icon: '/icon-192.png?v=3',
            badge: '/favicon-32.png?v=3',
            tag,
            data: { url },
        });
        return true;
    }

    // Fallback when SW is unavailable
    // eslint-disable-next-line no-new
    new Notification(title, { body, icon: '/icon-192.png?v=3', tag });
    return true;
}
