'use client'
import { useState } from 'react'

export default function OptionsPage() {
  const [symbol, setSymbol] = useState('NIFTY')
  const [expiry, setExpiry] = useState('27-Feb-2026')

  const strikes = [
    { strike: 21800, callOI: 82400,  callChg: +12400, callLTP: 412.50, putLTP: 28.30,  putOI: 18200, putChg: -4200 },
    { strike: 21900, callOI: 124500, callChg: +18200, callLTP: 318.75, putLTP: 42.60,  putOI: 26400, putChg: -6100 },
    { strike: 22000, callOI: 218000, callChg: +32000, callLTP: 228.40, putLTP: 68.90,  putOI: 42800, putChg: +8400 },
    { strike: 22100, callOI: 312000, callChg: +48000, callLTP: 148.20, putLTP: 112.40, putOI: 78400, putChg: +14200, atm: true },
    { strike: 22200, callOI: 198000, callChg: -12000, callLTP: 84.60,  putLTP: 182.50, putOI: 124000,putChg: +22000 },
    { strike: 22300, callOI: 142000, callChg: -24000, callLTP: 42.30,  putLTP: 268.40, putOI: 86200, putChg: +12400 },
    { strike: 22400, callOI: 98000,  callChg: -18000, callLTP: 18.90,  putLTP: 362.80, putOI: 48400, putChg: +8200 },
  ]

  const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY']
  const expiries = ['27-Feb-2026', '06-Mar-2026', '27-Mar-2026', '24-Apr-2026']

  return (
    <div style={{ padding: '24px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Options Chain</div>
        <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>NSE Derivatives · Live Data</div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {symbols.map(s => (
            <div key={s} onClick={() => setSymbol(s)} style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
              background: symbol === s ? '#2962FF' : '#1e2438',
              color: symbol === s ? '#fff' : '#8892a4',
              border: `1px solid ${symbol === s ? '#2962FF' : '#252d3d'}`
            }}>{s}</div>
          ))}
        </div>
        <select value={expiry} onChange={e => setExpiry(e.target.value)}
          style={{ background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '6px 14px', color: '#D1D4DC', fontSize: '12px', outline: 'none' }}>
          {expiries.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#8892a4' }}>Spot:</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>22,147.90</span>
          <span style={{ fontSize: '12px', color: '#26a69a', fontFamily: 'JetBrains Mono, monospace' }}>+0.83%</span>
        </div>
      </div>

      {/* Options Chain Table */}
      <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#1e2438' }}>
                <th colSpan={3} style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#26a69a', letterSpacing: '1px', borderBottom: '1px solid #252d3d', borderRight: '2px solid #2962FF' }}>
                  CALLS
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '1px', borderBottom: '1px solid #252d3d', background: 'rgba(41,98,255,0.1)' }}>
                  STRIKE
                </th>
                <th colSpan={3} style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#ef5350', letterSpacing: '1px', borderBottom: '1px solid #252d3d', borderLeft: '2px solid #2962FF' }}>
                  PUTS
                </th>
              </tr>
              <tr style={{ background: '#1e2438' }}>
                {['OI', 'Chg OI', 'LTP', 'STRIKE', 'LTP', 'Chg OI', 'OI'].map((h, i) => (
                  <th key={i} style={{
                    padding: '8px 12px', textAlign: i < 3 ? 'right' : i === 3 ? 'center' : 'left',
                    fontSize: '10px', fontWeight: 600, letterSpacing: '0.9px', color: '#8892a4',
                    textTransform: 'uppercase' as const, borderBottom: '1px solid #252d3d',
                    ...(i === 3 ? { background: 'rgba(41,98,255,0.08)', borderLeft: '2px solid #2962FF', borderRight: '2px solid #2962FF' } : {})
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {strikes.map(row => (
                <tr key={row.strike} style={{
                  borderBottom: '1px solid rgba(37,45,61,0.6)',
                  background: row.atm ? 'rgba(41,98,255,0.06)' : 'transparent'
                }}>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#D1D4DC' }}>{row.callOI.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: row.callChg >= 0 ? '#26a69a' : '#ef5350' }}>
                    {row.callChg >= 0 ? '+' : ''}{row.callChg.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#26a69a' }}>₹{row.callLTP}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 800, color: row.atm ? '#2962FF' : '#fff', background: row.atm ? 'rgba(41,98,255,0.1)' : 'transparent', borderLeft: '2px solid #2962FF', borderRight: '2px solid #2962FF' }}>
                    {row.strike.toLocaleString('en-IN')}
                    {row.atm && <span style={{ fontSize: '8px', color: '#2962FF', marginLeft: '4px' }}>ATM</span>}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#ef5350' }}>₹{row.putLTP}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: row.putChg >= 0 ? '#26a69a' : '#ef5350' }}>
                    {row.putChg >= 0 ? '+' : ''}{row.putChg.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#D1D4DC' }}>{row.putOI.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}