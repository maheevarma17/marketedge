'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/theme'
import { formatINR } from '@/lib/paper-trading'
import {
    calculatePositionSize, stopLossPercentage, stopLossATR, stopLossFixed,
    kellyCriterion, calculateMargin, riskRewardData,
} from '@/lib/risk-calculator'

export default function CalculatorPage() {
    const { t } = useTheme()
    const [tab, setTab] = useState<'position' | 'stoploss' | 'rr' | 'margin' | 'kelly'>('position')

    // Position sizing
    const [capital, setCapital] = useState('1000000')
    const [riskPct, setRiskPct] = useState('2')
    const [entry, setEntry] = useState('2500')
    const [sl, setSl] = useState('2400')
    const [tp, setTp] = useState('2700')

    // Stop Loss
    const [slEntry, setSlEntry] = useState('2500')
    const [slPct, setSlPct] = useState('3')
    const [slAtr, setSlAtr] = useState('50')
    const [slAtrMult, setSlAtrMult] = useState('2')
    const [slFixed, setSlFixed] = useState('100')

    // Margin
    const [mPrice, setMPrice] = useState('2500')
    const [mQty, setMQty] = useState('100')
    const [mMarginPct, setMMarginPct] = useState('20')

    // Kelly
    const [kWinRate, setKWinRate] = useState('55')
    const [kAvgWin, setKAvgWin] = useState('5000')
    const [kAvgLoss, setKAvgLoss] = useState('3000')

    const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }
    const card: React.CSSProperties = { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: t.shadow }
    const inputStyle: React.CSSProperties = { width: '100%', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '9px 12px', color: t.text, fontSize: '13px', ...mono, outline: 'none' }
    const labelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '4px', letterSpacing: '0.04em' }

    const posResult = calculatePositionSize(parseFloat(capital) || 0, parseFloat(riskPct) || 0, parseFloat(entry) || 0, parseFloat(sl) || 0, parseFloat(tp) || undefined)
    const rrData = riskRewardData(parseFloat(entry) || 0, parseFloat(sl) || 0, parseFloat(tp) || 0)
    const marginResult = calculateMargin(parseFloat(mPrice) || 0, parseInt(mQty) || 0, parseFloat(mMarginPct) || 20)
    const kellyResult = kellyCriterion(parseFloat(kWinRate) || 0, parseFloat(kAvgWin) || 0, parseFloat(kAvgLoss) || 0)

    const slPctResult = stopLossPercentage(parseFloat(slEntry) || 0, parseFloat(slPct) || 0)
    const slAtrResult = stopLossATR(parseFloat(slEntry) || 0, parseFloat(slAtr) || 0, parseFloat(slAtrMult) || 2)
    const slFixedResult = stopLossFixed(parseFloat(slEntry) || 0, parseFloat(slFixed) || 0)

    return (
        <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: t.text, letterSpacing: '-0.03em' }}>Risk Calculator</div>
                <div style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>Position sizing · Stop-loss · Risk/Reward · Margin · Kelly Criterion</div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {([
                    { id: 'position', label: '📐 Position Size' },
                    { id: 'stoploss', label: '🛑 Stop Loss' },
                    { id: 'rr', label: '⚖️ Risk/Reward' },
                    { id: 'margin', label: '💳 Margin' },
                    { id: 'kelly', label: '🎯 Kelly' },
                ] as const).map(t2 => (
                    <button key={t2.id} onClick={() => setTab(t2.id)} style={{
                        padding: '7px 16px', borderRadius: '8px', border: 'none', fontSize: '12.5px', fontWeight: 600,
                        cursor: 'pointer', background: tab === t2.id ? t.accent : t.bgInput, color: tab === t2.id ? '#fff' : t.textDim,
                    }}>{t2.label}</button>
                ))}
            </div>

            {/* Position Sizing */}
            {tab === 'position' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={card}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '18px' }}>Inputs</div>
                        <div style={{ display: 'grid', gap: '14px' }}>
                            <div><div style={labelStyle}>TOTAL CAPITAL (₹)</div><input value={capital} onChange={e => setCapital(e.target.value)} style={inputStyle} /></div>
                            <div><div style={labelStyle}>RISK PER TRADE (%)</div><input value={riskPct} onChange={e => setRiskPct(e.target.value)} style={inputStyle} /></div>
                            <div><div style={labelStyle}>ENTRY PRICE (₹)</div><input value={entry} onChange={e => setEntry(e.target.value)} style={inputStyle} /></div>
                            <div><div style={labelStyle}>STOP LOSS (₹)</div><input value={sl} onChange={e => setSl(e.target.value)} style={inputStyle} /></div>
                            <div><div style={labelStyle}>TAKE PROFIT (₹)</div><input value={tp} onChange={e => setTp(e.target.value)} style={inputStyle} /></div>
                        </div>
                    </div>
                    <div style={card}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '18px' }}>Results</div>
                        {[
                            { label: 'Recommended Shares', value: posResult.shares.toString(), color: t.accent },
                            { label: 'Total Cost', value: formatINR(posResult.totalCost), color: t.text },
                            { label: 'Max Risk Amount', value: formatINR(posResult.maxLoss), color: t.red },
                            { label: 'Risk Per Share', value: `₹${posResult.riskPerShare.toFixed(2)}`, color: t.red },
                            { label: 'Potential Reward', value: formatINR(posResult.takeProfitValue), color: t.green },
                            { label: 'Risk/Reward Ratio', value: `1:${posResult.riskRewardRatio}`, color: posResult.riskRewardRatio >= 2 ? t.green : t.yellow },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${t.border}` }}>
                                <span style={{ fontSize: '12.5px', color: t.textDim }}>{row.label}</span>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: row.color, ...mono }}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stop Loss */}
            {tab === 'stoploss' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div style={card}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '14px' }}>📊 Percentage</div>
                        <div style={{ marginBottom: '12px' }}><div style={labelStyle}>ENTRY PRICE</div><input value={slEntry} onChange={e => setSlEntry(e.target.value)} style={inputStyle} /></div>
                        <div style={{ marginBottom: '16px' }}><div style={labelStyle}>STOP LOSS %</div><input value={slPct} onChange={e => setSlPct(e.target.value)} style={inputStyle} /></div>
                        <div style={{ padding: '14px', background: `${t.red}15`, borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: t.textDim, marginBottom: '4px' }}>STOP LOSS PRICE</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: t.red, ...mono }}>₹{slPctResult.toFixed(2)}</div>
                        </div>
                    </div>
                    <div style={card}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '14px' }}>📈 ATR Based</div>
                        <div style={{ marginBottom: '12px' }}><div style={labelStyle}>ATR VALUE</div><input value={slAtr} onChange={e => setSlAtr(e.target.value)} style={inputStyle} /></div>
                        <div style={{ marginBottom: '16px' }}><div style={labelStyle}>MULTIPLIER</div><input value={slAtrMult} onChange={e => setSlAtrMult(e.target.value)} style={inputStyle} /></div>
                        <div style={{ padding: '14px', background: `${t.red}15`, borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: t.textDim, marginBottom: '4px' }}>STOP LOSS PRICE</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: t.red, ...mono }}>₹{slAtrResult.toFixed(2)}</div>
                        </div>
                    </div>
                    <div style={card}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '14px' }}>🔢 Fixed Points</div>
                        <div style={{ marginBottom: '12px' }}><div style={labelStyle}>ENTRY PRICE</div><input value={slEntry} readOnly style={{ ...inputStyle, opacity: 0.6 }} /></div>
                        <div style={{ marginBottom: '16px' }}><div style={labelStyle}>POINTS</div><input value={slFixed} onChange={e => setSlFixed(e.target.value)} style={inputStyle} /></div>
                        <div style={{ padding: '14px', background: `${t.red}15`, borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: t.textDim, marginBottom: '4px' }}>STOP LOSS PRICE</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: t.red, ...mono }}>₹{slFixedResult.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Risk/Reward */}
            {tab === 'rr' && (
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
                    <div style={card}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Parameters</div>
                        <div style={{ display: 'grid', gap: '14px' }}>
                            <div><div style={labelStyle}>ENTRY PRICE</div><input value={entry} onChange={e => setEntry(e.target.value)} style={inputStyle} /></div>
                            <div><div style={labelStyle}>STOP LOSS</div><input value={sl} onChange={e => setSl(e.target.value)} style={inputStyle} /></div>
                            <div><div style={labelStyle}>TAKE PROFIT</div><input value={tp} onChange={e => setTp(e.target.value)} style={inputStyle} /></div>
                        </div>
                    </div>
                    <div style={card}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Risk/Reward Visualization</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '48px', fontWeight: 700, color: rrData.ratio >= 2 ? t.green : rrData.ratio >= 1 ? t.yellow : t.red, ...mono }}>1:{rrData.ratio}</div>
                            <div style={{ fontSize: '13px', color: t.textDim }}>
                                {rrData.ratio >= 3 ? '🏆 Excellent trade setup' : rrData.ratio >= 2 ? '✅ Good risk/reward' : rrData.ratio >= 1 ? '⚠️ Acceptable' : '❌ Poor setup — consider adjusting'}
                            </div>
                        </div>
                        {/* Visual bar */}
                        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', height: '36px', marginBottom: '16px' }}>
                            <div style={{ flex: rrData.risk, background: `${t.red}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#fff' }}>
                                Risk: {rrData.riskPct}%
                            </div>
                            <div style={{ flex: rrData.reward, background: `${t.green}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#fff' }}>
                                Reward: {rrData.rewardPct}%
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div style={{ padding: '14px', background: t.bgInput, borderRadius: '10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: t.textDim, marginBottom: '4px' }}>RISK</div>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: t.red, ...mono }}>₹{rrData.risk.toFixed(0)}</div>
                            </div>
                            <div style={{ padding: '14px', background: t.bgInput, borderRadius: '10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: t.textDim, marginBottom: '4px' }}>ENTRY</div>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: t.text, ...mono }}>₹{entry}</div>
                            </div>
                            <div style={{ padding: '14px', background: t.bgInput, borderRadius: '10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: t.textDim, marginBottom: '4px' }}>REWARD</div>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: t.green, ...mono }}>₹{rrData.reward.toFixed(0)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Margin */}
            {tab === 'margin' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={card}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Inputs</div>
                        <div style={{ display: 'grid', gap: '14px' }}>
                            <div><div style={labelStyle}>STOCK PRICE (₹)</div><input value={mPrice} onChange={e => setMPrice(e.target.value)} style={inputStyle} /></div>
                            <div><div style={labelStyle}>QUANTITY</div><input value={mQty} onChange={e => setMQty(e.target.value)} style={inputStyle} /></div>
                            <div><div style={labelStyle}>MARGIN % (NRML ~20%)</div><input value={mMarginPct} onChange={e => setMMarginPct(e.target.value)} style={inputStyle} /></div>
                        </div>
                    </div>
                    <div style={card}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Results</div>
                        {[
                            { label: 'Total Exposure', value: formatINR(marginResult.exposureValue), color: t.text },
                            { label: 'Required Margin', value: formatINR(marginResult.requiredMargin), color: t.accent },
                            { label: 'Leverage', value: `${marginResult.leverageRatio}x`, color: t.yellow },
                            { label: 'Margin %', value: `${marginResult.marginPct}%`, color: t.textDim },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${t.border}` }}>
                                <span style={{ fontSize: '13px', color: t.textDim }}>{row.label}</span>
                                <span style={{ fontSize: '20px', fontWeight: 700, color: row.color, ...mono }}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Kelly */}
            {tab === 'kelly' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={card}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Kelly Criterion Inputs</div>
                        <div style={{ display: 'grid', gap: '14px' }}>
                            <div><div style={labelStyle}>WIN RATE (%)</div><input value={kWinRate} onChange={e => setKWinRate(e.target.value)} style={inputStyle} /></div>
                            <div><div style={labelStyle}>AVERAGE WIN (₹)</div><input value={kAvgWin} onChange={e => setKAvgWin(e.target.value)} style={inputStyle} /></div>
                            <div><div style={labelStyle}>AVERAGE LOSS (₹)</div><input value={kAvgLoss} onChange={e => setKAvgLoss(e.target.value)} style={inputStyle} /></div>
                        </div>
                        <div style={{ marginTop: '16px', padding: '12px', background: `${t.accent}10`, borderRadius: '10px', fontSize: '11.5px', color: t.textDim, lineHeight: 1.6 }}>
                            💡 The Kelly Criterion suggests the optimal fraction of capital to risk on each trade to maximize long-term growth. Most traders use half-Kelly (50%) for safety.
                        </div>
                    </div>
                    <div style={card}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Optimal Bet Size</div>
                        <div style={{ textAlign: 'center', padding: '30px 0' }}>
                            <div style={{ fontSize: '56px', fontWeight: 700, color: kellyResult > 0 ? t.green : t.red, ...mono }}>{kellyResult}%</div>
                            <div style={{ fontSize: '13px', color: t.textDim, marginTop: '8px' }}>Full Kelly of capital per trade</div>
                            <div style={{ fontSize: '24px', fontWeight: 600, color: t.yellow, ...mono, marginTop: '16px' }}>{(kellyResult / 2).toFixed(2)}%</div>
                            <div style={{ fontSize: '12px', color: t.textDim, marginTop: '4px' }}>Half Kelly (recommended)</div>
                        </div>
                        <div style={{ padding: '12px', background: t.bgInput, borderRadius: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                                <span style={{ fontSize: '12px', color: t.textDim }}>On ₹10L capital (Full Kelly)</span>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: t.text, ...mono }}>{formatINR(1000000 * kellyResult / 100)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                                <span style={{ fontSize: '12px', color: t.textDim }}>On ₹10L capital (Half Kelly)</span>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: t.text, ...mono }}>{formatINR(1000000 * kellyResult / 200)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
