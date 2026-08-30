function csrfHeaders() {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN':
            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
    };
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);

    for (let i = 0; i < raw.length; i += 1) {
        output[i] = raw.charCodeAt(i);
    }

    return output;
}

export async function registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return null;
    }

    try {
        return await navigator.serviceWorker.register('/sw.js?v=6', {
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

export function pushSupported() {
    return notificationsSupported() && 'PushManager' in window;
}

const claimedBanners = new Set();

export function claimBanner(key) {
    if (!key || claimedBanners.has(key)) {
        return false;
    }

    claimedBanners.add(key);
    return true;
}

export async function showLocalNotification({
    title = 'Legionis Group',
    body = '',
    url = '/',
    tag,
} = {}) {
    if (!notificationsSupported() || Notification.permission !== 'granted') {
        return false;
    }

    const registration = await navigator.serviceWorker.ready;

    if (registration?.showNotification) {
        await registration.showNotification(title, {
            body,
            icon: '/icon-192.png?v=4',
            badge: '/favicon-32.png?v=4',
            tag: tag || url || 'legionis',
            renotify: false,
            data: { url },
        });
        return true;
    }

    // eslint-disable-next-line no-new
    new Notification(title, { body, icon: '/icon-192.png?v=4', tag });
    return true;
}

export async function subscribeToPush(vapidPublicKey) {
    if (!pushSupported() || !vapidPublicKey || Notification.permission !== 'granted') {
        return null;
    }

    await registerServiceWorker();
    const registration = await navigator.serviceWorker.ready;

    if (!registration?.pushManager) {
        return null;
    }

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
    }

    await fetch(route('push-subscriptions.store'), {
        method: 'POST',
        headers: csrfHeaders(),
        body: JSON.stringify(subscription.toJSON()),
    });

    return subscription;
}

export async function ensurePushSubscription(vapidPublicKey) {
    if (!notificationsSupported()) {
        return null;
    }

    try {
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
            return await subscribeToPush(vapidPublicKey);
        }
    } catch {
        // Действие пользователя важнее подписки.
    }

    return null;
}
