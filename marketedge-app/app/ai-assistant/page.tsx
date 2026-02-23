'use client'
import { useState } from 'react'

export default function AIAssistantPage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am MarketEdge AI, your personal Indian stock market analyst. Ask me about any NSE/BSE stock for BUY/SELL/HOLD recommendations, technical analysis, or market insights.' }
  ])
  const [loading, setLoading] = useState(false)

  const suggestions = [
    'Analyse RELIANCE for a swing trade',
    'Is NIFTY bullish or bearish today?',
    'Top sectors to watch this week',
    'Give me a stop loss strategy for INFY',
  ]

  async function sendMessage(text: string) {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply || 'Sorry, I could not process that.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error connecting to AI. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '24px', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>AI Assistant</div>
          <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Powered by Claude · NSE/BSE Analysis</div>
        </div>
        <div style={{ marginLeft: 'auto', background: 'rgba(41,98,255,0.12)', color: '#2962FF', border: '1px solid rgba(41,98,255,0.3)', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', fontWeight: 700 }}>
          🤖 AI ONLINE
        </div>
      </div>

      {/* Suggestion chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
        {suggestions.map(s => (
          <div key={s} onClick={() => sendMessage(s)} style={{
            padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
            cursor: 'pointer', border: '1px solid #252d3d', color: '#8892a4',
            background: '#1e2438', transition: '0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2962FF'; e.currentTarget.style.color = '#2962FF' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#252d3d'; e.currentTarget.style.color = '#8892a4' }}
          >{s}</div>
        ))}
      </div>

      {/* Chat window */}
      <div style={{ flex: 1, background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#2962FF,#6c63ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🤖</div>
              )}
              <div style={{
                maxWidth: '72%', padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? '#2962FF' : '#1e2438',
                border: m.role === 'assistant' ? '1px solid #252d3d' : 'none',
                fontSize: '13px', color: '#D1D4DC', lineHeight: 1.6,
                whiteSpace: 'pre-wrap' as const
              }}>
                {m.text}
              </div>
              {m.role === 'user' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#2962FF,#6c63ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>AK</div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#2962FF,#6c63ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🤖</div>
              <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: '#1e2438', border: '1px solid #252d3d', fontSize: '13px', color: '#8892a4' }}>
                Analysing market data...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px', borderTop: '1px solid #252d3d', display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage('')}
            placeholder="Ask about any stock, index or market trend..."
            style={{ flex: 1, background: '#1e2438', border: '1px solid #252d3d', borderRadius: '8px', padding: '10px 14px', color: '#D1D4DC', fontSize: '13px', outline: 'none', fontFamily: 'Syne, sans-serif' }}
          />
          <button onClick={() => sendMessage('')}
            disabled={loading}
            style={{ background: '#2962FF', border: 'none', borderRadius: '8px', color: '#fff', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            Send ➤
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#8892a4', textAlign: 'center' }}>
        ⚠️ AI analysis is for educational purposes only. Not SEBI-registered investment advice. Always do your own research.
      </div>

    </div>
  )
}