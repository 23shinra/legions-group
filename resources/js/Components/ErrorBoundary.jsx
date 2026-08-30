import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        console.error('Legionis render error', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg,#f2f2f2)] px-6 py-10">
                    <div className="max-w-sm text-center">
                        <p className="text-lg font-bold text-[var(--ink,#111)]">
                            Не удалось открыть страницу
                        </p>
                        <p className="mt-2 text-sm text-[var(--muted,#666)]">
                            Обновите экран. Вход с нескольких устройств разрешён — повторите попытку.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                window.location.assign(`${window.location.origin}/dashboard?_=${Date.now()}`);
                            }}
                            className="mt-5 rounded-full bg-[var(--accent,#111)] px-5 py-3 text-sm font-semibold text-white"
                        >
                            Обновить
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
