'use client';

import { createSnapshot as createSnapshotAction } from '@/api/snapshots/createSnapshot';
import { deleteSnapshot as deleteSnapshotById } from '@/api/snapshots/deleteSnapshot';
import { fetchSnapshotById } from '@/api/snapshots/fetchSnapshotById';
import { fetchSnapshots } from '@/api/snapshots/fetchSnapshots';
import { rollbackSnapshot } from '@/api/snapshots/rollbackSnapshot';
import { CreateSnapshotData, RollbackResult, Snapshot, SnapshotQuery } from '@/types/feathers';
import { useCallback, useState } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';

export interface UseSnapshotsReturn {
    // State
    snapshots: Snapshot[];
    loading: boolean;
    error: string | null;
    currentSnapshot: Snapshot | null;
    isRollingBack: boolean;

    // Methods
    loadSnapshots: (projectId: string, query?: SnapshotQuery) => Promise<void>;
    loadSnapshot: (snapshotId: string) => Promise<void>;
    createSnapshot: (data: CreateSnapshotData) => Promise<Snapshot>;
    _createSnapshot: (data: CreateSnapshotData) => Promise<Snapshot>;
    rollbackToSnapshot: (snapshotId: string) => Promise<RollbackResult>;
    deleteSnapshot: (snapshotId: string) => Promise<void>;
    refresh: (projectId: string) => Promise<void>;
    setCurrentSnapshot: (snapshot: Snapshot | null) => void;
}

export function useSnapshots(initialSnapshots: Snapshot[] = []): UseSnapshotsReturn {
    const [snapshots, setSnapshots] = useState<Snapshot[]>(initialSnapshots);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentSnapshot, setCurrentSnapshot] = useState<Snapshot | null>(null);
    const [isRollingBack, setIsRollingBack] = useState(false);

    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';

    // Load snapshots for a project
    const loadSnapshots = useCallback(
        async (projectId: string, query?: SnapshotQuery) => {
            if (!isBrowser) return;

            setLoading(true);
            setError(null);

            try {
                const result = await fetchSnapshots({
                    query: {
                        projectId,
                        ...query,
                        $sort: { version: -1 }
                    }
                });
                setSnapshots(Array.isArray(result) ? result : result.data || []);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load snapshots';
                setError(message);
                console.error('[useSnapshots] Error loading snapshots:', err);
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    const loadSnapshot = useCallback(
        async (snapshotId: string) => {
            if (!isBrowser) return;

            setLoading(true);
            setError(null);

            try {
                const result = await fetchSnapshotById({ id: snapshotId });
                setCurrentSnapshot(result);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load snapshot';
                setError(message);
                console.error('[useSnapshots] Error loading snapshot:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Create a new snapshot
    const createSnapshot = useCallback(
        async (data: CreateSnapshotData): Promise<Snapshot> => {
            if (!isBrowser) {
                throw new Error('Cannot create snapshot on the server');
            }

            setLoading(true);
            setError(null);

            try {
                const snapshot = await createSnapshotAction(data);
                setSnapshots((prev) => [snapshot, ...prev]);
                return snapshot;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to create snapshot';
                setError(message);
                console.error('[useSnapshots] Error creating snapshot:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Rollback to a snapshot
    const rollbackToSnapshot = useCallback(
        async (snapshotId: string): Promise<RollbackResult> => {
            if (!isBrowser) {
                throw new Error('Cannot rollback on the server');
            }

            setIsRollingBack(true);
            setError(null);

            try {
                const result = await rollbackSnapshot({ id: snapshotId });
                return result;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to rollback to snapshot';
                setError(message);
                console.error('[useSnapshots] Error rolling back to snapshot:', err);
                throw err;
            } finally {
                setIsRollingBack(false);
            }
        },
        [isBrowser]
    );

    // Delete a snapshot
    const deleteSnapshot = useCallback(
        async (snapshotId: string): Promise<void> => {
            if (!isBrowser) {
                throw new Error('Cannot delete snapshot on the server');
            }

            setLoading(true);
            setError(null);

            try {
                await deleteSnapshotById({ id: snapshotId });
                setSnapshots((prev) => prev.filter((s) => s._id !== snapshotId));
                setCurrentSnapshot((prev) => (prev?._id === snapshotId ? null : prev));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to delete snapshot';
                setError(message);
                console.error('[useSnapshots] Error deleting snapshot:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Refresh snapshots for a project
    const refresh = useCallback(
        async (projectId: string) => {
            await loadSnapshots(projectId);
        },
        [loadSnapshots]
    );

    useRealtimeUpdates<Snapshot>('snapshots', 'created', (snapshot) => {
        setSnapshots((prev) => (prev.some((s) => s._id === snapshot._id) ? prev : [snapshot, ...prev]));
    });

    useRealtimeUpdates<Snapshot>('snapshots', 'patched', (snapshot) => {
        setSnapshots((prev) => prev.map((s) => (s._id === snapshot._id ? snapshot : s)));
        setCurrentSnapshot((prev) => (prev?._id === snapshot._id ? snapshot : prev));
    });

    useRealtimeUpdates<Snapshot>('snapshots', 'removed', (snapshot) => {
        setSnapshots((prev) => prev.filter((s) => s._id !== snapshot._id));
        setCurrentSnapshot((prev) => (prev?._id === snapshot._id ? null : prev));
    });

    return {
        // State
        snapshots,
        loading,
        error,
        currentSnapshot,
        isRollingBack,

        // Methods
        loadSnapshots,
        loadSnapshot,
        createSnapshot,
        _createSnapshot: createSnapshot,
        rollbackToSnapshot,
        deleteSnapshot,
        refresh,
        setCurrentSnapshot
    };
}
