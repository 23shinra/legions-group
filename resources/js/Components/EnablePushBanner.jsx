import useNotificationPermission from '@/hooks/useNotificationPermission';
import { usePage } from '@inertiajs/react';
import { BellRinging } from '@phosphor-icons/react';

const ROLE_HINTS = {
    worker: 'Сообщим, когда подтвердят приход, одобрят аванс или выплатят зарплату',
    brigadier: 'Сообщим о приходе, авансе, конце смены и опозданиях',
    manager: 'Сообщим о заявках на аванс, выходах на объект и опозданиях',
    accountant: 'Сообщим об одобренных авансах и закрытых объектах',
};

export default function EnablePushBanner({ text }) {
    const { auth, hasPushSubscription } = usePage().props;
    const role = auth?.user?.role;
    const hint = text ?? ROLE_HINTS[role] ?? ROLE_HINTS.worker;
    const {
        supported,
        isGranted,
        isDenied,
        busy,
        requestPermission,
    } = useNotificationPermission();

    if (!supported || (isGranted && hasPushSubscription)) {
        return null;
    }

    if (isDenied) {
        return (
            <div className="rounded-[1.5rem] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)] ring-1 ring-[var(--bezel-ring)]">
                Уведомления запрещены. Разрешите их в настройках телефона для
                Legionis — иначе не придут сообщения о приходе, авансе и выплатах.
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={requestPermission}
            disabled={busy}
            className="flex w-full items-center gap-3 rounded-[1.5rem] bg-[var(--accent)] px-4 py-3.5 text-left text-[var(--bg)] shadow-soft transition-fluid active:scale-[0.98] disabled:opacity-60"
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg)]/15">
                <BellRinging size={20} weight="light" />
            </span>
            <span className="min-w-0">
                <span className="block text-sm font-bold leading-snug">
                    {busy
                        ? 'Запрос…'
                        : isGranted
                          ? 'Подключить уведомления на этом телефоне'
                          : 'Включить уведомления'}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--bg)]/75">
                    {hint}
                </span>
            </span>
        </button>
    );
}
