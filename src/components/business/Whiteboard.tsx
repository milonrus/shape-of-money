import { useRef, useCallback } from 'react'
import { Tldraw, Editor, createShapeId } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'

type BudgetMode = 'select' | 'income' | 'expense'

interface WhiteboardProps {
  budgetMode: BudgetMode
  onModeChange: (mode: BudgetMode) => void
}

export function Whiteboard({ budgetMode, onModeChange }: WhiteboardProps) {
  const editorRef = useRef<Editor | null>(null)

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor
  }, [])

  const handleCanvasDoubleClick = useCallback((info: any) => {
    const editor = editorRef.current
    if (!editor || budgetMode === 'select') return

    // Get the point where the user double-clicked
    const { x, y } = info.point

    // Create a new rectangle based on the current budget mode
    const shapeId = createShapeId()

    // Define colors and text based on budget mode
    const color = budgetMode === 'income' ? 'green' : 'red'
    const text = budgetMode === 'income' ? 'Income: $1000' : 'Expense: $500'

    // Create a simple rectangle shape
    editor.createShape({
      id: shapeId,
      type: 'geo',
      x: x - 75,
      y: y - 37.5,
      props: {
        w: 150,
        h: 75,
        geo: 'rectangle',
        color: color,
        fill: 'solid',
        text: text,
        align: 'middle',
        verticalAlign: 'middle',
      },
      meta: {
        budgetType: budgetMode,
        amount: budgetMode === 'income' ? 1000 : 500,
        name: budgetMode === 'income' ? 'Income' : 'Expense'
      }
    })

    // Switch back to select mode after creating
    onModeChange('select')
  }, [budgetMode, onModeChange])

  return (
    <div className="w-full h-full">
      <Tldraw
        onMount={handleMount}
        onCanvasDoubleClick={handleCanvasDoubleClick}
      />
    </div>
  )
}