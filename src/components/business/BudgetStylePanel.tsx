import { useEditor, DefaultStylePanel, DefaultStylePanelContent } from '@tldraw/tldraw'
import { useCallback } from 'react'
import type { BudgetBlockShape } from '../../lib/whiteboard/BudgetBlock'

export function BudgetStylePanel() {
  const editor = useEditor()

  // Get selected shapes and filter for budget blocks
  const selectedShapes = editor.getSelectedShapes()
  const budgetBlocks = selectedShapes.filter(
    (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
  )

  // Define callbacks first to avoid hook ordering issues
  const handleNameChange = useCallback((newName: string) => {
    const currentBudgetBlocks = editor.getSelectedShapes().filter(
      (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
    )
    editor.updateShapes(
      currentBudgetBlocks.map(shape => ({
        id: shape.id,
        type: shape.type,
        props: { ...shape.props, name: newName }
      }))
    )
  }, [editor])

  const handleAmountChange = useCallback((newAmount: number) => {
    const currentBudgetBlocks = editor.getSelectedShapes().filter(
      (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
    )
    editor.updateShapes(
      currentBudgetBlocks.map(shape => {
        // Calculate new dimensions using the same logic as BudgetBlock
        const globalScale = 1 // TODO: Get from store
        const targetArea = newAmount * globalScale
        const minSize = 24

        // Maintain current aspect ratio if possible
        const currentAspectRatio = shape.props.w / shape.props.h
        const newWidth = Math.max(minSize, Math.sqrt(targetArea * currentAspectRatio))
        const newHeight = Math.max(minSize, targetArea / newWidth)

        return {
          id: shape.id,
          type: shape.type,
          props: {
            ...shape.props,
            amount: newAmount,
            w: newWidth,
            h: newHeight
          }
        }
      })
    )
  }, [editor])

  const handleTypeChange = useCallback((newType: 'income' | 'expense') => {
    const currentBudgetBlocks = editor.getSelectedShapes().filter(
      (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
    )
    editor.updateShapes(
      currentBudgetBlocks.map(shape => ({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          type: newType,
          color: newType === 'income' ? 'green' : 'red'
        }
      }))
    )
  }, [editor])

  // If no budget blocks are selected, show default panel
  if (budgetBlocks.length === 0) {
    return (
      <DefaultStylePanel>
        <DefaultStylePanelContent />
      </DefaultStylePanel>
    )
  }

  // Determine if we have mixed values
  const hasMultiple = budgetBlocks.length > 1
  const firstBlock = budgetBlocks[0]

  const allSameName = budgetBlocks.every(block => block.props.name === firstBlock.props.name)
  const allSameAmount = budgetBlocks.every(block => block.props.amount === firstBlock.props.amount)
  const allSameType = budgetBlocks.every(block => block.props.type === firstBlock.props.type)
  const allSameCurrency = budgetBlocks.every(block => block.props.currency === firstBlock.props.currency)

  return (
    <DefaultStylePanel>
      <div className="budget-style-panel p-3 space-y-3">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Budget Properties
          {hasMultiple && (
            <span className="text-xs text-gray-500 ml-1">
              ({budgetBlocks.length} selected)
            </span>
          )}
        </div>

        {/* Name Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Name</label>
          <input
            type="text"
            value={allSameName ? firstBlock.props.name : ''}
            placeholder={allSameName ? '' : 'Mixed names'}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Amount</label>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-500">
              {allSameCurrency ? firstBlock.props.currency : '?'}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={allSameAmount ? firstBlock.props.amount : ''}
              placeholder={allSameAmount ? '' : 'Mixed'}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                if (!isNaN(value) && value >= 0) {
                  handleAmountChange(value)
                }
              }}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Type Toggle */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Type</label>
          <div className="flex space-x-2">
            <button
              onClick={() => handleTypeChange('income')}
              className={`flex-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
                allSameType && firstBlock.props.type === 'income'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
                allSameType && firstBlock.props.type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expense
            </button>
          </div>
          {!allSameType && (
            <div className="text-xs text-gray-500 italic">Mixed types selected</div>
          )}
        </div>

        {/* Area Information */}
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {hasMultiple ? (
              `${budgetBlocks.length} shapes selected`
            ) : (
              `Area: ${Math.round(firstBlock.props.w * firstBlock.props.h)}px²`
            )}
          </div>
        </div>
      </div>
    </DefaultStylePanel>
  )
}