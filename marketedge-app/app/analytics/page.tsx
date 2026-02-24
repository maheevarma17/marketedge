'use client'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/lib/theme'
import { formatINR } from '@/lib/paper-trading'
import {
    calculateDailyReturns,
    calculateDrawdown,
    calculateSectorAllocation,
    calculateMonthlyReturns,
    calculateRiskMetrics,
    type RiskMetrics,
    type DailyReturn,
    type SectorAllocation,
    type MonthlyReturn,
} from '@/lib/portfolio-analytics'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SECTOR_COLORS = ['#6383ff', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#60a5fa', '#f472b6', '#fb923c', '#22d3ee', '#a3e635']

export default function AnalyticsPage() {
    const { t } = useTheme()
    const [metrics, setMetrics] = useState<RiskMetrics | null>(null)
    const [dailyReturns, setDailyReturns] = useState<DailyReturn[]>([])
    const [sectors, setSectors] = useState<SectorAllocation[]>([])
    const [monthlyReturns, setMonthlyReturns] = useState<MonthlyReturn[]>([])
    const [tab, setTab] = useState<'overview' | 'returns' | 'risk'>('overview')
    const chartRef = useRef<HTMLDivElement>(null)
    const donutRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const m = calculateRiskMetrics()
        setMetrics(m)
        const dr = calculateDailyReturns(m.totalReturn > 0 ? 1000000 : 1000000)
        setDailyReturns(dr)
        setSectors(calculateSectorAllocation())
        setMonthlyReturns(calculateMonthlyReturns())
    }, [])

    // Draw equity curve
    useEffect(() => {
        if (!chartRef.current || dailyReturns.length === 0) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let chart: any = null
        import('lightweight-charts').then(({ createChart, ColorType }) => {
            if (!chartRef.current) return
            chartRef.current.innerHTML = ''
            chart = createChart(chartRef.current, {
                width: chartRef.current.clientWidth,
                height: 260,
                layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: t.textDim, fontSize: 11 },
                grid: { vertLines: { color: `${t.border}` }, horzLines: { color: `${t.border}` } },
                rightPriceScale: { borderColor: t.border },
                timeScale: { borderColor: t.border, timeVisible: false },
                crosshair: { mode: 0 },
            })
            const isUp = dailyReturns[dailyReturns.length - 1]?.cumulative >= 0
            const series = chart.addAreaSeries({
                lineColor: isUp ? t.green : t.red,
                topColor: isUp ? `${t.green}40` : `${t.red}40`,
                bottomColor: isUp ? `${t.green}05` : `${t.red}05`,
                lineWidth: 2,
            })
            series.setData(dailyReturns.map(d => ({ time: d.date as string, value: d.portfolioValue })))
            chart.timeScale().fitContent()
        })
        return () => { if (chart) chart.remove() }
    }, [dailyReturns, t])

    // Draw donut chart
    useEffect(() => {
        if (!donutRef.current || sectors.length === 0) return
        const ctx = donutRef.current.getContext('2d')
        if (!ctx) return
        const w = 200, h = 200, cx = w / 2, cy = h / 2, r = 70, ir = 45
        donutRef.current.width = w; donutRef.current.height = h
        let startAngle = -Math.PI / 2
        sectors.forEach((s, i) => {
            const angle = (s.percentage / 100) * Math.PI * 2
            ctx.beginPath()
            ctx.arc(cx, cy, r, startAngle, startAngle + angle)
            ctx.arc(cx, cy, ir, startAngle + angle, startAngle, true)
            ctx.closePath()
            ctx.fillStyle = SECTOR_COLORS[i % SECTOR_COLORS.length]
            ctx.fill()
            startAngle += angle
        })
        ctx.fillStyle = t.text
        ctx.font = '700 16px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${sectors.length}`, cx, cy - 4)
        ctx.font = '400 10px Inter, sans-serif'
        ctx.fillStyle = t.textDim
        ctx.fillText('Sectors', cx, cy + 12)
    }, [sectors, t])

    const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }
    const card: React.CSSProperties = { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: t.shadow }

    if (!metrics) return <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>Loading analytics...</div>

    const riskCards = [
        { label: 'Total Return', value: formatINR(metrics.totalReturn), sub: `${metrics.totalReturnPct >= 0 ? '+' : ''}${metrics.totalReturnPct}%`, color: metrics.totalReturn >= 0 ? t.green : t.red },
        { label: 'Sharpe Ratio', value: metrics.sharpeRatio.toFixed(2), sub: 'Risk-adjusted return', color: metrics.sharpeRatio > 1 ? t.green : metrics.sharpeRatio > 0 ? t.yellow : t.red },
        { label: 'Max Drawdown', value: `${metrics.maxDrawdownPct}%`, sub: formatINR(metrics.maxDrawdown), color: t.red },
        { label: 'Win Rate', value: `${metrics.winRate}%`, sub: `${metrics.totalTrades} trades`, color: metrics.winRate > 50 ? t.green : t.yellow },
        { label: 'Sortino Ratio', value: metrics.sortinoRatio.toFixed(2), sub: 'Downside-adjusted', color: metrics.sortinoRatio > 1 ? t.green : t.yellow },
        { label: 'Profit Factor', value: metrics.profitFactor.toFixed(2), sub: `Win: ${formatINR(metrics.avgWin)}`, color: metrics.profitFactor > 1 ? t.green : t.red },
        { label: 'Volatility', value: `${metrics.volatility}%`, sub: 'Annualized', color: t.accent },
        { label: 'Calmar Ratio', value: metrics.calmarRatio.toFixed(2), sub: 'Return / Drawdown', color: metrics.calmarRatio > 1 ? t.green : t.yellow },
    ]

    return (
        <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: t.text, letterSpacing: '-0.03em' }}>
                    Portfolio Analytics
                </div>
                <div style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>
                    Risk metrics · Equity curve · Sector allocation · Performance breakdown
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                {(['overview', 'returns', 'risk'] as const).map(t2 => (
                    <button key={t2} onClick={() => setTab(t2)} style={{
                        padding: '7px 16px', borderRadius: '8px', border: 'none', fontSize: '12.5px', fontWeight: 600,
                        cursor: 'pointer', background: tab === t2 ? t.accent : t.bgInput, color: tab === t2 ? '#fff' : t.textDim,
                        transition: 'all 0.2s ease',
                    }}>{t2 === 'overview' ? '📊 Overview' : t2 === 'returns' ? '📈 Returns' : '⚠️ Risk'}</button>
                ))}
            </div>

            {/* Risk Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {riskCards.map(c => (
                    <div key={c.label} style={card}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '8px' }}>{c.label}</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: c.color, ...mono, letterSpacing: '-0.02em' }}>{c.value}</div>
                        <div style={{ fontSize: '11px', color: t.textDim, marginTop: '4px' }}>{c.sub}</div>
                    </div>
                ))}
            </div>

            {/* Equity Curve */}
            {tab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '16px', marginBottom: '24px' }}>
                    <div style={card}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '12px' }}>Equity Curve</div>
                        {dailyReturns.length > 0 ? (
                            <div ref={chartRef} style={{ width: '100%', height: '260px' }} />
                        ) : (
                            <div style={{ padding: '60px 0', textAlign: 'center', color: t.textDim, fontSize: '13px' }}>
                                Close some trades to see your equity curve
                            </div>
                        )}
                    </div>
                    <div style={card}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Sector Allocation</div>
                        {sectors.length > 0 ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                    <canvas ref={donutRef} width={200} height={200} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {sectors.map((s, i) => (
                                        <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: SECTOR_COLORS[i % SECTOR_COLORS.length], flexShrink: 0 }} />
                                            <span style={{ color: t.textMuted, flex: 1 }}>{s.sector}</span>
                                            <span style={{ color: t.text, fontWeight: 600, ...mono }}>{s.percentage.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '40px 0', textAlign: 'center', color: t.textDim, fontSize: '12px' }}>No open positions</div>
                        )}
                    </div>
                </div>
            )}

            {/* Monthly Returns Heatmap */}
            {tab === 'returns' && (
                <div style={card}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Monthly Returns Heatmap</div>
                    {monthlyReturns.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(12, 1fr)`, gap: '4px' }}>
                                <div />
                                {MONTHS.map(m => (
                                    <div key={m} style={{ fontSize: '10px', color: t.textDim, textAlign: 'center', fontWeight: 600 }}>{m}</div>
                                ))}
                                {Array.from(new Set(monthlyReturns.map(r => r.year))).map(year => (
                                    <>
                                        <div key={`y-${year}`} style={{ fontSize: '11px', color: t.textDim, ...mono, fontWeight: 600, display: 'flex', alignItems: 'center' }}>{year}</div>
                                        {Array.from({ length: 12 }, (_, m) => {
                                            const entry = monthlyReturns.find(r => r.year === year && r.month === m)
                                            if (!entry) return <div key={`${year}-${m}`} style={{ padding: '10px', borderRadius: '6px', background: t.bgInput, textAlign: 'center', fontSize: '10px', color: t.textDim }}>—</div>
                                            const intensity = Math.min(Math.abs(entry.pnl) / 50000, 1)
                                            return (
                                                <div key={`${year}-${m}`} style={{
                                                    padding: '8px 4px', borderRadius: '6px', textAlign: 'center',
                                                    background: entry.pnl >= 0 ? `rgba(52,211,153,${0.1 + intensity * 0.5})` : `rgba(248,113,113,${0.1 + intensity * 0.5})`,
                                                    fontSize: '10px', fontWeight: 600, color: '#fff', ...mono,
                                                }}>
                                                    {entry.pnl >= 0 ? '+' : ''}{(entry.pnl / 1000).toFixed(0)}K
                                                </div>
                                            )
                                        })}
                                    </>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>Close trades to see monthly returns</div>
                    )}
                </div>
            )}

            {/* Risk Detail */}
            {tab === 'risk' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={card}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Win/Loss Breakdown</div>
                        {[
                            { label: 'Average Win', value: formatINR(metrics.avgWin), color: t.green },
                            { label: 'Average Loss', value: formatINR(metrics.avgLoss), color: t.red },
                            { label: 'Largest Win', value: formatINR(metrics.largestWin), color: t.green },
                            { label: 'Largest Loss', value: formatINR(metrics.largestLoss), color: t.red },
                            { label: 'Consecutive Wins', value: metrics.consecutiveWins.toString(), color: t.green },
                            { label: 'Consecutive Losses', value: metrics.consecutiveLosses.toString(), color: t.red },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
                                <span style={{ fontSize: '12.5px', color: t.textDim }}>{row.label}</span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: row.color, ...mono }}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                    <div style={card}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Trading Summary</div>
                        {[
                            { label: 'Total Trades', value: metrics.totalTrades.toString() },
                            { label: 'Avg Holding Period', value: `${metrics.avgHoldingDays} days` },
                            { label: 'Annualized Volatility', value: `${metrics.volatility}%` },
                            { label: 'Avg Daily Return', value: `${metrics.avgDailyReturn}%` },
                            { label: 'Total P&L', value: formatINR(metrics.totalReturn) },
                            { label: 'Return on Capital', value: `${metrics.totalReturnPct}%` },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
                                <span style={{ fontSize: '12.5px', color: t.textDim }}>{row.label}</span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: t.text, ...mono }}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
