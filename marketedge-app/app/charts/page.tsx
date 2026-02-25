'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { searchStocks, type StockSearchResult } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import {
  sma as calcSMA, ema as calcEMA, rsi as calcRSI, macd as calcMACD,
} from '@/lib/backtesting'
import {
  INDICATOR_LIST,
  wma, dema, tema, atr, supertrend, parabolicSar, ichimoku, adx, vwap,
  stochastic, williamsR, cci, roc, mfi,
  bollingerBands, keltnerChannel, donchianChannel,
  obv, accumulationDistribution, cmf,
  awesomeOscillator, trix,
  type OHLCVCandle, type IndicatorMeta,
} from '@/lib/indicators'
import {
  DrawingManager, DRAWING_TOOLS, DEFAULT_STYLES,
  type DrawingToolType, type Drawing, type DrawingPoint,
  calcFibRetracement,
} from '@/lib/drawing-tools'
import {
  LAYOUT_CONFIGS, type LayoutType, type ChartTemplate, type ActiveIndicator,
  LayoutManager, getIndicatorColor,
} from '@/lib/chart-layouts'
import ChartToolbar from '@/components/charts/ChartToolbar'
import ChartDataPanel from '@/components/charts/ChartDataPanel'
import IndicatorSettingsModal from '@/components/charts/IndicatorSettingsModal'
import LeftDrawingToolbar from '@/components/charts/LeftDrawingToolbar'
import RightWatchlistPanel from '@/components/charts/RightWatchlistPanel'
import ReplayToolbar from '@/components/charts/ReplayToolbar'
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  BarSeries,
  AreaSeries,
  BaselineSeries,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts'

const QUICK_SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'SBIN', 'HDFCBANK', 'TATAMOTORS', 'ITC', 'WIPRO', 'ADANIENT', 'BAJFINANCE']

interface CandleData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// ─── Convert array-based candles to Heikin Ashi ───
function toHeikinAshi(candles: CandleData[]): CandleData[] {
  const ha: CandleData[] = []
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]
    const prevHa = i > 0 ? ha[i - 1] : c
    const haClose = (c.open + c.high + c.low + c.close) / 4
    const haOpen = (prevHa.open + prevHa.close) / 2
    const haHigh = Math.max(c.high, haOpen, haClose)
    const haLow = Math.min(c.low, haOpen, haClose)
    ha.push({ date: c.date, open: parseFloat(haOpen.toFixed(2)), high: parseFloat(haHigh.toFixed(2)), low: parseFloat(haLow.toFixed(2)), close: parseFloat(haClose.toFixed(2)), volume: c.volume })
  }
  return ha
}

// ─── Chart Panel Component ───
interface ChartPanelProps {
  panelIndex: number
  symbol: string
  range: string
  interval: string
  chartType: string
  activeIndicators: ActiveIndicator[]
  showVolume: boolean
  isActive: boolean
  onActivate: () => void
  onSymbolChange: (symbol: string) => void
  drawingManager: DrawingManager
  activeDrawingTool: DrawingToolType | null
  onConfigureIndicator: (indicator: ActiveIndicator) => void
  onToggleVisibility: (indicator: ActiveIndicator) => void
  onRemoveIndicator: (indicator: ActiveIndicator) => void
  isReplayMode: boolean
  replayOffset: number
}

