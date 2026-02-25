import { useTheme } from '@/lib/theme'
import { DRAWING_TOOLS, type DrawingToolType } from '@/lib/drawing-tools'

interface LeftDrawingToolbarProps {
    activeTool: DrawingToolType | null
    onSelectTool: (tool: DrawingToolType | null) => void
    onUndo: () => void
    onClearAll: () => void
}

export default function LeftDrawingToolbar({ activeTool, onSelectTool, onUndo, onClearAll }: LeftDrawingToolbarProps) {
    const { t } = useTheme()

    const categories = ['line', 'fibonacci', 'shape', 'annotation', 'measure'] as const
    const categoryLabels: Record<string, string> = {
        line: 'Lines',
        fibonacci: 'Fib',
        shape: 'Shapes',
        annotation: 'Notes',
        measure: 'Measure'
    }

    return (
        <div style={{
            width: '42px',
            minWidth: '42px',
            height: '100%',
            background: t.bgCard,
            borderRight: `1px solid ${t.border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 4px',
            overflowY: 'auto',
            borderBottomLeftRadius: '8px'
        }}>
            {/* Cursor / Crosshair Tool */}
            <ToolButton
                icon="✛"
                label="Crosshair"
                isActive={activeTool === null}
                onClick={() => onSelectTool(null)}
                accentColor={t.accent}
                textDim={t.textDim}
                border={t.border}
            />

            <div style={{ width: '26px', height: '1px', background: t.border, margin: '6px 0' }} />

            {/* Drawing Tools by Category */}
            {categories.map(cat => {
                const tools = DRAWING_TOOLS.filter(dt => dt.category === cat)
                if (tools.length === 0) return null
                return (
                    <div key={cat} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4px' }}>
                        {/* Category Label */}
                        <div style={{ fontSize: '7px', color: t.textMuted, fontWeight: 600, letterSpacing: '0.05em', marginBottom: '2px', textTransform: 'uppercase' }}>
                            {categoryLabels[cat]}
                        </div>
                        {tools.map(tool => (
                            <ToolButton
                                key={tool.type}
                                icon={tool.icon}
                                label={tool.name}
                                isActive={activeTool === tool.type}
                                onClick={() => onSelectTool(tool.type)}
                                accentColor={t.accent}
                                textDim={t.textDim}
                                border={t.border}
                            />
                        ))}
                    </div>
                )
            })}

            <div style={{ flex: 1 }} />

            <div style={{ width: '26px', height: '1px', background: t.border, margin: '6px 0' }} />

            {/* Actions */}
            <ToolButton icon="⟲" label="Undo (Ctrl+Z)" isActive={false} onClick={onUndo} accentColor={t.accent} textDim={t.textDim} border={t.border} />
            <ToolButton icon="🗑" label="Clear All" isActive={false} onClick={onClearAll} accentColor={t.red} textDim={t.red} border={t.border} isDestructive />
        </div>
    )
}

// ─── Tool Button with tooltip + hover ───
function ToolButton({ icon, label, isActive, onClick, accentColor, textDim, border, isDestructive }: {
    icon: string; label: string; isActive: boolean; onClick: () => void
    accentColor: string; textDim: string; border: string; isDestructive?: boolean
}) {
    return (
        <div
            onClick={onClick}
            title={label}
            style={{
                width: '34px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '15px',
                color: isActive ? accentColor : (isDestructive ? textDim : textDim),
                background: isActive ? `${accentColor}20` : 'transparent',
                border: isActive ? `1px solid ${accentColor}40` : '1px solid transparent',
                transition: 'all .15s',
                marginBottom: '2px',
                position: 'relative',
            }}
            onMouseEnter={e => {
                if (!isActive) {
                    e.currentTarget.style.background = `${border}50`
                    e.currentTarget.style.color = accentColor
                }
            }}
            onMouseLeave={e => {
                if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = textDim
                }
            }}
        >
            {icon}
        </div>
    )
}
