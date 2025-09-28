import { ShapeUtil, T, getDefaultColorTheme, HTMLContainer, Rectangle2d, type TLBaseShape } from '@tldraw/tldraw'

// Props definition for the budget block shape
const budgetBlockProps = {
  w: T.positiveNumber,
  h: T.positiveNumber,
  amount: T.positiveNumber,
  currency: T.string,
  name: T.string,
  type: T.literalEnum('income', 'expense'),
  color: T.string,
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
  }
>

// Shape utility class
export class BudgetBlockUtil extends ShapeUtil<BudgetBlockShape> {
  static override type = 'budget-block' as const
  static override props = budgetBlockProps

  // Default props
  getDefaultProps(): BudgetBlockShape['props'] {
    return {
      w: 100,
      h: 100,
      amount: 100,
      currency: '€',
      name: 'Budget Item',
      type: 'income',
      color: 'green',
    }
  }

  // Helper method to calculate dimensions from amount while maintaining aspect ratio
  calculateDimensionsFromAmount(amount: number, currentW: number, currentH: number): { w: number, h: number } {
    const globalScale = 1 // TODO: Get from store
    const targetArea = amount * globalScale
    const minSize = 24

    // Maintain current aspect ratio if possible
    const currentAspectRatio = currentW / currentH
    const newWidth = Math.max(minSize, Math.sqrt(targetArea * currentAspectRatio))
    const newHeight = Math.max(minSize, targetArea / newWidth)

    return { w: newWidth, h: newHeight }
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
    const { w, h, amount, currency, name, type, color } = shape.props

    const theme = getDefaultColorTheme({ isDarkMode: false })
    const themeColor = theme[color as keyof typeof theme]
    const colorValue = (typeof themeColor === 'object' && themeColor.solid) ? themeColor.solid : (type === 'income' ? '#22c55e' : '#ef4444')

    return (
      <HTMLContainer>
        <div
          style={{
            width: w,
            height: h,
            backgroundColor: colorValue,
            border: '2px solid #000',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            pointerEvents: 'all',
          }}
        >
          <div style={{ fontSize: '10px', marginBottom: '2px' }}>{name}</div>
          <div style={{ fontSize: '14px' }}>
            {currency}{amount}
          </div>
        </div>
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
    const globalScale = 1 // TODO: Get from store
    const targetArea = amount * globalScale
    const minSize = 24

    // Get the proposed new dimensions
    const { scaleX, scaleY } = info
    const proposedW = Math.max(minSize, shape.props.w * scaleX)
    const proposedH = Math.max(minSize, shape.props.h * scaleY)

    // Determine which dimension changed more to prioritize that direction
    const wChange = Math.abs(scaleX - 1)
    const hChange = Math.abs(scaleY - 1)

    let newW: number, newH: number

    if (wChange > hChange) {
      // Width changed more, keep new width and adjust height
      newW = proposedW
      newH = Math.max(minSize, targetArea / newW)
    } else {
      // Height changed more, keep new height and adjust width
      newH = proposedH
      newW = Math.max(minSize, targetArea / newH)
    }

    return {
      props: {
        ...shape.props,
        w: newW,
        h: newH,
      },
    }
  }

  // Handle double-click to edit
  override onDoubleClick = (shape: BudgetBlockShape) => {
    // This could open an edit dialog
    console.log('Double-clicked budget block:', shape.props.name)
  }
}

// Migrations for shape data - using default migrations
export const budgetBlockMigrations = {
  currentVersion: 1,
  firstVersion: 1,
  migrators: {},
}

// Update the static migrations property
BudgetBlockUtil.migrations = budgetBlockMigrations