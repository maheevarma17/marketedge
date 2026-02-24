// ──────────────────────────────────────────────────
// MarketEdge Pro — Advanced Technical Indicators
// 25+ indicators, all free & unlimited
// ──────────────────────────────────────────────────

// Re-export existing indicators from backtesting
export { sma, ema, rsi, macd } from './backtesting'
// Import for internal use
import { sma as _sma, ema as _ema } from './backtesting'

// ─── Helper Types ───
export interface OHLCVCandle {
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export interface IchimokuResult {
    tenkanSen: (number | null)[]
    kijunSen: (number | null)[]
    senkouA: (number | null)[]
    senkouB: (number | null)[]
    chikouSpan: (number | null)[]
}

export interface SupertrendResult {
    supertrend: (number | null)[]
    direction: (1 | -1 | null)[] // 1 = bullish, -1 = bearish
}

export interface StochasticResult {
    k: (number | null)[]
    d: (number | null)[]
}

export interface ADXResult {
    adx: (number | null)[]
    plusDI: (number | null)[]
    minusDI: (number | null)[]
}

export interface ParabolicSARResult {
    sar: (number | null)[]
    direction: (1 | -1 | null)[]
}

// ─── Category metadata for UI ───
export interface IndicatorMeta {
    id: string
    name: string
    shortName: string
    category: 'trend' | 'momentum' | 'volatility' | 'volume' | 'oscillator'
    overlay: boolean // true = render on price chart, false = separate pane
    defaultParams: Record<string, number>
    description: string
}

export const INDICATOR_LIST: IndicatorMeta[] = [
    // ── Trend ──
    { id: 'sma', name: 'Simple Moving Average', shortName: 'SMA', category: 'trend', overlay: true, defaultParams: { period: 20 }, description: 'Average price over N periods' },
    { id: 'ema', name: 'Exponential Moving Average', shortName: 'EMA', category: 'trend', overlay: true, defaultParams: { period: 9 }, description: 'Weighted average giving more weight to recent prices' },
    { id: 'wma', name: 'Weighted Moving Average', shortName: 'WMA', category: 'trend', overlay: true, defaultParams: { period: 20 }, description: 'Linear-weighted moving average' },
    { id: 'dema', name: 'Double EMA', shortName: 'DEMA', category: 'trend', overlay: true, defaultParams: { period: 20 }, description: 'Double Exponential Moving Average' },
    { id: 'tema', name: 'Triple EMA', shortName: 'TEMA', category: 'trend', overlay: true, defaultParams: { period: 20 }, description: 'Triple Exponential Moving Average' },
    { id: 'supertrend', name: 'Supertrend', shortName: 'ST', category: 'trend', overlay: true, defaultParams: { period: 10, multiplier: 3 }, description: 'Trend-following indicator based on ATR' },
    { id: 'parabolicSar', name: 'Parabolic SAR', shortName: 'PSAR', category: 'trend', overlay: true, defaultParams: { step: 0.02, max: 0.2 }, description: 'Stop and reverse trend indicator' },
    { id: 'ichimoku', name: 'Ichimoku Cloud', shortName: 'ICHI', category: 'trend', overlay: true, defaultParams: { tenkan: 9, kijun: 26, senkou: 52 }, description: 'Complete trend system with cloud, base lines' },
    { id: 'adx', name: 'ADX / Directional Index', shortName: 'ADX', category: 'trend', overlay: false, defaultParams: { period: 14 }, description: 'Measures trend strength (0-100)' },
    { id: 'vwap', name: 'Volume Weighted Avg Price', shortName: 'VWAP', category: 'trend', overlay: true, defaultParams: {}, description: 'Average price weighted by volume' },

    // ── Momentum ──
    { id: 'rsi', name: 'Relative Strength Index', shortName: 'RSI', category: 'momentum', overlay: false, defaultParams: { period: 14 }, description: 'Momentum oscillator (0-100)' },
    { id: 'macd', name: 'MACD', shortName: 'MACD', category: 'momentum', overlay: false, defaultParams: { fast: 12, slow: 26, signal: 9 }, description: 'Moving Average Convergence Divergence' },
    { id: 'stochastic', name: 'Stochastic Oscillator', shortName: 'STOCH', category: 'momentum', overlay: false, defaultParams: { kPeriod: 14, dPeriod: 3 }, description: 'Shows closing price relative to high-low range' },
    { id: 'williamsR', name: 'Williams %R', shortName: '%R', category: 'momentum', overlay: false, defaultParams: { period: 14 }, description: 'Momentum indicator (-100 to 0)' },
    { id: 'cci', name: 'Commodity Channel Index', shortName: 'CCI', category: 'momentum', overlay: false, defaultParams: { period: 20 }, description: 'Measures price deviation from mean' },
    { id: 'roc', name: 'Rate of Change', shortName: 'ROC', category: 'momentum', overlay: false, defaultParams: { period: 12 }, description: 'Price change as percentage' },
    { id: 'mfi', name: 'Money Flow Index', shortName: 'MFI', category: 'momentum', overlay: false, defaultParams: { period: 14 }, description: 'Volume-weighted RSI (0-100)' },

    // ── Volatility ──
    { id: 'bollingerBands', name: 'Bollinger Bands', shortName: 'BB', category: 'volatility', overlay: true, defaultParams: { period: 20, stdDev: 2 }, description: 'Volatility bands around SMA' },
    { id: 'atr', name: 'Average True Range', shortName: 'ATR', category: 'volatility', overlay: false, defaultParams: { period: 14 }, description: 'Measures market volatility' },
    { id: 'keltnerChannel', name: 'Keltner Channel', shortName: 'KC', category: 'volatility', overlay: true, defaultParams: { period: 20, multiplier: 1.5 }, description: 'ATR-based volatility channel around EMA' },
    { id: 'donchianChannel', name: 'Donchian Channel', shortName: 'DC', category: 'volatility', overlay: true, defaultParams: { period: 20 }, description: 'Highest high / lowest low channel' },

    // ── Volume ──
    { id: 'obv', name: 'On-Balance Volume', shortName: 'OBV', category: 'volume', overlay: false, defaultParams: {}, description: 'Cumulative volume flow' },
    { id: 'ad', name: 'Accumulation / Distribution', shortName: 'A/D', category: 'volume', overlay: false, defaultParams: {}, description: 'Volume-weighted price location' },
    { id: 'cmf', name: 'Chaikin Money Flow', shortName: 'CMF', category: 'volume', overlay: false, defaultParams: { period: 20 }, description: 'Measures money flow volume over period' },

    // ── Oscillators ──
    { id: 'ao', name: 'Awesome Oscillator', shortName: 'AO', category: 'oscillator', overlay: false, defaultParams: { fast: 5, slow: 34 }, description: 'Difference between 5 and 34 period SMA of midpoints' },
    { id: 'trix', name: 'TRIX', shortName: 'TRIX', category: 'oscillator', overlay: false, defaultParams: { period: 15 }, description: 'Triple-smoothed EMA rate of change' },
]

// ═══════════════════════════════════════════════════
// TREND INDICATORS
// ═══════════════════════════════════════════════════

/** Weighted Moving Average */
export function wma(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = []
    const denom = (period * (period + 1)) / 2
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) { result.push(null); continue }
        let sum = 0
        for (let j = 0; j < period; j++) {
            sum += data[i - j] * (period - j)
        }
        result.push(parseFloat((sum / denom).toFixed(2)))
    }
    return result
}

