'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface Theme {
    id: string
    name: string
    icon: string
    colors: {
        bg: string
        bgCard: string
        bgInput: string
        border: string
        text: string
        textMuted: string
        textDim: string
        accent: string
        green: string
        red: string
        yellow: string
        blue: string
        // Organic additions
        shadow: string
        glow: string
        glass: string
        glassBorder: string
    }
}

export const THEMES: Theme[] = [
    {
        id: 'dark', name: 'Midnight', icon: '🌙',
        colors: {
            bg: '#0b0e14', bgCard: 'rgba(255,255,255,0.035)', bgInput: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.06)',
            text: '#f0f2f5', textMuted: '#c9cdd4', textDim: '#6b7280',
            accent: '#6383ff', green: '#34d399', red: '#f87171', yellow: '#fbbf24', blue: '#6383ff',
            shadow: '0 1px 3px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.15)',
            glow: '0 0 20px rgba(99,131,255,.15)',
            glass: 'rgba(15,18,25,0.8)',
            glassBorder: 'rgba(255,255,255,0.08)',
        }
    },
    {
        id: 'light', name: 'Daylight', icon: '☀️',
        colors: {
            bg: '#f8f9fc', bgCard: 'rgba(255,255,255,0.8)', bgInput: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.06)',
            text: '#111827', textMuted: '#374151', textDim: '#9ca3af',
            accent: '#4f6ef7', green: '#059669', red: '#dc2626', yellow: '#d97706', blue: '#4f6ef7',
            shadow: '0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.04)',
            glow: '0 0 20px rgba(79,110,247,.1)',
            glass: 'rgba(255,255,255,0.85)',
            glassBorder: 'rgba(0,0,0,0.06)',
        }
    },
    {
        id: 'ocean', name: 'Deep Sea', icon: '🌊',
        colors: {
            bg: '#080d1a', bgCard: 'rgba(100,180,255,0.04)', bgInput: 'rgba(100,180,255,0.06)', border: 'rgba(100,180,255,0.08)',
            text: '#e0ecff', textMuted: '#9bb5d6', textDim: '#5b7a9e',
            accent: '#60a5fa', green: '#5eead4', red: '#fca5a5', yellow: '#fcd34d', blue: '#60a5fa',
            shadow: '0 1px 3px rgba(0,0,0,.4), 0 4px 12px rgba(0,20,60,.2)',
            glow: '0 0 20px rgba(96,165,250,.15)',
            glass: 'rgba(8,13,26,0.85)',
            glassBorder: 'rgba(100,180,255,0.1)',
        }
    },
    {
        id: 'emerald', name: 'Forest', icon: '🌿',
        colors: {
            bg: '#080f0c', bgCard: 'rgba(52,211,153,0.04)', bgInput: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.08)',
            text: '#e8f5ee', textMuted: '#a3d9b8', textDim: '#5b8c72',
            accent: '#34d399', green: '#34d399', red: '#fca5a5', yellow: '#fbbf24', blue: '#67e8f9',
            shadow: '0 1px 3px rgba(0,0,0,.4), 0 4px 12px rgba(0,30,15,.2)',
            glow: '0 0 20px rgba(52,211,153,.12)',
            glass: 'rgba(8,15,12,0.85)',
            glassBorder: 'rgba(52,211,153,0.1)',
        }
    },
    {
        id: 'purple', name: 'Nebula', icon: '✨',
        colors: {
            bg: '#0c0815', bgCard: 'rgba(167,139,250,0.04)', bgInput: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.08)',
            text: '#f0e6ff', textMuted: '#c4b5fd', textDim: '#7c6b9e',
            accent: '#a78bfa', green: '#6ee7b7', red: '#fca5a5', yellow: '#fcd34d', blue: '#a78bfa',
            shadow: '0 1px 3px rgba(0,0,0,.4), 0 4px 12px rgba(20,0,40,.2)',
            glow: '0 0 20px rgba(167,139,250,.12)',
            glass: 'rgba(12,8,21,0.85)',
            glassBorder: 'rgba(167,139,250,0.1)',
        }
    },
]

const STORAGE_KEY = 'marketedge_theme'

interface ThemeContextType {
    theme: Theme
    setThemeId: (id: string) => void
    t: Theme['colors'] // shortcut
}

const ThemeContext = createContext<ThemeContextType>({
    theme: THEMES[0],
    setThemeId: () => { },
    t: THEMES[0].colors,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(THEMES[0])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const found = THEMES.find(t => t.id === saved)
            if (found) setTheme(found)
        }
        setMounted(true)
    }, [])

    function setThemeId(id: string) {
        const found = THEMES.find(t => t.id === id)
        if (found) {
            setTheme(found)
            localStorage.setItem(STORAGE_KEY, id)
        }
    }

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <div style={{ background: '#0b0e14', color: '#c9cdd4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em' }}>Market<span style={{ color: '#6383ff' }}>Edge</span></div>
                    <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.4 }}>Loading...</div>
                </div>
            </div>
        )
    }

    return (
        <ThemeContext.Provider value={{ theme, setThemeId, t: theme.colors }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}
