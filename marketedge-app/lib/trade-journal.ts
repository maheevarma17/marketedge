// ──────────────────────────────────────────────
// Trade Journal Engine — localStorage based
// ──────────────────────────────────────────────

export type TradeEmotion = 'confident' | 'fearful' | 'greedy' | 'disciplined' | 'impulsive' | 'calm' | 'neutral'
export type SetupType = 'breakout' | 'reversal' | 'momentum' | 'scalp' | 'swing' | 'gap' | 'earnings' | 'support_resistance' | 'trend_follow' | 'other'

export interface JournalEntry {
    id: string
    tradeId: string | null      // linked paper trade
    symbol: string
    side: 'BUY' | 'SELL'
    entryPrice: number
    exitPrice: number | null
    qty: number
    pnl: number | null
    date: string
    notes: string
    tags: string[]
    emotion: TradeEmotion
    setup: SetupType
    rating: number              // 1-5 self-rating
    lessons: string
    createdAt: string
    updatedAt: string
}

const STORAGE_KEY = 'marketedge_journal'

function generateId(): string {
    return 'je_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ── CRUD ──

export function getJournal(): JournalEntry[] {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
}

function saveJournal(entries: JournalEntry[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): JournalEntry {
    const now = new Date().toISOString()
    const journalEntry: JournalEntry = {
        ...entry,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
    }

    const entries = getJournal()
    entries.unshift(journalEntry)
    saveJournal(entries)
    return journalEntry
}

export function updateJournalEntry(id: string, updates: Partial<JournalEntry>): JournalEntry | null {
    const entries = getJournal()
    const idx = entries.findIndex(e => e.id === id)
    if (idx === -1) return null

    entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() }
    saveJournal(entries)
    return entries[idx]
}

export function deleteJournalEntry(id: string): void {
    const entries = getJournal().filter(e => e.id !== id)
    saveJournal(entries)
}

// ── Auto-import from paper trading ──

export function getImportedTradeIds(): Set<string> {
    const entries = getJournal()
    return new Set(entries.filter(e => e.tradeId).map(e => e.tradeId!))
}

// ── Stats by setup type ──

export function getStatsBySetup(): Record<SetupType, { trades: number; wins: number; totalPnL: number; avgPnL: number }> {
    const entries = getJournal().filter(e => e.pnl !== null)
    const stats: Record<string, { trades: number; wins: number; totalPnL: number }> = {}

    entries.forEach(e => {
        if (!stats[e.setup]) stats[e.setup] = { trades: 0, wins: 0, totalPnL: 0 }
        stats[e.setup].trades++
        stats[e.setup].totalPnL += e.pnl || 0
        if ((e.pnl || 0) > 0) stats[e.setup].wins++
    })

    const result: Record<string, { trades: number; wins: number; totalPnL: number; avgPnL: number }> = {}
    for (const [key, val] of Object.entries(stats)) {
        result[key] = { ...val, avgPnL: val.trades > 0 ? val.totalPnL / val.trades : 0 }
    }
    return result as Record<SetupType, { trades: number; wins: number; totalPnL: number; avgPnL: number }>
}

// ── Stats by emotion ──

export function getStatsByEmotion(): Record<TradeEmotion, { trades: number; wins: number; totalPnL: number }> {
    const entries = getJournal().filter(e => e.pnl !== null)
    const stats: Record<string, { trades: number; wins: number; totalPnL: number }> = {}

    entries.forEach(e => {
        if (!stats[e.emotion]) stats[e.emotion] = { trades: 0, wins: 0, totalPnL: 0 }
        stats[e.emotion].trades++
        stats[e.emotion].totalPnL += e.pnl || 0
        if ((e.pnl || 0) > 0) stats[e.emotion].wins++
    })

    return stats as Record<TradeEmotion, { trades: number; wins: number; totalPnL: number }>
}

// ── Labels ──

export const EMOTION_LABELS: Record<TradeEmotion, { label: string; emoji: string }> = {
    confident: { label: 'Confident', emoji: '💪' },
    fearful: { label: 'Fearful', emoji: '😰' },
    greedy: { label: 'Greedy', emoji: '🤑' },
    disciplined: { label: 'Disciplined', emoji: '🎯' },
    impulsive: { label: 'Impulsive', emoji: '⚡' },
    calm: { label: 'Calm', emoji: '😌' },
    neutral: { label: 'Neutral', emoji: '😐' },
}

export const SETUP_LABELS: Record<SetupType, string> = {
    breakout: 'Breakout',
    reversal: 'Reversal',
    momentum: 'Momentum',
    scalp: 'Scalp',
    swing: 'Swing',
    gap: 'Gap Play',
    earnings: 'Earnings',
    support_resistance: 'S/R Bounce',
    trend_follow: 'Trend Follow',
    other: 'Other',
}
