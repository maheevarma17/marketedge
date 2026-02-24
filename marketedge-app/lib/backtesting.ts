// ─── Backtesting engine ───
// Tests trading strategies against historical price data

export interface Candle {
    date: string
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export interface BacktestTrade {
    entryDate: string
    exitDate: string
    side: 'BUY' | 'SELL'
    entryPrice: number
    exitPrice: number
    qty: number
    pnl: number
    pnlPct: number
    reason: string
}

export interface BacktestResult {
    strategy: string
    symbol: string
    period: string
    initialCapital: number
    finalCapital: number
    totalReturn: number
    totalReturnPct: number
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    maxDrawdown: number
    maxDrawdownPct: number
    sharpeRatio: number
    profitFactor: number
    avgWin: number
    avgLoss: number
    bestTrade: number
    worstTrade: number
    trades: BacktestTrade[]
    equityCurve: { date: string; equity: number }[]
}

// ─── Indicator calculations ───

export function sma(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = []
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) { result.push(null); continue }
        let sum = 0
        for (let j = 0; j < period; j++) sum += data[i - j]
        result.push(sum / period)
    }
    return result
}

export function ema(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = []
    const multiplier = 2 / (period + 1)
    let prev: number | null = null
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) { result.push(null); continue }
        if (prev === null) {
            // First EMA = SMA
            let sum = 0
            for (let j = 0; j < period; j++) sum += data[i - j]
            prev = sum / period
        } else {
            prev = (data[i] - prev) * multiplier + prev
        }
        result.push(parseFloat(prev.toFixed(2)))
    }
    return result
}

export function rsi(closes: number[], period: number = 14): (number | null)[] {
    const result: (number | null)[] = []
    const gains: number[] = []
    const losses: number[] = []

    for (let i = 0; i < closes.length; i++) {
        if (i === 0) { result.push(null); continue }
        const change = closes[i] - closes[i - 1]
        gains.push(change > 0 ? change : 0)
        losses.push(change < 0 ? Math.abs(change) : 0)

        if (i < period) { result.push(null); continue }

        if (i === period) {
            const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
            const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
            result.push(parseFloat((100 - 100 / (1 + rs)).toFixed(2)))
        } else {
            // Smoothed RSI
            const prevRsi = result[result.length - 1] || 50
            const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period
            const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
            result.push(parseFloat((100 - 100 / (1 + rs)).toFixed(2)))
        }
    }
    return result
}

export function macd(closes: number[]): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
    const ema12 = ema(closes, 12)
    const ema26 = ema(closes, 26)
    const macdLine: (number | null)[] = []

    for (let i = 0; i < closes.length; i++) {
        if (ema12[i] !== null && ema26[i] !== null) {
            macdLine.push(parseFloat((ema12[i]! - ema26[i]!).toFixed(2)))
        } else {
            macdLine.push(null)
        }
    }

    const validMacd = macdLine.filter(v => v !== null) as number[]
    const signalLine = ema(validMacd, 9)

    // Align signal back
    const signal: (number | null)[] = []
    const histogram: (number | null)[] = []
    let si = 0
    for (let i = 0; i < macdLine.length; i++) {
        if (macdLine[i] === null) {
            signal.push(null)
            histogram.push(null)
        } else {
            const s = signalLine[si] || null
            signal.push(s)
            histogram.push(s !== null ? parseFloat((macdLine[i]! - s).toFixed(2)) : null)
            si++
        }
    }

    return { macd: macdLine, signal, histogram }
}

// ─── Strategy definitions ───

export type StrategyName = 'rsi_oversold' | 'sma_crossover' | 'ema_crossover' | 'macd_crossover' | 'bollinger_bands'
    | 'supertrend' | 'vwap_bounce' | 'stochastic_crossover' | 'adx_trend' | 'triple_ema'
    | 'ichimoku_cloud' | 'mean_reversion' | 'volume_breakout' | 'parabolic_sar' | 'multi_indicator'

export interface StrategyMeta { id: StrategyName; name: string; description: string; category: 'trend' | 'momentum' | 'reversal' | 'breakout' | 'combined'; style: 'swing' | 'intraday' | 'positional' }

