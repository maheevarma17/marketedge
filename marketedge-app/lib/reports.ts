// ──────────────────────────────────────────────
// Export & Reports Engine
// ──────────────────────────────────────────────

import { getPortfolio, getPortfolioStats, formatINR, type PaperTrade } from './paper-trading'
import { getJournal, type JournalEntry } from './trade-journal'
import { getAlerts, type PriceAlert } from './alerts'

// ── CSV Export ──

function toCSV(headers: string[], rows: string[][]): string {
    const escape = (s: string) => `"${String(s).replace(/"/g, '""')}"`
    const lines = [headers.map(escape).join(',')]
    rows.forEach(row => lines.push(row.map(escape).join(',')))
    return lines.join('\n')
}

function downloadCSV(filename: string, csv: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
}

export function exportTrades() {
    const portfolio = getPortfolio()
    const headers = ['ID', 'Symbol', 'Name', 'Side', 'Qty', 'Entry Price', 'Exit Price', 'P&L', 'P&L %', 'Status', 'Product', 'Created', 'Closed']
    const rows = portfolio.trades.map(t => [
        t.id, t.symbol, t.name, t.side, String(t.qty), String(t.entryPrice),
        t.exitPrice !== null ? String(t.exitPrice) : '', t.pnl !== null ? String(t.pnl) : '',
        t.pnlPct !== null ? String(t.pnlPct) : '', t.status, t.product, t.createdAt, t.closedAt || '',
    ])
    downloadCSV(`marketedge_trades_${new Date().toISOString().split('T')[0]}.csv`, toCSV(headers, rows))
}

export function exportJournal() {
    const entries = getJournal()
    const headers = ['Symbol', 'Side', 'Entry', 'Exit', 'Qty', 'P&L', 'Setup', 'Emotion', 'Rating', 'Notes', 'Lessons', 'Date']
    const rows = entries.map(e => [
        e.symbol, e.side, String(e.entryPrice), e.exitPrice !== null ? String(e.exitPrice) : '',
        String(e.qty), e.pnl !== null ? String(e.pnl) : '', e.setup, e.emotion,
        String(e.rating), e.notes, e.lessons, e.date,
    ])
    downloadCSV(`marketedge_journal_${new Date().toISOString().split('T')[0]}.csv`, toCSV(headers, rows))
}

export function exportAlerts() {
    const alerts = getAlerts()
    const headers = ['Symbol', 'Condition', 'Target Price', 'Status', 'Note', 'Created', 'Triggered']
    const rows = alerts.map(a => [
        a.symbol, a.condition, String(a.targetPrice), a.status, a.note, a.createdAt, a.triggeredAt || '',
    ])
    downloadCSV(`marketedge_alerts_${new Date().toISOString().split('T')[0]}.csv`, toCSV(headers, rows))
}

// ── Tax P&L Report ──

export interface TaxSummary {
    shortTermGains: number      // held < 1 year
    longTermGains: number       // held >= 1 year
    totalGains: number
    totalLosses: number
    netTaxable: number
    stcgTax: number             // 15% STCG
    ltcgTax: number             // 10% LTCG above ₹1L
    totalTax: number
    trades: PaperTrade[]
}

export function calculateTaxSummary(): TaxSummary {
    const portfolio = getPortfolio()
    const closedTrades = portfolio.trades.filter(t => t.status === 'CLOSED' && t.pnl !== null)

    let shortTermGains = 0, longTermGains = 0, totalLosses = 0

    closedTrades.forEach(t => {
        const holdDays = t.closedAt ? (new Date(t.closedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0
        const pnl = t.pnl || 0
        if (pnl >= 0) {
            if (holdDays < 365) shortTermGains += pnl
            else longTermGains += pnl
        } else {
            totalLosses += pnl
        }
    })

    const totalGains = shortTermGains + longTermGains
    const netTaxable = totalGains + totalLosses
    const stcgTax = shortTermGains > 0 ? shortTermGains * 0.15 : 0
    const ltcgExempt = 100000 // ₹1L exemption
    const ltcgTax = longTermGains > ltcgExempt ? (longTermGains - ltcgExempt) * 0.10 : 0
    const totalTax = stcgTax + ltcgTax

    return {
        shortTermGains, longTermGains, totalGains, totalLosses, netTaxable,
        stcgTax: parseFloat(stcgTax.toFixed(2)),
        ltcgTax: parseFloat(ltcgTax.toFixed(2)),
        totalTax: parseFloat(totalTax.toFixed(2)),
        trades: closedTrades,
    }
}

// ── Monthly Summary ──

export interface MonthlySummary {
    month: string
    trades: number
    wins: number
    losses: number
    grossPnL: number
    winRate: number
}

export function getMonthlySummaries(): MonthlySummary[] {
    const portfolio = getPortfolio()
    const closedTrades = portfolio.trades.filter(t => t.status === 'CLOSED' && t.pnl !== null)

    const monthMap = new Map<string, { trades: number; wins: number; losses: number; pnl: number }>()
    closedTrades.forEach(t => {
        const d = new Date(t.closedAt || t.createdAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const existing = monthMap.get(key) || { trades: 0, wins: 0, losses: 0, pnl: 0 }
        existing.trades++
        existing.pnl += t.pnl || 0
        if ((t.pnl || 0) > 0) existing.wins++
        else existing.losses++
        monthMap.set(key, existing)
    })

    const summaries: MonthlySummary[] = []
    for (const [month, data] of monthMap) {
        summaries.push({
            month,
            trades: data.trades,
            wins: data.wins,
            losses: data.losses,
            grossPnL: data.pnl,
            winRate: data.trades > 0 ? parseFloat(((data.wins / data.trades) * 100).toFixed(1)) : 0,
        })
    }
    return summaries.sort((a, b) => b.month.localeCompare(a.month))
}
