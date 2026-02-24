'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/theme'

type Category = 'all' | 'technical' | 'fundamental' | 'options' | 'risk' | 'psychology'

interface Lesson {
    id: number
    title: string
    category: Category
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
    duration: string
    content: string[]
    keyTakeaway: string
}

interface GlossaryTerm {
    term: string
    definition: string
    category: Category
}

const LESSONS: Lesson[] = [
    {
        id: 1, title: 'Candlestick Patterns: The Foundation', category: 'technical', difficulty: 'Beginner', duration: '5 min',
        content: ['Candlestick charts originated in 18th century Japan for rice trading. Each candle shows 4 prices: Open, High, Low, Close.',
            'Green/white candles = Close > Open (bullish). Red/black candles = Close < Open (bearish).',
            'Key patterns: Doji (indecision), Hammer (reversal at bottom), Shooting Star (reversal at top), Engulfing (strong reversal).',
            'A Morning Star is a 3-candle reversal pattern: large red → doji/small body → large green. It signals a bottom.'],
        keyTakeaway: 'Always confirm candlestick patterns with volume and support/resistance levels.'
    },
    {
        id: 2, title: 'Moving Averages: SMA vs EMA', category: 'technical', difficulty: 'Beginner', duration: '6 min',
        content: ['SMA (Simple Moving Average) gives equal weight to all periods. EMA (Exponential) gives more weight to recent prices.',
            'Common periods: 20 EMA (short-term trend), 50 SMA (medium), 200 SMA (long-term). The 200 SMA is the "granddaddy" of all MAs.',
            'Golden Cross: 50 SMA crosses above 200 SMA → bullish signal. Death Cross: 50 SMA crosses below 200 SMA → bearish signal.',
            'Moving averages act as dynamic support/resistance. Price tends to "bounce" off the 20 EMA in trending markets.'],
        keyTakeaway: 'Use shorter MAs for entries and longer MAs for trend confirmation. Never use MAs alone in ranging markets.'
    },
    {
        id: 3, title: 'RSI: Reading Market Momentum', category: 'technical', difficulty: 'Intermediate', duration: '7 min',
        content: ['RSI (Relative Strength Index) oscillates between 0-100. Default period: 14.',
            'Above 70 = overbought (potential reversal down). Below 30 = oversold (potential reversal up).',
            'RSI Divergence: When price makes new high but RSI makes lower high → bearish divergence (strong reversal signal).',
            'In strong trends, RSI can stay overbought/oversold for extended periods. Don\'t blindly sell at RSI 70 in a bull market.'],
        keyTakeaway: 'RSI divergence is one of the most reliable reversal signals. Always combine with price action.'
    },
    {
        id: 4, title: 'Support & Resistance: Price Memory', category: 'technical', difficulty: 'Beginner', duration: '5 min',
        content: ['Support = price level where buying pressure overcomes selling. Resistance = where selling overcomes buying.',
            'The more times a level is tested, the stronger it becomes. But each test weakens it slightly.',
            'Broken resistance becomes support (and vice versa). This is called "polarity change."',
            'Round numbers (₹1000, ₹500, ₹100) often act as psychological support/resistance levels.'],
        keyTakeaway: 'Draw S/R levels on higher timeframes first, then use them for entries on lower timeframes.'
    },
    {
        id: 5, title: 'Options Greeks: Delta, Gamma, Theta, Vega', category: 'options', difficulty: 'Advanced', duration: '10 min',
        content: ['Delta: Rate of change of option price vs underlying. ATM calls have ~0.5 delta. Puts have negative delta.',
            'Gamma: Rate of change of delta. Highest for ATM options near expiry. Gamma risk increases on expiry day.',
            'Theta: Time decay per day. Options lose value every day. Theta accelerates in the last week before expiry.',
            'Vega: Sensitivity to volatility. Higher IV increases both call and put prices. Buy options when IV is low, sell when high.',
            'For option sellers, theta is your friend but gamma is your enemy. For buyers, its the opposite.'],
        keyTakeaway: 'Never buy options with high IV (like before results). Sell options when IV rank > 50.'
    },
    {
        id: 6, title: 'Position Sizing: The 2% Rule', category: 'risk', difficulty: 'Beginner', duration: '4 min',
        content: ['Never risk more than 1-2% of your capital on a single trade. This is the most important rule in trading.',
            'If you have ₹10L capital and risk 2%, max loss = ₹20,000. Your stop loss determines your position size.',
            'Example: Stock at ₹500, stop loss at ₹480. Risk per share = ₹20. Max shares = ₹20,000 / ₹20 = 1,000 shares.',
            'Even with 10 consecutive losses at 2%, you only lose 18% of capital. Recovery is possible.'],
        keyTakeaway: 'Position sizing, not entry timing, determines long-term survival in trading.'
    },
    {
        id: 7, title: 'Trading Psychology: Fear & Greed', category: 'psychology', difficulty: 'Intermediate', duration: '6 min',
        content: ['Fear makes you: Exit winners too early, avoid trades, move stops closer, reduce position sizes.',
            'Greed makes you: Hold losers hoping for recovery, average down, overtrade, use excessive leverage.',
            'FOMO (Fear of Missing Out): Chasing stocks that have already moved 10%. This is the #1 account killer.',
            'Solution: Pre-plan every trade. Write down entry, stop loss, target BEFORE entering. Follow the plan mechanically.',
            'Keep a trade journal. Track your emotions. Pattern recognition in your psychology is as important as chart patterns.'],
        keyTakeaway: 'The market rewards discipline, not intelligence. Control your emotions or they will control your P&L.'
    },
    {
        id: 8, title: 'Fibonacci Retracements', category: 'technical', difficulty: 'Intermediate', duration: '7 min',
        content: ['Key Fibonacci levels: 23.6%, 38.2%, 50%, 61.8%, 78.6%. The 61.8% is called the "Golden Ratio."',
            'In an uptrend, draw Fib from swing low to swing high. Price often retraces to 38.2% or 61.8% before continuing.',
            'The 61.8% retracement is the most watched level. Strong trends hold this level; breaking it suggests trend reversal.',
            'Fibonacci extensions (127.2%, 161.8%) are used for profit targets in the direction of the trend.'],
        keyTakeaway: 'Use Fibonacci with other confluence factors (S/R, MAs, trendlines) for high-probability setups.'
    },
    {
        id: 9, title: 'Volume Analysis: The Truth Detector', category: 'technical', difficulty: 'Intermediate', duration: '5 min',
        content: ['Volume confirms price moves. High volume breakout = genuine. Low volume breakout = likely to fail.',
            'Volume should increase in the direction of the trend. Declining volume in a trend = weakening momentum.',
            'Volume climax (extremely high volume after a big move) often marks a reversal point.',
            'On Balance Volume (OBV): Running total of volume. Rising OBV with flat price = accumulation. Smart money buying.'],
        keyTakeaway: 'Price is what you see. Volume is why it moved. Never ignore volume during breakouts.'
    },
    {
        id: 10, title: 'Risk/Reward Ratio: The Edge', category: 'risk', difficulty: 'Beginner', duration: '4 min',
        content: ['Minimum acceptable R:R is 1:2. Risk ₹1 to make ₹2. This means you can be wrong 50% of the time and still profit.',
            'With 1:3 R:R, you only need 25% win rate to break even. This is why R:R matters more than win rate.',
            'Calculate R:R BEFORE entering a trade. If the target doesn\'t offer at least 1:2, skip the trade.',
            'Most professional traders have 40-50% win rate but still profit because their winners are 2-3x their losers.'],
        keyTakeaway: 'A 40% win rate with 1:3 R:R beats a 70% win rate with 1:0.5 R:R. Math is your edge.'
    },
    {
        id: 11, title: 'P/E Ratio & Valuation Basics', category: 'fundamental', difficulty: 'Beginner', duration: '5 min',
        content: ['P/E Ratio = Market Price / Earnings Per Share. It tells you how much you\'re paying for ₹1 of earnings.',
            'Low P/E (< 15): Potentially undervalued or slow growth. High P/E (> 30): Expensive or fast growth expected.',
            'Compare P/E within the same sector. IT stocks typically have higher P/E than banking stocks.',
            'PEG Ratio = P/E / Growth Rate. A PEG < 1 suggests the stock may be undervalued relative to its growth.'],
        keyTakeaway: 'P/E alone doesn\'t tell the full story. Always consider growth rate, sector, and debt levels.'
    },
    {
        id: 12, title: 'Straddle & Strangle Strategies', category: 'options', difficulty: 'Advanced', duration: '8 min',
        content: ['Straddle: Buy ATM Call + ATM Put. Profits from big moves in either direction. Best before events (earnings, RBI policy).',
            'Strangle: Buy OTM Call + OTM Put. Cheaper than straddle but needs bigger move to profit. Higher breakeven.',
            'Short Straddle: Sell ATM Call + Put. Profits when stock stays flat. Time decay works for you. Unlimited risk.',
            'Best time to buy straddles: When IV is low before a known event. Worst time: When IV is already high.'],
        keyTakeaway: 'Buy volatility when it\'s cheap (IV rank < 20), sell when expensive (IV rank > 60).'
    },
]