export const STRATEGIES: StrategyMeta[] = [
    // Original 5
    { id: 'rsi_oversold', name: 'RSI Oversold/Overbought', description: 'Buy when RSI < 30, Sell when RSI > 70', category: 'momentum', style: 'swing' },
    { id: 'sma_crossover', name: 'SMA Crossover (50/200)', description: 'Buy when SMA50 crosses above SMA200 (Golden Cross), Sell on Death Cross', category: 'trend', style: 'positional' },
    { id: 'ema_crossover', name: 'EMA Crossover (9/21)', description: 'Buy when EMA9 crosses above EMA21, Sell when crosses below', category: 'trend', style: 'swing' },
    { id: 'macd_crossover', name: 'MACD Signal Crossover', description: 'Buy when MACD crosses above signal line, Sell when crosses below', category: 'momentum', style: 'swing' },
    { id: 'bollinger_bands', name: 'Bollinger Bands Bounce', description: 'Buy at lower band, Sell at upper band (20-period, 2 std dev)', category: 'reversal', style: 'swing' },
    // New 10
    { id: 'supertrend', name: 'Supertrend', description: 'Buy/Sell on Supertrend direction change (10-period, 3x ATR)', category: 'trend', style: 'swing' },
    { id: 'vwap_bounce', name: 'VWAP Bounce', description: 'Buy below VWAP when RSI<40, Sell above VWAP when RSI>60', category: 'momentum', style: 'intraday' },
    { id: 'stochastic_crossover', name: 'Stochastic Crossover', description: 'Buy when %K crosses above %D below 20, Sell when crosses below above 80', category: 'momentum', style: 'swing' },
    { id: 'adx_trend', name: 'ADX Trend Strength', description: 'Buy when ADX>25 and +DI > -DI, Sell when -DI > +DI', category: 'trend', style: 'positional' },
    { id: 'triple_ema', name: 'Triple EMA Alignment', description: 'Buy when EMA9 > EMA21 > EMA50, Sell when reverse alignment', category: 'trend', style: 'swing' },
    { id: 'ichimoku_cloud', name: 'Ichimoku Cloud', description: 'Buy when price above cloud + Tenkan > Kijun, Sell below cloud', category: 'trend', style: 'positional' },
    { id: 'mean_reversion', name: 'Mean Reversion (CCI+BB)', description: 'Buy when CCI < -100 near BB lower band, Sell when CCI > 100 near BB upper', category: 'reversal', style: 'swing' },
    { id: 'volume_breakout', name: 'Volume Breakout', description: 'Buy on 2x average volume + close above 20-day high, Sell on trailing stop', category: 'breakout', style: 'swing' },
    { id: 'parabolic_sar', name: 'Parabolic SAR', description: 'Buy/Sell on Parabolic SAR direction flip (step 0.02, max 0.2)', category: 'trend', style: 'swing' },
    { id: 'multi_indicator', name: 'Multi-Indicator Confluence', description: 'Buy when 3+ indicators agree bullish (RSI, MACD, Supertrend, EMA), Sell opposite', category: 'combined', style: 'swing' },
]

// ─── Run backtest ───

