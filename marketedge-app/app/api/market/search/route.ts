import { NextResponse } from 'next/server'

// ─── Popular Indian Indices ───
const INDIAN_INDICES: Record<string, { symbol: string; name: string; exchange: string }> = {
    'NIFTY': { symbol: '^NSEI', name: 'NIFTY 50 Index', exchange: 'NSE' },
    'NIFTY50': { symbol: '^NSEI', name: 'NIFTY 50 Index', exchange: 'NSE' },
    'NIFTY 50': { symbol: '^NSEI', name: 'NIFTY 50 Index', exchange: 'NSE' },
    'BANKNIFTY': { symbol: '^NSEBANK', name: 'Nifty Bank Index', exchange: 'NSE' },
    'BANK NIFTY': { symbol: '^NSEBANK', name: 'Nifty Bank Index', exchange: 'NSE' },
    'NIFTYIT': { symbol: '^CNXIT', name: 'Nifty IT Index', exchange: 'NSE' },
    'NIFTY IT': { symbol: '^CNXIT', name: 'Nifty IT Index', exchange: 'NSE' },
    'SENSEX': { symbol: '^BSESN', name: 'BSE SENSEX', exchange: 'BSE' },
    'NIFTY200': { symbol: '^CNX200', name: 'Nifty 200 Index', exchange: 'NSE' },
    'NIFTY 200': { symbol: '^CNX200', name: 'Nifty 200 Index', exchange: 'NSE' },
    'NIFTYMIDCAP': { symbol: 'NIFTY_MIDCAP_100.NS', name: 'Nifty Midcap 100', exchange: 'NSE' },
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query) {
        return NextResponse.json([])
    }

    try {
        // Check for index matches first
        const queryUpper = query.toUpperCase().trim()
        const indexMatches: any[] = []
        for (const [key, val] of Object.entries(INDIAN_INDICES)) {
            if (key.includes(queryUpper) || queryUpper.includes(key)) {
                // Avoid duplicates
                if (!indexMatches.find(m => m.symbol === val.symbol)) {
                    indexMatches.push(val)
                }
            }
        }

        const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&country=India`

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            next: { revalidate: 3600 } // cache for 1 hour
        })

        if (!res.ok) {
            throw new Error(`Yahoo Finance Search API error: ${res.status}`)
        }

        const data = await res.json()

        // Filter for Indian equities AND indices
        const results = (data.quotes || [])
            .filter((q: any) => {
                // Allow equities from NSE/BSE
                if (q.quoteType === 'EQUITY' && (q.exchange === 'NSI' || q.exchange === 'BSE')) return true
                // Also allow indices
                if (q.quoteType === 'INDEX') return true
                // Allow ETFs from NSE
                if (q.quoteType === 'ETF' && (q.exchange === 'NSI' || q.exchange === 'BSE')) return true
                return false
            })
            .map((q: any) => {
                const isIndex = q.quoteType === 'INDEX'
                const cleanSymbol = isIndex ? q.symbol : q.symbol.replace(/\.(NS|BO)$/, '')
                return {
                    symbol: cleanSymbol,
                    name: q.shortname || q.longname || cleanSymbol,
                    sector: q.sector || q.exchDisp || (isIndex ? 'Index' : 'Equities'),
                    exchange: isIndex ? (q.exchange === 'NSI' ? 'NSE' : q.exchDisp || 'INDEX') : (q.exchange === 'NSI' ? 'NSE' : 'BSE')
                }
            })

        // Deduplicate by clean symbol
        const uniqueResults = Array.from(new Map(results.map((item: any) => [item.symbol, item])).values())

        // Prepend index matches (if any) at the top
        const combined = [...indexMatches, ...uniqueResults.filter((r: any) => !indexMatches.find(m => m.symbol === r.symbol))]

        return NextResponse.json(combined)
    } catch (error) {
        console.error('Search API error:', error)
        // Fallback: return indices + typed text
        const queryUpper = query.toUpperCase()
        const indexResults = Object.entries(INDIAN_INDICES)
            .filter(([key]) => key.includes(queryUpper))
            .map(([, val]) => val)
            .filter((v, i, a) => a.findIndex(x => x.symbol === v.symbol) === i)

        const fallback = queryUpper
        return NextResponse.json([
            ...indexResults,
            { symbol: fallback, name: `${fallback} (Search fallback)`, sector: 'Unknown' }
        ])
    }
}
