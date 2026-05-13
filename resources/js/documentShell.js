import { getInitialPageFromDOM } from '@inertiajs/core';

const STYLE_ID = 'inertia-document-shell-style';

function urlPathOnly(url) {
    if (!url) {
        return '';
    }
    try {
        if (/^https?:\/\//i.test(url)) {
            return new URL(url).pathname;
        }
    } catch {
        /* ignore */
    }
    const p = url.split('?')[0] ?? '';
    return p.startsWith('/') ? p : `/${p}`;
}

/** Exact path or subpath only (e.g. /admin matches /admin/foo, not /admin-login). */
function pathMatchesBase(urlPath, base) {
    if (!urlPath || !base) {
        return false;
    }
    return urlPath === base || urlPath.startsWith(`${base}/`);
}

function isAuthShellPath(urlPath) {
    if (!urlPath) {
        return false;
    }
    const bases = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/confirm-password',
    ];
    return bases.some((base) => pathMatchesBase(urlPath, base));
}

/**
 * @param {import('@inertiajs/core').Page | null | undefined} page
 */
export function resolveDocumentShell(page) {
    if (!page) {
        return { bg: '#ffffff', colorScheme: 'light' };
    }

    const component = page.component ?? '';
    const urlPath = urlPathOnly(page.url);

    if (
        component === 'TestLanding' ||
        urlPath === '/test' ||
        pathMatchesBase(urlPath, '/test')
    ) {
        return { bg: '#050505', colorScheme: 'dark' };
    }

    if (component.startsWith('Auth/') || isAuthShellPath(urlPath)) {
        return { bg: '#f3f4f6', colorScheme: 'light' };
    }

    if (component === 'Welcome' || urlPath === '/') {
        return { bg: '#f9fafb', colorScheme: 'light' };
    }

    if (
        component === 'Dashboard' ||
        component === 'Admin/Dashboard' ||
        component === 'Profile/Edit' ||
        pathMatchesBase(urlPath, '/dashboard') ||
        pathMatchesBase(urlPath, '/admin') ||
        pathMatchesBase(urlPath, '/profile')
    ) {
        return { bg: '#0b1220', colorScheme: 'dark' };
    }

    return { bg: '#ffffff', colorScheme: 'light' };
}

function shellCss(bg, colorScheme) {
    return `
html, body {
  background-color: ${bg} !important;
  background: ${bg} !important;
  color-scheme: ${colorScheme} !important;
  -webkit-tap-highlight-color: transparent !important;
  overscroll-behavior: none !important;
}
html {
  height: 100% !important;
}
body, #app {
  min-height: 100vh !important;
  min-height: 100dvh !important;
}
`.trim();
}

function ensureStyleEl() {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
        el = document.createElement('style');
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }
    return el;
}

function syncThemeColor(content) {
    let m = document.querySelector('meta[name="theme-color"]');
    if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', 'theme-color');
        document.head.appendChild(m);
    }
    m.setAttribute('content', content);
}

/**
 * @param {import('@inertiajs/core').Page | null | undefined} page
 */
export function applyDocumentShellFromPage(page) {
    if (typeof document === 'undefined') {
        return;
    }

    const { bg, colorScheme } = resolveDocumentShell(page);
    ensureStyleEl().textContent = shellCss(bg, colorScheme);
    syncThemeColor(bg);

    const html = document.documentElement;
    const body = document.body;
    const app = document.getElementById('app');

    html.style.backgroundColor = bg;
    html.style.minHeight = '100%';
    body.style.backgroundColor = bg;
    body.style.minHeight = '100dvh';
    if (app) {
        app.style.backgroundColor = '';
        app.style.minHeight = '100dvh';
    }

    requestAnimationFrame(() => {
        html.style.backgroundColor = bg;
        body.style.backgroundColor = bg;
        if (app) {
            app.style.backgroundColor = '';
        }
    });
}

export function initDocumentShell() {
    if (typeof document === 'undefined') {
        return;
    }

    const initial = getInitialPageFromDOM('app');
    if (initial) {
        applyDocumentShellFromPage(initial);
    }

    const onPage = (event) => {
        const page = event?.detail?.page;
        if (page) {
            applyDocumentShellFromPage(page);
        }
    };

    document.addEventListener('inertia:beforeUpdate', onPage);
    document.addEventListener('inertia:navigate', onPage);

    document.addEventListener('inertia:start', (event) => {
        const visit = event?.detail?.visit;
        const rawUrl = visit?.url;
        if (!rawUrl) {
            return;
        }
        let path = '';
        if (typeof rawUrl === 'object' && rawUrl !== null && 'pathname' in rawUrl) {
            path = urlPathOnly(rawUrl.pathname || '/');
        } else if (typeof rawUrl === 'string') {
            path = urlPathOnly(rawUrl);
        } else if (typeof rawUrl.href === 'string') {
            path = urlPathOnly(rawUrl.href);
        }
        if (path) {
            applyDocumentShellFromPage({ component: '', url: path });
        }
    });
}
