import {
  ShapeUtil,
  T,
  HTMLContainer,
  Rectangle2d,
  type TLBaseShape,
  useEditor,
  createShapeId,
} from '@tldraw/tldraw';
import { createShapePropsMigrationIds, createShapePropsMigrationSequence } from '@tldraw/tlschema';
import { useMemo, useCallback } from 'react';
import { computeDimensionsForAmount } from './BudgetBlock';

interface FrameSummaryComponentProps {
  shape: FrameSummaryShape;
}

function FrameSummaryComponent({ shape }: FrameSummaryComponentProps) {
  const { frameName, incomeTotal, expenseTotal, savingsTotal, currency, hasIncome, hasExpense, hasSavings, frameId } = shape.props;
  const editor = useEditor();

  const formatter = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }), []);
  const hasBreakdown = hasSavings || (hasIncome && hasExpense);
  const currencySymbol = currency || '';
  const left = savingsTotal + incomeTotal - expenseTotal;
  const total = savingsTotal + incomeTotal + expenseTotal;

  const handleCreateSavingsBlock = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Calculate position below the frame summary shape
    const summaryBounds = editor.getShapePageBounds(shape);
    if (!summaryBounds) return;

    const blockX = summaryBounds.x;
    const blockY = summaryBounds.y + summaryBounds.h + 20; // 20px gap

    // Calculate dimensions for the savings amount
    const savingsAmount = Math.max(left, 0);
    const { w, h } = computeDimensionsForAmount(savingsAmount, 100, 100);

    // Create the savings block
    const blockId = createShapeId();
    editor.createShape({
      id: blockId,
      type: 'budget-block',
      x: blockX,
      y: blockY,
      props: {
        w,
        h,
        amount: savingsAmount,
        currency: currency || '€',
        name: 'Savings',
        type: 'savings' as const,
        color: 'blue',
        opacity: 1,
        sourceFrameId: frameId,
      },
    });
  }, [editor, shape, left, currency, frameId]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 16px',
        backgroundColor: 'var(--tl-color-panel)',
        border: '2px solid var(--tl-color-focus)',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        fontFamily: 'var(--app-font-sans, Inter, system-ui, sans-serif)',
        pointerEvents: 'none',
      }}
    >
      {frameName && frameName.trim() !== '' && (
        <div
          style={{
            marginBottom: '8px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--tl-color-text-3)',
          }}
        >
          {frameName}
        </div>
      )}

      {hasBreakdown ? (
        // Show breakdown when there are savings, income, or expenses
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {hasSavings && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>Savings in</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>
                {currencySymbol}{formatter.format(savingsTotal)}
              </span>
            </div>
          )}

          {hasIncome && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e' }}>Income</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>
                {currencySymbol}{formatter.format(incomeTotal)}
              </span>
            </div>
          )}

          {hasExpense && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>Expenses</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>
                {currencySymbol}{formatter.format(expenseTotal)}
              </span>
            </div>
          )}

          <div style={{ height: '1px', backgroundColor: 'var(--tl-color-divider)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--tl-color-text)' }}>Savings left</span>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--tl-color-text)',
              }}
            >
              {currencySymbol}{formatter.format(left)}
            </span>
          </div>

          {left > 0 && (
            <button
              onPointerDown={handleCreateSavingsBlock}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--tl-color-text)',
                backgroundColor: 'var(--tl-color-panel)',
                border: '1px solid var(--tl-color-focus)',
                borderRadius: '4px',
                cursor: 'pointer',
                pointerEvents: 'auto',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--tl-color-focus)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--tl-color-panel)';
              }}
            >
              Add a block
            </button>
          )}
        </div>
      ) : (
        // Show simple total when only one type exists
        <div>
          <div style={{ marginBottom: '4px', fontSize: '24px', fontWeight: 700, color: 'var(--tl-color-text)' }}>
            {currencySymbol}{formatter.format(total)}
          </div>
        </div>
      )}

      {!currency && (
        <div style={{ marginTop: '8px', fontSize: '11px', fontStyle: 'italic', color: 'var(--tl-color-warn)' }}>
          Mixed currencies
        </div>
      )}
    </div>
  );
}

