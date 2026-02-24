'use client'
import { useState, useEffect } from 'react'
import { getPortfolio, getPortfolioStats, formatINR, type PaperTrade } from '@/lib/paper-trading'
import { getQuote } from '@/lib/api'

interface Holding {
  symbol: string
  name: string
  qty: number
  avgPrice: number
  ltp: number
  currValue: number
  pnl: number
  pnlPct: number
  dayChange: number
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [closedTrades, setClosedTrades] = useState<PaperTrade[]>([])
  const [stats, setStats] = useState(getPortfolioStats())
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'holdings' | 'closed'>('holdings')

  useEffect(() => {
    const portfolio = getPortfolio()
    setStats(getPortfolioStats())
    setClosedTrades(portfolio.trades.filter(t => t.status === 'CLOSED'))

    // Group open BUY trades by symbol
    const openBuys = portfolio.trades.filter(t => t.status === 'OPEN' && t.side === 'BUY')
    const grouped = new Map<string, { name: string; totalQty: number; totalCost: number }>()
    openBuys.forEach(t => {
      const e = grouped.get(t.symbol)
      if (e) { e.totalQty += t.qty; e.totalCost += t.entryPrice * t.qty }
      else { grouped.set(t.symbol, { name: t.name, totalQty: t.qty, totalCost: t.entryPrice * t.qty }) }
    })

    if (grouped.size === 0) { setLoading(false); return }

    async function fetchPrices() {
      const results: Holding[] = []
      for (const [symbol, data] of grouped) {
        try {
          const q = await getQuote(symbol)
          const avg = data.totalCost / data.totalQty
          const currValue = q.price * data.totalQty
          const pnl = currValue - data.totalCost
          results.push({
            symbol, name: data.name, qty: data.totalQty,
            avgPrice: parseFloat(avg.toFixed(2)),
            ltp: q.price,
            currValue: parseFloat(currValue.toFixed(2)),
            pnl: parseFloat(pnl.toFixed(2)),
            pnlPct: parseFloat(((pnl / data.totalCost) * 100).toFixed(2)),
            dayChange: q.changePct,
          })
        } catch {
          const avg = data.totalCost / data.totalQty
          results.push({ symbol, name: data.name, qty: data.totalQty, avgPrice: parseFloat(avg.toFixed(2)), ltp: 0, currValue: 0, pnl: 0, pnlPct: 0, dayChange: 0 })
        }
      }
      setHoldings(results)
      setLoading(false)
    }
    fetchPrices()
  }, [])

  const totalInvested = holdings.reduce((s, h) => s + h.avgPrice * h.qty, 0)
  const totalCurrent = holdings.reduce((s, h) => s + h.currValue, 0)
  const totalUnrealizedPnl = holdings.reduce((s, h) => s + h.pnl, 0)
  const mono = { fontFamily: 'JetBrains Mono, monospace' }

