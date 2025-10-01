import { useCallback, useRef, useEffect } from 'react';
import { Tldraw, Editor, type TLUiOverrides, createShapeId, toRichText, renderPlaintextFromRichText } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { BudgetBlockUtil, computeDimensionsForAmount } from '../../lib/whiteboard/BudgetBlock';
import type { BudgetBlockShape } from '../../lib/whiteboard/BudgetBlock';
import type { TLFrameShape, TLParentId, TLShape, TLShapeId, TLArrowShape } from '@tldraw/tlschema';
import { BudgetBlockTool } from '../../lib/whiteboard/BudgetBlockTool';
import { BudgetStylePanel } from './BudgetStylePanel';
import { BudgetContextMenu } from './BudgetContextMenu';
import { FrameSummaryUtil, type FrameSummaryShape } from '../../lib/whiteboard/FrameSummaryShape';
import { useTheme, type ThemeMode } from '../../lib/theme/ThemeProvider';

export type BudgetMode = 'select' | 'budget-block';

export type FrameBudgetSummary = {
  frameId: TLShapeId;
  frameName: string;
  total: number;
  currency: string | null;
  budgetBlockCount: number;
};

interface WhiteboardProps {
  budgetMode: BudgetMode;
  onModeChange: (mode: BudgetMode) => void;
  onEditorReady?: (editor: Editor) => void;
  persistenceKey?: string;
  onFrameBudgetSummaryChange?: (summary: FrameBudgetSummary | null) => void;
}

const DEFAULT_PERSISTENCE_KEY = 'shape-of-money-whiteboard';

// Tools array for tldraw
const customTools = [BudgetBlockTool];

// UI overrides to add BudgetBlock tool to toolbar
const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    tools['budget-block'] = {
      id: 'budget-block',
      icon: 'geo-rectangle',
      label: 'Budget Block',
      kbd: 'b',
      onSelect: () => {
        editor.setCurrentTool('budget-block');
      },
    };
    return tools;
  },
};

type BudgetBlockAggregate = {
  total: number;
  count: number;
  currencies: Set<string>;
  incomeTotal: number;
  expenseTotal: number;
  incomeCount: number;
  expenseCount: number;
  savingsTotal: number;
  savingsCount: number;
};

const isFrameShape = (shape: TLShape | null | undefined): shape is TLFrameShape =>
  Boolean(shape && shape.type === 'frame');

const isBudgetBlockShape = (shape: TLShape | null | undefined): shape is BudgetBlockShape =>
  Boolean(shape && shape.type === 'budget-block');

const isFrameSummaryShape = (shape: TLShape | null | undefined): shape is FrameSummaryShape =>
  Boolean(shape && shape.type === 'frame-summary');

const isArrowShape = (shape: TLShape | null | undefined): shape is TLArrowShape =>
  Boolean(shape && shape.type === 'arrow');

// Parse allocation amount from arrow text label
const parseArrowAllocation = (editor: Editor, arrow: TLArrowShape): number | null => {
  if (!arrow.props.richText) return null;

  try {
    const plainText = renderPlaintextFromRichText(editor, arrow.props.richText);
    if (!plainText || plainText.trim() === '') return null;

    // Extract numeric value from text (handles formats like "300", "€300", "300 EUR")
    const numericMatch = plainText.match(/[\d.,]+/);
    if (!numericMatch) return null;

    const parsed = parseFloat(numericMatch[0].replace(',', ''));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  } catch (e) {
    return null;
  }
};

// Get all arrows connected to a savings block (both from and to the block)
const getSavingsBlockArrows = (editor: Editor, savingsBlockId: TLShapeId): TLArrowShape[] => {
  const arrows: TLArrowShape[] = [];

  // Get arrows pointing TO the savings block
  const bindingsTo = editor.getBindingsToShape(savingsBlockId, 'arrow');
  for (const binding of bindingsTo) {
    const arrow = editor.getShape(binding.fromId);
    if (arrow && isArrowShape(arrow)) {
      arrows.push(arrow);
    }
  }

  // Get arrows pointing FROM the savings block
  const bindingsFrom = editor.getBindingsFromShape(savingsBlockId, 'arrow');
  for (const binding of bindingsFrom) {
    const arrow = editor.getShape(binding.fromId);
    if (arrow && isArrowShape(arrow)) {
      arrows.push(arrow);
    }
  }

  // Deduplicate
  return Array.from(new Set(arrows));
};

