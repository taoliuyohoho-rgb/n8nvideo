import type { Metadata } from 'next'
// Avoid network fetch for Google Fonts in server build; fallback to system font
import './globals.css'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/src/providers/QueryProvider'

const inter = { className: 'font-sans' } as any

export const metadata: Metadata = {
  title: 'AI Video Generator - 跨境电商视频生成工具',
  description: 'AI-powered video generation tool for cross-border e-commerce',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {children}
          </div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
