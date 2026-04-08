import type { HttpMethod } from './types';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const METHOD_COLORS: Record<HttpMethod, { text: string; bg: string }> = {
    GET: { text: 'text-emerald-700', bg: 'bg-emerald-50' },
    POST: { text: 'text-blue-700', bg: 'bg-blue-50' },
    PUT: { text: 'text-amber-700', bg: 'bg-amber-50' },
    PATCH: { text: 'text-violet-700', bg: 'bg-violet-50' },
    DELETE: { text: 'text-red-700', bg: 'bg-red-50' },
    HEAD: { text: 'text-zinc-600', bg: 'bg-zinc-100' },
    OPTIONS: { text: 'text-zinc-600', bg: 'bg-zinc-100' },
};

export const DEFAULT_CONTENT_TYPES = ['application/json', 'application/x-www-form-urlencoded', 'text/plain', 'multipart/form-data'];
