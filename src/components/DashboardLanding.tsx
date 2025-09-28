import type { FC } from 'react';
import { ThemeToggle } from './ThemeToggle';

type DashboardLandingProps = {
  onEnterFreeCanvas: () => void;
  onEnterMonthlyBudget: () => void;
};

export const DashboardLanding: FC<DashboardLandingProps> = ({
  onEnterFreeCanvas,
  onEnterMonthlyBudget,
}) => {
  return (
    <div className="min-h-screen w-full bg-[var(--app-background)] text-[var(--app-text-primary)] transition-colors">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-12 px-6 py-24 text-center">
        <div className="w-full text-right">
          <ThemeToggle size="compact" className="ml-auto" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--app-text-primary)] md:text-5xl lg:text-6xl">
            Hello, Mikhail
          </h1>
          <p className="text-xl font-medium text-[var(--app-text-secondary)] md:text-2xl lg:text-3xl">
            Let&apos;s feel the Shape of Money
          </p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          <button
            type="button"
            onClick={onEnterFreeCanvas}
            className="w-64 rounded-2xl border-4 border-slate-900 bg-white px-8 py-10 text-xl font-semibold text-slate-900 shadow-xl shadow-slate-900/10 transition-transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-slate-400 dark:border-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:shadow-slate-900/40 dark:focus:ring-slate-500"
          >
            Free canvas
          </button>

          <button
            type="button"
            onClick={onEnterMonthlyBudget}
            className="w-64 rounded-2xl border-4 border-slate-900 bg-white px-8 py-10 text-xl font-semibold text-slate-900 shadow-xl shadow-slate-900/10 transition-transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-slate-400 dark:border-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:shadow-slate-900/40 dark:focus:ring-slate-500"
          >
            Monthly budget
          </button>

          <button
            type="button"
            disabled
            className="w-64 rounded-2xl border-4 border-slate-300 bg-slate-100 px-8 py-10 text-xl font-semibold text-slate-500 opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            aria-disabled
          >
            Project planning
          </button>
        </div>
      </div>
    </div>
  );
};
