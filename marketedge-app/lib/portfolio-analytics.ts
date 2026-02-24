// ──────────────────────────────────────────────
// Portfolio Analytics Engine — Advanced metrics
// ──────────────────────────────────────────────

import { getPortfolio, type PaperTrade } from './paper-trading'

export interface DailyReturn {
    date: string
    pnl: number
    cumulative: number
    portfolioValue: number
}

export interface DrawdownPoint {
    date: string
    drawdown: number
    peak: number
    value: number
}

export interface SectorAllocation {
    sector: string
    value: number
    percentage: number
    count: number
}

export interface MonthlyReturn {
    year: number
    month: number
    pnl: number
    trades: number
}

export interface RiskMetrics {
    sharpeRatio: number
    sortinoRatio: number
    calmarRatio: number
    maxDrawdown: number
    maxDrawdownPct: number
    volatility: number
    avgDailyReturn: number
    totalReturn: number
    totalReturnPct: number
    winRate: number
    profitFactor: number
    avgWin: number
    avgLoss: number
    largestWin: number
    largestLoss: number
    avgHoldingDays: number
    totalTrades: number
    consecutiveWins: number
    consecutiveLosses: number
}

// ── Sector Map ──
const SECTOR_MAP: Record<string, string> = {
    RELIANCE: 'Energy', ONGC: 'Energy', BPCL: 'Energy', IOC: 'Energy', GAIL: 'Energy', ADANIENT: 'Energy',
    TCS: 'IT', INFY: 'IT', WIPRO: 'IT', HCLTECH: 'IT', TECHM: 'IT', LTIM: 'IT', MPHASIS: 'IT', COFORGE: 'IT',
    HDFCBANK: 'Banking', ICICIBANK: 'Banking', SBIN: 'Banking', KOTAKBANK: 'Banking', AXISBANK: 'Banking', INDUSINDBK: 'Banking', BANKBARODA: 'Banking', PNB: 'Banking',
    HINDUNILVR: 'FMCG', ITC: 'FMCG', NESTLEIND: 'FMCG', BRITANNIA: 'FMCG', DABUR: 'FMCG', MARICO: 'FMCG', COLPAL: 'FMCG',
    SUNPHARMA: 'Pharma', DRREDDY: 'Pharma', CIPLA: 'Pharma', DIVISLAB: 'Pharma', APOLLOHOSP: 'Pharma', BIOCON: 'Pharma',
    TATAMOTORS: 'Auto', MARUTI: 'Auto', BAJAJ_AUTO: 'Auto', HEROMOTOCO: 'Auto', EICHERMOT: 'Auto', M_M: 'Auto', ASHOKLEY: 'Auto',
    TATASTEEL: 'Metals', JSWSTEEL: 'Metals', HINDALCO: 'Metals', VEDL: 'Metals', COALINDIA: 'Metals', NMDC: 'Metals',
    LT: 'Infrastructure', ULTRACEMCO: 'Infrastructure', ACC: 'Infrastructure', AMBUJACEM: 'Infrastructure', ADANIPORTS: 'Infrastructure',
    BHARTIARTL: 'Telecom', POWERGRID: 'Energy', NTPC: 'Energy', TATAPOWER: 'Energy',
    BAJFINANCE: 'Finance', BAJAJFINSV: 'Finance', HDFCLIFE: 'Finance', SBILIFE: 'Finance', ICICIPRULI: 'Finance',
}

function getSector(symbol: string): string {
    return SECTOR_MAP[symbol] || 'Other'
}

// ── Calculate Daily Returns ──

export function calculateDailyReturns(initialCapital: number): DailyReturn[] {
    const portfolio = getPortfolio()
    const closedTrades = portfolio.trades
        .filter(t => t.status === 'CLOSED' && t.pnl !== null)
        .sort((a, b) => new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime())

    if (closedTrades.length === 0) return []

    const dailyMap = new Map<string, number>()
    closedTrades.forEach(t => {
        const date = new Date(t.closedAt!).toISOString().split('T')[0]
        dailyMap.set(date, (dailyMap.get(date) || 0) + (t.pnl || 0))
    })

    const returns: DailyReturn[] = []
    let cumulative = 0

    for (const [date, pnl] of dailyMap) {
        cumulative += pnl
        returns.push({
            date,
            pnl,
            cumulative,
            portfolioValue: initialCapital + cumulative,
        })
    }

    return returns
}

// ── Calculate Drawdown ──

export function calculateDrawdown(dailyReturns: DailyReturn[]): DrawdownPoint[] {
    if (dailyReturns.length === 0) return []

    let peak = dailyReturns[0].portfolioValue
    return dailyReturns.map(dr => {
        peak = Math.max(peak, dr.portfolioValue)
        const drawdown = peak > 0 ? ((peak - dr.portfolioValue) / peak) * 100 : 0
        return { date: dr.date, drawdown, peak, value: dr.portfolioValue }
    })
}

// ── Sector Allocation ──

export function calculateSectorAllocation(): SectorAllocation[] {
    const portfolio = getPortfolio()
    const openTrades = portfolio.trades.filter(t => t.status === 'OPEN' && t.side === 'BUY')

    const sectorMap = new Map<string, { value: number; count: number }>()
    let total = 0

    openTrades.forEach(t => {
        const sector = getSector(t.symbol)
        const value = t.entryPrice * t.qty
        total += value
        const existing = sectorMap.get(sector)
        if (existing) {
            existing.value += value
            existing.count++
        } else {
            sectorMap.set(sector, { value, count: 1 })
        }
    })

    const allocations: SectorAllocation[] = []
    for (const [sector, data] of sectorMap) {
        allocations.push({
            sector,
            value: data.value,
            percentage: total > 0 ? (data.value / total) * 100 : 0,
            count: data.count,
        })
    }

    return allocations.sort((a, b) => b.value - a.value)
}

