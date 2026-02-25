import { useTheme } from '@/lib/theme'
import { type ActiveIndicator } from '@/lib/chart-layouts'

interface ChartDataPanelProps {
    symbol: string
    stockName: string
    ohlcv: {
        date: string
        open: number
        high: number
        low: number
        close: number
        volume: number
    } | null
    indicatorValues: { name: string; value: string; color: string; indicator: ActiveIndicator }[]
    priceChange: number
    priceChangePct: number
    onConfigureIndicator?: (indicator: ActiveIndicator) => void
    onToggleVisibility?: (indicator: ActiveIndicator) => void
    onRemoveIndicator?: (indicator: ActiveIndicator) => void
}

export default function ChartDataPanel({ symbol, stockName, ohlcv, indicatorValues, priceChange, priceChangePct, onConfigureIndicator, onToggleVisibility, onRemoveIndicator }: ChartDataPanelProps) {
    const { t } = useTheme()
    const mono = { fontFamily: 'JetBrains Mono, monospace' }
    const isUp = priceChange >= 0

    if (!ohlcv) return null

    return (
        <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            padding: '4px 12px',
            background: `${t.bgCard}ee`,
            borderBottom: `1px solid ${t.border}30`,
            flexWrap: 'wrap',
            minHeight: '28px',
            ...mono,
            fontSize: '11px',
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 // stick to top inside chart container
        }}>
            {/* Symbol & Name */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontWeight: 800, color: t.text, fontSize: '13px' }}>{symbol}</span>
                <span style={{ color: t.textDim, fontSize: '9px' }}>{stockName}</span>
            </div>

            {/* Price */}
            <span style={{ fontWeight: 700, color: t.text, fontSize: '14px' }}>
                ₹{ohlcv.close.toLocaleString('en-IN')}
            </span>

            {/* Change */}
            <span style={{ fontWeight: 700, color: isUp ? t.green : t.red, fontSize: '11px' }}>
                {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{priceChange.toFixed(2)} ({isUp ? '+' : ''}{priceChangePct.toFixed(2)}%)
            </span>

            <div style={{ width: '1px', height: '16px', background: t.border }} />

            {/* OHLCV */}
            <div style={{ display: 'flex', gap: '10px', color: t.textDim, fontSize: '10px' }}>
                <span>O <span style={{ color: ohlcv.open >= ohlcv.close ? t.red : t.green, fontWeight: 600 }}>{ohlcv.open.toFixed(2)}</span></span>
                <span>H <span style={{ color: t.green, fontWeight: 600 }}>{ohlcv.high.toFixed(2)}</span></span>
                <span>L <span style={{ color: t.red, fontWeight: 600 }}>{ohlcv.low.toFixed(2)}</span></span>
                <span>C <span style={{ color: ohlcv.close >= ohlcv.open ? t.green : t.red, fontWeight: 600 }}>{ohlcv.close.toFixed(2)}</span></span>
                <span>V <span style={{ color: t.textMuted, fontWeight: 600 }}>{formatVolume(ohlcv.volume)}</span></span>
            </div>

            {/* Indicator Values */}
            {indicatorValues.length > 0 && (
                <>
                    <div style={{ width: '1px', height: '16px', background: t.border }} />
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {indicatorValues.map((iv, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '9px' }}>
                                    <span style={{ color: t.textDim }}>{iv.name}: </span>
                                    <span style={{ color: iv.color, fontWeight: 600 }}>{iv.value}</span>
                                </span>

                                {/* TradingView-style Hover Controls */}
                                <div style={{ display: 'flex', gap: '4px', opacity: 0.6 }}>
                                    {onToggleVisibility && (
                                        <div onClick={(e) => { e.stopPropagation(); onToggleVisibility(iv.indicator) }} style={{ cursor: 'pointer', fontSize: '10px' }} title={iv.indicator.visible ? "Hide" : "Show"}>
                                            {iv.indicator.visible ? '👁️' : '🙈'}
                                        </div>
                                    )}
                                    {onConfigureIndicator && (
                                        <div onClick={(e) => { e.stopPropagation(); onConfigureIndicator(iv.indicator) }} style={{ cursor: 'pointer', fontSize: '10px' }} title="Settings">
                                            ⚙️
                                        </div>
                                    )}
                                    {onRemoveIndicator && (
                                        <div onClick={(e) => { e.stopPropagation(); onRemoveIndicator(iv.indicator) }} style={{ cursor: 'pointer', fontSize: '10px', color: t.red }} title="Remove">
                                            ✕
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

function formatVolume(vol: number): string {
    if (vol >= 10000000) return (vol / 10000000).toFixed(2) + ' Cr'
    if (vol >= 100000) return (vol / 100000).toFixed(2) + ' L'
    if (vol >= 1000) return (vol / 1000).toFixed(1) + ' K'
    return vol.toString()
}
