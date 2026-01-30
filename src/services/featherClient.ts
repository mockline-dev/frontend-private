import authentication from '@feathersjs/authentication-client';
import { Application, feathers } from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';
import io from 'socket.io-client';

const feathersClient: Application = feathers();

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    transports: ['websocket'],
    forceNew: true
});

feathersClient.configure(socketio(socket));
feathersClient.configure(authentication({}));

export const checkAuth = async () => {
    try {
        await feathersClient.reAuthenticate();
        return true;
    } catch (error) {
        console.error('Authentication error:', error);
        return false;
    }
};

export default feathersClient;
