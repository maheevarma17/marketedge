'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/lib/theme'
import { useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useTheme()
  const [hovered, setHovered] = useState<string | null>(null)

  const links = [
    { href: '/', title: 'Dashboard', icon: '◎' },
    { href: '/charts', title: 'Charts', icon: '◈' },
    { href: '/screener', title: 'Screener', icon: '⊞' },
    { href: '/portfolio', title: 'Portfolio', icon: '▣' },
    { href: '/analytics', title: 'Analytics', icon: '◈' },
    { href: '/alerts', title: 'Alerts', icon: '🔔' },
    { href: '/news', title: 'News', icon: '📰' },
    { href: '/journal', title: 'Journal', icon: '📓' },
    { href: '/calendar', title: 'Calendar', icon: '📅' },
    { href: '/compare', title: 'Compare', icon: '⚖️' },
    { href: '/calculator', title: 'Calculator', icon: '🧮' },
    { href: '/heatmap', title: 'Heatmap', icon: '🗺️' },
    { href: '/reports', title: 'Reports', icon: '📋' },
    { href: '/learn', title: 'Learn', icon: '📚' },
    { href: '/ai-assistant', title: 'AI Bot', icon: '◉' },
    { href: '/backtest', title: 'Backtest', icon: '⧫' },
    { href: '/strategy-ide', title: 'Strategy IDE', icon: '⚡' },
    { href: '/profile', title: 'Profile', icon: '○' },
  ]

  return (
    <aside className="me-sidebar" style={{
      position: 'fixed', top: '54px', left: 0,
      width: '52px', height: 'calc(100vh - 54px)',
      background: t.glass,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: `1px solid ${t.glassBorder}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '14px 0', gap: '4px',
      zIndex: 150,
    }}>
      {links.map(link => {
        const isActive = pathname === link.href
        const isHovered = hovered === link.href
        return (
          <div key={link.href} style={{ position: 'relative' }}
            onMouseEnter={() => setHovered(link.href)}
            onMouseLeave={() => setHovered(null)}>
            <Link href={link.href} title={link.title} style={{
              width: '36px', height: '36px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', fontSize: '15px', cursor: 'pointer',
              background: isActive ? t.bgCard : isHovered ? t.bgInput : 'transparent',
              color: isActive ? t.accent : isHovered ? t.text : t.textDim,
              boxShadow: isActive ? `inset 0 0 0 1px ${t.accent}30, ${t.glow}` : 'none',
              transition: 'all 0.2s ease',
            }}>
              {link.icon}
            </Link>
            {/* Tooltip */}
            {isHovered && (
              <div style={{
                position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
                marginLeft: '8px', padding: '5px 10px', borderRadius: '8px',
                background: t.glass, backdropFilter: 'blur(12px)',
                border: `1px solid ${t.glassBorder}`,
                boxShadow: '0 4px 16px rgba(0,0,0,.3)',
                fontSize: '11.5px', fontWeight: 500, color: t.text, whiteSpace: 'nowrap',
                pointerEvents: 'none' as const,
                letterSpacing: '-0.01em',
              }}>
                {link.title}
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
}