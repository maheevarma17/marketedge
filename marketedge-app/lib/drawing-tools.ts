// ──────────────────────────────────────────────────
// MarketEdge Pro — Drawing Tools Engine
// Extensible system for chart annotations
// ──────────────────────────────────────────────────

export type DrawingToolType =
    | 'trendline' | 'horizontalLine' | 'verticalLine' | 'ray'
    | 'parallelChannel' | 'fibRetracement' | 'fibExtension'
    | 'rectangle' | 'ellipse' | 'text' | 'arrow'
    | 'measureTool' | 'priceRange' | 'pitchfork'

export interface DrawingPoint {
    time: string  // ISO date string matching chart time
    price: number
}

export interface DrawingStyle {
    color: string
    lineWidth: number
    lineStyle: 'solid' | 'dashed' | 'dotted'
    fillColor?: string
    fillOpacity?: number
    fontSize?: number
    fontWeight?: number
    showLabel?: boolean
}

export interface Drawing {
    id: string
    type: DrawingToolType
    points: DrawingPoint[]
    style: DrawingStyle
    text?: string
    locked: boolean
    visible: boolean
    createdAt: number
}

export interface FibLevel {
    level: number
    label: string
    price: number
}

// ─── Default styles for each tool ───
export const DEFAULT_STYLES: Record<DrawingToolType, DrawingStyle> = {
    trendline: { color: '#2962FF', lineWidth: 2, lineStyle: 'solid', showLabel: false },
    horizontalLine: { color: '#f0b429', lineWidth: 1, lineStyle: 'dashed', showLabel: true },
    verticalLine: { color: '#f0b429', lineWidth: 1, lineStyle: 'dashed', showLabel: false },
    ray: { color: '#2962FF', lineWidth: 1, lineStyle: 'solid', showLabel: false },
    parallelChannel: { color: '#26a69a', lineWidth: 1, lineStyle: 'solid', fillColor: '#26a69a', fillOpacity: 0.1 },
    fibRetracement: { color: '#f0b429', lineWidth: 1, lineStyle: 'solid', showLabel: true },
    fibExtension: { color: '#ab47bc', lineWidth: 1, lineStyle: 'dashed', showLabel: true },
    rectangle: { color: '#42a5f5', lineWidth: 1, lineStyle: 'solid', fillColor: '#42a5f5', fillOpacity: 0.1 },
    ellipse: { color: '#ef5350', lineWidth: 1, lineStyle: 'solid', fillColor: '#ef5350', fillOpacity: 0.1 },
    text: { color: '#ffffff', lineWidth: 1, lineStyle: 'solid', fontSize: 14, fontWeight: 400 },
    arrow: { color: '#2962FF', lineWidth: 2, lineStyle: 'solid' },
    measureTool: { color: '#78909c', lineWidth: 1, lineStyle: 'dashed', showLabel: true },
    priceRange: { color: '#66bb6a', lineWidth: 1, lineStyle: 'solid', fillColor: '#66bb6a', fillOpacity: 0.1, showLabel: true },
    pitchfork: { color: '#ce93d8', lineWidth: 1, lineStyle: 'solid' },
}

// ─── Tool metadata ───
export interface DrawingToolMeta {
    type: DrawingToolType
    name: string
    icon: string
    pointsRequired: number  // how many clicks to complete
    description: string
    category: 'line' | 'fibonacci' | 'shape' | 'annotation' | 'measure'
}

export const DRAWING_TOOLS: DrawingToolMeta[] = [
    // Lines
    { type: 'trendline', name: 'Trend Line', icon: '📏', pointsRequired: 2, description: 'Draw a line between two points', category: 'line' },
    { type: 'horizontalLine', name: 'Horizontal Line', icon: '➖', pointsRequired: 1, description: 'Horizontal price level', category: 'line' },
    { type: 'verticalLine', name: 'Vertical Line', icon: '|', pointsRequired: 1, description: 'Vertical time marker', category: 'line' },
    { type: 'ray', name: 'Ray', icon: '➡️', pointsRequired: 2, description: 'Line extending in one direction', category: 'line' },
    { type: 'parallelChannel', name: 'Parallel Channel', icon: '⬜', pointsRequired: 3, description: 'Two parallel trend lines', category: 'line' },

    // Fibonacci
    { type: 'fibRetracement', name: 'Fibonacci Retracement', icon: '🔢', pointsRequired: 2, description: 'Key retracement levels', category: 'fibonacci' },
    { type: 'fibExtension', name: 'Fibonacci Extension', icon: '📐', pointsRequired: 3, description: 'Price projection levels', category: 'fibonacci' },

    // Shapes
    { type: 'rectangle', name: 'Rectangle', icon: '▬', pointsRequired: 2, description: 'Draw a rectangle zone', category: 'shape' },
    { type: 'ellipse', name: 'Ellipse', icon: '⬭', pointsRequired: 2, description: 'Draw an ellipse', category: 'shape' },

    // Annotations
    { type: 'text', name: 'Text', icon: '🔤', pointsRequired: 1, description: 'Add text annotation', category: 'annotation' },
    { type: 'arrow', name: 'Arrow', icon: '↗️', pointsRequired: 2, description: 'Draw an arrow', category: 'annotation' },

    // Measurement
    { type: 'measureTool', name: 'Measure', icon: '📐', pointsRequired: 2, description: 'Measure price/time distance', category: 'measure' },
    { type: 'priceRange', name: 'Price Range', icon: '💰', pointsRequired: 2, description: 'Highlight a price range', category: 'measure' },

    // Advanced
    { type: 'pitchfork', name: 'Pitchfork', icon: '🔱', pointsRequired: 3, description: "Andrew's Pitchfork", category: 'line' },
]

