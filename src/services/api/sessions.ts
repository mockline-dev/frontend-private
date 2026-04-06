import { createSession as createSessionAction } from '@/api/sessions/createSession';
import { deleteSession } from '@/api/sessions/deleteSession';
import { fetchSessionById } from '@/api/sessions/fetchSessionById';
import { fetchSessions } from '@/api/sessions/fetchSessions';
import feathersClient from '../featherClient';
import { CreateSessionData, Session, SessionQuery } from '@/types/feathers';

export const sessionsService = {
    async find(query?: SessionQuery): Promise<{ data: Session[]; total: number; limit: number; skip: number }> {
        const result = await fetchSessions({ ...(query !== undefined && { query }) });
        if (Array.isArray(result)) {
            return { data: result, total: result.length, limit: result.length, skip: 0 };
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
        return await createSessionAction(data);
    },

    async getByProjectId(projectId: string): Promise<Session[]> {
        const result = await fetchSessions({ query: { projectId } });
        return Array.isArray(result) ? result : result.data;
    },

    async getActiveSession(projectId: string): Promise<Session | null> {
        const result = await fetchSessions({ query: { projectId, status: 'running', $limit: 1 } });
        const sessions = Array.isArray(result) ? result : result.data;
        return sessions[0] || null;
    },

    async remove(id: string): Promise<Session> {
        return await deleteSession({ id });
    },

    onPatched(callback: (session: Session) => void) {
        feathersClient.service('sessions').on('patched', callback);
        return () => feathersClient.service('sessions').off('patched', callback);
    }
};
