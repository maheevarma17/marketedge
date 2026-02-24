'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/theme'

type EventType = 'ipo' | 'earnings' | 'dividend' | 'results' | 'holiday'

interface CalendarEvent {
    date: string // YYYY-MM-DD
    title: string
    type: EventType
    details: string
    symbol?: string
}

const EVENT_COLORS: Record<EventType, { bg: string; label: string; emoji: string }> = {
    ipo: { bg: '#6383ff', label: 'IPO', emoji: '🚀' },
    earnings: { bg: '#34d399', label: 'Earnings', emoji: '📊' },
    dividend: { bg: '#fbbf24', label: 'Dividend', emoji: '💰' },
    results: { bg: '#a78bfa', label: 'Results', emoji: '📋' },
    holiday: { bg: '#f87171', label: 'Holiday', emoji: '🏖️' },
}

const EVENTS: CalendarEvent[] = [
    // IPOs
    { date: '2026-03-03', title: 'Ola Electric IPO', type: 'ipo', details: 'Price band: ₹72-76 | Lot: 195 shares | Issue size: ₹6,146 Cr' },
    { date: '2026-03-05', title: 'Swiggy IPO', type: 'ipo', details: 'Price band: ₹371-390 | Lot: 38 shares | Issue size: ₹11,327 Cr' },
    { date: '2026-03-10', title: 'NTPC Green Energy IPO', type: 'ipo', details: 'Price band: ₹102-108 | Lot: 138 shares | Issue size: ₹10,000 Cr' },
    { date: '2026-03-17', title: 'HDB Financial IPO', type: 'ipo', details: 'Price band: ₹850-900 | Lot: 16 shares | Issue size: ₹12,500 Cr' },
    { date: '2026-03-24', title: 'Zepto IPO', type: 'ipo', details: 'Price band: TBA | Quick commerce unicorn | Expected size: ₹8,000 Cr' },
    // Earnings
    { date: '2026-03-01', title: 'TCS Q4 Results', type: 'earnings', details: 'Expected revenue: ₹62,500 Cr | Pat est: ₹12,200 Cr', symbol: 'TCS' },
    { date: '2026-03-04', title: 'Infosys Q4 Results', type: 'earnings', details: 'Expected revenue: ₹41,200 Cr | PAT est: ₹7,100 Cr', symbol: 'INFY' },
    { date: '2026-03-06', title: 'HDFC Bank Q4 Results', type: 'earnings', details: 'NII est: ₹30,500 Cr | PAT est: ₹16,800 Cr', symbol: 'HDFCBANK' },
    { date: '2026-03-08', title: 'Reliance Q4 Results', type: 'earnings', details: 'Consolidated revenue est: ₹2,45,000 Cr', symbol: 'RELIANCE' },
    { date: '2026-03-11', title: 'ICICI Bank Q4 Results', type: 'earnings', details: 'NII est: ₹20,500 Cr | PAT est: ₹11,200 Cr', symbol: 'ICICIBANK' },
    { date: '2026-03-13', title: 'Wipro Q4 Results', type: 'earnings', details: 'Revenue est: ₹23,100 Cr | IT services growth 1-3%', symbol: 'WIPRO' },
    { date: '2026-03-15', title: 'SBI Q4 Results', type: 'earnings', details: 'NII est: ₹44,800 Cr | PAT est: ₹18,500 Cr', symbol: 'SBIN' },
    // Dividends
    { date: '2026-03-07', title: 'ITC Dividend', type: 'dividend', details: 'Interim dividend: ₹6.25 per share | Ex-date: 7 Mar', symbol: 'ITC' },
    { date: '2026-03-12', title: 'Coal India Dividend', type: 'dividend', details: 'Final dividend: ₹15.75 per share | Record date: 14 Mar', symbol: 'COALINDIA' },
    { date: '2026-03-14', title: 'Infosys Dividend', type: 'dividend', details: 'Final dividend: ₹20 per share | Ex-date: 14 Mar', symbol: 'INFY' },
    { date: '2026-03-20', title: 'NTPC Dividend', type: 'dividend', details: 'Interim dividend: ₹3.25 per share', symbol: 'NTPC' },
    { date: '2026-03-25', title: 'HCL Tech Dividend', type: 'dividend', details: 'Final dividend: ₹18 per share | Record date: 27 Mar', symbol: 'HCLTECH' },
    // Results
    { date: '2026-03-18', title: 'Bajaj Finance Q4 Results', type: 'results', details: 'AUM est: ₹3.5 lakh Cr | NII growth 28% YoY', symbol: 'BAJFINANCE' },
    { date: '2026-03-19', title: 'Tata Motors Q4 Results', type: 'results', details: 'JLR rev est: £7.8B | India EBITDA margin 7%', symbol: 'TATAMOTORS' },
    { date: '2026-03-21', title: 'Maruti Q4 Results', type: 'results', details: 'Volume est: 5.7L units | Revenue est: ₹39,000 Cr', symbol: 'MARUTI' },
    // Holidays
    { date: '2026-03-14', title: 'Holi', type: 'holiday', details: 'NSE/BSE Closed — Festival of Colors' },
    { date: '2026-03-31', title: 'Id-ul-Fitr', type: 'holiday', details: 'NSE/BSE Closed — End of Ramadan' },
]

