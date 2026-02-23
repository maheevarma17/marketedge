'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#131722' }}>
      <div style={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: '12px', padding: '36px', width: '360px' }}>
        <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
          Market<span style={{ color: '#2962FF' }}>Edge</span>
        </div>
        <div style={{ fontSize: '12px', color: '#8892a4', marginBottom: '28px' }}>Sign in to your account</div>

        {error && (
          <div style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.3)', borderRadius: '7px', padding: '10px 14px', fontSize: '12px', color: '#ef5350', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px' }}>EMAIL</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '7px', padding: '10px 14px', color: '#D1D4DC', fontSize: '13px', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', marginBottom: '5px' }}>PASSWORD</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', background: '#1e2438', border: '1px solid #252d3d', borderRadius: '7px', padding: '10px 14px', color: '#D1D4DC', fontSize: '13px', outline: 'none' }} />
        </div>

        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', background: '#2962FF', border: 'none', borderRadius: '8px',
          color: '#fff', padding: '12px', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ color: '#8892a4', fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>
          No account? <a href="/signup" style={{ color: '#2962FF', textDecoration: 'none' }}>Sign up free</a>
        </p>
      </div>
    </div>
  )
}