// Props definition for the frame summary shape
const frameSummaryProps = {
  w: T.positiveNumber,
  h: T.positiveNumber,
  frameId: T.string,
  frameName: T.string,
  incomeTotal: T.number,
  expenseTotal: T.number,
  savingsTotal: T.number,
  currency: T.string,
  hasIncome: T.boolean,
  hasExpense: T.boolean,
  hasSavings: T.boolean,
  isManuallyPositioned: T.boolean,
};

// Type definition for the frame summary shape
export type FrameSummaryShape = TLBaseShape<
  'frame-summary',
  {
    w: number;
    h: number;
    frameId: string;
    frameName: string;
    incomeTotal: number;
    expenseTotal: number;
    savingsTotal: number;
    currency: string;
    hasIncome: boolean;
    hasExpense: boolean;
    hasSavings: boolean;
    isManuallyPositioned: boolean;
  }
>;

// Migrations for shape data
const Versions = createShapePropsMigrationIds('frame-summary', {
  AddManualPositioning: 1,
  AddSavings: 2,
  IncreaseHeight: 3,
});

const frameSummaryMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions.AddManualPositioning,
      up: (props) => {
        // Add isManuallyPositioned property to existing shapes
        if (props.isManuallyPositioned === undefined) {
          props.isManuallyPositioned = false;
        }
      },
      down: (props) => {
        // Remove the property when downgrading
        delete (props as Partial<FrameSummaryShape['props']>).isManuallyPositioned;
      },
    },
    {
      id: Versions.AddSavings,
      up: (props) => {
        // Add savings tracking properties
        if (props.savingsTotal === undefined) {
          props.savingsTotal = 0;
        }
        if (props.hasSavings === undefined) {
          props.hasSavings = false;
        }
      },
      down: (props) => {
        // Remove savings properties when downgrading
        delete (props as Partial<FrameSummaryShape['props']>).savingsTotal;
        delete (props as Partial<FrameSummaryShape['props']>).hasSavings;
      },
    },
    {
      id: Versions.IncreaseHeight,
      up: (props) => {
        // Update height from 150 to 200 to accommodate frame name
        if (props.h === 150) {
          props.h = 200;
        }
      },
      down: (props) => {
        // Revert height back to 150
        if (props.h === 200) {
          props.h = 150;
        }
      },
    },
  ],
});

// Shape utility class
export class FrameSummaryUtil extends ShapeUtil<FrameSummaryShape> {
  static override type = 'frame-summary' as const;
  static override props = frameSummaryProps;
  static override migrations = frameSummaryMigrations;

  // Default props
  getDefaultProps(): FrameSummaryShape['props'] {
    return {
      w: 300,
      h: 200,
      frameId: '',
      frameName: '',
      incomeTotal: 0,
      expenseTotal: 0,
      savingsTotal: 0,
      currency: '',
      hasIncome: false,
      hasExpense: false,
      hasSavings: false,
      isManuallyPositioned: false,
    };
  }

  // Geometry for bounds
  getGeometry(shape: FrameSummaryShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  // Non-editable shape
  canEdit = () => false;

  // Non-resizable shape
  canResize = () => false;

  // Non-croppable shape
  canCrop = () => false;

  // Cannot bind to this shape
  canBind = () => false;

  // Track when user moves the shape
  override onTranslateStart = (shape: FrameSummaryShape) => {
    return {
      id: shape.id,
      type: shape.type,
      props: {
        isManuallyPositioned: true,
      },
    };
  };

  // React component that renders the shape
  component(shape: FrameSummaryShape) {
    return (
      <HTMLContainer>
        <FrameSummaryComponent shape={shape} />
      </HTMLContainer>
    );
  }

  // Indicator that shows when shape is selected (minimal)
  indicator(shape: FrameSummaryShape) {
    const { w, h } = shape.props;
    return (
      <rect
        width={w}
        height={h}
        fill="none"
        stroke="var(--color-selected)"
        strokeWidth="1"
        strokeDasharray="4 4"
        rx="8"
      />
    );
  }
}