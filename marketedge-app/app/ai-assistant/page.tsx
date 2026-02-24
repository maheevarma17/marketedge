'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/theme'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

export default function AIAssistantPage() {
  const { t } = useTheme()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hello! I am MarketEdge AI, your personal Indian stock market analyst. 🤖\n\nAsk me about any NSE/BSE stock — I\'ll give BUY/SELL/HOLD recommendations, technical analysis, and market insights.' }
  ])
  const [loading, setLoading] = useState(false)
  const chatEnd = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const suggestions = [
    'Analyse RELIANCE for a swing trade',
    'Is NIFTY bullish or bearish?',
    'Top 3 stocks to buy this week',
    'Give me a stop loss strategy for INFY',
    'Compare TCS vs INFY fundamentals',
    'Best banking stocks under ₹1000',
  ]

  useEffect(() => { loadingRef.current = loading }, [loading])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendToAI = useCallback(async (text: string) => {
    const msg = text.trim()
    if (!msg || loadingRef.current) return

    setLoading(true)
    loadingRef.current = true
    setMessages(prev => [...prev, { role: 'user', text: msg }])

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      })
      const data = await res.json()
      const reply = data.reply || data.error || 'Sorry, could not process that.'
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch {
      const errMsg = '❌ Connection error. Make sure GROQ_API_KEY is set in .env.local\n\nGet free key: https://console.groq.com'
      setMessages(prev => [...prev, { role: 'assistant', text: errMsg }])
    }

    setLoading(false)
    loadingRef.current = false
  }, [])

  return (
    <div style={{ padding: '24px', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: t.text }}>AI Assistant</div>
        <div style={{ fontSize: '12px', color: t.textDim, marginTop: '4px' }}>Powered by Groq AI · Stock Analysis & Recommendations</div>
      </div>

      {/* Suggestions */}
      <div className="me-suggestions" style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {suggestions.map(s => (
          <div key={s} onClick={() => sendToAI(s)} style={{
            padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
            cursor: 'pointer', border: `1px solid ${t.border}`, color: t.textDim,
            background: t.bgInput, transition: '.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textDim }}
          >{s}</div>
        ))}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg,${t.accent},#6c63ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🤖</div>
              )}
              <div style={{
                maxWidth: '75%', padding: '12px 16px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? t.accent : t.bgInput,
                border: m.role === 'assistant' ? `1px solid ${t.border}` : 'none',
                fontSize: '13px', color: m.role === 'user' ? '#fff' : t.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              }}>
                {m.text}
              </div>
              {m.role === 'user' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg,${t.accent},#6c63ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>ME</div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg,${t.accent},#6c63ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🤖</div>
              <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: t.bgInput, border: `1px solid ${t.border}`, fontSize: '13px', color: t.textDim }}>
                <span style={{ animation: 'pulse 1.5s infinite' }}>Analysing market data...</span>
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: '8px' }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { sendToAI(input); setInput('') } }}
            placeholder="Ask about any stock, index or market trend..."
            style={{ flex: 1, background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '10px 14px', color: t.textMuted, fontSize: '13px', outline: 'none' }} />
          <button onClick={() => { if (input.trim()) { sendToAI(input); setInput('') } }} disabled={loading}
            style={{ background: t.accent, border: 'none', borderRadius: '8px', color: '#fff', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            Send ➤
          </button>
        </div>
      </div>

      <div style={{ marginTop: '8px', fontSize: '10px', color: t.textDim, textAlign: 'center' }}>
        ⚠️ AI analysis is for educational purposes only. Not SEBI-registered investment advice.
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}