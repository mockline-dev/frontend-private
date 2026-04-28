'use client';

import feathersClient from '@/services/featherClient';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EndpointGroup } from '../types';
import { parseOpenApiSpec } from '../utils/openApiParser';

const FETCH_TIMEOUT_MS = 8000;
const RELAY_FETCH_TIMEOUT_MS = 30000;
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 5;

const OPENAPI_PATH_CANDIDATES = [
    '/openapi.json',
    '/api/openapi.json',
    '/api/v1/openapi.json',
    '/v1/openapi.json',
    '/docs/openapi.json',
    '/api/docs/openapi.json',
    '/swagger.json'
];

interface UseOpenApiSpecResult {
    groups: EndpointGroup[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
    routeCount: number;
}

export function useOpenApiSpec(specUrl: string | undefined, endpointHeaders?: Record<string, string> | null): UseOpenApiSpecResult {
    const [groups, setGroups] = useState<EndpointGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [routeCount, setRouteCount] = useState(0);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const retryCountRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);

    const buildCandidateUrls = useCallback((baseOrSpecUrl: string): string[] => {
        const trimmed = baseOrSpecUrl.replace(/\/$/, '');
        const inferredBase = trimmed.endsWith('/openapi.json') ? trimmed.slice(0, -'/openapi.json'.length) : trimmed;
        const relayMode = /\/api-test\//i.test(inferredBase);

        const fromPaths = OPENAPI_PATH_CANDIDATES.map((path) => `${inferredBase}${path}`);
        const ordered = trimmed.endsWith('/openapi.json') ? [trimmed, ...fromPaths] : fromPaths;
        const withRelayProbe = relayMode ? [`${inferredBase}/_openapi`, ...ordered] : ordered;

        return Array.from(new Set(withRelayProbe));
    }, []);

    const resolveAuthHeaders = useCallback(async (url: string): Promise<Record<string, string>> => {
        // Requests to backend relay require user JWT.
        if (!/\/api-test\//i.test(url)) return {};

        try {
            const token = await feathersClient.authentication.getAccessToken();
            const ngrokHeaders = url.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {};
            return { ...ngrokHeaders, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        } catch {
            return {};
        }
    }, []);

    const isRelayUrl = useCallback((url: string): boolean => /\/api-test\//i.test(url), []);

    const fetchSpec = useCallback(
        async (isRetry = false) => {
            if (!specUrl) {
                setGroups([]);
                setLoading(false);
                return;
            }

            if (!isRetry) {
                retryCountRef.current = 0;
                setError(null);
                setRouteCount(0);
            }

            setLoading(true);

            abortRef.current?.abort();

            try {
                const candidateUrls = buildCandidateUrls(specUrl);
                const authHeaders = await resolveAuthHeaders(specUrl);
                const relayMode = isRelayUrl(specUrl);
                let spec: unknown = null;
                let resolvedUrl: string | null = null;
                let lastHttpStatus: number | null = null;
                let sawTimeout = false;

                for (const candidateUrl of candidateUrls) {
                    const controller = new AbortController();
                    abortRef.current = controller;
                    const timeout = setTimeout(() => controller.abort(), relayMode ? RELAY_FETCH_TIMEOUT_MS : FETCH_TIMEOUT_MS);
                    try {
                        const res = await fetch(candidateUrl, {
                            signal: controller.signal,
                            headers: {
                                // Endpoint headers are required only for direct OpenSandbox proxy calls.
                                // Backend relay (/api-test/:sessionId/...) already applies them server-side.
                                ...(!relayMode && endpointHeaders && Object.keys(endpointHeaders).length > 0 ? endpointHeaders : {}),
                                ...authHeaders
                            }
                        });

                        if (!res.ok) {
                            lastHttpStatus = res.status;
                            continue;
                        }

                        const payload = await res.json();
                        if (payload && typeof payload === 'object' && 'paths' in payload) {
                            spec = payload;
                            resolvedUrl = candidateUrl;
                            break;
                        }
                    } catch (err) {
                        if (err instanceof Error && err.name === 'AbortError') {
                            sawTimeout = true;
                            continue;
                        }
                    } finally {
                        clearTimeout(timeout);
                    }
                }

                if (!spec) {
                    if (sawTimeout) {
                        throw new Error(relayMode ? 'Backend relay timeout while loading API spec' : 'Backend timeout while loading API spec');
                    }
                    const statusHint = lastHttpStatus ? `HTTP ${lastHttpStatus}` : 'No spec endpoint matched';
                    throw new Error(`${statusHint} (checked: ${candidateUrls.join(', ')})`);
                }

                const parsedGroups = parseOpenApiSpec(spec);
                setGroups(parsedGroups);
                const totalEndpoints = parsedGroups.reduce((sum, g) => sum + g.endpoints.length, 0);
                setRouteCount(totalEndpoints);
                setError(null);
                setLoading(false);
                retryCountRef.current = 0;

                // Keep an internal breadcrumb in devtools for which endpoint matched.
                if (resolvedUrl) {
                    console.debug('[ApiTester] Loaded OpenAPI spec from:', resolvedUrl);
                }
            } catch (err) {
                const shouldRetry = err instanceof Error && /(timeout|network|fetch|reach backend)/i.test(err.message) && retryCountRef.current < MAX_RETRIES;

                if (shouldRetry) {
                    // Server not ready yet — retry after delay
                    retryCountRef.current += 1;
                    retryTimerRef.current = setTimeout(() => void fetchSpec(true), RETRY_DELAY_MS);
                } else {
                    setError(err instanceof Error && err.name !== 'AbortError' ? err.message : 'Could not reach backend — is it running?');
                    setGroups([]);
                    setLoading(false);
                }
            }
        },
        [buildCandidateUrls, endpointHeaders, isRelayUrl, resolveAuthHeaders, specUrl]
    );

    useEffect(() => {
        void fetchSpec();
        return () => {
            abortRef.current?.abort();
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    }, [fetchSpec]);

    return { groups, loading, error, refetch: () => fetchSpec(), routeCount };
}
