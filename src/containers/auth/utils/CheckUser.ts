'use server';

import { FC } from 'react';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/services/getCurrentUser';
import { appPaths } from '@/config/appRoutes';

export const CheckUser: FC = async () => {
    const user = await getCurrentUser();
    if (user) {
        redirect(appPaths.categories);
    } else {
        redirect(appPaths.signOut);
    }
};