const GLOSSARY: GlossaryTerm[] = [
    { term: 'ATM', definition: 'At The Money — option strike price equal to stock price', category: 'options' },
    { term: 'OTM', definition: 'Out of The Money — call strike above / put strike below stock price', category: 'options' },
    { term: 'ITM', definition: 'In The Money — call strike below / put strike above stock price', category: 'options' },
    { term: 'IV', definition: 'Implied Volatility — market\'s expected future volatility priced into options', category: 'options' },
    { term: 'Lot Size', definition: 'Minimum quantity required to trade a futures/options contract', category: 'options' },
    { term: 'Premium', definition: 'Price paid to buy an option contract', category: 'options' },
    { term: 'Open Interest', definition: 'Total outstanding contracts that haven\'t been settled', category: 'options' },
    { term: 'Breakout', definition: 'Price moving above resistance or below support with volume', category: 'technical' },
    { term: 'Pullback', definition: 'Temporary price reversal within a larger trend', category: 'technical' },
    { term: 'Consolidation', definition: 'Period of sideways price movement within a defined range', category: 'technical' },
    { term: 'Gap Up/Down', definition: 'Price opening significantly above/below previous close', category: 'technical' },
    { term: 'VWAP', definition: 'Volume Weighted Average Price — institutional benchmark price', category: 'technical' },
    { term: 'EMA', definition: 'Exponential Moving Average — gives more weight to recent prices', category: 'technical' },
    { term: 'RSI', definition: 'Relative Strength Index — momentum oscillator (0-100)', category: 'technical' },
    { term: 'MACD', definition: 'Moving Average Convergence Divergence — trend and momentum indicator', category: 'technical' },
    { term: 'Bollinger Bands', definition: 'Volatility bands at 2 standard deviations above/below 20 SMA', category: 'technical' },
    { term: 'Market Cap', definition: 'Total market value of a company = share price × total shares', category: 'fundamental' },
    { term: 'EPS', definition: 'Earnings Per Share — company profit divided by outstanding shares', category: 'fundamental' },
    { term: 'P/E Ratio', definition: 'Price to Earnings ratio — market price / EPS', category: 'fundamental' },
    { term: 'ROE', definition: 'Return on Equity — net income / shareholders equity', category: 'fundamental' },
    { term: 'Debt/Equity', definition: 'Total debt divided by shareholders equity — measures leverage', category: 'fundamental' },
    { term: 'Dividend Yield', definition: 'Annual dividend per share / current share price × 100', category: 'fundamental' },
    { term: 'Book Value', definition: 'Net asset value of a company / number of outstanding shares', category: 'fundamental' },
    { term: 'Stop Loss', definition: 'Predetermined exit price to limit losses on a trade', category: 'risk' },
    { term: 'Position Sizing', definition: 'Determining how many shares to buy based on risk tolerance', category: 'risk' },
    { term: 'Risk/Reward', definition: 'Ratio of potential loss to potential gain on a trade', category: 'risk' },
    { term: 'Max Drawdown', definition: 'Largest peak-to-trough decline in portfolio value', category: 'risk' },
    { term: 'Sharpe Ratio', definition: 'Risk-adjusted return = (return - risk-free rate) / volatility', category: 'risk' },
    { term: 'Win Rate', definition: 'Percentage of trades that are profitable', category: 'risk' },
    { term: 'Profit Factor', definition: 'Gross profit / gross loss — above 1.5 is good', category: 'risk' },
    { term: 'FOMO', definition: 'Fear Of Missing Out — emotional urge to chase a stock', category: 'psychology' },
    { term: 'Revenge Trading', definition: 'Trading aggressively to recover losses — usually leads to more losses', category: 'psychology' },
    { term: 'Paper Hands', definition: 'Selling a position too early due to fear of minor losses', category: 'psychology' },
    { term: 'Bagholding', definition: 'Holding a losing stock hoping it recovers instead of cutting losses', category: 'psychology' },
    { term: 'Circuit Breaker', definition: 'Trading halt when stock moves ±5/10/20% (upper/lower circuit)', category: 'fundamental' },
    { term: 'NSE/BSE', definition: 'National Stock Exchange / Bombay Stock Exchange — India\'s two main exchanges', category: 'fundamental' },
    { term: 'Nifty 50', definition: 'Benchmark index of 50 large-cap NSE stocks', category: 'fundamental' },
    { term: 'Sensex', definition: 'BSE benchmark index of 30 large-cap stocks', category: 'fundamental' },
    { term: 'FII/DII', definition: 'Foreign/Domestic Institutional Investors — their activity drives markets', category: 'fundamental' },
    { term: 'Expiry', definition: 'Last trading day of a futures/options contract. Weekly (Thursday) or monthly.', category: 'options' },
]

