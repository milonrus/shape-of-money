import { useEffect, useMemo, useState, type FC } from 'react';
import type { Editor } from '@tldraw/tldraw';
import { ThemeToggle } from './ThemeToggle';
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
              <h1 className="text-2xl font-bold text-[var(--app-text-primary)]">Monthly budget</h1>
              <p className="text-sm text-[var(--app-text-secondary)]">Plan income, expenses, and track savings</p>
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

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
            <span className="text-sm font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
              Total income
            </span>
            <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatMoney(summary.currency, summary.income)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
            <span className="text-sm font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
              Total expenses
            </span>
            <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatMoney(summary.currency, summary.expenses)}
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 shadow-sm transition-colors ${
              savingsIsPositive
                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/15'
                : 'border-rose-300 bg-rose-50 dark:border-rose-500/60 dark:bg-rose-500/15'
            }`}
          >
            <span className="text-sm font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
              Savings this month
            </span>
            <div
              className={`mt-2 text-2xl font-bold ${
                savingsIsPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              {formatMoney(summary.currency, savings)}
            </div>
            <p className="mt-1 text-xs text-[var(--app-text-muted)]">
              Calculated automatically from your income and expense blocks.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-[var(--app-background)] transition-colors">
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
