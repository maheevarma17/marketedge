'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useTheme()

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userName', data.name)
        router.push('/')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('Cannot connect to server')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: t.bgInput, border: `1px solid ${t.border}`,
    borderRadius: '10px', padding: '11px 14px', color: t.text, fontSize: '13px', outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '36px', width: '380px', boxShadow: t.shadow }}>
        <div style={{ fontSize: '26px', fontWeight: 800, color: t.text, marginBottom: '4px', letterSpacing: '-0.03em' }}>
          Market<span style={{ color: t.accent }}>Edge</span>
        </div>
        <div style={{ fontSize: '13px', color: t.textDim, marginBottom: '28px' }}>Sign in to your account</div>

        {error && (
          <div style={{ background: `${t.red}15`, border: `1px solid ${t.red}30`, borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: t.red, marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.04em' }}>EMAIL</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.04em' }}>PASSWORD</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} style={inputStyle} />
        </div>

        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', background: `linear-gradient(135deg, ${t.accent}, #6c63ff)`, border: 'none', borderRadius: '10px',
          color: '#fff', padding: '12px', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity .2s',
        }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ color: t.textDim, fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>
          No account? <a href="/signup" style={{ color: t.accent, textDecoration: 'none', fontWeight: 600 }}>Sign up free</a>
        </p>
      </div>
    </div>
  )
}