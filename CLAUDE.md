# Claude Context: Shape of Money

## Project Overview
**Shape of Money** is a visual budgeting whiteboard where rectangles represent income/expenses with **area proportional to amount**. Users can drag, resize, and auto-arrange rectangles into treemaps for instant budget visualization. It's local-first, no-auth, single-player for V1.

**Target Users:** Consumers, freelancers, students who want fast visual budgeting without spreadsheets.

**Core Value Proposition:** Build a monthly budget in under 5 minutes with clear visual breakdown of trade-offs.

## Key Technical Constraints

### The Golden Rule: Area = Amount × Global Scale
- Rectangle area MUST always equal `amount * globalScale`
- When user resizes: keep area constant, adjust other dimension
- When user edits amount: recalculate geometry to maintain area
- Minimum size: 24px to keep text readable

### Architecture Principles
1. **Domain-First Design**: Business logic (Zod schemas, Zustand store) is UI-agnostic
2. **Local-First**: No backend, everything in IndexedDB via localforage
3. **Whiteboard SDK**: tldraw provides pan/zoom/selection/export out of the box
4. **Custom Shape**: BudgetBlock enforces area constraints during interactions

## Tech Stack (Core)
```bash
# Framework
React 18 + TypeScript + Vite

# Whiteboard
@tldraw/tldraw (primary) or @excalidraw/excalidraw (fallback)

# State & Data
zustand (global state)
zod (validation)
localforage (persistence)

# Layout & Math
d3-hierarchy (treemap algorithm)
date-fns (recurrence calculations)

# UI & Styling
@radix-ui/primitives + tailwindcss
lucide-react (icons)
framer-motion (animations)
```

## Development Commands
```bash
# Setup
pnpm install

# Development
pnpm dev                 # Start dev server
pnpm build              # Production build
pnpm preview            # Preview production build

# Quality
pnpm lint               # ESLint check
pnpm lint:fix           # Auto-fix lint issues
pnpm type-check         # TypeScript validation
pnpm test               # Run unit tests
pnpm test:coverage      # Test with coverage
pnpm test:e2e           # End-to-end tests

# Analysis
pnpm analyze-bundle     # Bundle size analysis
```

## File Structure & Conventions

```
src/
├── components/
│   ├── ui/             # Radix + Tailwind base components
│   └── business/       # Domain-specific components (Toolbar, Inspector, SummaryBar)
├── hooks/              # Custom React hooks
├── lib/
│   ├── validation/     # Zod schemas (types.ts)
│   ├── whiteboard/     # tldraw customizations (BudgetBlock.tsx)
│   ├── calculations/   # Business logic (treemap.ts, recurrence.ts, scaling.ts)
│   └── utils/          # Shared utilities
├── stores/             # Zustand stores (store.ts)
├── types/              # TypeScript type definitions
└── assets/             # Static assets
```

### Naming Conventions
- **Components**: PascalCase (`BudgetBlock`, `SummaryBar`)
- **Files**: kebab-case (`budget-block.tsx`, `treemap-layout.ts`)
- **Hooks**: `use` prefix (`useStore`, `useBudgetCalculations`)
- **Types**: PascalCase (`Budget`, `Item`, `Recurrence`)
- **Constants**: SCREAMING_SNAKE_CASE (`MIN_RECTANGLE_SIZE`)

## Core Domain Models

```typescript
// The main data structures
type Item = {
  id: string
  name: string
  type: "income" | "expense"
  amount: number
  color: string
  recurrence: Recurrence
  date?: string // for one-time items
  currency: string
  // Geometry (persisted for manual layout)
  x: number, y: number, w: number, h: number
}

type Budget = {
  id: string
  month: string // "YYYY-MM"
  items: Item[]
  globalScale: number // px² per currency unit
  settings: { grid: boolean }
}

type Recurrence = {
  kind: "none" | "weekly" | "biweekly" | "monthly" | "yearly"
  start?: string
  end?: string
}
```

## Key Algorithms You Must Understand

### 1. Area-Amount Mapping
```typescript
// Always maintain: area = amount * globalScale
const area = item.amount * store.globalScale
const minSize = 24 // px

// On resize (user drags edge):
const newWidth = Math.max(minSize, proposedWidth)
const newHeight = Math.max(minSize, area / newWidth)

// On amount edit:
const newArea = newAmount * store.globalScale
const aspectRatio = item.w / item.h
const newWidth = Math.sqrt(newArea * aspectRatio)
const newHeight = newArea / newWidth
```

### 2. Global Scale Calculation
```typescript
// Fit all items to viewport with padding
const padding = 40
const safetyFactor = 0.9
const availableArea = (viewport.width - 2 * padding) * (viewport.height - 2 * padding)
const totalAmount = items.reduce((sum, item) => sum + effectiveAmount(item, currentMonth), 0)
const globalScale = safetyFactor * availableArea / totalAmount
```

