// ──────────────────────────────────────────────────
// MarketEdge Pro — Strategy Runner
// Safely execute custom user strategies
// ──────────────────────────────────────────────────

import { sma, ema, rsi, macd, type Candle } from './backtesting'
import {
    wma, dema, tema, atr, supertrend, parabolicSar, ichimoku, adx, vwap,
    stochastic, williamsR, cci, roc, mfi,
    bollingerBands, keltnerChannel, donchianChannel,
    obv, accumulationDistribution, cmf,
    awesomeOscillator, trix, pivotPoints,
    type OHLCVCandle,
} from './indicators'

export interface StrategySignal {
    signals: ('BUY' | 'SELL' | 'HOLD' | null)[]
    errors: string[]
}

interface IndicatorsAPI {
    sma: (data: number[], period: number) => (number | null)[]
    ema: (data: number[], period: number) => (number | null)[]
    wma: (data: number[], period: number) => (number | null)[]
    dema: (data: number[], period: number) => (number | null)[]
    tema: (data: number[], period: number) => (number | null)[]
    rsi: (data: number[], period?: number) => (number | null)[]
    macd: (data: number[]) => { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] }
    atr: (candles: OHLCVCandle[], period?: number) => (number | null)[]
    supertrend: (candles: OHLCVCandle[], period?: number, mult?: number) => { supertrend: (number | null)[]; direction: (1 | -1 | null)[] }
    parabolicSar: (candles: OHLCVCandle[], step?: number, max?: number) => { sar: (number | null)[]; direction: (1 | -1 | null)[] }
    ichimoku: (candles: OHLCVCandle[], t?: number, k?: number, s?: number) => { tenkanSen: (number | null)[]; kijunSen: (number | null)[]; senkouA: (number | null)[]; senkouB: (number | null)[]; chikouSpan: (number | null)[] }
    adx: (candles: OHLCVCandle[], period?: number) => { adx: (number | null)[]; plusDI: (number | null)[]; minusDI: (number | null)[] }
    vwap: (candles: OHLCVCandle[]) => (number | null)[]
    stochastic: (candles: OHLCVCandle[], k?: number, d?: number) => { k: (number | null)[]; d: (number | null)[] }
    williamsR: (candles: OHLCVCandle[], period?: number) => (number | null)[]
    cci: (candles: OHLCVCandle[], period?: number) => (number | null)[]
    roc: (data: number[], period?: number) => (number | null)[]
    mfi: (candles: OHLCVCandle[], period?: number) => (number | null)[]
    bollingerBands: (data: number[], period?: number, stdDev?: number) => { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] }
    keltnerChannel: (candles: OHLCVCandle[], period?: number, mult?: number) => { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] }
    donchianChannel: (candles: OHLCVCandle[], period?: number) => { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] }
    obv: (candles: OHLCVCandle[]) => number[]
    ad: (candles: OHLCVCandle[]) => number[]
    cmf: (candles: OHLCVCandle[], period?: number) => (number | null)[]
    ao: (candles: OHLCVCandle[], fast?: number, slow?: number) => (number | null)[]
    trix: (data: number[], period?: number) => (number | null)[]
    pivotPoints: (high: number, low: number, close: number) => { pp: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number }
}

// Build the indicators API object
function createIndicatorsAPI(): IndicatorsAPI {
    return {
        sma, ema, wma, dema, tema, rsi, macd,
        atr, supertrend, parabolicSar, ichimoku, adx, vwap,
        stochastic, williamsR, cci, roc, mfi,
        bollingerBands, keltnerChannel, donchianChannel,
        obv, ad: accumulationDistribution, cmf,
        ao: awesomeOscillator, trix, pivotPoints,
    }
}

// Build candle data interface for user code
interface CandleData {
    date: string[]
    open: number[]
    high: number[]
    low: number[]
    close: number[]
    volume: number[]
    ohlcv: OHLCVCandle[]
    length: number
}

function buildCandleData(candles: Candle[]): CandleData {
    return {
        date: candles.map(c => c.date),
        open: candles.map(c => c.open),
        high: candles.map(c => c.high),
        low: candles.map(c => c.low),
        close: candles.map(c => c.close),
        volume: candles.map(c => c.volume),
        ohlcv: candles.map(c => ({ date: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume })),
        length: candles.length,
    }
}

/**
 * Execute a user-defined strategy string
 * The user code must define a function `strategy(candles, indicators)` that returns
 * an array of signals: 'BUY', 'SELL', 'HOLD', or null
 */
export function runCustomStrategy(code: string, candles: Candle[]): StrategySignal {
    const errors: string[] = []

    try {
        const candleData = buildCandleData(candles)
        const indicators = createIndicatorsAPI()

        // Create a safe function from user code
        // The function receives `candles` and `indicators` as arguments
        const wrappedCode = `
      "use strict";
      ${code}
      if (typeof strategy !== 'function') {
        throw new Error('Your code must define a function called "strategy(candles, indicators)"')
      }
      return strategy(candles, indicators);
    `

        const fn = new Function('candles', 'indicators', 'Math', 'console', wrappedCode)
        const consoleProxy = {
            log: (...args: unknown[]) => { /* silently captured */ },
            warn: (...args: unknown[]) => { /* silently captured */ },
            error: (...args: unknown[]) => errors.push(String(args.join(' '))),
        }

        const result = fn(candleData, indicators, Math, consoleProxy)

        if (!Array.isArray(result)) {
            return { signals: new Array(candles.length).fill(null), errors: ['Strategy must return an array of signals'] }
        }

        // Normalize signals
        const signals = result.map((s: unknown) => {
            if (s === 'BUY' || s === 'SELL' || s === 'HOLD') return s
            if (s === null || s === undefined || s === '') return null
            return null
        })

        // Pad to match candles length
        while (signals.length < candles.length) signals.push(null)

        return { signals: signals.slice(0, candles.length), errors }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error in strategy'
        return {
            signals: new Array(candles.length).fill(null),
            errors: [msg],
        }
    }
}

