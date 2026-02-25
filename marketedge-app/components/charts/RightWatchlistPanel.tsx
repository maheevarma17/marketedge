import { useState } from 'react'
import { useTheme } from '@/lib/theme'

const WATCHLIST_SYMBOLS = ['NIFTY 50', 'BANKNIFTY', 'RELIANCE', 'HDFCBANK', 'TCS', 'INFY', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'LARSEN', 'KOTAKBANK']

interface RightWatchlistPanelProps {
    currentSymbol: string
    onSymbolSelect: (symbol: string) => void
}

export default function RightWatchlistPanel({ currentSymbol, onSymbolSelect }: RightWatchlistPanelProps) {
    const { t } = useTheme()
    const mono = { fontFamily: 'JetBrains Mono, monospace' }

    return (
        <div style={{
            width: '240px',
            minWidth: '240px',
            height: '100%',
            background: t.bgCard,
            borderLeft: `1px solid ${t.border}`,
            display: 'flex',
            flexDirection: 'column',
            borderBottomRightRadius: '8px'
        }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.border}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: t.text }}>Watchlist</span>
                <span style={{ fontSize: '11px', color: t.textMuted, cursor: 'pointer' }}>➕ Add Symbol</span>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {WATCHLIST_SYMBOLS.map(sym => {
                        const isSelected = currentSymbol === sym
                        // Simulated data
                        const price = (Math.random() * 2000 + 500).toFixed(2)
                        const changePct = (Math.random() * 4 - 2).toFixed(2)
                        const isUp = parseFloat(changePct) >= 0

                        return (
                            <div
                                key={sym}
                                onClick={() => onSymbolSelect(sym)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '8px 16px', borderBottom: `1px solid ${t.border}20`,
                                    cursor: 'pointer',
                                    background: isSelected ? `${t.accent}15` : 'transparent',
                                    transition: 'background .15s'
                                }}
                            >
                                <span style={{ fontWeight: 700, fontSize: '12px', color: isSelected ? t.accent : t.text, ...mono }}>{sym}</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', ...mono, fontSize: '11px' }}>
                                    <span style={{ color: t.text }}>{price}</span>
                                    <span style={{ color: isUp ? t.green : t.red, width: '45px', textAlign: 'right', fontWeight: 600, background: isUp ? `${t.green}20` : `${t.red}20`, padding: '2px 4px', borderRadius: '3px' }}>
                                        {isUp ? '+' : ''}{changePct}%
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Bottom details panel (simulated) */}
            <div style={{ height: '30%', borderTop: `1px solid ${t.border}40`, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontWeight: 800, fontSize: '16px', color: t.text }}>{currentSymbol}</div>
                <div style={{ fontSize: '11px', color: t.textDim }}>India Stock Exchange</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: t.text, ...mono }}>
                    <span style={{ color: t.textDim }}>Day Range</span>
                    <span>1200.00 - 1245.50</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: t.text, ...mono }}>
                    <span style={{ color: t.textDim }}>52W Range</span>
                    <span>800.00 - 1500.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: t.text, ...mono }}>
                    <span style={{ color: t.textDim }}>Volume</span>
                    <span>1.2M</span>
                </div>
            </div>
        </div>
    )
}
