'use client'
import { useEffect, useRef } from 'react'

export default function ChartsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.offsetWidth
    const H = 300
    canvas.width = W
    canvas.height = H

    // Generate fake price data
    const points: number[] = []
    let v = 22000
    for (let i = 0; i < 60; i++) {
      v += (Math.random() - 0.45) * 120
      points.push(v)
    }

    const min = Math.min(...points) - 100
    const max = Math.max(...points) + 100
    const xStep = W / (points.length - 1)
    const yPos = (val: number) => H - ((val - min) / (max - min)) * H

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, 'rgba(41,98,255,0.3)')
    grad.addColorStop(1, 'rgba(41,98,255,0)')
    ctx.beginPath()
    points.forEach((p, i) => i === 0 ? ctx.moveTo(0, yPos(p)) : ctx.lineTo(i * xStep, yPos(p)))
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath()
    ctx.fillStyle = grad; ctx.fill()

    // Line
    ctx.beginPath()
    ctx.strokeStyle = '#2962FF'; ctx.lineWidth = 2; ctx.lineJoin = 'round'
    points.forEach((p, i) => i === 0 ? ctx.moveTo(0, yPos(p)) : ctx.lineTo(i * xStep, yPos(p)))
    ctx.stroke()
  }, [])

  const symbols = ['NIFTY 50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'SBIN', 'HDFCBANK']

  return (
    <div style={{ padding: '24px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Charts</div>
        <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Technical Analysis · NSE Live</div>
      </div>

      {/* Symbol selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
        {symbols.map((s, i) => (
          <div key={s} style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
            background: i === 0 ? '#2962FF' : '#1e2438',
            color: i === 0 ? '#fff' : '#8892a4',
            border: `1px solid ${i === 0 ? '#2962FF' : '#252d3d'}`
          }}>{s}</div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>NIFTY 50</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>22,147.90</div>
          <div style={{ fontSize: '13px', color: '#26a69a', fontFamily: 'JetBrains Mono, monospace' }}>▲ +183.25 (+0.83%)</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
            {['1D', '1W', '1M', '3M', '1Y'].map((tf, i) => (
              <div key={tf} style={{
                padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
                background: i === 0 ? '#2962FF' : '#1e2438',
                color: i === 0 ? '#fff' : '#8892a4',
                border: `1px solid ${i === 0 ? '#2962FF' : '#252d3d'}`
              }}>{tf}</div>
            ))}
          </div>
        </div>
        <div style={{ padding: '16px' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '300px', display: 'block' }} />
        </div>
      </div>

      {/* Market stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Open', value: '21,964.65' },
          { label: 'High', value: '22,210.30' },
          { label: 'Low', value: '21,930.10' },
          { label: 'Prev Close', value: '21,964.65' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>₹{s.value}</div>
          </div>
        ))}
      </div>

    </div>
  )
}