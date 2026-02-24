import { NextResponse } from 'next/server'

const NSE_STOCKS = [
    // Large Cap - Banking & Finance
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking' },
    { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking' },
    { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking' },
    { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking' },
    { symbol: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Banking' },
    { symbol: 'PNB', name: 'Punjab National Bank', sector: 'Banking' },
    { symbol: 'CANBK', name: 'Canara Bank', sector: 'Banking' },
    { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank', sector: 'Banking' },
    { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', sector: 'Banking' },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Finance' },
    { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Finance' },
    { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Finance' },
    { symbol: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Finance' },
    { symbol: 'LICI', name: 'Life Insurance Corp', sector: 'Finance' },

    // IT & Tech
    { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT' },
    { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT' },
    { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT' },
    { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT' },
    { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT' },
    { symbol: 'LTIM', name: 'LTIMindtree Ltd', sector: 'IT' },
    { symbol: 'MPHASIS', name: 'Mphasis Ltd', sector: 'IT' },
    { symbol: 'COFORGE', name: 'Coforge Ltd', sector: 'IT' },
    { symbol: 'PERSISTENT', name: 'Persistent Systems', sector: 'IT' },
    { symbol: 'ZOMATO', name: 'Zomato Ltd', sector: 'Tech' },
    { symbol: 'PAYTM', name: 'Paytm (One97)', sector: 'Tech' },
    { symbol: 'NAUKRI', name: 'Info Edge (Naukri)', sector: 'Tech' },
    { symbol: 'DELHIVERY', name: 'Delhivery Ltd', sector: 'Tech' },
    { symbol: 'POLICYBZR', name: 'PB Fintech (PolicyBazaar)', sector: 'Tech' },

    // Oil & Gas / Energy
    { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy' },
    { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy' },
    { symbol: 'IOC', name: 'Indian Oil Corporation', sector: 'Energy' },
    { symbol: 'BPCL', name: 'Bharat Petroleum', sector: 'Energy' },
    { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Energy' },
    { symbol: 'POWERGRID', name: 'Power Grid Corp', sector: 'Energy' },
    { symbol: 'ADANIGREEN', name: 'Adani Green Energy', sector: 'Energy' },
    { symbol: 'TATAPOWER', name: 'Tata Power Company', sector: 'Energy' },
    { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Energy' },
    { symbol: 'GAIL', name: 'GAIL (India) Ltd', sector: 'Energy' },

    // Auto
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Auto' },
    { symbol: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Auto' },
    { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Auto' },
    { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Auto' },
    { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Auto' },
    { symbol: 'EICHERMOT', name: 'Eicher Motors (Royal Enfield)', sector: 'Auto' },
    { symbol: 'ASHOKLEY', name: 'Ashok Leyland Ltd', sector: 'Auto' },
    { symbol: 'TVSMOTOR', name: 'TVS Motor Company', sector: 'Auto' },
    { symbol: 'MOTHERSON', name: 'Samvardhana Motherson', sector: 'Auto' },

    // Pharma & Healthcare
    { symbol: 'SUNPHARMA', name: 'Sun Pharma Industries', sector: 'Pharma' },
    { symbol: 'DRREDDY', name: 'Dr Reddys Laboratories', sector: 'Pharma' },
    { symbol: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma' },
    { symbol: 'DIVISLAB', name: 'Divis Laboratories', sector: 'Pharma' },
    { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Pharma' },
    { symbol: 'BIOCON', name: 'Biocon Ltd', sector: 'Pharma' },
    { symbol: 'LUPIN', name: 'Lupin Ltd', sector: 'Pharma' },
    { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma', sector: 'Pharma' },
    { symbol: 'TORNTPHARM', name: 'Torrent Pharma', sector: 'Pharma' },
    { symbol: 'MAXHEALTH', name: 'Max Healthcare', sector: 'Pharma' },

    // FMCG
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG' },
    { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG' },
    { symbol: 'NESTLEIND', name: 'Nestle India Ltd', sector: 'FMCG' },
    { symbol: 'BRITANNIA', name: 'Britannia Industries', sector: 'FMCG' },
    { symbol: 'GODREJCP', name: 'Godrej Consumer Products', sector: 'FMCG' },
    { symbol: 'DABUR', name: 'Dabur India Ltd', sector: 'FMCG' },
    { symbol: 'MARICO', name: 'Marico Ltd', sector: 'FMCG' },
    { symbol: 'COLPAL', name: 'Colgate-Palmolive India', sector: 'FMCG' },
    { symbol: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'FMCG' },
    { symbol: 'VBL', name: 'Varun Beverages Ltd', sector: 'FMCG' },

    // Metals & Mining
    { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals' },
    { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals' },
    { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metals' },
    { symbol: 'COALINDIA', name: 'Coal India Ltd', sector: 'Mining' },
    { symbol: 'VEDL', name: 'Vedanta Ltd', sector: 'Mining' },
    { symbol: 'NMDC', name: 'NMDC Ltd', sector: 'Mining' },
    { symbol: 'SAIL', name: 'Steel Authority of India', sector: 'Metals' },
    { symbol: 'NATIONALUM', name: 'National Aluminium Co', sector: 'Metals' },
    { symbol: 'APLAPOLLO', name: 'APL Apollo Tubes', sector: 'Metals' },
    { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power', sector: 'Metals' },

    // Infrastructure & Construction
    { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure' },
    { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Infrastructure' },
    { symbol: 'AMBUJACEM', name: 'Ambuja Cements', sector: 'Infrastructure' },
    { symbol: 'ACC', name: 'ACC Ltd', sector: 'Infrastructure' },
    { symbol: 'SHREECEM', name: 'Shree Cement Ltd', sector: 'Infrastructure' },
    { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Infrastructure' },
    { symbol: 'DLF', name: 'DLF Ltd', sector: 'Realty' },
    { symbol: 'GODREJPROP', name: 'Godrej Properties', sector: 'Realty' },
    { symbol: 'OBEROIRLTY', name: 'Oberoi Realty', sector: 'Realty' },

    // Consumer / Retail
    { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer' },
    { symbol: 'TRENT', name: 'Trent Ltd (Westside/Zara)', sector: 'Consumer' },
    { symbol: 'DMART', name: 'Avenue Supermarts (DMart)', sector: 'Consumer' },
    { symbol: 'PAGEIND', name: 'Page Industries (Jockey)', sector: 'Consumer' },
    { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Consumer' },
    { symbol: 'PIDILITIND', name: 'Pidilite Industries', sector: 'Consumer' },
    { symbol: 'HAVELLS', name: 'Havells India Ltd', sector: 'Consumer' },
    { symbol: 'VOLTAS', name: 'Voltas Ltd', sector: 'Consumer' },

    // Telecom & Media
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom' },
    { symbol: 'JIOFIN', name: 'Jio Financial Services', sector: 'Finance' },

    // Others
    { symbol: 'HAL', name: 'Hindustan Aeronautics', sector: 'Defence' },
    { symbol: 'BEL', name: 'Bharat Electronics', sector: 'Defence' },
    { symbol: 'IRCTC', name: 'IRCTC Ltd', sector: 'Travel' },
    { symbol: 'TATACOMM', name: 'Tata Communications', sector: 'Telecom' },
    { symbol: 'INDIGO', name: 'InterGlobe Aviation (IndiGo)', sector: 'Travel' },
    { symbol: 'SIEMENS', name: 'Siemens Ltd', sector: 'Engineering' },
    { symbol: 'ABB', name: 'ABB India Ltd', sector: 'Engineering' },
    { symbol: 'CUMMINSIND', name: 'Cummins India Ltd', sector: 'Engineering' },
]

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').toUpperCase()
    const sector = searchParams.get('sector') || ''

    let results = NSE_STOCKS

    if (sector) {
        results = results.filter(s => s.sector.toUpperCase() === sector.toUpperCase())
    }

    if (query) {
        results = results.filter(s =>
            s.symbol.toUpperCase().includes(query) ||
            s.name.toUpperCase().includes(query)
        )
    }

    return NextResponse.json(results.slice(0, 50))
}
