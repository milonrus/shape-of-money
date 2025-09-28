import type { FC } from 'react';
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
    console.log('BudgetBlock tool selected');
    onModeChange('budget-block');
  };

  const handleSelectMode = () => {
    onModeChange('select');
  };

  return (
    <div className="flex h-screen w-full flex-col bg-white text-gray-900">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-fit rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Back to dashboard
            </button>
            <div>
              <h1 className="text-2xl font-bold">Shape of Money</h1>
              <p className="text-sm text-gray-700">Visual budgeting whiteboard</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBudgetBlockMode}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                budgetMode === 'budget-block'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Budget Block (B)
            </button>

            <button
              type="button"
              onClick={handleSelectMode}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                budgetMode === 'select'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Select
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Mode: <span className="font-semibold">{budgetMode}</span>
          <span className="ml-2">
            {budgetMode === 'budget-block'
              ? 'Click and drag on canvas to draw budget blocks'
              : 'Select Budget Block tool or use keyboard shortcut (B)'}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Whiteboard budgetMode={budgetMode} onModeChange={onModeChange} />
      </main>
    </div>
  );
};