// Collect savings blocks that are linked to a frame via arrows
const collectArrowBoundSavings = (editor: Editor, frameId: TLShapeId): { savingsTotal: number; savingsCount: number; currencies: Set<string> } => {
  const result = {
    savingsTotal: 0,
    savingsCount: 0,
    currencies: new Set<string>(),
  };

  // Track which savings blocks we've seen to avoid double-counting
  const processedSavingsBlocks = new Set<TLShapeId>();

  // Get all arrow bindings pointing TO this frame
  const bindingsToFrame = editor.getBindingsToShape(frameId, 'arrow');

  for (const binding of bindingsToFrame) {
    // Get the arrow shape
    const arrowShape = editor.getShape(binding.fromId);
    if (!arrowShape || !isArrowShape(arrowShape)) continue;

    // Get all bindings FROM this arrow to find the other end
    const arrowBindings = editor.getBindingsFromShape(arrowShape.id, 'arrow');

    for (const arrowBinding of arrowBindings) {
      // Skip the binding to the frame itself
      if (arrowBinding.toId === frameId) continue;

      // Check if the other end is a savings block
      const savingsBlock = editor.getShape(arrowBinding.toId);
      if (!savingsBlock || !isBudgetBlockShape(savingsBlock)) continue;
      if (savingsBlock.props.type !== 'savings') continue;

      // Try to parse allocation from arrow text
      const allocation = parseArrowAllocation(editor, arrowShape);

      // Get total amount from savings block
      const totalAmount = typeof savingsBlock.props.amount === 'number' && Number.isFinite(savingsBlock.props.amount)
        ? savingsBlock.props.amount
        : 0;

      let amountToAdd = 0;

      if (allocation !== null) {
        // Use explicit allocation from arrow text
        amountToAdd = Math.min(allocation, totalAmount);
      } else {
        // No text on arrow - check if this is the only arrow from this savings block
        const allArrows = getSavingsBlockArrows(editor, savingsBlock.id);
        if (allArrows.length === 1) {
          // Single arrow, no text = 100% allocation
          amountToAdd = totalAmount;
        } else {
          // Multiple arrows but this one has no text - skip it (validation error)
          continue;
        }
      }

      result.savingsTotal += amountToAdd;

      // Only increment count if we haven't seen this savings block before
      if (!processedSavingsBlocks.has(savingsBlock.id)) {
        result.savingsCount += 1;
        processedSavingsBlocks.add(savingsBlock.id);
      }

      const currency = savingsBlock.props.currency;
      if (typeof currency === 'string' && currency.trim() !== '') {
        result.currencies.add(currency);
      }
    }
  }

  return result;
};

// Track remainder arrow states to detect user deletions
const remainderArrowStates = new Map<TLShapeId, boolean>();

