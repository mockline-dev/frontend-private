'use server';

import authentication from '@feathersjs/authentication-client';
import { feathers } from '@feathersjs/feathers';
import rest, { RestService } from '@feathersjs/rest-client';
import { cookies } from 'next/headers';

export const createFeathersServerClient = async () => {
    type ServiceTypes = {
        users: RestService;
        projects: RestService;
        files: RestService;
        uploads: RestService;
        media: RestService;
        messages: RestService;
        'ai-models': RestService;
        'ai-service': RestService;
        'ai-stream': RestService;
        'file-stream': RestService;
        'enhance-prompt': RestService;
        'infer-project-meta': RestService;
        snapshots: RestService;
        architecture: RestService;
    };

    const app = feathers<ServiceTypes>();
    const restClient = rest(process.env.NEXT_PUBLIC_SOCKET_URL).fetch(fetch);
    const jwt = (await cookies()).get('jwt')?.value;

    app.configure(restClient);

    app.configure(
        authentication({
            storage: {
                async getItem() {
                    return jwt || null;
                },
                async setItem() {},
                async removeItem() {}
            }
        })
    );

    if (jwt) {
        try {
            await app.authenticate({
                strategy: 'jwt',
                accessToken: jwt
            });
        } catch (error) {
            console.error('Authentication failed:', error);
        }
    }

    return app;
};
