import { useCallback, useRef, useEffect } from 'react';
import { Tldraw, Editor, type TLUiOverrides, createShapeId } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { BudgetBlockUtil, computeDimensionsForAmount } from '../../lib/whiteboard/BudgetBlock';
import type { BudgetBlockShape } from '../../lib/whiteboard/BudgetBlock';
import type { TLFrameShape, TLParentId, TLShape, TLShapeId } from '@tldraw/tlschema';
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
};

const isFrameShape = (shape: TLShape | null | undefined): shape is TLFrameShape =>
  Boolean(shape && shape.type === 'frame');

const isBudgetBlockShape = (shape: TLShape | null | undefined): shape is BudgetBlockShape =>
  Boolean(shape && shape.type === 'budget-block');

const isFrameSummaryShape = (shape: TLShape | null | undefined): shape is FrameSummaryShape =>
  Boolean(shape && shape.type === 'frame-summary');

const collectBudgetBlockData = (editor: Editor, parentId: TLParentId): BudgetBlockAggregate => {
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
      // Skip savings blocks when they're inside their source frame
      if (child.props.isSavingsBlock && child.props.sourceFrameId === parentId) {
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

    // Skip frames without budget blocks
    if (aggregate.count === 0) {
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
          currency,
          hasIncome: aggregate.incomeCount > 0,
          hasExpense: aggregate.expenseCount > 0,
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
          h: 150,
          frameId: frame.id,
          frameName: frame.props.name || '',
          incomeTotal: aggregate.incomeTotal,
          expenseTotal: aggregate.expenseTotal,
          currency,
          hasIncome: aggregate.incomeCount > 0,
          hasExpense: aggregate.expenseCount > 0,
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
      isBudgetBlockShape(shape) && shape.props.isSavingsBlock && shape.props.sourceFrameId !== ''
  );

  for (const block of savingsBlocks) {
    const sourceFrameId = block.props.sourceFrameId;
    const sourceFrame = editor.getShape(sourceFrameId);

    // If source frame doesn't exist or isn't a frame, skip
    if (!sourceFrame || !isFrameShape(sourceFrame)) {
      continue;
    }

    // Calculate current savings from the source frame
    const aggregate = collectBudgetBlockData(editor, sourceFrameId);
    const savings = Math.max(aggregate.incomeTotal - aggregate.expenseTotal, 0);

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
      onEditorReady?.(editor);
    },
    [applyEditorTheme, mode, onEditorReady, setupFrameSummaryTracking, setupFrameSummaryShapeSync, setupSavingsBlockSync]
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
  }, [setupFrameSummaryTracking, setupFrameSummaryShapeSync, setupSavingsBlockSync]);

  useEffect(() => {
    return () => {
      frameSummaryCleanupRef.current?.();
      frameSummaryCleanupRef.current = null;

      summaryShapeCleanupRef.current?.();
      summaryShapeCleanupRef.current = null;

      savingsBlockCleanupRef.current?.();
      savingsBlockCleanupRef.current = null;

      if (onFrameBudgetSummaryChange) {
        onFrameBudgetSummaryChange(null);
      }

      lastFrameSummaryRef.current = null;
    };
  }, [onFrameBudgetSummaryChange]);

  return (
    <div className="relative h-full w-full bg-[var(--app-background)] transition-colors">
      <div className="h-full w-full pt-20">
        <Tldraw
          persistenceKey={persistenceId}
          onMount={handleMount}
          shapeUtils={[BudgetBlockUtil, FrameSummaryUtil]}
          tools={customTools}
          overrides={uiOverrides}
          inferDarkMode={false}
          components={{
            StylePanel: BudgetStylePanel,
            ContextMenu: BudgetContextMenu,
          }}
        />
      </div>
    </div>
  );
}
