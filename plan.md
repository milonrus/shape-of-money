# Shape of Money - Incremental Development Plan

## ✅ Phase 1: Foundation & Basic Canvas (COMPLETED)
1. ✅ **Project Setup**: Create Vite React TypeScript project with basic folder structure
2. ✅ **Dependencies**: Install tldraw, core UI libraries, and development tools
3. ✅ **App Shell**: Create basic App component with tldraw editor container
4. ✅ **Verify Canvas**: Ensure empty whiteboard renders with pan/zoom working

### Phase 1 Implementation Details:
- **Tech Stack**: React 18 + TypeScript 5.0+ + Vite 5
- **Whiteboard**: @tldraw/tldraw v4.0.2 with full canvas functionality
- **Styling**: Tailwind CSS v4 with @tailwindcss/postcss plugin
- **Code Quality**: ESLint + Prettier with TypeScript strict mode
- **Folder Structure**: Complete src/ organization per CLAUDE.md specification
- **Layout**: Responsive flexbox layout with proper header/canvas distribution
- **Status**: ✅ Development server running, canvas interactive, no build errors

**Deliverable**: Working React app with interactive tldraw canvas and clean UI foundation

## Phase 2: Budget-Aware Rectangle Creation (Days 2-3)
**Note**: tldraw provides generic rectangles out-of-the-box, but we need budget-specific functionality

5. **Custom Budget Buttons**: Replace generic rectangle tool with "Add Income" and "Add Expense" buttons in header
6. **Budget Rectangle Data**: Create rectangles that store budget metadata (amount, name, type)
7. **Budget Content Display**: Show placeholder budget information inside rectangles (e.g., "Income: $1000")
8. **Visual Distinction**: Style income rectangles (green) differently from expense rectangles (red)

### Phase 2 Implementation Notes:
- ✅ **Generic rectangles**: tldraw provides selection, dragging, basic shapes
- ❌ **Budget integration**: Need to connect rectangles to budget data model
- **Goal**: Transform generic rectangles into budget-aware shapes for Phase 3's area constraint

## Phase 3: Area-Amount Foundation (Days 3-4)
9. **Data Types**: Define Item schema with amount, name, geometry using Zod
10. **Custom Shape**: Create BudgetBlock shape with area = amount * scale constraint
11. **Text Overlay**: Display amount and name as text on rectangles
12. **Store Setup**: Basic Zustand store for items and global scale

## Phase 4: Basic Editing (Days 4-5)
13. **Inspector Panel**: Create side panel that opens when selecting rectangle
14. **Amount Editing**: Edit amount in inspector and see rectangle resize automatically
15. **Name Editing**: Edit name and see it update on rectangle immediately
16. **Live Updates**: Ensure all changes reflect in real-time

## Phase 5: Income vs Expense (Days 5-6)
17. **Type Field**: Add income/expense type with different colors (green/red)
18. **Separate Buttons**: Replace generic button with "Add Income" and "Add Expense"
19. **Visual Distinction**: Show clear visual difference between income and expenses
20. **Type Switching**: Allow changing type in inspector

## Phase 6: Summary & Calculations (Days 6-7)
21. **Summary Bar**: Add bottom bar showing total income, total expenses, balance
22. **Real-time Math**: Update calculations instantly as rectangles are edited
23. **Balance Display**: Show positive/negative balance with appropriate styling
24. **Edge Cases**: Handle zero amounts and negative balances gracefully

## Phase 7: Manual Layout Controls (Days 7-8)
25. **Grid Display**: Add toggleable background grid for alignment
26. **Snap to Grid**: Implement snap-to-grid for creating and moving rectangles
27. **Alignment Guides**: Show alignment guides when dragging near other rectangles
28. **Visual Feedback**: Improve drag feedback with better cursor states

## Phase 8: Automatic Layout (Days 8-10)
29. **D3 Integration**: Install d3-hierarchy and create treemap layout service
30. **Treemap Algorithm**: Implement squarified treemap layout calculation
31. **Auto-Arrange Button**: Add "Treemap" button that auto-arranges all rectangles
32. **Layout Persistence**: Preserve manual edits until treemap is re-applied

