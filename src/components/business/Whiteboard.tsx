import { useCallback, useRef, useEffect } from 'react'
import { Tldraw, Editor, type TLUiOverrides } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { BudgetBlockUtil } from '../../lib/whiteboard/BudgetBlock'
import { BudgetBlockTool } from '../../lib/whiteboard/BudgetBlockTool'
import { BudgetStylePanel } from './BudgetStylePanel'
import { BudgetContextMenu } from './BudgetContextMenu'

type BudgetMode = 'select' | 'budget-block'

interface WhiteboardProps {
  budgetMode: BudgetMode
  onModeChange: (mode: BudgetMode) => void
}

const PERSISTENCE_KEY = 'shape-of-money-whiteboard'

// Tools array for tldraw
const customTools = [BudgetBlockTool]

// UI overrides to add BudgetBlock tool to toolbar
const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    tools['budget-block'] = {
      id: 'budget-block',
      icon: 'geo-rectangle',
      label: 'Budget Block',
      kbd: 'b',
      onSelect: () => {
        editor.setCurrentTool('budget-block')
      },
    }
    return tools
  },
}

export function Whiteboard({ budgetMode }: WhiteboardProps) {
  const editorRef = useRef<Editor | null>(null)

  // Handle external mode changes from header buttons
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    if (budgetMode === 'budget-block') {
      editor.setCurrentTool('budget-block')
    } else if (budgetMode === 'select') {
      editor.setCurrentTool('select')
    }
  }, [budgetMode])

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor
  }, [])

  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full pt-20">
        <Tldraw
          persistenceKey={PERSISTENCE_KEY}
          onMount={handleMount}
          shapeUtils={[BudgetBlockUtil]}
          tools={customTools}
          overrides={uiOverrides}
          components={{
            StylePanel: BudgetStylePanel,
            ContextMenu: BudgetContextMenu,
          }}
        />
      </div>
    </div>
  )
}
