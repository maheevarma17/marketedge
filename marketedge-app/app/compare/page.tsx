'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '@/lib/theme'
import { searchStocks, getQuote, type StockQuote, type StockSearchResult } from '@/lib/api'

interface CompareStock {
    symbol: string
    quote: StockQuote | null
    loading: boolean
}

export default function ComparePage() {
    const { t } = useTheme()
    const [stocks, setStocks] = useState<CompareStock[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
    const [showSearch, setShowSearch] = useState(false)
    const chartRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLDivElement>(null)

    const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }
    const card: React.CSSProperties = { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: t.shadow }

    const COLORS = ['#6383ff', '#34d399', '#f87171', '#fbbf24']

    // Click outside
    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    async function handleSearch(q: string) {
        setSearchQuery(q)
        if (q.length >= 1) {
            const results = await searchStocks(q)
            setSearchResults(results)
            setShowSearch(true)
        } else { setSearchResults([]); setShowSearch(false) }
    }

    const addStock = useCallback(async (sym: string) => {
        if (stocks.length >= 4 || stocks.find(s => s.symbol === sym)) return
        setSearchQuery(''); setShowSearch(false)
        const newStock: CompareStock = { symbol: sym, quote: null, loading: true }
        setStocks(prev => [...prev, newStock])
        try {
            const quote = await getQuote(sym)
            setStocks(prev => prev.map(s => s.symbol === sym ? { ...s, quote, loading: false } : s))
        } catch {
            setStocks(prev => prev.map(s => s.symbol === sym ? { ...s, loading: false } : s))
        }
    }, [stocks])

    function removeStock(sym: string) {
        setStocks(prev => prev.filter(s => s.symbol !== sym))
    }

    // Render comparison chart
    useEffect(() => {
        if (!chartRef.current || stocks.filter(s => s.quote).length < 2) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let chart: any = null
        import('lightweight-charts').then(({ createChart, ColorType }) => {
            if (!chartRef.current) return
            chartRef.current.innerHTML = ''
            chart = createChart(chartRef.current, {
                width: chartRef.current.clientWidth,
                height: 300,
                layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: t.textDim, fontSize: 11 },
                grid: { vertLines: { color: t.border }, horzLines: { color: t.border } },
                rightPriceScale: { borderColor: t.border },
                timeScale: { borderColor: t.border },
            })
            stocks.forEach((stock, i) => {
                if (!stock.quote) return
                const basePrice = stock.quote.prevClose || stock.quote.price
                const series = chart.addLineSeries({ color: COLORS[i], lineWidth: 2, title: stock.symbol })
                // Simulate normalized intraday data points
                const now = new Date()
                const points = []
                for (let h = 9; h <= 15; h++) {
                    for (let m = 0; m < 60; m += 15) {
                        if (h === 15 && m > 30) break
                        const time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
                        const variance = (Math.random() - 0.5) * stock.quote!.changePct * 0.3
                        const normalizedPct = ((stock.quote!.price / basePrice - 1) * 100) + variance
                        points.push({ time: Math.floor(time.getTime() / 1000) as unknown as string, value: parseFloat(normalizedPct.toFixed(2)) })
                    }
                }
                series.setData(points)
            })
            chart.timeScale().fitContent()
        })
        return () => { if (chart) chart.remove() }
    }, [stocks, t])

    const loadedStocks = stocks.filter(s => s.quote)

    return (
        <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: t.text, letterSpacing: '-0.03em' }}>Stock Comparison</div>
                <div style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>Compare up to 4 stocks side-by-side</div>
            </div>

            {/* Search + Tags */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div ref={searchRef} style={{ position: 'relative', width: '260px' }}>
                    <input value={searchQuery} onChange={e => handleSearch(e.target.value.toUpperCase())}
                        placeholder={stocks.length >= 4 ? 'Max 4 stocks' : 'Add stock to compare...'}
                        disabled={stocks.length >= 4}
                        style={{ width: '100%', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '9px 12px', color: t.text, fontSize: '13px', outline: 'none' }} />
                    {showSearch && searchResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: t.glass, backdropFilter: 'blur(12px)', border: `1px solid ${t.glassBorder}`, borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.3)' }}>
                            {searchResults.map(s => (
                                <div key={s.symbol} onClick={() => addStock(s.symbol)}
                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}
                                    onMouseEnter={e => e.currentTarget.style.background = t.bgInput}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <div style={{ fontWeight: 600, color: t.text, fontSize: '12px' }}>{s.symbol}</div>
                                    <div style={{ fontSize: '10px', color: t.textDim }}>{s.name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {stocks.map((s, i) => (
                    <div key={s.symbol} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '5px 12px', borderRadius: '8px', background: `${COLORS[i]}20`,
                        border: `1px solid ${COLORS[i]}40`,
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i] }} />
                        <span style={{ fontWeight: 600, color: t.text, fontSize: '12px' }}>{s.symbol}</span>
                        <span onClick={() => removeStock(s.symbol)} style={{ cursor: 'pointer', fontSize: '14px', color: t.textDim, marginLeft: '4px' }}>×</span>
                    </div>
                ))}
            </div>

            {stocks.length === 0 ? (
                <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '6px' }}>Add stocks to compare</div>
                    <div style={{ fontSize: '13px', color: t.textDim }}>Search and add up to 4 stocks for side-by-side comparison</div>
                </div>
            ) : (
                <>
                    {/* Comparison Table */}
                    <div style={{ ...card, marginBottom: '20px', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10.5px', fontWeight: 600, color: t.textDim, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${t.border}` }}>METRIC</th>
                                    {stocks.map((s, i) => (
                                        <th key={s.symbol} style={{ padding: '10px 12px', textAlign: 'right', borderBottom: `1px solid ${t.border}` }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i] }} />
                                                <span style={{ fontWeight: 600, color: t.text, fontSize: '13px' }}>{s.symbol}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { label: 'Last Price', fn: (q: StockQuote) => `₹${q.price.toLocaleString('en-IN')}` },
                                    { label: 'Change', fn: (q: StockQuote) => `${q.change >= 0 ? '+' : ''}${q.change.toFixed(2)}` },
                                    { label: 'Change %', fn: (q: StockQuote) => `${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%` },
                                    { label: 'Day High', fn: (q: StockQuote) => `₹${q.dayHigh.toLocaleString('en-IN')}` },
                                    { label: 'Day Low', fn: (q: StockQuote) => `₹${q.dayLow.toLocaleString('en-IN')}` },
                                    { label: 'Volume', fn: (q: StockQuote) => q.volume > 1000000 ? `${(q.volume / 1000000).toFixed(1)}M` : `${(q.volume / 1000).toFixed(0)}K` },
                                    { label: 'Prev Close', fn: (q: StockQuote) => `₹${q.prevClose.toLocaleString('en-IN')}` },
                                    { label: 'Day Range', fn: (q: StockQuote) => `₹${q.dayLow} — ₹${q.dayHigh}` },
                                ].map(row => (
                                    <tr key={row.label} style={{ borderBottom: `1px solid ${t.border}` }}>
                                        <td style={{ padding: '10px 12px', fontSize: '12px', color: t.textDim, fontWeight: 500 }}>{row.label}</td>
                                        {stocks.map(s => (
                                            <td key={s.symbol} style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12.5px', fontWeight: 600, ...mono, color: row.label.includes('Change') && s.quote ? (s.quote.change >= 0 ? t.green : t.red) : t.text }}>
                                                {s.loading ? '...' : s.quote ? row.fn(s.quote) : '—'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Normalized Chart */}
                    {loadedStocks.length >= 2 && (
                        <div style={card}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '12px' }}>Normalized Performance (%)</div>
                            <div ref={chartRef} style={{ width: '100%', height: '300px' }} />
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