## Phase 9: Scale & Fit (Days 10-11)
33. **Scale Calculation**: Implement global scale computation based on viewport
34. **Fit to Canvas**: Add button to recalculate scale to fit all items in view
35. **Scale Management**: Handle scale changes when adding/removing items
36. **Minimum Sizes**: Enforce minimum rectangle sizes for readability

## Phase 10: Basic Persistence (Days 11-12)
37. **Local Storage**: Implement localforage-based save/load functionality
38. **Auto-save**: Add debounced auto-save on any data changes
39. **Session Restore**: Load last session automatically on app startup
40. **Data Validation**: Ensure saved data passes schema validation

## Phase 11: Recurrence Foundation (Days 12-14)
41. **Recurrence Schema**: Define recurrence types (none, weekly, biweekly, monthly, yearly)
42. **Inspector Fields**: Add recurrence controls to inspector panel
43. **Date Utilities**: Implement date-fns based recurrence calculation logic
44. **Effective Amount**: Calculate effective amount per item based on recurrence

## Phase 12: Month Context (Days 14-15)
45. **Month Selector**: Add month picker to top of interface
46. **Month-aware Totals**: Show different totals based on selected month
47. **Recurrence Display**: Update summary to reflect recurring items in selected month
48. **Month Navigation**: Add prev/next month navigation buttons

## Phase 13: Enhanced Editing (Days 15-16)
49. **Corner Resize**: Allow resizing rectangles by dragging corners/edges
50. **Area Constraint**: Maintain area constraint during resize (adjust other dimension)
51. **Resize Feedback**: Show live amount preview during resize operations
52. **Aspect Limits**: Prevent extreme aspect ratios that make text unreadable

## Phase 14: Export Functionality (Days 16-17)
53. **PNG Export**: Implement PNG export using tldraw's built-in export API
54. **SVG Export**: Add SVG export for crisp vector graphics
55. **JSON Export**: Export budget data and scene for portability
56. **Export UI**: Add export dropdown with format options

## Phase 15: Visual Polish (Days 17-18)
57. **Color Scheme**: Implement proper color palette (green income, red expenses)
58. **Currency Format**: Add Intl.NumberFormat for proper currency display
59. **Typography**: Improve fonts, sizing, and text layout in rectangles
60. **Visual Hierarchy**: Polish toolbar, inspector, and summary bar styling

## Phase 16: Error Handling (Days 18-19)
61. **Input Validation**: Add proper validation for amounts, names, dates
62. **Error Messages**: Show helpful error messages for invalid inputs
63. **Zero Handling**: Handle zero amounts by collapsing to small chips
64. **Boundary Cases**: Test and handle edge cases gracefully

## Phase 17: Accessibility (Days 19-20)
65. **Keyboard Nav**: Add keyboard navigation for all interactive elements
66. **ARIA Labels**: Implement screen reader support with proper labels
67. **Focus Management**: Ensure logical focus flow and visible focus indicators
68. **Color Contrast**: Verify color accessibility and add alternative indicators

## Phase 18: Performance (Days 20-21)
69. **Memoization**: Memoize expensive calculations and React components
70. **Drag Performance**: Optimize rendering during drag operations for 60fps
71. **Large Datasets**: Test and optimize for budgets with many items
72. **Bundle Size**: Analyze and optimize JavaScript bundle size

## Phase 19: Advanced Recurrence (Days 21-22)
73. **Weekly Patterns**: Implement proper weekly recurrence with occurrence counting
74. **Anniversary Dates**: Support yearly recurrence with specific dates
75. **Date Boundaries**: Handle start/end dates and month boundaries correctly
76. **Recurrence Preview**: Show preview of recurrence pattern in inspector

## Phase 20: Launch Polish (Days 22-24)
77. **First-time UX**: Add guided overlay for new users explaining key features
78. **Month Duplication**: Allow duplicating previous month's budget as starting point
79. **Animations**: Add smooth transitions for treemap and scale changes
80. **Final Testing**: Comprehensive testing of all features and edge cases

Each phase delivers working, testable functionality. Users can interact with the app meaningfully after Phase 4, with each subsequent phase adding substantial value. The plan prioritizes getting visual feedback early, then building core business logic, and finally polishing the experience.