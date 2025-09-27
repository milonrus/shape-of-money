# Shape of Money - Tech Stack (Senior Engineer Perspective)

## Core Framework & Language
- **React 18** with **TypeScript 5.0+** (strict mode enabled)
- **Vite 5** for blazing-fast development and optimized builds
- **Node.js 18+** for development tooling

## Whiteboard & Graphics
- **Primary:** `@tldraw/tldraw` - Battle-tested, extensible whiteboard with custom shape support
- **Fallback:** `@excalidraw/excalidraw` (MIT) - If licensing constraints emerge
- **Layout Engine:** `d3-hierarchy` - Industry standard for treemap algorithms

## State Management
- **Global State:** `zustand` with persist middleware
- **Server State:** Not applicable (local-first architecture)
- **Form State:** `react-hook-form` with `@hookform/resolvers`

## Type Safety & Validation
- **Runtime Validation:** `zod` with TypeScript integration
- **TypeScript Config:** Strict mode with `noUncheckedIndexedAccess`
- **API Types:** Generated from Zod schemas using `zod-to-ts`

## UI & Styling
- **Component System:** `@radix-ui/primitives` for accessible headless components
- **Styling:** `tailwindcss` + `tailwind-merge` for utility-first CSS
- **Icons:** `lucide-react` for consistent iconography
- **Animations:** `framer-motion` for smooth micro-interactions

## Data & Persistence
- **Local Storage:** `localforage` (IndexedDB/WebSQL fallback)
- **Date Handling:** `date-fns` (tree-shakeable, TypeScript-friendly)
- **Currency Formatting:** Native `Intl.NumberFormat` API
- **ID Generation:** `nanoid` for collision-resistant IDs

## Development Experience
- **Package Manager:** `pnpm` for faster installs and disk efficiency
- **Code Quality:** `eslint` + `@typescript-eslint` + `prettier`
- **Git Hooks:** `husky` + `lint-staged` for pre-commit quality gates
- **Type Checking:** `tsc --noEmit` in CI/CD pipeline

## Testing Strategy
- **Unit/Integration:** `vitest` with `@testing-library/react`
- **E2E:** `playwright` for critical user flows
- **Visual Regression:** `@storybook/test-runner` with Chromatic
- **Coverage:** `@vitest/coverage-v8` with 80%+ threshold

## Performance & Monitoring
- **Bundle Analysis:** `rollup-plugin-visualizer` for build optimization
- **Performance:** React DevTools Profiler + `web-vitals`
- **Error Boundaries:** Custom error boundaries with local logging
- **Memory Leaks:** Manual testing with Chrome DevTools

## Accessibility
- **Testing:** `@axe-core/react` for automated a11y testing
- **Guidelines:** WCAG 2.1 AA compliance target
- **Screen Readers:** Manual testing with NVDA/VoiceOver
- **Focus Management:** `focus-trap-react` for modal dialogs

## Build & Deployment
- **Build Tool:** Vite with optimized chunking strategy
- **Environment Config:** `dotenv` with validation via Zod
- **Static Hosting:** Vercel/Netlify with automatic deployments
- **CDN:** Built-in edge caching for static assets

## Security Considerations
- **CSP:** Content Security Policy headers in production
- **Sanitization:** `DOMPurify` for any user-generated content
- **Dependencies:** `npm audit` in CI pipeline
- **Local Data:** No sensitive data stored in localStorage

## Development Tools
- **VSCode Extensions:** TypeScript, ESLint, Prettier, Tailwind CSS IntelliSense
- **Debugging:** React Developer Tools, Redux DevTools (if needed)
- **API Testing:** Not applicable (local-first)
- **Design Tokens:** CSS custom properties for consistent theming

## File Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Radix + Tailwind components
│   └── business/       # Domain-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
│   ├── validation/     # Zod schemas
│   ├── whiteboard/     # tldraw customizations
│   └── calculations/   # Business logic
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
└── assets/             # Static assets
```

## Key Architectural Decisions

### Why tldraw over alternatives?
- **Pro:** Custom shape support, excellent TypeScript API, active maintenance
- **Con:** Larger bundle size than Excalidraw
- **Decision:** Performance benefits outweigh bundle cost for this use case

### Why Zustand over Redux Toolkit?
- **Pro:** Simpler API, smaller bundle, better TypeScript inference
- **Con:** Less ecosystem tooling
- **Decision:** Application complexity doesn't justify Redux overhead

### Why Tailwind over CSS-in-JS?
- **Pro:** Better performance, smaller runtime, design system consistency
- **Con:** Learning curve for team members
- **Decision:** Utility-first approach scales better for design iterations

### Why Vitest over Jest?
- **Pro:** Native ESM support, faster execution, Vite integration
- **Con:** Smaller ecosystem than Jest
- **Decision:** Performance and DX improvements justify the switch

## Performance Targets
- **First Contentful Paint:** < 1.2s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **Bundle Size:** < 500KB gzipped (excluding tldraw)
- **Runtime Performance:** 60fps during canvas interactions

## Browser Support
- **Primary:** Chrome 100+, Firefox 100+, Safari 15+
- **Secondary:** Edge 100+
- **Mobile:** iOS Safari 15+, Chrome Mobile 100+
- **Accessibility:** Screen reader compatibility across all supported browsers

## Migration Strategy (if needed)
- **Component Library:** Gradual migration from Radix to custom components
- **State Management:** Easy migration from Zustand to Valtio/Jotai if needed
- **Whiteboard:** Abstraction layer allows switching from tldraw to Excalidraw
- **Styling:** Tailwind to CSS modules migration path documented

## Risk Mitigation
- **tldraw Breaking Changes:** Pin to major version, maintain upgrade guide
- **Bundle Size Growth:** Automated bundle size monitoring in CI
- **TypeScript Complexity:** Regular refactoring sessions, complexity metrics
- **Performance Regression:** Automated Lighthouse CI on every PR

---

*This tech stack prioritizes developer experience, maintainability, and performance while keeping the bundle size reasonable for a financial application.*