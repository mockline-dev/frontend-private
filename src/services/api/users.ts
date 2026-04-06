import { createUser } from '@/api/users/createUser';
import { deleteUser } from '@/api/users/deleteUser';
import { fetchUserById } from '@/api/users/fetchUserById';
import { fetchUsers } from '@/api/users/fetchUsers';
import { updateUser } from '@/api/users/updateUser';
import type { CreateUserData, User, UserQuery } from '@/types/feathers';

export type { User, CreateUserData, UserQuery };

export const usersService = {
    async create(data: CreateUserData): Promise<User> {
        const result = await createUser(data as unknown as Parameters<typeof createUser>[0]);
        if (!result.success) throw new Error(result.error);
        return result.data as User;
    },

    async find(query?: UserQuery): Promise<{ data: User[]; total: number; limit: number; skip: number }> {
        const result = await fetchUsers(query ? { query: query as Record<string, unknown> } : undefined);
        if (!result.success) throw new Error(result.error);
        const raw = result.data;
        if (Array.isArray(raw)) {
            return { data: raw as User[], total: raw.length, limit: raw.length, skip: 0 };
        }
        return {
            data: raw.data as User[],
            total: raw.total ?? raw.data.length,
            limit: raw.limit ?? raw.data.length,
            skip: raw.skip ?? 0
        };
    },

    async get(id: string): Promise<User> {
        const result = await fetchUserById({ id });
        if (!result.success) throw new Error(result.error);
        return result.data as User;
    },

    async patch(id: string, data: Partial<User>): Promise<User> {
        const result = await updateUser({ id, data: data as Record<string, unknown> });
        if (!result.success) throw new Error(result.error);
        return result.data as User;
    },

    async remove(id: string): Promise<User> {
        const result = await deleteUser({ id });
        if (!result.success) throw new Error(result.error);
        return result.data as User;
    }
};
