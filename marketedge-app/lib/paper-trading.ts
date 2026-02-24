// ──────────────────────────────────────────────────────
// Paper Trading Engine — 100% localStorage, no database
// ──────────────────────────────────────────────────────

export interface PaperTrade {
    id: string
    symbol: string
    name: string
    side: 'BUY' | 'SELL'
    qty: number
    entryPrice: number
    exitPrice: number | null
    pnl: number | null
    pnlPct: number | null
    status: 'OPEN' | 'CLOSED'
    product: 'MIS' | 'CNC' | 'NRML'
    createdAt: string
    closedAt: string | null
}

export interface PaperPortfolio {
    virtualCapital: number
    initialCapital: number
    trades: PaperTrade[]
}

const STORAGE_KEY = 'marketedge_paper_portfolio'
const DEFAULT_CAPITAL = 1000000 // ₹10,00,000

// ── Helpers ──

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function getPortfolio(): PaperPortfolio {
    if (typeof window === 'undefined') {
        return { virtualCapital: DEFAULT_CAPITAL, initialCapital: DEFAULT_CAPITAL, trades: [] }
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
        const fresh: PaperPortfolio = {
            virtualCapital: DEFAULT_CAPITAL,
            initialCapital: DEFAULT_CAPITAL,
            trades: []
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
        return fresh
    }
    return JSON.parse(raw)
}

function savePortfolio(portfolio: PaperPortfolio) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio))
}

// ── Place a paper trade ──

export function placeTrade(
    symbol: string,
    name: string,
    side: 'BUY' | 'SELL',
    qty: number,
    price: number,
    product: 'MIS' | 'CNC' | 'NRML' = 'CNC'
): PaperTrade {
    const portfolio = getPortfolio()

    const cost = price * qty
    if (side === 'BUY' && cost > portfolio.virtualCapital) {
        throw new Error(`Insufficient capital. Need ₹${cost.toLocaleString('en-IN')} but only ₹${portfolio.virtualCapital.toLocaleString('en-IN')} available.`)
    }

    const trade: PaperTrade = {
        id: generateId(),
        symbol: symbol.toUpperCase(),
        name,
        side,
        qty,
        entryPrice: price,
        exitPrice: null,
        pnl: null,
        pnlPct: null,
        status: 'OPEN',
        product,
        createdAt: new Date().toISOString(),
        closedAt: null
    }

    // Deduct capital for BUY, add for SELL (short selling)
    if (side === 'BUY') {
        portfolio.virtualCapital -= cost
    } else {
        portfolio.virtualCapital += cost
    }

    portfolio.trades.unshift(trade) // newest first
    savePortfolio(portfolio)
    return trade
}

// ── Close a trade ──

export function closeTrade(tradeId: string, exitPrice: number): PaperTrade {
    const portfolio = getPortfolio()
    const trade = portfolio.trades.find(t => t.id === tradeId)

    if (!trade) throw new Error('Trade not found')
    if (trade.status === 'CLOSED') throw new Error('Trade already closed')

    trade.exitPrice = exitPrice
    trade.status = 'CLOSED'
    trade.closedAt = new Date().toISOString()

    // Calculate P&L
    if (trade.side === 'BUY') {
        trade.pnl = (exitPrice - trade.entryPrice) * trade.qty
    } else {
        trade.pnl = (trade.entryPrice - exitPrice) * trade.qty
    }
    trade.pnlPct = (trade.pnl / (trade.entryPrice * trade.qty)) * 100

    // Return capital + P&L
    if (trade.side === 'BUY') {
        portfolio.virtualCapital += exitPrice * trade.qty
    } else {
        portfolio.virtualCapital -= exitPrice * trade.qty
    }

    savePortfolio(portfolio)
    return trade
}

// ── Get stats ──

export function getPortfolioStats() {
    const portfolio = getPortfolio()
    const closedTrades = portfolio.trades.filter(t => t.status === 'CLOSED')
    const openTrades = portfolio.trades.filter(t => t.status === 'OPEN')

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const wins = closedTrades.filter(t => (t.pnl || 0) > 0)
    const losses = closedTrades.filter(t => (t.pnl || 0) < 0)
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0

    const avgProfit = wins.length > 0
        ? wins.reduce((s, t) => s + (t.pnl || 0), 0) / wins.length
        : 0
    const avgLoss = losses.length > 0
        ? losses.reduce((s, t) => s + (t.pnl || 0), 0) / losses.length
        : 0

    const bestTrade = closedTrades.length > 0
        ? Math.max(...closedTrades.map(t => t.pnl || 0))
        : 0
    const worstTrade = closedTrades.length > 0
        ? Math.min(...closedTrades.map(t => t.pnl || 0))
        : 0

    // Invested in open trades
    const openInvested = openTrades.reduce((sum, t) => {
        return sum + (t.side === 'BUY' ? t.entryPrice * t.qty : 0)
    }, 0)

    return {
        virtualCapital: portfolio.virtualCapital,
        initialCapital: portfolio.initialCapital,
        totalPnL,
        portfolioValue: portfolio.virtualCapital + openInvested,
        totalTrades: closedTrades.length,
        openTrades: openTrades.length,
        winRate: parseFloat(winRate.toFixed(1)),
        wins: wins.length,
        losses: losses.length,
        avgProfit: parseFloat(avgProfit.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        bestTrade: parseFloat(bestTrade.toFixed(2)),
        worstTrade: parseFloat(worstTrade.toFixed(2)),
        profitFactor: Math.abs(avgLoss) > 0 ? parseFloat((avgProfit / Math.abs(avgLoss)).toFixed(2)) : 0,
    }
}

// ── Set custom capital ──

export function setCapital(amount: number) {
    const portfolio = getPortfolio()
    portfolio.virtualCapital = amount
    portfolio.initialCapital = amount
    savePortfolio(portfolio)
}

// ── Reset everything ──

export function resetPortfolio() {
    const fresh: PaperPortfolio = {
        virtualCapital: DEFAULT_CAPITAL,
        initialCapital: DEFAULT_CAPITAL,
        trades: []
    }
    savePortfolio(fresh)
    return fresh
}

// ── Format helpers ──

export function formatINR(amount: number): string {
    const abs = Math.abs(amount)
    const formatted = abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const sign = amount >= 0 ? '' : '-'
    return `${sign}₹${formatted}`
}

export function formatINRCompact(amount: number): string {
    const abs = Math.abs(amount)
    const sign = amount >= 0 ? '' : '-'
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`
    return `${sign}₹${abs.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
