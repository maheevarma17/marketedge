'use client'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const cards = [
    { label: 'Portfolio Value', value: '₹11,42,380', sub: '+14.2% overall', color: '#2962FF' },
    { label: "Day's P&L", value: '+₹8,410', sub: '+0.74% today', color: '#26a69a' },
    { label: 'Total Invested', value: '₹9,84,200', sub: '10 stocks', color: '#8892a4' },
    { label: 'Open Orders', value: '3', sub: '2 buy · 1 sell', color: '#f0b429' },
    { label: 'Margin Available', value: '₹2,18,500', sub: 'of ₹5,00,000', color: '#26a69a' },
  ]

  const holdings = [
    { sym: 'RELIANCE', co: 'Reliance Industries', qty: 50, avg: 2620, ltp: 2941.50, pnl: 16075, pnlPct: 12.23, day: +1.23 },
    { sym: 'TCS', co: 'Tata Consultancy Services', qty: 20, avg: 3920, ltp: 3780.25, pnl: -2795, pnlPct: -3.56, day: -0.45 },
    { sym: 'INFY', co: 'Infosys Ltd', qty: 100, avg: 1540, ltp: 1680.10, pnl: 14010, pnlPct: 9.10, day: +0.87 },
    { sym: 'HDFCBANK', co: 'HDFC Bank Ltd', qty: 30, avg: 1720, ltp: 1624.35, pnl: -2869.50, pnlPct: -5.56, day: -1.12 },
    { sym: 'ICICIBANK', co: 'ICICI Bank Ltd', qty: 75, avg: 980, ltp: 1102.80, pnl: 9210, pnlPct: 12.53, day: +2.05 },
  ]

  return (
    <div style={{ padding: '24px', fontFamily: 'Syne, sans-serif' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
          Dashboard
        </div>
        <div style={{ fontSize: '12px', color: '#8892a4', fontFamily: 'JetBrains Mono, monospace' }}>
          Arjun Kapoor · As of {time}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {cards.map(card => (
          <div key={card.label} style={{
            background: '#1a1f2e', border: '1px solid #252d3d',
            borderRadius: '10px', padding: '18px', borderTop: `2px solid ${card.color}`
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', color: '#8892a4', textTransform: 'uppercase' as const, marginBottom: '10px' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '11px', color: '#8892a4', fontFamily: 'JetBrains Mono, monospace' }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Holdings Table */}
      <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Top Holdings</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e2438' }}>
                {['Symbol', 'Qty', 'Avg Price', 'LTP', 'P&L (₹)', 'P&L (%)', 'Day Chg'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, letterSpacing: '0.9px', color: '#8892a4', textTransform: 'uppercase' as const, borderBottom: '1px solid #252d3d', whiteSpace: 'nowrap' as const }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr key={h.sym} style={{ borderBottom: '1px solid rgba(37,45,61,0.6)' }}>
                  <td style={{ padding: '11px 12px' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{h.sym}</div>
                    <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '2px' }}>{h.co}</div>
                  </td>
                  <td style={{ padding: '11px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#D1D4DC' }}>{h.qty}</td>
                  <td style={{ padding: '11px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#D1D4DC' }}>₹{h.avg.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#D1D4DC' }}>₹{h.ltp.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: h.pnl >= 0 ? '#26a69a' : '#ef5350' }}>
                    {h.pnl >= 0 ? '+' : ''}₹{Math.abs(h.pnl).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '11px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: h.pnlPct >= 0 ? '#26a69a' : '#ef5350' }}>
                    {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                  </td>
                  <td style={{ padding: '11px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: h.day >= 0 ? '#26a69a' : '#ef5350' }}>
                    {h.day >= 0 ? '+' : ''}{h.day.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}