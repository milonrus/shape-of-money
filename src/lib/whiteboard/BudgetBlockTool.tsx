import {
  StateNode,
  createShapeId,
} from '@tldraw/tldraw'
import { type BudgetBlockShape } from './BudgetBlock'

// Idle state - waiting for user to start drawing
export class Idle extends StateNode {
  static override id = 'idle'

  override onPointerDown() {
    this.parent.transition('pointing')
  }

  override onKeyDown() {
    if (this.editor.inputs.keys.has('Escape')) {
      this.editor.setCurrentTool('select')
    }
  }
}

// Pointing state - detecting drag start and handling creation
export class Pointing extends StateNode {
  static override id = 'pointing'
  private shapeId: string | null = null

  override onEnter() {
    this.shapeId = null
  }

  override onPointerMove() {
    const { isDragging, originPagePoint, currentPagePoint } = this.editor.inputs

    if (isDragging) {
      if (!this.shapeId) {
        // First drag movement - create the shape
        this.shapeId = createShapeId()

        this.editor.createShape({
          id: this.shapeId,
          type: 'budget-block',
          x: originPagePoint.x,
          y: originPagePoint.y,
          props: {
            w: Math.max(8, Math.abs(currentPagePoint.x - originPagePoint.x)),
            h: Math.max(8, Math.abs(currentPagePoint.y - originPagePoint.y)),
            amount: 1,
            currency: '€',
            name: 'Budget Item',
            type: 'income',
            color: 'green',
            opacity: 1,
          }
        } as BudgetBlockShape)
      } else {
        // Update the shape size as user drags
        const w = Math.max(8, Math.abs(currentPagePoint.x - originPagePoint.x))
        const h = Math.max(8, Math.abs(currentPagePoint.y - originPagePoint.y))
        const area = w * h
        const amount = Math.max(1, Math.round(area / 60)) // Using AMOUNT_TO_AREA_SCALE = 60

        this.editor.updateShape({
          id: this.shapeId,
          type: 'budget-block',
          props: { w, h, amount }
        })
      }
    }
  }

  override onPointerUp() {
    if (!this.shapeId) {
      // Quick click without drag - create default size shape
      const { currentPagePoint } = this.editor.inputs
      const id = createShapeId()

      this.editor.createShape({
        id,
        type: 'budget-block',
        x: currentPagePoint.x - 50,
        y: currentPagePoint.y - 32,
        props: {
          w: 100,
          h: 64,
          amount: 100,
          currency: '€',
          name: 'Budget Item',
          type: 'income',
          color: 'green',
          opacity: 1,
        }
      } as BudgetBlockShape)

      this.editor.setSelectedShapes([id])
    } else {
      // Drag completed - select the created shape and switch to select tool
      this.editor.setSelectedShapes([this.shapeId])
      this.editor.setCurrentTool('select')
    }

    this.parent.transition('idle')
  }

  override onKeyDown() {
    if (this.editor.inputs.keys.has('Escape')) {
      this.parent.transition('idle')
    }
  }

  override onCancel() {
    this.parent.transition('idle')
  }
}

// Main BudgetBlock tool
export class BudgetBlockTool extends StateNode {
  static override id = 'budget-block'
  static override initial = 'idle'
  static override children = () => [Idle, Pointing]

  override onEnter() {
    this.editor.setCursor({ type: 'cross', rotation: 0 })
  }

  override onExit() {
    this.editor.setCursor({ type: 'default', rotation: 0 })
  }
}