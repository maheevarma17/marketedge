// ──────────────────────────────────────────────
// Risk & Position Calculator Engine
// ──────────────────────────────────────────────

export interface PositionSize {
    shares: number
    totalCost: number
    maxLoss: number
    riskPerShare: number
    riskRewardRatio: number
    takeProfitValue: number
    stopLossValue: number
}

export interface MarginCalc {
    requiredMargin: number
    leverageRatio: number
    exposureValue: number
    marginPct: number
}

// ── Position Sizing ──

export function calculatePositionSize(
    capital: number,
    riskPct: number,      // e.g. 2 for 2%
    entryPrice: number,
    stopLoss: number,
    takeProfit?: number,
): PositionSize {
    const maxRisk = capital * (riskPct / 100)
    const riskPerShare = Math.abs(entryPrice - stopLoss)
    const shares = riskPerShare > 0 ? Math.floor(maxRisk / riskPerShare) : 0
    const totalCost = shares * entryPrice
    const maxLoss = shares * riskPerShare
    const tp = takeProfit || entryPrice + (entryPrice - stopLoss) * 2
    const reward = Math.abs(tp - entryPrice) * shares
    const riskRewardRatio = maxLoss > 0 ? reward / maxLoss : 0

    return {
        shares,
        totalCost,
        maxLoss,
        riskPerShare,
        riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
        takeProfitValue: reward,
        stopLossValue: maxLoss,
    }
}

// ── Stop Loss Calculators ──

export function stopLossPercentage(entryPrice: number, pct: number, isLong: boolean = true): number {
    return isLong ? entryPrice * (1 - pct / 100) : entryPrice * (1 + pct / 100)
}

export function stopLossATR(entryPrice: number, atr: number, multiplier: number = 2, isLong: boolean = true): number {
    return isLong ? entryPrice - atr * multiplier : entryPrice + atr * multiplier
}

export function stopLossFixed(entryPrice: number, points: number, isLong: boolean = true): number {
    return isLong ? entryPrice - points : entryPrice + points
}

// ── Kelly Criterion ──

export function kellyCriterion(winRate: number, avgWin: number, avgLoss: number): number {
    // f* = (bp - q) / b where b = avgWin/avgLoss, p = winRate, q = 1-winRate
    const p = winRate / 100
    const q = 1 - p
    const b = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0
    if (b === 0) return 0
    const kelly = (b * p - q) / b
    return parseFloat((Math.max(0, kelly) * 100).toFixed(2))
}

// ── Margin Calculator ──

export function calculateMargin(
    price: number,
    qty: number,
    marginPct: number = 20, // NRML default ~20%
): MarginCalc {
    const exposureValue = price * qty
    const requiredMargin = exposureValue * (marginPct / 100)
    const leverageRatio = parseFloat((100 / marginPct).toFixed(1))
    return { requiredMargin, leverageRatio, exposureValue, marginPct }
}

// ── Risk Reward Visualizer data ──

export function riskRewardData(entry: number, stopLoss: number, takeProfit: number) {
    const risk = Math.abs(entry - stopLoss)
    const reward = Math.abs(takeProfit - entry)
    const ratio = risk > 0 ? reward / risk : 0
    return {
        risk, reward,
        ratio: parseFloat(ratio.toFixed(2)),
        riskPct: parseFloat(((risk / entry) * 100).toFixed(2)),
        rewardPct: parseFloat(((reward / entry) * 100).toFixed(2)),
    }
}
