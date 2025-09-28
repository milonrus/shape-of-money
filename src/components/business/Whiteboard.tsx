import { useCallback, useRef, useEffect } from 'react'
import { Tldraw, Editor, createShapeId } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { BudgetBlockUtil, type BudgetBlockShape } from '../../lib/whiteboard/BudgetBlock'
import { BudgetStylePanel } from './BudgetStylePanel'

type BudgetMode = 'select' | 'income' | 'expense'

interface WhiteboardProps {
  budgetMode: BudgetMode
  onModeChange: (mode: BudgetMode) => void
}

export function Whiteboard({ budgetMode, onModeChange }: WhiteboardProps) {
  const editorRef = useRef<Editor | null>(null)
  const previousModeRef = useRef<BudgetMode>('select')

  const createShape = useCallback((type: 'income' | 'expense') => {
    const editor = editorRef.current
    if (!editor) {
      console.error('No editor available')
      return
    }

    const shapeId = createShapeId()

    // Get viewport center for placement
    const viewportCenter = editor.getViewportScreenCenter()
    const worldCenter = editor.screenToPage(viewportCenter)

    // Add some randomness so shapes don't stack exactly
    const offsetX = (Math.random() - 0.5) * 100
    const offsetY = (Math.random() - 0.5) * 100

    const color = type === 'income' ? 'green' : 'red'

    try {
      editor.createShape({
        id: shapeId,
        type: 'budget-block',
        x: worldCenter.x + offsetX - 50, // Center the 100x100 rectangle
        y: worldCenter.y + offsetY - 50,
        props: {
          w: 100, // 100x100 pixels
          h: 100,
          amount: 100,
          currency: '€',
          name: type === 'income' ? 'Income' : 'Expense',
          type: type,
          color: color,
        }
      } as BudgetBlockShape)

      // Select the newly created shape so the custom properties panel appears
      editor.setSelectedShapes([shapeId])

      // Automatically switch back to select mode
      setTimeout(() => onModeChange('select'), 100)
    } catch (error) {
      console.error(`Error creating ${type} shape:`, error)
    }
  }, [onModeChange])

  // Watch for mode changes and create shapes automatically
  useEffect(() => {
    const previousMode = previousModeRef.current

    if (previousMode === 'select' && budgetMode === 'income') {
      createShape('income')
    } else if (previousMode === 'select' && budgetMode === 'expense') {
      createShape('expense')
    }

    previousModeRef.current = budgetMode
  }, [budgetMode, createShape])

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor
  }, [])

  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full pt-20">
        <Tldraw
          onMount={handleMount}
          shapeUtils={[BudgetBlockUtil]}
          components={{
            StylePanel: BudgetStylePanel,
          }}
        />
      </div>
    </div>
  )
}