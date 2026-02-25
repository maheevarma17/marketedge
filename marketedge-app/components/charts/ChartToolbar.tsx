'use client'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/theme'
import { INDICATOR_LIST, type IndicatorMeta } from '@/lib/indicators'
import { DRAWING_TOOLS, type DrawingToolType, DRAWING_COLORS } from '@/lib/drawing-tools'
import {
    LAYOUT_CONFIGS, type LayoutType,
    type ChartTemplate,
    LayoutManager,
} from '@/lib/chart-layouts'

interface ChartToolbarProps {
    // Chart type
    chartType: string
    onChartTypeChange: (type: string) => void
    // Layout
    layoutType: LayoutType
    onLayoutChange: (layout: LayoutType) => void
    // Time controls
    range: string
    onRangeChange: (range: string) => void
    interval: string
    onIntervalChange: (interval: string) => void
    // Drawing
    activeDrawingTool: DrawingToolType | null
    onDrawingToolSelect: (tool: DrawingToolType | null) => void
    onClearDrawings: () => void
    onUndoDrawing: () => void
    // Indicators
    onToggleIndicator: (indicator: IndicatorMeta, params?: Record<string, number>) => void
    activeIndicatorIds: string[]
    // Templates
    onApplyTemplate: (template: ChartTemplate) => void
    // Actions
    onScreenshot: () => void
    onFullscreen: () => void
    isFullscreen: boolean
    // Replay
    isReplayMode: boolean
    onToggleReplay: () => void
}

const RANGES = [
    { value: '1d', label: '1D' },
    { value: '5d', label: '5D' },
    { value: '1mo', label: '1M' },
    { value: '3mo', label: '3M' },
    { value: '6mo', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: '2y', label: '2Y' },
    { value: '5y', label: '5Y' },
    { value: 'max', label: 'ALL' },
]

const INTERVALS = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '1d', label: '1D' },
    { value: '1wk', label: '1W' },
    { value: '1mo', label: '1M' },
]

const CHART_TYPES = [
    { value: 'candle', label: '🕯️', title: 'Candlestick' },
    { value: 'bar', label: '📊', title: 'OHLC Bar' },
    { value: 'line', label: '📈', title: 'Line' },
    { value: 'area', label: '🌊', title: 'Area' },
    { value: 'heikinAshi', label: '🎌', title: 'Heikin Ashi' },
    { value: 'hollowCandle', label: '🕳️', title: 'Hollow Candles' },
    { value: 'baseline', label: '⚖️', title: 'Baseline' },
    { value: 'columns', label: '▮', title: 'Columns' },
]