// ─── Pre-built Strategy Templates ───

export interface StrategyTemplate {
    id: string
    name: string
    description: string
    category: 'trend' | 'momentum' | 'reversal' | 'breakout' | 'custom'
    code: string
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
    {
        id: 'rsi_basic',
        name: 'RSI Oversold/Overbought',
        description: 'Buy when RSI drops below 30, sell when it goes above 70',
        category: 'momentum',
        code: `function strategy(candles, indicators) {
  const rsiVals = indicators.rsi(candles.close, 14);
  
  return candles.close.map((price, i) => {
    if (rsiVals[i] === null || i === 0 || rsiVals[i-1] === null) return null;
    
    if (rsiVals[i] < 30 && rsiVals[i-1] >= 30) return 'BUY';
    if (rsiVals[i] > 70 && rsiVals[i-1] <= 70) return 'SELL';
    return 'HOLD';
  });
}`,
    },
    {
        id: 'golden_cross',
        name: 'Golden Cross / Death Cross',
        description: 'Buy on Golden Cross (SMA50 > SMA200), Sell on Death Cross',
        category: 'trend',
        code: `function strategy(candles, indicators) {
  const sma50 = indicators.sma(candles.close, 50);
  const sma200 = indicators.sma(candles.close, 200);
  
  return candles.close.map((price, i) => {
    if (i === 0 || sma50[i] === null || sma200[i] === null) return null;
    if (sma50[i-1] === null || sma200[i-1] === null) return null;
    
    if (sma50[i-1] <= sma200[i-1] && sma50[i] > sma200[i]) return 'BUY';
    if (sma50[i-1] >= sma200[i-1] && sma50[i] < sma200[i]) return 'SELL';
    return 'HOLD';
  });
}`,
    },
    {
        id: 'supertrend_follow',
        name: 'Supertrend Follower',
        description: 'Follow Supertrend direction changes',
        category: 'trend',
        code: `function strategy(candles, indicators) {
  const st = indicators.supertrend(candles.ohlcv, 10, 3);
  
  return candles.close.map((price, i) => {
    if (i === 0 || st.direction[i] === null || st.direction[i-1] === null) return null;
    
    if (st.direction[i-1] === -1 && st.direction[i] === 1) return 'BUY';
    if (st.direction[i-1] === 1 && st.direction[i] === -1) return 'SELL';
    return 'HOLD';
  });
}`,
    },
    {
        id: 'multi_signal',
        name: 'Multi-Indicator Confluence',
        description: 'Buy when RSI + MACD + EMA all agree bullish',
        category: 'custom',
        code: `function strategy(candles, indicators) {
  const rsiVals = indicators.rsi(candles.close, 14);
  const macdResult = indicators.macd(candles.close);
  const ema20 = indicators.ema(candles.close, 20);
  const ema50 = indicators.ema(candles.close, 50);
  
  return candles.close.map((price, i) => {
    if (rsiVals[i] === null || macdResult.macd[i] === null || 
        macdResult.signal[i] === null || ema20[i] === null || ema50[i] === null) {
      return null;
    }
    
    let bullish = 0, bearish = 0;
    
    // RSI trending up and not overbought
    if (rsiVals[i] > 40 && rsiVals[i] < 65) bullish++;
    if (rsiVals[i] > 65) bearish++;
    if (rsiVals[i] < 35) bearish++;
    
    // MACD above signal
    if (macdResult.macd[i] > macdResult.signal[i]) bullish++;
    else bearish++;
    
    // EMA 20 above EMA 50 (uptrend)
    if (ema20[i] > ema50[i]) bullish++;
    else bearish++;
    
    // Price above EMA 20
    if (price > ema20[i]) bullish++;
    else bearish++;
    
    if (bullish >= 3 && i > 0) return 'BUY';
    if (bearish >= 3 && i > 0) return 'SELL';
    return 'HOLD';
  });
}`,
    },
    {
        id: 'blank_template',
        name: 'Blank Template',
        description: 'Start from scratch — write your own strategy',
        category: 'custom',
        code: `// MarketEdge Pro — Custom Strategy
// Available: candles.open, .high, .low, .close, .volume, .date, .ohlcv
// Available indicators: sma, ema, rsi, macd, supertrend, bollingerBands,
//   stochastic, adx, vwap, cci, atr, obv, ichimoku, parabolicSar, and more!
// Return: array of 'BUY', 'SELL', 'HOLD', or null

function strategy(candles, indicators) {
  // Your strategy logic here
  // Example: const sma20 = indicators.sma(candles.close, 20);
  
  return candles.close.map((price, i) => {
    // Replace with your buy/sell logic
    return 'HOLD';
  });
}`,
    },
]
