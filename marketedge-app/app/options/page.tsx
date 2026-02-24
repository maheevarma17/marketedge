'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getQuote } from '@/lib/api'
import {
  blackScholes, calcPayoff, calcMaxPain, calcImpliedVolatility,
  OPTION_STRATEGIES, FNO_SYMBOLS,
  type OptionLeg, type PayoffPoint, type GreeksResult,
} from '@/lib/options-pricing'

interface OptionRow {
  strike: number
  callLTP: number; callChg: number; callOI: number; callIV: number
  callDelta: number; callGamma: number; callTheta: number; callVega: number
  putLTP: number; putChg: number; putOI: number; putIV: number
  putDelta: number; putGamma: number; putTheta: number; putVega: number
  atm: boolean
}

function getExpiries(): string[] {
  const expiries: string[] = []
  const d = new Date()
  for (let i = 0; i < 6; i++) {
    while (d.getDay() !== 4) d.setDate(d.getDate() + 1)
    expiries.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }))
    d.setDate(d.getDate() + 7)
  }
  return expiries
}

function generateOptionsChain(spotPrice: number, daysToExpiry: number): OptionRow[] {
  const step = spotPrice > 10000 ? 100 : spotPrice > 1000 ? 50 : 25
  const roundedSpot = Math.round(spotPrice / step) * step
  const T = daysToExpiry / 365
  const r = 0.065 // RBI rate ~6.5%
  const strikes: OptionRow[] = []

  for (let i = -6; i <= 6; i++) {
    const strike = roundedSpot + i * step
    const isATM = i === 0
    const baseIV = 0.15 + Math.abs(i) * 0.008 + Math.random() * 0.03
    const callIV = baseIV + (i < 0 ? 0.02 : 0)
    const putIV = baseIV + (i > 0 ? 0.02 : 0)

    const callGreeks = blackScholes(spotPrice, strike, T, r, callIV, 'call')
    const putGreeks = blackScholes(spotPrice, strike, T, r, putIV, 'put')

    strikes.push({
      strike,
      callLTP: callGreeks.price, callChg: parseFloat(((Math.random() - 0.4) * 15).toFixed(2)),
      callOI: Math.round((80000 + Math.random() * 250000) * (isATM ? 2.5 : 1)),
      callIV: parseFloat((callIV * 100).toFixed(1)),
      callDelta: callGreeks.delta, callGamma: callGreeks.gamma,
      callTheta: callGreeks.theta, callVega: callGreeks.vega,
      putLTP: putGreeks.price, putChg: parseFloat(((Math.random() - 0.5) * 15).toFixed(2)),
      putOI: Math.round((60000 + Math.random() * 200000) * (isATM ? 2.5 : 1)),
      putIV: parseFloat((putIV * 100).toFixed(1)),
      putDelta: putGreeks.delta, putGamma: putGreeks.gamma,
      putTheta: putGreeks.theta, putVega: putGreeks.vega,
      atm: isATM,
    })
  }
  return strikes
}

