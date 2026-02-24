'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getPortfolio,
  getPortfolioStats,
  placeTrade,
  closeTrade,
  resetPortfolio,
  formatINR,
  type PaperTrade
} from '@/lib/paper-trading'
import { getQuote, searchStocks, type StockQuote, type StockSearchResult } from '@/lib/api'

// ─── Styles ───
const card = {
  background: '#1a1f2e',
  border: '1px solid #252d3d',
  borderRadius: '10px',
  padding: '16px',
}
const label = {
  fontSize: '10px',
  fontWeight: 600 as const,
  letterSpacing: '1px',
  color: '#8892a4',
  textTransform: 'uppercase' as const,
  marginBottom: '8px',
}
const mono = { fontFamily: 'JetBrains Mono, monospace' }
const inputStyle = {
  width: '100%',
  background: '#1e2438',
  border: '1px solid #252d3d',
  borderRadius: '6px',
  padding: '9px 12px',
  color: '#D1D4DC',
  fontSize: '13px',
  ...mono,
  outline: 'none',
}

export default function PaperTradingPage() {
  // ─── State ───
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [symbol, setSymbol] = useState('')
  const [qty, setQty] = useState('10')
  const [product, setProduct] = useState<'MIS' | 'CNC' | 'NRML'>('CNC')
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [trades, setTrades] = useState<PaperTrade[]>([])
  const [stats, setStats] = useState(getPortfolioStats())
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [ordering, setOrdering] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed'>('all')
  const searchRef = useRef<HTMLDivElement>(null)

  // ─── Load trades from localStorage on mount ───
  useEffect(() => {
    const p = getPortfolio()
    setTrades(p.trades)
    setStats(getPortfolioStats())
  }, [])

  // ─── Click outside to close search ───
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ─── Toast helper ───
  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // ─── Search stocks ───
  async function handleSearch(q: string) {
    setSymbol(q)
    if (q.length >= 1) {
      const results = await searchStocks(q)
      setSearchResults(results)
      setShowSearch(true)
    } else {
      setSearchResults([])
      setShowSearch(false)
    }
  }

  // ─── Select stock from search ───
  async function selectStock(sym: string) {
    setSymbol(sym)
    setShowSearch(false)
    setQuoteLoading(true)
    try {
      const q = await getQuote(sym)
      setQuote(q)
    } catch {
      showToast('❌ Could not fetch price for ' + sym, 'err')
      setQuote(null)
    }
    setQuoteLoading(false)
  }

  // ─── Place order ───
  async function handleOrder() {
    if (!symbol.trim()) { showToast('❌ Enter a stock symbol', 'err'); return }

    setOrdering(true)
    try {
      // Fetch latest price
      const q = await getQuote(symbol)
      setQuote(q)

      const quantity = parseInt(qty) || 1
      const trade = placeTrade(symbol, q.name, side, quantity, q.price, product)

      // Refresh state
      const p = getPortfolio()
      setTrades(p.trades)
      setStats(getPortfolioStats())

      showToast(`✅ ${side} ${quantity} × ${symbol} @ ₹${q.price.toLocaleString('en-IN')} — Order executed!`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Order failed'
      showToast(`❌ ${message}`, 'err')
    }
    setOrdering(false)
  }

  // ─── Close trade ───
  async function handleClose(tradeId: string, sym: string) {
    setClosingId(tradeId)
    try {
      const q = await getQuote(sym)
      const trade = closeTrade(tradeId, q.price)

      const p = getPortfolio()
      setTrades(p.trades)
      setStats(getPortfolioStats())

      const pnlStr = trade.pnl !== null ? formatINR(trade.pnl) : '₹0'
      showToast(`✅ ${sym} closed @ ₹${q.price} — P&L: ${pnlStr}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Close failed'
      showToast(`❌ ${message}`, 'err')
    }
    setClosingId(null)
  }

  // ─── Reset ───
  function handleReset() {
    resetPortfolio()
    setTrades([])
    setStats(getPortfolioStats())
    setShowResetModal(false)
    showToast('🔄 Portfolio reset to ₹10,00,000')
  }

  // ─── Filter trades by tab ───
  const filteredTrades = activeTab === 'all'
    ? trades
    : trades.filter(t => t.status === activeTab.toUpperCase())

  // ─── Render ───
  return (
    <div style={{ padding: '24px', maxWidth: '1400px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Paper <span style={{ color: '#f0b429' }}>Trading</span></div>
          <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Practice trading with real market prices · No real money at risk</div>
        </div>
        <div style={{
          background: 'rgba(240,180,41,0.15)', color: '#f0b429',
          border: '1px solid rgba(240,180,41,0.4)', borderRadius: '6px',
          padding: '5px 14px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ width: '8px', height: '8px', background: '#f0b429', borderRadius: '50%', animation: 'pulse-dot 1.5s infinite' }} />
          SIMULATION MODE
        </div>
        <style>{`@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
      </div>

      {/* ─── Stats Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Virtual Capital', value: formatINR(stats.virtualCapital), color: '#8892a4' },
          { label: 'Total P&L', value: (stats.totalPnL >= 0 ? '+' : '') + formatINR(stats.totalPnL), color: stats.totalPnL >= 0 ? '#26a69a' : '#ef5350' },
          { label: 'Win Rate', value: stats.totalTrades > 0 ? `${stats.winRate}%` : '—', color: '#f0b429' },
          { label: 'Total Trades', value: stats.totalTrades.toString(), color: '#2962FF' },
          { label: 'Open Positions', value: stats.openTrades.toString(), color: '#26a69a' },
        ].map(c => (
          <div key={c.label} style={{ ...card, borderTop: `2px solid ${c.color}` }}>
            <div style={label}>{c.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: c.color, ...mono }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* ─── Middle Row: Order Form + Live Price ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '16px', marginBottom: '24px' }}>

        {/* Order Form */}
        <div style={{ ...card, border: '1px solid rgba(240,180,41,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f0b429' }}>⚡ PAPER ORDER</span>
            <span style={{ background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.4)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, color: '#f0b429', letterSpacing: '1px', ...mono }}>PAPER</span>
          </div>

          {/* Buy / Sell Toggle */}
          <div style={{ display: 'flex', background: '#1e2438', borderRadius: '6px', padding: '3px', marginBottom: '14px' }}>
            {(['BUY', 'SELL'] as const).map(s => (
              <button key={s} onClick={() => setSide(s)} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '4px', fontSize: '12px',
                fontWeight: 700, cursor: 'pointer', transition: '.2s',
                background: side === s ? (s === 'BUY' ? '#26a69a' : '#ef5350') : 'transparent',
                color: side === s ? '#fff' : '#8892a4'
              }}>
                {s === 'BUY' ? '▲ BUY' : '▼ SELL'}
              </button>
            ))}
          </div>

          {/* Symbol Search */}
          <div style={{ marginBottom: '12px', position: 'relative' }} ref={searchRef}>
            <div style={label}>Symbol</div>
            <input
              value={symbol}
              onChange={e => handleSearch(e.target.value.toUpperCase())}
              onFocus={() => symbol.length >= 1 && setShowSearch(true)}
              placeholder="Search stock... (e.g. RELIANCE)"
              style={inputStyle}
            />
            {/* Dropdown */}
            {showSearch && searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: '#1e2438', border: '1px solid #2962FF', borderRadius: '0 0 8px 8px',
                maxHeight: '200px', overflowY: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,.5)'
              }}>
                {searchResults.map(s => (
                  <div key={s.symbol}
                    onClick={() => selectStock(s.symbol)}
                    style={{
                      padding: '10px 12px', cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,.05)',
                      transition: '.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#252d3d')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{s.symbol}</div>
                    <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '2px' }}>{s.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product + Qty */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <div style={label}>Product</div>
              <select value={product} onChange={e => setProduct(e.target.value as 'MIS' | 'CNC' | 'NRML')} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="CNC">Delivery (CNC)</option>
                <option value="MIS">Intraday (MIS)</option>
                <option value="NRML">F&O (NRML)</option>
              </select>
            </div>
            <div>
              <div style={label}>Quantity</div>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" style={inputStyle} />
            </div>
          </div>

          {/* Live Price Display */}
          {quoteLoading && (
            <div style={{ padding: '10px', textAlign: 'center', color: '#8892a4', fontSize: '12px' }}>
              Fetching price...
            </div>
          )}
          {quote && !quoteLoading && (
            <div style={{ background: '#131722', borderRadius: '8px', padding: '12px', marginBottom: '12px', border: '1px solid #252d3d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#8892a4' }}>Market Price</span>
                <span style={{ fontSize: '10px', color: quote.marketState === 'REGULAR' ? '#26a69a' : '#f0b429', ...mono }}>
                  {quote.marketState === 'REGULAR' ? '● LIVE' : '● ' + quote.marketState}
                </span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', ...mono, marginTop: '4px' }}>
                ₹{quote.price.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: quote.change >= 0 ? '#26a69a' : '#ef5350', ...mono, marginTop: '2px' }}>
                {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePct >= 0 ? '+' : ''}{quote.changePct.toFixed(2)}%)
              </div>
              {/* Order value */}
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #252d3d', fontSize: '11px', color: '#8892a4' }}>
                Order Value: <span style={{ color: '#fff', fontWeight: 600, ...mono }}>₹{(quote.price * (parseInt(qty) || 0)).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Simulate Button */}
          <button onClick={handleOrder} disabled={ordering} style={{
            width: '100%', padding: '13px', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: 700, cursor: ordering ? 'wait' : 'pointer',
            background: ordering ? '#8a7a2a' : side === 'BUY' ? '#26a69a' : '#ef5350',
            color: '#fff', transition: '.2s', letterSpacing: '0.5px',
            opacity: ordering ? 0.7 : 1,
          }}>
            {ordering ? '⏳ Executing...' : `⚡ ${side} ${symbol || 'Stock'}`}
          </button>

          <div style={{ marginTop: '10px', fontSize: '10px', color: '#8892a4', ...mono, fontStyle: 'italic' }}>
            Orders execute at real-time market price via Yahoo Finance
          </div>
        </div>

        {/* ─── Performance Stats Panel ─── */}
        <div style={card}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>📊 Performance Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
            {[
              { name: 'Total Trades', val: stats.totalTrades.toString(), color: '#D1D4DC' },
              { name: 'Open Positions', val: stats.openTrades.toString(), color: '#2962FF' },
              { name: 'Winning Trades', val: stats.wins.toString(), color: '#26a69a' },
              { name: 'Losing Trades', val: stats.losses.toString(), color: '#ef5350' },
              { name: 'Win Rate', val: stats.totalTrades > 0 ? `${stats.winRate}%` : '—', color: '#f0b429' },
              { name: 'Profit Factor', val: stats.profitFactor > 0 ? stats.profitFactor.toString() : '—', color: '#D1D4DC' },
              { name: 'Avg Profit', val: stats.avgProfit > 0 ? '+' + formatINR(stats.avgProfit) : '—', color: '#26a69a' },
              { name: 'Avg Loss', val: stats.avgLoss < 0 ? formatINR(stats.avgLoss) : '—', color: '#ef5350' },
              { name: 'Best Trade', val: stats.bestTrade > 0 ? '+' + formatINR(stats.bestTrade) : '—', color: '#26a69a' },
              { name: 'Worst Trade', val: stats.worstTrade < 0 ? formatINR(stats.worstTrade) : '—', color: '#ef5350' },
            ].map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <span style={{ fontSize: '12px', color: '#8892a4' }}>{s.name}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: s.color, ...mono }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Trade History ─── */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>📋 Trade History</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['all', 'open', 'closed'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: activeTab === tab ? '#2962FF' : 'transparent',
                border: `1px solid ${activeTab === tab ? '#2962FF' : '#252d3d'}`,
                borderRadius: '5px', color: activeTab === tab ? '#fff' : '#8892a4',
                fontSize: '11px', fontWeight: 600, padding: '5px 14px', cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.5px', transition: '.2s',
              }}>
                {tab} {tab === 'open' ? `(${stats.openTrades})` : tab === 'closed' ? `(${stats.totalTrades})` : ''}
              </button>
            ))}
          </div>
        </div>

        {filteredTrades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892a4' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>No trades yet</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Place your first paper trade above to get started!</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1e2438' }}>
                  {['Date', 'Symbol', 'Side', 'Qty', 'Entry ₹', 'Exit ₹', 'P&L ₹', 'P&L %', 'Status', 'Action'].map(h => (
                    <th key={h} style={{
                      padding: '9px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600,
                      letterSpacing: '0.9px', color: '#8892a4', textTransform: 'uppercase',
                      borderBottom: '1px solid #252d3d', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map(t => {
                  const pnlColor = t.pnl !== null ? (t.pnl >= 0 ? '#26a69a' : '#ef5350') : '#8892a4'
                  const date = new Date(t.createdAt)
                  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ' +
                    date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(37,45,61,0.6)' }}>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: '#8892a4', ...mono }}>{dateStr}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{t.symbol}</div>
                        <div style={{ fontSize: '9px', color: '#8892a4', marginTop: '1px' }}>{t.product}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: t.side === 'BUY' ? '#26a69a' : '#ef5350', fontSize: '12px', ...mono }}>
                        {t.side === 'BUY' ? '▲' : '▼'} {t.side}
                      </td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '13px', color: '#D1D4DC' }}>{t.qty}</td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', color: '#D1D4DC' }}>₹{t.entryPrice.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', color: '#D1D4DC' }}>
                        {t.exitPrice !== null ? `₹${t.exitPrice.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', fontWeight: 600, color: pnlColor }}>
                        {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}${formatINR(t.pnl)}` : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', fontWeight: 600, color: pnlColor }}>
                        {t.pnlPct !== null ? `${t.pnlPct >= 0 ? '+' : ''}${t.pnlPct.toFixed(2)}%` : '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                          background: t.status === 'OPEN' ? 'rgba(41,98,255,.12)' : 'rgba(38,166,154,.12)',
                          color: t.status === 'OPEN' ? '#2962FF' : '#26a69a',
                        }}>{t.status}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {t.status === 'OPEN' && (
                          <button
                            onClick={() => handleClose(t.id, t.symbol)}
                            disabled={closingId === t.id}
                            style={{
                              background: 'rgba(239,83,80,.12)', border: '1px solid rgba(239,83,80,.3)',
                              borderRadius: '5px', color: '#ef5350', fontSize: '11px', fontWeight: 600,
                              padding: '5px 12px', cursor: closingId === t.id ? 'wait' : 'pointer',
                              transition: '.2s', opacity: closingId === t.id ? 0.5 : 1,
                            }}
                          >
                            {closingId === t.id ? '...' : 'Close'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Reset Button ─── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button onClick={() => setShowResetModal(true)} style={{
          background: 'transparent', border: '1px solid #ef5350', borderRadius: '7px',
          color: '#ef5350', fontSize: '13px', fontWeight: 600, padding: '10px 20px',
          cursor: 'pointer', transition: '.2s', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          🔄 Reset Portfolio
        </button>
      </div>

      {/* ─── Reset Modal ─── */}
      {showResetModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowResetModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1e2538', border: '1px solid #252d3d', borderRadius: '12px',
            padding: '28px', maxWidth: '380px', width: '90%', textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>Reset Portfolio?</h3>
            <p style={{ fontSize: '13px', color: '#8892a4', marginBottom: '20px', lineHeight: '1.6' }}>
              This will delete all paper trades and reset your virtual capital to ₹10,00,000. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowResetModal(false)} style={{
                flex: 1, padding: '10px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
                border: 'none', background: '#252d3d', color: '#8892a4', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleReset} style={{
                flex: 1, padding: '10px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
                border: 'none', background: '#ef5350', color: '#fff', cursor: 'pointer',
              }}>Yes, Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 400,
          background: '#1e2538', border: `1px solid ${toast.type === 'err' ? '#ef5350' : '#26a69a'}`,
          borderRadius: '10px', padding: '14px 20px', fontSize: '13px', color: '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          animation: 'slideIn .3s ease-out',
          maxWidth: '400px',
        }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
    </div>
  )
}