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
      // Calculate free-form rectangle based on drag distance
      const minX = Math.min(originPagePoint.x, currentPagePoint.x)
      const minY = Math.min(originPagePoint.y, currentPagePoint.y)
      const maxX = Math.max(originPagePoint.x, currentPagePoint.x)
      const maxY = Math.max(originPagePoint.y, currentPagePoint.y)
      const w = Math.max(8, maxX - minX)
      const h = Math.max(8, maxY - minY)
      const area = w * h
      const amount = Math.max(50, Math.round(area / 60)) // Using AMOUNT_TO_AREA_SCALE = 60, minimum 50

      if (!this.shapeId) {
        // First drag movement - create the shape
        this.shapeId = createShapeId()

        this.editor.createShape({
          id: this.shapeId,
          type: 'budget-block',
          x: minX,
          y: minY,
          props: {
            w,
            h,
            amount,
            currency: '€',
            name: 'Budget Item',
            type: 'income',
            color: 'green',
            opacity: 1,
          }
        } as BudgetBlockShape)
      } else {
        // Update the shape position and size as user drags
        this.editor.updateShape({
          id: this.shapeId,
          type: 'budget-block',
          x: minX,
          y: minY,
          props: { w, h, amount }
        })
      }
    }
  }

  override onPointerUp() {
    if (!this.shapeId) {
      // Quick click without drag - create default size square shape
      const { currentPagePoint } = this.editor.inputs
      const id = createShapeId()
      const size = 80 // Square size

      this.editor.createShape({
        id,
        type: 'budget-block',
        x: currentPagePoint.x - size / 2,
        y: currentPagePoint.y - size / 2,
        props: {
          w: size,
          h: size,
          amount: 100,
          currency: '€',
          name: 'Budget Item',
          type: 'income',
          color: 'green',
          opacity: 1,
        }
      } as BudgetBlockShape)

      this.editor.setSelectedShapes([id])
      this.editor.setCurrentTool('select')
    } else {
      // Drag completed - enforce minimum size if needed, then select and switch to select tool
      const shape = this.editor.getShape(this.shapeId!)
      if (shape && shape.type === 'budget-block') {
        const minSize = 54.8
        const currentW = shape.props.w
        const currentH = shape.props.h

        if (currentW < minSize || currentH < minSize) {
          // Shape is too small, update to minimum size while maintaining aspect ratio
          const aspectRatio = currentW / currentH
          let newW = Math.max(minSize, currentW)
          let newH = Math.max(minSize, currentH)

          // If we had to increase one dimension, adjust the other to maintain area
          if (newW === minSize && currentW < minSize) {
            newH = Math.max(minSize, newW / aspectRatio)
          } else if (newH === minSize && currentH < minSize) {
            newW = Math.max(minSize, newH * aspectRatio)
          }

          const area = newW * newH
          const amount = Math.max(50, Math.round(area / 60))

          this.editor.updateShape({
            id: this.shapeId!,
            type: 'budget-block',
            props: { w: newW, h: newH, amount }
          })
        }
      }

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