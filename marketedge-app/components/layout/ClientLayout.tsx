'use client'
import { ThemeProvider, useTheme } from '@/lib/theme'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'

function ThemedLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTheme()

    return (
        <div style={{
            background: t.bg, color: t.textMuted, minHeight: '100vh',
            position: 'relative',
        }}>
            {/* Subtle gradient mesh background */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: `
                    radial-gradient(ellipse 80% 60% at 10% 20%, ${t.accent}08 0%, transparent 60%),
                    radial-gradient(ellipse 60% 50% at 90% 80%, ${t.accent}05 0%, transparent 50%)
                `,
                pointerEvents: 'none' as const,
                zIndex: 0,
            }} />

            <Navbar />
            <div style={{ display: 'flex', marginTop: '54px' }}>
                <Sidebar />
                <main style={{ marginLeft: '52px', flex: 1, minHeight: 'calc(100vh - 54px)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1 }}>
                        {children}
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <ThemedLayout>{children}</ThemedLayout>
        </ThemeProvider>
    )
}
