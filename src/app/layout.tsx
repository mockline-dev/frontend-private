import { ErrorBoundary } from '@/components/ErrorBoundary'
import { inter } from '@/config/fonts'
import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mockline',
  description: 'Build backends that ship faster'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ErrorBoundary>
            {children}
            <Toaster position="top-right" />
        </ErrorBoundary>
      </body>
    </html>
  )
}