### 3. Effective Amount (Recurrence)
```typescript
function effectiveAmount(item: Item, month: string): number {
  const monthDate = parseISO(`${month}-01`)

  switch (item.recurrence.kind) {
    case "none":
      return item.date && isSameMonth(parseISO(item.date), monthDate) ? item.amount : 0
    case "monthly":
      return item.amount
    case "weekly":
      return item.amount * countWeeksInMonth(monthDate, item.recurrence)
    case "yearly":
      return isAnniversaryMonth(monthDate, item.recurrence) ? item.amount : 0
    default:
      return 0
  }
}
```

## Testing Strategy

### What to Test
1. **Area Math**: Resize operations maintain area invariant
2. **Recurrence Logic**: Correct amounts for different time periods
3. **Treemap Layout**: Non-overlapping rectangles within viewport
4. **User Interactions**: Create → edit → export happy paths
5. **Persistence**: Save/load roundtrips preserve data

### Test Structure
```bash
# Unit tests (lib/ functions)
src/lib/**/*.test.ts

# Component tests
src/components/**/*.test.tsx

# Integration tests
tests/integration/

# E2E tests
tests/e2e/
```

### Coverage Targets
- **Overall**: 80%+ line coverage
- **Business Logic**: 95%+ (calculations, recurrence)
- **UI Components**: 70%+ (focus on interactions)

## Performance Requirements

### Bundle Size
- **Core App**: < 500KB gzipped (excluding tldraw)
- **tldraw**: ~300KB gzipped (acceptable for functionality)
- **Total**: < 800KB gzipped initial load

### Runtime Performance
- **Canvas Interactions**: 60fps during drag/resize
- **Treemap Layout**: < 100ms for 50 items
- **Scale Recalculation**: < 50ms
- **Auto-save Debounce**: 500ms

## Common Development Tasks

### Adding a New Feature
1. **Define Types**: Add to `src/lib/validation/types.ts` with Zod schema
2. **Update Store**: Add actions to `src/stores/store.ts`
3. **Business Logic**: Implement in `src/lib/calculations/`
4. **UI Components**: Build in `src/components/business/`
5. **Tests**: Cover business logic and key interactions

### Debugging Canvas Issues
1. **Check tldraw DevTools**: Use React DevTools → tldraw component
2. **Shape Props**: Log `shape.props` in custom shape methods
3. **Store State**: Use Zustand DevTools for state inspection
4. **Performance**: React Profiler for re-render analysis

### Adding Export Formats
1. **tldraw API**: Use `editor.exportAs()` for PNG/SVG
2. **Custom Export**: Implement in `src/lib/export/`
3. **Data Export**: JSON includes both domain data and scene snapshot

## Important Edge Cases

### Visual & UX
- **Zero amounts**: Collapse to small chips (show name only)
- **Extreme aspect ratios**: Cap at 10:1 to keep text readable
- **Overlapping**: Allow during manual editing, resolve in treemap
- **Very small amounts**: Enforce minimum 24px size

### Data & Calculations
- **Empty budgets**: Handle gracefully (show onboarding)
- **Month boundaries**: Recurrence calculations at month edges
- **Currency changes**: Recalculate scale when switching currencies
- **Scale extremes**: Handle very large/small amounts gracefully

### Performance
- **Large datasets**: 100+ items should still be responsive
- **Rapid interactions**: Debounce auto-save but not visual updates
- **Memory leaks**: Clean up tldraw editor on unmount

## Design Principles

### Visual Hierarchy
- **Income**: Green colors, positive visual weight
- **Expenses**: Red/orange colors, show as subtractions
- **Balance**: Prominent display, color-coded (green/red)
- **Typography**: Clear amount formatting with currency symbols

### Interaction Design
- **Progressive Disclosure**: Basic → Inspector → Advanced features
- **Immediate Feedback**: All edits reflect instantly
- **Forgiving UX**: Easy undo, non-destructive operations
- **Keyboard Support**: Tab navigation, Enter to edit, Escape to cancel

## AI Assistant Guidelines

### When Working on This Project
1. **Always consider the area constraint** - it's the core innovation
2. **Test calculations manually** - financial math must be exact
3. **Check responsive behavior** - canvas must work on different screen sizes
4. **Validate with Zod schemas** - all data must pass runtime validation
5. **Consider performance** - canvas operations should be smooth

### Code Review Checklist
- [ ] Area = amount × globalScale maintained?
- [ ] Recurrence calculations correct for edge cases?
- [ ] TypeScript errors resolved?
- [ ] Tests added for new business logic?
- [ ] Accessibility considerations addressed?
- [ ] Performance impact measured?

### Common Pitfalls to Avoid
- **Breaking area invariant** during resize operations
- **Off-by-one errors** in recurrence date calculations
- **Memory leaks** from tldraw event listeners
- **State mutations** instead of immutable updates in Zustand
- **Missing error boundaries** around canvas operations

---

*Last updated: 2025-09-28 | This file helps AI assistants understand the project context and work effectively within established patterns.*