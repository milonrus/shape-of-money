import { useState } from 'react'
import { Whiteboard } from './components/business/Whiteboard'

type BudgetMode = 'select' | 'budget-block'

function App() {
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('select')

  const handleBudgetBlockMode = () => {
    console.log('BudgetBlock tool selected')
    setBudgetMode('budget-block')
  }

  const handleModeChange = (mode: BudgetMode) => {
    setBudgetMode(mode)
  }

  return (
    <div className="w-full h-screen bg-white text-gray-900 flex flex-col">
      <header className="border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shape of Money</h1>
            <p className="text-sm text-gray-800">Visual budgeting whiteboard</p>
          </div>

          <div className="flex gap-3">
            <button
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
              onClick={() => handleModeChange('select')}
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

        {/* Status indicator */}
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
        <Whiteboard
          budgetMode={budgetMode}
          onModeChange={handleModeChange}
        />
      </main>
    </div>
  )
}

export default App
