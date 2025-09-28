import {
  DefaultContextMenu,
  DefaultContextMenuContent,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  useEditor,
  useValue,
  type TLUiContextMenuProps,
} from '@tldraw/tldraw'
import { useCallback } from 'react'
import { computeDimensionsForAmount, type BudgetBlockShape } from '../../lib/whiteboard/BudgetBlock'

export function BudgetContextMenu(props: TLUiContextMenuProps) {
  return (
    <DefaultContextMenu {...props}>
      <BudgetContextMenuContent />
    </DefaultContextMenu>
  )
}

function BudgetContextMenuContent() {
  const editor = useEditor()

  const hasBudgetBlocksSelected = useValue(
    'budget-context-menu:has-budget-block',
    () => editor.getSelectedShapes().some((shape) => shape.type === 'budget-block'),
    [editor]
  )

  const handleSquaricle = useCallback(() => {
    const budgetBlocks = editor
      .getSelectedShapes()
      .filter((shape): shape is BudgetBlockShape => shape.type === 'budget-block')

    if (budgetBlocks.length === 0) {
      return
    }

    editor.updateShapes(
      budgetBlocks.map((shape) => {
        const { amount } = shape.props
        const { w, h } = computeDimensionsForAmount(amount, 1, 1)

        return {
          id: shape.id,
          type: 'budget-block' as const,
          props: { w, h },
        }
      })
    )
  }, [editor])

  return (
    <>
      {hasBudgetBlocksSelected && (
        <TldrawUiMenuGroup id="budget-block-tools">
          <TldrawUiMenuItem
            id="budget-block.squaricle"
            iconLeft="square"
            label="Squaricle"
            onSelect={handleSquaricle}
          />
        </TldrawUiMenuGroup>
      )}
      <DefaultContextMenuContent />
    </>
  )
}