/** Double Exponential Moving Average */
export function dema(data: number[], period: number): (number | null)[] {
    const ema1 = _ema(data, period)
    const validEma = ema1.filter((v: number | null) => v !== null) as number[]
    const ema2 = _ema(validEma, period)

    const result: (number | null)[] = []
    let ei = 0
    for (let i = 0; i < data.length; i++) {
        if (ema1[i] === null) { result.push(null); continue }
        if (ei < ema2.length && ema2[ei] !== null) {
            result.push(parseFloat((2 * ema1[i]! - ema2[ei]!).toFixed(2)))
        } else {
            result.push(null)
        }
        ei++
    }
    return result
}

/** Triple Exponential Moving Average */
export function tema(data: number[], period: number): (number | null)[] {
    const ema1 = _ema(data, period)
    const valid1 = ema1.filter((v: number | null) => v !== null) as number[]
    const ema2 = _ema(valid1, period)
    const valid2 = ema2.filter((v: number | null) => v !== null) as number[]
    const ema3 = _ema(valid2, period)

    const result: (number | null)[] = []
    let e1i = 0, e2i = 0
    for (let i = 0; i < data.length; i++) {
        if (ema1[i] === null) { result.push(null); continue }
        if (e1i < ema2.length && ema2[e1i] !== null) {
            if (e2i < ema3.length && ema3[e2i] !== null) {
                result.push(parseFloat((3 * ema1[i]! - 3 * ema2[e1i]! + ema3[e2i]!).toFixed(2)))
            } else { result.push(null) }
            e2i++
        } else { result.push(null) }
        e1i++
    }
    return result
}

