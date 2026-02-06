import authentication from '@feathersjs/authentication-client';
import { Application, feathers } from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';
import io, { Socket } from 'socket.io-client';

const feathersClient: Application = feathers();

// Ensure environment variable is available before creating socket
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

if (!socketUrl) {
    console.error('[Socket.IO] NEXT_PUBLIC_SOCKET_URL is not defined');
}

const socket: Socket = io(socketUrl || 'http://localhost:3030', {
    transports: ['websocket', 'polling'],
    forceNew: true,
});

// Add connection status monitoring
socket.on('connect', () => {
    console.log('[Socket.IO] Connected successfully');
});

socket.on('connect_error', (error) => {
    console.error('[Socket.IO] Connection error:', error);
});

socket.on('disconnect', (reason) => {
    console.warn('[Socket.IO] Disconnected:', reason);
});

socket.on('error', (error) => {
    console.error('[Socket.IO] Error:', error);
});


feathersClient.configure(socketio(socket));
feathersClient.configure(authentication({}));

export default feathersClient;
