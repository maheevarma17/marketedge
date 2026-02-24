'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/theme'
import { formatINR } from '@/lib/paper-trading'
import {
    exportTrades, exportJournal, exportAlerts,
    calculateTaxSummary, getMonthlySummaries,
    type TaxSummary, type MonthlySummary,
} from '@/lib/reports'

export default function ReportsPage() {
    const { t } = useTheme()
    const [tab, setTab] = useState<'export' | 'tax' | 'monthly'>('export')
    const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null)
    const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([])
    const [toast, setToast] = useState<string | null>(null)

    const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }
    const card: React.CSSProperties = { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: t.shadow }

    useEffect(() => {
        setTaxSummary(calculateTaxSummary())
        setMonthlySummaries(getMonthlySummaries())
    }, [])

    function showToast(msg: string) {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }

    function handleExport(type: 'trades' | 'journal' | 'alerts') {
        if (type === 'trades') exportTrades()
        else if (type === 'journal') exportJournal()
        else exportAlerts()
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} CSV downloaded!`)
    }

    return (
        <div style={{ padding: '28px' }}>
            {toast && (
                <div style={{
                    position: 'fixed', top: '70px', right: '20px', zIndex: 999,
                    background: t.glass, backdropFilter: 'blur(16px)',
                    border: `1px solid ${t.green}40`, borderRadius: '12px',
                    padding: '12px 20px', fontSize: '13px', color: t.green, fontWeight: 500,
                    boxShadow: '0 8px 32px rgba(0,0,0,.3)',
                }}>{toast}</div>
            )}

            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: t.text, letterSpacing: '-0.03em' }}>Reports & Export</div>
                <div style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>CSV downloads · Tax P&L · Monthly summaries</div>
            </div>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                {([
                    { id: 'export', label: '📥 Export CSV' },
                    { id: 'tax', label: '🏛️ Tax Report' },
                    { id: 'monthly', label: '📅 Monthly Summary' },
                ] as const).map(t2 => (
                    <button key={t2.id} onClick={() => setTab(t2.id)} style={{
                        padding: '7px 16px', borderRadius: '8px', border: 'none', fontSize: '12.5px', fontWeight: 600,
                        cursor: 'pointer', background: tab === t2.id ? t.accent : t.bgInput, color: tab === t2.id ? '#fff' : t.textDim,
                    }}>{t2.label}</button>
                ))}
            </div>

            {/* Export Tab */}
            {tab === 'export' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    {[
                        { type: 'trades', icon: '📈', title: 'Trade History', desc: 'All paper trades with entry/exit prices, P&L, dates. Includes open and closed positions.', color: t.green },
                        { type: 'journal', icon: '📓', title: 'Journal Entries', desc: 'Journal entries with notes, emotions, setup types, ratings, and lessons learned.', color: t.accent },
                        { type: 'alerts', icon: '🔔', title: 'Price Alerts', desc: 'All alerts with conditions, target prices, status, and trigger timestamps.', color: t.yellow },
                    ].map(item => (
                        <div key={item.type} style={card}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: t.text, marginBottom: '6px' }}>{item.title}</div>
                            <div style={{ fontSize: '12px', color: t.textDim, lineHeight: 1.5, marginBottom: '18px', minHeight: '40px' }}>{item.desc}</div>
                            <button onClick={() => handleExport(item.type as 'trades' | 'journal' | 'alerts')} style={{
                                width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                                background: `${item.color}20`, color: item.color, fontSize: '13px', fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s ease',
                            }}>⬇ Download CSV</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Tax Report Tab */}
            {tab === 'tax' && taxSummary && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={card}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Capital Gains Summary (India)</div>
                        {[
                            { label: 'Short-Term Gains (< 1 year)', value: formatINR(taxSummary.shortTermGains), color: taxSummary.shortTermGains >= 0 ? t.green : t.red },
                            { label: 'Long-Term Gains (≥ 1 year)', value: formatINR(taxSummary.longTermGains), color: taxSummary.longTermGains >= 0 ? t.green : t.red },
                            { label: 'Total Gains', value: formatINR(taxSummary.totalGains), color: taxSummary.totalGains >= 0 ? t.green : t.red },
                            { label: 'Total Losses', value: formatINR(taxSummary.totalLosses), color: t.red },
                            { label: 'Net Taxable', value: formatINR(taxSummary.netTaxable), color: taxSummary.netTaxable >= 0 ? t.text : t.green },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${t.border}` }}>
                                <span style={{ fontSize: '12.5px', color: t.textDim }}>{row.label}</span>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: row.color, ...mono }}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                    <div style={card}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Tax Liability (Estimated)</div>
                        {[
                            { label: 'STCG Tax (15%)', value: formatINR(taxSummary.stcgTax), desc: 'On short-term capital gains' },
                            { label: 'LTCG Tax (10% above ₹1L)', value: formatINR(taxSummary.ltcgTax), desc: '₹1,00,000 exemption applied' },
                        ].map(row => (
                            <div key={row.label} style={{ padding: '14px', background: t.bgInput, borderRadius: '10px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{row.label}</span>
                                    <span style={{ fontSize: '18px', fontWeight: 700, color: t.red, ...mono }}>{row.value}</span>
                                </div>
                                <div style={{ fontSize: '10.5px', color: t.textDim }}>{row.desc}</div>
                            </div>
                        ))}
                        <div style={{ padding: '16px', background: `${t.red}10`, borderRadius: '10px', border: `1px solid ${t.red}30`, marginTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>Total Tax</span>
                                <span style={{ fontSize: '24px', fontWeight: 700, color: t.red, ...mono }}>{formatINR(taxSummary.totalTax)}</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '12px', padding: '10px', background: `${t.yellow}10`, borderRadius: '8px', fontSize: '11px', color: t.yellow, lineHeight: 1.5 }}>
                            ⚠️ This is an estimate based on paper trading data. Consult a CA for actual tax filing. Surcharge and cess are not included.
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly Summary Tab */}
            {tab === 'monthly' && (
                <div style={card}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>Monthly Trading Summary</div>
                    {monthlySummaries.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>No closed trades yet. Complete some trades to see monthly summaries!</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Month', 'Trades', 'Wins', 'Losses', 'Win Rate', 'Gross P&L'].map(h => (
                                            <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Month' ? 'left' : 'right', fontSize: '10.5px', fontWeight: 600, color: t.textDim, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${t.border}` }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlySummaries.map(m => (
                                        <tr key={m.month} style={{ borderBottom: `1px solid ${t.border}` }}>
                                            <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: t.text, ...mono }}>{m.month}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: t.text, ...mono }}>{m.trades}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: t.green, ...mono }}>{m.wins}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: t.red, ...mono }}>{m.losses}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: m.winRate >= 50 ? `${t.green}20` : `${t.red}20`, color: m.winRate >= 50 ? t.green : t.red }}>{m.winRate}%</span>
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: m.grossPnL >= 0 ? t.green : t.red, ...mono }}>{m.grossPnL >= 0 ? '+' : ''}{formatINR(m.grossPnL)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
