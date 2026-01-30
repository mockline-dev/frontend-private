'use server';

import { cookies } from 'next/headers';

import { UserData } from '@/containers/authFlow/types';

export const setUserDataToCookies = async (userData: UserData) => {
    cookies().set('currentUser', JSON.stringify(userData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    });
};
