'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/theme'

interface StockHeat {
    symbol: string
    name: string
    change: number
    price: number
    mcap: number // in Cr
}

interface Sector {
    name: string
    stocks: StockHeat[]
}

const SECTORS: Sector[] = [
    {
        name: 'IT', stocks: [
            { symbol: 'TCS', name: 'Tata Consultancy', change: 1.8, price: 3850, mcap: 1400000 },
            { symbol: 'INFY', name: 'Infosys', change: 2.3, price: 1580, mcap: 660000 },
            { symbol: 'WIPRO', name: 'Wipro', change: -0.5, price: 445, mcap: 230000 },
            { symbol: 'HCLTECH', name: 'HCL Technologies', change: 1.2, price: 1340, mcap: 360000 },
            { symbol: 'TECHM', name: 'Tech Mahindra', change: -1.1, price: 1250, mcap: 120000 },
            { symbol: 'LTIM', name: 'LTIMindtree', change: 0.8, price: 5200, mcap: 150000 },
        ]
    },
    {
        name: 'Banking', stocks: [
            { symbol: 'HDFCBANK', name: 'HDFC Bank', change: 0.9, price: 1580, mcap: 1200000 },
            { symbol: 'ICICIBANK', name: 'ICICI Bank', change: 1.5, price: 1020, mcap: 720000 },
            { symbol: 'SBIN', name: 'State Bank', change: -0.3, price: 620, mcap: 550000 },
            { symbol: 'KOTAKBANK', name: 'Kotak Mahindra', change: -1.8, price: 1750, mcap: 350000 },
            { symbol: 'AXISBANK', name: 'Axis Bank', change: 0.6, price: 1050, mcap: 320000 },
            { symbol: 'INDUSINDBK', name: 'IndusInd Bank', change: -2.5, price: 1450, mcap: 110000 },
            { symbol: 'BANKBARODA', name: 'Bank of Baroda', change: 1.1, price: 235, mcap: 120000 },
        ]
    },
    {
        name: 'Energy', stocks: [
            { symbol: 'RELIANCE', name: 'Reliance Industries', change: 0.4, price: 2450, mcap: 1660000 },
            { symbol: 'ONGC', name: 'ONGC', change: -1.2, price: 265, mcap: 330000 },
            { symbol: 'NTPC', name: 'NTPC', change: 1.6, price: 340, mcap: 330000 },
            { symbol: 'POWERGRID', name: 'Power Grid Corp', change: 0.3, price: 285, mcap: 265000 },
            { symbol: 'ADANIENT', name: 'Adani Enterprises', change: -3.2, price: 2850, mcap: 325000 },
            { symbol: 'TATAPOWER', name: 'Tata Power', change: 2.1, price: 410, mcap: 130000 },
        ]
    },
    {
        name: 'FMCG', stocks: [
            { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', change: -0.8, price: 2580, mcap: 605000 },
            { symbol: 'ITC', name: 'ITC', change: 0.5, price: 440, mcap: 550000 },
            { symbol: 'NESTLEIND', name: 'Nestle India', change: -0.2, price: 2450, mcap: 236000 },
            { symbol: 'BRITANNIA', name: 'Britannia', change: 1.3, price: 5200, mcap: 125000 },
            { symbol: 'DABUR', name: 'Dabur India', change: -0.6, price: 560, mcap: 99000 },
        ]
    },
    {
        name: 'Pharma', stocks: [
            { symbol: 'SUNPHARMA', name: 'Sun Pharma', change: 2.8, price: 1350, mcap: 324000 },
            { symbol: 'DRREDDY', name: "Dr Reddy's", change: 1.5, price: 5400, mcap: 90000 },
            { symbol: 'CIPLA', name: 'Cipla', change: 0.9, price: 1380, mcap: 111000 },
            { symbol: 'DIVISLAB', name: 'Divis Labs', change: -0.4, price: 3700, mcap: 98000 },
            { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', change: 1.7, price: 5800, mcap: 83000 },
        ]
    },
    {
        name: 'Auto', stocks: [
            { symbol: 'TATAMOTORS', name: 'Tata Motors', change: 1.4, price: 680, mcap: 250000 },
            { symbol: 'MARUTI', name: 'Maruti Suzuki', change: -0.7, price: 10800, mcap: 340000 },
            { symbol: 'M_M', name: 'Mahindra & Mahindra', change: 2.2, price: 1620, mcap: 200000 },
            { symbol: 'BAJAJ_AUTO', name: 'Bajaj Auto', change: 0.3, price: 6200, mcap: 175000 },
            { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', change: -1.5, price: 4200, mcap: 84000 },
        ]
    },
    {
        name: 'Metals', stocks: [
            { symbol: 'TATASTEEL', name: 'Tata Steel', change: -2.1, price: 130, mcap: 162000 },
            { symbol: 'JSWSTEEL', name: 'JSW Steel', change: -1.8, price: 810, mcap: 197000 },
            { symbol: 'HINDALCO', name: 'Hindalco', change: 1.9, price: 520, mcap: 117000 },
            { symbol: 'VEDL', name: 'Vedanta', change: -0.9, price: 280, mcap: 104000 },
            { symbol: 'COALINDIA', name: 'Coal India', change: 0.7, price: 435, mcap: 268000 },
        ]
    },
    {
        name: 'Finance', stocks: [
            { symbol: 'BAJFINANCE', name: 'Bajaj Finance', change: 1.6, price: 6800, mcap: 420000 },
            { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', change: 0.8, price: 1600, mcap: 255000 },
            { symbol: 'HDFCLIFE', name: 'HDFC Life', change: -0.3, price: 620, mcap: 133000 },
            { symbol: 'SBILIFE', name: 'SBI Life', change: 1.1, price: 1400, mcap: 140000 },
        ]
    },
    {
        name: 'Telecom', stocks: [
            { symbol: 'BHARTIARTL', name: 'Bharti Airtel', change: 1.3, price: 1380, mcap: 820000 },
        ]
    },
    {
        name: 'Infra', stocks: [
            { symbol: 'LT', name: 'Larsen & Toubro', change: 0.6, price: 3200, mcap: 440000 },
            { symbol: 'ADANIPORTS', name: 'Adani Ports', change: -1.4, price: 1180, mcap: 255000 },
            { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', change: 0.3, price: 9800, mcap: 283000 },
        ]
    },
]

export default function HeatmapPage() {
    const { t } = useTheme()
    const [hoveredStock, setHoveredStock] = useState<StockHeat | null>(null)

    function getColor(change: number): string {
        const intensity = Math.min(Math.abs(change) / 3, 1)
        if (change > 0) return `rgba(52,211,153,${0.15 + intensity * 0.7})`
        if (change < 0) return `rgba(248,113,113,${0.15 + intensity * 0.7})`
        return `rgba(255,255,255,0.08)`
    }

    function getTextColor(change: number): string {
        return change >= 0 ? '#34d399' : '#f87171'
    }

    // Calculate sector averages
    const sectorSummary = SECTORS.map(s => {
        const avgChange = s.stocks.reduce((sum, st) => sum + st.change, 0) / s.stocks.length
        const totalMcap = s.stocks.reduce((sum, st) => sum + st.mcap, 0)
        return { name: s.name, avgChange: parseFloat(avgChange.toFixed(2)), totalMcap, stockCount: s.stocks.length }
    }).sort((a, b) => b.avgChange - a.avgChange)

    return (
        <div style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: t.text, letterSpacing: '-0.03em' }}>Sector Heatmap</div>
                    <div style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>NSE stocks grouped by sector · Color intensity = change magnitude</div>
                </div>
                {hoveredStock && (
                    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px 16px', boxShadow: t.shadow, textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{hoveredStock.symbol}</div>
                        <div style={{ fontSize: '11px', color: t.textDim }}>{hoveredStock.name}</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: getTextColor(hoveredStock.change), fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                            {hoveredStock.change >= 0 ? '+' : ''}{hoveredStock.change}% · ₹{hoveredStock.price.toLocaleString('en-IN')}
                        </div>
                    </div>
                )}
            </div>

            {/* Sector summary row */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {sectorSummary.map(s => (
                    <div key={s.name} style={{
                        padding: '6px 12px', borderRadius: '8px',
                        background: getColor(s.avgChange), border: `1px solid ${t.border}`,
                        fontSize: '11px', fontWeight: 600, color: getTextColor(s.avgChange),
                    }}>
                        {s.name} <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.avgChange >= 0 ? '+' : ''}{s.avgChange}%</span>
                    </div>
                ))}
            </div>

            {/* Heatmap Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {SECTORS.map(sector => (
                    <div key={sector.name}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: t.textDim, marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{sector.name}</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {sector.stocks.sort((a, b) => b.mcap - a.mcap).map(stock => {
                                const size = Math.max(90, Math.min(160, 60 + (stock.mcap / 30000)))
                                return (
                                    <div key={stock.symbol}
                                        onClick={() => window.location.href = `/charts?symbol=${stock.symbol}`}
                                        onMouseEnter={() => setHoveredStock(stock)}
                                        onMouseLeave={() => setHoveredStock(null)}
                                        style={{
                                            width: `${size}px`, padding: '10px 8px',
                                            background: getColor(stock.change),
                                            borderRadius: '10px', cursor: 'pointer',
                                            border: `1px solid ${t.border}`,
                                            transition: 'all 0.15s ease', textAlign: 'center',
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{stock.symbol}</div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                                            {stock.change >= 0 ? '+' : ''}{stock.change}%
                                        </div>
                                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                                            ₹{stock.price.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
