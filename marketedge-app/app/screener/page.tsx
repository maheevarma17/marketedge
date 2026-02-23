'use client'
import { useState } from 'react'

const stocks = [
  { sym: 'TATAMOTORS', name: 'Tata Motors Ltd',        price: 924.75,  chg: +3.21, vol: '22.8M', mcap: '₹3.4L Cr', pe: 8.2,  sector: 'Auto' },
  { sym: 'ICICIBANK',  name: 'ICICI Bank Ltd',          price: 1102.80, chg: +2.05, vol: '18.7M', mcap: '₹7.8L Cr', pe: 18.4, sector: 'Banking' },
  { sym: 'SUNPHARMA',  name: 'Sun Pharma Industries',   price: 1658.90, chg: +2.14, vol: '3.8M',  mcap: '₹3.9L Cr', pe: 34.1, sector: 'Pharma' },
  { sym: 'SBIN',       name: 'State Bank of India',     price: 782.90,  chg: +1.54, vol: '28.3M', mcap: '₹6.9L Cr', pe: 9.1,  sector: 'Banking' },
  { sym: 'RELIANCE',   name: 'Reliance Industries Ltd', price: 2941.50, chg: +1.23, vol: '8.2M',  mcap: '₹19.9L Cr',pe: 28.3, sector: 'Energy' },
  { sym: 'INFY',       name: 'Infosys Ltd',             price: 1680.10, chg: +0.87, vol: '5.4M',  mcap: '₹6.9L Cr', pe: 24.6, sector: 'IT' },
  { sym: 'TCS',        name: 'Tata Consultancy Svcs',   price: 3780.25, chg: -0.45, vol: '1.8M',  mcap: '₹13.7L Cr',pe: 30.2, sector: 'IT' },
  { sym: 'HDFCBANK',   name: 'HDFC Bank Ltd',           price: 1624.35, chg: -1.12, vol: '12.1M', mcap: '₹12.4L Cr',pe: 19.8, sector: 'Banking' },
  { sym: 'WIPRO',      name: 'Wipro Ltd',               price: 556.40,  chg: +0.72, vol: '7.2M',  mcap: '₹2.9L Cr', pe: 21.3, sector: 'IT' },
  { sym: 'ITC',        name: 'ITC Ltd',                 price: 472.15,  chg: -0.21, vol: '19.4M', mcap: '₹5.8L Cr', pe: 26.1, sector: 'FMCG' },
]

export default function ScreenerPage() {
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('All')

  const sectors = ['All', 'IT', 'Banking', 'Auto', 'Pharma', 'Energy', 'FMCG']

  const filtered = stocks.filter(s =>
    (sector === 'All' || s.sector === sector) &&
    (s.sym.toLowerCase().includes(search.toLowerCase()) ||
     s.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ padding: '24px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Stock Screener</div>
        <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Filter and find stocks · NSE</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
        <input
          type="text" placeholder="Search symbol or company..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            background: '#1e2438', border: '1px solid #252d3d', borderRadius: '7px',
            padding: '8px 14px', color: '#D1D4DC', fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace', outline: 'none', width: '260px'
          }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
          {sectors.map(s => (
            <div key={s} onClick={() => setSector(s)} style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer',
              background: sector === s ? '#2962FF' : '#1e2438',
              color: sector === s ? '#fff' : '#8892a4',
              border: `1px solid ${sector === s ? '#2962FF' : '#252d3d'}`
            }}>{s}</div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e2438' }}>
                {['Symbol', 'Price', 'Change', 'Volume', 'Mkt Cap', 'P/E', 'Sector'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', fontSize: '10px',
                    fontWeight: 600, letterSpacing: '0.9px', color: '#8892a4',
                    textTransform: 'uppercase' as const, borderBottom: '1px solid #252d3d',
                    whiteSpace: 'nowrap' as const
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.sym} style={{ borderBottom: '1px solid rgba(37,45,61,0.6)', cursor: 'pointer' }}>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{s.sym}</div>
                    <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '2px' }}>{s.name}</div>
                  </td>
                  <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#fff' }}>
                    ₹{s.price.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: s.chg >= 0 ? '#26a69a' : '#ef5350' }}>
                    {s.chg >= 0 ? '+' : ''}{s.chg.toFixed(2)}%
                  </td>
                  <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#8892a4' }}>{s.vol}</td>
                  <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#D1D4DC' }}>{s.mcap}</td>
                  <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#D1D4DC' }}>{s.pe}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      background: 'rgba(41,98,255,0.12)', color: '#2962FF',
                      border: '1px solid rgba(41,98,255,0.3)', borderRadius: '4px',
                      padding: '2px 8px', fontSize: '10px', fontWeight: 600
                    }}>{s.sector}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 14px', borderTop: '1px solid #252d3d', fontSize: '11px', color: '#8892a4' }}>
          Showing {filtered.length} of {stocks.length} stocks
        </div>
      </div>

    </div>
  )
}