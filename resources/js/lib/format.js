export function formatMoney(n) {
    return new Intl.NumberFormat('ru-RU').format(n ?? 0) + ' ₸';
}

export function formatHours(minutes) {
    const m = minutes ?? 0;
    return Math.floor(m / 60) + ' ч ' + (m % 60) + ' мин';
}

export function formatDate(date) {
    if (!date) return '—';
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
}

export function formatTime(date) {
    if (!date) return '—';
    return new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

export function formatDateTime(date) {
    if (!date) return '—';
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}
