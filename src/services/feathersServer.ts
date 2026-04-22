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
    // Keep transport separate so we can call transport.service() for custom method registration.
    const transport = rest(process.env.NEXT_PUBLIC_SOCKET_URL);
    const jwt = (await cookies()).get('jwt')?.value;

    app.configure(transport.fetch(fetch));

    // Register projects service with custom 'stats' method.
    // transport.service() is the correct way to create a REST service instance
    // with custom methods — mirrors the pattern in projects.shared.ts projectsClient().
    app.use('projects', transport.service('projects'), {
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
