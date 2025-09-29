import { useEditor, useValue } from '@tldraw/tldraw';
import { useMemo } from 'react';
import type { TLFrameShape, TLParentId, TLShape, TLShapeId } from '@tldraw/tlschema';
import type { BudgetBlockShape } from '../../lib/whiteboard/BudgetBlock';

type BudgetBlockAggregate = {
  total: number;
  count: number;
  currencies: Set<string>;
  incomeTotal: number;
  expenseTotal: number;
  incomeCount: number;
  expenseCount: number;
};

type FrameBudgetSummary = {
  frameId: TLShapeId;
  frameName: string;
  total: number;
  currency: string | null;
  budgetBlockCount: number;
  incomeTotal: number;
  expenseTotal: number;
  hasIncome: boolean;
  hasExpense: boolean;
};

const isFrameShape = (shape: TLShape | null | undefined): shape is TLFrameShape =>
  Boolean(shape && shape.type === 'frame');

const isBudgetBlockShape = (shape: TLShape | null | undefined): shape is BudgetBlockShape =>
  Boolean(shape && shape.type === 'budget-block');

function collectBudgetBlockData(editor: ReturnType<typeof useEditor>, parentId: TLParentId): BudgetBlockAggregate {
  const aggregate: BudgetBlockAggregate = {
    total: 0,
    count: 0,
    currencies: new Set<string>(),
    incomeTotal: 0,
    expenseTotal: 0,
    incomeCount: 0,
    expenseCount: 0,
  };

  const childIds = editor.getSortedChildIdsForParent(parentId);

  for (const childId of childIds) {
    const child = editor.getShape(childId);
    if (!child) continue;

    if (isBudgetBlockShape(child)) {
      const rawAmount = child.props.amount;
      const amount = typeof rawAmount === 'number' && Number.isFinite(rawAmount) ? rawAmount : 0;
      const blockType = child.props.type;

      aggregate.total += amount;
      aggregate.count += 1;

      if (blockType === 'income') {
        aggregate.incomeTotal += amount;
        aggregate.incomeCount += 1;
      } else if (blockType === 'expense') {
        aggregate.expenseTotal += amount;
        aggregate.expenseCount += 1;
      }

      const currency = child.props.currency;
      if (typeof currency === 'string' && currency.trim() !== '') {
        aggregate.currencies.add(currency);
      }
    }

    const nested = collectBudgetBlockData(editor, child.id);
    if (nested.count > 0) {
      aggregate.total += nested.total;
      aggregate.count += nested.count;
      aggregate.incomeTotal += nested.incomeTotal;
      aggregate.expenseTotal += nested.expenseTotal;
      aggregate.incomeCount += nested.incomeCount;
      aggregate.expenseCount += nested.expenseCount;
      nested.currencies.forEach((value) => aggregate.currencies.add(value));
    }
  }

  return aggregate;
}

function findAllFramesWithBudgetBlocks(editor: ReturnType<typeof useEditor>): TLFrameShape[] {
  const allShapes = editor.getCurrentPageShapes();
  const frames = allShapes.filter(isFrameShape);

  return frames.filter(frame => {
    const aggregate = collectBudgetBlockData(editor, frame.id);
    return aggregate.count > 0;
  });
}

function computeFrameBudgetSummary(editor: ReturnType<typeof useEditor>, frame: TLFrameShape): FrameBudgetSummary {
  const aggregate = collectBudgetBlockData(editor, frame.id);
  const currencies = aggregate.currencies;
  let currency: string | null = null;

  if (currencies.size === 1) {
    const [singleCurrency] = currencies;
    currency = singleCurrency;
  }

  return {
    frameId: frame.id,
    frameName: frame.props.name,
    total: aggregate.total,
    currency,
    budgetBlockCount: aggregate.count,
    incomeTotal: aggregate.incomeTotal,
    expenseTotal: aggregate.expenseTotal,
    hasIncome: aggregate.incomeCount > 0,
    hasExpense: aggregate.expenseCount > 0,
  };
}

