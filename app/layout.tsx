import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk, Space_Mono } from 'next/font/google'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Optimize font loading - show fallback until font loads
  preload: true,
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true,
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'SIA Intelligence',
  description: 'SIA Intelligence platform.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'
  ),
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.svg', type: 'image/svg+xml' }],
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#020203',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable} font-sans antialiased bg-[#020203] text-white`}
      >
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0a0a0b',
                color: '#fff',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                fontSize: '12px',
                fontFamily: 'var(--font-space-mono)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
