'use server';

import authentication from '@feathersjs/authentication-client';
import { feathers } from '@feathersjs/feathers';
import rest, { RestService } from '@feathersjs/rest-client';
import { cookies } from 'next/headers';

export interface ProjectsStats {
    total: number;
    ready: number;
    byStatus: Record<string, number>;
    thisWeek: number;
}

export const createFeathersServerClient = async () => {
    type ServiceTypes = {
        users: RestService;
        projects: RestService & {
            stats: (_data?: unknown, params?: unknown) => Promise<ProjectsStats>;
        };
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
        'validate-prompt': RestService;
        'server-monitor': RestService;
        snapshots: RestService;
        architecture: RestService;
        sessions: RestService;
        'api-test': RestService;
    };

    const app = feathers<ServiceTypes>();
    const jwt = (await cookies()).get('jwt')?.value;

    // rest(url).fetch(fn) returns an initialize function that also carries a
    // .service(name) factory (undocumented in types, present at runtime).
    // We configure the app with it AND use it to register the custom 'stats' method.
    const restConfigure = rest(process.env.NEXT_PUBLIC_SOCKET_URL).fetch(fetch);
    app.configure(restConfigure);

    // Register projects with custom 'stats' method so FeathersJS REST client
    // routes stats() calls to POST /projects/stats.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use('projects', (restConfigure as any).service('projects'), {
        methods: ['find', 'get', 'create', 'patch', 'remove', 'stats'],
    });

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
