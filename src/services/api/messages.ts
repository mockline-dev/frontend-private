import { createMessage } from '@/api/messages/createMessage';
import { fetchMessageById } from '@/api/messages/fetchMessageById';
import { fetchMessages } from '@/api/messages/fetchMessages';
import { updateMessage } from '@/api/messages/updateMessage';
import feathersClient from '@/services/featherClient';

export interface Message {
    _id: string;
    projectId: string;
    role: 'user' | 'system' | 'assistant';
    type: 'text' | 'file';
    content: string;
    tokens?: number;
    status?: string;
    createdAt: number;
    updatedAt: number;
}

export interface CreateMessageData {
    projectId: string;
    role: 'user' | 'system' | 'assistant';
    type?: 'text' | 'file';
    content: string;
    tokens?: number;
    status?: string;
    [key: string]: unknown;
}

export interface MessageQuery {
    $sort?: {
        createdAt?: 1 | -1;
    };
    $limit?: number;
    $skip?: number;
    projectId?: string;
}

export const messagesService = {
    async create(data: CreateMessageData): Promise<Message> {
        const payload: CreateMessageData = {
            type: 'text',
            ...data
        };

        const result = await createMessage(payload);
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    },

    async find(query?: MessageQuery): Promise<{ data: Message[]; total: number; limit: number; skip: number }> {
        const result = await fetchMessages(query ? { query: query as Record<string, unknown> } : undefined);
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    },

    async get(id: string): Promise<Message> {
        const result = await fetchMessageById({ id });
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    },

    async patch(id: string, data: Partial<Message>): Promise<Message> {
        const result = await updateMessage({ id, data });
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    },

    // Real-time event listeners - Note: These should use feathersClient for real-time updates
    onCreated(callback: (message: Message) => void) {
        feathersClient.service('messages').on('created', callback);
        return () => feathersClient.service('messages').off('created', callback);
    },

    onPatched(callback: (message: Message) => void) {
        feathersClient.service('messages').on('patched', callback);
        return () => feathersClient.service('messages').off('patched', callback);
    }
};