export function runBacktest(
    candles: Candle[],
    strategy: StrategyName,
    initialCapital: number = 1000000,
    positionSizePct: number = 10 // % of capital per trade
): BacktestResult {
    const closes = candles.map(c => c.close)
    const trades: BacktestTrade[] = []
    const equityCurve: { date: string; equity: number }[] = []

    let capital = initialCapital
    let position: { entryPrice: number; entryDate: string; qty: number; reason: string } | null = null
    let peakEquity = initialCapital
    let maxDrawdown = 0

    // Generate signals based on strategy
    const signals = generateSignals(candles, closes, strategy)

    for (let i = 0; i < candles.length; i++) {
        const signal = signals[i]
        const candle = candles[i]

        if (signal === 'BUY' && !position) {
            // Open long position
            const positionSize = capital * (positionSizePct / 100)
            const qty = Math.floor(positionSize / candle.close)
            if (qty > 0) {
                position = { entryPrice: candle.close, entryDate: candle.date, qty, reason: signal }
                capital -= qty * candle.close
            }
        } else if (signal === 'SELL' && position) {
            // Close position
            const exitPrice = candle.close
            const pnl = (exitPrice - position.entryPrice) * position.qty
            capital += position.qty * exitPrice

            trades.push({
                entryDate: position.entryDate,
                exitDate: candle.date,
                side: 'BUY',
                entryPrice: position.entryPrice,
                exitPrice,
                qty: position.qty,
                pnl: parseFloat(pnl.toFixed(2)),
                pnlPct: parseFloat(((exitPrice - position.entryPrice) / position.entryPrice * 100).toFixed(2)),
                reason: `${position.reason} → SELL`,
            })
            position = null
        }

        // Track equity
        const currentEquity = capital + (position ? position.qty * candle.close : 0)
        equityCurve.push({ date: candle.date, equity: parseFloat(currentEquity.toFixed(2)) })

        // Track drawdown
        if (currentEquity > peakEquity) peakEquity = currentEquity
        const dd = peakEquity - currentEquity
        if (dd > maxDrawdown) maxDrawdown = dd
    }

    // Close any remaining position at last price
    if (position) {
        const lastClose = candles[candles.length - 1].close
        const pnl = (lastClose - position.entryPrice) * position.qty
        capital += position.qty * lastClose
        trades.push({
            entryDate: position.entryDate,
            exitDate: candles[candles.length - 1].date,
            side: 'BUY',
            entryPrice: position.entryPrice,
            exitPrice: lastClose,
            qty: position.qty,
            pnl: parseFloat(pnl.toFixed(2)),
            pnlPct: parseFloat(((lastClose - position.entryPrice) / position.entryPrice * 100).toFixed(2)),
            reason: 'Position closed at end',
        })
    }

    // Calculate stats
    const winningTrades = trades.filter(t => t.pnl > 0)
    const losingTrades = trades.filter(t => t.pnl <= 0)
    const totalReturn = capital - initialCapital
    const totalGrossProfit = winningTrades.reduce((s, t) => s + t.pnl, 0)
    const totalGrossLoss = Math.abs(losingTrades.reduce((s, t) => s + t.pnl, 0))

    // Daily returns for Sharpe
    const dailyReturns: number[] = []
    for (let i = 1; i < equityCurve.length; i++) {
        dailyReturns.push((equityCurve[i].equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity)
    }
    const avgReturn = dailyReturns.length > 0 ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length : 0
    const stdReturn = dailyReturns.length > 0 ? Math.sqrt(dailyReturns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / dailyReturns.length) : 0
    const sharpe = stdReturn > 0 ? parseFloat(((avgReturn / stdReturn) * Math.sqrt(252)).toFixed(2)) : 0

    return {
        strategy: STRATEGIES.find(s => s.id === strategy)?.name || strategy,
        symbol: '',
        period: '',
        initialCapital,
        finalCapital: parseFloat(capital.toFixed(2)),
        totalReturn: parseFloat(totalReturn.toFixed(2)),
        totalReturnPct: parseFloat(((totalReturn / initialCapital) * 100).toFixed(2)),
        totalTrades: trades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: trades.length > 0 ? parseFloat(((winningTrades.length / trades.length) * 100).toFixed(1)) : 0,
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
        maxDrawdownPct: peakEquity > 0 ? parseFloat(((maxDrawdown / peakEquity) * 100).toFixed(2)) : 0,
        sharpeRatio: sharpe,
        profitFactor: totalGrossLoss > 0 ? parseFloat((totalGrossProfit / totalGrossLoss).toFixed(2)) : totalGrossProfit > 0 ? 999 : 0,
        avgWin: winningTrades.length > 0 ? parseFloat((totalGrossProfit / winningTrades.length).toFixed(2)) : 0,
        avgLoss: losingTrades.length > 0 ? parseFloat((-totalGrossLoss / losingTrades.length).toFixed(2)) : 0,
        bestTrade: trades.length > 0 ? Math.max(...trades.map(t => t.pnl)) : 0,
        worstTrade: trades.length > 0 ? Math.min(...trades.map(t => t.pnl)) : 0,
        trades,
        equityCurve,
    }
}

// ─── Signal generation per strategy ───

function generateSignals(candles: Candle[], closes: number[], strategy: StrategyName): (string | null)[] {
    const signals: (string | null)[] = new Array(candles.length).fill(null)
    // Import indicators lazily to avoid circular deps at module level
    const ind = require('./indicators')

    switch (strategy) {
        case 'rsi_oversold': {
            const rsiValues = rsi(closes, 14)
            for (let i = 1; i < candles.length; i++) {
                if (rsiValues[i] !== null && rsiValues[i - 1] !== null) {
                    if (rsiValues[i]! < 30 && rsiValues[i - 1]! >= 30) signals[i] = 'BUY'
                    if (rsiValues[i]! > 70 && rsiValues[i - 1]! <= 70) signals[i] = 'SELL'
                }
            }
            break
        }

        case 'sma_crossover': {
            const sma50 = sma(closes, 50)
            const sma200 = sma(closes, 200)
            for (let i = 1; i < candles.length; i++) {
                if (sma50[i] !== null && sma200[i] !== null && sma50[i - 1] !== null && sma200[i - 1] !== null) {
                    if (sma50[i - 1]! <= sma200[i - 1]! && sma50[i]! > sma200[i]!) signals[i] = 'BUY'
                    if (sma50[i - 1]! >= sma200[i - 1]! && sma50[i]! < sma200[i]!) signals[i] = 'SELL'
                }
            }
            break
        }

        case 'ema_crossover': {
            const ema9 = ema(closes, 9)
            const ema21 = ema(closes, 21)
            for (let i = 1; i < candles.length; i++) {
                if (ema9[i] !== null && ema21[i] !== null && ema9[i - 1] !== null && ema21[i - 1] !== null) {
                    if (ema9[i - 1]! <= ema21[i - 1]! && ema9[i]! > ema21[i]!) signals[i] = 'BUY'
                    if (ema9[i - 1]! >= ema21[i - 1]! && ema9[i]! < ema21[i]!) signals[i] = 'SELL'
                }
            }
            break
        }

        case 'macd_crossover': {
            const m = macd(closes)
            for (let i = 1; i < candles.length; i++) {
                if (m.macd[i] !== null && m.signal[i] !== null && m.macd[i - 1] !== null && m.signal[i - 1] !== null) {
                    if (m.macd[i - 1]! <= m.signal[i - 1]! && m.macd[i]! > m.signal[i]!) signals[i] = 'BUY'
                    if (m.macd[i - 1]! >= m.signal[i - 1]! && m.macd[i]! < m.signal[i]!) signals[i] = 'SELL'
                }
            }
            break
        }

        case 'bollinger_bands': {
            const period = 20
            const stdDev = 2
            const smaValues = sma(closes, period)
            for (let i = period; i < candles.length; i++) {
                if (smaValues[i] === null) continue
                const slice = closes.slice(i - period + 1, i + 1)
                const mean = smaValues[i]!
                const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period
                const sd = Math.sqrt(variance)
                const upper = mean + stdDev * sd
                const lower = mean - stdDev * sd
                if (closes[i] <= lower) signals[i] = 'BUY'
                if (closes[i] >= upper) signals[i] = 'SELL'
            }
            break
        }

        // ═══════════════════════════════════════
        // NEW STRATEGIES (Phase 2)
        // ═══════════════════════════════════════

        case 'supertrend': {
            const ohlcv = candles.map(c => ({ date: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }))
            const result = ind.supertrend(ohlcv, 10, 3)
            for (let i = 1; i < candles.length; i++) {
                if (result.direction[i] !== null && result.direction[i - 1] !== null) {
                    if (result.direction[i - 1] === -1 && result.direction[i] === 1) signals[i] = 'BUY'
                    if (result.direction[i - 1] === 1 && result.direction[i] === -1) signals[i] = 'SELL'
                }
            }
            break
        }

        case 'vwap_bounce': {
            const ohlcv = candles.map(c => ({ date: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }))
            const vwapVals = ind.vwap(ohlcv)
            const rsiVals = rsi(closes, 14)
            for (let i = 1; i < candles.length; i++) {
                if (vwapVals[i] === null || rsiVals[i] === null) continue
                if (closes[i] < vwapVals[i]! && rsiVals[i]! < 40 && rsiVals[i - 1]! >= 40) signals[i] = 'BUY'
                if (closes[i] > vwapVals[i]! && rsiVals[i]! > 60 && rsiVals[i - 1]! <= 60) signals[i] = 'SELL'
            }
            break
        }

        case 'stochastic_crossover': {
            const ohlcv = candles.map(c => ({ date: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }))
            const result = ind.stochastic(ohlcv, 14, 3)
            for (let i = 1; i < candles.length; i++) {
                if (result.k[i] === null || result.d[i] === null || result.k[i - 1] === null || result.d[i - 1] === null) continue
                // Buy: %K crosses above %D below 20
                if (result.k[i - 1]! <= result.d[i - 1]! && result.k[i]! > result.d[i]! && result.k[i]! < 20) signals[i] = 'BUY'
                // Sell: %K crosses below %D above 80
                if (result.k[i - 1]! >= result.d[i - 1]! && result.k[i]! < result.d[i]! && result.k[i]! > 80) signals[i] = 'SELL'
            }
            break
        }

        case 'adx_trend': {
            const ohlcv = candles.map(c => ({ date: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }))
            const result = ind.adx(ohlcv, 14)
            for (let i = 1; i < candles.length; i++) {
                if (result.adx[i] === null || result.plusDI[i] === null || result.minusDI[i] === null) continue
                if (result.adx[i]! > 25) {
                    if (result.plusDI[i]! > result.minusDI[i]! && result.plusDI[i - 1]! <= result.minusDI[i - 1]!) signals[i] = 'BUY'
                    if (result.minusDI[i]! > result.plusDI[i]! && result.minusDI[i - 1]! <= result.plusDI[i - 1]!) signals[i] = 'SELL'
                }
            }
            break
        }

        case 'triple_ema': {
            const ema9 = ema(closes, 9)
            const ema21 = ema(closes, 21)
            const ema50 = ema(closes, 50)
            for (let i = 1; i < candles.length; i++) {
                if (ema9[i] === null || ema21[i] === null || ema50[i] === null) continue
                const bullish = ema9[i]! > ema21[i]! && ema21[i]! > ema50[i]!
                const prevBullish = ema9[i - 1] !== null && ema21[i - 1] !== null && ema50[i - 1] !== null &&
                    ema9[i - 1]! > ema21[i - 1]! && ema21[i - 1]! > ema50[i - 1]!
                const bearish = ema9[i]! < ema21[i]! && ema21[i]! < ema50[i]!
                const prevBearish = ema9[i - 1] !== null && ema21[i - 1] !== null && ema50[i - 1] !== null &&
                    ema9[i - 1]! < ema21[i - 1]! && ema21[i - 1]! < ema50[i - 1]!
                if (bullish && !prevBullish) signals[i] = 'BUY'
                if (bearish && !prevBearish) signals[i] = 'SELL'
            }
            break
        }

        case 'ichimoku_cloud': {
            const ohlcv = candles.map(c => ({ date: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }))
            const result = ind.ichimoku(ohlcv, 9, 26, 52)
            for (let i = 1; i < candles.length; i++) {
                if (result.tenkanSen[i] === null || result.kijunSen[i] === null || result.senkouA[i] === null || result.senkouB[i] === null) continue
                const cloudTop = Math.max(result.senkouA[i]!, result.senkouB[i]!)
                const cloudBottom = Math.min(result.senkouA[i]!, result.senkouB[i]!)
                const aboveCloud = closes[i] > cloudTop
                const belowCloud = closes[i] < cloudBottom
                const tenkanAboveKijun = result.tenkanSen[i]! > result.kijunSen[i]!
                const prevAboveCloud = i > 0 && result.senkouA[i - 1] !== null && result.senkouB[i - 1] !== null &&
                    closes[i - 1] <= Math.max(result.senkouA[i - 1]!, result.senkouB[i - 1]!)
                if (aboveCloud && tenkanAboveKijun && prevAboveCloud) signals[i] = 'BUY'
                if (belowCloud && !tenkanAboveKijun) signals[i] = 'SELL'
            }
            break
        }

        case 'mean_reversion': {
            const ohlcv = candles.map(c => ({ date: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }))
            const cciVals = ind.cci(ohlcv, 20)
            const bb = ind.bollingerBands(closes, 20, 2)
            for (let i = 1; i < candles.length; i++) {
                if (cciVals[i] === null || bb.lower[i] === null || bb.upper[i] === null) continue
                if (cciVals[i]! < -100 && closes[i] <= bb.lower[i]! * 1.01) signals[i] = 'BUY'
                if (cciVals[i]! > 100 && closes[i] >= bb.upper[i]! * 0.99) signals[i] = 'SELL'
            }
            break
        }

        case 'volume_breakout': {
            // Calculate 20-day average volume and 20-day high
            for (let i = 20; i < candles.length; i++) {
                const volSlice = candles.slice(i - 20, i).map(c => c.volume)
                const avgVol = volSlice.reduce((a, b) => a + b, 0) / 20
                const high20 = Math.max(...candles.slice(i - 20, i).map(c => c.high))
                const low20 = Math.min(...candles.slice(i - 20, i).map(c => c.low))

                if (candles[i].volume > avgVol * 2 && candles[i].close > high20) signals[i] = 'BUY'
                if (candles[i].volume > avgVol * 2 && candles[i].close < low20) signals[i] = 'SELL'
            }
            break
        }

        case 'parabolic_sar': {
            const ohlcv = candles.map(c => ({ date: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }))
            const result = ind.parabolicSar(ohlcv, 0.02, 0.2)
            for (let i = 1; i < candles.length; i++) {
                if (result.direction[i] !== null && result.direction[i - 1] !== null) {
                    if (result.direction[i - 1] === -1 && result.direction[i] === 1) signals[i] = 'BUY'
                    if (result.direction[i - 1] === 1 && result.direction[i] === -1) signals[i] = 'SELL'
                }
            }
            break
        }

        case 'multi_indicator': {
            const ohlcv = candles.map(c => ({ date: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }))
            const rsiVals = rsi(closes, 14)
            const m = macd(closes)
            const st = ind.supertrend(ohlcv, 10, 3)
            const ema50 = ema(closes, 50)

            for (let i = 1; i < candles.length; i++) {
                let bullScore = 0, bearScore = 0
                // RSI: bullish if < 50 rising, bearish if > 50 falling
                if (rsiVals[i] !== null && rsiVals[i - 1] !== null) {
                    if (rsiVals[i]! > rsiVals[i - 1]! && rsiVals[i]! < 60) bullScore++
                    if (rsiVals[i]! < rsiVals[i - 1]! && rsiVals[i]! > 40) bearScore++
                }
                // MACD: bullish if above signal, bearish if below
                if (m.macd[i] !== null && m.signal[i] !== null) {
                    if (m.macd[i]! > m.signal[i]!) bullScore++
                    if (m.macd[i]! < m.signal[i]!) bearScore++
                }
                // Supertrend direction
                if (st.direction[i] === 1) bullScore++
                if (st.direction[i] === -1) bearScore++
                // Price above/below EMA 50
                if (ema50[i] !== null) {
                    if (closes[i] > ema50[i]!) bullScore++
                    if (closes[i] < ema50[i]!) bearScore++
                }

                if (bullScore >= 3 && (i === 0 || signals[i - 1] !== 'BUY')) signals[i] = 'BUY'
                if (bearScore >= 3 && (i === 0 || signals[i - 1] !== 'SELL')) signals[i] = 'SELL'
            }
            break
        }
    }

    return signals
}
