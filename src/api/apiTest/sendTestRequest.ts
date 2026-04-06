import { backendUrl } from '@/config/environment';
import { HttpMethod } from '@/types/common';

export interface SendTestRequestParams {
    sessionId: string;
    method: HttpMethod;
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
    token: string;
}

export interface TestRequestResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    durationMs: number;
    error?: string;
}

export const sendTestRequest = async (params: SendTestRequestParams): Promise<TestRequestResponse> => {
    const { sessionId, method, path, headers = {}, body, token } = params;

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${backendUrl}/api-test/${sessionId}${cleanPath}`;

    const startTime = Date.now();

    try {
        const requestInit: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...headers
            }
        };

        if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
            requestInit.body = JSON.stringify(body);
        }

        const response = await fetch(url, requestInit);

        const durationMs = Date.now() - startTime;

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        let responseBody: unknown;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            responseBody = await response.json();
        } else {
            responseBody = await response.text();
        }

        return {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody,
            durationMs
        };
    } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Request failed';
        return {
            status: 0,
            statusText: 'Network Error',
            headers: {},
            body: null,
            durationMs: Date.now() - startTime,
            error
        };
    }
};
