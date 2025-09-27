# Whiteboard Financial App – V1

### TL;DR

A minimalist visual budgeting tool that lets people “draw” their money using rectangles on a whiteboard. Each rectangle represents income or an expense, with size automatically tied to amount. Users can drag, resize, and auto-arrange into a treemap, set currencies, dates, and recurrence, and instantly see how their budget balances. Target users are consumers and freelancers who want fast, visual planning without spreadsheets.

---

## Goals

### Business Goals

* Achieve 35% week-4 retention of users who create at least one budget in the first session.

* Reach 1,000 completed budgets within 60 days of launch with <$1 CAC from organic/viral channels.

* Maintain a support ticket rate under 2% of MAU by emphasizing clarity and simplicity.

* Convert 20% of active users to export/share usage (proxy for perceived value).

### User Goals

* Build a monthly budget in under 5 minutes with a clear visual breakdown.

* Understand trade-offs at a glance via rectangle sizes and total balances.

* Quickly iterate: add, resize, drag, and auto-arrange without losing context.

* Plan recurring expenses and incomes by date and frequency with minimal setup.

* Export a visual snapshot for personal use, sharing, or project planning.

### Non-Goals

* Bank account linking, financial data aggregation, or automated transaction import.

* Multi-user real-time collaboration or account-based sharing.

* Advanced forecasting, investments tracking, or debt payoff modeling in V1.

---

## User Stories

* Persona: Consumer Budgeter (e.g., young professional)

  * As a consumer, I want to add my monthly salary and recurring bills, so that I can see my leftover cash.

  * As a consumer, I want to resize expense blocks, so that I can quickly test how cutting costs affects my balance.

  * As a consumer, I want to auto-arrange items, so that I get a clean layout without effort.

  * As a consumer, I want to switch months, so that I can plan for a specific period.

* Persona: Freelancer/Side-Hustler

  * As a freelancer, I want to add irregular income and recurring software subscriptions, so that I can plan around variable cash flow.

  * As a freelancer, I want to set start/end dates for projects and retainers, so that my monthly view reflects reality.

  * As a freelancer, I want to export a treemap, so that I can share a visual budget with a client or partner.

* Persona: Student

  * As a student, I want to track part-time income and rent/utilities, so that I don’t overspend.

  * As a student, I want to duplicate a prior month’s budget, so that I can tweak instead of starting over.

* Persona: Project Planner (personal projects)

  * As a project planner, I want to add expense categories and one-time purchases by date, so that I can visualize a project budget.

  * As a project planner, I want to drag/drop items into groups, so that I can compare categories side-by-side.

---

## Functional Requirements

* Canvas & Whiteboard (Priority: P0) -- Manual Rectangle Creation: Users can create rectangles representing income or expense items on a blank canvas. -- Selection & Inspector: Clicking a rectangle opens an inspector to edit name, type (income/expense), amount, color, and recurrence. -- Pan/Zoom, Grid & Snap: Basic pan/zoom with optional subtle grid and snap-to-grid toggles.

* Sizing & Area-Amount Logic (Priority: P0) -- Amount-to-Area Mapping: Rectangle area is proportional to amount using a global scale for the current budget period. -- Resizing a rectangle changes its other size since the area of rectangle is fixed -- Scale Adjustment: A global “fit to canvas” control recalculates scale to fit all items, preserving relative proportions.

* Drag/Drop & Layout (Priority: P0) -- Drag & Arrange: Users can drag rectangles anywhere; collisions are allowed but prevented during auto-arrange. -- Treemap Auto-Arrange: A one-click layout arranges items in a treemap by size, minimal whitespace. -- Manual Override: Users can manually adjust after auto-arrange; last manual positions are preserved.

---

## User Experience

**Entry Point & First-Time User Experience**

* Access via a web link; no account required for V1. Landing page: minimal headline, a “Start Budget” button.

* First open shows a blank whiteboard with a subtle grid, a compact toolbar (Add Income, Add Expense, Treemap, Export), and a bottom summary bar.

* A 30-second guided overlay highlights: Add Item, Resize to change amount, Drag to arrange, and Treemap for auto layout. Users can skip.

**Core Experience**

* Step 1: Add income.

  * Click “Add Income” to create a rectangle with placeholder name and amount.

  * Inline inspector opens for name (e.g., Salary), amount (e.g., 3500), recurrence (monthly), color.

  * Amount sets area via scale; show a subtle tooltip “Area reflects amount.”

* Step 2: Add expenses.

  * Click “Add Expense” to add multiple rectangles (Rent, Groceries, Utilities).

  * Real-time summary: totals and leftover update with each change.

* Step 3: Resize and refine.

  * Drag edges/corners to resize; amount keeps the same, other size changes to keep the area of a figure

  * Show a live amount overlay while resizing; snap to sensible increments. Ability to click and change this amount. 

  * Inline errors if size becomes too small to display label; show min-size hint.

* Step 4: Arrange.

  * Drag rectangles to group by category or proximity.

  * Click “Treemap” to auto-arrange by size; hold manual overrides after.

  * Provide alignment guides and snaplines for clean layouts.

  **Advanced Features & Edge Cases**

* Conflicting positions after scale change: preserve relative ordering, then apply non-overlapping nudge.

* Very small or zero amounts: enforce a minimum visible size; zero amounts collapse to a chip.

* Large counts of items: treemap prioritizes visibility; labels truncate with hover tooltips.

* Switching currency mid-session: amounts display in new currency; scale recalculates.

**UI/UX Highlights**

* High contrast color system; green/neutral for income, orange/red for expenses; color-blind-friendly palette.

* Accessible controls: keyboard navigable, focus outlines, ARIA labels for summaries and actions.

* Precision inputs: numeric fields with stepper controls; locale-aware formatting.

* Responsive layout: works well on tablet and desktop; minimal but functional on mobile with touch handles.

* Gentle motion: 60fps drag/resize; spring easing for treemap transitions to preserve user context.