import { Signup } from '@/containers/auth/signup/SignUp'
import Image from 'next/image'

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/signup-hero.jpg"
          alt="Signup Hero Banner"
          className="absolute inset-0 h-full w-full object-cover p-4 rounded-4xl animate-slide-right animate-delay-400"
        />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start animate-element animate-delay-300">
          <a href="https://mockline.dev" className="flex items-center gap-1 font-medium" type="_blank">
            <Image src="/logo.png" alt="Mockline Logo" width={24} height={24} />
            mockline.dev
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center animate-element animate-delay-500">
          <div className="w-full max-w-md">
            <Signup />
          </div>
        </div>
      </div>
    </div>
  )
}
