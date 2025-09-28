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
import { AMOUNT_TO_AREA_SCALE, MIN_BUDGET_BLOCK_SIZE, computeDimensionsForAmount, type BudgetBlockShape } from '../../lib/whiteboard/BudgetBlock'
import { computeBudgetTreemapLayout } from '../../lib/whiteboard/treemapLayout'

export function BudgetContextMenu(props: TLUiContextMenuProps) {
  return (
    <DefaultContextMenu {...props}>
      <BudgetContextMenuContent />
    </DefaultContextMenu>
  )
}

function BudgetContextMenuContent() {
  const editor = useEditor()

  const { hasBudgetBlocksSelected, canArrangeTreemap } = useValue(
    'budget-context-menu:budget-block-selection-info',
    () => {
      const selectedBudgetBlocks = editor
        .getSelectedShapes()
        .filter((shape): shape is BudgetBlockShape => shape.type === 'budget-block')

      return {
        hasBudgetBlocksSelected: selectedBudgetBlocks.length > 0,
        canArrangeTreemap: selectedBudgetBlocks.length > 1,
      }
    },
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

  const handleArrangeTreemap = useCallback(() => {
    const budgetBlocks = editor
      .getSelectedShapes()
      .filter((shape): shape is BudgetBlockShape => shape.type === 'budget-block')

    if (budgetBlocks.length < 2) {
      console.debug('[Treemap] Needs at least two budget blocks; got', budgetBlocks.length)
      return
    }

    const inputItems = budgetBlocks.map((shape) => {
        const b = editor.getShapePageBounds(shape.id)!
        return {
          id: shape.id,
          amount: shape.props.amount,
          x: b.x,
          y: b.y,
          w: b.w,
          h: b.h,
        }
      })

    console.log('[Treemap] input items (first 3)', inputItems.slice(0, 3))

    const layout = computeBudgetTreemapLayout(inputItems)

    if (layout.length === 0) {
    console.log('[Treemap] Computed empty layout')
      return
    }

    console.log('[Treemap] Applying layout to', layout.length, 'blocks', layout)

    const updates = layout.map((item) => {
      const minimumArea = MIN_BUDGET_BLOCK_SIZE * MIN_BUDGET_BLOCK_SIZE
      const area = Math.max(item.amount, 0) * AMOUNT_TO_AREA_SCALE
      const constrainedArea = Math.max(area, minimumArea)
      const ratio = item.h > 0 ? item.w / item.h : 1

      let width: number
      let height: number

      if (constrainedArea <= minimumArea) {
        width = MIN_BUDGET_BLOCK_SIZE
        height = MIN_BUDGET_BLOCK_SIZE
      } else {
        width = Math.sqrt(constrainedArea * Math.max(ratio, 1e-6))
        width = Number.isFinite(width) ? width : MIN_BUDGET_BLOCK_SIZE
        height = constrainedArea / Math.max(width, 1e-6)
        height = Number.isFinite(height) ? height : MIN_BUDGET_BLOCK_SIZE

        if (width < MIN_BUDGET_BLOCK_SIZE) {
          width = MIN_BUDGET_BLOCK_SIZE
          height = constrainedArea / width
        }

        if (height < MIN_BUDGET_BLOCK_SIZE) {
          height = MIN_BUDGET_BLOCK_SIZE
          width = constrainedArea / height
        }
      }

      const offsetX = item.x + (item.w - width) / 2
      const offsetY = item.y + (item.h - height) / 2

      const parentPoint = editor.getPointInParentSpace(item.id, { x: offsetX, y: offsetY })

      console.log('[Treemap] layout result', {
        id: item.id,
        amount: item.amount,
        width,
        height,
        area,
        ratio,
        targetCell: { w: item.w, h: item.h },
        offset: { offsetX, offsetY },
      })

      return {
        id: item.id,
        type: 'budget-block' as const,
        x: parentPoint.x,
        y: parentPoint.y,
        props: {
          w: width,
          h: height,
        },
      }
    })

    console.log('[Treemap] applying updates', updates)
    editor.updateShapes(updates)
  }, [editor])

  return (
    <>
      {hasBudgetBlocksSelected && (
        <TldrawUiMenuGroup id="budget-block-tools">
          {canArrangeTreemap && (
            <TldrawUiMenuItem
              id="budget-block.treemap"
              iconLeft="layout-grid"
              label="Arrange in Treemap"
              onSelect={handleArrangeTreemap}
            />
          )}
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
