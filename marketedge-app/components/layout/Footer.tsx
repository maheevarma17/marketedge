export default function Footer() {
  return (
    <footer style={{
      background: '#1a1f2e',
      borderTop: '1px solid #252d3d',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap' as const,
      gap: '10px',
      marginLeft: '52px'
    }}>
      <div style={{ fontSize: '12px', color: '#8892a4' }}>
        <strong style={{ color: '#D1D4DC' }}>MarketEdge</strong> © 2025 — All Rights Reserved
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        {['Terms', 'Privacy', 'Disclaimer', 'Support'].map(link => (
          <a key={link} href="#" style={{
            fontSize: '12px', color: '#8892a4', textDecoration: 'none'
          }}>{link}</a>
        ))}
      </div>
      <div style={{ fontSize: '11px', color: '#8892a4', fontFamily: 'JetBrains Mono, monospace' }}>
        v1.0.0 · NSE · BSE
      </div>
    </footer>
  )
}