// ─── Drawing State Manager ───
export class DrawingManager {
    private drawings: Map<string, Drawing> = new Map()
    private _storageKey: string
    private _listeners: Set<() => void> = new Set()

    constructor(chartId: string = 'default') {
        this._storageKey = `me_drawings_${chartId}`
        this.loadFromStorage()
    }

    /** Subscribe to changes */
    subscribe(fn: () => void): () => void {
        this._listeners.add(fn)
        return () => this._listeners.delete(fn)
    }

    private notify(): void {
        this._listeners.forEach(fn => fn())
    }

    /** Get all drawings */
    getAll(): Drawing[] {
        return Array.from(this.drawings.values()).filter(d => d.visible)
    }

    /** Get drawing by ID */
    get(id: string): Drawing | undefined {
        return this.drawings.get(id)
    }

    /** Add a new drawing */
    add(drawing: Omit<Drawing, 'id' | 'createdAt'>): Drawing {
        const id = `dwg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        const full: Drawing = { ...drawing, id, createdAt: Date.now() }
        this.drawings.set(id, full)
        this.saveToStorage()
        this.notify()
        return full
    }

    /** Update an existing drawing */
    update(id: string, updates: Partial<Drawing>): void {
        const existing = this.drawings.get(id)
        if (!existing) return
        this.drawings.set(id, { ...existing, ...updates, id })
        this.saveToStorage()
        this.notify()
    }

    /** Remove a drawing */
    remove(id: string): void {
        this.drawings.delete(id)
        this.saveToStorage()
        this.notify()
    }

    /** Clear all drawings */
    clearAll(): void {
        this.drawings.clear()
        this.saveToStorage()
        this.notify()
    }

    /** Toggle visibility */
    toggleVisibility(id: string): void {
        const d = this.drawings.get(id)
        if (!d) return
        this.update(id, { visible: !d.visible })
    }

    /** Toggle lock */
    toggleLock(id: string): void {
        const d = this.drawings.get(id)
        if (!d) return
        this.update(id, { locked: !d.locked })
    }

    /** Undo last drawing */
    undoLast(): void {
        const all = Array.from(this.drawings.values()).sort((a, b) => b.createdAt - a.createdAt)
        if (all.length > 0) {
            this.remove(all[0].id)
        }
    }

    /** Export drawings as JSON */
    exportJSON(): string {
        return JSON.stringify(Array.from(this.drawings.values()), null, 2)
    }

    /** Import drawings from JSON */
    importJSON(json: string): void {
        try {
            const arr: Drawing[] = JSON.parse(json)
            arr.forEach(d => this.drawings.set(d.id, d))
            this.saveToStorage()
            this.notify()
        } catch { /* ignore invalid JSON */ }
    }

    // ─── Persistence ───
    private saveToStorage(): void {
        if (typeof window === 'undefined') return
        try {
            localStorage.setItem(this._storageKey, JSON.stringify(Array.from(this.drawings.values())))
        } catch { /* storage full or unavailable */ }
    }

    private loadFromStorage(): void {
        if (typeof window === 'undefined') return
        try {
            const raw = localStorage.getItem(this._storageKey)
            if (!raw) return
            const arr: Drawing[] = JSON.parse(raw)
            arr.forEach(d => this.drawings.set(d.id, d))
        } catch { /* ignore */ }
    }
}

// ─── Fibonacci Calculations ───
const FIB_RETRACEMENT_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
const FIB_EXTENSION_LEVELS = [0, 0.618, 1, 1.618, 2, 2.618, 4.236]

export function calcFibRetracement(startPrice: number, endPrice: number): FibLevel[] {
    const diff = endPrice - startPrice
    return FIB_RETRACEMENT_LEVELS.map(level => ({
        level,
        label: `${(level * 100).toFixed(1)}%`,
        price: parseFloat((endPrice - diff * level).toFixed(2)),
    }))
}

export function calcFibExtension(startPrice: number, endPrice: number, retracementPrice: number): FibLevel[] {
    const diff = Math.abs(endPrice - startPrice)
    const direction = endPrice > startPrice ? 1 : -1
    return FIB_EXTENSION_LEVELS.map(level => ({
        level,
        label: `${(level * 100).toFixed(1)}%`,
        price: parseFloat((retracementPrice + direction * diff * level).toFixed(2)),
    }))
}

// ─── Measurement Calculations ───
export interface MeasureResult {
    priceChange: number
    priceChangePct: number
    bars: number
    timeDescription: string
}

export function calcMeasurement(startPoint: DrawingPoint, endPoint: DrawingPoint, totalBars?: number): MeasureResult {
    const priceChange = endPoint.price - startPoint.price
    const priceChangePct = (priceChange / startPoint.price) * 100
    const bars = totalBars || 0

    const start = new Date(startPoint.time)
    const end = new Date(endPoint.time)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    let timeDescription = ''
    if (diffDays > 365) timeDescription = `${Math.floor(diffDays / 365)}y ${diffDays % 365}d`
    else if (diffDays > 30) timeDescription = `${Math.floor(diffDays / 30)}mo ${diffDays % 30}d`
    else timeDescription = `${diffDays}d`

    return {
        priceChange: parseFloat(priceChange.toFixed(2)),
        priceChangePct: parseFloat(priceChangePct.toFixed(2)),
        bars,
        timeDescription,
    }
}

// ─── Colors for quick access ───
export const DRAWING_COLORS = [
    '#2962FF', '#f0b429', '#26a69a', '#ef5350', '#ab47bc',
    '#42a5f5', '#66bb6a', '#ff7043', '#78909c', '#ec407a',
    '#7e57c2', '#26c6da', '#d4e157', '#8d6e63', '#ffffff',
]
