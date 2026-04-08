'use client';

import { useCallback, useEffect, useState } from 'react';
import type { EndpointGroup } from '../types';
import { parseOpenApiSpec } from '../utils/openApiParser';

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

    const fetchSpec = useCallback(async () => {
        if (!specUrl) {
            setGroups([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(specUrl);
            if (!res.ok) throw new Error(`Failed to fetch spec: ${res.status}`);
            const spec = await res.json();
            setGroups(parseOpenApiSpec(spec));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load OpenAPI spec');
            setGroups([]);
        } finally {
            setLoading(false);
        }
    }, [specUrl]);

    useEffect(() => {
        void fetchSpec();
    }, [fetchSpec]);

    return { groups, loading, error, refetch: fetchSpec };
}
