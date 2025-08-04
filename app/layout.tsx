import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ColorSchemeScript, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { theme } from '@/lib/theme'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RootMosaic - Enterprise Auto Repair Analytics',
  description: 'AI-Powered Detection of Mechanical Misdiagnosis & Process Inefficiencies - Enterprise Dashboard',
  keywords: 'auto repair, analytics, misdiagnosis, efficiency, dashboard, enterprise, AI',
  authors: [{ name: 'Jack Pierson' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <Notifications position="top-right" zIndex={1000} />
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900">
            {children}
          </div>
        </MantineProvider>
      </body>
    </html>
  )
} 