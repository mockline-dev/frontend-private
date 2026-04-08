'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AuthConfig, EndpointDefinition, EndpointGroup, HttpMethod, KeyValuePair, RequestState } from '../types';

function generateId(): string {
    return Math.random().toString(36).slice(2, 9);
}

function seedParamsFromEndpoint(endpoint: EndpointDefinition): KeyValuePair[] {
    return (endpoint.parameters ?? [])
        .filter((p) => p.in === 'query')
        .map((p) => ({
            id: generateId(),
            key: p.name,
            value: String(p.example ?? ''),
            enabled: p.required ?? false,
        }));
}

function defaultAuth(): AuthConfig {
    return { type: 'none', token: '', username: '', password: '' };
}

interface UseRequestCollectionResult {
    selectedEndpoint: EndpointDefinition | null;
    requestState: RequestState;
    selectEndpoint: (endpoint: EndpointDefinition, baseUrl: string) => void;
    updateMethod: (method: HttpMethod) => void;
    updateUrl: (url: string) => void;
    updateParams: (params: KeyValuePair[]) => void;
    updateHeaders: (headers: KeyValuePair[]) => void;
    updateBody: (body: string) => void;
    updateContentType: (ct: string) => void;
    updateAuth: (auth: AuthConfig) => void;
}

export function useRequestCollection(groups: EndpointGroup[], baseUrl: string): UseRequestCollectionResult {
    const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDefinition | null>(null);
    const [requestState, setRequestState] = useState<RequestState>({
        method: 'GET',
        url: '',
        params: [],
        headers: [{ id: generateId(), key: 'Accept', value: 'application/json', enabled: true }],
        body: '',
        contentType: 'application/json',
        auth: defaultAuth(),
    });

    // Seed first endpoint when groups load
    useEffect(() => {
        if (groups.length > 0 && !selectedEndpoint) {
            const first = groups[0]?.endpoints[0];
            if (first) {
                setSelectedEndpoint(first);
                setRequestState((prev) => ({
                    ...prev,
                    method: first.method,
                    url: `${baseUrl}${first.path}`,
                    params: seedParamsFromEndpoint(first),
                }));
            }
        }
    }, [groups, baseUrl, selectedEndpoint]);

    const selectEndpoint = useCallback((endpoint: EndpointDefinition, base: string) => {
        setSelectedEndpoint(endpoint);
        setRequestState((prev) => ({
            ...prev,
            method: endpoint.method,
            url: `${base}${endpoint.path}`,
            params: seedParamsFromEndpoint(endpoint),
            body: '',
        }));
    }, []);

    const updateMethod = useCallback((method: HttpMethod) => setRequestState((p) => ({ ...p, method })), []);
    const updateUrl = useCallback((url: string) => setRequestState((p) => ({ ...p, url })), []);
    const updateParams = useCallback((params: KeyValuePair[]) => setRequestState((p) => ({ ...p, params })), []);
    const updateHeaders = useCallback((headers: KeyValuePair[]) => setRequestState((p) => ({ ...p, headers })), []);
    const updateBody = useCallback((body: string) => setRequestState((p) => ({ ...p, body })), []);
    const updateContentType = useCallback((contentType: string) => setRequestState((p) => ({ ...p, contentType })), []);
    const updateAuth = useCallback((auth: AuthConfig) => setRequestState((p) => ({ ...p, auth })), []);

    return {
        selectedEndpoint,
        requestState,
        selectEndpoint,
        updateMethod,
        updateUrl,
        updateParams,
        updateHeaders,
        updateBody,
        updateContentType,
        updateAuth,
    };
}
