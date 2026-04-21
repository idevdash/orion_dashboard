import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import ThemeToggle from '@/components/ThemeToggle'
import './globals.css'

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
      className="bg-[var(--orion-bg)]"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){try{var t=localStorage.getItem('orion-theme');
document.documentElement.setAttribute('data-theme',t||'light');
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();
`,
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-[var(--orion-bg)] text-[var(--orion-text)]">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <nav className="pointer-events-none fixed right-4 top-4 z-[1000]">
            <div className="pointer-events-auto">
              <ThemeToggle />
            </div>
          </nav>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}