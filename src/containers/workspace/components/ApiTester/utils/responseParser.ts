import type { ApiResponse } from '../types';

export async function parseResponse(response: Response, startTime: number): Promise<ApiResponse> {
    const durationMs = Date.now() - startTime;

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
        headers[key] = value;
    });

    const raw = await response.text();
    const size = new TextEncoder().encode(raw).length;

    let body = raw;
    const ct = response.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
        try {
            body = JSON.stringify(JSON.parse(raw), null, 2);
        } catch {
            // leave as-is
        }
    }

    return {
        status: response.status,
        statusText: response.statusText,
        headers,
        body,
        durationMs,
        size,
    };
}

export function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