/** Average True Range */
export function atr(candles: OHLCVCandle[], period: number = 14): (number | null)[] {
    const result: (number | null)[] = []
    const trueRanges: number[] = []

    for (let i = 0; i < candles.length; i++) {
        if (i === 0) {
            trueRanges.push(candles[i].high - candles[i].low)
            result.push(null)
            continue
        }
        const tr = Math.max(
            candles[i].high - candles[i].low,
            Math.abs(candles[i].high - candles[i - 1].close),
            Math.abs(candles[i].low - candles[i - 1].close)
        )
        trueRanges.push(tr)

        if (i < period) { result.push(null); continue }

        if (i === period) {
            const avg = trueRanges.slice(0, period + 1).reduce((a, b) => a + b, 0) / (period + 1)
            result.push(parseFloat(avg.toFixed(2)))
        } else {
            const prevATR = result[i - 1]!
            const currentATR = (prevATR * (period - 1) + tr) / period
            result.push(parseFloat(currentATR.toFixed(2)))
        }
    }
    return result
}

/** Supertrend */
export function supertrend(candles: OHLCVCandle[], period: number = 10, multiplier: number = 3): SupertrendResult {
    const atrValues = atr(candles, period)
    const st: (number | null)[] = []
    const dir: (1 | -1 | null)[] = []

    let prevUpperBand = 0
    let prevLowerBand = 0
    let prevST = 0
    let prevDir: 1 | -1 = 1

    for (let i = 0; i < candles.length; i++) {
        if (atrValues[i] === null) {
            st.push(null)
            dir.push(null)
            continue
        }

        const hl2 = (candles[i].high + candles[i].low) / 2
        const atrVal = atrValues[i]!

        let upperBand = hl2 + multiplier * atrVal
        let lowerBand = hl2 - multiplier * atrVal

        // Adjust bands
        if (prevLowerBand > 0 && lowerBand < prevLowerBand && candles[i - 1]?.close > prevLowerBand) {
            lowerBand = prevLowerBand
        }
        if (prevUpperBand > 0 && upperBand > prevUpperBand && candles[i - 1]?.close < prevUpperBand) {
            upperBand = prevUpperBand
        }

        let currentDir: 1 | -1
        let currentST: number

        if (prevST === 0) {
            currentDir = 1
            currentST = lowerBand
        } else if (prevST === prevUpperBand) {
            currentDir = candles[i].close > upperBand ? 1 : -1
        } else {
            currentDir = candles[i].close < lowerBand ? -1 : 1
        }

        currentST = currentDir === 1 ? lowerBand : upperBand

        st.push(parseFloat(currentST.toFixed(2)))
        dir.push(currentDir)

        prevUpperBand = upperBand
        prevLowerBand = lowerBand
        prevST = currentST
        prevDir = currentDir
    }

    return { supertrend: st, direction: dir }
}

/** Parabolic SAR */
export function parabolicSar(candles: OHLCVCandle[], step: number = 0.02, max: number = 0.2): ParabolicSARResult {
    const sar: (number | null)[] = []
    const direction: (1 | -1 | null)[] = []

    if (candles.length < 2) {
        return { sar: candles.map(() => null), direction: candles.map(() => null) }
    }

    let isLong = candles[1].close > candles[0].close
    let af = step
    let ep = isLong ? candles[0].high : candles[0].low
    let sarVal = isLong ? candles[0].low : candles[0].high

    sar.push(parseFloat(sarVal.toFixed(2)))
    direction.push(isLong ? 1 : -1)

    for (let i = 1; i < candles.length; i++) {
        const prevSar = sarVal
        sarVal = prevSar + af * (ep - prevSar)

        if (isLong) {
            sarVal = Math.min(sarVal, candles[i - 1].low, i >= 2 ? candles[i - 2].low : candles[i - 1].low)
            if (candles[i].low < sarVal) {
                isLong = false
                sarVal = ep
                ep = candles[i].low
                af = step
            } else {
                if (candles[i].high > ep) {
                    ep = candles[i].high
                    af = Math.min(af + step, max)
                }
            }
        } else {
            sarVal = Math.max(sarVal, candles[i - 1].high, i >= 2 ? candles[i - 2].high : candles[i - 1].high)
            if (candles[i].high > sarVal) {
                isLong = true
                sarVal = ep
                ep = candles[i].high
                af = step
            } else {
                if (candles[i].low < ep) {
                    ep = candles[i].low
                    af = Math.min(af + step, max)
                }
            }
        }

        sar.push(parseFloat(sarVal.toFixed(2)))
        direction.push(isLong ? 1 : -1)
    }

    return { sar, direction }
}