function ChartPanel({
  panelIndex, symbol, range, interval, chartType,
  activeIndicators, showVolume, isActive, onActivate,
  onSymbolChange, drawingManager, activeDrawingTool,
  onConfigureIndicator, onToggleVisibility, onRemoveIndicator,
  isReplayMode, replayOffset
}: ChartPanelProps) {
  const { t } = useTheme()
  const [candles, setCandles] = useState<CandleData[]>([])
  const [stockName, setStockName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [crosshairData, setCrosshairData] = useState<CandleData | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const mono = { fontFamily: 'JetBrains Mono, monospace' }

  // Click outside search
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Fetch candle data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const isIntraday = ['1m', '5m', '15m', '30m', '1h'].includes(interval)
      const endpoint = isIntraday
        ? `/api/market/intraday/${encodeURIComponent(symbol)}?interval=${interval}&days=5`
        : `/api/market/history/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
      const res = await fetch(endpoint)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!data.candles || data.candles.length === 0) throw new Error('No data available')
      setCandles(data.candles)
      setStockName(data.name || symbol)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data')
      setCandles([])
    }
    setLoading(false)
  }, [symbol, range, interval])

  useEffect(() => { fetchData() }, [fetchData])

  const visibleCandles = useMemo(() => {
    if (!isReplayMode) return candles
    return candles.slice(0, Math.max(1, candles.length - replayOffset))
  }, [candles, isReplayMode, replayOffset])

  // Build chart
  useEffect(() => {
    if (!chartContainerRef.current || visibleCandles.length === 0) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const container = chartContainerRef.current
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: t.bgCard },
        textColor: t.textDim,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: t.border + '30' },
        horzLines: { color: t.border + '30' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: t.accent + '80', width: 1, style: 3, labelBackgroundColor: t.accent },
        horzLine: { color: t.accent + '80', width: 1, style: 3, labelBackgroundColor: t.accent },
      },
      rightPriceScale: {
        borderColor: t.border,
        scaleMargins: { top: 0.05, bottom: showVolume ? 0.2 : 0.05 },
      },
      timeScale: {
        borderColor: t.border,
        timeVisible: ['1m', '5m', '15m', '30m', '1h'].includes(interval),
        rightOffset: 5,
        barSpacing: visibleCandles.length > 500 ? 3 : visibleCandles.length > 200 ? 5 : 8,
      },
    })
    chartRef.current = chart

    // Prepare chart data based on type
    let displayCandles = visibleCandles
    if (chartType === 'heikinAshi') {
      displayCandles = toHeikinAshi(visibleCandles)
    }

    const chartData = displayCandles.map(c => ({
      time: c.date as string,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    const closes = visibleCandles.map(c => c.close)
    const ohlcvCandles: OHLCVCandle[] = visibleCandles.map(c => ({
      date: c.date,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }))

    // ─── Main price series ───
    if (chartType === 'candle' || chartType === 'heikinAshi') {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: t.green,
        downColor: t.red,
        borderUpColor: t.green,
        borderDownColor: t.red,
        wickUpColor: t.green + 'cc',
        wickDownColor: t.red + 'cc',
      })
      series.setData(chartData)
    } else if (chartType === 'hollowCandle') {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: 'transparent',
        downColor: t.red,
        borderUpColor: t.green,
        borderDownColor: t.red,
        wickUpColor: t.green,
        wickDownColor: t.red,
      })
      series.setData(chartData)
    } else if (chartType === 'bar') {
      const series = chart.addSeries(BarSeries, {
        upColor: t.green,
        downColor: t.red,
      })
      series.setData(chartData)
    } else if (chartType === 'area') {
      const series = chart.addSeries(AreaSeries, {
        lineColor: t.accent,
        topColor: t.accent + '40',
        bottomColor: t.accent + '05',
        lineWidth: 2,
      })
      series.setData(chartData.map(d => ({ time: d.time, value: d.close })))
    } else if (chartType === 'baseline') {
      const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length
      const series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price' as const, price: avgPrice },
        topLineColor: t.green,
        topFillColor1: t.green + '30',
        topFillColor2: t.green + '05',
        bottomLineColor: t.red,
        bottomFillColor1: t.red + '05',
        bottomFillColor2: t.red + '30',
      })
      series.setData(chartData.map(d => ({ time: d.time, value: d.close })))
    } else if (chartType === 'columns') {
      const series = chart.addSeries(HistogramSeries, {})
      series.setData(chartData.map(d => ({
        time: d.time,
        value: d.close,
        color: d.close >= d.open ? t.green + '80' : t.red + '80',
      })))
    } else {
      // Default: line
      const series = chart.addSeries(LineSeries, {
        color: t.accent,
        lineWidth: 2,
      })
      series.setData(chartData.map(d => ({ time: d.time, value: d.close })))
    }

    // ─── Overlay Indicators ───
    for (const ai of activeIndicators) {
      if (!ai.visible) continue
      const meta = INDICATOR_LIST.find(m => m.id === ai.id)
      if (!meta || !meta.overlay) continue

      try {
        switch (ai.id) {
          case 'sma': {
            const vals = calcSMA(closes, ai.params.period || 20)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: `SMA ${ai.params.period}` }).setData(lineData)
            break
          }
          case 'ema': {
            const vals = calcEMA(closes, ai.params.period || 9)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: `EMA ${ai.params.period}` }).setData(lineData)
            break
          }
          case 'wma': {
            const vals = wma(closes, ai.params.period || 20)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: `WMA ${ai.params.period}` }).setData(lineData)
            break
          }
          case 'dema': {
            const vals = dema(closes, ai.params.period || 20)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: `DEMA ${ai.params.period}` }).setData(lineData)
            break
          }
          case 'tema': {
            const vals = tema(closes, ai.params.period || 20)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: `TEMA ${ai.params.period}` }).setData(lineData)
            break
          }
          case 'supertrend': {
            const result = supertrend(ohlcvCandles, ai.params.period || 10, ai.params.multiplier || 3)
            const stData = candles.map((c, i) => ({
              time: c.date as string,
              value: result.supertrend[i] as number,
              color: result.direction[i] === 1 ? t.green : t.red,
            })).filter(d => d.value !== null && d.value !== undefined)
            // Render as two separate line series for color
            const bullish = stData.filter(d => d.color === t.green).map(d => ({ time: d.time, value: d.value }))
            const bearish = stData.filter(d => d.color === t.red).map(d => ({ time: d.time, value: d.value }))
            if (bullish.length > 0) chart.addSeries(LineSeries, { color: t.green, lineWidth: 2, title: 'ST ↑' }).setData(bullish)
            if (bearish.length > 0) chart.addSeries(LineSeries, { color: t.red, lineWidth: 2, title: 'ST ↓' }).setData(bearish)
            break
          }
          case 'parabolicSar': {
            const result = parabolicSar(ohlcvCandles, ai.params.step || 0.02, ai.params.max || 0.2)
            const sarData = candles.map((c, i) => ({
              time: c.date as string,
              value: result.sar[i] as number,
              color: result.direction[i] === 1 ? t.green : t.red,
            })).filter(d => d.value !== null)
            // Use a single line with dots effect
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, lineStyle: 1, title: 'PSAR', crosshairMarkerVisible: false }).setData(sarData.map(d => ({ time: d.time, value: d.value })))
            break
          }
          case 'ichimoku': {
            const result = ichimoku(ohlcvCandles, ai.params.tenkan || 9, ai.params.kijun || 26, ai.params.senkou || 52)
            const tenkan = candles.map((c, i) => ({ time: c.date as string, value: result.tenkanSen[i] as number })).filter(d => d.value !== null)
            const kijun = candles.map((c, i) => ({ time: c.date as string, value: result.kijunSen[i] as number })).filter(d => d.value !== null)
            const senkouA = candles.map((c, i) => ({ time: c.date as string, value: result.senkouA[i] as number })).filter(d => d.value !== null)
            const senkouB = candles.map((c, i) => ({ time: c.date as string, value: result.senkouB[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 1, title: 'Tenkan' }).setData(tenkan)
            chart.addSeries(LineSeries, { color: '#ef5350', lineWidth: 1, title: 'Kijun' }).setData(kijun)
            chart.addSeries(LineSeries, { color: '#26a69a', lineWidth: 1, title: 'Senkou A' }).setData(senkouA)
            chart.addSeries(LineSeries, { color: '#ab47bc', lineWidth: 1, title: 'Senkou B' }).setData(senkouB)
            break
          }
          case 'vwap': {
            const vals = vwap(ohlcvCandles)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 2, title: 'VWAP' }).setData(lineData)
            break
          }
          case 'bollingerBands': {
            const result = bollingerBands(closes, ai.params.period || 20, ai.params.stdDev || 2)
            const upper = candles.map((c, i) => ({ time: c.date as string, value: result.upper[i] as number })).filter(d => d.value !== null)
            const mid = candles.map((c, i) => ({ time: c.date as string, value: result.middle[i] as number })).filter(d => d.value !== null)
            const lower = candles.map((c, i) => ({ time: c.date as string, value: result.lower[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: '#8892a4', lineWidth: 1, lineStyle: 2, title: 'BB U' }).setData(upper)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: 'BB M' }).setData(mid)
            chart.addSeries(LineSeries, { color: '#8892a4', lineWidth: 1, lineStyle: 2, title: 'BB L' }).setData(lower)
            break
          }
          case 'keltnerChannel': {
            const result = keltnerChannel(ohlcvCandles, ai.params.period || 20, ai.params.multiplier || 1.5)
            const upper = candles.map((c, i) => ({ time: c.date as string, value: result.upper[i] as number })).filter(d => d.value !== null)
            const mid = candles.map((c, i) => ({ time: c.date as string, value: result.middle[i] as number })).filter(d => d.value !== null)
            const lower = candles.map((c, i) => ({ time: c.date as string, value: result.lower[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: '#ce93d8', lineWidth: 1, lineStyle: 2, title: 'KC U' }).setData(upper)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: 'KC M' }).setData(mid)
            chart.addSeries(LineSeries, { color: '#ce93d8', lineWidth: 1, lineStyle: 2, title: 'KC L' }).setData(lower)
            break
          }
          case 'donchianChannel': {
            const result = donchianChannel(ohlcvCandles, ai.params.period || 20)
            const upper = candles.map((c, i) => ({ time: c.date as string, value: result.upper[i] as number })).filter(d => d.value !== null)
            const mid = candles.map((c, i) => ({ time: c.date as string, value: result.middle[i] as number })).filter(d => d.value !== null)
            const lower = candles.map((c, i) => ({ time: c.date as string, value: result.lower[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: '#4dd0e1', lineWidth: 1, lineStyle: 2, title: 'DC U' }).setData(upper)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: 'DC M' }).setData(mid)
            chart.addSeries(LineSeries, { color: '#4dd0e1', lineWidth: 1, lineStyle: 2, title: 'DC L' }).setData(lower)
            break
          }
        }
      } catch (e) {
        console.warn(`Indicator ${ai.id} error:`, e)
      }
    }

    // ─── Sub-pane indicators (rendered as separate pane within same chart) ───
    for (const ai of activeIndicators) {
      if (!ai.visible) continue
      const meta = INDICATOR_LIST.find(m => m.id === ai.id)
      if (!meta || meta.overlay) continue

      try {
        const paneId = `pane_${ai.id}`
        switch (ai.id) {
          case 'rsi': {
            const vals = calcRSI(closes, ai.params.period || 14)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            const series = chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: `RSI ${ai.params.period || 14}`, priceScaleId: paneId })
            series.setData(lineData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
            break
          }
          case 'macd': {
            const result = calcMACD(closes)
            const macdData = candles.map((c, i) => ({ time: c.date as string, value: result.macd[i] as number })).filter(d => d.value !== null)
            const signalData = candles.map((c, i) => ({ time: c.date as string, value: result.signal[i] as number })).filter(d => d.value !== null)
            const histData = candles.map((c, i) => ({ time: c.date as string, value: result.histogram[i] as number, color: (result.histogram[i] || 0) >= 0 ? t.green + '80' : t.red + '80' })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 1, title: 'MACD', priceScaleId: paneId }).setData(macdData)
            chart.addSeries(LineSeries, { color: '#ff7043', lineWidth: 1, title: 'Signal', priceScaleId: paneId }).setData(signalData)
            chart.addSeries(HistogramSeries, { priceScaleId: paneId }).setData(histData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
            break
          }
          case 'stochastic': {
            const result = stochastic(ohlcvCandles, ai.params.kPeriod || 14, ai.params.dPeriod || 3)
            const kData = candles.map((c, i) => ({ time: c.date as string, value: result.k[i] as number })).filter(d => d.value !== null)
            const dData = candles.map((c, i) => ({ time: c.date as string, value: result.d[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 1, title: '%K', priceScaleId: paneId }).setData(kData)
            chart.addSeries(LineSeries, { color: '#ff7043', lineWidth: 1, title: '%D', priceScaleId: paneId }).setData(dData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
            break
          }
          case 'williamsR': {
            const vals = williamsR(ohlcvCandles, ai.params.period || 14)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: '%R', priceScaleId: paneId }).setData(lineData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
            break
          }
          case 'cci': {
            const vals = cci(ohlcvCandles, ai.params.period || 20)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: 'CCI', priceScaleId: paneId }).setData(lineData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
            break
          }
          case 'roc': {
            const vals = roc(closes, ai.params.period || 12)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: 'ROC', priceScaleId: paneId }).setData(lineData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
            break
          }
          case 'mfi': {
            const vals = mfi(ohlcvCandles, ai.params.period || 14)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: 'MFI', priceScaleId: paneId }).setData(lineData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
            break
          }
          case 'atr': {
            const vals = atr(ohlcvCandles, ai.params.period || 14)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: 'ATR', priceScaleId: paneId }).setData(lineData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
            break
          }
          case 'adx': {
            const result = adx(ohlcvCandles, ai.params.period || 14)
            const adxData = candles.map((c, i) => ({ time: c.date as string, value: result.adx[i] as number })).filter(d => d.value !== null)
            const pdiData = candles.map((c, i) => ({ time: c.date as string, value: result.plusDI[i] as number })).filter(d => d.value !== null)
            const mdiData = candles.map((c, i) => ({ time: c.date as string, value: result.minusDI[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 2, title: 'ADX', priceScaleId: paneId }).setData(adxData)
            chart.addSeries(LineSeries, { color: t.green, lineWidth: 1, title: '+DI', priceScaleId: paneId }).setData(pdiData)
            chart.addSeries(LineSeries, { color: t.red, lineWidth: 1, title: '-DI', priceScaleId: paneId }).setData(mdiData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
            break
          }
          case 'obv': {
            const vals = obv(ohlcvCandles)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] }))
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: 'OBV', priceScaleId: paneId }).setData(lineData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
            break
          }
          case 'ad': {
            const vals = accumulationDistribution(ohlcvCandles)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] }))
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: 'A/D', priceScaleId: paneId }).setData(lineData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
            break
          }
          case 'cmf': {
            const vals = cmf(ohlcvCandles, ai.params.period || 20)
            const lineData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(HistogramSeries, { priceScaleId: paneId }).setData(lineData.map(d => ({ ...d, color: d.value >= 0 ? t.green + '80' : t.red + '80' })))
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
            break
          }
          case 'ao': {
            const vals = awesomeOscillator(ohlcvCandles, ai.params.fast || 5, ai.params.slow || 34)
            const histData = candles.map((c, i) => ({ time: c.date as string, value: vals[i] as number, color: (vals[i] || 0) >= 0 ? t.green + '80' : t.red + '80' })).filter(d => d.value !== null)
            chart.addSeries(HistogramSeries, { priceScaleId: paneId, title: 'AO' }).setData(histData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
            break
          }
          case 'trix': {
            const vals = trix(closes, ai.params.period || 15)
            const lineData = visibleCandles.map((c, i) => ({ time: c.date as string, value: vals[i] as number })).filter(d => d.value !== null)
            chart.addSeries(LineSeries, { color: ai.color, lineWidth: 1, title: 'TRIX', priceScaleId: paneId }).setData(lineData)
            chart.priceScale(paneId).applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
            break
          }
        }
      } catch (e) {
        console.warn(`Indicator ${ai.id} error:`, e)
      }
    }

    // ─── Volume ───
    if (showVolume) {
      const volSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
      })
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
      volSeries.setData(visibleCandles.map(c => ({
        time: c.date as string,
        value: c.volume,
        color: c.close >= c.open ? t.green + '30' : t.red + '30',
      })))
    }

    chart.timeScale().fitContent()

    // ─── Crosshair handler ───
    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setCrosshairData(null)
        return
      }
      const idx = visibleCandles.findIndex(c => c.date === param.time)
      if (idx >= 0) setCrosshairData(visibleCandles[idx])
    })

    // ─── Resize ───
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
    }
  }, [visibleCandles, chartType, activeIndicators, showVolume, t, interval])

  // Search
  async function handleSearch(q: string) {
    setSearch(q)
    if (q.length >= 1) {
      const r = await searchStocks(q)
      setSearchResults(r)
      setShowSearch(true)
    } else { setSearchResults([]); setShowSearch(false) }
  }

  const lastCandle = visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1] : null
  const displayCandle = crosshairData || lastCandle
  const prevCandle = visibleCandles.length > 1 ? visibleCandles[visibleCandles.length - 2] : null
  const priceChange = lastCandle && prevCandle ? lastCandle.close - prevCandle.close : 0
  const priceChangePct = prevCandle ? (priceChange / prevCandle.close) * 100 : 0

  return (
    <div
      onClick={onActivate}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${isActive ? t.accent : t.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '300px',
        transition: 'border-color .2s',
      }}
    >
      {/* ─── Panel Header: Search + Symbol + Price ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: t.bgCard, borderBottom: `1px solid ${t.border}40` }}>

        {/* Search Box */}
        <div style={{ position: 'relative', minWidth: '220px', flexShrink: 0 }} ref={searchRef}>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value.toUpperCase())}
            onFocus={() => search.length >= 1 && setShowSearch(true)}
            placeholder={`🔍 Search symbol...`}
            style={{
              width: '100%',
              background: t.bgInput,
              border: `1px solid ${t.border}`,
              borderRadius: '6px',
              padding: '6px 12px',
              color: t.text,
              fontSize: '12px',
              ...mono,
              outline: 'none',
            }}
          />
          {showSearch && searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 2px)', left: 0,
              zIndex: 999,
              background: t.bgCard,
              border: `1px solid ${t.accent}`,
              borderRadius: '8px',
              maxHeight: '320px',
              overflowY: 'auto',
              boxShadow: '0 12px 40px rgba(0,0,0,.7)',
              minWidth: '320px',
              width: 'max-content',
            }}>
              {searchResults.map((s, idx) => (
                <div
                  key={s.symbol}
                  onClick={() => { onSymbolChange(s.symbol); setSearch(''); setShowSearch(false) }}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: idx < searchResults.length - 1 ? `1px solid ${t.border}25` : 'none',
                    display: 'flex', flexDirection: 'column', gap: '3px',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${t.accent}15`)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 800, color: t.text, fontSize: '13px', letterSpacing: '0.5px', ...mono }}>{s.symbol}</span>
                    {s.exchange && <span style={{ fontSize: '9px', fontWeight: 600, color: t.textMuted, background: t.bgInput, padding: '2px 6px', borderRadius: '4px' }}>{s.exchange}</span>}
                  </div>
                  <span style={{ color: t.textDim, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Symbol Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 800, fontSize: '14px', color: t.accent, ...mono }}>{symbol}</span>
          <span style={{ fontSize: '10px', color: t.textDim, maxWidth: '120px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{stockName}</span>
        </div>

        {/* Quick Symbols */}
        <div style={{ display: 'flex', gap: '3px', marginLeft: '4px' }}>
          {QUICK_SYMBOLS.slice(0, 6).map(s => (
            <div key={s} onClick={() => onSymbolChange(s)} style={{
              padding: '3px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700,
              cursor: 'pointer', ...mono, transition: 'all .15s',
              background: symbol === s ? t.accent : `${t.border}30`,
              color: symbol === s ? '#fff' : t.textDim,
            }}>{s}</div>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Price */}
        {lastCandle && (
          <div style={{ textAlign: 'right', ...mono, flexShrink: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: t.text }}>₹{lastCandle.close.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: priceChange >= 0 ? t.green : t.red, marginLeft: '8px' }}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, position: 'relative', background: t.bgCard }}>
        {/* Data panel — overlays on chart canvas, NOT the search header */}
        <ChartDataPanel
          symbol={symbol}
          stockName={stockName}
          ohlcv={displayCandle}
          priceChange={priceChange}
          priceChangePct={priceChangePct}
          indicatorValues={activeIndicators.map(ai => {
            const meta = INDICATOR_LIST.find(m => m.id === ai.id)
            return { name: meta?.shortName || ai.id, value: '—', color: ai.color, indicator: ai }
          })}
          onConfigureIndicator={onConfigureIndicator}
          onToggleVisibility={onToggleVisibility}
          onRemoveIndicator={onRemoveIndicator}
        />
        {loading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, fontSize: '12px', zIndex: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px', animation: 'meChartPulse 1.5s infinite' }}>📈</div>
              Loading {symbol}...
            </div>
          </div>
        ) : error ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ textAlign: 'center', color: t.red }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{error}</div>
              <button onClick={fetchData} style={{ marginTop: '8px', padding: '6px 14px', background: t.accent, border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>Retry</button>
            </div>
          </div>
        ) : null}
        <div ref={chartContainerRef} className="me-chart" style={{ width: '100%', height: '100%' }} />
        <canvas ref={drawingCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: activeDrawingTool ? 'auto' : 'none', zIndex: activeDrawingTool ? 5 : -1 }} />
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════
// MAIN CHARTS PAGE
// ═══════════════════════════════════════════════════

export default function ChartsPage() {
  const { t } = useTheme()
  const searchParams = useSearchParams()
  const urlSymbol = searchParams.get('symbol')

  // ─── State ───
  const [layoutType, setLayoutType] = useState<LayoutType>('1x1')
  const [panelSymbols, setPanelSymbols] = useState<string[]>([urlSymbol || 'RELIANCE'])
  const [activePanel, setActivePanel] = useState(0)
  const [range, setRange] = useState('1y')
  const [interval, setInterval] = useState('1d')
  const [chartType, setChartType] = useState('candle')
  const [showVolume, setShowVolume] = useState(true)
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicator[]>([
    { id: 'sma', params: { period: 20 }, color: '#f0b429', visible: true },
  ])
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType | null>(null)
  const [configuringIndicator, setConfiguringIndicator] = useState<ActiveIndicator | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [drawingManager] = useState(() => new DrawingManager('main'))
  const containerRef = useRef<HTMLDivElement>(null)

  // Replay State
  const [isReplayMode, setIsReplayMode] = useState(false)
  const [replayOffset, setReplayOffset] = useState(50)
  const [isReplaying, setIsReplaying] = useState(false)
  const [replaySpeed, setReplaySpeed] = useState(1000)

  useEffect(() => {
    if (!isReplaying) return
    const id = window.setInterval(() => {
      setReplayOffset(prev => {
        if (prev <= 0) {
          setIsReplaying(false)
          return 0
        }
        return prev - 1
      })
    }, replaySpeed)
    return () => window.clearInterval(id)
  }, [isReplaying, replaySpeed])

  // Layout config
  const layoutConfig = LAYOUT_CONFIGS[layoutType]
  const numPanels = layoutConfig.rows * layoutConfig.cols

  // Ensure panels array matches layout
  useEffect(() => {
    const defaultSymbols = ['RELIANCE', 'TCS', 'INFY', 'SBIN', 'HDFCBANK', 'TATAMOTORS', 'ITC', 'WIPRO']
    if (panelSymbols.length < numPanels) {
      const newSymbols = [...panelSymbols]
      while (newSymbols.length < numPanels) {
        newSymbols.push(defaultSymbols[newSymbols.length % defaultSymbols.length])
      }
      setPanelSymbols(newSymbols)
    }
  }, [numPanels, panelSymbols])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); drawingManager.undoLast() }
      if (e.key === 'Delete') { e.preventDefault(); drawingManager.undoLast() }
      if (e.key === 'Escape') {
        if (isFullscreen) { setIsFullscreen(false) }
        else { setActiveDrawingTool(null) }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [drawingManager, isFullscreen])

  // Toggle indicator (Add new one via toolbar)
  function handleToggleIndicator(indicator: IndicatorMeta, params?: Record<string, number>) {
    setActiveIndicators(prev => {
      const existingIdx = prev.findIndex(ai => ai.id === indicator.id)
      if (existingIdx >= 0) {
        return prev.filter((_, i) => i !== existingIdx)
      }
      return [...prev, {
        id: indicator.id,
        params: params || indicator.defaultParams,
        color: getIndicatorColor(prev.length),
        visible: true,
      }]
    })
  }

  // Edit indicator functions
  function handleConfigureIndicator(indicator: ActiveIndicator) {
    setConfiguringIndicator(indicator)
  }

  function handleSaveIndicatorSettings(updated: ActiveIndicator) {
    setActiveIndicators(prev => prev.map(ai => ai.id === updated.id ? updated : ai))
    setConfiguringIndicator(null)
  }

  function handleToggleVisibility(indicator: ActiveIndicator) {
    setActiveIndicators(prev => prev.map(ai => ai.id === indicator.id ? { ...ai, visible: !ai.visible } : ai))
  }

  function handleRemoveIndicator(indicator: ActiveIndicator) {
    setActiveIndicators(prev => prev.filter(ai => ai.id !== indicator.id))
  }

  // Apply template
  function handleApplyTemplate(template: ChartTemplate) {
    setActiveIndicators(template.indicators)
    setChartType(template.chartType)
    setShowVolume(template.showVolume)
  }

  // Update symbol for a panel
  function handlePanelSymbolChange(panelIdx: number, symbol: string) {
    setPanelSymbols(prev => {
      const updated = [...prev]
      updated[panelIdx] = symbol
      return updated
    })
  }

  // Screenshot
  function handleScreenshot() {
    if (containerRef.current) {
      const charts = containerRef.current.querySelectorAll('.me-chart canvas')
      if (charts.length > 0) {
        const canvas = charts[0] as HTMLCanvasElement
        const link = document.createElement('a')
        link.download = `MarketEdge_Chart_${panelSymbols[0]}_${new Date().toISOString().split('T')[0]}.png`
        link.href = canvas.toDataURL()
        link.click()
      }
    }
  }

  // Fullscreen (CSS-based to prevent canvas event swallowing)
  function handleFullscreen() {
    setIsFullscreen(!isFullscreen)
  }

  const fullscreenStyles: React.CSSProperties = isFullscreen ? {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    background: t.bg,
    padding: '8px 12px',
    display: 'flex', flexDirection: 'column'
  } : {
    padding: '8px 12px', height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', background: t.bg
  }

  return (
    <div ref={containerRef} style={fullscreenStyles}>

      {/* Professional Toolbar */}
      <ChartToolbar
        chartType={chartType}
        onChartTypeChange={setChartType}
        layoutType={layoutType}
        onLayoutChange={setLayoutType}
        range={range}
        onRangeChange={setRange}
        interval={interval}
        onIntervalChange={setInterval}
        activeDrawingTool={activeDrawingTool}
        onDrawingToolSelect={setActiveDrawingTool}
        onClearDrawings={() => drawingManager.clearAll()}
        onUndoDrawing={() => drawingManager.undoLast()}
        onToggleIndicator={handleToggleIndicator}
        activeIndicatorIds={activeIndicators.filter(ai => ai.visible).map(ai => ai.id)}
        onApplyTemplate={handleApplyTemplate}
        onScreenshot={handleScreenshot}
        onFullscreen={handleFullscreen}
        isFullscreen={isFullscreen}
        isReplayMode={isReplayMode}
        onToggleReplay={() => setIsReplayMode(!isReplayMode)}
      />

      {/* 3-Pane Layout */}
      <div style={{ flex: 1, display: 'flex', marginTop: '4px', overflow: 'hidden' }}>

        {/* Left Drawing Toolbar — hidden in fullscreen */}
        {!isFullscreen && (
          <LeftDrawingToolbar
            activeTool={activeDrawingTool}
            onSelectTool={setActiveDrawingTool}
            onUndo={() => drawingManager.undoLast()}
            onClearAll={() => drawingManager.clearAll()}
          />
        )}

        {/* Center Chart Grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${layoutConfig.cols}, 1fr)`,
          gridTemplateRows: `repeat(${layoutConfig.rows}, 1fr)`,
          gap: '4px',
          padding: '0 4px',
        }}>
          {Array.from({ length: numPanels }).map((_, i) => (
            <ChartPanel
              key={`panel-${i}-${panelSymbols[i] || 'RELIANCE'}-${layoutType}`}
              panelIndex={i}
              symbol={panelSymbols[i] || 'RELIANCE'}
              range={range}
              interval={interval}
              chartType={chartType}
              activeIndicators={activeIndicators}
              showVolume={showVolume}
              isActive={activePanel === i}
              onActivate={() => setActivePanel(i)}
              onSymbolChange={(sym) => handlePanelSymbolChange(i, sym)}
              drawingManager={drawingManager}
              activeDrawingTool={activeDrawingTool}
              onConfigureIndicator={handleConfigureIndicator}
              onToggleVisibility={handleToggleVisibility}
              onRemoveIndicator={handleRemoveIndicator}
              isReplayMode={isReplayMode}
              replayOffset={replayOffset}
            />
          ))}
        </div>

        {/* Right Watchlist Panel — hidden in fullscreen */}
        {!isFullscreen && (
          <RightWatchlistPanel
            currentSymbol={panelSymbols[activePanel] || 'RELIANCE'}
            onSymbolSelect={(sym) => handlePanelSymbolChange(activePanel, sym)}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: t.textDim, padding: '4px 4px 0', fontFamily: 'JetBrains Mono, monospace' }}>
        <span>Market<span style={{ color: t.accent }}>Edge</span> Pro Charts · {activeIndicators.length} indicators · {layoutConfig.label} layout · Keyboard: Ctrl+Z undo · Esc cancel · Del remove</span>
        <span>Data: Yahoo Finance · 100% Free & Open Source · No limits</span>
      </div>

      {/* Indicator Settings Modal */}
      {configuringIndicator && (
        <IndicatorSettingsModal
          indicator={configuringIndicator}
          onSave={handleSaveIndicatorSettings}
          onClose={() => setConfiguringIndicator(null)}
        />
      )}

      {/* Replay Toolbar */}
      {isReplayMode && (
        <ReplayToolbar
          isPlaying={isReplaying}
          speed={replaySpeed}
          onPlayPause={() => setIsReplaying(!isReplaying)}
          onStepForward={() => setReplayOffset(prev => Math.max(0, prev - 1))}
          onSpeedChange={setReplaySpeed}
          onClose={() => {
            setIsReplaying(false)
            setIsReplayMode(false)
            setReplayOffset(50)
          }}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes meChartPulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .me-chart a[href*="tradingview"] { display: none !important; }
        .me-chart a[target="_blank"] { display: none !important; }
        .me-chart div[style*="bottom"] > a { display: none !important; }
      `}} />
    </div>
  )
}