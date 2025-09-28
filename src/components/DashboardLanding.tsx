import type { FC } from 'react';

type DashboardLandingProps = {
  onEnterFreeCanvas: () => void;
  onEnterMonthlyBudget: () => void;
};

export const DashboardLanding: FC<DashboardLandingProps> = ({
  onEnterFreeCanvas,
  onEnterMonthlyBudget,
}) => {
  return (
    <div className="min-h-screen w-full bg-gray-100 text-gray-900">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-12 px-6 py-24 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            Hello, Mikhail
          </h1>
          <p className="text-2xl font-medium text-gray-700 md:text-3xl">
            Let&apos;s feel the Shape of Money
          </p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          <button
            type="button"
            onClick={onEnterFreeCanvas}
            className="w-64 rounded-2xl border-4 border-gray-900 bg-white px-8 py-10 text-2xl font-semibold text-gray-900 shadow-lg transition-transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-gray-400"
          >
            Free canvas
          </button>

          <button
            type="button"
            onClick={onEnterMonthlyBudget}
            className="w-64 rounded-2xl border-4 border-gray-900 bg-white px-8 py-10 text-2xl font-semibold text-gray-900 shadow-lg transition-transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-gray-400"
          >
            Monthly budget
          </button>

          <button
            type="button"
            disabled
            className="w-64 rounded-2xl border-4 border-gray-400 bg-gray-100 px-8 py-10 text-2xl font-semibold text-gray-500 opacity-70"
            aria-disabled
          >
            Project planning
          </button>
        </div>
      </div>
    </div>
  );
};