/** Ichimoku Cloud */
export function ichimoku(candles: OHLCVCandle[], tenkanPeriod: number = 9, kijunPeriod: number = 26, senkouPeriod: number = 52): IchimokuResult {
    const highs = candles.map(c => c.high)
    const lows = candles.map(c => c.low)
    const closes = candles.map(c => c.close)

    function periodHL(arr_h: number[], arr_l: number[], end: number, period: number): number | null {
        if (end < period - 1) return null
        let h = -Infinity, l = Infinity
        for (let i = end - period + 1; i <= end; i++) {
            if (arr_h[i] > h) h = arr_h[i]
            if (arr_l[i] < l) l = arr_l[i]
        }
        return (h + l) / 2
    }

    const tenkanSen: (number | null)[] = []
    const kijunSen: (number | null)[] = []
    const senkouA: (number | null)[] = []
    const senkouB: (number | null)[] = []
    const chikouSpan: (number | null)[] = []

    for (let i = 0; i < candles.length; i++) {
        const t = periodHL(highs, lows, i, tenkanPeriod)
        const k = periodHL(highs, lows, i, kijunPeriod)
        tenkanSen.push(t !== null ? parseFloat(t.toFixed(2)) : null)
        kijunSen.push(k !== null ? parseFloat(k.toFixed(2)) : null)

        // Senkou Span A = (Tenkan + Kijun) / 2, displaced forward by kijunPeriod
        if (t !== null && k !== null) {
            senkouA.push(parseFloat(((t + k) / 2).toFixed(2)))
        } else {
            senkouA.push(null)
        }

        // Senkou Span B = (highest high + lowest low) / 2 over senkouPeriod, displaced forward
        const sb = periodHL(highs, lows, i, senkouPeriod)
        senkouB.push(sb !== null ? parseFloat(sb.toFixed(2)) : null)

        // Chikou Span = current close, displaced backward by kijunPeriod
        chikouSpan.push(parseFloat(closes[i].toFixed(2)))
    }

    return { tenkanSen, kijunSen, senkouA, senkouB, chikouSpan }
}

/** ADX / Directional Movement Index */
export function adx(candles: OHLCVCandle[], period: number = 14): ADXResult {
    const plusDI: (number | null)[] = []
    const minusDI: (number | null)[] = []
    const adxResult: (number | null)[] = []

    const plusDM: number[] = []
    const minusDM: number[] = []
    const trueRanges: number[] = []

    for (let i = 0; i < candles.length; i++) {
        if (i === 0) {
            plusDI.push(null); minusDI.push(null); adxResult.push(null)
            continue
        }

        const upMove = candles[i].high - candles[i - 1].high
        const downMove = candles[i - 1].low - candles[i].low

        plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
        minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)

        const tr = Math.max(
            candles[i].high - candles[i].low,
            Math.abs(candles[i].high - candles[i - 1].close),
            Math.abs(candles[i].low - candles[i - 1].close)
        )
        trueRanges.push(tr)

        if (i < period) {
            plusDI.push(null); minusDI.push(null); adxResult.push(null)
            continue
        }

        if (i === period) {
            const sumTR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0)
            const sumPDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0)
            const sumMDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0)
            const pdi = sumTR > 0 ? (sumPDM / sumTR) * 100 : 0
            const mdi = sumTR > 0 ? (sumMDM / sumTR) * 100 : 0
            plusDI.push(parseFloat(pdi.toFixed(2)))
            minusDI.push(parseFloat(mdi.toFixed(2)))
            const dx = pdi + mdi > 0 ? Math.abs(pdi - mdi) / (pdi + mdi) * 100 : 0
            adxResult.push(parseFloat(dx.toFixed(2)))
        } else {
            const prevPDI = plusDI[i - 1]!
            const prevMDI = minusDI[i - 1]!
            const pdi = ((prevPDI * (period - 1)) + (plusDM[plusDM.length - 1] / trueRanges[trueRanges.length - 1]) * 100) / period
            const mdi = ((prevMDI * (period - 1)) + (minusDM[minusDM.length - 1] / trueRanges[trueRanges.length - 1]) * 100) / period
            plusDI.push(parseFloat(pdi.toFixed(2)))
            minusDI.push(parseFloat(mdi.toFixed(2)))
            const dx = pdi + mdi > 0 ? Math.abs(pdi - mdi) / (pdi + mdi) * 100 : 0
            const prevADX = adxResult[i - 1] || dx
            const adxVal = ((prevADX * (period - 1)) + dx) / period
            adxResult.push(parseFloat(adxVal.toFixed(2)))
        }
    }

    return { adx: adxResult, plusDI, minusDI }
}

