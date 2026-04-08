'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EndpointGroup } from '../types';
import { parseOpenApiSpec } from '../utils/openApiParser';

const FETCH_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 5;

interface UseOpenApiSpecResult {
    groups: EndpointGroup[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useOpenApiSpec(specUrl: string | undefined): UseOpenApiSpecResult {
    const [groups, setGroups] = useState<EndpointGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const retryCountRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);

    const fetchSpec = useCallback(async (isRetry = false) => {
        if (!specUrl) {
            setGroups([]);
            setLoading(false);
            return;
        }

        if (!isRetry) {
            retryCountRef.current = 0;
            setError(null);
        }

        setLoading(true);

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        try {
            const res = await fetch(specUrl, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const spec = await res.json();
            setGroups(parseOpenApiSpec(spec));
            setError(null);
            setLoading(false);
            retryCountRef.current = 0;
        } catch (err) {
            if (controller.signal.aborted && retryCountRef.current < MAX_RETRIES) {
                // Server not ready yet — retry after delay
                retryCountRef.current += 1;
                retryTimerRef.current = setTimeout(() => void fetchSpec(true), RETRY_DELAY_MS);
            } else {
                setError(err instanceof Error && err.name !== 'AbortError' ? err.message : 'Could not reach backend — is it running?');
                setGroups([]);
                setLoading(false);
            }
        } finally {
            clearTimeout(timeout);
        }
    }, [specUrl]);

    useEffect(() => {
        void fetchSpec();
        return () => {
            abortRef.current?.abort();
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    }, [fetchSpec]);

    return { groups, loading, error, refetch: () => fetchSpec() };
}