// Sync arrow allocations: auto-create/update/delete remainder arrows
function syncArrowAllocations(editor: Editor) {
  const allShapes = editor.getCurrentPageShapes();
  const savingsBlocks = allShapes.filter(
    (shape): shape is BudgetBlockShape => isBudgetBlockShape(shape) && shape.props.type === 'savings'
  );

  for (const savingsBlock of savingsBlocks) {
    const totalAmount = typeof savingsBlock.props.amount === 'number' && Number.isFinite(savingsBlock.props.amount)
      ? savingsBlock.props.amount
      : 0;

    if (totalAmount <= 0) continue;

    // Get all arrows from this savings block
    const arrows = getSavingsBlockArrows(editor, savingsBlock.id);

    // Calculate total allocated amount (excluding remainder arrow)
    const remainderArrowId = createShapeId(`remainder-arrow-${savingsBlock.id}`);
    const nonRemainderArrows = arrows.filter(arrow => arrow.id !== remainderArrowId);
    let totalAllocated = 0;

    for (const arrow of nonRemainderArrows) {
      const allocation = parseArrowAllocation(editor, arrow);

      if (allocation !== null) {
        totalAllocated += allocation;
      } else {
        // Arrow with no text - assume 100% if it's the only arrow
        if (arrows.length === 1) {
          totalAllocated = totalAmount;
        }
      }
    }

    // Calculate remainder
    const remainder = totalAmount - totalAllocated;

    // Check if remainder arrow exists now and existed before
    const existingRemainderArrow = editor.getShape(remainderArrowId);
    const remainderExistedBefore = remainderArrowStates.get(savingsBlock.id) === true;
    const remainderExistsNow = existingRemainderArrow && isArrowShape(existingRemainderArrow);

    // Detect if user deleted the remainder arrow
    const remainderWasDeleted = remainderExistedBefore && !remainderExistsNow && remainder > 0;

    if (remainderWasDeleted && nonRemainderArrows.length > 0) {
      // User deleted remainder arrow - redistribute 100% across remaining arrows
      const arrowsWithAllocation = nonRemainderArrows.filter(arrow => parseArrowAllocation(editor, arrow) !== null);

      if (arrowsWithAllocation.length > 0) {
        // Calculate proportions
        const totalCurrentAllocation = arrowsWithAllocation.reduce((sum, arrow) => {
          const allocation = parseArrowAllocation(editor, arrow);
          return sum + (allocation || 0);
        }, 0);

        if (totalCurrentAllocation > 0) {
          // Update each arrow proportionally
          for (const arrow of arrowsWithAllocation) {
            const currentAllocation = parseArrowAllocation(editor, arrow);
            if (currentAllocation !== null && currentAllocation > 0) {
              const proportion = currentAllocation / totalCurrentAllocation;
              const newAllocation = Math.round(totalAmount * proportion);

              editor.updateShape({
                id: arrow.id,
                type: 'arrow',
                props: {
                  richText: toRichText(newAllocation.toString()),
                },
              });
            }
          }
        }
      } else if (nonRemainderArrows.length === 1 && nonRemainderArrows[0]) {
        // Single arrow with no text - set to 100%
        editor.updateShape({
          id: nonRemainderArrows[0].id,
          type: 'arrow',
          props: {
            richText: toRichText(totalAmount.toString()),
          },
        });
      }

      // Mark that we've handled this deletion
      remainderArrowStates.set(savingsBlock.id, false);
      continue;
    }

    // Normal remainder arrow logic
    if (remainder > 0 && nonRemainderArrows.length > 0) {
      // Need remainder arrow
      const savingsBlockBounds = editor.getShapePageBounds(savingsBlock);

      if (!savingsBlockBounds) continue;

      if (remainderExistsNow) {
        // Update existing remainder arrow text
        editor.updateShape({
          id: remainderArrowId,
          type: 'arrow',
          props: {
            richText: toRichText(remainder.toString()),
          },
        });
      } else {
        // Create new remainder arrow
        const startX = savingsBlockBounds.x + savingsBlockBounds.w / 2;
        const startY = savingsBlockBounds.y + savingsBlockBounds.h;

        editor.createShape({
          id: remainderArrowId,
          type: 'arrow',
          x: startX,
          y: startY,
          props: {
            start: { x: 0, y: 0 },
            end: { x: 0, y: 100 },
            richText: toRichText(remainder.toString()),
          },
        });

        // Bind the start of the arrow to the savings block
        editor.createBinding({
          type: 'arrow',
          fromId: remainderArrowId,
          toId: savingsBlock.id,
          props: {
            terminal: 'start',
            normalizedAnchor: { x: 0.5, y: 1 },
            isExact: false,
            isPrecise: false,
          },
        });
      }

      // Track that remainder arrow exists
      remainderArrowStates.set(savingsBlock.id, true);
    } else if (remainderExistsNow) {
      // No remainder needed, delete remainder arrow if it exists
      editor.deleteShape(remainderArrowId);
      remainderArrowStates.set(savingsBlock.id, false);
    } else {
      // No remainder arrow
      remainderArrowStates.set(savingsBlock.id, false);
    }
  }
}