/** Volume Weighted Average Price */
export function vwap(candles: OHLCVCandle[]): (number | null)[] {
    const result: (number | null)[] = []
    let cumVolume = 0
    let cumTPV = 0 // cumulative (typical price * volume)

    for (let i = 0; i < candles.length; i++) {
        const tp = (candles[i].high + candles[i].low + candles[i].close) / 3
        cumVolume += candles[i].volume
        cumTPV += tp * candles[i].volume
        result.push(cumVolume > 0 ? parseFloat((cumTPV / cumVolume).toFixed(2)) : null)
    }
    return result
}

// ═══════════════════════════════════════════════════
// MOMENTUM INDICATORS
// ═══════════════════════════════════════════════════

/** Stochastic Oscillator (%K and %D) */
export function stochastic(candles: OHLCVCandle[], kPeriod: number = 14, dPeriod: number = 3): StochasticResult {
    const k: (number | null)[] = []
    const d: (number | null)[] = []

    for (let i = 0; i < candles.length; i++) {
        if (i < kPeriod - 1) { k.push(null); d.push(null); continue }

        let hh = -Infinity, ll = Infinity
        for (let j = i - kPeriod + 1; j <= i; j++) {
            if (candles[j].high > hh) hh = candles[j].high
            if (candles[j].low < ll) ll = candles[j].low
        }

        const kVal = hh - ll > 0 ? ((candles[i].close - ll) / (hh - ll)) * 100 : 50
        k.push(parseFloat(kVal.toFixed(2)))

        // %D = SMA of %K
        if (i < kPeriod - 1 + dPeriod - 1) { d.push(null); continue }
        let sum = 0
        for (let j = 0; j < dPeriod; j++) {
            sum += k[i - j]!
        }
        d.push(parseFloat((sum / dPeriod).toFixed(2)))
    }

    return { k, d }
}

/** Williams %R */
export function williamsR(candles: OHLCVCandle[], period: number = 14): (number | null)[] {
    const result: (number | null)[] = []
    for (let i = 0; i < candles.length; i++) {
        if (i < period - 1) { result.push(null); continue }
        let hh = -Infinity, ll = Infinity
        for (let j = i - period + 1; j <= i; j++) {
            if (candles[j].high > hh) hh = candles[j].high
            if (candles[j].low < ll) ll = candles[j].low
        }
        const wr = hh - ll > 0 ? ((hh - candles[i].close) / (hh - ll)) * -100 : -50
        result.push(parseFloat(wr.toFixed(2)))
    }
    return result
}

/** Commodity Channel Index */
export function cci(candles: OHLCVCandle[], period: number = 20): (number | null)[] {
    const result: (number | null)[] = []
    const tps: number[] = candles.map(c => (c.high + c.low + c.close) / 3)

    for (let i = 0; i < candles.length; i++) {
        if (i < period - 1) { result.push(null); continue }
        const slice = tps.slice(i - period + 1, i + 1)
        const mean = slice.reduce((a, b) => a + b, 0) / period
        const meanDev = slice.reduce((a, b) => a + Math.abs(b - mean), 0) / period
        const cciVal = meanDev > 0 ? (tps[i] - mean) / (0.015 * meanDev) : 0
        result.push(parseFloat(cciVal.toFixed(2)))
    }
    return result
}

/** Rate of Change */
export function roc(data: number[], period: number = 12): (number | null)[] {
    const result: (number | null)[] = []
    for (let i = 0; i < data.length; i++) {
        if (i < period) { result.push(null); continue }
        const rocVal = ((data[i] - data[i - period]) / data[i - period]) * 100
        result.push(parseFloat(rocVal.toFixed(2)))
    }
    return result
}

