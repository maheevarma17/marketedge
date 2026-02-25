import { NextResponse } from 'next/server'

// Free Yahoo Finance API - no key needed
async function fetchYahooQuote(symbolUrl: string) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbolUrl}?interval=1d&range=1d`

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        next: { revalidate: 30 } // cache for 30 seconds
    })

    if (!res.ok) {
        throw new Error(`Yahoo Finance API error: ${res.status}`)
    }

    const data = await res.json()
    const result = data.chart?.result?.[0]

    if (!result) {
        throw new Error('No data found for symbol')
    }

    return result
}

async function getQuote(symbol: string) {
    let ySymbol = symbol
    let isIndex = false

    if (symbol.startsWith('^')) {
        ySymbol = symbol // index symbols like ^NSEI, ^NSEBANK
        isIndex = true
    } else if (symbol.includes('.')) {
        ySymbol = symbol // already has exchange suffix
    } else {
        ySymbol = `${symbol}.NS` // NSE stock
    }

    let result
    try {
        result = await fetchYahooQuote(ySymbol)
    } catch (error) {
        // Smart Fallback: If NSE fails, try BSE
        if (!isIndex && symbol === ySymbol.split('.')[0] && ySymbol.endsWith('.NS')) {
            const bseSymbol = `${symbol}.BO`
            try {
                result = await fetchYahooQuote(bseSymbol)
                ySymbol = bseSymbol
            } catch (bseError) {
                throw error
            }
        } else {
            throw error
        }
    }

    const meta = result.meta
    const price = meta.regularMarketPrice
    const prevClose = meta.chartPreviousClose || meta.previousClose
    const change = price - prevClose
    const changePct = (change / prevClose) * 100

    return {
        symbol: symbol.toUpperCase(),
        name: meta.shortName || meta.longName || symbol,
        price: parseFloat(price.toFixed(2)),
        prevClose: parseFloat(prevClose.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePct: parseFloat(changePct.toFixed(2)),
        dayHigh: meta.regularMarketDayHigh,
        dayLow: meta.regularMarketDayLow,
        volume: meta.regularMarketVolume,
        exchange: meta.exchangeName || (ySymbol.endsWith('.BO') ? 'BSE' : 'NSE'),
        currency: meta.currency,
        marketState: meta.marketState, // PRE, REGULAR, POST, CLOSED
        timestamp: Date.now()
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await params

        if (!symbol) {
            return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
        }

        const quote = await getQuote(symbol.toUpperCase())
        return NextResponse.json(quote)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch quote'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
