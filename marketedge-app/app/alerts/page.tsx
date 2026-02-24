'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '@/lib/theme'
import { searchStocks, getQuote, type StockSearchResult } from '@/lib/api'
import {
    getAlerts, createAlert, deleteAlert, clearTriggered, checkAlert, triggerAlert, updateAlertPrice,
    CONDITION_LABELS, type PriceAlert, type AlertCondition,
} from '@/lib/alerts'

export default function AlertsPage() {
    const { t } = useTheme()
    const [alerts, setAlerts] = useState<PriceAlert[]>([])
    const [symbol, setSymbol] = useState('')
    const [condition, setCondition] = useState<AlertCondition>('above')
    const [targetPrice, setTargetPrice] = useState('')
    const [note, setNote] = useState('')
    const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
    const [showSearch, setShowSearch] = useState(false)
    const [tab, setTab] = useState<'active' | 'triggered'>('active')
    const [toast, setToast] = useState<string | null>(null)
    const searchRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }
    const card: React.CSSProperties = { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: t.shadow }

    const reload = useCallback(() => setAlerts(getAlerts()), [])

    useEffect(() => { reload() }, [reload])

    // Click outside search
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    // Poll active alerts every 30s
    useEffect(() => {
        async function checkAlerts() {
            const currentAlerts = getAlerts()
            const activeAlerts = currentAlerts.filter(a => a.status === 'active')
            for (const alert of activeAlerts) {
                try {
                    const q = await getQuote(alert.symbol)
                    updateAlertPrice(alert.id, q.price)
                    if (checkAlert(alert, q.price)) {
                        triggerAlert(alert.id, q.price)
                        setToast(`🔔 Alert triggered: ${alert.symbol} ${CONDITION_LABELS[alert.condition]} ₹${alert.targetPrice}`)
                        setTimeout(() => setToast(null), 5000)
                    }
                } catch { /* skip */ }
            }
            reload()
        }
        checkAlerts()
        pollRef.current = setInterval(checkAlerts, 30000)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [reload])

    async function handleSearch(q: string) {
        setSymbol(q)
        if (q.length >= 1) {
            const results = await searchStocks(q)
            setSearchResults(results)
            setShowSearch(true)
        } else { setSearchResults([]); setShowSearch(false) }
    }

    function selectSymbol(sym: string) {
        setSymbol(sym)
        setShowSearch(false)
        setSearchResults([])
    }

    function handleCreate() {
        if (!symbol || !targetPrice) return
        createAlert(symbol, condition, parseFloat(targetPrice), note)
        setSymbol(''); setTargetPrice(''); setNote('')
        reload()
        setToast('Alert created successfully!')
        setTimeout(() => setToast(null), 3000)
    }

    function handleDelete(id: string) {
        deleteAlert(id)
        reload()
    }

    function handleClearTriggered() {
        clearTriggered()
        reload()
    }

    const activeAlerts = alerts.filter(a => a.status === 'active')
    const triggeredAlerts = alerts.filter(a => a.status === 'triggered')

    return (
        <div style={{ padding: '28px' }}>
            {/* Toast */}
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
                <div style={{ fontSize: '24px', fontWeight: 700, color: t.text, letterSpacing: '-0.03em' }}>
                    Price Alerts
                </div>
                <div style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>
                    Set alerts on stock prices · Auto-check every 30 seconds
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
                {/* Create Alert Form */}
                <div style={card}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '18px' }}>New Alert</div>

                    {/* Symbol */}
                    <div style={{ marginBottom: '14px', position: 'relative' }} ref={searchRef}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.04em' }}>SYMBOL</div>
                        <input value={symbol} onChange={e => handleSearch(e.target.value.toUpperCase())}
                            placeholder="Search stock..."
                            style={{ width: '100%', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '9px 12px', color: t.text, fontSize: '13px', outline: 'none' }} />
                        {showSearch && searchResults.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: t.glass, backdropFilter: 'blur(12px)', border: `1px solid ${t.glassBorder}`, borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.3)' }}>
                                {searchResults.map(s => (
                                    <div key={s.symbol} onClick={() => selectSymbol(s.symbol)}
                                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${t.border}`, transition: '.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = t.bgInput}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <div style={{ fontWeight: 600, color: t.text, fontSize: '12px' }}>{s.symbol}</div>
                                        <div style={{ fontSize: '10px', color: t.textDim }}>{s.name}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Condition */}
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.04em' }}>CONDITION</div>
                        <select value={condition} onChange={e => setCondition(e.target.value as AlertCondition)}
                            style={{ width: '100%', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '9px 12px', color: t.text, fontSize: '13px', outline: 'none' }}>
                            {(Object.keys(CONDITION_LABELS) as AlertCondition[]).map(c => (
                                <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Target Price */}
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.04em' }}>TARGET PRICE (₹)</div>
                        <input type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
                            placeholder="e.g. 2500"
                            style={{ width: '100%', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '9px 12px', color: t.text, fontSize: '13px', ...mono, outline: 'none' }} />
                    </div>

                    {/* Note */}
                    <div style={{ marginBottom: '18px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.04em' }}>NOTE (optional)</div>
                        <input value={note} onChange={e => setNote(e.target.value)}
                            placeholder="Breakout level..."
                            style={{ width: '100%', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '9px 12px', color: t.text, fontSize: '13px', outline: 'none' }} />
                    </div>

                    <button onClick={handleCreate} style={{
                        width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                        background: t.accent, color: '#fff', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s ease',
                    }}>🔔 Create Alert</button>
                </div>

                {/* Alerts List */}
                <div>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                        <button onClick={() => setTab('active')} style={{
                            padding: '7px 16px', borderRadius: '8px', border: 'none', fontSize: '12.5px', fontWeight: 600,
                            cursor: 'pointer', background: tab === 'active' ? t.accent : t.bgInput, color: tab === 'active' ? '#fff' : t.textDim,
                        }}>🟢 Active ({activeAlerts.length})</button>
                        <button onClick={() => setTab('triggered')} style={{
                            padding: '7px 16px', borderRadius: '8px', border: 'none', fontSize: '12.5px', fontWeight: 600,
                            cursor: 'pointer', background: tab === 'triggered' ? t.yellow : t.bgInput, color: tab === 'triggered' ? '#000' : t.textDim,
                        }}>🔔 Triggered ({triggeredAlerts.length})</button>
                        {triggeredAlerts.length > 0 && tab === 'triggered' && (
                            <button onClick={handleClearTriggered} style={{
                                padding: '7px 12px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 600,
                                cursor: 'pointer', background: `${t.red}20`, color: t.red, marginLeft: 'auto',
                            }}>Clear All</button>
                        )}
                    </div>

                    <div style={card}>
                        {(tab === 'active' ? activeAlerts : triggeredAlerts).length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>
                                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{tab === 'active' ? '🔕' : '✅'}</div>
                                <div style={{ fontSize: '13px' }}>{tab === 'active' ? 'No active alerts. Create one!' : 'No triggered alerts.'}</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(tab === 'active' ? activeAlerts : triggeredAlerts).map(alert => (
                                    <div key={alert.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px',
                                        background: t.bgInput, borderRadius: '10px', border: `1px solid ${t.border}`,
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 600, color: t.text, fontSize: '14px' }}>{alert.symbol}</span>
                                                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${t.accent}20`, color: t.accent, fontWeight: 600 }}>
                                                    {CONDITION_LABELS[alert.condition]}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: t.textDim }}>
                                                Target: <span style={{ color: t.text, fontWeight: 600, ...mono }}>₹{alert.targetPrice.toLocaleString('en-IN')}</span>
                                                {alert.currentPrice > 0 && <span style={{ marginLeft: '10px' }}>Current: <span style={{ ...mono, fontWeight: 600 }}>₹{alert.currentPrice.toLocaleString('en-IN')}</span></span>}
                                            </div>
                                            {alert.note && <div style={{ fontSize: '11px', color: t.textDim, marginTop: '3px', fontStyle: 'italic' }}>{alert.note}</div>}
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            {alert.status === 'triggered' && (
                                                <div style={{ fontSize: '10px', color: t.yellow, fontWeight: 600, marginBottom: '4px' }}>
                                                    {new Date(alert.triggeredAt!).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                            <button onClick={() => handleDelete(alert.id)} style={{
                                                padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '11px',
                                                cursor: 'pointer', background: `${t.red}20`, color: t.red, fontWeight: 600,
                                            }}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
