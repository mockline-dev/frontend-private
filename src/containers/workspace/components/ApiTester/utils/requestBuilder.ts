import type { AuthConfig, KeyValuePair, RequestState } from '../types';

function buildUrl(base: string, params: KeyValuePair[]): string {
    const enabled = params.filter((p) => p.enabled && p.key);
    if (!enabled.length) return base;

    const qs = new URLSearchParams(enabled.map((p) => [p.key, p.value])).toString();
    return base.includes('?') ? `${base}&${qs}` : `${base}?${qs}`;
}

function buildHeaders(headers: KeyValuePair[], auth: AuthConfig, contentType: string, hasBody: boolean): Record<string, string> {
    const result: Record<string, string> = {};

    for (const h of headers) {
        if (h.enabled && h.key) result[h.key] = h.value;
    }

    if (auth.type === 'bearer' && auth.token) {
        result['Authorization'] = `Bearer ${auth.token}`;
    } else if (auth.type === 'basic' && auth.username) {
        result['Authorization'] = `Basic ${btoa(`${auth.username}:${auth.password}`)}`;
    }

    if (hasBody && contentType) {
        result['Content-Type'] = contentType;
    }

    return result;
}

export function buildRequest(state: RequestState): { url: string; init: RequestInit } {
    const url = buildUrl(state.url, state.params);
    const hasBody = !['GET', 'HEAD', 'OPTIONS'].includes(state.method) && !!state.body;
    const headers = buildHeaders(state.headers, state.auth, state.contentType, hasBody);

    const init: RequestInit = {
        method: state.method,
        headers,
        ...(hasBody ? { body: state.body } : {}),
    };

    return { url, init };
}
