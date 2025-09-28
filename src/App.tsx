import { useState } from 'react'
import { Whiteboard } from './components/business/Whiteboard'

type BudgetMode = 'select' | 'income' | 'expense'

function App() {
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('select')

  const handleAddIncome = () => {
    console.log('Add Income clicked')
    setBudgetMode('income') // This will trigger the useEffect in Whiteboard
  }

  const handleAddExpense = () => {
    console.log('Add Expense clicked')
    setBudgetMode('expense') // This will trigger the useEffect in Whiteboard
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
              onClick={handleAddIncome}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                budgetMode === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              + Add Income
            </button>

            <button
              onClick={handleAddExpense}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                budgetMode === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              + Add Expense
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
          <span className="ml-2">Click buttons to add €100 shapes</span>
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