type FrameWithPosition = {
  summary: FrameBudgetSummary;
  screenPosition: { x: number; y: number };
};

export function FrameInfoPanel() {
  const editor = useEditor();

  // Reactively track all frames with budget blocks and their screen positions
  // This will update when shapes change OR when camera moves (pan/zoom)
  const framesWithData = useValue(
    'frame-info-panel:frames',
    () => {
      const frames = findAllFramesWithBudgetBlocks(editor);
      const result: FrameWithPosition[] = [];

      for (const frame of frames) {
        const pageBounds = editor.getShapePageBounds(frame);
        if (!pageBounds) continue;

        const summary = computeFrameBudgetSummary(editor, frame);

        // Position panel 200 units to the right in page space
        const pagePosition = {
          x: pageBounds.maxX + 200,
          y: pageBounds.minY,
        };

        // Convert to screen position immediately (this makes it reactive to camera changes)
        const screenPosition = editor.pageToScreen(pagePosition);

        result.push({
          summary,
          screenPosition: {
            x: screenPosition.x,
            y: screenPosition.y,
          },
        });
      }

      return result;
    },
    [editor]
  );

  const formatter = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }), []);

  if (framesWithData.length === 0) {
    return null;
  }

  return (
    <>
      {framesWithData.map(({ summary, screenPosition }) => {
        const hasBothTypes = summary.hasIncome && summary.hasExpense;
        const currencySymbol = summary.currency ?? '';
        const left = summary.incomeTotal - summary.expenseTotal;

        return (
          <div
            key={summary.frameId}
            style={{
              position: 'absolute',
              left: `${screenPosition.x}px`,
              top: `${screenPosition.y}px`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
          >
            <div
              className="rounded-lg border-2 shadow-lg"
              style={{
                backgroundColor: 'var(--tl-color-panel)',
                borderColor: 'var(--tl-color-focus)',
                padding: '12px 16px',
                minWidth: '180px',
                maxWidth: '280px',
              }}
            >
              {summary.frameName && summary.frameName.trim() !== '' && (
                <div
                  className="mb-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--tl-color-text-3)' }}
                >
                  Frame: {summary.frameName}
                </div>
              )}

              {hasBothTypes ? (
                // Show breakdown when both income and expense exist
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                      Income
                    </span>
                    <span className="text-lg font-bold" style={{ color: '#22c55e' }}>
                      {currencySymbol}{formatter.format(summary.incomeTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                      Expenses
                    </span>
                    <span className="text-lg font-bold" style={{ color: '#ef4444' }}>
                      {currencySymbol}{formatter.format(summary.expenseTotal)}
                    </span>
                  </div>

                  <div
                    className="h-px"
                    style={{ backgroundColor: 'var(--tl-color-divider)' }}
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: 'var(--tl-color-text)' }}>
                      Left
                    </span>
                    <span
                      className="text-xl font-bold"
                      style={{
                        color: left >= 0 ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {currencySymbol}{formatter.format(left)}
                    </span>
                  </div>
                </div>
              ) : (
                // Show simple total when only one type exists
                <>
                  <div
                    className="mb-1 text-2xl font-bold"
                    style={{ color: 'var(--tl-color-text)' }}
                  >
                    {currencySymbol}{formatter.format(summary.total)}
                  </div>

                  <div
                    className="text-xs"
                    style={{ color: 'var(--tl-color-text-2)' }}
                  >
                    {summary.budgetBlockCount} budget block{summary.budgetBlockCount === 1 ? '' : 's'}
                  </div>
                </>
              )}

              {!summary.currency && summary.budgetBlockCount > 0 && (
                <div
                  className="mt-2 text-xs italic"
                  style={{ color: 'var(--tl-color-warn)' }}
                >
                  Mixed currencies
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}