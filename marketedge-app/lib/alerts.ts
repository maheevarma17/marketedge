// ──────────────────────────────────────────────
// Price Alerts Engine — localStorage based
// ──────────────────────────────────────────────

export type AlertCondition = 'above' | 'below' | 'crosses_above' | 'crosses_below'
export type AlertStatus = 'active' | 'triggered' | 'expired'

export interface PriceAlert {
    id: string
    symbol: string
    condition: AlertCondition
    targetPrice: number
    currentPrice: number
    status: AlertStatus
    createdAt: string
    triggeredAt: string | null
    note: string
}

const STORAGE_KEY = 'marketedge_alerts'

function generateId(): string {
    return 'alert_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ── CRUD ──

export function getAlerts(): PriceAlert[] {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
}

function saveAlerts(alerts: PriceAlert[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
}

export function createAlert(
    symbol: string,
    condition: AlertCondition,
    targetPrice: number,
    note: string = ''
): PriceAlert {
    const alert: PriceAlert = {
        id: generateId(),
        symbol: symbol.toUpperCase(),
        condition,
        targetPrice,
        currentPrice: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        triggeredAt: null,
        note,
    }

    const alerts = getAlerts()
    alerts.unshift(alert)
    saveAlerts(alerts)
    return alert
}

export function deleteAlert(id: string): void {
    const alerts = getAlerts().filter(a => a.id !== id)
    saveAlerts(alerts)
}

export function clearTriggered(): void {
    const alerts = getAlerts().filter(a => a.status !== 'triggered')
    saveAlerts(alerts)
}

// ── Check alerts against live price ──

export function checkAlert(alert: PriceAlert, livePrice: number): boolean {
    if (alert.status !== 'active') return false

    switch (alert.condition) {
        case 'above':
            return livePrice >= alert.targetPrice
        case 'below':
            return livePrice <= alert.targetPrice
        case 'crosses_above':
            return alert.currentPrice < alert.targetPrice && livePrice >= alert.targetPrice
        case 'crosses_below':
            return alert.currentPrice > alert.targetPrice && livePrice <= alert.targetPrice
        default:
            return false
    }
}

export function triggerAlert(id: string, currentPrice: number): PriceAlert | null {
    const alerts = getAlerts()
    const alert = alerts.find(a => a.id === id)
    if (!alert) return null

    alert.status = 'triggered'
    alert.currentPrice = currentPrice
    alert.triggeredAt = new Date().toISOString()
    saveAlerts(alerts)
    return alert
}

export function updateAlertPrice(id: string, price: number): void {
    const alerts = getAlerts()
    const alert = alerts.find(a => a.id === id)
    if (alert) {
        alert.currentPrice = price
        saveAlerts(alerts)
    }
}

// ── Stats ──

export function getAlertStats() {
    const alerts = getAlerts()
    return {
        total: alerts.length,
        active: alerts.filter(a => a.status === 'active').length,
        triggered: alerts.filter(a => a.status === 'triggered').length,
    }
}

// ── Condition labels ──

export const CONDITION_LABELS: Record<AlertCondition, string> = {
    above: 'Price goes above',
    below: 'Price goes below',
    crosses_above: 'Price crosses above',
    crosses_below: 'Price crosses below',
}
