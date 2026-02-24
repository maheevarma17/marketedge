'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/theme'
import { getPortfolio, formatINR, type PaperTrade } from '@/lib/paper-trading'
import {
    getJournal, createJournalEntry, deleteJournalEntry, getImportedTradeIds,
    getStatsBySetup, getStatsByEmotion,
    EMOTION_LABELS, SETUP_LABELS,
    type JournalEntry, type TradeEmotion, type SetupType,
} from '@/lib/trade-journal'

export default function JournalPage() {
    const { t } = useTheme()
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [unimported, setUnimported] = useState<PaperTrade[]>([])
    const [tab, setTab] = useState<'entries' | 'import' | 'stats'>('entries')
    const [filterSetup, setFilterSetup] = useState<SetupType | 'all'>('all')
    const [showAdd, setShowAdd] = useState(false)

    // New entry form
    const [newSymbol, setNewSymbol] = useState('')
    const [newSide, setNewSide] = useState<'BUY' | 'SELL'>('BUY')
    const [newEntry, setNewEntry] = useState('')
    const [newExit, setNewExit] = useState('')
    const [newQty, setNewQty] = useState('10')
    const [newNotes, setNewNotes] = useState('')
    const [newEmotion, setNewEmotion] = useState<TradeEmotion>('neutral')
    const [newSetup, setNewSetup] = useState<SetupType>('other')
    const [newRating, setNewRating] = useState(3)
    const [newLessons, setNewLessons] = useState('')

    const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }
    const card: React.CSSProperties = { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: t.shadow }
    const inputStyle: React.CSSProperties = { width: '100%', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '9px 12px', color: t.text, fontSize: '13px', outline: 'none' }

    function reload() {
        setEntries(getJournal())
        const imported = getImportedTradeIds()
        const portfolio = getPortfolio()
        setUnimported(portfolio.trades.filter(tr => tr.status === 'CLOSED' && !imported.has(tr.id)))
    }

    useEffect(() => { reload() }, [])

    function importTrade(trade: PaperTrade) {
        createJournalEntry({
            tradeId: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            qty: trade.qty,
            pnl: trade.pnl,
            date: trade.closedAt || trade.createdAt,
            notes: '',
            tags: [],
            emotion: 'neutral',
            setup: 'other',
            rating: 3,
            lessons: '',
        })
        reload()
    }

    function importAll() {
        unimported.forEach(trade => importTrade(trade))
    }

    function handleAddManual() {
        const ep = parseFloat(newEntry); const xp = parseFloat(newExit); const q = parseInt(newQty)
        if (!newSymbol || !ep) return
        const pnl = xp && q ? (newSide === 'BUY' ? (xp - ep) * q : (ep - xp) * q) : null
        createJournalEntry({
            tradeId: null, symbol: newSymbol.toUpperCase(), side: newSide,
            entryPrice: ep, exitPrice: xp || null, qty: q || 0, pnl,
            date: new Date().toISOString(), notes: newNotes, tags: [],
            emotion: newEmotion, setup: newSetup, rating: newRating, lessons: newLessons,
        })
        setShowAdd(false); setNewSymbol(''); setNewEntry(''); setNewExit(''); setNewNotes(''); setNewLessons('')
        reload()
    }

    function handleDelete(id: string) { deleteJournalEntry(id); reload() }

    const filteredEntries = filterSetup === 'all' ? entries : entries.filter(e => e.setup === filterSetup)
    const setupStats = getStatsBySetup()
    const emotionStats = getStatsByEmotion()

    return (
        <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: t.text, letterSpacing: '-0.03em' }}>Trade Journal</div>
                    <div style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>
                        {entries.length} entries · Track emotions, setups & lessons
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowAdd(!showAdd)} style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '12.5px', fontWeight: 600,
                        cursor: 'pointer', background: t.accent, color: '#fff',
                    }}>+ New Entry</button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {(['entries', 'import', 'stats'] as const).map(t2 => (
                    <button key={t2} onClick={() => setTab(t2)} style={{
                        padding: '7px 16px', borderRadius: '8px', border: 'none', fontSize: '12.5px', fontWeight: 600,
                        cursor: 'pointer', background: tab === t2 ? t.accent : t.bgInput, color: tab === t2 ? '#fff' : t.textDim,
                    }}>
                        {t2 === 'entries' ? `📓 Entries (${entries.length})` : t2 === 'import' ? `📥 Import (${unimported.length})` : '📊 Statistics'}
                    </button>
                ))}
            </div>

            {/* Add Manual Entry Form */}
            {showAdd && (
                <div style={{ ...card, marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>New Journal Entry</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        <div><div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '4px' }}>SYMBOL</div>
                            <input value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder="RELIANCE" style={inputStyle} /></div>
                        <div><div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '4px' }}>SIDE</div>
                            <select value={newSide} onChange={e => setNewSide(e.target.value as 'BUY' | 'SELL')} style={inputStyle}>
                                <option value="BUY">BUY</option><option value="SELL">SELL</option>
                            </select></div>
                        <div><div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '4px' }}>ENTRY ₹</div>
                            <input type="number" value={newEntry} onChange={e => setNewEntry(e.target.value)} style={{ ...inputStyle, ...mono }} /></div>
                        <div><div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '4px' }}>EXIT ₹</div>
                            <input type="number" value={newExit} onChange={e => setNewExit(e.target.value)} style={{ ...inputStyle, ...mono }} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        <div><div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '4px' }}>QTY</div>
                            <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} style={{ ...inputStyle, ...mono }} /></div>
                        <div><div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '4px' }}>SETUP</div>
                            <select value={newSetup} onChange={e => setNewSetup(e.target.value as SetupType)} style={inputStyle}>
                                {(Object.keys(SETUP_LABELS) as SetupType[]).map(s => <option key={s} value={s}>{SETUP_LABELS[s]}</option>)}
                            </select></div>
                        <div><div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '4px' }}>EMOTION</div>
                            <select value={newEmotion} onChange={e => setNewEmotion(e.target.value as TradeEmotion)} style={inputStyle}>
                                {(Object.keys(EMOTION_LABELS) as TradeEmotion[]).map(em => <option key={em} value={em}>{EMOTION_LABELS[em].emoji} {EMOTION_LABELS[em].label}</option>)}
                            </select></div>
                        <div><div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '4px' }}>RATING</div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                                {[1, 2, 3, 4, 5].map(r => (
                                    <span key={r} onClick={() => setNewRating(r)} style={{ cursor: 'pointer', fontSize: '18px', opacity: r <= newRating ? 1 : 0.2 }}>★</span>
                                ))}
                            </div></div>
                    </div>
                    <div style={{ marginBottom: '14px' }}><div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '4px' }}>NOTES</div>
                        <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2} placeholder="What was your thesis?" style={{ ...inputStyle, resize: 'vertical' }} /></div>
                    <div style={{ marginBottom: '14px' }}><div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '4px' }}>LESSONS LEARNED</div>
                        <textarea value={newLessons} onChange={e => setNewLessons(e.target.value)} rows={2} placeholder="What would you do differently?" style={{ ...inputStyle, resize: 'vertical' }} /></div>
                    <button onClick={handleAddManual} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: t.accent, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save Entry</button>
                </div>
            )}

            {/* Entries Tab */}
            {tab === 'entries' && (
                <div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        <button onClick={() => setFilterSetup('all')} style={{
                            padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '10.5px', fontWeight: 600,
                            cursor: 'pointer', background: filterSetup === 'all' ? t.yellow : t.bgInput, color: filterSetup === 'all' ? '#000' : t.textDim,
                        }}>All</button>
                        {(Object.keys(SETUP_LABELS) as SetupType[]).map(s => (
                            <button key={s} onClick={() => setFilterSetup(s)} style={{
                                padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '10.5px', fontWeight: 600,
                                cursor: 'pointer', background: filterSetup === s ? t.yellow : t.bgInput, color: filterSetup === s ? '#000' : t.textDim,
                            }}>{SETUP_LABELS[s]}</button>
                        ))}
                    </div>
                    {filteredEntries.length === 0 ? (
                        <div style={{ ...card, textAlign: 'center', padding: '50px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📓</div>
                            <div style={{ color: t.textDim, fontSize: '13px' }}>No journal entries yet. Import trades or add manually!</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredEntries.map(entry => (
                                <div key={entry.id} style={{ ...card, padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 600, color: t.text, fontSize: '14px' }}>{entry.symbol}</span>
                                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: entry.side === 'BUY' ? `${t.green}20` : `${t.red}20`, color: entry.side === 'BUY' ? t.green : t.red }}>{entry.side}</span>
                                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: `${t.accent}15`, color: t.accent }}>{SETUP_LABELS[entry.setup]}</span>
                                        <span style={{ fontSize: '12px' }}>{EMOTION_LABELS[entry.emotion].emoji}</span>
                                        <span style={{ fontSize: '12px', color: t.yellow }}>{'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: t.textDim, ...mono }}>
                                            {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                                        </span>
                                        <button onClick={() => handleDelete(entry.id)} style={{ padding: '3px 8px', borderRadius: '4px', border: 'none', fontSize: '10px', cursor: 'pointer', background: `${t.red}15`, color: t.red }}>✕</button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: t.textDim, marginBottom: '6px' }}>
                                        <span>Entry: <span style={{ color: t.text, ...mono }}>₹{entry.entryPrice.toLocaleString('en-IN')}</span></span>
                                        {entry.exitPrice && <span>Exit: <span style={{ color: t.text, ...mono }}>₹{entry.exitPrice.toLocaleString('en-IN')}</span></span>}
                                        <span>Qty: <span style={{ color: t.text, ...mono }}>{entry.qty}</span></span>
                                        {entry.pnl !== null && <span>P&L: <span style={{ fontWeight: 600, color: entry.pnl >= 0 ? t.green : t.red, ...mono }}>{entry.pnl >= 0 ? '+' : ''}{formatINR(entry.pnl)}</span></span>}
                                    </div>
                                    {entry.notes && <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '4px' }}>{entry.notes}</div>}
                                    {entry.lessons && <div style={{ fontSize: '11px', color: t.textDim, marginTop: '4px', fontStyle: 'italic' }}>💡 {entry.lessons}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Import Tab */}
            {tab === 'import' && (
                <div style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>Unimported Trades ({unimported.length})</div>
                        {unimported.length > 0 && (
                            <button onClick={importAll} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: t.accent, color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Import All</button>
                        )}
                    </div>
                    {unimported.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: t.textDim, fontSize: '13px' }}>All closed trades have been imported! ✅</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {unimported.map(trade => (
                                <div key={trade.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: t.bgInput, borderRadius: '10px' }}>
                                    <span style={{ fontWeight: 600, color: t.text, fontSize: '13px', width: '80px' }}>{trade.symbol}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: trade.side === 'BUY' ? t.green : t.red }}>{trade.side}</span>
                                    <span style={{ fontSize: '11px', color: t.textDim, ...mono }}>₹{trade.entryPrice} → ₹{trade.exitPrice}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: (trade.pnl || 0) >= 0 ? t.green : t.red, ...mono }}>{(trade.pnl || 0) >= 0 ? '+' : ''}{formatINR(trade.pnl || 0)}</span>
                                    <button onClick={() => importTrade(trade)} style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '6px', border: 'none', background: `${t.accent}20`, color: t.accent, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Import</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Stats Tab */}
            {tab === 'stats' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={card}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '14px' }}>P&L by Setup Type</div>
                        {Object.entries(setupStats).length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: t.textDim, fontSize: '12px' }}>Need journal entries with P&L data</div>
                        ) : Object.entries(setupStats).map(([setup, stats]) => (
                            <div key={setup} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
                                <div>
                                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: t.text }}>{SETUP_LABELS[setup as SetupType]}</span>
                                    <span style={{ fontSize: '10px', color: t.textDim, marginLeft: '8px' }}>{stats.trades} trades · {stats.wins} wins</span>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: stats.totalPnL >= 0 ? t.green : t.red, ...mono }}>{stats.totalPnL >= 0 ? '+' : ''}{formatINR(stats.totalPnL)}</span>
                            </div>
                        ))}
                    </div>
                    <div style={card}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '14px' }}>P&L by Emotion</div>
                        {Object.entries(emotionStats).length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: t.textDim, fontSize: '12px' }}>Need journal entries with P&L data</div>
                        ) : Object.entries(emotionStats).map(([emotion, stats]) => (
                            <div key={emotion} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
                                <div>
                                    <span style={{ fontSize: '14px', marginRight: '6px' }}>{EMOTION_LABELS[emotion as TradeEmotion].emoji}</span>
                                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: t.text }}>{EMOTION_LABELS[emotion as TradeEmotion].label}</span>
                                    <span style={{ fontSize: '10px', color: t.textDim, marginLeft: '8px' }}>{stats.trades} trades</span>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: stats.totalPnL >= 0 ? t.green : t.red, ...mono }}>{stats.totalPnL >= 0 ? '+' : ''}{formatINR(stats.totalPnL)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