const CATEGORY_LABELS: Record<Category, string> = {
    all: 'All', technical: '📈 Technical', fundamental: '📊 Fundamental',
    options: '⚡ Options', risk: '🛡️ Risk', psychology: '🧠 Psychology',
}

const DIFFICULTY_COLORS: Record<string, string> = {
    Beginner: '#34d399', Intermediate: '#fbbf24', Advanced: '#f87171',
}

export default function LearnPage() {
    const { t } = useTheme()
    const [tab, setTab] = useState<'lessons' | 'glossary'>('lessons')
    const [category, setCategory] = useState<Category>('all')
    const [expandedLesson, setExpandedLesson] = useState<number | null>(null)
    const [glossarySearch, setGlossarySearch] = useState('')

    const filteredLessons = category === 'all' ? LESSONS : LESSONS.filter(l => l.category === category)
    const filteredGlossary = GLOSSARY
        .filter(g => category === 'all' || g.category === category)
        .filter(g => !glossarySearch || g.term.toLowerCase().includes(glossarySearch.toLowerCase()) || g.definition.toLowerCase().includes(glossarySearch.toLowerCase()))

    const card: React.CSSProperties = { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: t.shadow }

    return (
        <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: t.text, letterSpacing: '-0.03em' }}>Learning Center</div>
                <div style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>
                    {LESSONS.length} lessons · {GLOSSARY.length} glossary terms · Master trading fundamentals
                </div>
            </div>

            {/* Main Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                <button onClick={() => setTab('lessons')} style={{
                    padding: '7px 16px', borderRadius: '8px', border: 'none', fontSize: '12.5px', fontWeight: 600,
                    cursor: 'pointer', background: tab === 'lessons' ? t.accent : t.bgInput, color: tab === 'lessons' ? '#fff' : t.textDim,
                }}>📚 Lessons ({LESSONS.length})</button>
                <button onClick={() => setTab('glossary')} style={{
                    padding: '7px 16px', borderRadius: '8px', border: 'none', fontSize: '12.5px', fontWeight: 600,
                    cursor: 'pointer', background: tab === 'glossary' ? t.accent : t.bgInput, color: tab === 'glossary' ? '#fff' : t.textDim,
                }}>📖 Glossary ({GLOSSARY.length})</button>
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} style={{
                        padding: '5px 12px', borderRadius: '6px', border: 'none', fontSize: '11.5px', fontWeight: 600,
                        cursor: 'pointer', background: category === cat ? t.yellow : t.bgInput, color: category === cat ? '#000' : t.textDim,
                    }}>{CATEGORY_LABELS[cat]}</button>
                ))}
            </div>

            {/* Lessons Tab */}
            {tab === 'lessons' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredLessons.map(lesson => (
                        <div key={lesson.id} style={{ ...card, padding: expandedLesson === lesson.id ? '20px' : '14px 20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '18px', width: '36px', height: '36px', borderRadius: '10px', background: t.bgInput, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {lesson.category === 'technical' ? '📈' : lesson.category === 'options' ? '⚡' : lesson.category === 'risk' ? '🛡️' : lesson.category === 'psychology' ? '🧠' : '📊'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '2px' }}>{lesson.title}</div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${DIFFICULTY_COLORS[lesson.difficulty]}20`, color: DIFFICULTY_COLORS[lesson.difficulty], fontWeight: 600 }}>{lesson.difficulty}</span>
                                        <span style={{ fontSize: '10px', color: t.textDim }}>⏱ {lesson.duration}</span>
                                    </div>
                                </div>
                                <span style={{ fontSize: '18px', color: t.textDim, transform: expandedLesson === lesson.id ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>›</span>
                            </div>
                            {expandedLesson === lesson.id && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${t.border}` }}>
                                    {lesson.content.map((para, i) => (
                                        <p key={i} style={{ fontSize: '13px', color: t.textMuted, lineHeight: 1.7, marginBottom: '10px' }}>{para}</p>
                                    ))}
                                    <div style={{ padding: '12px 16px', background: `${t.accent}10`, borderRadius: '10px', borderLeft: `3px solid ${t.accent}`, marginTop: '12px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 600, color: t.accent, marginBottom: '4px', letterSpacing: '0.04em' }}>KEY TAKEAWAY</div>
                                        <div style={{ fontSize: '13px', color: t.text, fontWeight: 500, lineHeight: 1.5 }}>{lesson.keyTakeaway}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Glossary Tab */}
            {tab === 'glossary' && (
                <div>
                    <div style={{ marginBottom: '14px' }}>
                        <input value={glossarySearch} onChange={e => setGlossarySearch(e.target.value)}
                            placeholder="Search terms..."
                            style={{ width: '300px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '9px 14px', color: t.text, fontSize: '13px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {filteredGlossary.map(g => (
                            <div key={g.term} style={{ padding: '12px 16px', background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 700, color: t.text, fontSize: '13px' }}>{g.term}</span>
                                    <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: `${t.accent}15`, color: t.accent, fontWeight: 600 }}>{g.category}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: t.textDim, lineHeight: 1.4 }}>{g.definition}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
