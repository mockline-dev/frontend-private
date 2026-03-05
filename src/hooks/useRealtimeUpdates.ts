import { apiServices } from '@/api/services';
import feathersClient from '@/services/featherClient';
import { useEffect } from 'react';

export const useRealtimeUpdates = <T>(
    serviceName: keyof typeof apiServices,
    eventType: 'created' | 'updated' | 'patched' | 'removed',
    callback: (data: T) => void,
    filter?: (data: T) => boolean
) => {
    useEffect(() => {
        const socket = feathersClient.io;

        if (!socket) {
            console.error('Socket not available');
            return;
        }

        const setupListeners = async () => {
            try {
                await feathersClient.authenticate();
                const service = feathersClient.service(apiServices[serviceName]);

                const handler = (data: T) => {
                    if (!filter || filter(data)) {
                        callback(data);
                    }
                };

                service.on(eventType, handler);

                return () => {
                    service.removeListener(eventType, handler);
                };
            } catch (error) {
                console.error(`Failed to setup feathers client listeners for ${serviceName}`, error);
                return () => {};
            }
        };

        if (socket.connected) {
            setupListeners();
        }

        const onConnect = () => {
            setupListeners();
        };

        socket.on('connect', onConnect);

        return () => {
            socket.off('connect', onConnect);
        };
    }, [serviceName, eventType, callback, filter]);
};
