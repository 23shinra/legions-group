import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lg-theme-v2';

function readTheme() {
    if (typeof document === 'undefined') {
        return 'light';
    }

    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') {
        return attr;
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
    } catch {
        // ignore
    }

    return 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // ignore
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', theme === 'dark' ? '#0c0c0c' : '#f2f2f2');
    }
}

export default function useTheme() {
    const [theme, setThemeState] = useState(readTheme);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const setTheme = useCallback((next) => {
        setThemeState(next === 'dark' ? 'dark' : 'light');
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    return { theme, setTheme, toggleTheme, isDark: theme === 'dark' };
}
