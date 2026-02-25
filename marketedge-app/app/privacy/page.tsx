'use client'
import { useTheme } from '@/lib/theme'

export default function PrivacyPage() {
    const { t } = useTheme()
    const sectionStyle = { marginBottom: '28px' }
    const headingStyle = { fontSize: '18px', fontWeight: 700 as const, color: t.text, marginBottom: '12px' }
    const textStyle = { fontSize: '13px', color: t.textDim, lineHeight: '1.7' }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: t.text, marginBottom: '8px' }}>
                Privacy Policy
            </h1>
            <p style={{ fontSize: '13px', color: t.textMuted, marginBottom: '36px' }}>
                Last updated: February 2026
            </p>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>1. Our Commitment</h2>
                <p style={textStyle}>
                    MarketEdge is committed to protecting your privacy. We believe your financial data is deeply personal,
                    and we will <strong style={{ color: t.accent }}>never sell, share, or monetize your personal data</strong>.
                    This policy explains exactly what we collect, why, and how we protect it.
                </p>
            </div>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>2. Data We Collect</h2>
                <div style={textStyle}>
                    <p style={{ marginBottom: '8px' }}><strong>Account Data:</strong> Name, email address, and password hash (we never store your password in plain text).</p>
                    <p style={{ marginBottom: '8px' }}><strong>User-Generated Data:</strong> Watchlists, trade journal entries, paper portfolio, and price alerts you create.</p>
                    <p style={{ marginBottom: '8px' }}><strong>Usage Data:</strong> We do NOT track your browsing behavior, chart views, or search queries.</p>
                    <p><strong>We do NOT collect:</strong> Payment details, government IDs, phone numbers, location data, or broker credentials.</p>
                </div>
            </div>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>3. How We Protect Your Data</h2>
                <div style={textStyle}>
                    <p style={{ marginBottom: '8px' }}>• Passwords are hashed with <strong>bcrypt</strong> (cost factor 12) — industry gold standard</p>
                    <p style={{ marginBottom: '8px' }}>• Authentication uses <strong>HTTP-only secure cookies</strong> — immune to XSS attacks</p>
                    <p style={{ marginBottom: '8px' }}>• All API routes are <strong>rate-limited</strong> to prevent brute-force attacks</p>
                    <p style={{ marginBottom: '8px' }}>• Input validation on every endpoint prevents injection attacks</p>
                    <p style={{ marginBottom: '8px' }}>• Security headers (CSP, HSTS, X-Frame-Options) on every response</p>
                    <p>• Data transmitted over <strong>HTTPS/TLS</strong> encryption</p>
                </div>
            </div>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>4. Your Rights</h2>
                <div style={textStyle}>
                    <p style={{ marginBottom: '8px' }}>Under GDPR and India&apos;s DPDPA, you have the right to:</p>
                    <p style={{ marginBottom: '8px' }}>• <strong>Export your data</strong> — Download all your data anytime from Settings</p>
                    <p style={{ marginBottom: '8px' }}>• <strong>Delete your account</strong> — Permanently erase all data from our servers</p>
                    <p style={{ marginBottom: '8px' }}>• <strong>Know what we store</strong> — This policy is our full disclosure</p>
                    <p>• <strong>Withdraw consent</strong> — Simply delete your account</p>
                </div>
            </div>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>5. Third-Party Services</h2>
                <div style={textStyle}>
                    <p style={{ marginBottom: '8px' }}>• <strong>Yahoo Finance API</strong> — We fetch public market data. No personal data is sent to Yahoo.</p>
                    <p style={{ marginBottom: '8px' }}>• <strong>Groq AI</strong> — AI queries are sent to Groq for processing. Messages are not stored by Groq beyond the request.</p>
                    <p>• <strong>MongoDB Atlas</strong> — Your data is stored in encrypted cloud databases.</p>
                </div>
            </div>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>6. Cookies</h2>
                <p style={textStyle}>
                    We use <strong>strictly necessary cookies</strong> only for authentication. We do NOT use tracking cookies,
                    analytics cookies, or advertising cookies. No third-party cookies are set.
                </p>
            </div>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>7. Contact</h2>
                <p style={textStyle}>
                    Questions about privacy? Email us at <strong style={{ color: t.accent }}>privacy@marketedge.app</strong>
                </p>
            </div>

            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '20px', marginTop: '40px', fontSize: '11px', color: t.textMuted, textAlign: 'center' }}>
                MarketEdge — 100% Free & Open Source · Your data is yours, always.
            </div>
        </div>
    )
}
