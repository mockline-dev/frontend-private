import { apiServices } from '@/api/services';
import feathersClient from '@/services/featherClient';
import { ServiceEvent } from '@/types/feathers';
import { useEffect, useRef } from 'react';

function useLatestRef<T>(value: T) {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref;
}

/**
 * Hook for listening to Feathers service events with real-time updates
 * Supports server-side rendering by checking for browser environment
 */
export const useRealtimeUpdates = <T>(
    serviceName: keyof typeof apiServices,
    eventType: ServiceEvent | string,
    callback: (data: T) => void,
    filter?: (data: T) => boolean
) => {
    const callbackRef = useLatestRef(callback);
    const filterRef = useLatestRef(filter);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const socket = feathersClient.io;
        if (!socket) {
            console.error('[useRealtimeUpdates] Socket not available');
            return;
        }

        const service = feathersClient.service(apiServices[serviceName]);
        let isDisposed = false;

        const handler = (data: T) => {
            const predicate = filterRef.current;
            if (!predicate || predicate(data)) {
                callbackRef.current(data);
            }
        };

        const attachListener = async () => {
            try {
                await feathersClient.reAuthenticate();
            } catch (error) {
                // Token may be missing in public routes; the listener still works for public events.
                console.debug(`[useRealtimeUpdates] Re-auth skipped for ${serviceName}:`, error);
            }

            if (isDisposed) {
                return;
            }

            service.removeListener(eventType, handler);
            service.on(eventType, handler);
        };

        if (socket.connected) {
            attachListener();
        }

        socket.on('connect', attachListener);

        return () => {
            isDisposed = true;
            socket.off('connect', attachListener);
            service.removeListener(eventType, handler);
        };
    }, [serviceName, eventType, callbackRef, filterRef]);
};

/**
 * Hook for joining/leaving project channels for real-time updates
 * This is useful for receiving project-specific events
 */
export const useProjectChannel = (projectId: string | null) => {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const socket = feathersClient.io;
        if (!socket) {
            console.warn('[useProjectChannel] Socket not available');
            return;
        }

        if (!projectId) return;

        // Join project channel
        socket.emit('join-project', projectId);
        console.log(`[useProjectChannel] Joined project channel: ${projectId}`);

        // Cleanup: leave project channel on unmount or projectId change
        return () => {
            socket.emit('leave-project', projectId);
            console.log(`[useProjectChannel] Left project channel: ${projectId}`);
        };
    }, [projectId]);
};

/**
 * Hook for listening to custom Socket.IO events (not Feathers service events)
 * Useful for events like 'ai-stream::chunk', 'ai-stream::file-updates', etc.
 */
export const useSocketEvent = <T>(eventName: string, callback: (data: T) => void, filter?: (data: T) => boolean) => {
    const callbackRef = useLatestRef(callback);
    const filterRef = useLatestRef(filter);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const socket = feathersClient.io;
        if (!socket) {
            console.warn('[useSocketEvent] Socket not available');
            return;
        }

        const handler = (data: T) => {
            const predicate = filterRef.current;
            if (!predicate || predicate(data)) {
                callbackRef.current(data);
            }
        };

        socket.on(eventName, handler);

        return () => {
            socket.off(eventName, handler);
        };
    }, [eventName, callbackRef, filterRef]);
};

/**
 * Hook for monitoring socket connection status
 */
export const useSocketConnection = () => {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const socket = feathersClient.io;
        if (!socket) {
            console.warn('[useSocketConnection] Socket not available');
            return;
        }

        const handleConnect = () => {
            console.log('[useSocketConnection] Socket connected');
        };

        const handleDisconnect = (reason: string) => {
            console.warn(`[useSocketConnection] Socket disconnected: ${reason}`);
        };

        const handleReconnect = (attemptNumber: number) => {
            console.log(`[useSocketConnection] Socket reconnected after ${attemptNumber} attempts`);
        };

        const handleReconnectAttempt = (attemptNumber: number) => {
            console.log(`[useSocketConnection] Reconnection attempt ${attemptNumber}`);
        };

        const handleError = (error: Error) => {
            console.error('[useSocketConnection] Socket error:', error);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('reconnect', handleReconnect);
        socket.on('reconnect_attempt', handleReconnectAttempt);
        socket.on('error', handleError);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('reconnect', handleReconnect);
            socket.off('reconnect_attempt', handleReconnectAttempt);
            socket.off('error', handleError);
        };
    }, []);
};
