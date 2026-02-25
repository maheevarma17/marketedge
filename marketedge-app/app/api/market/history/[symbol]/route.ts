import { NextResponse } from 'next/server'

async function fetchYahoo(symbolUrl: string, interval: string, range: string) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbolUrl}?interval=${interval}&range=${range}`
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        next: { revalidate: 3600 } // cache for 1 hour (historical data doesn't change)
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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await params
        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') || '5y' // 1y, 2y, 5y, 10y, max
        const interval = searchParams.get('interval') || '1d' // 1d, 1wk, 1mo

        if (!symbol) {
            return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
        }

        let ySymbol = symbol.toUpperCase()
        let isIndex = false

        if (ySymbol.startsWith('^')) {
            isIndex = true
        } else if (ySymbol.includes('.')) {
            // Already has an exchange suffix, try it directly
        } else {
            // No suffix provided. Try NSE first, fallback to BSE later if needed
            ySymbol = `${ySymbol}.NS`
        }

        let result
        try {
            result = await fetchYahoo(ySymbol, interval, range)
        } catch (error) {
            // Smart Fallback: If NSE fails and it's not an index/explicit suffix, try BSE
            if (!isIndex && symbol.toUpperCase() === ySymbol.split('.')[0] && ySymbol.endsWith('.NS')) {
                const bseSymbol = `${symbol.toUpperCase()}.BO`
                try {
                    result = await fetchYahoo(bseSymbol, interval, range)
                    ySymbol = bseSymbol // update ySymbol to BSE if successful
                } catch (bseError) {
                    throw error // throw original NSE error if both fail
                }
            } else {
                throw error
            }
        }

        const timestamps = result.timestamp || []
        const quotes = result.indicators?.quote?.[0] || {}
        const adjClose = result.indicators?.adjclose?.[0]?.adjclose || quotes.close

        // Build OHLCV array
        const candles = timestamps.map((ts: number, i: number) => ({
            date: new Date(ts * 1000).toISOString().split('T')[0],
            timestamp: ts,
            open: quotes.open?.[i] ? parseFloat(quotes.open[i].toFixed(2)) : null,
            high: quotes.high?.[i] ? parseFloat(quotes.high[i].toFixed(2)) : null,
            low: quotes.low?.[i] ? parseFloat(quotes.low[i].toFixed(2)) : null,
            close: quotes.close?.[i] ? parseFloat(quotes.close[i].toFixed(2)) : null,
            adjClose: adjClose?.[i] ? parseFloat(adjClose[i].toFixed(2)) : null,
            volume: quotes.volume?.[i] || 0,
        })).filter((c: { close: number | null }) => c.close !== null)

        return NextResponse.json({
            symbol: symbol.toUpperCase(),
            name: result.meta?.shortName || result.meta?.longName || symbol,
            currency: result.meta?.currency || 'INR',
            exchange: result.meta?.exchangeName || (ySymbol.endsWith('.BO') ? 'BSE' : 'NSE'),
            range,
            interval,
            count: candles.length,
            candles,
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch history'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
