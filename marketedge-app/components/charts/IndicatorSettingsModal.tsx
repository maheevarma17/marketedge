'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/theme'
import { type ActiveIndicator } from '@/lib/chart-layouts'
import { INDICATOR_LIST } from '@/lib/indicators'

interface IndicatorSettingsModalProps {
    indicator: ActiveIndicator
    onSave: (updatedIndicator: ActiveIndicator) => void
    onClose: () => void
}

export default function IndicatorSettingsModal({ indicator, onSave, onClose }: IndicatorSettingsModalProps) {
    const { t } = useTheme()
    const [tab, setTab] = useState<'inputs' | 'style'>('inputs')

    // Local state for editing
    const [params, setParams] = useState<Record<string, number>>({ ...indicator.params })
    const [color, setColor] = useState(indicator.color)

    const meta = INDICATOR_LIST.find(i => i.id === indicator.id)
    if (!meta) return null

    const mono = { fontFamily: 'JetBrains Mono, monospace' }

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: '8px',
                width: '320px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${t.border}40`, alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: t.text }}>
                        {meta.name} Settings
                    </div>
                    <div onClick={onClose} style={{ cursor: 'pointer', color: t.textDim, fontSize: '16px' }}>✕</div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}40`, padding: '0 16px' }}>
                    <div onClick={() => setTab('inputs')} style={{
                        padding: '12px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        color: tab === 'inputs' ? t.accent : t.textDim,
                        borderBottom: `2px solid ${tab === 'inputs' ? t.accent : 'transparent'}`
                    }}>Inputs</div>
                    <div onClick={() => setTab('style')} style={{
                        padding: '12px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        color: tab === 'style' ? t.accent : t.textDim,
                        borderBottom: `2px solid ${tab === 'style' ? t.accent : 'transparent'}`
                    }}>Style</div>
                </div>

                {/* Body */}
                <div style={{ padding: '16px', minHeight: '160px', maxHeight: '300px', overflowY: 'auto' }}>
                    {tab === 'inputs' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {Object.entries(params).map(([key, val]) => (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: t.text, textTransform: 'capitalize' }}>{key}</span>
                                    <input
                                        type="number"
                                        value={val}
                                        onChange={e => setParams(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                                        style={{
                                            background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '4px',
                                            padding: '4px 8px', color: t.text, width: '80px', ...mono, fontSize: '12px'
                                        }}
                                    />
                                </div>
                            ))}
                            {Object.keys(params).length === 0 && (
                                <div style={{ fontSize: '12px', color: t.textDim, textAlign: 'center', padding: '20px 0' }}>
                                    No configurable inputs for this indicator.
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'style' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: t.text }}>Color</span>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        width: '28px', height: '28px', padding: 0
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}40`, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: `1px solid ${t.border}`, color: t.text,
                        padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 600
                    }}>Cancel</button>
                    <button onClick={() => onSave({ ...indicator, params, color })} style={{
                        background: t.accent, border: 'none', color: '#fff',
                        padding: '6px 16px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 600
                    }}>Ok</button>
                </div>
            </div>
        </div>
    )
}
