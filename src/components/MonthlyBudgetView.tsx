import { useEffect, useMemo, useState, type FC } from 'react';
import type { Editor } from '@tldraw/tldraw';
import { Whiteboard, type BudgetMode } from './business/Whiteboard';
import type { BudgetBlockShape } from '../lib/whiteboard/BudgetBlock';

const MONTHLY_PERSISTENCE_KEY = 'shape-of-money-monthly-budget';

const formatMoney = (currency: string, value: number) => {
  const normalizedCurrency = currency.trim() || '€';
  const absolute = Math.abs(value);
  const formatted = absolute.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const space = normalizedCurrency.length > 1 ? ' ' : '';
  const sign = value < 0 ? '-' : '';
  return `${sign}${normalizedCurrency}${space}${formatted}`;
};

type MonthlyBudgetViewProps = {
  budgetMode: BudgetMode;
  onModeChange: (mode: BudgetMode) => void;
  onBackToDashboard: () => void;
};

type BudgetSummary = {
  income: number;
  expenses: number;
  currency: string;
};

export const MonthlyBudgetView: FC<MonthlyBudgetViewProps> = ({
  budgetMode,
  onModeChange,
  onBackToDashboard,
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [summary, setSummary] = useState<BudgetSummary>({
    income: 0,
    expenses: 0,
    currency: '€',
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const calculateSummary = () => {
      const shapes = editor
        .getCurrentPageShapes()
        .filter((shape): shape is BudgetBlockShape => shape.type === 'budget-block');

      let totalIncome = 0;
      let totalExpenses = 0;
      let currencySymbol: string | null = null;

      for (const shape of shapes) {
        const { amount, type, currency } = shape.props;
        if (!currencySymbol && currency) {
          currencySymbol = currency;
        }

        if (type === 'income') {
          totalIncome += amount;
        } else {
          totalExpenses += amount;
        }
      }

      setSummary({
        income: totalIncome,
        expenses: totalExpenses,
        currency: currencySymbol ?? '€',
      });
    };

    calculateSummary();
    const unsubscribe = editor.store.listen(
      () => {
        calculateSummary();
      },
      { scope: 'document' }
    );

    return () => {
      unsubscribe();
    };
  }, [editor]);

  const savings = useMemo(() => summary.income - summary.expenses, [summary]);
  const savingsIsPositive = savings >= 0;

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
              <h1 className="text-2xl font-bold">Monthly budget</h1>
              <p className="text-sm text-gray-700">Plan income, expenses, and track savings</p>
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

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Total income
            </span>
            <div className="mt-2 text-2xl font-bold text-emerald-600">
              {formatMoney(summary.currency, summary.income)}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Total expenses
            </span>
            <div className="mt-2 text-2xl font-bold text-rose-600">
              {formatMoney(summary.currency, summary.expenses)}
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 shadow-sm transition-colors ${
              savingsIsPositive ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'
            }`}
          >
            <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Savings this month
            </span>
            <div
              className={`mt-2 text-2xl font-bold ${
                savingsIsPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatMoney(summary.currency, savings)}
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Calculated automatically from your income and expense blocks.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Whiteboard
          budgetMode={budgetMode}
          onModeChange={onModeChange}
          onEditorReady={setEditor}
          persistenceKey={MONTHLY_PERSISTENCE_KEY}
        />
      </main>
    </div>
  );
};
