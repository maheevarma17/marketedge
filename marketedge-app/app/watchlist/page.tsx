'use client'
import { useState, useEffect, useCallback } from 'react'
import { getQuote, searchStocks, type StockQuote, type StockSearchResult } from '@/lib/api'

const STORAGE_KEY = 'marketedge_watchlist'
const DEFAULT_WATCHLIST = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']

interface WatchlistStock {
  sym: string
  name: string
  price: number
  change: number
  changePct: number
  dayHigh: number
  dayLow: number
  volume: number
  marketState: string
  loading: boolean
}

function loadWatchlist(): string[] {
  if (typeof window === 'undefined') return DEFAULT_WATCHLIST
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : DEFAULT_WATCHLIST
}

function saveWatchlist(list: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export default function WatchlistPage() {
  const [symbols, setSymbols] = useState<string[]>([])
  const [stocks, setStocks] = useState<WatchlistStock[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedQuote, setSelectedQuote] = useState<WatchlistStock | null>(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [loading, setLoading] = useState(true)

  // Load watchlist
  useEffect(() => {
    setSymbols(loadWatchlist())
  }, [])

  // Fetch prices for all watchlist stocks
  const fetchPrices = useCallback(async () => {
    if (symbols.length === 0) { setLoading(false); return }
    setLoading(true)
    const results: WatchlistStock[] = []
    for (const sym of symbols) {
      try {
        const q = await getQuote(sym)
        results.push({
          sym, name: q.name, price: q.price, change: q.change,
          changePct: q.changePct, dayHigh: q.dayHigh, dayLow: q.dayLow,
          volume: q.volume, marketState: q.marketState, loading: false,
        })
      } catch {
        results.push({ sym, name: sym, price: 0, change: 0, changePct: 0, dayHigh: 0, dayLow: 0, volume: 0, marketState: 'UNKNOWN', loading: false })
      }
    }
    setStocks(results)
    setLoading(false)
  }, [symbols])

  useEffect(() => { fetchPrices() }, [fetchPrices])

  // Search
  async function handleSearch(q: string) {
    setSearch(q)
    if (q.length >= 1) {
      const results = await searchStocks(q)
      setSearchResults(results.filter(r => !symbols.includes(r.symbol)))
    } else {
      setSearchResults([])
    }
  }

  // Add stock
  async function addStock(sym: string) {
    if (!symbols.includes(sym)) {
      const newList = [...symbols, sym]
      setSymbols(newList)
      saveWatchlist(newList)
    }
    setSearch('')
    setSearchResults([])
  }

  // Remove stock
  function removeStock(sym: string) {
    const newList = symbols.filter(s => s !== sym)
    setSymbols(newList)
    saveWatchlist(newList)
    setStocks(stocks.filter(s => s.sym !== sym))
    if (selected === sym) { setSelected(null); setSelectedQuote(null) }
  }

  // Select stock for detail
  function selectStock(sym: string) {
    setSelected(sym)
    const stock = stocks.find(s => s.sym === sym)
    setSelectedQuote(stock || null)
  }

  const mono = { fontFamily: 'JetBrains Mono, monospace' }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Watchlist</div>
        <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>
          {symbols.length} instruments · {loading ? 'Fetching prices...' : 'Live prices'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
        {/* Main watchlist */}
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #252d3d', position: 'relative' }}>
            <input type="text" placeholder="🔍 Search and add symbol..."
              value={search} onChange={e => handleSearch(e.target.value.toUpperCase())}
              style={{ width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '7px', padding: '9px 14px', color: '#D1D4DC', fontSize: '13px', ...mono, outline: 'none' }}
            />
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: '14px', right: '14px', background: '#1e2438', border: '1px solid #2962FF', borderRadius: '0 0 8px 8px', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: '200px', overflowY: 'auto' }}>
                {searchResults.map(s => (
                  <div key={s.symbol} onClick={() => addStock(s.symbol)}
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(37,45,61,0.4)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#252d3d')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px', ...mono }}>{s.symbol}</div>
                      <div style={{ fontSize: '10px', color: '#8892a4' }}>{s.name}</div>
                    </div>
                    <div style={{ color: '#2962FF', fontSize: '18px', fontWeight: 700 }}>+</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock list */}
          {loading && stocks.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8892a4' }}>Fetching live prices...</div>
          ) : stocks.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8892a4' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
              <div>Your watchlist is empty. Search and add stocks above!</div>
            </div>
          ) : (
            stocks.map(s => (
              <div key={s.sym} onClick={() => selectStock(s.sym)} style={{
                display: 'flex', alignItems: 'center', padding: '12px 14px',
                borderBottom: '1px solid rgba(37,45,61,0.4)', cursor: 'pointer',
                background: selected === s.sym ? 'rgba(41,98,255,0.08)' : 'transparent',
                transition: '.15s',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px', ...mono }}>{s.sym}</div>
                  <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '2px' }}>{s.name}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: '12px' }}>
                  <div style={{ ...mono, fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                    {s.price > 0 ? `₹${s.price.toLocaleString('en-IN')}` : '—'}
                  </div>
                  <div style={{ ...mono, fontSize: '11px', color: s.changePct >= 0 ? '#26a69a' : '#ef5350' }}>
                    {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); removeStock(s.sym) }}
                  style={{ background: 'none', border: '1px solid #252d3d', borderRadius: '5px', color: '#8892a4', width: '26px', height: '26px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
            ))
          )}

          <div style={{ padding: '10px 14px', fontSize: '11px', color: '#8892a4', borderTop: '1px solid #252d3d' }}>
            {symbols.length} / 50 slots used
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', padding: '20px' }}>
          {selectedQuote ? (
            <>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', ...mono }}>{selectedQuote.sym}</div>
              <div style={{ fontSize: '11px', color: '#8892a4', marginBottom: '16px' }}>{selectedQuote.name}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff', ...mono, marginBottom: '4px' }}>
                ₹{selectedQuote.price.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, ...mono, color: selectedQuote.changePct >= 0 ? '#26a69a' : '#ef5350', marginBottom: '6px' }}>
                {selectedQuote.changePct >= 0 ? '▲' : '▼'} {selectedQuote.change >= 0 ? '+' : ''}{selectedQuote.change.toFixed(2)} ({selectedQuote.changePct >= 0 ? '+' : ''}{selectedQuote.changePct.toFixed(2)}%)
              </div>
              <div style={{ fontSize: '10px', color: selectedQuote.marketState === 'REGULAR' ? '#26a69a' : '#f0b429', ...mono, marginBottom: '16px' }}>
                {selectedQuote.marketState === 'REGULAR' ? '● LIVE' : '● ' + selectedQuote.marketState}
              </div>
              {[
                { label: 'Day High', value: selectedQuote.dayHigh ? `₹${selectedQuote.dayHigh.toLocaleString('en-IN')}` : '—' },
                { label: 'Day Low', value: selectedQuote.dayLow ? `₹${selectedQuote.dayLow.toLocaleString('en-IN')}` : '—' },
                { label: 'Volume', value: selectedQuote.volume > 1000000 ? (selectedQuote.volume / 1000000).toFixed(1) + 'M' : selectedQuote.volume > 0 ? (selectedQuote.volume / 1000).toFixed(0) + 'K' : '—' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(37,45,61,0.5)', fontSize: '12px' }}>
                  <span style={{ color: '#8892a4' }}>{item.label}</span>
                  <span style={{ color: '#fff', ...mono, fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
              <a href={`/paper-trading`} style={{ display: 'block', width: '100%', marginTop: '16px', background: '#26a69a', border: 'none', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
                ⚡ Paper Trade {selectedQuote.sym}
              </a>
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