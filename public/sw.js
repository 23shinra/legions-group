/* Legionis Group PWA service worker v3 */
const SW_VERSION = 'legionis-v3';
self.addEventListener('install', (event) => {
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
    let payload = {
        title: 'Legionis Group',
        body: 'Новое уведомление',
        url: '/',
    };

    try {
        if (event.data) {
            const data = event.data.json();
            payload = { ...payload, ...data };
        }
    } catch {
        try {
            payload.body = event.data?.text() || payload.body;
        } catch {
            // ignore
        }
    }

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: '/icon-192.png?v=3',
            badge: '/favicon-32.png?v=3',
            data: { url: payload.url || '/' },
        }),
    );
});

self.addEventListener('message', (event) => {
    const data = event.data || {};

    if (data.type === 'SHOW_NOTIFICATION') {
        event.waitUntil(
            self.registration.showNotification(data.title || 'Legionis Group', {
                body: data.body || '',
                icon: '/icon-192.png?v=3',
                badge: '/favicon-32.png?v=3',
                data: { url: data.url || '/' },
            }),
        );
    }
});
