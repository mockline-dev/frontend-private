'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AuthConfig, EndpointDefinition, EndpointGroup, HttpMethod, KeyValuePair, RequestState } from '../types';

function generateId(): string {
    return Math.random().toString(36).slice(2, 9);
}

interface _JsonSchemaProp {
    type?: string;
    example?: unknown;
    default?: unknown;
}
interface _JsonSchema {
    properties?: Record<string, _JsonSchemaProp>;
    example?: unknown;
}

function seedBodyFromEndpoint(endpoint: EndpointDefinition): string {
    const BODY_METHODS: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
    if (!BODY_METHODS.includes(endpoint.method)) return '';

    const rb = endpoint.requestBody;
    if (!rb?.content) return '';

    const jsonEntry =
        rb.content['application/json'] ??
        rb.content['application/json; charset=utf-8'] ??
        Object.values(rb.content)[0];
    if (!jsonEntry) return '';

    if (jsonEntry.example !== undefined) {
        return JSON.stringify(jsonEntry.example, null, 2);
    }

    const schema = jsonEntry.schema as _JsonSchema | undefined;
    if (!schema?.properties) return '';

    const skeleton: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
        if (prop.example !== undefined) {
            skeleton[key] = prop.example;
        } else if (prop.default !== undefined) {
            skeleton[key] = prop.default;
        } else {
            switch (prop.type) {
                case 'string':  skeleton[key] = ''; break;
                case 'integer':
                case 'number':  skeleton[key] = 0;  break;
                case 'boolean': skeleton[key] = false; break;
                case 'array':   skeleton[key] = [];  break;
                case 'object':  skeleton[key] = {};  break;
                default:        skeleton[key] = null;
            }
        }
    }
    return JSON.stringify(skeleton, null, 2);
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
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedEndpoint(first);
                setRequestState((prev) => ({
                    ...prev,
                    method: first.method,
                    url: `${baseUrl}${first.path}`,
                    params: seedParamsFromEndpoint(first),
                    body: seedBodyFromEndpoint(first),
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
            body: seedBodyFromEndpoint(endpoint),
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
