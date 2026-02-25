'use client'
import { useTheme } from '@/lib/theme'

export default function TermsPage() {
    const { t } = useTheme()
    const sectionStyle = { marginBottom: '28px' }
    const headingStyle = { fontSize: '18px', fontWeight: 700 as const, color: t.text, marginBottom: '12px' }
    const textStyle = { fontSize: '13px', color: t.textDim, lineHeight: '1.7' }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: t.text, marginBottom: '8px' }}>
                Terms of Service
            </h1>
            <p style={{ fontSize: '13px', color: t.textMuted, marginBottom: '36px' }}>
                Last updated: February 2026
            </p>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>1. Acceptance</h2>
                <p style={textStyle}>
                    By using MarketEdge, you agree to these terms. If you disagree, please do not use the platform.
                </p>
            </div>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>2. Service Description</h2>
                <p style={textStyle}>
                    MarketEdge provides free stock market charting, analysis tools, and an AI assistant for
                    educational and informational purposes. We are <strong>not</strong> a registered broker,
                    investment advisor, or financial institution.
                </p>
            </div>

            <div style={{ ...sectionStyle, background: `${t.red}10`, border: `1px solid ${t.red}30`, borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ ...headingStyle, color: t.red }}>⚠️ 3. Financial Disclaimer</h2>
                <div style={textStyle}>
                    <p style={{ marginBottom: '8px' }}><strong>MarketEdge does NOT provide financial advice.</strong></p>
                    <p style={{ marginBottom: '8px' }}>• All data, charts, indicators, and AI recommendations are for <strong>educational purposes only</strong></p>
                    <p style={{ marginBottom: '8px' }}>• Past performance does not guarantee future results</p>
                    <p style={{ marginBottom: '8px' }}>• Paper trading results do not reflect real market conditions</p>
                    <p style={{ marginBottom: '8px' }}>• AI-generated analysis may contain errors or outdated information</p>
                    <p><strong>Always consult a registered SEBI advisor before making investment decisions.</strong></p>
                </div>
            </div>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>4. User Responsibilities</h2>
                <div style={textStyle}>
                    <p style={{ marginBottom: '8px' }}>• You must be 18+ years old to create an account</p>
                    <p style={{ marginBottom: '8px' }}>• You are responsible for keeping your login credentials secure</p>
                    <p style={{ marginBottom: '8px' }}>• You must not attempt to breach or exploit our systems</p>
                    <p>• You must not use our AI assistant for market manipulation or illegal activities</p>
                </div>
            </div>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>5. Data & Privacy</h2>
                <p style={textStyle}>
                    Your data handling is governed by our <a href="/privacy" style={{ color: t.accent, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>.
                    We never sell your data. You can export or delete your data at any time.
                </p>
            </div>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>6. Limitation of Liability</h2>
                <p style={textStyle}>
                    MarketEdge is provided &quot;as-is&quot; without warranties. We are not liable for any financial losses
                    resulting from decisions made using our platform, AI recommendations, or data displayed.
                    Market data is sourced from Yahoo Finance and may be delayed or inaccurate.
                </p>
            </div>

            <div style={sectionStyle}>
                <h2 style={headingStyle}>7. Open Source</h2>
                <p style={textStyle}>
                    MarketEdge is open source software. You may inspect, modify, and self-host the platform
                    under the terms of our license. Contributions are welcome.
                </p>
            </div>

            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '20px', marginTop: '40px', fontSize: '11px', color: t.textMuted, textAlign: 'center' }}>
                MarketEdge — 100% Free & Open Source · Built for Indian traders, by Indian traders.
            </div>
        </div>
    )
}
