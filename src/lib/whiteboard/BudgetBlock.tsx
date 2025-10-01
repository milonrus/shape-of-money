import {
  ShapeUtil,
  T,
  getDefaultColorTheme,
  HTMLContainer,
  Rectangle2d,
  useEditor,
  useValue,
  type TLBaseShape,
} from '@tldraw/tldraw'
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'
import { createShapePropsMigrationIds, createShapePropsMigrationSequence } from '@tldraw/tlschema'

export const AMOUNT_TO_AREA_SCALE = 60
export const MIN_BUDGET_BLOCK_SIZE = 1
const FONT_STACK =
  'var(--app-font-sans, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const normalizeDimension = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : MIN_BUDGET_BLOCK_SIZE

const enforceWidthPreference = (targetArea: number, widthCandidate: number) => {
  const min = MIN_BUDGET_BLOCK_SIZE
  const max = Math.max(min, targetArea / min)

  let width = clamp(normalizeDimension(widthCandidate), min, max)
  let height = clamp(targetArea / width, min, max)

  width = clamp(targetArea / height, min, max)
  height = clamp(targetArea / width, min, max)

  return { w: width, h: height }
}

const enforceHeightPreference = (targetArea: number, heightCandidate: number) => {
  const min = MIN_BUDGET_BLOCK_SIZE
  const max = Math.max(min, targetArea / min)

  let height = clamp(normalizeDimension(heightCandidate), min, max)
  let width = clamp(targetArea / height, min, max)

  height = clamp(targetArea / width, min, max)
  width = clamp(targetArea / height, min, max)

  return { w: width, h: height }
}

export function computeDimensionsForAmount(
  amount: number,
  currentWidth: number,
  currentHeight: number
): { w: number; h: number } {
  const targetAmount = Math.max(amount, 0)
  const targetArea = targetAmount * AMOUNT_TO_AREA_SCALE

  if (targetArea <= 0) {
    return {
      w: MIN_BUDGET_BLOCK_SIZE,
      h: MIN_BUDGET_BLOCK_SIZE,
    }
  }

  const aspectRatio = currentWidth > 0 && currentHeight > 0 ? currentWidth / currentHeight : 1
  const idealWidth = Math.sqrt(targetArea * aspectRatio)

  return enforceWidthPreference(targetArea, idealWidth)
}

interface BudgetBlockComponentProps {
  shape: BudgetBlockShape
}

