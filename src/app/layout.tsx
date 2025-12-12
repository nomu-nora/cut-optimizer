import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './print.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '取り数最適化システム',
  description: '元板から製品を効率的に切り出す配置計算アプリ',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
