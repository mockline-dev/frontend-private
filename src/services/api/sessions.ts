import { createSession } from '@/api/sessions/createSession';
import { deleteSession } from '@/api/sessions/deleteSession';
import { fetchSessionById } from '@/api/sessions/fetchSessionById';
import { fetchSessions } from '@/api/sessions/fetchSessions';
import feathersClient from '@/services/featherClient';
import { CreateSessionData, Session, SessionQuery } from '@/types/feathers';

export const sessionsService = {
    async find(query?: SessionQuery): Promise<{ data: Session[]; total: number; limit: number; skip: number }> {
        const result = await fetchSessions(query ? { query: query as Record<string, unknown> } : undefined);

        if (Array.isArray(result)) {
            return {
                data: result,
                total: result.length,
                limit: result.length,
                skip: 0
            };
        }

        return {
            data: result.data,
            total: result.total || result.data.length,
            limit: result.limit || result.data.length,
            skip: result.skip || 0
        };
    },

    async get(id: string): Promise<Session> {
        return await fetchSessionById({ id });
    },

    async create(data: CreateSessionData): Promise<Session> {
        return await createSession(data);
    },

    async remove(id: string): Promise<Session> {
        return await deleteSession({ id });
    },

    onCreated(callback: (session: Session) => void) {
        feathersClient.service('sessions').on('created', callback);
        return () => feathersClient.service('sessions').off('created', callback);
    },

    onPatched(callback: (session: Session) => void) {
        feathersClient.service('sessions').on('patched', callback);
        return () => feathersClient.service('sessions').off('patched', callback);
    },

    onRemoved(callback: (session: Session) => void) {
        feathersClient.service('sessions').on('removed', callback);
        return () => feathersClient.service('sessions').off('removed', callback);
    }
};
