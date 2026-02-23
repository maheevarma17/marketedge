'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/charts', label: 'Charts' },
    { href: '/screener', label: 'Screener' },
    { href: '/options', label: 'Options' },
    { href: '/orders', label: 'Orders' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/watchlist', label: 'Watchlist' },
    { href: '/paper-trading', label: 'Paper Trade' },
    { href: '/ai-assistant', label: 'AI Assistant' },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '56px',
      background: '#1a1f2e', borderBottom: '1px solid #252d3d',
      display: 'flex', alignItems: 'center', padding: '0 20px',
      gap: '16px', zIndex: 200
    }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>
        Market<span style={{ color: '#2962FF' }}>Edge</span>
      </div>
      <div style={{ display: 'flex', gap: '2px', marginLeft: '16px' }}>
        {links.map(link => (
          <Link key={link.href} href={link.href} style={{
            padding: '6px 13px', borderRadius: '6px', fontSize: '13px',
            fontWeight: 500, textDecoration: 'none',
            color: pathname === link.href ? '#fff' : '#8892a4',
            background: pathname === link.href ? '#2962FF' : 'transparent',
          }}>
            {link.label}
          </Link>
        ))}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'rgba(38,166,154,.12)', color: '#26a69a',
          border: '1px solid rgba(38,166,154,.3)', borderRadius: '5px',
          padding: '3px 8px', fontSize: '11px', fontWeight: 600
        }}>MARKET OPEN</div>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg,#2962FF,#6c63ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer'
        }}>AK</div>
      </div>
    </nav>
  )
}