// eslint-disable-next-line react-refresh/only-export-components
function BudgetBlockComponent({ shape }: BudgetBlockComponentProps) {
  const editor = useEditor()
  const { w, h, amount, currency, name, type, color, opacity: rawOpacity } = shape.props
  const opacity = Number.isFinite(rawOpacity) ? clamp(rawOpacity, 0, 1) : 1

  const theme = getDefaultColorTheme({ isDarkMode: false })
  const themeColor = theme[color as keyof typeof theme]
  const colorValue =
    typeof themeColor === 'object' && themeColor.solid ? themeColor.solid : type === 'income' ? '#22c55e' : '#ef4444'

  const hexToRgba = (hex: string, alpha: number) => {
    const cleaned = hex.replace('#', '')
    if (cleaned.length === 3) {
      const r = cleaned[0]
      const g = cleaned[1]
      const b = cleaned[2]
      return hexToRgba(`${r}${r}${g}${g}${b}${b}`, alpha)
    }

    if (cleaned.length !== 6) {
      return hex
    }

    const r = Number.parseInt(cleaned.slice(0, 2), 16)
    const g = Number.parseInt(cleaned.slice(2, 4), 16)
    const b = Number.parseInt(cleaned.slice(4, 6), 16)
    if ([r, g, b].some(Number.isNaN)) {
      return hex
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const backgroundColor = hexToRgba(colorValue, 0.3)

  // Create dotted pattern for income blocks
  const backgroundImage = type === 'income'
    ? `radial-gradient(circle, ${colorValue} 1.5px, transparent 1.5px)`
    : 'none'
  const backgroundSize = type === 'income' ? '12px 12px' : 'auto'

  const [editingField, setEditingField] = useState<'name' | 'amount' | null>(null)
  const [nameDraft, setNameDraft] = useState(name)
  const [amountDraft, setAmountDraft] = useState(String(amount))

  const nameInputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const lastNameClickTs = useRef(0)
  const lastAmountClickTs = useRef(0)

  const isCanvasEditing = useValue(
    `budget-block:${shape.id}:editing`,
    () => editor.getEditingShapeId() === shape.id,
    [editor, shape.id]
  )

  const beginEditing = useCallback(
    (field: 'name' | 'amount') => {
      setEditingField(field)
      editor.setEditingShape(shape.id)
    },
    [editor, shape.id]
  )

  const endEditing = useCallback(() => {
    setEditingField(null)
    if (editor.getEditingShapeId() === shape.id) {
      editor.setEditingShape(null)
    }
  }, [editor, shape.id])

  useEffect(() => {
    if (editingField !== 'name') {
      setNameDraft(name)
    }
  }, [editingField, name])

  useEffect(() => {
    if (editingField !== 'amount') {
      setAmountDraft(String(amount))
    }
  }, [amount, editingField])

  useEffect(() => {
    if (editingField === 'name') {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }
  }, [editingField])

  useEffect(() => {
    if (editingField === 'amount') {
      amountInputRef.current?.focus()
      amountInputRef.current?.select()
    }
  }, [editingField])

  useEffect(() => {
    if (!isCanvasEditing && editingField !== null) {
      setEditingField(null)
    }
  }, [editingField, isCanvasEditing])

  const commitName = useCallback(() => {
    const trimmed = nameDraft.trim()
    const nextValue = trimmed === '' ? name : trimmed

    if (nextValue !== name) {
      editor.updateShapes([
        {
          id: shape.id,
          type: 'budget-block' as const,
          props: { name: nextValue },
        },
      ])
    }

    setNameDraft(nextValue)
    endEditing()
  }, [editor, endEditing, name, nameDraft, shape.id])

  const cancelNameEdit = useCallback(() => {
    setNameDraft(name)
    endEditing()
  }, [endEditing, name])

  const commitAmount = useCallback(() => {
    const parsed = parseFloat(amountDraft)

    if (Number.isNaN(parsed) || parsed < 0) {
      setAmountDraft(String(amount))
      endEditing()
      return
    }

    if (parsed !== amount) {
      const { w: nextW, h: nextH } = computeDimensionsForAmount(parsed, w, h)

      editor.updateShapes([
        {
          id: shape.id,
          type: 'budget-block' as const,
          props: {
            amount: parsed,
            w: nextW,
            h: nextH,
          },
        },
      ])
    }

    setAmountDraft(String(parsed))
    endEditing()
  }, [amount, amountDraft, editor, endEditing, h, shape.id, w])

  const cancelAmountEdit = useCallback(() => {
    setAmountDraft(String(amount))
    endEditing()
  }, [amount, endEditing])

  const handleDoubleClickCandidate = useCallback(
    (event: PointerEvent, lastTimestampRef: MutableRefObject<number>, field: 'name' | 'amount') => {
      const now = event.timeStamp
      if (now - lastTimestampRef.current < 300) {
        event.stopPropagation()
        event.preventDefault()
        beginEditing(field)
        lastTimestampRef.current = 0
      } else {
        lastTimestampRef.current = now
      }
    },
    [beginEditing]
  )

  return (
    <div
      style={{
        width: w,
        height: h,
        backgroundColor,
        backgroundImage,
        backgroundSize,
        border: `4px solid ${colorValue}`,
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: FONT_STACK,
        color: 'white',
        textShadow: 'var(--budget-block-text-shadow, 1px 1px 2px rgba(0,0,0,0.5))',
        pointerEvents: 'all',
        padding: '6px',
        boxSizing: 'border-box',
        gap: '4px',
      }}
    >
      <div style={{ fontSize: '10px', width: '100%', textAlign: 'center', fontFamily: FONT_STACK }}>
        {editingField === 'name' ? (
          <input
            ref={nameInputRef}
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitName()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                cancelNameEdit()
              }
            }}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              fontSize: '10px',
              fontWeight: '600',
              fontFamily: FONT_STACK,
              textAlign: 'center',
              borderRadius: '4px',
              border: '1px solid var(--budget-block-input-border)',
              padding: '2px 4px',
              backgroundColor: 'var(--budget-block-input-bg)',
              color: 'var(--budget-block-input-text)',
            }}
          />
        ) : (
          <span
            onPointerDown={(event) => handleDoubleClickCandidate(event.nativeEvent, lastNameClickTs, 'name')}
            onDoubleClick={(event) => {
              event.stopPropagation()
              beginEditing('name')
            }}
            style={{ cursor: 'text' }}
          >
            {name}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: '14px',
          fontFamily: FONT_STACK,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>{currency}</span>
        {editingField === 'amount' ? (
          <input
            ref={amountInputRef}
            value={amountDraft}
            onChange={(event) => setAmountDraft(event.target.value)}
            onBlur={commitAmount}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitAmount()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                cancelAmountEdit()
              }
            }}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              width: '64px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: FONT_STACK,
              textAlign: 'left',
              borderRadius: '4px',
              border: '1px solid var(--budget-block-input-border)',
              padding: '2px 4px',
              backgroundColor: 'var(--budget-block-input-bg)',
              color: 'var(--budget-block-input-text)',
            }}
          />
        ) : (
          <span
            onPointerDown={(event) => handleDoubleClickCandidate(event.nativeEvent, lastAmountClickTs, 'amount')}
            onDoubleClick={(event) => {
              event.stopPropagation()
              beginEditing('amount')
            }}
            style={{ cursor: 'text' }}
          >
            {amount}
          </span>
        )}
      </div>
    </div>
  )
}

