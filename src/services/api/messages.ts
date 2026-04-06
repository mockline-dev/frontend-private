import { createMessage } from '@/api/messages/createMessage';
import { deleteMessage } from '@/api/messages/deleteMessage';
import { fetchMessageById } from '@/api/messages/fetchMessageById';
import { fetchMessages } from '@/api/messages/fetchMessages';
import { updateMessage } from '@/api/messages/updateMessage';
import feathersClient from '@/services/featherClient';
import type { CreateMessageData, Message, MessageQuery } from '@/types/feathers';

export type { CreateMessageData, Message, MessageQuery };

export const messagesService = {
    async create(data: CreateMessageData): Promise<Message> {
        return await createMessage(data);
    },

    async find(query?: MessageQuery): Promise<{ data: Message[]; total: number; limit: number; skip: number }> {
        const result = await fetchMessages(query ? { query: query as Record<string, unknown> } : undefined);

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

    async get(id: string): Promise<Message> {
        return await fetchMessageById({ id });
    },

    async patch(id: string, data: Partial<Message>): Promise<Message> {
        return await updateMessage({ id, data });
    },

    async remove(id: string): Promise<Message> {
        return await deleteMessage({ id });
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
