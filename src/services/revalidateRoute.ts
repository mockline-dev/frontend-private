'use server';

import { revalidatePath } from 'next/cache';

export const revalidateRoute = async (path: string) => {
    revalidatePath(path, 'layout');
};
