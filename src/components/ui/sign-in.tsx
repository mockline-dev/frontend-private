import { appRoutes } from '@/config/appRoutes'
import { InitialData, LoginData } from '@/containers/auth/types'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import GoogleIcon from '../../../public/google.svg'
import { Button } from './button'
import { Field, FieldGroup, FieldLabel } from './field'
import { Input } from './input'
import { Spinner } from './spinner'

// --- HELPER COMPONENTS (ICONS) ---

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string
  name: string
  handle: string
  text: string
}

interface SignInPageProps {
  title?: React.ReactNode
  description?: React.ReactNode
  heroImageSrc?: string
  testimonials?: Testimonial[]
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void
  onGoogleSignIn?: () => void
  data: LoginData
  updateData: (value: Partial<InitialData>) => void
  loading: boolean
  googleLoading: boolean
  errors: Record<string, string> | undefined
}

// --- SUB-COMPONENTS ---

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial; delay: string }) => (
  <div
    className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
)

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = 'Access your account and continue your journey with us',
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  data,
  updateData,
  loading,
  googleLoading,
}) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="h-dvh flex flex-col md:flex-row font-geist w-dvw">
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <FieldGroup>
                <Field className="animate-element animate-delay-300">
                  <FieldLabel htmlFor="email">Email Address</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    required
                    className="w-full bg-transparent text-sm p-4 focus:outline-none h-12"
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                  />
                </Field>
                <Field className="animate-element animate-delay-300 mt-[-10px]">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      required
                      className="w-full bg-transparent text-sm p-4 pr-12 focus:outline-none h-12"
                      value={data.password}
                      onChange={(e) => updateData({ password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </Field>
              </FieldGroup>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Input
                    type="checkbox"
                    className="accent-primary w-4 h-4 rounded-md border-border focus:ring-0 focus:ring-offset-0 focus:outline-none"
                  />
                  <span className="text-foreground/90">Keep me signed in</span>
                </label>
                <Link
                  href={appRoutes.auth.resetPassword}
                  className="text-primary-foreground transition-colors hover:text-primary/90"
                >
                  Reset password
                </Link>
              </div>
              {/* {errors && <FieldDescription className="text-destructive">{errors.message}</FieldDescription>} */}
              <Button
                type="submit"
                className="animate-element animate-delay-800 text-md font-medium w-full justify-center gap-2 transition-colors"
                size={'xxl'}
                variant={'default'}
                disabled={loading || googleLoading}
              >
                {loading && <Spinner />}
                Sign In
              </Button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">
                Or continue with
              </span>
            </div>

            <Button
              onClick={onGoogleSignIn}
              className="animate-element animate-delay-800 text-md font-medium w-full justify-center gap-2 border border-border hover:border-primary transition-colors"
              size={'xxl'}
              variant={'outline'}
              disabled={loading || googleLoading}
            >
              <span className="w-6 h-6 flex items-center justify-center mr-2">
                {googleLoading ? <Spinner /> : <GoogleIcon />}
              </span>
              Continue with Google
            </Button>

            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              New to our platform?{' '}
              <Link
                href={appRoutes.auth.signup}
                className="text-primary-foreground hover:text-primary/90 transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </section>

      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          ></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]!} delay="animate-delay-1000" />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
