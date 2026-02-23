'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/', title: 'Dashboard', icon: '▦' },
    { href: '/charts', title: 'Charts', icon: '📈' },
    { href: '/screener', title: 'Screener', icon: '🔍' },
    { href: '/portfolio', title: 'Portfolio', icon: '💼' },
    { href: '/ai-assistant', title: 'AI Bot', icon: '🤖' },
    { href: '/settings', title: 'Settings', icon: '⚙️' },
  ]

  return (
    <aside style={{
      position: 'fixed', top: '56px', left: 0,
      width: '52px', height: 'calc(100vh - 56px)',
      background: '#1a1f2e', borderRight: '1px solid #252d3d',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '12px 0', gap: '3px',
      zIndex: 150
    }}>
      {links.map(link => (
        <Link key={link.href} href={link.href} title={link.title} style={{
          width: '38px', height: '38px', borderRadius: '7px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', fontSize: '16px', cursor: 'pointer',
          background: pathname === link.href ? 'rgba(41,98,255,.15)' : 'transparent',
          color: pathname === link.href ? '#2962FF' : '#8892a4',
        }}>
          {link.icon}
        </Link>
      ))}
    </aside>
  )
}