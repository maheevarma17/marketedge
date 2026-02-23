import type { Metadata } from 'next'
import { Syne } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'

const syne = Syne({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MarketEdge',
  description: 'Indian Stock Market Trading Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={syne.className} style={{ background: '#131722', color: '#D1D4DC', margin: 0 }}>
        <Navbar />
        <div style={{ display: 'flex', marginTop: '56px' }}>
          <Sidebar />
          <main style={{ marginLeft: '52px', flex: 1, minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <Footer />
          </main>
        </div>
      </body>
    </html>
  )
}