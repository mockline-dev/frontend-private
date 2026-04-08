'use client';

import { useCallback, useRef, useState } from 'react';
import type { ApiResponse, RequestState, RequestStatus } from '../types';
import { buildRequest } from '../utils/requestBuilder';
import { parseResponse } from '../utils/responseParser';

const MAX_409_RETRIES = 3;
const RETRY_409_DELAY_MS = 3000;

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
    const abortControllerRef = useRef<AbortController | null>(null);
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const sendRequest = useCallback(async (state: RequestState) => {
        // Cancel any in-flight request or pending retry
        abortControllerRef.current?.abort();
        if (retryTimerRef.current !== null) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
        retryCountRef.current = 0;

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setStatus('loading');
        setError(null);

        const attempt = async () => {
            const startTime = Date.now();
            try {
                const { url, init } = buildRequest(state);
                const res = await fetch(url, { ...init, signal: controller.signal });
                const parsed = await parseResponse(res, startTime);

                if (parsed.status === 409 && retryCountRef.current < MAX_409_RETRIES) {
                    retryCountRef.current++;
                    setStatus('loading');
                    retryTimerRef.current = setTimeout(() => {
                        retryTimerRef.current = null;
                        void attempt();
                    }, RETRY_409_DELAY_MS);
                    return;
                }

                setResponse(parsed);
                setStatus('success');
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                    setStatus('idle');
                } else {
                    setError(err instanceof Error ? err.message : 'Request failed');
                    setStatus('error');
                }
            }
        };

        await attempt();
    }, []);

    const cancelRequest = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        if (retryTimerRef.current !== null) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
        setStatus('idle');
    }, []);

    const clearResponse = useCallback(() => {
        setResponse(null);
        setStatus('idle');
        setError(null);
    }, []);

    return { response, status, error, sendRequest, cancelRequest, clearResponse };
}
