/* Legionis Group PWA service worker v8 */
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            for (const client of clients) {
                if ('focus' in client) {
                    client.focus();
                    if ('navigate' in client) {
                        client.navigate(targetUrl);
                    }
                    return;
                }
            }

            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        }),
    );
});

self.addEventListener('push', (event) => {
    event.waitUntil(showPushNotification(event));
});

async function showPushNotification(event) {
    const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
    });

    if (windowClients.some((client) => client.visibilityState === 'visible')) {
        return;
    }

    let payload = {
        title: 'Legionis Group',
        body: 'Новое уведомление',
        url: '/',
        icon: '/icon-192.png?v=4',
        badge: '/favicon-32.png?v=4',
        tag: 'legionis',
    };

    try {
        if (event.data) {
            const data = event.data.json();
            payload = {
                ...payload,
                ...data,
                url: data?.data?.url || data?.url || payload.url,
                tag: data?.tag || data?.data?.type || payload.tag,
            };
        }
    } catch {
        try {
            payload.body = event.data?.text() || payload.body;
        } catch {
            // ignore
        }
    }

    await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192.png?v=4',
        badge: payload.badge || '/favicon-32.png?v=4',
        tag: payload.tag,
        renotify: false,
        data: { url: payload.url || '/' },
    });
}
