'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/theme'

type Sentiment = 'bullish' | 'bearish' | 'neutral'
type Category = 'All' | 'Markets' | 'Earnings' | 'Sectors' | 'IPO' | 'Policy' | 'Global'

interface NewsItem {
    id: number
    title: string
    summary: string
    source: string
    time: string
    sentiment: Sentiment
    category: Category
    symbol?: string
    breaking?: boolean
}

const SENTIMENT_BADGE: Record<Sentiment, { label: string; emoji: string }> = {
    bullish: { label: 'Bullish', emoji: '🟢' },
    bearish: { label: 'Bearish', emoji: '🔴' },
    neutral: { label: 'Neutral', emoji: '🟡' },
}

const NEWS_DATA: NewsItem[] = [
    { id: 1, title: 'Nifty 50 hits all-time high of 25,800, led by IT and banking stocks', summary: 'The benchmark index surged 1.2% in today\'s session with broad-based buying. Foreign investors turned net buyers after 3 weeks of selling.', source: 'ET Markets', time: '14 min ago', sentiment: 'bullish', category: 'Markets', breaking: true },
    { id: 2, title: 'RBI keeps repo rate unchanged at 6.5% for 10th consecutive time', summary: 'The monetary policy committee voted 4-2 to maintain status quo, citing persistent food inflation. GDP growth forecast retained at 7%.', source: 'Mint', time: '32 min ago', sentiment: 'neutral', category: 'Policy' },
    { id: 3, title: 'TCS Q4 results: Net profit rises 12% YoY to ₹12,434 crore', summary: 'Revenue grew 4.4% sequentially. Deal TCV at $12.2 billion. Management guides for double-digit growth in FY26.', source: 'Moneycontrol', time: '1 hr ago', sentiment: 'bullish', category: 'Earnings', symbol: 'TCS' },
    { id: 4, title: 'Reliance Industries plans ₹75,000 crore capex in energy transition', summary: 'The company announced massive investment in solar, hydrogen, and battery manufacturing at its AGM. New energy to contribute 30% revenue by 2030.', source: 'Business Standard', time: '1.5 hrs ago', sentiment: 'bullish', category: 'Sectors', symbol: 'RELIANCE' },
    { id: 5, title: 'HDFC Bank asset quality deteriorates in farm loan segment', summary: 'Gross NPA ratio increased by 5 bps to 1.33%. Management expects normalization in next 2 quarters. Net interest margin stable at 3.5%.', source: 'ET Markets', time: '2 hrs ago', sentiment: 'bearish', category: 'Earnings', symbol: 'HDFCBANK' },
    { id: 6, title: 'Zomato to acquire Blinkit\'s logistics arm for ₹4,447 crore', summary: 'The deal will help Zomato strengthen its quick commerce delivery infrastructure. Stock surged 5% on the announcement.', source: 'Livemint', time: '2.5 hrs ago', sentiment: 'bullish', category: 'Sectors', symbol: 'ZOMATO' },
    { id: 7, title: 'India\'s GDP grows 8.2% in Q4 FY25, fastest among major economies', summary: 'Manufacturing and services sectors drove growth. Full-year GDP growth at 7.6%, exceeding RBI estimates. Fiscal deficit at 5.1% of GDP.', source: 'Reuters India', time: '3 hrs ago', sentiment: 'bullish', category: 'Markets' },
    { id: 8, title: 'Adani Group stocks under pressure after fresh Hindenburg allegations', summary: 'Combined market cap eroded by ₹45,000 crore. Adani Enterprises, Adani Ports, and Adani Green led the decline.', source: 'CNBC-TV18', time: '3 hrs ago', sentiment: 'bearish', category: 'Markets', symbol: 'ADANIENT' },
    { id: 9, title: 'Paytm receives NPCI approval to onboard new UPI users', summary: 'Significant positive development for the fintech company after RBI restrictions. Stock rallied 12% intraday.', source: 'ET', time: '3.5 hrs ago', sentiment: 'bullish', category: 'Sectors', symbol: 'PAYTM' },
    { id: 10, title: 'Oil prices surge to $85/barrel on Middle East tensions', summary: 'Brent crude jumped 3.2% on supply disruption fears. Indian oil marketing companies may face margin pressure. OMC stocks fell 2-3%.', source: 'Bloomberg', time: '4 hrs ago', sentiment: 'bearish', category: 'Global' },
    { id: 11, title: 'Infosys wins $2 billion deal from European banking consortium', summary: 'Largest deal in company history. Multi-year engagement spanning digital transformation, cloud migration, and AI integration.', source: 'Moneycontrol', time: '4 hrs ago', sentiment: 'bullish', category: 'Earnings', symbol: 'INFY' },
    { id: 12, title: 'SEBI tightens F&O regulations: Lot sizes to increase from Nov 2025', summary: 'New framework requires minimum contract value of ₹15 lakh. Weekly expiries limited to one per exchange. Impact expected on retail trading volumes.', source: 'BS Markets', time: '4.5 hrs ago', sentiment: 'bearish', category: 'Policy' },
    { id: 13, title: 'Tata Motors: JLR Q4 margins expand to 8.5% on luxury demand', summary: 'Range Rover and Defender sales up 22%. EV order book exceeds 40,000 units. India business EBITDA margin improves to 6.2%.', source: 'Autocar Pro', time: '5 hrs ago', sentiment: 'bullish', category: 'Earnings', symbol: 'TATAMOTORS' },
    { id: 14, title: 'Ola Electric IPO opens tomorrow: Price band ₹72-76 per share', summary: 'Company aims to raise ₹6,146 crore. Largest electric vehicle IPO in India. Grey market premium at 15%.', source: 'IPO Central', time: '5 hrs ago', sentiment: 'neutral', category: 'IPO' },
    { id: 15, title: 'Bajaj Finance: AUM grows 32% YoY to ₹3.3 lakh crore', summary: 'Customer franchise crosses 80 million. New loans booked up 24%. Management confident of maintaining 25%+ AUM growth.', source: 'ET', time: '5.5 hrs ago', sentiment: 'bullish', category: 'Earnings', symbol: 'BAJFINANCE' },
    { id: 16, title: 'Swiggy IPO subscription status: 3.5x on Day 2', summary: 'QIB category subscribed 8.2x, retail 1.4x. Company valued at ₹87,000 crore at upper price band.', source: 'Mint', time: '6 hrs ago', sentiment: 'neutral', category: 'IPO' },
    { id: 17, title: 'US Fed signals rate cut in September, markets rally globally', summary: 'Fed Chair Powell indicated inflation moving in right direction. Dow Jones up 1.5%. Asian markets expected to open positive.', source: 'Reuters', time: '6.5 hrs ago', sentiment: 'bullish', category: 'Global' },
    { id: 18, title: 'SBI reports 24% profit growth to ₹18,331 crore in Q4', summary: 'Net interest income up 20%. Asset quality improves with GNPA at 2.24%. Board approves ₹13.70 dividend per share.', source: 'Business Today', time: '7 hrs ago', sentiment: 'bullish', category: 'Earnings', symbol: 'SBIN' },
    { id: 19, title: 'Pharma sector rally: Sun Pharma, Cipla hit 52-week highs', summary: 'US FDA approvals and strong domestic demand driving sector re-rating. Nifty Pharma up 3.2% this week.', source: 'NDTV Profit', time: '7 hrs ago', sentiment: 'bullish', category: 'Sectors', symbol: 'SUNPHARMA' },
    { id: 20, title: 'Coal India: Government to divest 3% stake via OFS at ₹420/share', summary: 'Disinvestment expected to raise ₹7,800 crore. Floor price at 5% discount to CMP. Institutional demand expected to be strong.', source: 'ET Markets', time: '8 hrs ago', sentiment: 'bearish', category: 'Markets', symbol: 'COALINDIA' },
]

