'use client'
import { useTheme } from '@/lib/theme'

export default function Footer() {
  const { t } = useTheme()

  return (
    <footer style={{
      background: t.bgCard,
      borderTop: `1px solid ${t.border}`,
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap' as const,
      gap: '10px',
    }}>
      <div style={{ fontSize: '12px', color: t.textDim }}>
        <strong style={{ color: t.textMuted }}>MarketEdge</strong> © 2025 — All Rights Reserved
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        {['Terms', 'Privacy', 'Disclaimer', 'Support'].map(link => (
          <a key={link} href="#" style={{
            fontSize: '12px', color: t.textDim, textDecoration: 'none'
          }}>{link}</a>
        ))}
      </div>
      <div style={{ fontSize: '11px', color: t.textDim, fontFamily: 'JetBrains Mono, monospace' }}>
        v1.0.0 · NSE · BSE
      </div>
    </footer>
  )
}