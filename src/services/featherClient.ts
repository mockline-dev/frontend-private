import auth from '@feathersjs/authentication-client';
import { feathers } from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';
import { io } from 'socket.io-client';

const feathersClient = feathers();

const apiSocketBase = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3030';
const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io';

const normalizedSocketPath = socketPath.startsWith('/') ? socketPath : `/${socketPath}`;

const socket = io(apiSocketBase, {
    transports: ['websocket', 'polling'],
    forceNew: true,
    path: normalizedSocketPath
});

feathersClient.configure(socketio(socket));
feathersClient.configure(auth({}));

// Development-only connection monitoring for debugging
if (process.env.NODE_ENV === 'development') {
    socket.on('connect', () => {
        console.log('[Feathers] Socket connected');
    });

    socket.on('connect_error', (error) => {
        console.error('[Feathers] Connection error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.warn('[Feathers] Socket disconnected:', reason);
    });

    socket.on('error', (error) => {
        console.error('[Feathers] Socket error:', error);
    });
}

export default feathersClient;