/** Money Flow Index */
export function mfi(candles: OHLCVCandle[], period: number = 14): (number | null)[] {
    const result: (number | null)[] = []
    const positiveFlow: number[] = []
    const negativeFlow: number[] = []

    for (let i = 0; i < candles.length; i++) {
        const tp = (candles[i].high + candles[i].low + candles[i].close) / 3
        const rawMF = tp * candles[i].volume

        if (i === 0) {
            positiveFlow.push(0)
            negativeFlow.push(0)
            result.push(null)
            continue
        }

        const prevTP = (candles[i - 1].high + candles[i - 1].low + candles[i - 1].close) / 3
        if (tp > prevTP) {
            positiveFlow.push(rawMF)
            negativeFlow.push(0)
        } else {
            positiveFlow.push(0)
            negativeFlow.push(rawMF)
        }

        if (i < period) { result.push(null); continue }

        const posMF = positiveFlow.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
        const negMF = negativeFlow.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
        const mfiVal = negMF > 0 ? 100 - (100 / (1 + posMF / negMF)) : 100
        result.push(parseFloat(mfiVal.toFixed(2)))
    }
    return result
}

// ═══════════════════════════════════════════════════
// VOLATILITY INDICATORS
// ═══════════════════════════════════════════════════

/** Bollinger Bands */
export function bollingerBands(data: number[], period: number = 20, stdDevMult: number = 2): {
    upper: (number | null)[]
    middle: (number | null)[]
    lower: (number | null)[]
} {
    const middle = _sma(data, period)
    const upper: (number | null)[] = []
    const lower: (number | null)[] = []

    for (let i = 0; i < data.length; i++) {
        if (middle[i] === null) { upper.push(null); lower.push(null); continue }
        const slice = data.slice(i - period + 1, i + 1)
        const mean = middle[i]!
        const variance = slice.reduce((s: number, v: number) => s + (v - mean) ** 2, 0) / period
        const std = Math.sqrt(variance)
        upper.push(parseFloat((mean + stdDevMult * std).toFixed(2)))
        lower.push(parseFloat((mean - stdDevMult * std).toFixed(2)))
    }

    return { upper, middle, lower }
}

/** Keltner Channel */
export function keltnerChannel(candles: OHLCVCandle[], period: number = 20, multiplier: number = 1.5): {
    upper: (number | null)[]
    middle: (number | null)[]
    lower: (number | null)[]
} {
    const closes = candles.map(c => c.close)
    const middle = _ema(closes, period)
    const atrValues = atr(candles, period)
    const upper: (number | null)[] = []
    const lower: (number | null)[] = []

    for (let i = 0; i < candles.length; i++) {
        if (middle[i] === null || atrValues[i] === null) {
            upper.push(null); lower.push(null); continue
        }
        upper.push(parseFloat((middle[i]! + multiplier * atrValues[i]!).toFixed(2)))
        lower.push(parseFloat((middle[i]! - multiplier * atrValues[i]!).toFixed(2)))
    }

    return { upper, middle, lower }
}

/** Donchian Channel */
export function donchianChannel(candles: OHLCVCandle[], period: number = 20): {
    upper: (number | null)[]
    middle: (number | null)[]
    lower: (number | null)[]
} {
    const upper: (number | null)[] = []
    const middle: (number | null)[] = []
    const lower: (number | null)[] = []

    for (let i = 0; i < candles.length; i++) {
        if (i < period - 1) { upper.push(null); middle.push(null); lower.push(null); continue }
        let hh = -Infinity, ll = Infinity
        for (let j = i - period + 1; j <= i; j++) {
            if (candles[j].high > hh) hh = candles[j].high
            if (candles[j].low < ll) ll = candles[j].low
        }
        upper.push(parseFloat(hh.toFixed(2)))
        lower.push(parseFloat(ll.toFixed(2)))
        middle.push(parseFloat(((hh + ll) / 2).toFixed(2)))
    }

    return { upper, middle, lower }
}

// ═══════════════════════════════════════════════════
// VOLUME INDICATORS
// ═══════════════════════════════════════════════════

