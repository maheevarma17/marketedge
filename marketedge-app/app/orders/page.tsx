'use client'
import { useState, useRef, useEffect } from 'react'
import { getPortfolio, placeTrade, formatINR } from '@/lib/paper-trading'
import { getQuote, searchStocks, type StockQuote, type StockSearchResult } from '@/lib/api'

export default function OrdersPage() {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [orderType, setOrderType] = useState('MARKET')
  const [symbol, setSymbol] = useState('')
  const [qty, setQty] = useState('10')
  const [product, setProduct] = useState('CNC')
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [orderHistory, setOrderHistory] = useState<Array<{
    id: string; sym: string; side: string; qty: number; price: number; time: string; status: string
  }>>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Load order history from paper trades
  useEffect(() => {
    const p = getPortfolio()
    const recent = p.trades.slice(0, 10).map(t => ({
      id: t.id.slice(0, 8).toUpperCase(),
      sym: t.symbol,
      side: t.side,
      qty: t.qty,
      price: t.entryPrice,
      time: new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: t.status === 'OPEN' ? 'COMPLETE' : 'COMPLETE',
    }))
    setOrderHistory(recent)
  }, [])

  // Click outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleSearch(q: string) {
    setSymbol(q)
    if (q.length >= 1) {
      const r = await searchStocks(q)
      setSearchResults(r)
      setShowSearch(true)
    } else { setSearchResults([]); setShowSearch(false) }
  }

  async function selectStock(sym: string) {
    setSymbol(sym)
    setShowSearch(false)
    setQuoteLoading(true)
    try { const q = await getQuote(sym); setQuote(q) } catch { setQuote(null) }
    setQuoteLoading(false)
  }

  async function handleSubmit() {
    if (!symbol.trim()) { setToast('❌ Enter a symbol'); setTimeout(() => setToast(null), 3000); return }
    setOrdering(true)
    try {
      const q = await getQuote(symbol)
      setQuote(q)
      const quantity = parseInt(qty) || 1
      placeTrade(symbol, q.name, side, quantity, q.price, product as 'CNC' | 'MIS' | 'NRML')

      // Update order history
      const p = getPortfolio()
      const recent = p.trades.slice(0, 10).map(t => ({
        id: t.id.slice(0, 8).toUpperCase(), sym: t.symbol, side: t.side, qty: t.qty,
        price: t.entryPrice, time: new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETE',
      }))
      setOrderHistory(recent)

      setToast(`✅ ${side} ${quantity} × ${symbol} @ ₹${q.price.toLocaleString('en-IN')}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Order failed'
      setToast(`❌ ${msg}`)
    }
    setOrdering(false)
    setTimeout(() => setToast(null), 3500)
  }

  const mono = { fontFamily: 'JetBrains Mono, monospace' }
  const inputStyle = { width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '9px 12px', color: '#D1D4DC', fontSize: '13px', ...mono, outline: 'none' }

  const statusColor: Record<string, string> = { COMPLETE: '#26a69a', PENDING: '#f0b429', CANCELLED: '#ef5350' }
  const statusBg: Record<string, string> = { COMPLETE: 'rgba(38,166,154,0.12)', PENDING: 'rgba(240,180,41,0.12)', CANCELLED: 'rgba(239,83,80,0.12)' }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Order Placement</div>
        <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Place paper orders with real market prices</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '16px' }}>
        {/* Order Form */}
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>New Order</div>

          {/* Buy/Sell */}
          <div style={{ display: 'flex', background: '#1e2438', borderRadius: '6px', padding: '3px', marginBottom: '16px' }}>
            {(['BUY', 'SELL'] as const).map(s => (
              <button key={s} onClick={() => setSide(s)} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '4px', fontSize: '12px',
                fontWeight: 700, cursor: 'pointer', transition: '0.2s',
                background: side === s ? (s === 'BUY' ? '#26a69a' : '#ef5350') : 'transparent',
                color: side === s ? '#fff' : '#8892a4'
              }}>{s === 'BUY' ? '▲ BUY' : '▼ SELL'}</button>
            ))}
          </div>

          {/* Symbol search */}
          <div style={{ marginBottom: '12px', position: 'relative' }} ref={searchRef}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px', letterSpacing: '0.5px' }}>SYMBOL</div>
            <input value={symbol} onChange={e => handleSearch(e.target.value.toUpperCase())}
              onFocus={() => symbol.length >= 1 && setShowSearch(true)}
              placeholder="Search stock..." style={inputStyle} />
            {showSearch && searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#1e2438', border: '1px solid #2962FF', borderRadius: '0 0 8px 8px', maxHeight: '180px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
                {searchResults.map(s => (
                  <div key={s.symbol} onClick={() => selectStock(s.symbol)}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#252d3d')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '12px' }}>{s.symbol}</div>
                    <div style={{ fontSize: '10px', color: '#8892a4' }}>{s.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product + Order Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px' }}>PRODUCT</div>
              <select value={product} onChange={e => setProduct(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="CNC">Delivery (CNC)</option>
                <option value="MIS">Intraday (MIS)</option>
                <option value="NRML">F&O (NRML)</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px' }}>ORDER TYPE</div>
              <select value={orderType} onChange={e => setOrderType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="MARKET">Market</option>
                <option value="LIMIT">Limit</option>
              </select>
            </div>
          </div>

          {/* Qty */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px' }}>QUANTITY</div>
            <input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" style={inputStyle} />
          </div>

          {/* Live price */}
          {quoteLoading && <div style={{ padding: '8px', textAlign: 'center', color: '#8892a4', fontSize: '12px' }}>Loading price...</div>}
          {quote && !quoteLoading && (
            <div style={{ background: '#131722', borderRadius: '8px', padding: '10px', marginBottom: '12px', border: '1px solid #252d3d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#8892a4' }}>Market Price</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', ...mono }}>₹{quote.price.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#8892a4', marginTop: '4px' }}>
                Order Value: <span style={{ color: '#fff', fontWeight: 600 }}>₹{(quote.price * (parseInt(qty) || 0)).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={ordering} style={{
            width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: 700, cursor: ordering ? 'wait' : 'pointer',
            background: side === 'BUY' ? '#26a69a' : '#ef5350', color: '#fff',
            opacity: ordering ? 0.7 : 1,
          }}>
            {ordering ? '⏳ Executing...' : `${side === 'BUY' ? '▲' : '▼'} Place ${side} Order`}
          </button>
        </div>

        {/* Order Book */}
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Order Book — Recent</div>
          </div>
          {orderHistory.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8892a4', fontSize: '13px' }}>No orders yet. Place your first order!</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1e2438' }}>
                    {['Order ID', 'Symbol', 'Side', 'Qty', 'Price', 'Time', 'Status'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 600, letterSpacing: '0.9px', color: '#8892a4', textTransform: 'uppercase', borderBottom: '1px solid #252d3d', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(37,45,61,0.6)' }}>
                      <td style={{ padding: '11px 14px', ...mono, fontSize: '11px', color: '#8892a4' }}>{o.id}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: '#fff', fontSize: '13px' }}>{o.sym}</td>
                      <td style={{ padding: '11px 14px', ...mono, fontSize: '12px', fontWeight: 700, color: o.side === 'BUY' ? '#26a69a' : '#ef5350' }}>{o.side}</td>
                      <td style={{ padding: '11px 14px', ...mono, fontSize: '13px', color: '#D1D4DC' }}>{o.qty}</td>
                      <td style={{ padding: '11px 14px', ...mono, fontSize: '13px', color: '#D1D4DC' }}>₹{o.price.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '11px 14px', ...mono, fontSize: '11px', color: '#8892a4' }}>{o.time}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: statusBg[o.status] || statusBg.COMPLETE, color: statusColor[o.status] || statusColor.COMPLETE, borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 400, background: '#1e2538', border: '1px solid #26a69a', borderRadius: '10px', padding: '14px 20px', fontSize: '13px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,.5)', animation: 'slideIn .3s ease-out' }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
    </div>
  )
}