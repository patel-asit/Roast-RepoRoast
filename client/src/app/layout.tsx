import type { Metadata } from 'next'
import { Space_Mono } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from '@/components/ui/toaster'
import { Navbar } from '@/components/navbar'
import { RecentlyRoasted } from '@/components/recently-roasted'
import { Footer } from '@/components/footer'
import './globals.css'

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
})

export const metadata: Metadata = {
  title: 'Repo Roast',
  description: 'Drop your repo URL. We\'ll find every bullshit claim in your code.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${spaceMono.variable} font-mono antialiased min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <RecentlyRoasted />
        <Footer />
        <Toaster />
      </body>
      <Analytics />
    </html>
  )
}
