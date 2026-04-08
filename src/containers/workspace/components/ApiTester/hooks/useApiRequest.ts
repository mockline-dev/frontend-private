'use client';

import { useCallback, useState } from 'react';
import type { ApiResponse, RequestState, RequestStatus } from '../types';
import { buildRequest } from '../utils/requestBuilder';
import { parseResponse } from '../utils/responseParser';

interface UseApiRequestResult {
    response: ApiResponse | null;
    status: RequestStatus;
    error: string | null;
    sendRequest: (state: RequestState) => Promise<void>;
    cancelRequest: () => void;
    clearResponse: () => void;
}

export function useApiRequest(): UseApiRequestResult {
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [status, setStatus] = useState<RequestStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const sendRequest = useCallback(async (state: RequestState) => {
        abortController?.abort();

        const controller = new AbortController();
        setAbortController(controller);
        setStatus('loading');
        setError(null);

        const startTime = Date.now();

        try {
            const { url, init } = buildRequest(state);
            const res = await fetch(url, { ...init, signal: controller.signal });
            const parsed = await parseResponse(res, startTime);
            setResponse(parsed);
            setStatus('success');
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                setStatus('idle');
            } else {
                setError(err instanceof Error ? err.message : 'Request failed');
                setStatus('error');
            }
        } finally {
            setAbortController(null);
        }
    }, [abortController]);

    const cancelRequest = useCallback(() => {
        abortController?.abort();
        setAbortController(null);
        setStatus('idle');
    }, [abortController]);

    const clearResponse = useCallback(() => {
        setResponse(null);
        setStatus('idle');
        setError(null);
    }, []);

    return { response, status, error, sendRequest, cancelRequest, clearResponse };
}