export default function CalendarPage() {
    const { t } = useTheme()
    const [year, setYear] = useState(2026)
    const [month, setMonth] = useState(2) // March = index 2
    const [filterType, setFilterType] = useState<EventType | 'all'>('all')
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }
    const card: React.CSSProperties = { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: t.shadow }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const filteredEvents = EVENTS.filter(e => {
        if (filterType !== 'all' && e.type !== filterType) return false
        return true
    })

    function getEventsForDate(dateStr: string) {
        return filteredEvents.filter(e => e.date === dateStr)
    }

    function prevMonth() {
        if (month === 0) { setMonth(11); setYear(year - 1) }
        else setMonth(month - 1)
    }
    function nextMonth() {
        if (month === 11) { setMonth(0); setYear(year + 1) }
        else setMonth(month + 1)
    }

    const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

    return (
        <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: t.text, letterSpacing: '-0.03em' }}>Market Calendar</div>
                <div style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>
                    IPOs · Earnings · Dividends · Results · Market Holidays
                </div>
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button onClick={() => setFilterType('all')} style={{
                    padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', background: filterType === 'all' ? t.accent : t.bgInput, color: filterType === 'all' ? '#fff' : t.textDim,
                }}>All Events</button>
                {(Object.keys(EVENT_COLORS) as EventType[]).map(type => (
                    <button key={type} onClick={() => setFilterType(type)} style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer',
                        background: filterType === type ? `${EVENT_COLORS[type].bg}30` : t.bgInput,
                        color: filterType === type ? EVENT_COLORS[type].bg : t.textDim,
                    }}>{EVENT_COLORS[type].emoji} {EVENT_COLORS[type].label}</button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
                {/* Calendar Grid */}
                <div style={card}>
                    {/* Month Nav */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <button onClick={prevMonth} style={{ background: t.bgInput, border: 'none', borderRadius: '8px', padding: '6px 12px', color: t.textDim, cursor: 'pointer', fontSize: '14px' }}>←</button>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: t.text }}>{monthNames[month]} {year}</div>
                        <button onClick={nextMonth} style={{ background: t.bgInput, border: 'none', borderRadius: '8px', padding: '6px 12px', color: t.textDim, cursor: 'pointer', fontSize: '14px' }}>→</button>
                    </div>

                    {/* Day Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                        {dayNames.map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: t.textDim, padding: '4px' }}>{d}</div>
                        ))}
                    </div>

                    {/* Date Cells */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            const events = getEventsForDate(dateStr)
                            const isSelected = selectedDate === dateStr
                            const isToday = new Date().toISOString().split('T')[0] === dateStr

                            return (
                                <div key={day} onClick={() => setSelectedDate(dateStr)} style={{
                                    padding: '8px 4px', borderRadius: '10px', cursor: 'pointer',
                                    textAlign: 'center', minHeight: '48px',
                                    background: isSelected ? `${t.accent}20` : isToday ? t.bgInput : 'transparent',
                                    border: isSelected ? `1px solid ${t.accent}40` : '1px solid transparent',
                                    transition: 'all 0.15s ease',
                                }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = t.bgInput }}
                                    onMouseLeave={e => { if (!isSelected && !isToday) e.currentTarget.style.background = 'transparent' }}>
                                    <div style={{ fontSize: '12px', fontWeight: isToday ? 700 : 500, color: isToday ? t.accent : t.text, ...mono }}>{day}</div>
                                    {events.length > 0 && (
                                        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                                            {events.slice(0, 3).map((ev, j) => (
                                                <div key={j} style={{ width: '6px', height: '6px', borderRadius: '50%', background: EVENT_COLORS[ev.type].bg }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Event Details Panel */}
                <div>
                    <div style={card}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '14px' }}>
                            {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Select a date'}
                        </div>
                        {selectedEvents.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: t.textDim, fontSize: '12px' }}>
                                {selectedDate ? 'No events on this date' : 'Click a date to see events'}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {selectedEvents.map((ev, i) => (
                                    <div key={i} style={{
                                        padding: '14px', borderRadius: '10px', background: t.bgInput,
                                        borderLeft: `3px solid ${EVENT_COLORS[ev.type].bg}`,
                                        cursor: ev.symbol ? 'pointer' : 'default',
                                    }}
                                        onClick={() => ev.symbol && (window.location.href = `/charts?symbol=${ev.symbol}`)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '14px' }}>{EVENT_COLORS[ev.type].emoji}</span>
                                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${EVENT_COLORS[ev.type].bg}25`, color: EVENT_COLORS[ev.type].bg, fontWeight: 600 }}>{EVENT_COLORS[ev.type].label}</span>
                                            {ev.symbol && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: t.bgCard, color: t.accent, fontWeight: 700, ...mono }}>{ev.symbol}</span>}
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: t.text, marginBottom: '4px' }}>{ev.title}</div>
                                        <div style={{ fontSize: '11.5px', color: t.textDim, lineHeight: 1.4 }}>{ev.details}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upcoming Events */}
                    <div style={{ ...card, marginTop: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '12px' }}>Upcoming Events</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {filteredEvents.slice(0, 8).map((ev, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}>
                                    <span style={{ fontSize: '12px' }}>{EVENT_COLORS[ev.type].emoji}</span>
                                    <span style={{ flex: 1, fontSize: '11.5px', color: t.text, fontWeight: 500 }}>{ev.title}</span>
                                    <span style={{ fontSize: '10px', color: t.textDim, ...mono }}>{ev.date.split('-').reverse().slice(0, 2).join('/')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
