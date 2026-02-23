'use client'

export default function PortfolioPage() {
  const holdings = [
    { sym: 'RELIANCE', co: 'Reliance Industries Ltd', qty: 50,  avg: 2620.00, ltp: 2941.50, pnl: 16075,   pnlPct: 12.23,  day: +1.23 },
    { sym: 'TCS',      co: 'Tata Consultancy Services',qty: 20,  avg: 3920.00, ltp: 3780.25, pnl: -2795,   pnlPct: -3.56,  day: -0.45 },
    { sym: 'INFY',     co: 'Infosys Ltd',              qty: 100, avg: 1540.00, ltp: 1680.10, pnl: 14010,   pnlPct: 9.10,   day: +0.87 },
    { sym: 'HDFCBANK', co: 'HDFC Bank Ltd',            qty: 30,  avg: 1720.00, ltp: 1624.35, pnl: -2869.5, pnlPct: -5.56,  day: -1.12 },
    { sym: 'ICICIBANK',co: 'ICICI Bank Ltd',           qty: 75,  avg: 980.00,  ltp: 1102.80, pnl: 9210,    pnlPct: 12.53,  day: +2.05 },
    { sym: 'TATAMOTORS',co:'Tata Motors Ltd',          qty: 120, avg: 780.00,  ltp: 924.75,  pnl: 17370,   pnlPct: 18.59,  day: +3.21 },
    { sym: 'SUNPHARMA',co: 'Sun Pharmaceutical Ind',  qty: 40,  avg: 1480.00, ltp: 1658.90, pnl: 7156,    pnlPct: 12.08,  day: +2.14 },
    { sym: 'ITC',      co: 'ITC Ltd',                 qty: 300, avg: 395.00,  ltp: 472.15,  pnl: 23145,   pnlPct: 19.53,  day: -0.21 },
    { sym: 'AXISBANK', co: 'Axis Bank Ltd',           qty: 60,  avg: 1150.00, ltp: 1076.40, pnl: -4416,   pnlPct: -6.40,  day: +1.08 },
    { sym: 'MARUTI',   co: 'Maruti Suzuki India Ltd', qty: 10,  avg: 10800.00,ltp: 12478.25,pnl: 16782.5, pnlPct: 15.54,  day: +0.91 },
  ]

  const totalInv = holdings.reduce((a, h) => a + h.avg * h.qty, 0)
  const totalCur = holdings.reduce((a, h) => a + h.ltp * h.qty, 0)
  const totalPnL = totalCur - totalInv

  const cards = [
    { label: 'Total Investment', value: '₹' + totalInv.toLocaleString('en-IN', { maximumFractionDigits: 0 }), color: '#8892a4' },
    { label: 'Current Value',    value: '₹' + totalCur.toLocaleString('en-IN', { maximumFractionDigits: 0 }), color: '#2962FF' },
    { label: 'Total P&L',        value: (totalPnL >= 0 ? '+' : '') + '₹' + Math.abs(totalPnL).toLocaleString('en-IN', { maximumFractionDigits: 0 }), color: totalPnL >= 0 ? '#26a69a' : '#ef5350' },
    { label: 'XIRR',             value: '+18.42%', color: '#26a69a' },
    { label: 'Total Stocks',     value: holdings.length.toString(), color: '#f0b429' },
  ]

  return (
    <div style={{ padding: '24px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Portfolio & P&L</div>
        <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Arjun Kapoor · Live Holdings</div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', padding: '18px', borderTop: `2px solid ${c.color}` }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', color: '#8892a4', textTransform: 'uppercase' as const, marginBottom: '10px' }}>{c.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: c.color, fontFamily: 'JetBrains Mono, monospace' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Holdings Table */}
      <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Holdings ({holdings.length})</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e2438' }}>
                {['Symbol', 'Qty', 'Avg Price', 'LTP', 'Curr Value', 'P&L (₹)', 'P&L (%)', 'Day Chg'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, letterSpacing: '0.9px', color: '#8892a4', textTransform: 'uppercase' as const, borderBottom: '1px solid #252d3d', whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => (
                <tr key={h.sym} style={{ borderBottom: '1px solid rgba(37,45,61,0.6)' }}>
                  <td style={{ padding: '11px 12px' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{h.sym}</div>
                    <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '2px' }}>{h.co}</div>
                  </td>
                  <td style={{ padding: '11px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#D1D4DC' }}>{h.qty}</td>
                  <td style={{ padding: '11px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#D1D4DC' }}>₹{h.avg.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#D1D4DC' }}>₹{h.ltp.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#D1D4DC' }}>₹{(h.ltp * h.qty).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td style={{ padding: '11px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: h.pnl >= 0 ? '#26a69a' : '#ef5350' }}>
                    {h.pnl >= 0 ? '+' : '-'}₹{Math.abs(h.pnl).toLocaleString('en-IN')}
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
        {/* Summary bar */}
        <div style={{ padding: '12px 18px', background: '#1e2438', borderTop: '1px solid #252d3d', display: 'flex', gap: '24px', flexWrap: 'wrap' as const }}>
          <div><div style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Invested</div><div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}>₹{totalInv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div></div>
          <div><div style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Current</div><div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}>₹{totalCur.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div></div>
          <div><div style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Total P&L</div><div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: totalPnL >= 0 ? '#26a69a' : '#ef5350' }}>{totalPnL >= 0 ? '+' : '-'}₹{Math.abs(totalPnL).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div></div>
        </div>
      </div>

    </div>
  )
}