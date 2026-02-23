'use client'
import { useState } from 'react'

const allStocks = [
  { sym: 'NIFTY',      name: 'Nifty 50 Index',        ltp: 22147.90, chg: +0.83 },
  { sym: 'BANKNIFTY',  name: 'Bank Nifty Index',       ltp: 47832.15, chg: -0.18 },
  { sym: 'RELIANCE',   name: 'Reliance Industries Ltd',ltp: 2941.50,  chg: +1.23 },
  { sym: 'TCS',        name: 'Tata Consultancy Svcs',  ltp: 3780.25,  chg: -0.45 },
  { sym: 'INFY',       name: 'Infosys Ltd',            ltp: 1680.10,  chg: +0.87 },
  { sym: 'HDFCBANK',   name: 'HDFC Bank Ltd',          ltp: 1624.35,  chg: -1.12 },
  { sym: 'ICICIBANK',  name: 'ICICI Bank Ltd',         ltp: 1102.80,  chg: +2.05 },
  { sym: 'SBIN',       name: 'State Bank of India',    ltp: 782.90,   chg: +1.54 },
  { sym: 'TATAMOTORS', name: 'Tata Motors Ltd',        ltp: 924.75,   chg: +3.21 },
  { sym: 'WIPRO',      name: 'Wipro Ltd',              ltp: 556.40,   chg: +0.72 },
]

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState(['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY'])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const suggestions = search
    ? allStocks.filter(s =>
        s.sym.toLowerCase().includes(search.toLowerCase()) &&
        !watchlist.includes(s.sym)
      )
    : []

  function addStock(sym: string) {
    if (!watchlist.includes(sym)) setWatchlist([...watchlist, sym])
    setSearch('')
  }

  function removeStock(sym: string) {
    setWatchlist(watchlist.filter(s => s !== sym))
    if (selected === sym) setSelected(null)
  }

  const watchlistStocks = allStocks.filter(s => watchlist.includes(s.sym))
  const selectedStock = allStocks.find(s => s.sym === selected)

  return (
    <div style={{ padding: '24px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Watchlist</div>
        <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>{watchlist.length} instruments · Live prices</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>

        {/* Main watchlist */}
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>

          {/* Search to add */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #252d3d', position: 'relative' }}>
            <input
              type="text" placeholder="🔍 Search and add symbol..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '7px', padding: '9px 14px', color: '#D1D4DC', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
            />
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: '14px', right: '14px', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '8px', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                {suggestions.map(s => (
                  <div key={s.sym} onClick={() => addStock(s.sym)}
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(37,45,61,0.4)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#252d3d')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>{s.sym}</div>
                      <div style={{ fontSize: '10px', color: '#8892a4' }}>{s.name}</div>
                    </div>
                    <div style={{ color: '#2962FF', fontSize: '18px' }}>+</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock list */}
          {watchlistStocks.map(s => (
            <div key={s.sym}
              onClick={() => setSelected(s.sym)}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px 14px',
                borderBottom: '1px solid rgba(37,45,61,0.4)', cursor: 'pointer',
                background: selected === s.sym ? 'rgba(41,98,255,0.08)' : 'transparent',
                transition: '0.15s'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>{s.sym}</div>
                <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '2px' }}>{s.name}</div>
              </div>
              <div style={{ textAlign: 'right', marginRight: '12px' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 600, color: '#fff' }}>₹{s.ltp.toLocaleString('en-IN')}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: s.chg >= 0 ? '#26a69a' : '#ef5350' }}>
                  {s.chg >= 0 ? '+' : ''}{s.chg.toFixed(2)}%
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); removeStock(s.sym) }}
                style={{ background: 'none', border: '1px solid #252d3d', borderRadius: '5px', color: '#8892a4', width: '26px', height: '26px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>
          ))}

          <div style={{ padding: '10px 14px', fontSize: '11px', color: '#8892a4', borderTop: '1px solid #252d3d' }}>
            {watchlist.length} / 50 slots used
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', padding: '20px' }}>
          {selectedStock ? (
            <>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>{selectedStock.sym}</div>
              <div style={{ fontSize: '11px', color: '#8892a4', marginBottom: '16px' }}>{selectedStock.name}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>
                ₹{selectedStock.ltp.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: selectedStock.chg >= 0 ? '#26a69a' : '#ef5350', marginBottom: '20px' }}>
                {selectedStock.chg >= 0 ? '▲' : '▼'} {Math.abs(selectedStock.chg).toFixed(2)}%
              </div>
              {[
                { label: 'Day High',   value: '₹' + (selectedStock.ltp * 1.015).toFixed(2) },
                { label: 'Day Low',    value: '₹' + (selectedStock.ltp * 0.985).toFixed(2) },
                { label: 'Volume',     value: '12.4M' },
                { label: '52W High',   value: '₹' + (selectedStock.ltp * 1.28).toFixed(2) },
                { label: '52W Low',    value: '₹' + (selectedStock.ltp * 0.74).toFixed(2) },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(37,45,61,0.5)', fontSize: '12px' }}>
                  <span style={{ color: '#8892a4' }}>{item.label}</span>
                  <span style={{ color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
              <button style={{ width: '100%', marginTop: '16px', background: '#2962FF', border: 'none', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                📈 Open Chart
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8892a4' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>👆</div>
              <div style={{ fontSize: '13px' }}>Click a stock to see details</div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}