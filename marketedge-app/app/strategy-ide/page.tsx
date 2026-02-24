'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { searchStocks, type StockSearchResult } from '@/lib/api'
import { runBacktest, type BacktestResult, type Candle } from '@/lib/backtesting'
import { runCustomStrategy, STRATEGY_TEMPLATES, type StrategyTemplate } from '@/lib/strategy-runner'
import { formatINR } from '@/lib/paper-trading'

export default function StrategyIDEPage() {
    const [code, setCode] = useState(STRATEGY_TEMPLATES[0].code)
    const [activeTemplate, setActiveTemplate] = useState(STRATEGY_TEMPLATES[0].id)
    const [symbol, setSymbol] = useState('RELIANCE')
    const [range, setRange] = useState('5y')
    const [capital, setCapital] = useState('1000000')
    const [search, setSearch] = useState('')
    const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
    const [showSearch, setShowSearch] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<BacktestResult | null>(null)
    const [errors, setErrors] = useState<string[]>([])
    const [logs, setLogs] = useState<string[]>([])
    const searchRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<HTMLTextAreaElement>(null)

    // Click outside
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    // Draw equity curve
    useEffect(() => {
        if (!result || !chartRef.current) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let chart: any = null

        import('lightweight-charts').then(({ createChart, ColorType }) => {
            if (!chartRef.current) return
            chartRef.current.innerHTML = ''

            chart = createChart(chartRef.current, {
                width: chartRef.current.clientWidth,
                height: 200,
                layout: { background: { type: ColorType.Solid, color: '#0d1117' }, textColor: '#8892a4', fontSize: 10 },
                grid: { vertLines: { color: '#1e2438' }, horzLines: { color: '#1e2438' } },
                rightPriceScale: { borderColor: '#252d3d' },
                timeScale: { borderColor: '#252d3d', timeVisible: false },
            })

            const isProfit = result.totalReturn >= 0
            const area = chart.addAreaSeries({
                lineColor: isProfit ? '#26a69a' : '#ef5350',
                topColor: isProfit ? 'rgba(38,166,154,0.2)' : 'rgba(239,83,80,0.2)',
                bottomColor: 'transparent',
                lineWidth: 2,
            })
            area.setData(result.equityCurve.map(c => ({ time: c.date as string, value: c.equity })))
            chart.timeScale().fitContent()
        })

        return () => { if (chart) chart.remove() }
    }, [result])

    const loadTemplate = useCallback((tmpl: StrategyTemplate) => {
        setCode(tmpl.code)
        setActiveTemplate(tmpl.id)
    }, [])

    async function handleSearch(q: string) {
        setSearch(q)
        if (q.length >= 1) {
            const r = await searchStocks(q)
            setSearchResults(r)
            setShowSearch(true)
        } else { setSearchResults([]); setShowSearch(false) }
    }

    async function runStrategy() {
        setLoading(true)
        setErrors([])
        setLogs([])
        setResult(null)

        try {
            const res = await fetch(`/api/market/history/${encodeURIComponent(symbol)}?range=${range}&interval=1d`)
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            if (!data.candles || data.candles.length < 50) throw new Error('Not enough data (need 50+ candles)')

            const candles = data.candles as Candle[]
            const stratResult = runCustomStrategy(code, candles)

            if (stratResult.errors.length > 0) {
                setErrors(stratResult.errors)
            }

            setLogs([`✅ Strategy executed on ${candles.length} candles`])

            // Count signals
            const buys = stratResult.signals.filter(s => s === 'BUY').length
            const sells = stratResult.signals.filter(s => s === 'SELL').length
            setLogs(prev => [...prev, `📊 Generated ${buys} BUY and ${sells} SELL signals`])

            // Run backtest using signals
            // We'll convert custom signals into a pseudo-backtest
            const trades: { entryDate: string; exitDate: string; side: 'BUY' | 'SELL'; entryPrice: number; exitPrice: number; qty: number; pnl: number; pnlPct: number; reason: string }[] = []
            const equityCurve: { date: string; equity: number }[] = []
            let cap = parseInt(capital) || 1000000
            const initCap = cap
            let position: { entryPrice: number; entryDate: string; qty: number } | null = null
            let peakEquity = cap
            let maxDD = 0

            for (let i = 0; i < candles.length; i++) {
                const sig = stratResult.signals[i]
                if (sig === 'BUY' && !position) {
                    const posSize = cap * 0.1
                    const qty = Math.floor(posSize / candles[i].close)
                    if (qty > 0) {
                        position = { entryPrice: candles[i].close, entryDate: candles[i].date, qty }
                        cap -= qty * candles[i].close
                    }
                } else if (sig === 'SELL' && position) {
                    const pnl = (candles[i].close - position.entryPrice) * position.qty
                    cap += position.qty * candles[i].close
                    trades.push({
                        entryDate: position.entryDate, exitDate: candles[i].date,
                        side: 'BUY', entryPrice: position.entryPrice, exitPrice: candles[i].close,
                        qty: position.qty, pnl: parseFloat(pnl.toFixed(2)),
                        pnlPct: parseFloat(((candles[i].close - position.entryPrice) / position.entryPrice * 100).toFixed(2)),
                        reason: 'Custom Strategy',
                    })
                    position = null
                }
                const eq = cap + (position ? position.qty * candles[i].close : 0)
                equityCurve.push({ date: candles[i].date, equity: parseFloat(eq.toFixed(2)) })
                if (eq > peakEquity) peakEquity = eq
                if (peakEquity - eq > maxDD) maxDD = peakEquity - eq
            }

            // Close remaining position
            if (position) {
                const last = candles[candles.length - 1]
                cap += position.qty * last.close
            }

            const wins = trades.filter(t => t.pnl > 0)
            const losses = trades.filter(t => t.pnl < 0)

            const backResult: BacktestResult = {
                strategy: 'custom', symbol, period: range,
                initialCapital: initCap, finalCapital: parseFloat(cap.toFixed(2)),
                totalReturn: parseFloat((cap - initCap).toFixed(2)),
                totalReturnPct: parseFloat(((cap - initCap) / initCap * 100).toFixed(2)),
                totalTrades: trades.length, winningTrades: wins.length, losingTrades: losses.length,
                winRate: trades.length > 0 ? parseFloat((wins.length / trades.length * 100).toFixed(1)) : 0,
                maxDrawdown: parseFloat(maxDD.toFixed(2)),
                maxDrawdownPct: peakEquity > 0 ? parseFloat((maxDD / peakEquity * 100).toFixed(2)) : 0,
                sharpeRatio: 0, profitFactor: 0,
                avgWin: wins.length > 0 ? parseFloat((wins.reduce((s, t) => s + t.pnl, 0) / wins.length).toFixed(2)) : 0,
                avgLoss: losses.length > 0 ? parseFloat((losses.reduce((s, t) => s + t.pnl, 0) / losses.length).toFixed(2)) : 0,
                bestTrade: trades.length > 0 ? Math.max(...trades.map(t => t.pnl)) : 0,
                worstTrade: trades.length > 0 ? Math.min(...trades.map(t => t.pnl)) : 0,
                trades, equityCurve,
            }

            setResult(backResult)
            setLogs(prev => [...prev, `💰 Total return: ${backResult.totalReturnPct >= 0 ? '+' : ''}${backResult.totalReturnPct}%`])
        } catch (err: unknown) {
            setErrors([err instanceof Error ? err.message : 'Failed to run strategy'])
        }
        setLoading(false)
    }

    const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', background: '#0d1117' }}>
            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #252d3d', display: 'flex', alignItems: 'center', gap: '12px', background: '#141821' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                    ⚡ Strategy <span style={{ color: '#f0b429' }}>IDE</span>
                    <span style={{ fontSize: '10px', background: '#2962FF', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: 600 }}>FREE</span>
                </div>

                <div style={{ marginLeft: '20px', position: 'relative' }} ref={searchRef}>
                    <input
                        value={search || symbol}
                        onChange={e => handleSearch(e.target.value.toUpperCase())}
                        onFocus={() => { setSearch(symbol); search.length >= 1 && setShowSearch(true) }}
                        style={{ width: '140px', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', ...mono, outline: 'none' }}
                        placeholder="Symbol"
                    />
                    {showSearch && searchResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#1e2438', border: '1px solid #2962FF', borderRadius: '0 0 8px 8px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
                            {searchResults.map(s => (
                                <div key={s.symbol} onClick={() => { setSymbol(s.symbol); setSearch(''); setShowSearch(false) }}
                                    style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.05)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#252d3d')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '12px' }}>{s.symbol}</span>
                                    <span style={{ fontSize: '10px', color: '#8892a4', marginLeft: '6px' }}>{s.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <select value={range} onChange={e => setRange(e.target.value)}
                    style={{ background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '6px 10px', color: '#D1D4DC', fontSize: '12px', outline: 'none', ...mono }}>
                    {[{ v: '1y', l: '1Y' }, { v: '2y', l: '2Y' }, { v: '5y', l: '5Y' }, { v: '10y', l: '10Y' }, { v: 'max', l: 'ALL' }].map(r =>
                        <option key={r.v} value={r.v}>{r.l}</option>
                    )}
                </select>

                <button onClick={runStrategy} disabled={loading} style={{
                    background: loading ? '#555' : 'linear-gradient(135deg, #26a69a, #2dd4b0)',
                    border: 'none', borderRadius: '6px', padding: '6px 20px',
                    color: '#fff', fontSize: '12px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 12px rgba(38,166,154,0.3)',
                }}>
                    {loading ? '⏳ Running...' : '▶ Run Strategy'}
                </button>

                <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#8892a4' }}>
                    Ctrl+Enter to run · 25+ indicators available
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Left: Template Sidebar */}
                <div style={{ width: '200px', borderRight: '1px solid #252d3d', background: '#141821', overflowY: 'auto', flexShrink: 0 }}>
                    <div style={{ padding: '10px 12px', fontSize: '10px', fontWeight: 600, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #252d3d' }}>
                        📚 Templates
                    </div>
                    {STRATEGY_TEMPLATES.map(tmpl => (
                        <div key={tmpl.id} onClick={() => loadTemplate(tmpl)}
                            style={{
                                padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(37,45,61,0.5)',
                                background: activeTemplate === tmpl.id ? 'rgba(41,98,255,0.1)' : 'transparent',
                                borderLeft: activeTemplate === tmpl.id ? '2px solid #2962FF' : '2px solid transparent',
                            }}
                            onMouseEnter={e => { if (activeTemplate !== tmpl.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                            onMouseLeave={e => { if (activeTemplate !== tmpl.id) e.currentTarget.style.background = 'transparent' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{tmpl.name}</div>
                            <div style={{ fontSize: '10px', color: '#8892a4', lineHeight: 1.3 }}>{tmpl.description}</div>
                            <span style={{
                                fontSize: '8px', padding: '1px 4px', borderRadius: '3px', marginTop: '4px', display: 'inline-block',
                                background: tmpl.category === 'trend' ? 'rgba(38,166,154,0.2)' : tmpl.category === 'momentum' ? 'rgba(41,98,255,0.2)' : 'rgba(240,180,41,0.2)',
                                color: tmpl.category === 'trend' ? '#26a69a' : tmpl.category === 'momentum' ? '#2962FF' : '#f0b429',
                                fontWeight: 600, textTransform: 'uppercase',
                            }}>{tmpl.category}</span>
                        </div>
                    ))}
                </div>

                {/* Center: Code Editor */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ padding: '6px 12px', borderBottom: '1px solid #252d3d', fontSize: '10px', color: '#8892a4', display: 'flex', alignItems: 'center', gap: '10px', background: '#141821' }}>
                        <span style={{ color: '#f0b429', fontWeight: 600 }}>custom_strategy.js</span>
                        <span>— {symbol} · {range} · ₹{parseInt(capital).toLocaleString('en-IN')}</span>
                    </div>
                    <textarea
                        ref={editorRef}
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        onKeyDown={e => {
                            if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); runStrategy() }
                            if (e.key === 'Tab') {
                                e.preventDefault()
                                const start = e.currentTarget.selectionStart
                                const end = e.currentTarget.selectionEnd
                                setCode(code.substring(0, start) + '  ' + code.substring(end))
                                setTimeout(() => { editorRef.current?.setSelectionRange(start + 2, start + 2) }, 0)
                            }
                        }}
                        spellCheck={false}
                        style={{
                            flex: 1, padding: '16px', background: '#0d1117', color: '#e6edf3', border: 'none', outline: 'none',
                            fontSize: '13px', lineHeight: 1.6, resize: 'none', ...mono,
                            tabSize: 2,
                        }}
                    />

                    {/* Console */}
                    <div style={{ height: '120px', borderTop: '1px solid #252d3d', background: '#0d1117', overflowY: 'auto', flexShrink: 0 }}>
                        <div style={{ padding: '6px 12px', borderBottom: '1px solid #1e2438', fontSize: '10px', fontWeight: 600, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#141821' }}>
                            Console
                        </div>
                        <div style={{ padding: '8px 12px' }}>
                            {errors.map((err, i) => (
                                <div key={`e${i}`} style={{ fontSize: '11px', color: '#ef5350', ...mono, marginBottom: '2px' }}>❌ {err}</div>
                            ))}
                            {logs.map((log, i) => (
                                <div key={`l${i}`} style={{ fontSize: '11px', color: '#8892a4', ...mono, marginBottom: '2px' }}>{log}</div>
                            ))}
                            {!loading && errors.length === 0 && logs.length === 0 && (
                                <div style={{ fontSize: '11px', color: '#555', ...mono }}>Press ▶ Run Strategy or Ctrl+Enter to execute...</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Results Panel */}
                <div style={{ width: '320px', borderLeft: '1px solid #252d3d', background: '#141821', overflowY: 'auto', flexShrink: 0 }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #252d3d', fontSize: '10px', fontWeight: 600, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        📊 Results
                    </div>

                    {result ? (
                        <>
                            {/* Mini Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px 14px' }}>
                                {[
                                    { label: 'Return', value: `${result.totalReturnPct >= 0 ? '+' : ''}${result.totalReturnPct}%`, color: result.totalReturnPct >= 0 ? '#26a69a' : '#ef5350' },
                                    { label: 'Trades', value: result.totalTrades.toString(), color: '#D1D4DC' },
                                    { label: 'Win Rate', value: `${result.winRate}%`, color: '#f0b429' },
                                    { label: 'Max DD', value: `${result.maxDrawdownPct}%`, color: '#ef5350' },
                                ].map(s => (
                                    <div key={s.label} style={{ background: '#1e2438', borderRadius: '6px', padding: '8px 10px' }}>
                                        <div style={{ fontSize: '9px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>{s.label}</div>
                                        <div style={{ fontSize: '16px', fontWeight: 800, color: s.color, ...mono }}>{s.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Equity Chart */}
                            <div style={{ padding: '0 14px 12px' }}>
                                <div ref={chartRef} style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden' }} />
                            </div>

                            {/* P&L Summary */}
                            <div style={{ padding: '0 14px 12px' }}>
                                <div style={{ background: '#1e2438', borderRadius: '8px', padding: '10px 12px' }}>
                                    <div style={{ fontSize: '10px', color: '#8892a4', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Summary</div>
                                    {[
                                        ['Initial', formatINR(result.initialCapital)],
                                        ['Final', formatINR(result.finalCapital)],
                                        ['P&L', `${result.totalReturn >= 0 ? '+' : ''}${formatINR(result.totalReturn)}`],
                                        ['Best Trade', `+${formatINR(result.bestTrade)}`],
                                        ['Worst Trade', formatINR(result.worstTrade)],
                                    ].map(([k, v], i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px', ...mono }}>
                                            <span style={{ color: '#8892a4' }}>{k}</span>
                                            <span style={{ color: '#D1D4DC', fontWeight: 600 }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Trades */}
                            <div style={{ padding: '0 14px 12px' }}>
                                <div style={{ fontSize: '10px', color: '#8892a4', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Last 5 Trades</div>
                                {result.trades.slice(-5).reverse().map((t, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '10px', ...mono, borderBottom: '1px solid rgba(37,45,61,0.5)' }}>
                                        <span style={{ color: '#8892a4' }}>{t.entryDate.slice(5)}</span>
                                        <span style={{ color: t.pnl >= 0 ? '#26a69a' : '#ef5350', fontWeight: 600 }}>
                                            {t.pnl >= 0 ? '+' : ''}{t.pnlPct}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '36px', marginBottom: '10px' }}>💡</div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Write Your Strategy</div>
                            <div style={{ fontSize: '11px', color: '#8892a4', lineHeight: 1.5 }}>
                                Use the editor to write custom strategies. Click a template to start, then modify it.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
