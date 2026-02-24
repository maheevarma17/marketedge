'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { searchStocks, type StockSearchResult } from '@/lib/api'
import { runBacktest, STRATEGIES, type StrategyName, type BacktestResult, type Candle } from '@/lib/backtesting'
import { formatINR } from '@/lib/paper-trading'

const RANGES = [
    { value: '1y', label: '1 Year' },
    { value: '2y', label: '2 Years' },
    { value: '5y', label: '5 Years' },
    { value: '10y', label: '10 Years' },
    { value: 'max', label: 'Max (All)' },
]

const CATEGORIES = ['all', 'trend', 'momentum', 'reversal', 'breakout', 'combined'] as const

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function BacktestPage() {
    const [symbol, setSymbol] = useState('RELIANCE')
    const [strategy, setStrategy] = useState<StrategyName>('rsi_oversold')
    const [range, setRange] = useState('5y')
    const [capital, setCapital] = useState('1000000')
    const [posSize, setPosSize] = useState('10')
    const [search, setSearch] = useState('')
    const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
    const [showSearch, setShowSearch] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<BacktestResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]>('all')
    const [compareMode, setCompareMode] = useState(false)
    const [compareResults, setCompareResults] = useState<BacktestResult[]>([])
    const [activeTab, setActiveTab] = useState<'equity' | 'monthly' | 'trades' | 'distribution'>('equity')
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<unknown>(null)
    const searchRef = useRef<HTMLDivElement>(null)

    // Click outside
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    // Draw equity curve with lightweight-charts
    useEffect(() => {
        if (!result || !chartContainerRef.current) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let chart: any = null

        import('lightweight-charts').then(({ createChart, ColorType }) => {
            if (!chartContainerRef.current) return
            chartContainerRef.current.innerHTML = ''

            chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 300,
                layout: { background: { type: ColorType.Solid, color: '#141821' }, textColor: '#8892a4', fontSize: 11 },
                grid: { vertLines: { color: '#1e2438' }, horzLines: { color: '#1e2438' } },
                crosshair: { mode: 0 },
                rightPriceScale: { borderColor: '#252d3d' },
                timeScale: { borderColor: '#252d3d', timeVisible: false },
            })

            const isProfit = result.totalReturn >= 0

            const areaSeries = chart.addAreaSeries({
                lineColor: isProfit ? '#26a69a' : '#ef5350',
                topColor: isProfit ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)',
                bottomColor: isProfit ? 'rgba(38,166,154,0.02)' : 'rgba(239,83,80,0.02)',
                lineWidth: 2,
            })

            const data = result.equityCurve.map(c => ({
                time: c.date as string,
                value: c.equity,
            }))
            areaSeries.setData(data)

            // Initial capital line
            const baselineSeries = chart.addLineSeries({
                color: 'rgba(255,255,255,0.15)',
                lineWidth: 1,
                lineStyle: 2,
                crosshairMarkerVisible: false,
            })
            baselineSeries.setData([
                { time: data[0]?.time, value: result.initialCapital },
                { time: data[data.length - 1]?.time, value: result.initialCapital },
            ])

            chart.timeScale().fitContent()
            chartRef.current = chart
        })

        const handleResize = () => {
            if (chart && chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth })
            }
        }
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            if (chart) chart.remove()
        }
    }, [result])

    const getMonthlyReturns = useCallback(() => {
        if (!result) return []
        const monthly: Record<string, Record<string, number>> = {}
        const curve = result.equityCurve

        for (let i = 1; i < curve.length; i++) {
            const date = new Date(curve[i].date)
            const year = date.getFullYear().toString()
            const month = date.getMonth()
            if (!monthly[year]) monthly[year] = {}
            monthly[year][month] = ((curve[i].equity - curve[i - 1].equity) / curve[i - 1].equity) * 100
        }

        // Aggregate daily returns into monthly
        const aggregated: Record<string, Record<number, number>> = {}
        for (const [year, months] of Object.entries(monthly)) {
            aggregated[year] = {}
            for (const [m, ret] of Object.entries(months)) {
                const mi = parseInt(m)
                aggregated[year][mi] = (aggregated[year][mi] || 0) + ret
            }
        }

        return Object.entries(aggregated).map(([year, months]) => ({
            year,
            months: Array.from({ length: 12 }, (_, i) => months[i] !== undefined ? parseFloat(months[i].toFixed(2)) : null),
            total: Object.values(months).reduce((a, b) => a + b, 0),
        })).sort((a, b) => parseInt(a.year) - parseInt(b.year))
    }, [result])

    const getPnLDistribution = useCallback(() => {
        if (!result || result.trades.length === 0) return []
        const pnls = result.trades.map(t => t.pnlPct)
        const min = Math.floor(Math.min(...pnls) / 5) * 5
        const max = Math.ceil(Math.max(...pnls) / 5) * 5
        const buckets: { range: string; count: number; isPositive: boolean }[] = []

        for (let i = min; i < max; i += 5) {
            const count = pnls.filter(p => p >= i && p < i + 5).length
            buckets.push({ range: `${i}% to ${i + 5}%`, count, isPositive: i >= 0 })
        }
        return buckets
    }, [result])

    async function handleSearch(q: string) {
        setSearch(q)
        if (q.length >= 1) {
            const r = await searchStocks(q)
            setSearchResults(r)
            setShowSearch(true)
        } else { setSearchResults([]); setShowSearch(false) }
    }

    function selectStock(sym: string) {
        setSymbol(sym)
        setSearch('')
        setShowSearch(false)
    }

    async function runTest() {
        setLoading(true)
        setError(null)
        setResult(null)
        setCompareResults([])

        try {
            const res = await fetch(`/api/market/history/${encodeURIComponent(symbol)}?range=${range}&interval=1d`)
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            if (!data.candles || data.candles.length < 50) throw new Error('Not enough data (need 50+ candles)')

            if (compareMode) {
                // Run all strategies
                const results: BacktestResult[] = []
                for (const s of STRATEGIES) {
                    try {
                        const r = runBacktest(data.candles as Candle[], s.id, parseInt(capital) || 1000000, parseInt(posSize) || 10)
                        r.symbol = symbol
                        r.period = range
                        results.push(r)
                    } catch { /* skip failed */ }
                }
                results.sort((a, b) => b.totalReturnPct - a.totalReturnPct)
                setCompareResults(results)
                if (results.length > 0) setResult(results[0])
            } else {
                const r = runBacktest(data.candles as Candle[], strategy, parseInt(capital) || 1000000, parseInt(posSize) || 10)
                r.symbol = symbol
                r.period = range
                setResult(r)
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Backtest failed')
        }
        setLoading(false)
    }

    const filteredStrategies = activeCategory === 'all' ? STRATEGIES : STRATEGIES.filter(s => s.category === activeCategory)
    const distributionData = getPnLDistribution()
    const monthlyData = getMonthlyReturns()
    const maxDistCount = Math.max(...distributionData.map(d => d.count), 1)

    const mono = { fontFamily: 'JetBrains Mono, monospace' }
    const inputStyle: React.CSSProperties = { width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '8px 10px', color: '#D1D4DC', fontSize: '12px', ...mono, outline: 'none' }
    const labelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 600, color: '#8892a4', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '5px' }

    return (
        <div style={{ padding: '24px', maxWidth: '1400px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>
                        Strategy <span style={{ color: '#f0b429' }}>Backtester</span>
                        <span style={{ fontSize: '11px', background: '#2962FF', color: '#fff', padding: '2px 8px', borderRadius: '4px', marginLeft: '10px', fontWeight: 600 }}>PRO</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>
                        15 strategies · 10 years of data · Multi-strategy comparison
                    </div>
                </div>
                <button
                    onClick={() => setCompareMode(!compareMode)}
                    style={{
                        background: compareMode ? '#2962FF' : 'transparent',
                        border: `1px solid ${compareMode ? '#2962FF' : '#252d3d'}`,
                        borderRadius: '8px', padding: '8px 16px', color: '#fff',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', ...mono,
                    }}
                >
                    {compareMode ? '📊 Compare Mode ON' : '📊 Compare All'}
                </button>
            </div>

            {/* ─── Category Tabs ─── */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto' }}>
                {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                        cursor: 'pointer', border: 'none', textTransform: 'capitalize', whiteSpace: 'nowrap',
                        background: activeCategory === cat ? '#2962FF' : '#1e2438',
                        color: activeCategory === cat ? '#fff' : '#8892a4',
                    }}>
                        {cat === 'all' ? '🎯 All' : cat === 'trend' ? '📈 Trend' : cat === 'momentum' ? '⚡ Momentum' :
                            cat === 'reversal' ? '🔄 Reversal' : cat === 'breakout' ? '💥 Breakout' : '🧬 Combined'}
                    </button>
                ))}
            </div>

            {/* ─── Config Panel ─── */}
            <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'end' }}>
                    {/* Symbol */}
                    <div style={{ position: 'relative' }} ref={searchRef}>
                        <div style={labelStyle}>Stock Symbol</div>
                        <input
                            value={search || symbol}
                            onChange={e => handleSearch(e.target.value.toUpperCase())}
                            onFocus={() => { setSearch(symbol); search.length >= 1 && setShowSearch(true) }}
                            style={inputStyle}
                            placeholder="e.g. RELIANCE"
                        />
                        {showSearch && searchResults.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#1e2438', border: '1px solid #2962FF', borderRadius: '0 0 8px 8px', maxHeight: '180px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
                                {searchResults.map(s => (
                                    <div key={s.symbol} onClick={() => selectStock(s.symbol)}
                                        style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.05)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#252d3d')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '12px' }}>{s.symbol}</span>
                                        <span style={{ fontSize: '10px', color: '#8892a4', marginLeft: '8px' }}>{s.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Strategy */}
                    {!compareMode && (
                        <div>
                            <div style={labelStyle}>Strategy</div>
                            <select value={strategy} onChange={e => setStrategy(e.target.value as StrategyName)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                {filteredStrategies.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Period */}
                    <div>
                        <div style={labelStyle}>Period</div>
                        <select value={range} onChange={e => setRange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                            {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    {/* Capital */}
                    <div>
                        <div style={labelStyle}>Capital (₹)</div>
                        <input type="number" value={capital} onChange={e => setCapital(e.target.value)} style={inputStyle} />
                    </div>

                    {/* Position Size */}
                    <div>
                        <div style={labelStyle}>Position (%)</div>
                        <input type="number" value={posSize} onChange={e => setPosSize(e.target.value)} min="1" max="100" style={inputStyle} />
                    </div>

                    {/* Run Button */}
                    <button onClick={runTest} disabled={loading} style={{
                        background: loading ? '#8a7a2a' : 'linear-gradient(135deg, #f0b429, #e09b1c)', border: 'none', borderRadius: '8px',
                        color: '#000', padding: '10px 24px', fontSize: '13px', fontWeight: 700,
                        cursor: loading ? 'wait' : 'pointer', height: '38px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        boxShadow: loading ? 'none' : '0 4px 15px rgba(240,180,41,0.3)',
                    }}>
                        {loading ? '⏳ Running...' : compareMode ? '🔥 Compare All' : '🚀 Run Backtest'}
                    </button>
                </div>

                {!compareMode && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#8892a4', ...mono }}>
                            📋 {STRATEGIES.find(s => s.id === strategy)?.description}
                        </span>
                        <span style={{
                            fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                            background: '#1e2438', border: '1px solid #252d3d',
                            color: STRATEGIES.find(s => s.id === strategy)?.style === 'intraday' ? '#f0b429' : STRATEGIES.find(s => s.id === strategy)?.style === 'positional' ? '#2962FF' : '#26a69a',
                            fontWeight: 600, textTransform: 'uppercase',
                        }}>
                            {STRATEGIES.find(s => s.id === strategy)?.style}
                        </span>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid #ef5350', borderRadius: '8px', padding: '14px', marginBottom: '16px', color: '#ef5350', fontSize: '13px' }}>
                    ❌ {error}
                </div>
            )}

            {/* ─── Compare Mode Leaderboard ─── */}
            {compareMode && compareResults.length > 0 && (
                <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>🏆 Strategy Leaderboard — {symbol}</div>
                        <span style={{ fontSize: '11px', color: '#8892a4' }}>{compareResults.length} strategies tested</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ background: '#1e2438' }}>
                                    {['Rank', 'Strategy', 'Category', 'Return %', 'Win Rate', 'Sharpe', 'Max DD%', 'Trades', 'Profit Factor'].map(h => (
                                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', color: '#8892a4', textTransform: 'uppercase', borderBottom: '1px solid #252d3d' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {compareResults.map((r, idx) => {
                                    const meta = STRATEGIES.find(s => s.id === r.strategy)
                                    return (
                                        <tr key={r.strategy} onClick={() => setResult(r)}
                                            style={{ borderBottom: '1px solid rgba(37,45,61,0.6)', cursor: 'pointer', background: result?.strategy === r.strategy ? 'rgba(41,98,255,0.08)' : 'transparent' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(41,98,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = result?.strategy === r.strategy ? 'rgba(41,98,255,0.08)' : 'transparent'}>
                                            <td style={{ padding: '10px 12px', ...mono, fontSize: '14px', fontWeight: 800, color: idx === 0 ? '#f0b429' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#8892a4' }}>
                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: '#fff' }}>{meta?.name || r.strategy}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: '#1e2438', border: '1px solid #252d3d', color: '#8892a4', fontWeight: 600, textTransform: 'uppercase' }}>
                                                    {meta?.category || 'custom'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', fontWeight: 700, color: r.totalReturnPct >= 0 ? '#26a69a' : '#ef5350' }}>
                                                {r.totalReturnPct >= 0 ? '+' : ''}{r.totalReturnPct}%
                                            </td>
                                            <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', color: '#f0b429' }}>{r.winRate}%</td>
                                            <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', color: r.sharpeRatio >= 1 ? '#26a69a' : '#ef5350' }}>{r.sharpeRatio}</td>
                                            <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', color: '#ef5350' }}>{r.maxDrawdownPct}%</td>
                                            <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', color: '#D1D4DC' }}>{r.totalTrades}</td>
                                            <td style={{ padding: '10px 12px', ...mono, fontSize: '12px', color: r.profitFactor >= 1 ? '#26a69a' : '#ef5350' }}>{r.profitFactor}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── Results ─── */}
            {result && (
                <>
                    {/* Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                        {[
                            { label: 'Total Return', value: (result.totalReturn >= 0 ? '+' : '') + formatINR(result.totalReturn), sub: `${result.totalReturnPct >= 0 ? '+' : ''}${result.totalReturnPct}%`, color: result.totalReturn >= 0 ? '#26a69a' : '#ef5350' },
                            { label: 'Final Capital', value: formatINR(result.finalCapital), sub: `from ${formatINR(result.initialCapital)}`, color: '#2962FF' },
                            { label: 'Total Trades', value: result.totalTrades.toString(), sub: `${result.winningTrades}W / ${result.losingTrades}L`, color: '#D1D4DC' },
                            { label: 'Win Rate', value: `${result.winRate}%`, sub: `${result.winningTrades} winning`, color: '#f0b429' },
                            { label: 'Max Drawdown', value: formatINR(result.maxDrawdown), sub: `${result.maxDrawdownPct}%`, color: '#ef5350' },
                            { label: 'Sharpe Ratio', value: result.sharpeRatio.toString(), sub: 'annualized', color: result.sharpeRatio >= 1 ? '#26a69a' : '#f0b429' },
                            { label: 'Profit Factor', value: result.profitFactor.toString(), sub: 'gross P ÷ gross L', color: result.profitFactor >= 1 ? '#26a69a' : '#ef5350' },
                            { label: 'Best Trade', value: '+' + formatINR(result.bestTrade), sub: 'single trade', color: '#26a69a' },
                        ].map(c => (
                            <div key={c.label} style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', padding: '14px', borderTop: `2px solid ${c.color}` }}>
                                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', color: '#8892a4', textTransform: 'uppercase', marginBottom: '8px' }}>{c.label}</div>
                                <div style={{ fontSize: '17px', fontWeight: 800, color: c.color, ...mono }}>{c.value}</div>
                                <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '4px', ...mono }}>{c.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Tab Switcher */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#1a1f2e', borderRadius: '10px', padding: '4px', border: '1px solid #252d3d' }}>
                        {[
                            { id: 'equity' as const, label: '📈 Equity Curve' },
                            { id: 'monthly' as const, label: '📅 Monthly Returns' },
                            { id: 'distribution' as const, label: '📊 P&L Distribution' },
                            { id: 'trades' as const, label: '📋 Trade Log' },
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none',
                                background: activeTab === tab.id ? '#2962FF' : 'transparent',
                                color: activeTab === tab.id ? '#fff' : '#8892a4',
                                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Equity Curve */}
                    {activeTab === 'equity' && (
                        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>📈 Equity Curve</div>
                                <span style={{ fontSize: '11px', color: '#8892a4' }}>{result.symbol} · {result.strategy} · {result.period}</span>
                            </div>
                            <div ref={chartContainerRef} style={{ width: '100%', height: '300px' }} />
                        </div>
                    )}

                    {/* Monthly Returns Heatmap */}
                    {activeTab === 'monthly' && (
                        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>📅 Monthly Returns Heatmap</div>
                            </div>
                            <div style={{ overflowX: 'auto', padding: '16px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '6px 10px', fontSize: '10px', fontWeight: 600, color: '#8892a4', textAlign: 'left' }}>Year</th>
                                            {MONTHS.map(m => (
                                                <th key={m} style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 600, color: '#8892a4', textAlign: 'center' }}>{m}</th>
                                            ))}
                                            <th style={{ padding: '6px 10px', fontSize: '10px', fontWeight: 600, color: '#f0b429', textAlign: 'center' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlyData.map(row => (
                                            <tr key={row.year}>
                                                <td style={{ padding: '4px 10px', ...mono, fontSize: '11px', fontWeight: 700, color: '#fff' }}>{row.year}</td>
                                                {row.months.map((val, mi) => {
                                                    const intensity = val !== null ? Math.min(Math.abs(val) / 5, 1) : 0
                                                    return (
                                                        <td key={mi} style={{
                                                            padding: '4px 6px', textAlign: 'center', ...mono, fontSize: '10px', fontWeight: 600,
                                                            color: val === null ? '#333' : val >= 0 ? '#26a69a' : '#ef5350',
                                                            background: val === null ? 'transparent' : val >= 0 ? `rgba(38,166,154,${0.1 + intensity * 0.3})` : `rgba(239,83,80,${0.1 + intensity * 0.3})`,
                                                            borderRadius: '3px',
                                                        }}>
                                                            {val !== null ? `${val >= 0 ? '+' : ''}${val.toFixed(1)}%` : '—'}
                                                        </td>
                                                    )
                                                })}
                                                <td style={{ padding: '4px 10px', textAlign: 'center', ...mono, fontSize: '11px', fontWeight: 700, color: row.total >= 0 ? '#26a69a' : '#ef5350' }}>
                                                    {row.total >= 0 ? '+' : ''}{row.total.toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* P&L Distribution */}
                    {activeTab === 'distribution' && (
                        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>📊 Trade P&L Distribution</div>
                            </div>
                            <div style={{ padding: '20px' }}>
                                {distributionData.map((bucket, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                        <div style={{ width: '100px', fontSize: '10px', color: '#8892a4', textAlign: 'right', ...mono }}>{bucket.range}</div>
                                        <div style={{ flex: 1, height: '20px', background: '#141821', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                            <div style={{
                                                width: `${(bucket.count / maxDistCount) * 100}%`,
                                                height: '100%',
                                                background: bucket.isPositive ? 'linear-gradient(90deg, #26a69a, #2dd4b0)' : 'linear-gradient(90deg, #ef5350, #f77)',
                                                borderRadius: '4px',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                        <div style={{ width: '30px', fontSize: '11px', fontWeight: 600, color: '#D1D4DC', ...mono }}>{bucket.count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trade Log */}
                    {activeTab === 'trades' && (
                        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>📋 Trade Log ({result.trades.length} trades)</div>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#1e2438', position: 'sticky', top: 0 }}>
                                            {['#', 'Entry Date', 'Exit Date', 'Entry ₹', 'Exit ₹', 'Qty', 'P&L ₹', 'P&L %', 'Signal'].map(h => (
                                                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', color: '#8892a4', textTransform: 'uppercase', borderBottom: '1px solid #252d3d', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.trades.map((t, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(37,45,61,0.6)' }}>
                                                <td style={{ padding: '8px 10px', ...mono, fontSize: '11px', color: '#8892a4' }}>{i + 1}</td>
                                                <td style={{ padding: '8px 10px', ...mono, fontSize: '11px', color: '#D1D4DC' }}>{t.entryDate}</td>
                                                <td style={{ padding: '8px 10px', ...mono, fontSize: '11px', color: '#D1D4DC' }}>{t.exitDate}</td>
                                                <td style={{ padding: '8px 10px', ...mono, fontSize: '11px', color: '#D1D4DC' }}>₹{t.entryPrice.toLocaleString('en-IN')}</td>
                                                <td style={{ padding: '8px 10px', ...mono, fontSize: '11px', color: '#D1D4DC' }}>₹{t.exitPrice.toLocaleString('en-IN')}</td>
                                                <td style={{ padding: '8px 10px', ...mono, fontSize: '11px', color: '#D1D4DC' }}>{t.qty}</td>
                                                <td style={{ padding: '8px 10px', ...mono, fontSize: '11px', fontWeight: 600, color: t.pnl >= 0 ? '#26a69a' : '#ef5350' }}>
                                                    {t.pnl >= 0 ? '+' : ''}{formatINR(t.pnl)}
                                                </td>
                                                <td style={{ padding: '8px 10px', ...mono, fontSize: '11px', fontWeight: 600, color: t.pnlPct >= 0 ? '#26a69a' : '#ef5350' }}>
                                                    {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct}%
                                                </td>
                                                <td style={{ padding: '8px 10px', fontSize: '10px', color: '#8892a4' }}>{t.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Empty state */}
            {!result && !loading && !error && (
                <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧪</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Run Your First Backtest</div>
                    <div style={{ fontSize: '13px', color: '#8892a4', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
                        15 strategies available. Select a stock, choose a strategy, or use <strong style={{ color: '#f0b429' }}>Compare All</strong> to test every strategy at once.
                        Up to 10 years of real NSE data.
                    </div>
                </div>
            )}
        </div>
    )
}