// Props definition for the budget block shape
const budgetBlockProps = {
  w: T.positiveNumber,
  h: T.positiveNumber,
  amount: T.positiveNumber,
  currency: T.string,
  name: T.string,
  type: T.literalEnum('income', 'expense'),
  color: T.string,
  opacity: T.number,
  isSavingsBlock: T.boolean,
  sourceFrameId: T.string,
}

// Type definition for the budget block shape
export type BudgetBlockShape = TLBaseShape<
  'budget-block',
  {
    w: number
    h: number
    amount: number
    currency: string
    name: string
    type: 'income' | 'expense'
    color: string
    opacity: number
    isSavingsBlock: boolean
    sourceFrameId: string
  }
>

// Shape utility class
export class BudgetBlockUtil extends ShapeUtil<BudgetBlockShape> {
  static override type = 'budget-block' as const
  static override props = budgetBlockProps

  // Default props
  getDefaultProps(): BudgetBlockShape['props'] {
    const defaultAmount = 100
    const { w, h } = computeDimensionsForAmount(defaultAmount, 1, 1)

    return {
      w,
      h,
      amount: defaultAmount,
      currency: '€',
      name: 'Budget Item',
      type: 'income',
      color: 'green',
      opacity: 1,
      isSavingsBlock: false,
      sourceFrameId: '',
    }
  }

  // Helper method to calculate dimensions from amount while maintaining aspect ratio
  calculateDimensionsFromAmount(amount: number, currentW: number, currentH: number): { w: number, h: number } {
    return computeDimensionsForAmount(amount, currentW, currentH)
  }

  // Geometry for bounds
  getGeometry(shape: BudgetBlockShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  // Check if shape can be edited
  canEdit = () => true

  // Check if shape can be resized
  canResize = () => true

  // Check if shape can be cropped
  canCrop = () => false

  // Aspect ratio is flexible since we enforce area constraint
  isAspectRatioLocked = () => false

  // React component that renders the shape
  component(shape: BudgetBlockShape) {
    return (
      <HTMLContainer>
        <BudgetBlockComponent shape={shape} />
      </HTMLContainer>
    )
  }

  // Indicator that shows when shape is selected
  indicator(shape: BudgetBlockShape) {
    const { w, h } = shape.props
    return (
      <rect
        width={w}
        height={h}
        fill="none"
        stroke="var(--color-selected)"
        strokeWidth="2"
        rx="4"
      />
    )
  }

  // Handle resize while maintaining area constraint
  override onResize: ShapeUtil<BudgetBlockShape>['onResize'] = (shape, info) => {
    const { amount } = shape.props
    const targetArea = Math.max(amount, 0) * AMOUNT_TO_AREA_SCALE

    if (targetArea <= 0) {
      return {
        props: {
          ...shape.props,
          w: MIN_BUDGET_BLOCK_SIZE,
          h: MIN_BUDGET_BLOCK_SIZE,
        },
      }
    }

    const { scaleX, scaleY } = info
    const prioritizeWidth = Math.abs(scaleX - 1) >= Math.abs(scaleY - 1)

    const { w, h } = prioritizeWidth
      ? enforceWidthPreference(targetArea, shape.props.w * scaleX)
      : enforceHeightPreference(targetArea, shape.props.h * scaleY)

    return {
      props: {
        ...shape.props,
        w,
        h,
      },
    }
  }

}

// Migrations for shape data - using default migrations
const Versions = createShapePropsMigrationIds('budget-block', {
  AddOpacity: 1,
  AddSavingsBlock: 2,
})

export const budgetBlockMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions.AddOpacity,
      up: (props) => {
        if (props.opacity === undefined) {
          props.opacity = 1
        }
      },
      down: (props) => {
        delete (props as Partial<BudgetBlockShape['props']>).opacity
      },
    },
    {
      id: Versions.AddSavingsBlock,
      up: (props) => {
        if (props.isSavingsBlock === undefined) {
          props.isSavingsBlock = false
        }
        if (props.sourceFrameId === undefined) {
          props.sourceFrameId = ''
        }
      },
      down: (props) => {
        delete (props as Partial<BudgetBlockShape['props']>).isSavingsBlock
        delete (props as Partial<BudgetBlockShape['props']>).sourceFrameId
      },
    },
  ],
})

// Update the static migrations property
BudgetBlockUtil.migrations = budgetBlockMigrations
