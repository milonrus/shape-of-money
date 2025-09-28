# Repository Guidelines

## Project Structure & Module Organization
- `src/main.tsx` bootstraps React and Vite; `src/App.tsx` owns the layout shell and toolbar logic.
- Budget whiteboard features live in `src/components/business` (e.g., `Whiteboard.tsx`, `BudgetStylePanel.tsx`); share reusable logic in `src/lib`.
- Keep visual assets in `src/assets`; static html/meta files stay in `public/`.
- Build artifacts output to `dist/`; never edit generated files manually.

## Build, Test, and Development Commands
- `npm run dev` — start the Vite dev server at `http://localhost:5173` for live reloading.
- `npm run build` — run `tsc -b` and produce an optimized production bundle in `dist/`.
- `npm run preview` — serve the latest build to validate deployment behavior locally.
- `npm run lint` / `npm run lint:fix` — execute ESLint (auto-fix when possible) to keep diffs clean.
- `npm run type-check` — run strict TypeScript validation without emitting files.
- `npm run format` / `npm run format:check` — enforce Prettier formatting rules before committing.

## Coding Style & Naming Conventions
- Favor TypeScript + React functional components; model state via hooks and keep business logic in helpers.
- Use PascalCase for components (`BudgetBlock`), camelCase for variables/functions, and kebab-case for non-component file names.
- Tailwind utility classes drive layout and styling; extract repeated class sets into helpers when they grow complex.
- Honor ESLint/Prettier defaults: 2-space indentation, single quotes, and no unused variables.

## Testing Guidelines
- Automated tests are not yet wired up; when adding them, colocate unit specs under `src/**/__tests__` and prefer Vitest with React Testing Library.
- Until then, validate changes via `npm run dev` and capture manual QA steps in pull request notes.
- Guard regressions with type safety: run `npm run type-check` and `npm run lint` before requesting review.

## Commit & Pull Request Guidelines
- Write imperative, scope-aware commit messages (see `git log`: `Add custom properties panel for budget blocks`).
- Reference relevant roadmap phases in `plan.md` or linked issues/tickets inside commits and PR descriptions.
- Pull requests should include: purpose summary, screenshots or recordings for UI changes, manual test notes, and callouts for follow-up work.
- Keep changes focused; defer tangential fixes to separate PRs to streamline reviews.
