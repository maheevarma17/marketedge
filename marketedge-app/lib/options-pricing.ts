// ──────────────────────────────────────────────────
// MarketEdge Pro — Options Pricing Engine
// Black-Scholes model with Greeks
// ──────────────────────────────────────────────────

export interface GreeksResult {
    price: number
    delta: number
    gamma: number
    theta: number
    vega: number
    rho: number
}

export interface OptionLeg {
    type: 'call' | 'put'
    strike: number
    premium: number
    qty: number        // +1 = long, -1 = short
    expiry?: string
}

export interface PayoffPoint {
    spot: number
    pnl: number
}

export interface MaxPainResult {
    maxPainStrike: number
    painByStrike: { strike: number; totalPain: number }[]
}

// ─── Normal Distribution Helpers ───
function normCDF(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
    const a4 = -1.453152027, a5 = 1.061405429
    const p = 0.3275911
    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2)
    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
    return 0.5 * (1.0 + sign * y)
}

function normPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

// ─── Black-Scholes ───

/**
 * Calculate Black-Scholes option price and Greeks
 * @param S - Current spot price
 * @param K - Strike price
 * @param T - Time to expiry in years (e.g., 30/365 for 30 days)
 * @param r - Risk-free rate (e.g., 0.065 for 6.5%)
 * @param sigma - Implied volatility (e.g., 0.25 for 25%)
 * @param type - 'call' or 'put'
 */
export function blackScholes(S: number, K: number, T: number, r: number, sigma: number, type: 'call' | 'put'): GreeksResult {
    if (T <= 0) {
        // At or past expiry
        const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)
        return { price: intrinsic, delta: type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0), gamma: 0, theta: 0, vega: 0, rho: 0 }
    }

    const sqrtT = Math.sqrt(T)
    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * sqrtT)
    const d2 = d1 - sigma * sqrtT

    let price: number, delta: number

    if (type === 'call') {
        price = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2)
        delta = normCDF(d1)
    } else {
        price = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1)
        delta = normCDF(d1) - 1
    }

    const gamma = normPDF(d1) / (S * sigma * sqrtT)
    const theta = (-(S * normPDF(d1) * sigma) / (2 * sqrtT) - r * K * Math.exp(-r * T) * (type === 'call' ? normCDF(d2) : normCDF(-d2))) / 365
    const vega = S * normPDF(d1) * sqrtT / 100

    const rho = type === 'call'
        ? K * T * Math.exp(-r * T) * normCDF(d2) / 100
        : -K * T * Math.exp(-r * T) * normCDF(-d2) / 100

    return {
        price: parseFloat(price.toFixed(2)),
        delta: parseFloat(delta.toFixed(4)),
        gamma: parseFloat(gamma.toFixed(6)),
        theta: parseFloat(theta.toFixed(2)),
        vega: parseFloat(vega.toFixed(2)),
        rho: parseFloat(rho.toFixed(2)),
    }
}

/**
 * Calculate Implied Volatility using Newton-Raphson
 */
export function calcImpliedVolatility(
    marketPrice: number, S: number, K: number, T: number, r: number, type: 'call' | 'put'
): number {
    let sigma = 0.3 // initial guess
    const MAX_ITERATIONS = 100
    const PRECISION = 0.0001

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const result = blackScholes(S, K, T, r, sigma, type)
        const diff = result.price - marketPrice
        if (Math.abs(diff) < PRECISION) return parseFloat(sigma.toFixed(4))

        const vega100 = result.vega * 100
        if (Math.abs(vega100) < 0.0001) break
        sigma -= diff / vega100
        if (sigma <= 0) sigma = 0.01
    }
    return parseFloat(sigma.toFixed(4))
}

// ─── Payoff Calculator ───

/**
 * Calculate payoff curve for a multi-leg option strategy
 */
export function calcPayoff(legs: OptionLeg[], spotRange: { min: number; max: number; step: number }): PayoffPoint[] {
    const points: PayoffPoint[] = []
    for (let spot = spotRange.min; spot <= spotRange.max; spot += spotRange.step) {
        let totalPnl = 0
        for (const leg of legs) {
            const intrinsic = leg.type === 'call'
                ? Math.max(spot - leg.strike, 0)
                : Math.max(leg.strike - spot, 0)
            const legPnl = (intrinsic - leg.premium) * leg.qty
            totalPnl += legPnl
        }
        points.push({ spot: parseFloat(spot.toFixed(2)), pnl: parseFloat(totalPnl.toFixed(2)) })
    }
    return points
}

// ─── Max Pain Calculator ───

export function calcMaxPain(chain: { strike: number; callOI: number; putOI: number }[]): MaxPainResult {
    const painByStrike: { strike: number; totalPain: number }[] = []

    for (const target of chain) {
        let totalPain = 0
        for (const option of chain) {
            // Pain to call writers if spot ends at target.strike
            const callPain = Math.max(target.strike - option.strike, 0) * option.callOI
            // Pain to put writers if spot ends at target.strike
            const putPain = Math.max(option.strike - target.strike, 0) * option.putOI
            totalPain += callPain + putPain
        }
        painByStrike.push({ strike: target.strike, totalPain })
    }

    // Max pain = strike where total pain is minimum
    const sorted = [...painByStrike].sort((a, b) => a.totalPain - b.totalPain)
    return {
        maxPainStrike: sorted[0]?.strike || 0,
        painByStrike,
    }
}

