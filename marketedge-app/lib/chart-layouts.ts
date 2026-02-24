// ──────────────────────────────────────────────────
// MarketEdge Pro — Chart Layout & Template System
// Unlimited layouts, unlimited templates — all free
// ──────────────────────────────────────────────────

export type LayoutType = '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | '2x3' | '3x2' | '4x2'

export interface ChartPanelConfig {
    symbol: string
    interval: string
    range: string
    chartType: 'candle' | 'line' | 'area' | 'bar' | 'heikinAshi' | 'hollowCandle' | 'baseline' | 'columns'
    indicators: ActiveIndicator[]
    showVolume: boolean
}

export interface ActiveIndicator {
    id: string
    params: Record<string, number>
    color: string
    visible: boolean
}

export interface ChartLayout {
    id: string
    name: string
    layoutType: LayoutType
    panels: ChartPanelConfig[]
    createdAt: number
    updatedAt: number
}

export interface ChartTemplate {
    id: string
    name: string
    indicators: ActiveIndicator[]
    chartType: ChartPanelConfig['chartType']
    showVolume: boolean
}

// ─── Layout configurations ───
export const LAYOUT_CONFIGS: Record<LayoutType, { rows: number; cols: number; label: string; icon: string }> = {
    '1x1': { rows: 1, cols: 1, label: 'Single', icon: '◻️' },
    '2x1': { rows: 1, cols: 2, label: '2 Horizontal', icon: '◫' },
    '1x2': { rows: 2, cols: 1, label: '2 Vertical', icon: '⬒' },
    '2x2': { rows: 2, cols: 2, label: '4 Grid', icon: '⊞' },
    '3x1': { rows: 1, cols: 3, label: '3 Horizontal', icon: '≡' },
    '2x3': { rows: 3, cols: 2, label: '6 Grid', icon: '⊞' },
    '3x2': { rows: 2, cols: 3, label: '6 Wide', icon: '⊞' },
    '4x2': { rows: 2, cols: 4, label: '8 Grid', icon: '⊞' },
}

// ─── Default panel config ───
export function createDefaultPanel(symbol: string = 'RELIANCE'): ChartPanelConfig {
    return {
        symbol,
        interval: '1d',
        range: '1y',
        chartType: 'candle',
        indicators: [
            { id: 'sma', params: { period: 20 }, color: '#f0b429', visible: true },
        ],
        showVolume: true,
    }
}

// ─── Default indicator colors ───
const INDICATOR_COLORS = [
    '#f0b429', '#2962FF', '#64ffda', '#ff7043', '#ab47bc',
    '#26a69a', '#ef5350', '#78909c', '#ec407a', '#7e57c2',
]

export function getIndicatorColor(index: number): string {
    return INDICATOR_COLORS[index % INDICATOR_COLORS.length]
}

// ─── Layout Manager ───
export class LayoutManager {
    private static LAYOUTS_KEY = 'me_chart_layouts'
    private static TEMPLATES_KEY = 'me_chart_templates'
    private static ACTIVE_KEY = 'me_active_layout'

    // ─── Layouts ───

    static getLayouts(): ChartLayout[] {
        if (typeof window === 'undefined') return []
        try {
            const raw = localStorage.getItem(this.LAYOUTS_KEY)
            return raw ? JSON.parse(raw) : []
        } catch { return [] }
    }

    static saveLayout(layout: ChartLayout): void {
        if (typeof window === 'undefined') return
        const layouts = this.getLayouts()
        const idx = layouts.findIndex(l => l.id === layout.id)
        if (idx >= 0) {
            layouts[idx] = { ...layout, updatedAt: Date.now() }
        } else {
            layouts.push(layout)
        }
        localStorage.setItem(this.LAYOUTS_KEY, JSON.stringify(layouts))
    }

    static deleteLayout(id: string): void {
        if (typeof window === 'undefined') return
        const layouts = this.getLayouts().filter(l => l.id !== id)
        localStorage.setItem(this.LAYOUTS_KEY, JSON.stringify(layouts))
    }

