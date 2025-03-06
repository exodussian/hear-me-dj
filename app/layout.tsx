import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from './AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hear Me DJ',
  description: 'DJ ve dinleyiciler için gerçek zamanlı etkileşim platformu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}