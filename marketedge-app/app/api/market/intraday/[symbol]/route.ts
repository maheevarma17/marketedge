import { NextResponse } from 'next/server'

async function fetchYahooIntraday(symbolUrl: string, interval: string, range: string) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbolUrl}?interval=${interval}&range=${range}`
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        next: { revalidate: 60 } // cache for 1 minute (intraday data changes frequently)
    })

    if (!res.ok) {
        throw new Error(`Yahoo Finance API error: ${res.status}`)
    }

    const data = await res.json()
    const result = data.chart?.result?.[0]

    if (!result) {
        throw new Error('No intraday data found for symbol')
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
        const interval = searchParams.get('interval') || '5m' // 1m, 5m, 15m, 30m, 1h
        const days = parseInt(searchParams.get('days') || '5')

        if (!symbol) {
            return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
        }

        let ySymbol = symbol.toUpperCase()
        let isIndex = false

        if (ySymbol.startsWith('^')) {
            isIndex = true
        } else if (ySymbol.includes('.')) {
            // Already has an exchange suffix
        } else {
            ySymbol = `${ySymbol}.NS`
        }

        // Yahoo Finance limits intraday data:
        // 1m: max 7 days, 5m/15m: max 60 days, 30m/1h: max 730 days
        const range = days <= 7 ? `${days}d` : days <= 60 ? `${days}d` : `${Math.min(days, 730)}d`

        let result
        try {
            result = await fetchYahooIntraday(ySymbol, interval, range)
        } catch (error) {
            // Smart Fallback: If NSE fails, try BSE
            if (!isIndex && symbol.toUpperCase() === ySymbol.split('.')[0] && ySymbol.endsWith('.NS')) {
                const bseSymbol = `${symbol.toUpperCase()}.BO`
                try {
                    result = await fetchYahooIntraday(bseSymbol, interval, range)
                    ySymbol = bseSymbol
                } catch (bseError) {
                    throw error
                }
            } else {
                throw error
            }
        }

        const timestamps = result.timestamp || []
        const quotes = result.indicators?.quote?.[0] || {}

        const candles = timestamps.map((ts: number, i: number) => {
            const dt = new Date(ts * 1000)
            return {
                date: dt.toISOString().replace('T', ' ').substring(0, 19),
                timestamp: ts,
                open: quotes.open?.[i] ? parseFloat(quotes.open[i].toFixed(2)) : null,
                high: quotes.high?.[i] ? parseFloat(quotes.high[i].toFixed(2)) : null,
                low: quotes.low?.[i] ? parseFloat(quotes.low[i].toFixed(2)) : null,
                close: quotes.close?.[i] ? parseFloat(quotes.close[i].toFixed(2)) : null,
                volume: quotes.volume?.[i] || 0,
            }
        }).filter((c: { close: number | null }) => c.close !== null)

        return NextResponse.json({
            symbol: symbol.toUpperCase(),
            name: result.meta?.shortName || result.meta?.longName || symbol,
            currency: result.meta?.currency || 'INR',
            exchange: result.meta?.exchangeName || (ySymbol.endsWith('.BO') ? 'BSE' : 'NSE'),
            interval,
            count: candles.length,
            candles,
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch intraday data'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