    static createLayout(name: string, layoutType: LayoutType): ChartLayout {
        const config = LAYOUT_CONFIGS[layoutType]
        const numPanels = config.rows * config.cols
        const defaultSymbols = ['RELIANCE', 'TCS', 'INFY', 'SBIN', 'HDFCBANK', 'TATAMOTORS', 'ITC', 'WIPRO']
        const panels: ChartPanelConfig[] = []

        for (let i = 0; i < numPanels; i++) {
            panels.push(createDefaultPanel(defaultSymbols[i % defaultSymbols.length]))
        }

        const layout: ChartLayout = {
            id: `layout_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name,
            layoutType,
            panels,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        this.saveLayout(layout)
        return layout
    }

    // ─── Active Layout ───

    static getActiveLayoutId(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem(this.ACTIVE_KEY)
    }

    static setActiveLayout(id: string): void {
        if (typeof window === 'undefined') return
        localStorage.setItem(this.ACTIVE_KEY, id)
    }

    // ─── Templates ───

    static getTemplates(): ChartTemplate[] {
        if (typeof window === 'undefined') return []
        try {
            const raw = localStorage.getItem(this.TEMPLATES_KEY)
            return raw ? JSON.parse(raw) : this.getDefaultTemplates()
        } catch { return this.getDefaultTemplates() }
    }

    static saveTemplate(template: ChartTemplate): void {
        if (typeof window === 'undefined') return
        const templates = this.getTemplates()
        const idx = templates.findIndex(t => t.id === template.id)
        if (idx >= 0) templates[idx] = template
        else templates.push(template)
        localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates))
    }

    static deleteTemplate(id: string): void {
        if (typeof window === 'undefined') return
        const templates = this.getTemplates().filter(t => t.id !== id)
        localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates))
    }

    static getDefaultTemplates(): ChartTemplate[] {
        return [
            {
                id: 'tpl_scalping',
                name: '⚡ Scalping',
                chartType: 'candle',
                showVolume: true,
                indicators: [
                    { id: 'ema', params: { period: 9 }, color: '#64ffda', visible: true },
                    { id: 'ema', params: { period: 21 }, color: '#ff7043', visible: true },
                    { id: 'vwap', params: {}, color: '#ab47bc', visible: true },
                ],
            },
            {
                id: 'tpl_swing',
                name: '🌊 Swing Trading',
                chartType: 'candle',
                showVolume: true,
                indicators: [
                    { id: 'sma', params: { period: 20 }, color: '#f0b429', visible: true },
                    { id: 'sma', params: { period: 50 }, color: '#2962FF', visible: true },
                    { id: 'rsi', params: { period: 14 }, color: '#ef5350', visible: true },
                    { id: 'macd', params: { fast: 12, slow: 26, signal: 9 }, color: '#26a69a', visible: true },
                ],
            },
            {
                id: 'tpl_trend',
                name: '📈 Trend Following',
                chartType: 'candle',
                showVolume: true,
                indicators: [
                    { id: 'supertrend', params: { period: 10, multiplier: 3 }, color: '#26a69a', visible: true },
                    { id: 'adx', params: { period: 14 }, color: '#f0b429', visible: true },
                    { id: 'ema', params: { period: 50 }, color: '#2962FF', visible: true },
                ],
            },
            {
                id: 'tpl_reversal',
                name: '🔄 Reversal',
                chartType: 'candle',
                showVolume: true,
                indicators: [
                    { id: 'rsi', params: { period: 14 }, color: '#f0b429', visible: true },
                    { id: 'bollingerBands', params: { period: 20, stdDev: 2 }, color: '#78909c', visible: true },
                    { id: 'stochastic', params: { kPeriod: 14, dPeriod: 3 }, color: '#ab47bc', visible: true },
                ],
            },
            {
                id: 'tpl_volume',
                name: '📊 Volume Analysis',
                chartType: 'candle',
                showVolume: true,
                indicators: [
                    { id: 'vwap', params: {}, color: '#ab47bc', visible: true },
                    { id: 'obv', params: {}, color: '#26a69a', visible: true },
                    { id: 'cmf', params: { period: 20 }, color: '#f0b429', visible: true },
                    { id: 'mfi', params: { period: 14 }, color: '#ef5350', visible: true },
                ],
            },
        ]
    }
}
