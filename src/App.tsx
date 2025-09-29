import { useState } from 'react';
import { FreeCanvasView } from './components/FreeCanvasView';
import type { BudgetMode } from './components/business/Whiteboard';

function App() {
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('select');

  const handleModeChange = (mode: BudgetMode) => {
    setBudgetMode(mode);
  };

  return <FreeCanvasView budgetMode={budgetMode} onModeChange={handleModeChange} />;
}

export default App;