// ─── Preset Strategies ───

export interface OptionStrategy {
    id: string
    name: string
    description: string
    legs: (spotPrice: number, stepSize: number) => OptionLeg[]
    category: 'bullish' | 'bearish' | 'neutral' | 'volatile'
}

export const OPTION_STRATEGIES: OptionStrategy[] = [
    {
        id: 'long_call',
        name: 'Long Call',
        description: 'Buy a call option — bullish view, limited risk',
        category: 'bullish',
        legs: (S, step) => [{ type: 'call', strike: Math.round(S / step) * step, premium: 0, qty: 1 }],
    },
    {
        id: 'long_put',
        name: 'Long Put',
        description: 'Buy a put option — bearish view, limited risk',
        category: 'bearish',
        legs: (S, step) => [{ type: 'put', strike: Math.round(S / step) * step, premium: 0, qty: 1 }],
    },
    {
        id: 'bull_call_spread',
        name: 'Bull Call Spread',
        description: 'Buy ATM call + Sell OTM call — limited risk, limited profit',
        category: 'bullish',
        legs: (S, step) => [
            { type: 'call', strike: Math.round(S / step) * step, premium: 0, qty: 1 },
            { type: 'call', strike: Math.round(S / step) * step + step * 2, premium: 0, qty: -1 },
        ],
    },
    {
        id: 'bear_put_spread',
        name: 'Bear Put Spread',
        description: 'Buy ATM put + Sell OTM put — limited risk, limited profit',
        category: 'bearish',
        legs: (S, step) => [
            { type: 'put', strike: Math.round(S / step) * step, premium: 0, qty: 1 },
            { type: 'put', strike: Math.round(S / step) * step - step * 2, premium: 0, qty: -1 },
        ],
    },
    {
        id: 'straddle',
        name: 'Long Straddle',
        description: 'Buy ATM call + ATM put — profit from big moves either way',
        category: 'volatile',
        legs: (S, step) => {
            const atm = Math.round(S / step) * step
            return [
                { type: 'call', strike: atm, premium: 0, qty: 1 },
                { type: 'put', strike: atm, premium: 0, qty: 1 },
            ]
        },
    },
    {
        id: 'strangle',
        name: 'Long Strangle',
        description: 'Buy OTM call + OTM put — cheaper volatility play',
        category: 'volatile',
        legs: (S, step) => [
            { type: 'call', strike: Math.round(S / step) * step + step, premium: 0, qty: 1 },
            { type: 'put', strike: Math.round(S / step) * step - step, premium: 0, qty: 1 },
        ],
    },
    {
        id: 'iron_condor',
        name: 'Iron Condor',
        description: 'Sell OTM call spread + OTM put spread — profit from range-bound market',
        category: 'neutral',
        legs: (S, step) => {
            const atm = Math.round(S / step) * step
            return [
                { type: 'put', strike: atm - step * 2, premium: 0, qty: 1 },
                { type: 'put', strike: atm - step, premium: 0, qty: -1 },
                { type: 'call', strike: atm + step, premium: 0, qty: -1 },
                { type: 'call', strike: atm + step * 2, premium: 0, qty: 1 },
            ]
        },
    },
    {
        id: 'butterfly',
        name: 'Long Butterfly',
        description: 'Buy 1 low call + Sell 2 ATM calls + Buy 1 high call — pinpoint target',
        category: 'neutral',
        legs: (S, step) => {
            const atm = Math.round(S / step) * step
            return [
                { type: 'call', strike: atm - step, premium: 0, qty: 1 },
                { type: 'call', strike: atm, premium: 0, qty: -2 },
                { type: 'call', strike: atm + step, premium: 0, qty: 1 },
            ]
        },
    },
    {
        id: 'covered_call',
        name: 'Covered Call',
        description: 'Own stock + Sell OTM call — generate income, cap upside',
        category: 'neutral',
        legs: (S, step) => [
            { type: 'call', strike: Math.round(S / step) * step + step, premium: 0, qty: -1 },
        ],
    },
]

// ─── F&O Stocks List (NSE) ───
export const FNO_SYMBOLS = [
    'NIFTY', 'BANKNIFTY', 'FINNIFTY',
    'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS',
    'ITC', 'WIPRO', 'HCLTECH', 'LT', 'AXISBANK', 'KOTAKBANK', 'BHARTIARTL',
    'MARUTI', 'SUNPHARMA', 'TITAN', 'BAJFINANCE', 'BAJAJFINSV', 'ADANIENT',
    'TATASTEEL', 'POWERGRID', 'NTPC', 'ONGC', 'JSWSTEEL', 'HINDALCO',
    'M_M', 'DRREDDY', 'CIPLA', 'GRASIM', 'ULTRACEMCO', 'SHREECEM',
    'TECHM', 'TATACONSUM', 'ASIANPAINT', 'DIVISLAB', 'EICHERMOT',
    'BPCL', 'IOC', 'COALINDIA', 'HAL', 'BEL', 'PIDILITIND', 'DABUR',
    'HEROMOTOCO', 'APOLLOHOSP', 'TRENT',
]
