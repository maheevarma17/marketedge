'use client'
import { useState } from 'react'

export default function OrdersPage() {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [orderType, setOrderType] = useState('MARKET')
  const [symbol, setSymbol] = useState('RELIANCE')
  const [qty, setQty] = useState('10')
  const [price, setPrice] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const orders = [
    { id: 'ORD001', sym: 'RELIANCE', side: 'BUY',  qty: 10, price: 2941.50, status: 'COMPLETE', time: '09:18 AM' },
    { id: 'ORD002', sym: 'TCS',      side: 'SELL', qty: 5,  price: 3780.25, status: 'COMPLETE', time: '10:45 AM' },
    { id: 'ORD003', sym: 'INFY',     side: 'BUY',  qty: 20, price: 1680.10, status: 'PENDING',  time: '11:02 AM' },
    { id: 'ORD004', sym: 'SBIN',     side: 'BUY',  qty: 50, price: 782.90,  status: 'CANCELLED',time: '12:30 PM' },
    { id: 'ORD005', sym: 'HCLTECH',  side: 'BUY',  qty: 10, price: 1542.35, status: 'COMPLETE', time: '02:15 PM' },
  ]

  const statusColor: Record<string, string> = {
    COMPLETE: '#26a69a', PENDING: '#f0b429', CANCELLED: '#ef5350'
  }
  const statusBg: Record<string, string> = {
    COMPLETE: 'rgba(38,166,154,0.12)', PENDING: 'rgba(240,180,41,0.12)', CANCELLED: 'rgba(239,83,80,0.12)'
  }

  function handleSubmit() {
    if (!symbol || !qty) return
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div style={{ padding: '24px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Order Placement</div>
        <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Place and manage your orders · NSE · BSE</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '16px' }}>

        {/* Order Form */}
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>New Order</div>

          {/* Buy/Sell toggle */}
          <div style={{ display: 'flex', background: '#1e2438', borderRadius: '6px', padding: '3px', marginBottom: '16px' }}>
            {(['BUY', 'SELL'] as const).map(s => (
              <button key={s} onClick={() => setSide(s)} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '4px', fontSize: '12px',
                fontWeight: 700, cursor: 'pointer', transition: '0.2s',
                background: side === s ? (s === 'BUY' ? '#26a69a' : '#ef5350') : 'transparent',
                color: side === s ? '#fff' : '#8892a4'
              }}>{s === 'BUY' ? '▲ BUY' : '▼ SELL'}</button>
            ))}
          </div>

          {/* Symbol */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px', letterSpacing: '0.5px' }}>SYMBOL</div>
            <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
              style={{ width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '9px 12px', color: '#D1D4DC', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }} />
          </div>

          {/* Order Type */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px', letterSpacing: '0.5px' }}>ORDER TYPE</div>
            <select value={orderType} onChange={e => setOrderType(e.target.value)}
              style={{ width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '9px 12px', color: '#D1D4DC', fontSize: '13px', outline: 'none' }}>
              <option value="MARKET">Market</option>
              <option value="LIMIT">Limit</option>
              <option value="SL">Stop Loss</option>
            </select>
          </div>

          {/* Qty + Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px', letterSpacing: '0.5px' }}>QUANTITY</div>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)}
                style={{ width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '9px 12px', color: '#D1D4DC', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px', letterSpacing: '0.5px' }}>PRICE (₹)</div>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                placeholder={orderType === 'MARKET' ? 'Auto' : ''}
                disabled={orderType === 'MARKET'}
                style={{ width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '6px', padding: '9px 12px', color: '#D1D4DC', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none', opacity: orderType === 'MARKET' ? 0.5 : 1 }} />
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} style={{
            width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            background: side === 'BUY' ? '#26a69a' : '#ef5350', color: '#fff'
          }}>
            {side === 'BUY' ? '▲ Place Buy Order' : '▼ Place Sell Order'}
          </button>

          {submitted && (
            <div style={{ marginTop: '12px', background: 'rgba(38,166,154,0.12)', border: '1px solid rgba(38,166,154,0.3)', borderRadius: '7px', padding: '10px', fontSize: '12px', color: '#26a69a', textAlign: 'center' }}>
              ✓ Order placed successfully!
            </div>
          )}
        </div>

        {/* Order Book */}
        <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #252d3d' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Order Book — Today</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1e2438' }}>
                  {['Order ID', 'Symbol', 'Side', 'Qty', 'Price', 'Time', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 600, letterSpacing: '0.9px', color: '#8892a4', textTransform: 'uppercase' as const, borderBottom: '1px solid #252d3d', whiteSpace: 'nowrap' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid rgba(37,45,61,0.6)' }}>
                    <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#8892a4' }}>{o.id}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: '#fff', fontSize: '13px' }}>{o.sym}</td>
                    <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700, color: o.side === 'BUY' ? '#26a69a' : '#ef5350' }}>{o.side}</td>
                    <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#D1D4DC' }}>{o.qty}</td>
                    <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#D1D4DC' }}>₹{o.price.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#8892a4' }}>{o.time}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ background: statusBg[o.status], color: statusColor[o.status], borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}