const CATEGORIES: Category[] = ['All', 'Markets', 'Earnings', 'Sectors', 'IPO', 'Policy', 'Global']

export default function NewsPage() {
    const { t } = useTheme()
    const [category, setCategory] = useState<Category>('All')
    const [sentimentFilter, setSentimentFilter] = useState<Sentiment | 'all'>('all')

    const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }

    const filtered = NEWS_DATA.filter(n => {
        if (category !== 'All' && n.category !== category) return false
        if (sentimentFilter !== 'all' && n.sentiment !== sentimentFilter) return false
        return true
    })

    const breaking = NEWS_DATA.find(n => n.breaking)

    return (
        <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: t.text, letterSpacing: '-0.03em' }}>Market News</div>
                <div style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>
                    Latest financial news · Sentiment analysis · Sector coverage
                </div>
            </div>

            {/* Breaking News Ticker */}
            {breaking && (
                <div style={{
                    background: `${t.red}15`, border: `1px solid ${t.red}30`, borderRadius: '12px',
                    padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                    <span style={{ background: t.red, color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, animation: 'softPulse 2s infinite' }}>BREAKING</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{breaking.title}</span>
                </div>
            )}

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', background: category === cat ? t.accent : t.bgInput, color: category === cat ? '#fff' : t.textDim,
                        transition: 'all 0.2s ease',
                    }}>{cat}</button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    {(['all', 'bullish', 'bearish', 'neutral'] as const).map(s => (
                        <button key={s} onClick={() => setSentimentFilter(s)} style={{
                            padding: '5px 10px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 600,
                            cursor: 'pointer',
                            background: sentimentFilter === s ? (s === 'bullish' ? `${t.green}30` : s === 'bearish' ? `${t.red}30` : s === 'neutral' ? `${t.yellow}30` : t.bgInput) : t.bgInput,
                            color: sentimentFilter === s ? (s === 'bullish' ? t.green : s === 'bearish' ? t.red : s === 'neutral' ? t.yellow : t.textDim) : t.textDim,
                        }}>{s === 'all' ? 'All' : SENTIMENT_BADGE[s].emoji + ' ' + SENTIMENT_BADGE[s].label}</button>
                    ))}
                </div>
            </div>

            {/* News Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map(news => (
                    <div key={news.id}
                        onClick={() => news.symbol && (window.location.href = `/charts?symbol=${news.symbol}`)}
                        style={{
                            background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px',
                            padding: '18px 20px', boxShadow: t.shadow,
                            cursor: news.symbol ? 'pointer' : 'default', transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => { if (news.symbol) e.currentTarget.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '14.5px', fontWeight: 600, color: t.text, lineHeight: 1.4, letterSpacing: '-0.01em' }}>{news.title}</span>
                                </div>
                                <div style={{ fontSize: '12.5px', color: t.textDim, lineHeight: 1.5, marginBottom: '10px' }}>{news.summary}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '10.5px', color: t.textDim, ...mono }}>{news.time}</span>
                                    <span style={{ fontSize: '10.5px', color: t.textDim }}>·</span>
                                    <span style={{ fontSize: '10.5px', color: t.textMuted, fontWeight: 500 }}>{news.source}</span>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: `${t.accent}15`, color: t.accent }}>{news.category}</span>
                                    {news.symbol && (
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: t.bgInput, color: t.text, ...mono }}>{news.symbol}</span>
                                    )}
                                </div>
                            </div>
                            <div style={{
                                padding: '6px 10px', borderRadius: '8px', flexShrink: 0,
                                background: news.sentiment === 'bullish' ? `${t.green}15` : news.sentiment === 'bearish' ? `${t.red}15` : `${t.yellow}15`,
                                color: news.sentiment === 'bullish' ? t.green : news.sentiment === 'bearish' ? t.red : t.yellow,
                                fontSize: '11px', fontWeight: 600, textAlign: 'center',
                            }}>
                                {SENTIMENT_BADGE[news.sentiment].emoji}
                                <div style={{ fontSize: '9px', marginTop: '2px' }}>{SENTIMENT_BADGE[news.sentiment].label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
