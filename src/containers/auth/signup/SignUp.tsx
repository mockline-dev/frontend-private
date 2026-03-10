'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useLogin } from '@/containers/auth/hooks/useLogin';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import GoogleIcon from '../../../../public/google.svg';
import { useRegister } from '../hooks/useRegister';

export function Signup({ className, ...props }: React.ComponentProps<'form'>) {
    const { register, loading, updateData, data } = useRegister();
    const { loginWithGoogle, loading: googleLoading } = useLogin();
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [nameInput, setNameInput] = useState('');

    const handlePasswordChange = (value: string) => {
        updateData({ password: value });
        if (confirmPassword && value !== confirmPassword) {
            setPasswordError('Passwords do not match');
        } else {
            setPasswordError('');
        }
    };

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value);
        if (data.password && value !== data.password) {
            setPasswordError('Passwords do not match');
        } else {
            setPasswordError('');
        }
    };

    const handleNameChange = (value: string) => {
        setNameInput(value);
        const trimmedValue = value.trim();
        const nameParts = trimmedValue.split(/\s+/);
        updateData({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || ''
        });
    };

    return (
        <form className={cn('flex flex-col gap-6', className)} {...props} onSubmit={register}>
            <FieldGroup className="gap-3">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Create your account</h1>
                    <p className="text-muted-foreground text-sm text-balance">Fill in the form below to create your account</p>
                </div>
                <Field>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        className="w-full bg-transparent text-sm p-4 focus:outline-none h-12"
                        value={nameInput}
                        onChange={(e) => handleNameChange(e.target.value)}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        className="w-full bg-transparent text-sm p-4 focus:outline-none h-12"
                        required
                        value={data.email}
                        onChange={(e) => updateData({ email: e.target.value })}
                    />
                    <FieldDescription>We&apos;ll use this to contact you. We will not share your email with anyone else.</FieldDescription>
                </Field>
                <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                        id="password"
                        type="password"
                        className="w-full bg-transparent text-sm p-4 focus:outline-none h-12"
                        required
                        value={data.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                    />
                    <FieldDescription>Must be at least 8 characters long.</FieldDescription>
                </Field>
                <Field>
                    <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                    <Input
                        id="confirm-password"
                        type="password"
                        className="w-full bg-transparent text-sm p-4 focus:outline-none h-12"
                        required
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    />
                    {passwordError && <FieldDescription className="text-destructive">{passwordError}</FieldDescription>}
                </Field>
                <Field>
                    <Button
                        type="submit"
                        disabled={googleLoading || loading || !!passwordError}
                        className="text-md font-medium w-full justify-center gap-2 transition-colors"
                        size={'xxl'}
                        variant={'default'}
                    >
                        {loading && <Spinner />}
                        Create Account
                    </Button>
                </Field>
                <div className="relative flex items-center justify-center px-6 py-4">
                    <span className="w-full border-t border-border"></span>
                    <span className="px-4 text-sm text-muted-foreground bg-background absolute">Or continue with</span>
                </div>
                <Field>
                    <Button variant="outline" type="button" onClick={loginWithGoogle} disabled={loading || googleLoading} size={'xxl'} className="w-full">
                        <span className="w-6 h-6 flex items-center justify-center mr-2">{googleLoading ? <Spinner /> : <GoogleIcon />}</span>
                        Continue with Google
                    </Button>
                    <FieldDescription className="px-6 text-center">
                        Already have an account? <Link href="/auth/login">Sign in</Link>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}
