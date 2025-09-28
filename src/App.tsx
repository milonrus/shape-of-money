import { useState } from 'react';
import { DashboardLanding } from './components/DashboardLanding';
import { FreeCanvasView } from './components/FreeCanvasView';
import { MonthlyBudgetView } from './components/MonthlyBudgetView';
import type { BudgetMode } from './components/business/Whiteboard';

type AppView = 'dashboard' | 'freeCanvas' | 'monthlyBudget';

function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('select');

  const handleEnterFreeCanvas = () => {
    setBudgetMode('select');
    setView('freeCanvas');
  };

  const handleEnterMonthlyBudget = () => {
    setBudgetMode('select');
    setView('monthlyBudget');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setBudgetMode('select');
  };

  const handleModeChange = (mode: BudgetMode) => {
    setBudgetMode(mode);
  };

  if (view === 'dashboard') {
    return (
      <DashboardLanding
        onEnterFreeCanvas={handleEnterFreeCanvas}
        onEnterMonthlyBudget={handleEnterMonthlyBudget}
      />
    );
  }

  if (view === 'monthlyBudget') {
    return (
      <MonthlyBudgetView
        budgetMode={budgetMode}
        onModeChange={handleModeChange}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  return (
    <FreeCanvasView
      budgetMode={budgetMode}
      onModeChange={handleModeChange}
      onBackToDashboard={handleBackToDashboard}
    />
  );
}

export default App;
