// ──────────────────────────────────────
// API helpers for market data
// ──────────────────────────────────────

export interface StockQuote {
    symbol: string
    name: string
    price: number
    prevClose: number
    change: number
    changePct: number
    dayHigh: number
    dayLow: number
    volume: number
    exchange: string
    currency: string
    marketState: string
    timestamp: number
}

export interface StockSearchResult {
    symbol: string
    name: string
    exchange?: string
}

// Fetch real-time quote for a stock
export async function getQuote(symbol: string): Promise<StockQuote> {
    const res = await fetch(`/api/market/quote/${encodeURIComponent(symbol)}`)
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch quote')
    }
    return res.json()
}

// Search stocks by name or symbol
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
    if (!query || query.length < 1) return []
    const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    return res.json()
}
