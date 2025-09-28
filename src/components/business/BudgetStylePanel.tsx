import {
  useEditor,
  useValue,
  DefaultStylePanel,
  DefaultStylePanelContent,
  getDefaultColorTheme,
  TldrawUiInput,
  TldrawUiSlider,
} from '@tldraw/tldraw'
import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { defaultColorNames } from '@tldraw/tlschema'
import type { BudgetBlockShape } from '../../lib/whiteboard/BudgetBlock'
import { computeDimensionsForAmount } from '../../lib/whiteboard/BudgetBlock'

export function BudgetStylePanel() {
  const editor = useEditor()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  // Local state for immediate UI feedback - decoupled from tldraw shape state
  const [localName, setLocalName] = useState('')
  const [localAmount, setLocalAmount] = useState('')
  const [localOpacity, setLocalOpacity] = useState(1)

  // Subscribe to selection changes so the panel reflects the latest state
  const selectedShapes = useValue('budget-style-panel:selection', () => editor.getSelectedShapes(), [editor])
  const budgetBlocks = useMemo(
    () =>
      selectedShapes.filter(
        (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
      ),
    [selectedShapes]
  )

  const colorTheme = useMemo(() => getDefaultColorTheme({ isDarkMode: false }), [])
  const colorOptions = useMemo(() => [...defaultColorNames], [])

  const resolveColorValue = useCallback(
    (colorName: string) => {
      const colorEntry = colorTheme[colorName as keyof typeof colorTheme]
      if (colorEntry && typeof colorEntry === 'object' && 'solid' in colorEntry) {
        return colorEntry.solid as string
      }
      return colorName
    },
    [colorTheme]
  )

  // DEBUG: Log color data to understand what we're working with
  useEffect(() => {
    console.log('🎨 COLOR DEBUG:')
    console.log('defaultColorNames:', defaultColorNames)
    console.log('colorOptions:', colorOptions)
    console.log('colorTheme:', colorTheme)

    colorOptions.forEach((colorName, index) => {
      const resolvedValue = resolveColorValue(colorName)
      console.log(`Color ${index}: ${colorName} -> ${resolvedValue}`)
    })
  }, [colorOptions, colorTheme, resolveColorValue])

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
      setLocalOpacity(1)
      return
    }

    const firstBlock = currentBudgetBlocks[0]
    if (!firstBlock) {
      setLocalName('')
      setLocalAmount('')
      return
    }

    const allSameName = currentBudgetBlocks.every(block => block.props.name === firstBlock.props.name)
    const allSameAmount = currentBudgetBlocks.every(block => block.props.amount === firstBlock.props.amount)
    const allSameOpacity = currentBudgetBlocks.every(block => block.props.opacity === firstBlock.props.opacity)

    setLocalName(allSameName ? firstBlock.props.name : '')
    setLocalAmount(allSameAmount ? firstBlock.props.amount.toString() : '')
    setLocalOpacity(allSameOpacity ? firstBlock.props.opacity : firstBlock.props.opacity)
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
          type: 'budget-block' as const,
          props: { name },
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
            type: 'budget-block' as const,
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

  const handleColorChange = useCallback((newColor: string) => {
    const currentBudgetBlocks = editor.getSelectedShapes().filter(
      (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
    )

    if (currentBudgetBlocks.length === 0) {
      return
    }

    editor.updateShapes(
      currentBudgetBlocks.map(shape => ({
        id: shape.id,
        type: 'budget-block' as const,
        props: {
          color: newColor,
        },
      }))
    )
  }, [editor])

  const handleTypeChange = useCallback((newType: 'income' | 'expense') => {
    const currentBudgetBlocks = editor.getSelectedShapes().filter(
      (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
    )
    editor.updateShapes(
      currentBudgetBlocks.map(shape => ({
        id: shape.id,
        type: 'budget-block' as const,
        props: {
          type: newType,
          color:
            shape.props.color === (shape.props.type === 'income' ? 'green' : 'red')
              ? newType === 'income'
                ? 'green'
                : 'red'
              : shape.props.color,
        },
      }))
    )
  }, [editor])

  const hasSelection = selectedShapes.length > 0
  const hasBudgetBlocks = budgetBlocks.length > 0
  const hasMultiple = budgetBlocks.length > 1
  const firstBlock = budgetBlocks[0]

  const firstBlockName = firstBlock?.props.name ?? ''
  const firstBlockAmount = firstBlock?.props.amount ?? 0
  const firstBlockCurrency = firstBlock?.props.currency ?? ''
  const firstBlockType: 'income' | 'expense' = firstBlock?.props.type ?? 'income'
  const firstBlockColor = firstBlock?.props.color ?? 'green'
  const firstBlockOpacity = firstBlock?.props.opacity ?? 1

  const allSameName = firstBlock
    ? hasMultiple
      ? budgetBlocks.every(block => block.props.name === firstBlockName)
      : true
    : true
  const allSameAmount = firstBlock
    ? hasMultiple
      ? budgetBlocks.every(block => block.props.amount === firstBlockAmount)
      : true
    : true
  const allSameType = firstBlock
    ? hasMultiple
      ? budgetBlocks.every(block => block.props.type === firstBlockType)
      : true
    : true
  const allSameCurrency = firstBlock
    ? hasMultiple
      ? budgetBlocks.every(block => block.props.currency === firstBlockCurrency)
      : true
    : true
  const allSameColor = firstBlock
    ? hasMultiple
      ? budgetBlocks.every(block => block.props.color === firstBlockColor)
      : true
    : true
  const allSameOpacity = firstBlock
    ? hasMultiple
      ? budgetBlocks.every(block => block.props.opacity === firstBlockOpacity)
      : true
    : true

  useEffect(() => {
    if (!hasBudgetBlocks) {
      return
    }
    amountInputRef.current?.setAttribute('inputmode', 'decimal')
  }, [hasBudgetBlocks])

  const handleColorToggle = useCallback(
    (value: string) => {
      if (value) {
        handleColorChange(value)
      }
    },
    [handleColorChange]
  )

  const handleOpacityChange = useCallback(
    (sliderValue: number) => {
      if (!hasBudgetBlocks) {
        return
      }

      const normalized = Math.min(Math.max(sliderValue / 100, 0), 1)
      setLocalOpacity(normalized)

      const currentBudgetBlocks = editor.getSelectedShapes().filter(
        (shape): shape is BudgetBlockShape => shape.type === 'budget-block'
      )

      if (currentBudgetBlocks.length === 0) {
        return
      }

      editor.updateShapes(
        currentBudgetBlocks.map((shape) => ({
          id: shape.id,
          type: 'budget-block' as const,
          props: {
            opacity: normalized,
          },
        }))
      )
    },
    [editor, hasBudgetBlocks]
  )

  const handleNameComplete = useCallback(
    (value: string) => {
      syncNameToShape(value)
    },
    [syncNameToShape]
  )

  const handleNameCancel = useCallback(() => {
    if (!hasBudgetBlocks) {
      setLocalName('')
      return
    }

    if (hasMultiple && !allSameName) {
      setLocalName('')
    } else {
      setLocalName(firstBlockName)
    }
  }, [allSameName, firstBlockName, hasBudgetBlocks, hasMultiple])

  const commitAmountFromString = useCallback(
    (value: string) => {
      if (!hasBudgetBlocks) {
        setLocalAmount('')
        return
      }

      const trimmed = value.trim()
      if (trimmed === '') {
        setLocalAmount(hasMultiple && !allSameAmount ? '' : firstBlockAmount.toString())
        return
      }

      const parsed = parseFloat(trimmed)
      if (Number.isNaN(parsed) || parsed < 0) {
        setLocalAmount(hasMultiple && !allSameAmount ? '' : firstBlockAmount.toString())
        return
      }

      if (parsed === firstBlockAmount && allSameAmount) {
        setLocalAmount(parsed.toString())
        return
      }

      syncAmountToShape(parsed)
      setLocalAmount(parsed.toString())
    },
    [allSameAmount, firstBlockAmount, hasBudgetBlocks, hasMultiple, syncAmountToShape]
  )

  const handleAmountCancel = useCallback(() => {
    if (!hasBudgetBlocks) {
      setLocalAmount('')
      return
    }

    setLocalAmount(hasMultiple && !allSameAmount ? '' : firstBlockAmount.toString())
  }, [allSameAmount, firstBlockAmount, hasBudgetBlocks, hasMultiple])

  if (!hasSelection) {
    return null
  }

  if (!hasBudgetBlocks) {
    return (
      <DefaultStylePanel>
        <DefaultStylePanelContent />
      </DefaultStylePanel>
    )
  }

  const sliderSteps = 100
  const sliderValue = Math.round(Math.min(Math.max(localOpacity, 0), 1) * sliderSteps)

  const baseTypeButtonClasses =
    'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--tl-color-focus)]'

  const typeButtonClass = (isActive: boolean, tone: 'income' | 'expense') => {
    const activeTone =
      tone === 'income'
        ? 'bg-green-500/90 border-green-500 text-white shadow-sm'
        : 'bg-red-500/90 border-red-500 text-white shadow-sm'
    const inactiveTone = 'border-[var(--tl-color-divider)] bg-[var(--tl-color-muted-1)] text-[var(--tl-color-text-1)] hover:bg-[var(--tl-color-muted-2)]'
    return `${baseTypeButtonClasses} ${isActive ? activeTone : inactiveTone}`
  }

  const incomeActive = allSameType && firstBlockType === 'income'
  const expenseActive = allSameType && firstBlockType === 'expense'

  return (
    <DefaultStylePanel>
      <div className="flex flex-col gap-4 p-3">
        <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--tl-color-text-3)]">
          <span>Budget Properties</span>
          {hasMultiple && (
            <span className="normal-case text-[var(--tl-color-text-3)]">{budgetBlocks.length} selected</span>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-[var(--tl-color-divider)] bg-[var(--tl-color-muted-1)]/40 p-3">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '8px' }}>
            {colorOptions.map((colorName) => {
              const colorValue = resolveColorValue(colorName)
              const isActive = allSameColor && firstBlockColor === colorName

              // DEBUG: Log each color button render
              console.log(`🎨 Rendering button for ${colorName}:`, {
                colorValue,
                isActive,
                allSameColor,
                firstBlockColor
              })

              return (
                <button
                  key={colorName}
                  type="button"
                  onClick={() => handleColorToggle(colorName)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    border: isActive ? '2px solid #007bff' : '1px solid #ccc',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  aria-label={`Set color ${colorName}`}
                  aria-pressed={isActive}
                  title={colorName}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: colorValue,
                      border: colorName === 'white' ? '1px solid #ccc' : 'none'
                    }}
                  />
                </button>
              )
            })}
          </div>
          <div className="px-1">
            <TldrawUiSlider
              data-testid="budget.opacity"
              value={sliderValue}
              steps={sliderSteps}
              onValueChange={handleOpacityChange}
              label="Opacity"
              title="Opacity"
            />
          </div>
          {(!allSameColor || !allSameOpacity) && (
            <div className="px-1 text-[11px] italic text-[var(--tl-color-text-3)]">
              {!allSameColor ? 'Mixed colors selected' : 'Mixed transparency selected'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="min-w-[48px] text-xs font-semibold uppercase tracking-wide text-[var(--tl-color-text-2)]">
            Name
          </span>
          <TldrawUiInput
            ref={nameInputRef}
            value={localName}
            placeholder={hasMultiple && !allSameName ? 'Mixed names' : ''}
            onValueChange={setLocalName}
            onComplete={handleNameComplete}
            onBlur={handleNameComplete}
            onCancel={handleNameCancel}
            autoSelect
            aria-label="Name"
            className="flex-1"
          />
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="min-w-[48px] text-xs font-semibold uppercase tracking-wide text-[var(--tl-color-text-2)]">
            Amount
          </span>
          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm font-semibold text-[var(--tl-color-text-3)]">
              {allSameCurrency ? firstBlockCurrency : '?'}
            </span>
            <TldrawUiInput
              ref={amountInputRef}
              value={localAmount}
              placeholder={hasMultiple && !allSameAmount ? 'Mixed amounts' : ''}
              onValueChange={setLocalAmount}
              onComplete={commitAmountFromString}
              onBlur={commitAmountFromString}
              onCancel={handleAmountCancel}
              aria-label="Amount"
              className="flex-1"
            />
          </div>
        </div>

        <div className="h-px bg-[var(--tl-color-divider)]" />

        <div className="flex gap-2 px-1 pb-1">
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={typeButtonClass(incomeActive, 'income')}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={typeButtonClass(expenseActive, 'expense')}
          >
            Expense
          </button>
        </div>
        {!allSameType && (
          <div className="px-1 text-[11px] italic text-[var(--tl-color-text-3)]">
            Mixed types selected
          </div>
        )}
      </div>
    </DefaultStylePanel>
  )
}
