'use client'
import { useState } from 'react'

export default function PaperTradingPage() {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [symbol, setSymbol] = useState('RELIANCE')
  const [qty, setQty] = useState('10')
  const [submitted, setSubmitted] = useState(false)

  const trades = [
    { date: '22-Feb-26', sym: 'TATAMOTORS', side: 'BUY',  qty: 100, entry: 895.00, exit: 924.75, pnl: 2975,   pnlPct: 3.32,  status: 'CLOSED' },
    { date: '21-Feb-26', sym: 'INFY',       side: 'BUY',  qty: 50,  entry: 1650.00,exit: 1680.10,pnl: 1505,   pnlPct: 1.82,  status: 'CLOSED' },
    { date: '20-Feb-26', sym: 'SBIN',       side: 'SELL', qty: 80,  entry: 798.00, exit: 782.90, pnl: 1208,   pnlPct: 1.89,  status: 'CLOSED' },
    { date: '19-Feb-26', sym: 'TCS',        side: 'BUY',  qty: 10,  entry: 3820.00,exit: 3780.25,pnl: -397.5, pnlPct: -1.04, status: 'CLOSED' },
    { date: '18-Feb-26', sym: 'HDFCBANK',   side: 'SELL', qty: 30,  entry: 1680.00,exit: 1624.35,pnl: 1669.5, pnlPct: 3.31,  status: 'CLOSED' },
  ]

  const totalPnL = trades.reduce((a, t) => a + t.pnl, 0)
  const wins = trades.filter(t => t.pnl > 0).length
  const winRate = Math.round((wins / trades.length) * 100)

  function handleSimulate() {
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div style={{ padding: '24px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Paper Trading</div>
          <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Simulated trading · No real money</div>
        </div>
        <div style={{ background: 'rgba(240,180,41,0.15)', color: '#f0b429', border: '1px solid rgba(240,180,41,0.4)', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
          PAPER MODE
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Virtual Capital',   value: '₹10,00,000', color: '#8892a4' },
          { label: 'Portfolio Value',   value: '₹10,06,960', color: '#2962FF' },
          { label: 'Total P&L',         value: (totalPnL >= 0 ? '+' : '') + '₹' + Math.abs(totalPnL).toLocaleString('en-IN'), color: totalPnL >= 0 ? '#26a69a' : '#ef5350' },
          { label: 'Win Rate',          value: winRate + '%', color: '#f0b429' },
        ].map(c => (
          <div key={c.label} style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', padding: '16px', borderTop: `2px solid ${c.color}` }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', color: '#8892a4', textTransform: 'uppercase' as const, marginBottom: '8px' }}>{c.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: c.color, fontFamily: 'JetBrains Mono, monospace' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px' }}>

        {/* Order Form */}
        <div style={{ background: '#1a1f2e', border: '1px solid rgba(240,180,41,0.3)', borderRadius: '10px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0b429', marginBottom: '16px' }}>⚡ Simulate Order</div>

          {/* Buy/Sell */}
          <div style={{ display: 'flex', background: '#1e2438', borderRadius: '6px', padding: '3px', marginBottom: '14px' }}>
            {(['BUY', 'SELL'] as const).map(s => (
              <button key={s} onClick={() => setSide(s)} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '4px', fontSize: '12px',
                fontWeight: 700, cursor: 'pointer',
                background: side === s ? (s === 'BUY' ? '#26a69a' : '#ef5350') : 'transparent',
                color: side === s ? '#fff' : '#8892a4'
              }}>{s === 'BUY' ? '▲ BUY' : '▼ SELL'}</button>
            ))}
          </div>

          {/* Symbol */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px' }}>SYMBOL</div>
            <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
              style={{ width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '9px 12px', color: '#D1D4DC', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }} />
          </div>

          {/* Qty */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px' }}>QUANTITY</div>
            <input type="number" value={qty} onChange={e => setQty(e.target.value)}
              style={{ width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '9px 12px', color: '#D1D4DC', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }} />
          </div>

          <div style={{ fontSize: '10px', color: '#8892a4', marginBottom: '12px', fontStyle: 'italic' }}>
            Orders execute at market price instantly in paper mode
          </div>

          <button onClick={handleSimulate} style={{
            width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            background: '#f0b429', color: '#131722'
          }}>
            ⚡ Simulate Order
          </button>

          {submitted && (
            <div style={{ marginTop: '12px', background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)', borderRadius: '7px', padding: '10px', fontSize: '12px', color: '#f0b429', textAlign: 'center' }}>
              ✓ Paper order simulated!
            </div>
          )}
        </div>

        {/* Trade History */}
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Trade History</div>
            <div style={{ fontSize: '11px', color: '#8892a4' }}>{wins}/{trades.length} winning trades</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e2438' }}>
                {['Date', 'Symbol', 'Side', 'Qty', 'Entry', 'Exit', 'P&L (₹)', 'P&L (%)'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, letterSpacing: '0.9px', color: '#8892a4', textTransform: 'uppercase' as const, borderBottom: '1px solid #252d3d', whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(37,45,61,0.6)' }}>
                  <td style={{ padding: '10px 12px', fontSize: '11px', color: '#8892a4', fontFamily: 'JetBrains Mono, monospace' }}>{t.date}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#fff', fontSize: '13px' }}>{t.sym}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700, color: t.side === 'BUY' ? '#26a69a' : '#ef5350' }}>{t.side}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#D1D4DC' }}>{t.qty}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#D1D4DC' }}>₹{t.entry}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#D1D4DC' }}>₹{t.exit}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: t.pnl >= 0 ? '#26a69a' : '#ef5350' }}>
                    {t.pnl >= 0 ? '+' : '-'}₹{Math.abs(t.pnl).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: t.pnlPct >= 0 ? '#26a69a' : '#ef5350' }}>
                    {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%
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