  const cards = [
    { label: 'Total Invested', value: holdings.length > 0 ? formatINR(totalInvested) : '₹0', color: '#8892a4' },
    { label: 'Current Value', value: holdings.length > 0 ? formatINR(totalCurrent) : '₹0', color: '#2962FF' },
    { label: 'Unrealized P&L', value: holdings.length > 0 ? (totalUnrealizedPnl >= 0 ? '+' : '') + formatINR(totalUnrealizedPnl) : '—', color: totalUnrealizedPnl >= 0 ? '#26a69a' : '#ef5350' },
    { label: 'Realized P&L', value: (stats.totalPnL >= 0 ? '+' : '') + formatINR(stats.totalPnL), color: stats.totalPnL >= 0 ? '#26a69a' : '#ef5350' },
    { label: 'Total Stocks', value: holdings.length.toString(), color: '#f0b429' },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Portfolio & P&L</div>
        <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Paper Trading Portfolio · {loading ? 'Fetching...' : 'Live Prices'}</div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', padding: '18px', borderTop: `2px solid ${c.color}` }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', color: '#8892a4', textTransform: 'uppercase', marginBottom: '10px' }}>{c.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: c.color, ...mono }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {(['holdings', 'closed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? '#2962FF' : 'transparent', border: `1px solid ${tab === t ? '#2962FF' : '#252d3d'}`,
            borderRadius: '6px', color: tab === t ? '#fff' : '#8892a4', fontSize: '12px', fontWeight: 600,
            padding: '7px 18px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {t === 'holdings' ? `Holdings (${holdings.length})` : `Closed Trades (${closedTrades.length})`}
          </button>
        ))}
      </div>

      {/* Holdings Table */}
      <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
        {tab === 'holdings' ? (
          loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8892a4' }}>Fetching live prices...</div>
          ) : holdings.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8892a4' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
              <div>No open holdings. <a href="/paper-trading" style={{ color: '#2962FF', textDecoration: 'none', fontWeight: 600 }}>Place a paper trade</a> to get started.</div>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1e2438' }}>
                      {['Symbol', 'Qty', 'Avg Price', 'LTP', 'Curr Value', 'P&L (₹)', 'P&L (%)', 'Day Chg'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, letterSpacing: '0.9px', color: '#8892a4', textTransform: 'uppercase', borderBottom: '1px solid #252d3d', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map(h => (
                      <tr key={h.symbol} style={{ borderBottom: '1px solid rgba(37,45,61,0.6)' }}>
                        <td style={{ padding: '11px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{h.symbol}</div>
                          <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '2px' }}>{h.name}</div>
                        </td>
                        <td style={{ padding: '11px 12px', ...mono, fontSize: '13px', color: '#D1D4DC' }}>{h.qty}</td>
                        <td style={{ padding: '11px 12px', ...mono, fontSize: '13px', color: '#D1D4DC' }}>₹{h.avgPrice.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '11px 12px', ...mono, fontSize: '13px', color: '#D1D4DC' }}>₹{h.ltp.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '11px 12px', ...mono, fontSize: '13px', color: '#D1D4DC' }}>₹{h.currValue.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '11px 12px', ...mono, fontSize: '12px', fontWeight: 600, color: h.pnl >= 0 ? '#26a69a' : '#ef5350' }}>
                          {h.pnl >= 0 ? '+' : ''}₹{Math.abs(h.pnl).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '11px 12px', ...mono, fontSize: '12px', fontWeight: 600, color: h.pnlPct >= 0 ? '#26a69a' : '#ef5350' }}>
                          {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                        </td>
                        <td style={{ padding: '11px 12px', ...mono, fontSize: '12px', color: h.dayChange >= 0 ? '#26a69a' : '#ef5350' }}>
                          {h.dayChange >= 0 ? '+' : ''}{h.dayChange.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 18px', background: '#1e2438', borderTop: '1px solid #252d3d', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div><div style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invested</div><div style={{ fontSize: '14px', fontWeight: 700, ...mono, color: '#fff' }}>{formatINR(totalInvested)}</div></div>
                <div><div style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current</div><div style={{ fontSize: '14px', fontWeight: 700, ...mono, color: '#fff' }}>{formatINR(totalCurrent)}</div></div>
                <div><div style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>P&L</div><div style={{ fontSize: '14px', fontWeight: 700, ...mono, color: totalUnrealizedPnl >= 0 ? '#26a69a' : '#ef5350' }}>{totalUnrealizedPnl >= 0 ? '+' : ''}{formatINR(totalUnrealizedPnl)}</div></div>
              </div>
            </>
          )
        ) : (
          closedTrades.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8892a4' }}>No closed trades yet</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1e2438' }}>
                    {['Date', 'Symbol', 'Side', 'Qty', 'Entry', 'Exit', 'P&L (₹)', 'P&L (%)'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, letterSpacing: '0.9px', color: '#8892a4', textTransform: 'uppercase', borderBottom: '1px solid #252d3d', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {closedTrades.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(37,45,61,0.6)' }}>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: '#8892a4', ...mono }}>{new Date(t.closedAt || t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#fff', fontSize: '13px' }}>{t.symbol}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: t.side === 'BUY' ? '#26a69a' : '#ef5350', fontSize: '12px', ...mono }}>{t.side}</td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '13px', color: '#D1D4DC' }}>{t.qty}</td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', color: '#D1D4DC' }}>₹{t.entryPrice.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', color: '#D1D4DC' }}>₹{t.exitPrice?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', fontWeight: 600, color: (t.pnl || 0) >= 0 ? '#26a69a' : '#ef5350' }}>
                        {(t.pnl || 0) >= 0 ? '+' : ''}{formatINR(t.pnl || 0)}
                      </td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', fontWeight: 600, color: (t.pnlPct || 0) >= 0 ? '#26a69a' : '#ef5350' }}>
                        {(t.pnlPct || 0) >= 0 ? '+' : ''}{(t.pnlPct || 0).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}