import { backendUrl } from '@/config/environment';

export interface ApiTestRequest {
    sessionId: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
}

export interface ApiTestResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    durationMs: number;
}

export const sendTestRequest = async (request: ApiTestRequest): Promise<ApiTestResponse> => {
    const { sessionId, method, path, headers = {}, body } = request;
    const url = `${backendUrl}/api-test/${sessionId}${path.startsWith('/') ? path : `/${path}`}`;

    const startTime = Date.now();

    const fetchOptions: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (body !== undefined) {
        fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

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
};