// ── Monthly Returns ──

export function calculateMonthlyReturns(): MonthlyReturn[] {
    const portfolio = getPortfolio()
    const closedTrades = portfolio.trades.filter(t => t.status === 'CLOSED' && t.pnl !== null)

    const monthMap = new Map<string, { pnl: number; trades: number }>()
    closedTrades.forEach(t => {
        const d = new Date(t.closedAt!)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        const existing = monthMap.get(key)
        if (existing) {
            existing.pnl += t.pnl || 0
            existing.trades++
        } else {
            monthMap.set(key, { pnl: t.pnl || 0, trades: 1 })
        }
    })

    const returns: MonthlyReturn[] = []
    for (const [key, data] of monthMap) {
        const [year, month] = key.split('-').map(Number)
        returns.push({ year, month, pnl: data.pnl, trades: data.trades })
    }

    return returns.sort((a, b) => a.year - b.year || a.month - b.month)
}

// ── Calculate Risk Metrics ──

export function calculateRiskMetrics(): RiskMetrics {
    const portfolio = getPortfolio()
    const closedTrades = portfolio.trades.filter(t => t.status === 'CLOSED' && t.pnl !== null)
    const initialCapital = portfolio.initialCapital

    const wins = closedTrades.filter(t => (t.pnl || 0) > 0)
    const losses = closedTrades.filter(t => (t.pnl || 0) < 0)

    const totalPnL = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0)
    const totalReturnPct = initialCapital > 0 ? (totalPnL / initialCapital) * 100 : 0

    // Daily returns for volatility
    const dailyReturns = calculateDailyReturns(initialCapital)
    const dailyPctReturns = dailyReturns.map(d => (d.pnl / initialCapital) * 100)

    const avgDailyReturn = dailyPctReturns.length > 0
        ? dailyPctReturns.reduce((s, r) => s + r, 0) / dailyPctReturns.length : 0

    // Volatility (std dev of daily returns)
    const variance = dailyPctReturns.length > 1
        ? dailyPctReturns.reduce((s, r) => s + Math.pow(r - avgDailyReturn, 2), 0) / (dailyPctReturns.length - 1) : 0
    const volatility = Math.sqrt(variance)

    // Sharpe Ratio (annualized, assume 0% risk-free for simplicity)
    const annualizedReturn = avgDailyReturn * 252
    const annualizedVol = volatility * Math.sqrt(252)
    const sharpeRatio = annualizedVol > 0 ? annualizedReturn / annualizedVol : 0

    // Sortino Ratio (only downside deviation)
    const downsideReturns = dailyPctReturns.filter(r => r < 0)
    const downsideVariance = downsideReturns.length > 1
        ? downsideReturns.reduce((s, r) => s + r * r, 0) / downsideReturns.length : 0
    const downsideDev = Math.sqrt(downsideVariance) * Math.sqrt(252)
    const sortinoRatio = downsideDev > 0 ? annualizedReturn / downsideDev : 0

    // Max Drawdown
    const drawdowns = calculateDrawdown(dailyReturns)
    const maxDrawdownPct = drawdowns.length > 0 ? Math.max(...drawdowns.map(d => d.drawdown)) : 0
    const maxDrawdown = (maxDrawdownPct / 100) * initialCapital

    // Calmar Ratio
    const calmarRatio = maxDrawdownPct > 0 ? totalReturnPct / maxDrawdownPct : 0

    // Win/Loss stats
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl || 0), 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + (t.pnl || 0), 0) / losses.length : 0
    const profitFactor = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0

    // Consecutive wins/losses
    let maxConsWins = 0, maxConsLosses = 0, consWins = 0, consLosses = 0
    closedTrades.forEach(t => {
        if ((t.pnl || 0) > 0) { consWins++; consLosses = 0; maxConsWins = Math.max(maxConsWins, consWins) }
        else { consLosses++; consWins = 0; maxConsLosses = Math.max(maxConsLosses, consLosses) }
    })

    // Avg holding days
    const holdingDays = closedTrades.map(t => {
        const open = new Date(t.createdAt).getTime()
        const close = new Date(t.closedAt!).getTime()
        return (close - open) / (1000 * 60 * 60 * 24)
    })
    const avgHoldingDays = holdingDays.length > 0
        ? holdingDays.reduce((s, d) => s + d, 0) / holdingDays.length : 0

    return {
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
        calmarRatio: parseFloat(calmarRatio.toFixed(2)),
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
        maxDrawdownPct: parseFloat(maxDrawdownPct.toFixed(2)),
        volatility: parseFloat(annualizedVol.toFixed(2)),
        avgDailyReturn: parseFloat(avgDailyReturn.toFixed(4)),
        totalReturn: parseFloat(totalPnL.toFixed(2)),
        totalReturnPct: parseFloat(totalReturnPct.toFixed(2)),
        winRate: closedTrades.length > 0 ? parseFloat(((wins.length / closedTrades.length) * 100).toFixed(1)) : 0,
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        largestWin: wins.length > 0 ? Math.max(...wins.map(t => t.pnl || 0)) : 0,
        largestLoss: losses.length > 0 ? Math.min(...losses.map(t => t.pnl || 0)) : 0,
        avgHoldingDays: parseFloat(avgHoldingDays.toFixed(1)),
        totalTrades: closedTrades.length,
        consecutiveWins: maxConsWins,
        consecutiveLosses: maxConsLosses,
    }
}
