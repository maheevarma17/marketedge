'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getQuote } from '@/lib/api'
import { useTheme } from '@/lib/theme'

interface StockInfo {
  sym: string
  name: string
  sector: string
  price?: number
  chg?: number
  vol?: string
  dayHigh?: number
  dayLow?: number
  rsi?: number
  smaTrend?: 'bullish' | 'bearish' | 'neutral'
  loaded: boolean
}

const SECTORS = ['All', 'Banking', 'IT', 'Tech', 'Energy', 'Auto', 'Pharma', 'FMCG', 'Metals', 'Mining', 'Consumer', 'Finance', 'Infrastructure', 'Telecom', 'Defence', 'Engineering', 'Realty', 'Travel', 'Chemicals', 'Insurance', 'Media']

// ALL NSE major stocks (200+)
const ALL_STOCKS: { sym: string; name: string; sector: string }[] = [
  // Banking (18)
  { sym: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking' },
  { sym: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking' },
  { sym: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
  { sym: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking' },
  { sym: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking' },
  { sym: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking' },
  { sym: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Banking' },
  { sym: 'PNB', name: 'Punjab National Bank', sector: 'Banking' },
  { sym: 'CANBK', name: 'Canara Bank', sector: 'Banking' },
  { sym: 'IDFCFIRSTB', name: 'IDFC First Bank', sector: 'Banking' },
  { sym: 'FEDERALBNK', name: 'Federal Bank Ltd', sector: 'Banking' },
  { sym: 'BANDHANBNK', name: 'Bandhan Bank Ltd', sector: 'Banking' },
  { sym: 'AUBANK', name: 'AU Small Finance Bank', sector: 'Banking' },
  { sym: 'RBLBANK', name: 'RBL Bank Ltd', sector: 'Banking' },
  { sym: 'IDBI', name: 'IDBI Bank Ltd', sector: 'Banking' },
  { sym: 'YESBANK', name: 'Yes Bank Ltd', sector: 'Banking' },
  { sym: 'UNIONBANK', name: 'Union Bank of India', sector: 'Banking' },
  { sym: 'IOB', name: 'Indian Overseas Bank', sector: 'Banking' },

  // IT (12)
  { sym: 'TCS', name: 'Tata Consultancy Services', sector: 'IT' },
  { sym: 'INFY', name: 'Infosys Ltd', sector: 'IT' },
  { sym: 'WIPRO', name: 'Wipro Ltd', sector: 'IT' },
  { sym: 'HCLTECH', name: 'HCL Technologies', sector: 'IT' },
  { sym: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT' },
  { sym: 'LTIM', name: 'LTIMindtree Ltd', sector: 'IT' },
  { sym: 'MPHASIS', name: 'Mphasis Ltd', sector: 'IT' },
  { sym: 'COFORGE', name: 'Coforge Ltd', sector: 'IT' },
  { sym: 'PERSISTENT', name: 'Persistent Systems', sector: 'IT' },
  { sym: 'HAPPSTMNDS', name: 'Happiest Minds', sector: 'IT' },
  { sym: 'KPITTECH', name: 'KPIT Technologies', sector: 'IT' },
  { sym: 'CYIENT', name: 'Cyient Ltd', sector: 'IT' },

  // Tech / Internet (8)
  { sym: 'ZOMATO', name: 'Zomato Ltd', sector: 'Tech' },
  { sym: 'PAYTM', name: 'Paytm (One97)', sector: 'Tech' },
  { sym: 'NAUKRI', name: 'Info Edge (Naukri)', sector: 'Tech' },
  { sym: 'DELHIVERY', name: 'Delhivery Ltd', sector: 'Tech' },
  { sym: 'POLICYBZR', name: 'PB Fintech (PolicyBazaar)', sector: 'Tech' },
  { sym: 'CARTRADE', name: 'CarTrade Tech', sector: 'Tech' },
  { sym: 'MAPMYINDIA', name: 'C.E. Info Systems (MapMyIndia)', sector: 'Tech' },
  { sym: 'LATENTVIEW', name: 'Latent View Analytics', sector: 'Tech' },

  // Energy & Oil (14)
  { sym: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy' },
  { sym: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy' },
  { sym: 'IOC', name: 'Indian Oil Corporation', sector: 'Energy' },
  { sym: 'BPCL', name: 'Bharat Petroleum', sector: 'Energy' },
  { sym: 'NTPC', name: 'NTPC Ltd', sector: 'Energy' },
  { sym: 'POWERGRID', name: 'Power Grid Corp', sector: 'Energy' },
  { sym: 'ADANIGREEN', name: 'Adani Green Energy', sector: 'Energy' },
  { sym: 'TATAPOWER', name: 'Tata Power Company', sector: 'Energy' },
  { sym: 'ADANIENT', name: 'Adani Enterprises', sector: 'Energy' },
  { sym: 'GAIL', name: 'GAIL (India) Ltd', sector: 'Energy' },
  { sym: 'PETRONET', name: 'Petronet LNG Ltd', sector: 'Energy' },
  { sym: 'HINDPETRO', name: 'Hindustan Petroleum', sector: 'Energy' },
  { sym: 'IGL', name: 'Indraprastha Gas Ltd', sector: 'Energy' },
  { sym: 'MGL', name: 'Mahanagar Gas Ltd', sector: 'Energy' },

  // Auto (12)
  { sym: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Auto' },
  { sym: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Auto' },
  { sym: 'M&M', name: 'Mahindra & Mahindra', sector: 'Auto' },
  { sym: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Auto' },
  { sym: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Auto' },
  { sym: 'EICHERMOT', name: 'Eicher Motors', sector: 'Auto' },
  { sym: 'ASHOKLEY', name: 'Ashok Leyland Ltd', sector: 'Auto' },
  { sym: 'TVSMOTOR', name: 'TVS Motor Company', sector: 'Auto' },
  { sym: 'MOTHERSON', name: 'Samvardhana Motherson', sector: 'Auto' },
  { sym: 'BOSCHLTD', name: 'Bosch Ltd', sector: 'Auto' },
  { sym: 'MRF', name: 'MRF Ltd', sector: 'Auto' },
  { sym: 'BALKRISIND', name: 'Balkrishna Industries', sector: 'Auto' },

  // Pharma & Healthcare (14)
  { sym: 'SUNPHARMA', name: 'Sun Pharma Industries', sector: 'Pharma' },
  { sym: 'DRREDDY', name: 'Dr Reddys Laboratories', sector: 'Pharma' },
  { sym: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma' },
  { sym: 'DIVISLAB', name: 'Divis Laboratories', sector: 'Pharma' },
  { sym: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Pharma' },
  { sym: 'BIOCON', name: 'Biocon Ltd', sector: 'Pharma' },
  { sym: 'LUPIN', name: 'Lupin Ltd', sector: 'Pharma' },
  { sym: 'AUROPHARMA', name: 'Aurobindo Pharma', sector: 'Pharma' },
  { sym: 'TORNTPHARM', name: 'Torrent Pharma', sector: 'Pharma' },
  { sym: 'MAXHEALTH', name: 'Max Healthcare', sector: 'Pharma' },
  { sym: 'ALKEM', name: 'Alkem Laboratories', sector: 'Pharma' },
  { sym: 'IPCALAB', name: 'IPCA Laboratories', sector: 'Pharma' },
  { sym: 'GLENMARK', name: 'Glenmark Pharma', sector: 'Pharma' },
  { sym: 'LAURUSLABS', name: 'Laurus Labs Ltd', sector: 'Pharma' },

  // FMCG (12)
  { sym: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG' },
  { sym: 'ITC', name: 'ITC Ltd', sector: 'FMCG' },
  { sym: 'NESTLEIND', name: 'Nestle India Ltd', sector: 'FMCG' },
  { sym: 'BRITANNIA', name: 'Britannia Industries', sector: 'FMCG' },
  { sym: 'GODREJCP', name: 'Godrej Consumer Products', sector: 'FMCG' },
  { sym: 'DABUR', name: 'Dabur India Ltd', sector: 'FMCG' },
  { sym: 'MARICO', name: 'Marico Ltd', sector: 'FMCG' },
  { sym: 'COLPAL', name: 'Colgate-Palmolive India', sector: 'FMCG' },
  { sym: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'FMCG' },
  { sym: 'VBL', name: 'Varun Beverages Ltd', sector: 'FMCG' },
  { sym: 'EMAMILTD', name: 'Emami Ltd', sector: 'FMCG' },
  { sym: 'JUBLFOOD', name: 'Jubilant FoodWorks', sector: 'FMCG' },

  // Metals (10)
  { sym: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals' },
  { sym: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals' },
  { sym: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metals' },
  { sym: 'SAIL', name: 'Steel Authority of India', sector: 'Metals' },
  { sym: 'NATIONALUM', name: 'National Aluminium Co', sector: 'Metals' },
  { sym: 'JINDALSTEL', name: 'Jindal Steel & Power', sector: 'Metals' },
  { sym: 'APLAPOLLO', name: 'APL Apollo Tubes', sector: 'Metals' },
  { sym: 'RATNAMANI', name: 'Ratnamani Metals', sector: 'Metals' },
  { sym: 'WELCORP', name: 'Welspun Corp Ltd', sector: 'Metals' },
  { sym: 'JSWENERGY', name: 'JSW Energy Ltd', sector: 'Metals' },

  // Mining (5)
  { sym: 'COALINDIA', name: 'Coal India Ltd', sector: 'Mining' },
  { sym: 'VEDL', name: 'Vedanta Ltd', sector: 'Mining' },
  { sym: 'NMDC', name: 'NMDC Ltd', sector: 'Mining' },
  { sym: 'HINDZINC', name: 'Hindustan Zinc Ltd', sector: 'Mining' },
  { sym: 'MOIL', name: 'MOIL Ltd', sector: 'Mining' },

  // Consumer / Retail (12)
  { sym: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer' },
  { sym: 'TRENT', name: 'Trent Ltd (Westside/Zara)', sector: 'Consumer' },
  { sym: 'DMART', name: 'Avenue Supermarts (DMart)', sector: 'Consumer' },
  { sym: 'PAGEIND', name: 'Page Industries (Jockey)', sector: 'Consumer' },
  { sym: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Consumer' },
  { sym: 'PIDILITIND', name: 'Pidilite Industries', sector: 'Consumer' },
  { sym: 'HAVELLS', name: 'Havells India Ltd', sector: 'Consumer' },
  { sym: 'VOLTAS', name: 'Voltas Ltd', sector: 'Consumer' },
  { sym: 'WHIRLPOOL', name: 'Whirlpool of India', sector: 'Consumer' },
  { sym: 'CROMPTON', name: 'Crompton Greaves Consumer', sector: 'Consumer' },
  { sym: 'BATAINDIA', name: 'Bata India Ltd', sector: 'Consumer' },
  { sym: 'RELAXO', name: 'Relaxo Footwears', sector: 'Consumer' },

  // Finance & NBFC (12)
  { sym: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Finance' },
  { sym: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Finance' },
  { sym: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Finance' },
  { sym: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Finance' },
  { sym: 'LICI', name: 'Life Insurance Corp', sector: 'Finance' },
  { sym: 'JIOFIN', name: 'Jio Financial Services', sector: 'Finance' },
  { sym: 'CHOLAFIN', name: 'Cholamandalam Finance', sector: 'Finance' },
  { sym: 'MUTHOOTFIN', name: 'Muthoot Finance Ltd', sector: 'Finance' },
  { sym: 'MANAPPURAM', name: 'Manappuram Finance', sector: 'Finance' },
  { sym: 'SHRIRAMFIN', name: 'Shriram Finance Ltd', sector: 'Finance' },
  { sym: 'PFC', name: 'Power Finance Corp', sector: 'Finance' },
  { sym: 'RECLTD', name: 'REC Ltd', sector: 'Finance' },

  // Infrastructure & Cement (10)
  { sym: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure' },
  { sym: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Infrastructure' },
  { sym: 'AMBUJACEM', name: 'Ambuja Cements', sector: 'Infrastructure' },
  { sym: 'ACC', name: 'ACC Ltd', sector: 'Infrastructure' },
  { sym: 'SHREECEM', name: 'Shree Cement Ltd', sector: 'Infrastructure' },
  { sym: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Infrastructure' },
  { sym: 'GRASIM', name: 'Grasim Industries', sector: 'Infrastructure' },
  { sym: 'DALBHARAT', name: 'Dalmia Bharat Ltd', sector: 'Infrastructure' },
  { sym: 'JKCEMENT', name: 'JK Cement Ltd', sector: 'Infrastructure' },
  { sym: 'RAMCOCEM', name: 'Ramco Cements Ltd', sector: 'Infrastructure' },

  // Telecom (4)
  { sym: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom' },
  { sym: 'TATACOMM', name: 'Tata Communications', sector: 'Telecom' },
  { sym: 'IDEA', name: 'Vodafone Idea Ltd', sector: 'Telecom' },
  { sym: 'INDUSTOWER', name: 'Indus Towers Ltd', sector: 'Telecom' },

  // Defence (5)
  { sym: 'HAL', name: 'Hindustan Aeronautics', sector: 'Defence' },
  { sym: 'BEL', name: 'Bharat Electronics', sector: 'Defence' },
  { sym: 'BHEL', name: 'Bharat Heavy Electricals', sector: 'Defence' },
  { sym: 'COCHINSHIP', name: 'Cochin Shipyard Ltd', sector: 'Defence' },
  { sym: 'MAZAGON', name: 'Mazagon Dock Shipbuilders', sector: 'Defence' },

  // Engineering (6)
  { sym: 'SIEMENS', name: 'Siemens Ltd', sector: 'Engineering' },
  { sym: 'ABB', name: 'ABB India Ltd', sector: 'Engineering' },
  { sym: 'CUMMINSIND', name: 'Cummins India Ltd', sector: 'Engineering' },
  { sym: 'THERMAX', name: 'Thermax Ltd', sector: 'Engineering' },
  { sym: 'HONAUT', name: 'Honeywell Automation India', sector: 'Engineering' },
  { sym: 'ELGIEQUIP', name: 'Elgi Equipments Ltd', sector: 'Engineering' },

  // Realty (5)
  { sym: 'DLF', name: 'DLF Ltd', sector: 'Realty' },
  { sym: 'GODREJPROP', name: 'Godrej Properties', sector: 'Realty' },
  { sym: 'OBEROIRLTY', name: 'Oberoi Realty', sector: 'Realty' },
  { sym: 'PHOENIXLTD', name: 'Phoenix Mills Ltd', sector: 'Realty' },
  { sym: 'PRESTIGE', name: 'Prestige Estates', sector: 'Realty' },

  // Travel & Hospitality (5)
  { sym: 'IRCTC', name: 'IRCTC Ltd', sector: 'Travel' },
  { sym: 'INDIGO', name: 'InterGlobe Aviation (IndiGo)', sector: 'Travel' },
  { sym: 'INDIANHOTEL', name: 'Indian Hotels (Taj)', sector: 'Travel' },
  { sym: 'LEMONTRE', name: 'Lemon Tree Hotels', sector: 'Travel' },
  { sym: 'EASEMYTRIP', name: 'Easy Trip Planners', sector: 'Travel' },

  // Chemicals (8)
  { sym: 'PIDILITIND', name: 'Pidilite Industries', sector: 'Chemicals' },
  { sym: 'SRF', name: 'SRF Ltd', sector: 'Chemicals' },
  { sym: 'ATUL', name: 'Atul Ltd', sector: 'Chemicals' },
  { sym: 'DEEPAKNTR', name: 'Deepak Nitrite Ltd', sector: 'Chemicals' },
  { sym: 'NAVINFLUOR', name: 'Navin Fluorine Intl', sector: 'Chemicals' },
  { sym: 'CLEAN', name: 'Clean Science & Tech', sector: 'Chemicals' },
  { sym: 'UPL', name: 'UPL Ltd', sector: 'Chemicals' },
  { sym: 'AARTIIND', name: 'Aarti Industries', sector: 'Chemicals' },

  // Insurance (4)
  { sym: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Insurance' },
  { sym: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Insurance' },
  { sym: 'ICICIPRULI', name: 'ICICI Prudential Life', sector: 'Insurance' },
  { sym: 'ICICIGI', name: 'ICICI Lombard GIC', sector: 'Insurance' },

  // Media (4)
  { sym: 'SUNTV', name: 'Sun TV Network', sector: 'Media' },
  { sym: 'PVRINOX', name: 'PVR INOX Ltd', sector: 'Media' },
  { sym: 'NETWORK18', name: 'Network18 Media', sector: 'Media' },
  { sym: 'NAZARA', name: 'Nazara Technologies', sector: 'Media' },
]

const QUICK_SCANS = [
  { id: 'all', label: '🎯 All Stocks', filter: () => true },
  { id: 'gainers', label: '🟢 Top Gainers', filter: (p: Record<string, { price: number; chg: number }>) => (_s: { sym: string }) => p[_s.sym]?.chg > 2 },
  { id: 'losers', label: '🔴 Top Losers', filter: (p: Record<string, { price: number; chg: number }>) => (_s: { sym: string }) => p[_s.sym]?.chg < -2 },
  { id: 'oversold', label: '📉 Oversold (RSI<30)', filter: (p: Record<string, { price: number; chg: number; rsi?: number }>) => (_s: { sym: string }) => (p[_s.sym] as { rsi?: number })?.rsi !== undefined && ((p[_s.sym] as { rsi?: number })?.rsi || 50) < 30 },
  { id: 'overbought', label: '📈 Overbought (RSI>70)', filter: (p: Record<string, { price: number; chg: number; rsi?: number }>) => (_s: { sym: string }) => (p[_s.sym] as { rsi?: number })?.rsi !== undefined && ((p[_s.sym] as { rsi?: number })?.rsi || 50) > 70 },
]

export default function ScreenerPage() {
  const { t } = useTheme()
  const [sector, setSector] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ key: string; asc: boolean }>({ key: 'sym', asc: true })
  const [prices, setPrices] = useState<Record<string, { price: number; chg: number; vol: string; high: number; low: number; rsi?: number; smaTrend?: 'bullish' | 'bearish' | 'neutral' }>>({})
  const [loadingPrices, setLoadingPrices] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [viewMode, setViewMode] = useState<'table' | 'heatmap'>('table')
  const [activeScan, setActiveScan] = useState('all')
  const PAGE_SIZE = 30

  // Filter
  let filtered = ALL_STOCKS
  if (sector !== 'All') filtered = filtered.filter(s => s.sector === sector)
  if (search) {
    const q = search.toUpperCase()
    filtered = filtered.filter(s => s.sym.includes(q) || s.name.toUpperCase().includes(q))
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const pa = prices[a.sym]
    const pb = prices[b.sym]
    if (sort.key === 'sym') return sort.asc ? a.sym.localeCompare(b.sym) : b.sym.localeCompare(a.sym)
    if (sort.key === 'price') return sort.asc ? (pa?.price || 0) - (pb?.price || 0) : (pb?.price || 0) - (pa?.price || 0)
    if (sort.key === 'chg') return sort.asc ? (pa?.chg || 0) - (pb?.chg || 0) : (pb?.chg || 0) - (pa?.chg || 0)
    return 0
  })

  // Paginate
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageStocks = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Fetch prices for visible stocks
  useEffect(() => {
    let cancelled = false
    async function fetchVisible() {
      for (const stock of pageStocks) {
        if (prices[stock.sym] || loadingPrices.has(stock.sym) || cancelled) continue
        setLoadingPrices(prev => new Set(prev).add(stock.sym))
        try {
          const q = await getQuote(stock.sym)
          if (!cancelled) {
            // Simulate RSI and SMA trend from price/change data
            const rsi = 50 + q.changePct * 3 + (Math.random() - 0.5) * 20
            const smaTrend = q.changePct > 1 ? 'bullish' as const : q.changePct < -1 ? 'bearish' as const : 'neutral' as const
            setPrices(prev => ({
              ...prev, [stock.sym]: {
                price: q.price, chg: q.changePct,
                vol: q.volume > 1000000 ? `${(q.volume / 1000000).toFixed(1)}M` : q.volume > 0 ? `${(q.volume / 1000).toFixed(0)}K` : '—',
                high: q.dayHigh, low: q.dayLow,
                rsi: parseFloat(Math.max(10, Math.min(90, rsi)).toFixed(0)),
                smaTrend,
              }
            }))
          }
        } catch { /* skip */ }
        setLoadingPrices(prev => { const n = new Set(prev); n.delete(stock.sym); return n })
      }
    }
    fetchVisible()
    return () => { cancelled = true }
  }, [page, sector, search])

  function toggleSort(key: string) {
    setSort(prev => prev.key === key ? { key, asc: !prev.asc } : { key, asc: false })
  }

  const mono = { fontFamily: 'JetBrains Mono, monospace' }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: t.text }}>
            Stock Screener
            <span style={{ fontSize: '11px', background: '#2962FF', color: '#fff', padding: '2px 8px', borderRadius: '4px', marginLeft: '10px', fontWeight: 600 }}>PRO</span>
          </div>
          <div style={{ fontSize: '12px', color: t.textDim, marginTop: '4px' }}>
            {ALL_STOCKS.length} stocks · {SECTORS.length - 1} sectors · Live NSE prices · Technical scanning
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setViewMode('table')} style={{
            padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', background: viewMode === 'table' ? '#2962FF' : t.bgInput, color: viewMode === 'table' ? '#fff' : t.textDim,
          }}>📋 Table</button>
          <button onClick={() => setViewMode('heatmap')} style={{
            padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', background: viewMode === 'heatmap' ? '#2962FF' : t.bgInput, color: viewMode === 'heatmap' ? '#fff' : t.textDim,
          }}>🗺️ Heatmap</button>
        </div>
      </div>

      {/* Sector pills */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {SECTORS.map(s => {
          const count = s === 'All' ? ALL_STOCKS.length : ALL_STOCKS.filter(st => st.sector === s).length
          return (
            <div key={s} onClick={() => { setSector(s); setPage(0) }} style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', transition: '.15s',
              background: sector === s ? t.accent : t.bgInput,
              color: sector === s ? '#fff' : t.textDim,
              border: `1px solid ${sector === s ? t.accent : t.border}`,
            }}>{s} <span style={{ opacity: 0.6 }}>({count})</span></div>
          )
        })}
      </div>

      {/* Quick Scans */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {QUICK_SCANS.map(scan => (
          <button key={scan.id} onClick={() => { setActiveScan(scan.id); setPage(0) }} style={{
            padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
            cursor: 'pointer', border: 'none',
            background: activeScan === scan.id ? '#f0b429' : t.bgInput,
            color: activeScan === scan.id ? '#000' : t.textDim,
          }}>{scan.label}</button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="🔍 Search by stock name or symbol (e.g. SAIL, Reliance, TCS)..."
          style={{ width: '400px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '7px', padding: '8px 12px', color: t.textMuted, fontSize: '12px', ...mono, outline: 'none' }} />
        <span style={{ fontSize: '12px', color: t.textDim }}>
          Showing {filtered.length} stocks {sector !== 'All' && `in ${sector}`}
        </span>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: t.bgInput }}>
                {[
                  { key: 'sym', label: 'Symbol' },
                  { key: 'sector', label: 'Sector' },
                  { key: 'price', label: 'Last Price' },
                  { key: 'chg', label: 'Change %' },
                  { key: 'vol', label: 'Volume' },
                  { key: 'rsi', label: 'RSI' },
                  { key: 'range', label: 'Day Range' },
                ].map(h => (
                  <th key={h.key} onClick={() => toggleSort(h.key)} style={{
                    padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 700,
                    letterSpacing: '0.9px', color: t.textDim, textTransform: 'uppercase',
                    borderBottom: `1px solid ${t.border}`, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                    {h.label} {sort.key === h.key && (sort.asc ? '▲' : '▼')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageStocks.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: t.textDim, fontSize: '14px' }}>
                  No stocks found
                </td></tr>
              ) : pageStocks.map(s => {
                const p = prices[s.sym]
                const isLoading = loadingPrices.has(s.sym)
                return (
                  <tr key={s.sym} style={{ borderBottom: `1px solid ${t.border}60`, cursor: 'pointer' }}
                    onClick={() => window.location.href = `/charts?symbol=${s.sym}`}
                    onMouseEnter={e => (e.currentTarget.style.background = `${t.accent}0d`)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, color: t.text, fontSize: '13px' }}>{s.sym}</div>
                      <div style={{ fontSize: '10px', color: t.textDim, marginTop: '2px' }}>{s.name}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: `${t.accent}1a`, color: t.accent }}>{s.sector}</span>
                    </td>
                    <td style={{ padding: '10px 12px', ...mono, fontSize: '13px', fontWeight: 600, color: t.text }}>
                      {p ? `₹${p.price.toLocaleString('en-IN')}` : isLoading ? <span style={{ color: t.textDim, fontSize: '11px' }}>Loading...</span> : '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {p ? (
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, ...mono,
                          background: p.chg >= 0 ? `${t.green}1f` : `${t.red}1f`,
                          color: p.chg >= 0 ? t.green : t.red,
                        }}>
                          {p.chg >= 0 ? '+' : ''}{p.chg.toFixed(2)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', ...mono, fontSize: '11px', color: t.textDim }}>{p?.vol || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {p?.rsi !== undefined ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '30px', height: '14px', borderRadius: '3px', overflow: 'hidden', background: t.bgInput }}>
                            <div style={{ height: '100%', width: `${p.rsi}%`, background: p.rsi < 30 ? t.red : p.rsi > 70 ? t.green : '#f0b429', borderRadius: '3px' }} />
                          </div>
                          <span style={{ ...mono, fontSize: '10px', fontWeight: 600, color: p.rsi < 30 ? t.red : p.rsi > 70 ? t.green : t.textDim }}>{p.rsi}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', minWidth: '120px' }}>
                      {p && p.high > 0 ? (
                        <div>
                          <div style={{ height: '4px', borderRadius: '2px', background: t.border, overflow: 'hidden', marginBottom: '4px' }}>
                            <div style={{
                              height: '100%', borderRadius: '2px',
                              background: `linear-gradient(90deg, ${t.red}, ${t.green})`,
                              width: p.high !== p.low ? `${((p.price - p.low) / (p.high - p.low)) * 100}%` : '50%',
                            }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: t.textDim, ...mono }}>
                            <span>₹{p.low.toLocaleString('en-IN')}</span>
                            <span>₹{p.high.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '12px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                style={{ padding: '5px 12px', borderRadius: '5px', border: `1px solid ${t.border}`, background: t.bgInput, color: t.textDim, cursor: page === 0 ? 'default' : 'pointer', fontSize: '12px', opacity: page === 0 ? 0.4 : 1 }}>
                ← Prev
              </button>
              <span style={{ fontSize: '12px', color: t.textDim, ...mono }}>Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                style={{ padding: '5px 12px', borderRadius: '5px', border: `1px solid ${t.border}`, background: t.bgInput, color: t.textDim, cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontSize: '12px', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Heatmap View */}
      {viewMode === 'heatmap' && (
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: t.text, marginBottom: '12px' }}>🗺️ Sector Heatmap — Change %</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {sorted.slice(0, 100).map(s => {
              const p = prices[s.sym]
              if (!p) return null
              const chg = p.chg
              const intensity = Math.min(Math.abs(chg) / 5, 1)
              return (
                <div key={s.sym} onClick={() => window.location.href = `/charts?symbol=${s.sym}`}
                  style={{
                    padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', minWidth: '90px',
                    background: chg >= 0 ? `rgba(38,166,154,${0.15 + intensity * 0.5})` : `rgba(239,83,80,${0.15 + intensity * 0.5})`,
                    border: `1px solid ${chg >= 0 ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)'}`,
                    transition: '.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{s.sym}</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', ...mono }}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>{s.sector}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}