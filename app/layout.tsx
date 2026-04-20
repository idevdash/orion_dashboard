import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _geist = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist-sans',
});

const _geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono',
});

const _jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'ORION | Institutional Trading Infrastructure',
  description: 'Precision algorithmic trading and risk management for global giga-projects.',
  icons: {
    icon: [
      {
        url: '/orion-favicon-32.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/orion-app-icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#080A10',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${_geist.variable} ${_geistMono.variable} ${_jetbrainsMono.variable} bg-[var(--orion-bg)] dark`}
    >
      <body className="font-sans antialiased min-h-screen bg-[var(--orion-bg)] text-[var(--orion-text)]">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}