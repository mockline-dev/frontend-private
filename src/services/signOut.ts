'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { appPaths } from '@/config/appRoutes';

export const signOut = async () => {
    cookies().delete('currentUser');
    cookies().delete('feathers-jwt');

    redirect(appPaths.signOut);
};
