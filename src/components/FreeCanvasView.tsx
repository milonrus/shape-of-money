import type { FC } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Whiteboard, type BudgetMode } from './business/Whiteboard';

type FreeCanvasViewProps = {
  budgetMode: BudgetMode;
  onModeChange: (mode: BudgetMode) => void;
};

export const FreeCanvasView: FC<FreeCanvasViewProps> = ({
  budgetMode,
  onModeChange,
}) => {

  return (
    <div className="relative h-screen w-full bg-[var(--app-background)] text-[var(--app-text-primary)] transition-colors">
      {/* Minimal floating header in top-right corner */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 9999 }}>
        <div className="pointer-events-auto absolute right-6 top-6 flex items-center gap-3 whitespace-nowrap">
          <h1 className="text-sm font-semibold text-[var(--app-text-primary)] whitespace-nowrap">Shape of Money</h1>
          <ThemeToggle size="compact" />
        </div>
      </div>

      {/* Full-screen canvas */}
      <Whiteboard
        budgetMode={budgetMode}
        onModeChange={onModeChange}
      />
    </div>
  );
};