const collectBudgetBlockData = (editor: Editor, parentId: TLParentId): BudgetBlockAggregate => {
  const aggregate: BudgetBlockAggregate = {
    total: 0,
    count: 0,
    currencies: new Set<string>(),
    incomeTotal: 0,
    expenseTotal: 0,
    incomeCount: 0,
    expenseCount: 0,
    savingsTotal: 0,
    savingsCount: 0,
  };

  const childIds = editor.getSortedChildIdsForParent(parentId);

  for (const childId of childIds) {
    const child = editor.getShape(childId);
    if (!child) continue;

    if (isBudgetBlockShape(child)) {
      // Skip savings blocks when they're inside their source frame
      if (child.props.type === 'savings' && child.props.sourceFrameId === parentId) {
        continue;
      }

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
      } else if (blockType === 'savings') {
        // Track incoming savings (from other frames)
        aggregate.savingsTotal += amount;
        aggregate.savingsCount += 1;
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
      aggregate.savingsTotal += nested.savingsTotal;
      aggregate.savingsCount += nested.savingsCount;
      nested.currencies.forEach((value) => aggregate.currencies.add(value));
    }
  }

  // Check if this parent is a frame, and if so, collect arrow-linked savings
  const parentShape = editor.getShape(parentId);
  if (parentShape && isFrameShape(parentShape)) {
    const arrowLinkedSavings = collectArrowBoundSavings(editor, parentShape.id);
    aggregate.savingsTotal += arrowLinkedSavings.savingsTotal;
    aggregate.savingsCount += arrowLinkedSavings.savingsCount;
    arrowLinkedSavings.currencies.forEach((currency) => aggregate.currencies.add(currency));
  }

  return aggregate;
};

const findActiveFrame = (editor: Editor): TLFrameShape | null => {
  const selectedShapes = editor.getSelectedShapes();
  if (selectedShapes.length === 0) {
    return null;
  }

  const directFrame = selectedShapes.find(isFrameShape);
  if (directFrame) {
    return directFrame;
  }

  const commonFrameId = editor.findCommonAncestor(selectedShapes, (shape) => shape.type === 'frame');
  if (commonFrameId) {
    const frame = editor.getShape(commonFrameId);
    if (isFrameShape(frame)) {
      return frame;
    }
  }

  for (const shape of selectedShapes) {
    const ancestor = editor.findShapeAncestor(shape, (parent) => parent.type === 'frame');
    if (isFrameShape(ancestor)) {
      return ancestor;
    }
  }

  return null;
};

const computeFrameBudgetSummary = (editor: Editor): FrameBudgetSummary | null => {
  const frame = findActiveFrame(editor);
  if (!frame) {
    return null;
  }

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
  };
};

const haveSummariesChanged = (prev: FrameBudgetSummary | null, next: FrameBudgetSummary | null) => {
  if (prev === next) {
    return false;
  }

  if (!prev || !next) {
    return prev !== next;
  }

  return (
    prev.frameId !== next.frameId ||
    prev.frameName !== next.frameName ||
    prev.total !== next.total ||
    prev.currency !== next.currency ||
    prev.budgetBlockCount !== next.budgetBlockCount
  );
};

// Sync frame summary shapes with frame contents
function syncFrameSummaryShapes(editor: Editor) {
  const allShapes = editor.getCurrentPageShapes();
  const frames = allShapes.filter(isFrameShape);
  const existingSummaries = allShapes.filter(isFrameSummaryShape);

  // Track which summary shapes we want to keep
  const summariesToKeep = new Set<TLShapeId>();

  // For each frame, create or update summary shape
  for (const frame of frames) {
    const aggregate = collectBudgetBlockData(editor, frame.id);

    // Skip frames without budget blocks AND without arrow-linked savings
    if (aggregate.count === 0 && aggregate.savingsCount === 0) {
      continue;
    }

    const frameBounds = editor.getShapePageBounds(frame);
    if (!frameBounds) continue;

    // Determine currency
    let currency = '';
    if (aggregate.currencies.size === 1) {
      const [singleCurrency] = aggregate.currencies;
      currency = singleCurrency;
    }

    // Calculate summary shape ID and position
    const summaryId = createShapeId(`frame-summary-${frame.id}`);
    summariesToKeep.add(summaryId);

    // Position summary to the right of the frame (50 units offset in page space)
    const summaryX = frameBounds.x + frameBounds.w + 50;
    const summaryY = frameBounds.y;

    // Check if summary already exists
    const existingSummary = editor.getShape(summaryId) as FrameSummaryShape | undefined;

    if (existingSummary && isFrameSummaryShape(existingSummary)) {
      // Update existing summary (preserve position if manually positioned)
      const updateData: any = {
        id: summaryId,
        type: 'frame-summary',
        props: {
          frameId: frame.id,
          frameName: frame.props.name || '',
          incomeTotal: aggregate.incomeTotal,
          expenseTotal: aggregate.expenseTotal,
          savingsTotal: aggregate.savingsTotal,
          currency,
          hasIncome: aggregate.incomeCount > 0,
          hasExpense: aggregate.expenseCount > 0,
          hasSavings: aggregate.savingsCount > 0,
          // Preserve the flag if it exists, default to false for legacy shapes
          isManuallyPositioned: existingSummary.props.isManuallyPositioned ?? false,
        },
      };

      // Only update position if not manually positioned
      if (!existingSummary.props.isManuallyPositioned) {
        updateData.x = summaryX;
        updateData.y = summaryY;
      }

      editor.updateShape(updateData);
    } else {
      // Create new summary shape
      editor.createShape({
        id: summaryId,
        type: 'frame-summary',
        x: summaryX,
        y: summaryY,
        props: {
          w: 300,
          h: 200,
          frameId: frame.id,
          frameName: frame.props.name || '',
          incomeTotal: aggregate.incomeTotal,
          expenseTotal: aggregate.expenseTotal,
          savingsTotal: aggregate.savingsTotal,
          currency,
          hasIncome: aggregate.incomeCount > 0,
          hasExpense: aggregate.expenseCount > 0,
          hasSavings: aggregate.savingsCount > 0,
          isManuallyPositioned: false,
        },
      });
    }
  }

  // Delete summary shapes that are no longer needed
  for (const summary of existingSummaries) {
    if (!summariesToKeep.has(summary.id)) {
      editor.deleteShape(summary.id);
    }
  }
}

