import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SEO Task Manager',
    template: '%s | SEO Task Manager',
  },
  description: 'Quản lý công việc SEO nội bộ cho team',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