export default function ChartToolbar(props: ChartToolbarProps) {
    const { t } = useTheme()
    const [showIndicators, setShowIndicators] = useState(false)
    const [showDrawings, setShowDrawings] = useState(false)
    const [showLayouts, setShowLayouts] = useState(false)
    const [showTemplates, setShowTemplates] = useState(false)
    const [indicatorSearch, setIndicatorSearch] = useState('')
    const indicatorRef = useRef<HTMLDivElement>(null)
    const drawingRef = useRef<HTMLDivElement>(null)
    const layoutRef = useRef<HTMLDivElement>(null)
    const templateRef = useRef<HTMLDivElement>(null)

    // Click outside to close panels
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (indicatorRef.current && !indicatorRef.current.contains(e.target as Node)) setShowIndicators(false)
            if (drawingRef.current && !drawingRef.current.contains(e.target as Node)) setShowDrawings(false)
            if (layoutRef.current && !layoutRef.current.contains(e.target as Node)) setShowLayouts(false)
            if (templateRef.current && !templateRef.current.contains(e.target as Node)) setShowTemplates(false)
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    const mono = { fontFamily: 'JetBrains Mono, monospace' }

    const btnBase = (active: boolean = false) => ({
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 600 as const,
        cursor: 'pointer',
        transition: 'all .15s',
        border: `1px solid ${active ? t.accent : t.border}`,
        background: active ? t.accent : t.bgInput,
        color: active ? '#fff' : t.textDim,
        ...mono,
    })

    const dropdownStyle: React.CSSProperties = {
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 10001, // Must be above fullscreen z-index (9999)
        marginTop: '4px',
        background: t.bgCard,
        border: `1px solid ${t.accent}`,
        borderRadius: '8px',
        boxShadow: '0 12px 40px rgba(0,0,0,.6)',
        padding: '8px',
        minWidth: '220px',
        maxHeight: '400px',
        overflowY: 'auto' as const,
    }

    const filteredIndicators = INDICATOR_LIST.filter(ind =>
        ind.name.toLowerCase().includes(indicatorSearch.toLowerCase()) ||
        ind.shortName.toLowerCase().includes(indicatorSearch.toLowerCase())
    )

    const categories = ['trend', 'momentum', 'volatility', 'volume', 'oscillator'] as const
    const categoryLabels = { trend: '📈 Trend', momentum: '⚡ Momentum', volatility: '📊 Volatility', volume: '🔊 Volume', oscillator: '🔄 Oscillators' }

    const templates = LayoutManager.getTemplates()

    return (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '4px 8px', flexWrap: 'wrap', background: t.bgCard, borderBottom: `1px solid ${t.border}`, borderRadius: '8px 8px 0 0', position: 'relative', zIndex: 10, overflow: 'visible' }}>

            {/* Timeframe Ranges */}
            <div style={{ display: 'flex', gap: '1px', background: t.bgInput, borderRadius: '5px', padding: '2px' }}>
                {RANGES.map(r => (
                    <div key={r.value} onClick={() => props.onRangeChange(r.value)} style={{
                        ...btnBase(props.range === r.value),
                        border: 'none',
                        padding: '3px 6px',
                        fontSize: '9px',
                    }}>{r.label}</div>
                ))}
            </div>

            {/* Intervals */}
            <div style={{ display: 'flex', gap: '1px', background: t.bgInput, borderRadius: '5px', padding: '2px' }}>
                {INTERVALS.map(iv => (
                    <div key={iv.value} onClick={() => props.onIntervalChange(iv.value)} style={{
                        ...btnBase(props.interval === iv.value),
                        border: 'none',
                        padding: '3px 6px',
                        fontSize: '9px',
                    }}>{iv.label}</div>
                ))}
            </div>

            <div style={{ width: '1px', height: '20px', background: t.border }} />

            {/* Chart Type */}
            <div style={{ display: 'flex', gap: '1px', background: t.bgInput, borderRadius: '5px', padding: '2px' }}>
                {CHART_TYPES.map(ct => (
                    <div key={ct.value} onClick={() => props.onChartTypeChange(ct.value)} title={ct.title} style={{
                        ...btnBase(props.chartType === ct.value),
                        border: 'none',
                        padding: '3px 6px',
                    }}>{ct.label}</div>
                ))}
            </div>

            <div style={{ width: '1px', height: '20px', background: t.border }} />

            {/* Indicators Dropdown */}
            <div style={{ position: 'relative' }} ref={indicatorRef}>
                <div onClick={() => { setShowIndicators(!showIndicators); setShowDrawings(false); setShowLayouts(false); setShowTemplates(false) }}
                    style={{ ...btnBase(showIndicators), display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📉</span>
                    <span>Indicators</span>
                    {props.activeIndicatorIds.length > 0 && (
                        <span style={{ background: t.accent, color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700 }}>
                            {props.activeIndicatorIds.length}
                        </span>
                    )}
                </div>

                {showIndicators && (
                    <div style={{ ...dropdownStyle, width: '300px' }}>
                        <input
                            value={indicatorSearch}
                            onChange={e => setIndicatorSearch(e.target.value)}
                            placeholder="🔍 Search indicators..."
                            style={{ width: '100%', padding: '6px 10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '5px', color: t.text, fontSize: '11px', ...mono, outline: 'none', marginBottom: '8px', boxSizing: 'border-box' }}
                        />
                        {categories.map(cat => {
                            const items = filteredIndicators.filter(ind => ind.category === cat)
                            if (items.length === 0) return null
                            return (
                                <div key={cat}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: t.textDim, padding: '4px 0', borderBottom: `1px solid ${t.border}30`, marginBottom: '2px' }}>
                                        {categoryLabels[cat]}
                                    </div>
                                    {items.map(ind => {
                                        const isActive = props.activeIndicatorIds.includes(ind.id)
                                        return (
                                            <div key={ind.id}
                                                onClick={() => props.onToggleIndicator(ind)}
                                                style={{
                                                    padding: '5px 8px', cursor: 'pointer', borderRadius: '4px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    background: isActive ? `${t.accent}22` : 'transparent',
                                                    marginBottom: '1px',
                                                }}
                                                onMouseEnter={e => !isActive && (e.currentTarget.style.background = `${t.border}`)}
                                                onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: isActive ? t.accent : t.text }}>{ind.shortName}</span>
                                                    <span style={{ fontSize: '9px', color: t.textDim, marginLeft: '6px' }}>{ind.name}</span>
                                                </div>
                                                <span style={{ fontSize: '10px', color: isActive ? t.green : t.textDim }}>
                                                    {isActive ? '✓' : ind.overlay ? 'overlay' : 'pane'}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })}
                        <div style={{ fontSize: '9px', color: t.textDim, textAlign: 'center', marginTop: '8px', padding: '4px' }}>
                            {INDICATOR_LIST.length} indicators available · Unlimited per chart
                        </div>
                    </div>
                )}
            </div>

            {/* Templates Dropdown */}
            <div style={{ position: 'relative' }} ref={templateRef}>
                <div onClick={() => { setShowTemplates(!showTemplates); setShowIndicators(false); setShowDrawings(false); setShowLayouts(false) }}
                    style={{ ...btnBase(showTemplates), display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📋</span>
                    <span>Templates</span>
                </div>

                {showTemplates && (
                    <div style={dropdownStyle}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: t.textDim, marginBottom: '6px' }}>Preset Templates</div>
                        {templates.map(tpl => (
                            <div key={tpl.id}
                                onClick={() => { props.onApplyTemplate(tpl); setShowTemplates(false) }}
                                style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', marginBottom: '2px' }}
                                onMouseEnter={e => e.currentTarget.style.background = `${t.border}`}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ fontSize: '12px', fontWeight: 600, color: t.text }}>{tpl.name}</div>
                                <div style={{ fontSize: '9px', color: t.textDim }}>
                                    {tpl.indicators.map(i => i.id.toUpperCase()).join(' · ')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ width: '1px', height: '20px', background: t.border }} />

            {/* Layout Selector */}
            <div style={{ position: 'relative' }} ref={layoutRef}>
                <div onClick={() => { setShowLayouts(!showLayouts); setShowIndicators(false); setShowDrawings(false); setShowTemplates(false) }}
                    style={{ ...btnBase(showLayouts), display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⊞</span>
                    <span>Layout</span>
                </div>

                {showLayouts && (
                    <div style={dropdownStyle}>
                        {(Object.entries(LAYOUT_CONFIGS) as [LayoutType, typeof LAYOUT_CONFIGS[LayoutType]][]).map(([key, config]) => (
                            <div key={key}
                                onClick={() => { props.onLayoutChange(key); setShowLayouts(false) }}
                                style={{
                                    padding: '6px 8px', cursor: 'pointer', borderRadius: '4px',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: props.layoutType === key ? `${t.accent}22` : 'transparent',
                                    marginBottom: '2px',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = `${t.border}`}
                                onMouseLeave={e => e.currentTarget.style.background = props.layoutType === key ? `${t.accent}22` : 'transparent'}
                            >
                                <span style={{ fontSize: '16px' }}>{config.icon}</span>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: t.text }}>{config.label}</div>
                                    <div style={{ fontSize: '9px', color: t.textDim }}>{config.rows}×{config.cols} charts</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ width: '1px', height: '20px', background: t.border }} />

            {/* Bar Replay Toggle */}
            <div
                onClick={props.onToggleReplay}
                style={{ ...btnBase(props.isReplayMode), display: 'flex', alignItems: 'center', gap: '4px', color: props.isReplayMode ? '#fff' : t.text }}
                title="Bar Replay Simulator"
            >
                <span>⏪</span>
                <span>Replay</span>
            </div>

            {/* Right side actions */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                <div onClick={props.onScreenshot} style={{ ...btnBase(), padding: '4px 8px' }} title="Screenshot">📸</div>
                {props.isFullscreen ? (
                    <div onClick={props.onFullscreen} style={{
                        ...btnBase(true),
                        padding: '4px 12px',
                        background: '#ef4444',
                        color: '#fff',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontWeight: 700, fontSize: '11px',
                    }} title="Exit Fullscreen (ESC)">
                        EXIT ✕
                    </div>
                ) : (
                    <div onClick={props.onFullscreen} style={{ ...btnBase(), padding: '4px 8px' }} title="Fullscreen">
                        ⛶
                    </div>
                )}
            </div>
        </div>
    )
}