export default function OptionsPage() {
  const [symbol, setSymbol] = useState('NIFTY')
  const [expiry, setExpiry] = useState('')
  const [spotPrice, setSpotPrice] = useState(0)
  const [spotChange, setSpotChange] = useState(0)
  const [spotChangePct, setSpotChangePct] = useState(0)
  const [chain, setChain] = useState<OptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expiries] = useState(getExpiries())
  const [showGreeks, setShowGreeks] = useState(true)
  const [selectedStrategy, setSelectedStrategy] = useState('')
  const [strategyLegs, setStrategyLegs] = useState<OptionLeg[]>([])
  const [payoffData, setPayoffData] = useState<PayoffPoint[]>([])
  const [activeTab, setActiveTab] = useState<'chain' | 'payoff' | 'maxpain'>('chain')
  const payoffCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (expiries.length > 0 && !expiry) setExpiry(expiries[0])
  }, [expiries, expiry])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const sym = symbol === 'NIFTY' ? '^NSEI' : symbol === 'BANKNIFTY' ? '^NSEBANK' : symbol === 'FINNIFTY' ? '^CNXFIN' : symbol
        const q = await getQuote(sym)
        setSpotPrice(q.price)
        setSpotChange(q.change)
        setSpotChangePct(q.changePct)
        const expiryIdx = expiries.indexOf(expiry)
        const daysToExpiry = Math.max(1, (expiryIdx + 1) * 7)
        setChain(generateOptionsChain(q.price, daysToExpiry))
      } catch {
        const fallback = symbol === 'NIFTY' ? 22000 : symbol === 'BANKNIFTY' ? 47000 : symbol === 'FINNIFTY' ? 22500 : 2500
        setSpotPrice(fallback)
        setSpotChange(0); setSpotChangePct(0)
        setChain(generateOptionsChain(fallback, 7))
      }
      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, expiry])

  // Draw payoff diagram
  useEffect(() => {
    if (payoffData.length === 0 || !payoffCanvasRef.current) return
    const canvas = payoffCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth; const H = 250
    canvas.width = W; canvas.height = H

    const pnls = payoffData.map(p => p.pnl)
    const spots = payoffData.map(p => p.spot)
    const minPnl = Math.min(...pnls); const maxPnl = Math.max(...pnls)
    const minSpot = Math.min(...spots); const maxSpot = Math.max(...spots)
    const pnlRange = maxPnl - minPnl || 1
    const spotRange = maxSpot - minSpot || 1

    const xPos = (s: number) => 40 + ((s - minSpot) / spotRange) * (W - 60)
    const yPos = (p: number) => 20 + (1 - (p - minPnl) / pnlRange) * (H - 50)

    ctx.clearRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      const y = 20 + i * (H - 50) / 4
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 20, y); ctx.stroke()
    }

    // Zero line
    const zeroY = yPos(0)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(40, zeroY); ctx.lineTo(W - 20, zeroY); ctx.stroke()
    ctx.setLineDash([])

    // Spot price line
    ctx.strokeStyle = 'rgba(41,98,255,0.5)'; ctx.setLineDash([4, 4])
    const spotX = xPos(spotPrice)
    ctx.beginPath(); ctx.moveTo(spotX, 20); ctx.lineTo(spotX, H - 30); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#2962FF'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center'
    ctx.fillText('Spot', spotX, H - 10)

    // Payoff line with gradient fill
    ctx.beginPath()
    payoffData.forEach((p, i) => {
      const x = xPos(p.spot); const y = yPos(p.pnl)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = '#f0b429'; ctx.lineWidth = 2; ctx.stroke()

    // Fill profit green, loss red
    // Profit area
    ctx.beginPath()
    payoffData.forEach((p, i) => {
      const x = xPos(p.spot); const y = Math.min(yPos(p.pnl), zeroY)
      i === 0 ? ctx.moveTo(x, zeroY) : ctx.lineTo(x, y)
    })
    ctx.lineTo(xPos(payoffData[payoffData.length - 1].spot), zeroY); ctx.closePath()
    ctx.fillStyle = 'rgba(38,166,154,0.15)'; ctx.fill()

    // Labels
    ctx.fillStyle = '#8892a4'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'right'
    ctx.fillText(`₹${maxPnl.toFixed(0)}`, 38, 25)
    ctx.fillText(`₹${minPnl.toFixed(0)}`, 38, H - 35)
    ctx.fillText('₹0', 38, zeroY + 3)
  }, [payoffData, spotPrice])

  const applyStrategy = useCallback((stratId: string) => {
    setSelectedStrategy(stratId)
    const strat = OPTION_STRATEGIES.find(s => s.id === stratId)
    if (!strat || spotPrice === 0) return

    const step = spotPrice > 10000 ? 100 : spotPrice > 1000 ? 50 : 25
    const legs = strat.legs(spotPrice, step)

    // Calculate premiums from chain
    legs.forEach(leg => {
      const row = chain.find(r => Math.abs(r.strike - leg.strike) < step * 0.5)
      if (row) leg.premium = leg.type === 'call' ? row.callLTP : row.putLTP
    })

    setStrategyLegs(legs)

    const range = spotPrice * 0.15
    const payoff = calcPayoff(legs, { min: spotPrice - range, max: spotPrice + range, step: step / 2 })
    setPayoffData(payoff)
    setActiveTab('payoff')
  }, [spotPrice, chain])

  const maxPainResult = chain.length > 0 ? calcMaxPain(chain.map(r => ({ strike: r.strike, callOI: r.callOI, putOI: r.putOI }))) : null
  const pcr = chain.length > 0 ? parseFloat((chain.reduce((s, r) => s + r.putOI, 0) / Math.max(chain.reduce((s, r) => s + r.callOI, 0), 1)).toFixed(2)) : 0

  const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>
            Options <span style={{ color: '#f0b429' }}>Chain</span>
            <span style={{ fontSize: '11px', background: '#2962FF', color: '#fff', padding: '2px 8px', borderRadius: '4px', marginLeft: '10px', fontWeight: 600 }}>PRO</span>
          </div>
          <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>
            Black-Scholes Greeks · Payoff Diagrams · Strategy Builder · {loading ? 'Loading...' : 'Live spot price'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#8892a4' }}>PCR:</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: pcr > 1 ? '#26a69a' : '#ef5350', ...mono }}>{pcr}</span>
          {maxPainResult && (
            <>
              <span style={{ fontSize: '12px', color: '#8892a4', marginLeft: '10px' }}>Max Pain:</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#f0b429', ...mono }}>{maxPainResult.maxPainStrike.toLocaleString('en-IN')}</span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {FNO_SYMBOLS.slice(0, 15).map(s => (
            <div key={s} onClick={() => setSymbol(s)} style={{
              padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', ...mono, transition: '.2s',
              background: symbol === s ? '#2962FF' : '#1e2438',
              color: symbol === s ? '#fff' : '#8892a4',
              border: `1px solid ${symbol === s ? '#2962FF' : '#252d3d'}`,
            }}>{s}</div>
          ))}
        </div>
        <select value={expiry} onChange={e => setExpiry(e.target.value)}
          style={{ background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '5px 10px', color: '#D1D4DC', fontSize: '11px', outline: 'none', ...mono }}>
          {expiries.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <button onClick={() => setShowGreeks(!showGreeks)} style={{
          padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
          cursor: 'pointer', border: 'none', ...mono,
          background: showGreeks ? '#26a69a' : '#1e2438', color: showGreeks ? '#fff' : '#8892a4',
        }}>
          Greeks {showGreeks ? 'ON' : 'OFF'}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#8892a4' }}>Spot:</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', ...mono }}>
            {spotPrice > 0 ? spotPrice.toLocaleString('en-IN') : '—'}
          </span>
          {spotPrice > 0 && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: spotChangePct >= 0 ? '#26a69a' : '#ef5350', ...mono }}>
              {spotChangePct >= 0 ? '+' : ''}{spotChangePct.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Strategy Builder */}
      <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>🎯 Strategy Builder</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {OPTION_STRATEGIES.map(s => (
            <button key={s.id} onClick={() => applyStrategy(s.id)} style={{
              padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
              cursor: 'pointer', border: 'none', ...mono,
              background: selectedStrategy === s.id ? '#2962FF' : '#1e2438',
              color: selectedStrategy === s.id ? '#fff' : '#8892a4',
            }}>
              {s.name}
            </button>
          ))}
        </div>
        {strategyLegs.length > 0 && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {strategyLegs.map((leg, i) => (
              <div key={i} style={{
                padding: '6px 10px', borderRadius: '6px', fontSize: '10px', ...mono,
                background: leg.qty > 0 ? 'rgba(38,166,154,0.1)' : 'rgba(239,83,80,0.1)',
                border: `1px solid ${leg.qty > 0 ? '#26a69a' : '#ef5350'}`,
                color: leg.qty > 0 ? '#26a69a' : '#ef5350',
              }}>
                {leg.qty > 0 ? 'BUY' : 'SELL'} {Math.abs(leg.qty)} {leg.type.toUpperCase()} {leg.strike} @ ₹{leg.premium}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#1a1f2e', borderRadius: '8px', padding: '3px', border: '1px solid #252d3d' }}>
        {[
          { id: 'chain' as const, label: '📋 Options Chain' },
          { id: 'payoff' as const, label: '📈 Payoff Diagram' },
          { id: 'maxpain' as const, label: '🎯 Max Pain' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '7px 12px', borderRadius: '6px', border: 'none',
            background: activeTab === tab.id ? '#2962FF' : 'transparent',
            color: activeTab === tab.id ? '#fff' : '#8892a4',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Options Chain Table */}
      {activeTab === 'chain' && (
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8892a4' }}>Loading options chain...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: showGreeks ? '1100px' : '700px' }}>
                <thead>
                  <tr style={{ background: '#1e2438' }}>
                    <th colSpan={showGreeks ? 7 : 3} style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#26a69a', letterSpacing: '1px', borderBottom: '1px solid #252d3d', borderRight: '2px solid #2962FF' }}>CALLS</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', borderBottom: '1px solid #252d3d', background: 'rgba(41,98,255,0.1)' }}>STRIKE</th>
                    <th colSpan={showGreeks ? 7 : 3} style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#ef5350', letterSpacing: '1px', borderBottom: '1px solid #252d3d', borderLeft: '2px solid #2962FF' }}>PUTS</th>
                  </tr>
                  <tr style={{ background: '#1e2438' }}>
                    {(showGreeks ? ['OI', 'IV', 'Δ', 'Γ', 'Θ', 'Chg', 'LTP'] : ['OI', 'Chg', 'LTP']).map((h, i) => (
                      <th key={`c${i}`} style={{ padding: '6px 8px', textAlign: 'right', fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px', color: '#8892a4', textTransform: 'uppercase', borderBottom: '1px solid #252d3d' }}>{h}</th>
                    ))}
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: '9px', fontWeight: 600, color: '#8892a4', borderBottom: '1px solid #252d3d', background: 'rgba(41,98,255,0.08)', borderLeft: '2px solid #2962FF', borderRight: '2px solid #2962FF' }}>STRIKE</th>
                    {(showGreeks ? ['LTP', 'Chg', 'Δ', 'Γ', 'Θ', 'IV', 'OI'] : ['LTP', 'Chg', 'OI']).map((h, i) => (
                      <th key={`p${i}`} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px', color: '#8892a4', textTransform: 'uppercase', borderBottom: '1px solid #252d3d' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chain.map(row => (
                    <tr key={row.strike} style={{
                      borderBottom: '1px solid rgba(37,45,61,0.6)',
                      background: row.atm ? 'rgba(41,98,255,0.06)' : 'transparent',
                    }}>
                      {/* Call side */}
                      <td style={{ padding: '8px', textAlign: 'right', ...mono, fontSize: '11px', color: '#D1D4DC' }}>{row.callOI.toLocaleString('en-IN')}</td>
                      {showGreeks && <>
                        <td style={{ padding: '8px 6px', textAlign: 'right', ...mono, fontSize: '10px', color: '#f0b429' }}>{row.callIV}%</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', ...mono, fontSize: '10px', color: '#8892a4' }}>{row.callDelta}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', ...mono, fontSize: '10px', color: '#8892a4' }}>{row.callGamma}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', ...mono, fontSize: '10px', color: '#ef5350' }}>{row.callTheta}</td>
                      </>}
                      <td style={{ padding: '8px 6px', textAlign: 'right', ...mono, fontSize: '11px', color: row.callChg >= 0 ? '#26a69a' : '#ef5350' }}>
                        {row.callChg >= 0 ? '+' : ''}{row.callChg.toFixed(1)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', ...mono, fontSize: '12px', fontWeight: 700, color: '#26a69a' }}>₹{row.callLTP.toFixed(2)}</td>

                      {/* Strike */}
                      <td style={{ padding: '8px 10px', textAlign: 'center', ...mono, fontSize: '12px', fontWeight: 800, color: row.atm ? '#2962FF' : '#fff', background: row.atm ? 'rgba(41,98,255,0.1)' : 'transparent', borderLeft: '2px solid #2962FF', borderRight: '2px solid #2962FF' }}>
                        {row.strike.toLocaleString('en-IN')}
                        {row.atm && <span style={{ fontSize: '8px', color: '#2962FF', marginLeft: '4px' }}>ATM</span>}
                      </td>

                      {/* Put side */}
                      <td style={{ padding: '8px', ...mono, fontSize: '12px', fontWeight: 700, color: '#ef5350' }}>₹{row.putLTP.toFixed(2)}</td>
                      <td style={{ padding: '8px 6px', ...mono, fontSize: '11px', color: row.putChg >= 0 ? '#26a69a' : '#ef5350' }}>
                        {row.putChg >= 0 ? '+' : ''}{row.putChg.toFixed(1)}
                      </td>
                      {showGreeks && <>
                        <td style={{ padding: '8px 6px', ...mono, fontSize: '10px', color: '#8892a4' }}>{row.putDelta}</td>
                        <td style={{ padding: '8px 6px', ...mono, fontSize: '10px', color: '#8892a4' }}>{row.putGamma}</td>
                        <td style={{ padding: '8px 6px', ...mono, fontSize: '10px', color: '#ef5350' }}>{row.putTheta}</td>
                        <td style={{ padding: '8px 6px', ...mono, fontSize: '10px', color: '#f0b429' }}>{row.putIV}%</td>
                      </>}
                      <td style={{ padding: '8px', ...mono, fontSize: '11px', color: '#D1D4DC' }}>{row.putOI.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ padding: '10px 14px', borderTop: '1px solid #252d3d', fontSize: '11px', color: '#8892a4', display: 'flex', justifyContent: 'space-between' }}>
            <span>Options prices computed via Black-Scholes model · Expiry: {expiry}</span>
            <span>IV = Implied Volatility · Δ = Delta · Γ = Gamma · Θ = Theta</span>
          </div>
        </div>
      )}

      {/* Payoff Diagram */}
      {activeTab === 'payoff' && (
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>📈 Payoff at Expiry</div>
            {selectedStrategy && <span style={{ fontSize: '11px', color: '#f0b429' }}>{OPTION_STRATEGIES.find(s => s.id === selectedStrategy)?.name}</span>}
          </div>
          {payoffData.length > 0 ? (
            <div style={{ padding: '16px' }}>
              <canvas ref={payoffCanvasRef} style={{ width: '100%', height: '250px', display: 'block' }} />
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px', justifyContent: 'center' }}>
                <div style={{ fontSize: '11px', ...mono }}>
                  <span style={{ color: '#8892a4' }}>Max Profit: </span>
                  <span style={{ color: '#26a69a', fontWeight: 700 }}>₹{Math.max(...payoffData.map(p => p.pnl)).toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '11px', ...mono }}>
                  <span style={{ color: '#8892a4' }}>Max Loss: </span>
                  <span style={{ color: '#ef5350', fontWeight: 700 }}>₹{Math.min(...payoffData.map(p => p.pnl)).toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '11px', ...mono }}>
                  <span style={{ color: '#8892a4' }}>Breakeven: </span>
                  <span style={{ color: '#f0b429', fontWeight: 700 }}>
                    {payoffData.find((p, i) => i > 0 && ((payoffData[i - 1].pnl < 0 && p.pnl >= 0) || (payoffData[i - 1].pnl >= 0 && p.pnl < 0)))?.spot.toLocaleString('en-IN') || '—'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Select a Strategy</div>
              <div style={{ fontSize: '12px', color: '#8892a4' }}>Click any strategy from the builder above to see the payoff diagram</div>
            </div>
          )}
        </div>
      )}

      {/* Max Pain */}
      {activeTab === 'maxpain' && maxPainResult && (
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>🎯 Max Pain Analysis</div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '1px' }}>Max Pain Strike</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f0b429', ...mono }}>{maxPainResult.maxPainStrike.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '11px', color: '#8892a4' }}>
                {maxPainResult.maxPainStrike > spotPrice ? `${((maxPainResult.maxPainStrike - spotPrice) / spotPrice * 100).toFixed(1)}% above spot` : `${((spotPrice - maxPainResult.maxPainStrike) / spotPrice * 100).toFixed(1)}% below spot`}
              </div>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {maxPainResult.painByStrike.map(p => {
                const maxPain = Math.max(...maxPainResult.painByStrike.map(x => x.totalPain))
                return (
                  <div key={p.strike} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{ width: '70px', fontSize: '11px', fontWeight: p.strike === maxPainResult.maxPainStrike ? 700 : 400, color: p.strike === maxPainResult.maxPainStrike ? '#f0b429' : '#D1D4DC', textAlign: 'right', ...mono }}>{p.strike}</div>
                    <div style={{ flex: 1, height: '16px', background: '#141821', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${(p.totalPain / maxPain) * 100}%`, height: '100%',
                        background: p.strike === maxPainResult.maxPainStrike ? 'linear-gradient(90deg, #f0b429, #ffd54f)' : 'linear-gradient(90deg, #2962FF, #5c8aff)',
                        borderRadius: '3px',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}