'use client'
import { useState, useEffect } from 'react'
import {
    getPortfolio,
    getPortfolioStats,
    setCapital,
    formatINR,
    type PaperTrade
} from '@/lib/paper-trading'
import { useTheme, THEMES } from '@/lib/theme'

const STORAGE_KEY_PROFILE = 'marketedge_profile'

interface UserProfile {
    name: string
    email: string
    phone: string
    pan: string
    joinDate: string
    broker: string
}

function loadProfile(): UserProfile | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE)
    return raw ? JSON.parse(raw) : null
}

function saveProfile(p: UserProfile) {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(p))
}

export default function ProfilePage() {
    const { theme, setThemeId, t } = useTheme()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isNewUser, setIsNewUser] = useState(false)
    const [stats, setStats] = useState(getPortfolioStats())
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editPhone, setEditPhone] = useState('')
    const [editing, setEditing] = useState(false)
    const [showCapitalModal, setShowCapitalModal] = useState(false)
    const [newCapital, setNewCapital] = useState('')
    const [toast, setToast] = useState<string | null>(null)
    const [recentTrades, setRecentTrades] = useState<PaperTrade[]>([])

    useEffect(() => {
        const p = loadProfile()
        if (p) {
            setProfile(p)
            setEditName(p.name)
            setEditEmail(p.email)
            setEditPhone(p.phone)
        } else {
            setIsNewUser(true)
        }
        setStats(getPortfolioStats())
        const portfolio = getPortfolio()
        setRecentTrades(portfolio.trades.slice(0, 5))
    }, [])

    function handleCreateProfile() {
        if (!editName.trim()) { showToastMsg('❌ Please enter your name'); return }
        const newProfile: UserProfile = {
            name: editName.trim(),
            email: editEmail.trim() || 'Not set',
            phone: editPhone.trim() || 'Not set',
            pan: 'Not set',
            joinDate: new Date().toISOString(),
            broker: 'MarketEdge (Paper)',
        }
        saveProfile(newProfile)
        setProfile(newProfile)
        setIsNewUser(false)
        showToastMsg('✅ Profile created successfully!')
    }

    function handleSaveProfile() {
        if (!profile) return
        const updated = { ...profile, name: editName, email: editEmail, phone: editPhone }
        saveProfile(updated)
        setProfile(updated)
        setEditing(false)
        showToastMsg('✅ Profile updated successfully')
    }

    function handleSetCapital() {
        const amount = parseFloat(newCapital)
        if (isNaN(amount) || amount <= 0) { showToastMsg('❌ Enter a valid amount'); return }
        setCapital(amount)
        setStats(getPortfolioStats())
        setShowCapitalModal(false)
        setNewCapital('')
        showToastMsg(`✅ Virtual capital set to ${formatINR(amount)}`)
    }

    function showToastMsg(msg: string) {
        setToast(msg)
        setTimeout(() => setToast(null), 3500)
    }

    const mono = { fontFamily: 'JetBrains Mono, monospace' }
    const daysSinceJoin = profile ? Math.max(1, Math.floor((Date.now() - new Date(profile.joinDate).getTime()) / 86400000)) : 1
    const totalPortfolioValue = stats.virtualCapital + stats.totalPnL

    // ─── NEW USER SETUP ───
    if (isNewUser) {
        return (
            <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 140px)' }}>
                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '40px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px', background: `linear-gradient(135deg,${t.accent},#6c63ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>👤</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: t.text, marginBottom: '6px' }}>Welcome to MarketEdge</div>
                    <div style={{ fontSize: '13px', color: t.textDim, marginBottom: '24px' }}>Let's set up your profile</div>

                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>Your Name *</div>
                            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Enter your name"
                                style={{ width: '100%', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '11px 14px', color: t.textMuted, fontSize: '14px', ...mono, outline: 'none' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>Email (optional)</div>
                            <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="your@email.com"
                                style={{ width: '100%', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '11px 14px', color: t.textMuted, fontSize: '14px', ...mono, outline: 'none' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, marginBottom: '5px', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>Phone (optional)</div>
                            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+91 99999 99999"
                                style={{ width: '100%', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '11px 14px', color: t.textMuted, fontSize: '14px', ...mono, outline: 'none' }} />
                        </div>
                        <button onClick={handleCreateProfile} style={{
                            width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                            border: 'none', background: t.accent, color: '#fff', cursor: 'pointer', marginTop: '6px',
                        }}>🚀 Create My Profile</button>
                    </div>
                    <div style={{ marginTop: '16px', fontSize: '11px', color: t.textDim }}>
                        No account needed — your data is stored locally in your browser
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) return null

    return (
        <div style={{ padding: '24px', maxWidth: '1200px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: t.text }}>My Profile</div>
                <div style={{ fontSize: '12px', color: t.textDim, marginTop: '4px' }}>Account details & trading statistics</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
                {/* ─── Left: Profile Card ─── */}
                <div>
                    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 14px',
                            background: `linear-gradient(135deg,${t.accent},#6c63ff)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '28px', fontWeight: 800, color: '#fff',
                            border: `3px solid ${t.accent}66`,
                        }}>
                            {profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: t.text, marginBottom: '4px' }}>{profile.name}</div>
                        <div style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px' }}>{profile.email}</div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
                            <span style={{ background: `${t.yellow}26`, color: t.yellow, border: `1px solid ${t.yellow}66`, borderRadius: '5px', padding: '3px 10px', fontSize: '10px', fontWeight: 700 }}>PAPER TRADER</span>
                            <span style={{ background: `${t.green}1f`, color: t.green, border: `1px solid ${t.green}4d`, borderRadius: '5px', padding: '3px 10px', fontSize: '10px', fontWeight: 700 }}>ACTIVE</span>
                        </div>
                    </div>

                    {/* Account Details */}
                    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: t.text }}>Account Details</span>
                            <button onClick={() => { setEditing(!editing); if (!editing) { setEditName(profile.name); setEditEmail(profile.email); setEditPhone(profile.phone) } }} style={{
                                background: editing ? t.red : `${t.accent}1f`,
                                border: editing ? `1px solid ${t.red}` : `1px solid ${t.accent}4d`,
                                borderRadius: '5px', color: editing ? '#fff' : t.accent,
                                fontSize: '11px', fontWeight: 600, padding: '4px 10px', cursor: 'pointer',
                            }}>
                                {editing ? '✕ Cancel' : '✏️ Edit'}
                            </button>
                        </div>

                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { label: 'Full Name', value: editName, set: setEditName },
                                    { label: 'Email', value: editEmail, set: setEditEmail },
                                    { label: 'Phone', value: editPhone, set: setEditPhone },
                                ].map(f => (
                                    <div key={f.label}>
                                        <div style={{ fontSize: '10px', color: t.textDim, marginBottom: '4px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>{f.label}</div>
                                        <input value={f.value} onChange={e => f.set(e.target.value)}
                                            style={{ width: '100%', background: t.bg, border: `1px solid ${t.border}`, borderRadius: '6px', padding: '8px 10px', color: t.textMuted, fontSize: '13px', ...mono, outline: 'none' }} />
                                    </div>
                                ))}
                                <button onClick={handleSaveProfile} style={{ background: t.accent, border: 'none', borderRadius: '7px', color: '#fff', padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}>💾 Save Profile</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {[
                                    { label: 'Full Name', value: profile.name },
                                    { label: 'Email', value: profile.email },
                                    { label: 'Phone', value: profile.phone },
                                    { label: 'Broker', value: profile.broker },
                                    { label: 'Member Since', value: new Date(profile.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                                ].map(f => (
                                    <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.border}80`, fontSize: '12px' }}>
                                        <span style={{ color: t.textDim }}>{f.label}</span>
                                        <span style={{ color: t.textMuted, ...mono, fontWeight: 500 }}>{f.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Theme Picker */}
                    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: t.text, marginBottom: '10px' }}>🎨 Theme</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {THEMES.map(th => (
                                <div key={th.id} onClick={() => setThemeId(th.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                                    borderRadius: '6px', cursor: 'pointer',
                                    background: theme.id === th.id ? `${t.accent}22` : 'transparent',
                                    border: theme.id === th.id ? `1px solid ${t.accent}` : `1px solid transparent`,
                                }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: th.colors.bgCard, border: `2px solid ${th.colors.accent}`, flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: t.text }}>{th.icon} {th.name}</div>
                                    </div>
                                    {theme.id === th.id && <span style={{ marginLeft: 'auto', color: t.accent, fontSize: '14px' }}>✓</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => setShowCapitalModal(true)} style={{
                        width: '100%', background: `${t.accent}1f`, border: `1px solid ${t.accent}4d`,
                        borderRadius: '8px', color: t.accent, padding: '10px', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}>💰 Set Virtual Capital</button>
                </div>

                {/* ─── Right: Stats & Activity ─── */}
                <div>
                    <div style={{ background: `linear-gradient(135deg, ${t.bgCard} 0%, ${t.bgInput} 100%)`, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '10px' }}>WALLET OVERVIEW</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '6px' }}>Virtual Capital</div>
                                <div style={{ fontSize: '26px', fontWeight: 800, color: t.text, ...mono }}>{formatINR(stats.virtualCapital)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '6px' }}>Total Portfolio Value</div>
                                <div style={{ fontSize: '26px', fontWeight: 800, color: t.accent, ...mono }}>{formatINR(totalPortfolioValue)}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontSize: '10px', color: t.textDim }}>Realized P&L</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: stats.totalPnL >= 0 ? t.green : t.red, ...mono }}>{stats.totalPnL >= 0 ? '+' : ''}{formatINR(stats.totalPnL)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: t.textDim }}>Available Margin</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: t.textMuted, ...mono }}>{formatINR(stats.virtualCapital)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Trading Statistics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        {[
                            { label: 'Total Trades', value: stats.totalTrades.toString(), sub: `in ${daysSinceJoin} days`, color: t.textMuted, icon: '📊' },
                            { label: 'Open Positions', value: stats.openTrades.toString(), sub: 'active now', color: t.accent, icon: '📈' },
                            { label: 'Win Rate', value: stats.totalTrades > 0 ? `${stats.winRate}%` : '—', sub: `${stats.wins}W / ${stats.losses}L`, color: t.yellow, icon: '🎯' },
                            { label: 'Best Trade', value: stats.bestTrade > 0 ? '+' + formatINR(stats.bestTrade) : '—', sub: 'single trade', color: t.green, icon: '🏆' },
                            { label: 'Worst Trade', value: stats.worstTrade < 0 ? formatINR(stats.worstTrade) : '—', sub: 'single trade', color: t.red, icon: '📉' },
                            { label: 'Avg Profit', value: stats.avgProfit > 0 ? '+' + formatINR(stats.avgProfit) : '—', sub: 'per win', color: t.green, icon: '💰' },
                            { label: 'Avg Loss', value: stats.avgLoss < 0 ? formatINR(stats.avgLoss) : '—', sub: 'per loss', color: t.red, icon: '💸' },
                            { label: 'Profit Factor', value: stats.profitFactor > 0 ? stats.profitFactor.toString() : '—', sub: 'profit ÷ loss', color: t.textMuted, icon: '⚖️' },
                        ].map(s => (
                            <div key={s.label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '14px' }}>
                                <div style={{ fontSize: '16px', marginBottom: '6px' }}>{s.icon}</div>
                                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', color: t.textDim, textTransform: 'uppercase' as const, marginBottom: '6px' }}>{s.label}</div>
                                <div style={{ fontSize: '17px', fontWeight: 800, color: s.color, ...mono }}>{s.value}</div>
                                <div style={{ fontSize: '10px', color: t.textDim, marginTop: '4px' }}>{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Activity */}
                    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: t.text }}>Recent Activity</div>
                            <a href="/paper-trading" style={{ fontSize: '12px', color: t.accent, textDecoration: 'none', fontWeight: 600 }}>View All →</a>
                        </div>
                        {recentTrades.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: t.textDim, fontSize: '13px' }}>No trading activity yet. <a href="/paper-trading" style={{ color: t.accent, textDecoration: 'none' }}>Place your first trade</a></div>
                        ) : (
                            <div>
                                {recentTrades.map(tr => (
                                    <div key={tr.id} style={{ padding: '10px 18px', borderBottom: `1px solid ${t.border}60`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: tr.side === 'BUY' ? `${t.green}1f` : `${t.red}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                                            {tr.side === 'BUY' ? '📈' : '📉'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{tr.side} {tr.qty} × {tr.symbol}</div>
                                            <div style={{ fontSize: '10px', color: t.textDim, marginTop: '2px' }}>@ ₹{tr.entryPrice.toLocaleString('en-IN')} · {new Date(tr.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                                        </div>
                                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: tr.status === 'OPEN' ? `${t.accent}1f` : `${t.green}1f`, color: tr.status === 'OPEN' ? t.accent : t.green }}>{tr.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Set Capital Modal */}
            {showCapitalModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCapitalModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '28px', maxWidth: '380px', width: '90%' }}>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: t.text, marginBottom: '4px' }}>💰 Set Virtual Capital</div>
                        <div style={{ fontSize: '12px', color: t.textDim, marginBottom: '16px' }}>Current: <span style={{ color: t.text, fontWeight: 600 }}>{formatINR(stats.virtualCapital)}</span></div>
                        <input type="number" value={newCapital} onChange={e => setNewCapital(e.target.value)} placeholder="e.g. 1000000"
                            style={{ width: '100%', background: t.bg, border: `1px solid ${t.border}`, borderRadius: '6px', padding: '10px', color: t.textMuted, fontSize: '14px', ...mono, outline: 'none', marginBottom: '8px' }} />
                        <div style={{ fontSize: '10px', color: t.textDim, marginBottom: '14px' }}>
                            Quick: {[500000, 1000000, 2500000, 5000000].map(amt => (
                                <span key={amt} onClick={() => setNewCapital(amt.toString())} style={{ color: t.accent, cursor: 'pointer', marginRight: '10px' }}>{formatINR(amt)}</span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowCapitalModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, border: 'none', background: t.border, color: t.textDim, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSetCapital} style={{ flex: 1, padding: '10px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, border: 'none', background: t.accent, color: '#fff', cursor: 'pointer' }}>Set Capital</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 400, background: t.bgCard, border: `1px solid ${t.green}`, borderRadius: '10px', padding: '14px 20px', fontSize: '13px', color: t.text, boxShadow: '0 8px 32px rgba(0,0,0,.5)', animation: 'slideIn .3s ease-out' }}>
                    {toast}
                </div>
            )}
            <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
        </div>
    )
}