// Sync savings blocks with their source frames
function syncSavingsBlocks(editor: Editor) {
  const allShapes = editor.getCurrentPageShapes();
  const savingsBlocks = allShapes.filter(
    (shape): shape is BudgetBlockShape =>
      isBudgetBlockShape(shape) && shape.props.type === 'savings' && shape.props.sourceFrameId !== ''
  );

  for (const block of savingsBlocks) {
    const sourceFrameId = block.props.sourceFrameId;
    const sourceFrame = editor.getShape(sourceFrameId);

    // If source frame doesn't exist or isn't a frame, skip
    if (!sourceFrame || !isFrameShape(sourceFrame)) {
      continue;
    }

    // Calculate current savings from the source frame (including arrow-linked savings)
    const aggregate = collectBudgetBlockData(editor, sourceFrameId);
    const savings = Math.max(aggregate.savingsTotal + aggregate.incomeTotal - aggregate.expenseTotal, 0);

    // Only update if amount changed
    if (block.props.amount !== savings) {
      // Calculate new dimensions maintaining aspect ratio
      const { w, h } = computeDimensionsForAmount(savings, block.props.w, block.props.h);

      editor.updateShape({
        id: block.id,
        type: 'budget-block',
        props: {
          amount: savings,
          w,
          h,
        },
      });
    }
  }
}

