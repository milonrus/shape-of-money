import type { FC } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Whiteboard, type BudgetMode } from './business/Whiteboard';

type FreeCanvasViewProps = {
  budgetMode: BudgetMode;
  onModeChange: (mode: BudgetMode) => void;
  onBackToDashboard: () => void;
};

export const FreeCanvasView: FC<FreeCanvasViewProps> = ({
  budgetMode,
  onModeChange,
  onBackToDashboard,
}) => {
  const handleBudgetBlockMode = () => {
    onModeChange('budget-block');
  };

  const handleSelectMode = () => {
    onModeChange('select');
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[var(--app-background)] text-[var(--app-text-primary)] transition-colors">
      <header className="border-b border-slate-200 bg-[var(--app-surface)] px-6 py-4 shadow-sm transition-colors dark:border-slate-700 dark:bg-[var(--app-surface-muted)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-fit rounded-lg border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-slate-500"
            >
              Back to dashboard
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--app-text-primary)]">Shape of Money</h1>
              <p className="text-sm text-[var(--app-text-secondary)]">Visual budgeting whiteboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBudgetBlockMode}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                budgetMode === 'budget-block'
                  ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500 dark:text-slate-900'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20'
              }`}
            >
              Budget Block (B)
            </button>

            <button
              type="button"
              onClick={handleSelectMode}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                budgetMode === 'select'
                  ? 'bg-slate-700 text-white shadow-sm dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700/40 dark:text-slate-200 dark:hover:bg-slate-600/60'
              }`}
            >
              Select
            </button>
            <ThemeToggle size="compact" />
          </div>
        </div>

        <div className="mt-2 text-sm text-[var(--app-text-muted)]">
          Mode: <span className="font-semibold">{budgetMode}</span>
          <span className="ml-2">
            {budgetMode === 'budget-block'
              ? 'Click and drag on canvas to draw budget blocks'
              : 'Select Budget Block tool or use keyboard shortcut (B)'}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-[var(--app-background)] transition-colors">
        <Whiteboard budgetMode={budgetMode} onModeChange={onModeChange} />
      </main>
    </div>
  );
};
