import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query) {
        return NextResponse.json([])
    }

    try {
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

        // Filter and map to our format
        const results = (data.quotes || [])
            .filter((q: any) => q.quoteType === 'EQUITY' && (q.exchange === 'NSI' || q.exchange === 'BSE'))
            .map((q: any) => {
                const cleanSymbol = q.symbol.replace(/\.(NS|BO)$/, '')
                return {
                    symbol: cleanSymbol,
                    name: q.shortname || q.longname || cleanSymbol,
                    sector: q.sector || q.exchDisp || 'Equities',
                    exchange: q.exchange === 'NSI' ? 'NSE' : 'BSE'
                }
            })

        // Deduplicate by clean symbol (in case it returns both .NS and .BO, prefer the first one which is usually NSE)
        const uniqueResults = Array.from(new Map(results.map((item: any) => [item.symbol, item])).values())

        return NextResponse.json(uniqueResults)
    } catch (error) {
        console.error('Search API error:', error)
        // Fallback: just return what they typed so they can still try to chart it
        const fallback = query.toUpperCase()
        return NextResponse.json([{ symbol: fallback, name: `${fallback} (Search fallback)`, sector: 'Unknown' }])
    }
}