/** On-Balance Volume */
export function obv(candles: OHLCVCandle[]): number[] {
    const result: number[] = []
    let obvVal = 0

    for (let i = 0; i < candles.length; i++) {
        if (i === 0) { result.push(candles[i].volume); obvVal = candles[i].volume; continue }
        if (candles[i].close > candles[i - 1].close) {
            obvVal += candles[i].volume
        } else if (candles[i].close < candles[i - 1].close) {
            obvVal -= candles[i].volume
        }
        result.push(obvVal)
    }
    return result
}

/** Accumulation/Distribution Line */
export function accumulationDistribution(candles: OHLCVCandle[]): number[] {
    const result: number[] = []
    let adVal = 0

    for (let i = 0; i < candles.length; i++) {
        const hlRange = candles[i].high - candles[i].low
        const mfm = hlRange > 0
            ? ((candles[i].close - candles[i].low) - (candles[i].high - candles[i].close)) / hlRange
            : 0
        const mfv = mfm * candles[i].volume
        adVal += mfv
        result.push(parseFloat(adVal.toFixed(2)))
    }
    return result
}

/** Chaikin Money Flow */
export function cmf(candles: OHLCVCandle[], period: number = 20): (number | null)[] {
    const result: (number | null)[] = []

    for (let i = 0; i < candles.length; i++) {
        if (i < period - 1) { result.push(null); continue }
        let sumMFV = 0, sumVol = 0
        for (let j = i - period + 1; j <= i; j++) {
            const hlRange = candles[j].high - candles[j].low
            const mfm = hlRange > 0
                ? ((candles[j].close - candles[j].low) - (candles[j].high - candles[j].close)) / hlRange
                : 0
            sumMFV += mfm * candles[j].volume
            sumVol += candles[j].volume
        }
        result.push(sumVol > 0 ? parseFloat((sumMFV / sumVol).toFixed(4)) : null)
    }
    return result
}

// ═══════════════════════════════════════════════════
// OSCILLATORS
// ═══════════════════════════════════════════════════

/** Awesome Oscillator */
export function awesomeOscillator(candles: OHLCVCandle[], fastPeriod: number = 5, slowPeriod: number = 34): (number | null)[] {
    const midpoints = candles.map(c => (c.high + c.low) / 2)
    const fastSMA = _sma(midpoints, fastPeriod)
    const slowSMA = _sma(midpoints, slowPeriod)
    const result: (number | null)[] = []

    for (let i = 0; i < candles.length; i++) {
        if (fastSMA[i] === null || slowSMA[i] === null) { result.push(null); continue }
        result.push(parseFloat((fastSMA[i]! - slowSMA[i]!).toFixed(2)))
    }
    return result
}

/** TRIX — Triple Smoothed EMA Rate of Change */
export function trix(data: number[], period: number = 15): (number | null)[] {
    const ema1 = _ema(data, period)
    const valid1 = ema1.filter((v: number | null) => v !== null) as number[]
    const ema2 = _ema(valid1, period)
    const valid2 = ema2.filter((v: number | null) => v !== null) as number[]
    const ema3 = _ema(valid2, period)

    // TRIX = percentage change of triple-smoothed EMA
    const result: (number | null)[] = new Array(data.length).fill(null)
    const startIdx = data.length - ema3.length

    for (let i = 0; i < ema3.length; i++) {
        if (ema3[i] === null || i === 0 || ema3[i - 1] === null) continue
        const trixVal = ((ema3[i]! - ema3[i - 1]!) / ema3[i - 1]!) * 100
        const dataIdx = startIdx + i
        if (dataIdx >= 0 && dataIdx < data.length) {
            result[dataIdx] = parseFloat(trixVal.toFixed(4))
        }
    }
    return result
}

// ─── Pivot Points ───

export interface PivotPoints {
    pp: number
    r1: number
    r2: number
    r3: number
    s1: number
    s2: number
    s3: number
}

/** Calculate standard pivot points from a single candle (usually daily) */
export function pivotPoints(high: number, low: number, close: number): PivotPoints {
    const pp = (high + low + close) / 3
    return {
        pp: parseFloat(pp.toFixed(2)),
        r1: parseFloat((2 * pp - low).toFixed(2)),
        r2: parseFloat((pp + (high - low)).toFixed(2)),
        r3: parseFloat((high + 2 * (pp - low)).toFixed(2)),
        s1: parseFloat((2 * pp - high).toFixed(2)),
        s2: parseFloat((pp - (high - low)).toFixed(2)),
        s3: parseFloat((low - 2 * (high - pp)).toFixed(2)),
    }
}
