'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useTheme, THEMES } from '@/lib/theme'

interface SearchResult {
  symbol: string
  name: string
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setThemeId, t } = useTheme()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showThemes, setShowThemes] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const themeRef = useRef<HTMLDivElement>(null)

  const links = [
    { href: '/', label: 'Dashboard', icon: '◎' },
    { href: '/charts', label: 'Charts', icon: '◈' },
    { href: '/screener', label: 'Screener', icon: '◇' },
    { href: '/options', label: 'Options', icon: '◆' },
    { href: '/orders', label: 'Orders', icon: '◫' },
    { href: '/portfolio', label: 'Portfolio', icon: '◩' },
    { href: '/watchlist', label: 'Watchlist', icon: '◉' },
    { href: '/paper-trading', label: 'Paper Trade', icon: '◈' },
    { href: '/backtest', label: 'Backtest', icon: '◬' },
    { href: '/strategy-ide', label: 'Strategy IDE', icon: '◇' },
    { href: '/analytics', label: 'Analytics', icon: '◈' },
    { href: '/alerts', label: 'Alerts', icon: '◎' },
    { href: '/news', label: 'News', icon: '◇' },
    { href: '/journal', label: 'Journal', icon: '◉' },
    { href: '/calendar', label: 'Calendar', icon: '◬' },
    { href: '/compare', label: 'Compare', icon: '◫' },
    { href: '/calculator', label: 'Calculator', icon: '◈' },
    { href: '/heatmap', label: 'Heatmap', icon: '◩' },
    { href: '/reports', label: 'Reports', icon: '◇' },
    { href: '/learn', label: 'Learn', icon: '◉' },
    { href: '/ai-assistant', label: 'AI', icon: '◎' },
  ]

  // Click outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false)
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemes(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleSearch(q: string) {
    setSearch(q)
    if (q.length >= 1) {
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResults(data)
        setShowResults(true)
      } catch { setResults([]) }
    } else { setResults([]); setShowResults(false) }
  }

  function goToChart(sym: string) {
    setSearch('')
    setShowResults(false)
    router.push(`/charts?symbol=${sym}`)
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '54px',
      background: t.glass,
      backdropFilter: 'blur(24px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
      borderBottom: `1px solid ${t.glassBorder}`,
      display: 'flex', alignItems: 'center', padding: '0 16px',
      gap: '8px', zIndex: 200,
    }}>
      {/* Hamburger — mobile only */}
      <button className="me-hamburger" onClick={() => setMobileNav(!mobileNav)} style={{
        background: 'none', border: 'none', color: t.text, fontSize: '20px', cursor: 'pointer',
        display: 'none', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
      }}>
        {mobileNav ? '✕' : '☰'}
      </button>

      {/* Logo */}
      <div style={{ fontSize: '18px', fontWeight: 700, color: t.text, flexShrink: 0, letterSpacing: '-0.03em' }}>
        Market<span style={{ color: t.accent }}>Edge</span>
      </div>

      {/* Nav links — hidden scrollbar (hidden on mobile via CSS) */}
      <div className="me-nav-links hide-scrollbar" style={{
        display: 'flex', gap: '1px', marginLeft: '8px',
        overflow: 'auto', flexShrink: 1,
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      } as React.CSSProperties}>
        {links.map(link => {
          const isActive = pathname === link.href
          return (
            <Link key={link.href} href={link.href} style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '12.5px',
              fontWeight: isActive ? 600 : 450, textDecoration: 'none', whiteSpace: 'nowrap',
              color: isActive ? t.text : t.textDim,
              background: isActive ? t.bgCard : 'transparent',
              boxShadow: isActive ? t.shadow : 'none',
              transition: 'all 0.2s ease',
              letterSpacing: '-0.01em',
            }}>
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* Mobile nav drawer */}
      {mobileNav && (
        <div className="me-mobile-nav" style={{
          background: t.bg, padding: '16px',
        }}>
          {links.map(link => {
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileNav(false)} style={{
                display: 'block', padding: '12px 16px', borderRadius: '10px', fontSize: '14px',
                fontWeight: isActive ? 600 : 400, textDecoration: 'none',
                color: isActive ? t.accent : t.text,
                background: isActive ? t.bgCard : 'transparent',
                marginBottom: '2px',
              }}>
                {link.icon} {link.label}
              </Link>
            )
          })}
        </div>
      )}

      {/* Search */}
      <div style={{ marginLeft: 'auto', position: 'relative', width: '200px', flexShrink: 0 }} ref={searchRef}>
        <input
          value={search}
          onChange={e => handleSearch(e.target.value.toUpperCase())}
          onFocus={() => search.length >= 1 && setShowResults(true)}
          placeholder="Search stock..."
          style={{
            width: '100%', background: t.bgInput,
            border: `1px solid ${t.border}`,
            borderRadius: '10px', padding: '7px 12px 7px 30px', color: t.textMuted,
            fontSize: '12.5px', outline: 'none',
            letterSpacing: '-0.01em',
          }}
        />
        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', opacity: 0.4 }}>⌕</span>
        {showResults && results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 300,
            background: t.glass, backdropFilter: 'blur(20px)',
            border: `1px solid ${t.glassBorder}`, borderRadius: '12px',
            maxHeight: '260px', overflowY: 'auto',
            boxShadow: '0 12px 40px rgba(0,0,0,.4)',
          }}>
            {results.map(s => (
              <div key={s.symbol} onClick={() => goToChart(s.symbol)}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${t.border}`, transition: '.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = t.bgInput)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ fontWeight: 600, color: t.text, fontSize: '12.5px', letterSpacing: '-0.01em' }}>{s.symbol}</div>
                <div style={{ fontSize: '11px', color: t.textDim, marginTop: '1px' }}>{s.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme Picker */}
      <div style={{ position: 'relative', flexShrink: 0 }} ref={themeRef}>
        <button onClick={() => setShowThemes(!showThemes)} style={{
          background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '10px',
          padding: '5px 8px', cursor: 'pointer', fontSize: '15px',
          display: 'flex', alignItems: 'center',
        }} title="Change Theme">
          {theme.icon}
        </button>
        {showThemes && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 300,
            background: t.glass, backdropFilter: 'blur(20px)',
            border: `1px solid ${t.glassBorder}`, borderRadius: '14px',
            boxShadow: '0 12px 40px rgba(0,0,0,.4)', padding: '6px', width: '180px',
          }}>
            {THEMES.map(th => (
              <div key={th.id} onClick={() => { setThemeId(th.id); setShowThemes(false) }}
                style={{
                  padding: '9px 12px', borderRadius: '10px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: theme.id === th.id ? t.bgInput : 'transparent',
                  boxShadow: theme.id === th.id ? `inset 0 0 0 1px ${t.accent}40` : 'none',
                  marginBottom: '2px', transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (theme.id !== th.id) e.currentTarget.style.background = t.bgInput }}
                onMouseLeave={e => { if (theme.id !== th.id) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: '15px' }}>{th.icon}</span>
                <span style={{ fontSize: '12.5px', fontWeight: 500, color: t.text, letterSpacing: '-0.01em' }}>{th.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Market Status + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{
          background: `${t.green}18`, color: t.green,
          borderRadius: '8px',
          padding: '4px 10px', fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.02em',
        }}>OPEN</div>
        <Link href="/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '10px',
            background: `linear-gradient(135deg,${t.accent},${t.accent}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 600, color: '#fff', cursor: 'pointer',
            boxShadow: pathname === '/profile' ? t.glow : 'none',
          }}>M</div>
        </Link>
      </div>
    </nav>
  )
}