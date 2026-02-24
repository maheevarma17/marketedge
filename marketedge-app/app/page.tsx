'use client'
import { useState, useEffect } from 'react'
import { getPortfolio, getPortfolioStats, formatINR, type PaperTrade } from '@/lib/paper-trading'
import { getQuote } from '@/lib/api'
import { useTheme } from '@/lib/theme'

interface HoldingWithPrice {
  symbol: string
  name: string
  qty: number
  avgPrice: number
  ltp: number
  pnl: number
  pnlPct: number
  dayChange: number
  loading: boolean
}

export default function DashboardPage() {
  const { t } = useTheme()
  const [time, setTime] = useState('')
  const [stats, setStats] = useState(getPortfolioStats())
  const [holdings, setHoldings] = useState<HoldingWithPrice[]>([])
  const [loadingHoldings, setLoadingHoldings] = useState(true)
  const [recentTrades, setRecentTrades] = useState<PaperTrade[]>([])

  // Clock
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  // Load portfolio data
  useEffect(() => {
    const portfolio = getPortfolio()
    setStats(getPortfolioStats())
    setRecentTrades(portfolio.trades.slice(0, 5))

    // Get open positions and fetch live prices
    const openTrades = portfolio.trades.filter(t => t.status === 'OPEN')

    // Group by symbol (combine multiple trades of same stock)
    const grouped = new Map<string, { name: string; totalQty: number; totalCost: number }>()
    openTrades.forEach(t => {
      if (t.side === 'BUY') {
        const existing = grouped.get(t.symbol)
        if (existing) {
          existing.totalQty += t.qty
          existing.totalCost += t.entryPrice * t.qty
        } else {
          grouped.set(t.symbol, { name: t.name, totalQty: t.qty, totalCost: t.entryPrice * t.qty })
        }
      }
    })

    if (grouped.size === 0) {
      setLoadingHoldings(false)
      return
    }

    // Fetch prices for all holdings
    const fetchPrices = async () => {
      const results: HoldingWithPrice[] = []
      for (const [symbol, data] of grouped) {
        try {
          const q = await getQuote(symbol)
          const avgPrice = data.totalCost / data.totalQty
          const pnl = (q.price - avgPrice) * data.totalQty
          const pnlPct = ((q.price - avgPrice) / avgPrice) * 100
          results.push({
            symbol,
            name: data.name,
            qty: data.totalQty,
            avgPrice: parseFloat(avgPrice.toFixed(2)),
            ltp: q.price,
            pnl: parseFloat(pnl.toFixed(2)),
            pnlPct: parseFloat(pnlPct.toFixed(2)),
            dayChange: q.changePct,
            loading: false,
          })
        } catch {
          results.push({
            symbol,
            name: data.name,
            qty: data.totalQty,
            avgPrice: parseFloat((data.totalCost / data.totalQty).toFixed(2)),
            ltp: 0,
            pnl: 0,
            pnlPct: 0,
            dayChange: 0,
            loading: false,
          })
        }
      }
      setHoldings(results)
      setLoadingHoldings(false)
    }

    fetchPrices()
  }, [])

  const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }

  const totalUnrealizedPnl = holdings.reduce((s, h) => s + h.pnl, 0)

  const cards = [
    { label: 'Virtual Capital', value: formatINR(stats.virtualCapital), sub: `of ${formatINR(stats.initialCapital)}`, color: t.textDim },
    { label: 'Total P&L (Realized)', value: (stats.totalPnL >= 0 ? '+' : '') + formatINR(stats.totalPnL), sub: `${stats.totalTrades} closed trades`, color: stats.totalPnL >= 0 ? t.green : t.red },
    { label: 'Unrealized P&L', value: holdings.length > 0 ? (totalUnrealizedPnl >= 0 ? '+' : '') + formatINR(totalUnrealizedPnl) : '—', sub: `${holdings.length} open positions`, color: totalUnrealizedPnl >= 0 ? t.green : t.red },
    { label: 'Win Rate', value: stats.totalTrades > 0 ? `${stats.winRate}%` : '—', sub: `${stats.wins}W / ${stats.losses}L`, color: t.yellow },
    { label: 'Open Positions', value: stats.openTrades.toString(), sub: 'active trades', color: t.accent },
  ]

  return (
    <div style={{ padding: '28px', fontFamily: 'Inter, sans-serif' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: t.text, marginBottom: '4px', letterSpacing: '-0.03em' }}>
          Dashboard
        </div>
        <div style={{ fontSize: '13px', color: t.textDim, letterSpacing: '-0.01em' }}>
          MarketEdge Command Center · {time}
        </div>
      </div>

      {/* Quick Access Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: '📈', label: 'Charts', desc: '25+ indicators', href: '/charts' },
          { icon: '🔍', label: 'Screener', desc: '200+ stocks', href: '/screener' },
          { icon: '🧪', label: 'Backtest', desc: '15 strategies', href: '/backtest' },
          { icon: '⚡', label: 'Strategy IDE', desc: 'Write custom', href: '/strategy-ide' },
          { icon: '📊', label: 'Options', desc: 'Greeks & payoff', href: '/options' },
          { icon: '💼', label: 'Paper Trade', desc: 'Live execution', href: '/paper-trading' },
        ].map(card => (
          <a key={card.label} href={card.href} style={{
            background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '16px',
            textDecoration: 'none', display: 'block',
            boxShadow: t.shadow, transition: 'all 0.25s ease', cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = t.glow }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = t.shadow }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>{card.icon}</div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: t.text, letterSpacing: '-0.02em' }}>{card.label}</div>
            <div style={{ fontSize: '11px', color: t.textDim, marginTop: '3px' }}>{card.desc}</div>
          </a>
        ))}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {cards.map(card => (
          <div key={card.label} style={{
            background: t.bgCard, border: `1px solid ${t.border}`,
            borderRadius: '14px', padding: '20px',
            boxShadow: t.shadow,
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', color: t.textDim, textTransform: 'uppercase' as const, marginBottom: '10px' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: t.text, ...mono, marginBottom: '6px', letterSpacing: '-0.02em' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '11.5px', color: t.textDim }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Holdings Table */}
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', marginBottom: '24px', boxShadow: t.shadow }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, letterSpacing: '-0.02em' }}>Open Holdings</div>
          <div style={{ fontSize: '12px', color: t.textDim }}>{holdings.length} positions</div>
        </div>

        {loadingHoldings ? (
          <div style={{ padding: '30px', textAlign: 'center', color: t.textDim, fontSize: '13px' }}>
            Fetching live prices...
          </div>
        ) : holdings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
            <div style={{ fontSize: '13px' }}>No open positions. Go to <a href="/paper-trading" style={{ color: t.accent, textDecoration: 'none', fontWeight: 600 }}>Paper Trading</a> to place your first trade!</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: t.bgInput }}>
                  {['Symbol', 'Qty', 'Avg Price', 'LTP', 'P&L (₹)', 'P&L (%)', 'Day Chg'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.04em', color: t.textDim, textTransform: 'uppercase' as const, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' as const }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <tr key={h.symbol} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: '11px 12px' }}>
                      <div style={{ fontWeight: 600, color: t.text, fontSize: '13px' }}>{h.symbol}</div>
                      <div style={{ fontSize: '10.5px', color: t.textDim, marginTop: '2px' }}>{h.name}</div>
                    </td>
                    <td style={{ padding: '11px 12px', ...mono, fontSize: '13px', color: t.textMuted }}>{h.qty}</td>
                    <td style={{ padding: '11px 12px', ...mono, fontSize: '13px', color: t.textMuted }}>₹{h.avgPrice.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '11px 12px', ...mono, fontSize: '13px', color: t.textMuted }}>₹{h.ltp.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '11px 12px', ...mono, fontSize: '12px', fontWeight: 600, color: h.pnl >= 0 ? t.green : t.red }}>
                      {h.pnl >= 0 ? '+' : ''}₹{Math.abs(h.pnl).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '11px 12px', ...mono, fontSize: '12px', fontWeight: 600, color: h.pnlPct >= 0 ? t.green : t.red }}>
                      {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                    </td>
                    <td style={{ padding: '11px 12px', ...mono, fontSize: '12px', color: h.dayChange >= 0 ? t.green : t.red }}>
                      {h.dayChange >= 0 ? '+' : ''}{h.dayChange.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Trades */}
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: t.shadow }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, letterSpacing: '-0.02em' }}>Recent Trades</div>
          <a href="/paper-trading" style={{ fontSize: '12.5px', color: t.accent, textDecoration: 'none', fontWeight: 500 }}>View All →</a>
        </div>
        {recentTrades.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: t.textDim, fontSize: '13px' }}>
            No trades yet
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: t.bgInput }}>
                  {['Date', 'Symbol', 'Side', 'Qty', 'Entry', 'Status', 'P&L'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.04em', color: t.textDim, textTransform: 'uppercase' as const, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTrades.map(tr => {
                  const date = new Date(tr.createdAt)
                  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                  return (
                    <tr key={tr.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: '10px 12px', fontSize: '11.5px', color: t.textDim, ...mono }}>{dateStr}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: t.text, fontSize: '13px' }}>{tr.symbol}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: tr.side === 'BUY' ? t.green : t.red, fontSize: '12px', ...mono }}>{tr.side}</td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '13px', color: t.textMuted }}>{tr.qty}</td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', color: t.textMuted }}>₹{tr.entryPrice.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 600,
                          background: tr.status === 'OPEN' ? `${t.accent}18` : `${t.green}18`,
                          color: tr.status === 'OPEN' ? t.accent : t.green,
                        }}>{tr.status}</span>
                      </td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', fontWeight: 600, color: tr.pnl !== null ? (tr.pnl >= 0 ? t.green : t.red) : t.textDim }}>
                        {tr.pnl !== null ? `${tr.pnl >= 0 ? '+' : ''}${formatINR(tr.pnl)}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}