export function Whiteboard({
  budgetMode,
  onEditorReady,
  persistenceKey,
  onFrameBudgetSummaryChange,
}: WhiteboardProps) {
  const editorRef = useRef<Editor | null>(null);
  const lastFrameSummaryRef = useRef<FrameBudgetSummary | null>(null);
  const frameSummaryCleanupRef = useRef<(() => void) | null>(null);
  const summaryShapeCleanupRef = useRef<(() => void) | null>(null);
  const savingsBlockCleanupRef = useRef<(() => void) | null>(null);
  const arrowAllocationCleanupRef = useRef<(() => void) | null>(null);
  const persistenceId = persistenceKey ?? DEFAULT_PERSISTENCE_KEY;
  const { mode } = useTheme();

  const applyEditorTheme = useCallback((editor: Editor | null, themeMode: ThemeMode) => {
    if (!editor) {
      return;
    }
    editor.user.updateUserPreferences({ colorScheme: themeMode });
  }, []);

  // Setup sync for frame summary shapes
  const setupFrameSummaryShapeSync = useCallback((editor: Editor) => {
    // Clean up previous listener
    summaryShapeCleanupRef.current?.();
    summaryShapeCleanupRef.current = null;

    // Initial sync
    syncFrameSummaryShapes(editor);

    // Listen to store changes and sync
    const unsubscribe = editor.store.listen(() => {
      syncFrameSummaryShapes(editor);
    });

    summaryShapeCleanupRef.current = () => {
      unsubscribe();
    };
  }, []);

  // Setup sync for savings blocks
  const setupSavingsBlockSync = useCallback((editor: Editor) => {
    // Clean up previous listener
    savingsBlockCleanupRef.current?.();
    savingsBlockCleanupRef.current = null;

    // Initial sync
    syncSavingsBlocks(editor);

    // Listen to store changes and sync
    const unsubscribe = editor.store.listen(() => {
      syncSavingsBlocks(editor);
    });

    savingsBlockCleanupRef.current = () => {
      unsubscribe();
    };
  }, []);

  // Setup sync for arrow allocations (remainder arrows)
  const setupArrowAllocationSync = useCallback((editor: Editor) => {
    // Clean up previous listener
    arrowAllocationCleanupRef.current?.();
    arrowAllocationCleanupRef.current = null;

    // Initial sync
    syncArrowAllocations(editor);

    // Listen to store changes and sync
    const unsubscribe = editor.store.listen(() => {
      syncArrowAllocations(editor);
    });

    arrowAllocationCleanupRef.current = () => {
      unsubscribe();
    };
  }, []);

  const setupFrameSummaryTracking = useCallback(
    (editor: Editor) => {
      frameSummaryCleanupRef.current?.();
      frameSummaryCleanupRef.current = null;
      lastFrameSummaryRef.current = null;

      if (!onFrameBudgetSummaryChange) {
        return;
      }

      const emitSummary = () => {
        const nextSummary = computeFrameBudgetSummary(editor);
        if (!haveSummariesChanged(lastFrameSummaryRef.current, nextSummary)) {
          return;
        }

        lastFrameSummaryRef.current = nextSummary;
        onFrameBudgetSummaryChange(nextSummary);
      };

      emitSummary();

      const unsubscribe = editor.store.listen(() => {
        emitSummary();
      });

      frameSummaryCleanupRef.current = () => {
        unsubscribe();
      };
    },
    [onFrameBudgetSummaryChange]
  );

  // Handle external mode changes from header buttons
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (budgetMode === 'budget-block') {
      editor.setCurrentTool('budget-block');
    } else if (budgetMode === 'select') {
      editor.setCurrentTool('select');
    }
  }, [budgetMode]);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      applyEditorTheme(editor, mode);
      setupFrameSummaryTracking(editor);
      setupFrameSummaryShapeSync(editor);
      setupSavingsBlockSync(editor);
      setupArrowAllocationSync(editor);
      onEditorReady?.(editor);
    },
    [applyEditorTheme, mode, onEditorReady, setupFrameSummaryTracking, setupFrameSummaryShapeSync, setupSavingsBlockSync, setupArrowAllocationSync]
  );

  useEffect(() => {
    applyEditorTheme(editorRef.current, mode);
  }, [applyEditorTheme, mode]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    setupFrameSummaryTracking(editor);
    setupFrameSummaryShapeSync(editor);
    setupSavingsBlockSync(editor);
    setupArrowAllocationSync(editor);
  }, [setupFrameSummaryTracking, setupFrameSummaryShapeSync, setupSavingsBlockSync, setupArrowAllocationSync]);

  useEffect(() => {
    return () => {
      frameSummaryCleanupRef.current?.();
      frameSummaryCleanupRef.current = null;

      summaryShapeCleanupRef.current?.();
      summaryShapeCleanupRef.current = null;

      savingsBlockCleanupRef.current?.();
      savingsBlockCleanupRef.current = null;

      arrowAllocationCleanupRef.current?.();
      arrowAllocationCleanupRef.current = null;

      if (onFrameBudgetSummaryChange) {
        onFrameBudgetSummaryChange(null);
      }

      lastFrameSummaryRef.current = null;
    };
  }, [onFrameBudgetSummaryChange]);

  return (
    <div className="relative h-full w-full bg-[var(--app-background)] transition-colors">
      <div className="h-full w-full">
        <Tldraw
          persistenceKey={persistenceId}
          onMount={handleMount}
          shapeUtils={[BudgetBlockUtil, FrameSummaryUtil]}
          tools={customTools}
          overrides={uiOverrides}
          inferDarkMode={false}
          components={{
            MenuPanel: null,
            StylePanel: BudgetStylePanel,
            ContextMenu: BudgetContextMenu,
          }}
        />
      </div>
    </div>
  );
}
