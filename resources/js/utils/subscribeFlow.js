export const SUBSCRIBE_INTENT = 'subscribe';
export const SUBSCRIBE_QUERY_PARAM = 'subscribe';

export function buildAuthQueryParams({ redirect = '/', intent } = {}) {
    const params = { redirect };

    if (intent) {
        params.intent = intent;
    }

    return params;
}

export function buildAuthUrl(routeName, options = {}) {
    return route(routeName, buildAuthQueryParams(options));
}

export function buildSubscribeAuthUrl(routeName = 'register') {
    return buildAuthUrl(routeName, {
        redirect: '/',
        intent: SUBSCRIBE_INTENT,
    });
}

export function hasSubscribeIntent(search = window.location.search) {
    return new URLSearchParams(search).get(SUBSCRIBE_QUERY_PARAM) === '1';
}

export function clearSubscribeIntent() {
    const url = new URL(window.location.href);
    url.searchParams.delete(SUBSCRIBE_QUERY_PARAM);
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;

    window.history.replaceState({}, '', nextUrl || '/');
}
