import { useTheme } from '@/lib/theme'

interface ReplayToolbarProps {
    isPlaying: boolean
    speed: number // ms per candle
    onPlayPause: () => void
    onStepForward: () => void
    onSpeedChange: (speed: number) => void
    onClose: () => void
}

export default function ReplayToolbar({ isPlaying, speed, onPlayPause, onStepForward, onSpeedChange, onClose }: ReplayToolbarProps) {
    const { t } = useTheme()

    const btnStyle = {
        background: 'transparent',
        border: 'none',
        color: t.text,
        cursor: 'pointer',
        fontSize: '14px',
        padding: '6px 10px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background .2s'
    }

    const speeds = [
        { label: '0.1s', value: 100 },
        { label: '0.5s', value: 500 },
        { label: '1s', value: 1000 },
        { label: '3s', value: 3000 },
    ]

    return (
        <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: t.bgCard,
            border: `1px solid ${t.accent}`,
            borderRadius: '8px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 1000,
            fontFamily: 'JetBrains Mono, monospace'
        }}>
            {/* Play/Pause */}
            <button
                onClick={onPlayPause}
                style={{ ...btnStyle, color: isPlaying ? t.red : t.green, width: '40px' }}
                title={isPlaying ? "Pause" : "Play"}
                onMouseEnter={e => e.currentTarget.style.background = t.border}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Step Forward */}
            <button
                onClick={onStepForward}
                disabled={isPlaying}
                style={{ ...btnStyle, opacity: isPlaying ? 0.3 : 1, width: '40px' }}
                title="Step Forward"
                onMouseEnter={e => !isPlaying && (e.currentTarget.style.background = t.border)}
                onMouseLeave={e => !isPlaying && (e.currentTarget.style.background = 'transparent')}
            >
                ⏭
            </button>

            <div style={{ width: '1px', height: '20px', background: t.border, margin: '0 4px' }} />

            {/* Speed Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: t.textDim }}>
                <span>Speed: </span>
                <select
                    value={speed}
                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                    style={{
                        background: t.bgInput,
                        border: `1px solid ${t.border}`,
                        color: t.text,
                        borderRadius: '4px',
                        padding: '2px 4px',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {speeds.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>

            <div style={{ width: '1px', height: '20px', background: t.border, margin: '0 4px' }} />

            {/* Close */}
            <button
                onClick={onClose}
                style={{ ...btnStyle, color: t.textDim, fontSize: '12px' }}
                title="Exit Replay Mode"
                onMouseEnter={e => e.currentTarget.style.background = t.border}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                ✖
            </button>
        </div>
    )
}
