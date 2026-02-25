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

    const btnStyle = (isActive: boolean) => ({
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        color: isActive ? t.accent : t.textDim,
        background: isActive ? `${t.accent}22` : 'transparent',
        transition: 'all .2s',
        marginBottom: '4px'
    })

    const categories = ['line', 'fibonacci', 'shape', 'annotation', 'measure'] as const

    return (
        <div style={{
            width: '40px',
            minWidth: '40px',
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
            {/* Cursor Tool */}
            <div
                onClick={() => onSelectTool(null)}
                style={btnStyle(activeTool === null)}
                title="Crosshair (Cancel Drawing)"
            >
                ➕
            </div>

            <div style={{ width: '24px', height: '1px', background: t.border, margin: '8px 0' }} />

            {/* Drawing Tools by Category */}
            {categories.map(cat => (
                <div key={cat} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
                    {DRAWING_TOOLS.filter(dt => dt.category === cat).map(tool => (
                        <div
                            key={tool.type}
                            onClick={() => onSelectTool(tool.type)}
                            style={btnStyle(activeTool === tool.type)}
                            title={tool.name}
                        >
                            {tool.icon}
                        </div>
                    ))}
                </div>
            ))}

            <div style={{ flex: 1 }} />

            <div style={{ width: '24px', height: '1px', background: t.border, margin: '8px 0' }} />

            {/* Actions */}
            <div onClick={onUndo} style={{ ...btnStyle(false), color: t.textDim }} title="Undo Drawing (Ctrl+Z)">
                ⟲
            </div>
            <div onClick={onClearAll} style={{ ...btnStyle(false), color: t.red }} title="Delete All Drawings">
                🗑
            </div>
        </div>
    )
}
