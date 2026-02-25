'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useTheme()

  // Password strength indicator
  function getStrength(pw: string) {
    let score = 0
    if (pw.length >= 8) score++
    if (pw.length >= 12) score++
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    const levels = [
      { label: 'Very Weak', color: '#ef4444' },
      { label: 'Weak', color: '#f97316' },
      { label: 'Fair', color: '#eab308' },
      { label: 'Strong', color: '#22c55e' },
      { label: 'Very Strong', color: '#10b981' },
    ]
    const capped = Math.min(score, 4)
    return { score: capped, ...levels[capped] }
  }

  const strength = getStrength(password)

  async function handleSignup() {
    if (!name || !email || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (res.ok && data.name) {
        // Auth cookies are set automatically by the server (HTTP-only)
        localStorage.setItem('userName', data.name)
        router.push('/')
      } else {
        setError(data.error || 'Signup failed')
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
        <div style={{ fontSize: '13px', color: t.textDim, marginBottom: '28px' }}>Create your account</div>

        {error && (
          <div style={{ background: `${t.red}15`, border: `1px solid ${t.red}30`, borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: t.red, marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.04em' }}>FULL NAME</div>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Arjun Kapoor" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.04em' }}>EMAIL</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.04em' }}>PASSWORD</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSignup()} style={inputStyle} />
        </div>

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  flex: 1, height: '3px', borderRadius: '2px',
                  background: i <= strength.score ? strength.color : t.border,
                  transition: 'background .3s'
                }} />
              ))}
            </div>
            <div style={{ fontSize: '10px', color: strength.color, fontWeight: 600 }}>{strength.label}</div>
            <div style={{ fontSize: '9px', color: t.textMuted, marginTop: '2px' }}>
              8+ chars · uppercase · lowercase · number
            </div>
          </div>
        )}

        <button onClick={handleSignup} disabled={loading} style={{
          width: '100%', background: `linear-gradient(135deg, ${t.accent}, #6c63ff)`, border: 'none', borderRadius: '10px',
          color: '#fff', padding: '12px', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity .2s',
        }}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p style={{ color: t.textDim, fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>
          Already have an account? <a href="/login" style={{ color: t.accent, textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
        </p>

        <p style={{ color: t.textMuted, fontSize: '9px', marginTop: '12px', textAlign: 'center' }}>
          By signing up you agree to our <a href="/terms" style={{ color: t.accent, textDecoration: 'none' }}>Terms</a> and <a href="/privacy" style={{ color: t.accent, textDecoration: 'none' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}