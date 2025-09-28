import { useEditor, useValue, DefaultStylePanel, DefaultStylePanelContent } from '@tldraw/tldraw'
import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import type { BudgetBlockShape } from '../../lib/whiteboard/BudgetBlock'
import { computeDimensionsForAmount } from '../../lib/whiteboard/BudgetBlock'

export function BudgetStylePanel() {
  const editor = useEditor()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  // Local state for immediate UI feedback - decoupled from tldraw shape state
  const [localName, setLocalName] = useState('')
  const [localAmount, setLocalAmount] = useState('')

  // Subscribe to selection changes so the panel reflects the latest state
  const selectedShapes = useValue('budget-style-panel:selection', () => editor.getSelectedShapes(), [editor])
  const budgetBlocks = useMemo(
    () =>
      selectedShapes.filter(
        (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
      ),
    [selectedShapes]
  )

  const budgetBlockSignature = budgetBlocks
    .map(block => `${block.id}:${block.props.name}:${block.props.amount}`)
    .join('|')

  // Initialize local state when selection changes
  useEffect(() => {
    const currentBudgetBlocks = editor.getSelectedShapes().filter(
      (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
    )

    if (currentBudgetBlocks.length === 0) {
      setLocalName('')
      setLocalAmount('')
      return
    }

    const firstBlock = currentBudgetBlocks[0]
    const allSameName = currentBudgetBlocks.every(block => block.props.name === firstBlock.props.name)
    const allSameAmount = currentBudgetBlocks.every(block => block.props.amount === firstBlock.props.amount)

    setLocalName(allSameName ? firstBlock.props.name : '')
    setLocalAmount(allSameAmount ? firstBlock.props.amount.toString() : '')
  }, [editor, budgetBlockSignature])

  // Sync local state to tldraw shapes - only called on blur/enter
  const syncNameToShape = useCallback((name: string) => {
    const currentBudgetBlocks = editor.getSelectedShapes().filter(
      (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
    )
    if (currentBudgetBlocks.length > 0) {
      editor.updateShapes(
        currentBudgetBlocks.map(shape => ({
          id: shape.id,
          props: { name }
        }))
      )
    }
  }, [editor])

  const syncAmountToShape = useCallback((amount: number) => {
    const currentBudgetBlocks = editor.getSelectedShapes().filter(
      (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
    )
    if (currentBudgetBlocks.length > 0) {
      editor.updateShapes(
        currentBudgetBlocks.map(shape => {
          const { w, h } = computeDimensionsForAmount(amount, shape.props.w, shape.props.h)

          return {
            id: shape.id,
            props: {
              amount,
              w,
              h,
            },
          }
        })
      )
    }
  }, [editor])

  const handleTypeChange = useCallback((newType: 'income' | 'expense') => {
    const currentBudgetBlocks = editor.getSelectedShapes().filter(
      (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
    )
    editor.updateShapes(
      currentBudgetBlocks.map(shape => ({
        id: shape.id,
        props: {
          type: newType,
          color: newType === 'income' ? 'green' : 'red'
        }
      }))
    )
  }, [editor])

  // If no budget blocks are selected, show default panel
  if (selectedShapes.length === 0) {
    return null
  }

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

  const allSameType = hasMultiple ? budgetBlocks.every(block => block.props.type === firstBlock.props.type) : true
  const allSameCurrency = hasMultiple ? budgetBlocks.every(block => block.props.currency === firstBlock.props.currency) : true

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
            ref={nameInputRef}
            type="text"
            value={localName}
            placeholder={budgetBlocks.length > 1 ? 'Mixed names' : ''}
            onChange={(e) => {
              setLocalName(e.target.value)
            }}
            onBlur={(e) => {
              syncNameToShape(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                syncNameToShape(localName)
                e.currentTarget.blur()
              }
            }}
            style={{
              backgroundColor: '#fef3c7 !important',
              border: '3px solid #ef4444 !important',
              color: '#000000 !important',
              fontWeight: 'bold !important',
              fontSize: '14px !important'
            }}
            className="w-full px-2 py-1"
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
              ref={amountInputRef}
              type="number"
              min="0"
              step="0.01"
              value={localAmount}
              placeholder={budgetBlocks.length > 1 ? 'Mixed' : ''}
              onChange={(e) => {
                setLocalAmount(e.target.value)
              }}
              onBlur={(e) => {
                const value = parseFloat(e.target.value)
                if (!isNaN(value) && value >= 0) {
                  syncAmountToShape(value)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseFloat(localAmount)
                  if (!isNaN(value) && value >= 0) {
                    syncAmountToShape(value)
                    e.currentTarget.blur()
                  }
                }
              }}
              style={{
                backgroundColor: '#fef3c7 !important',
                border: '3px solid #ef4444 !important',
                color: '#000000 !important',
                fontWeight: 'bold !important',
                fontSize: '14px !important'
              }}
              className="flex-1 px-2 py-1"
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
