# Shape of Money

A visual budgeting whiteboard where rectangles represent income/expenses with **area proportional to amount**. Users can drag, resize, and auto-arrange rectangles into treemaps for instant budget visualization.

## 🎯 Core Concept

- **Area = Amount**: Rectangle size directly represents monetary value
- **Visual Budgeting**: Build a monthly budget in under 5 minutes
- **Local-First**: No auth, no backend - everything stored locally
- **Whiteboard Interface**: Intuitive drag-and-drop budget creation

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🏗️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Whiteboard**: @tldraw/tldraw v4.0.2
- **UI**: Radix UI + Tailwind CSS
- **State**: Zustand + Zod validation
- **Storage**: LocalForage (IndexedDB)

## 📋 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run preview         # Preview production build

# Code Quality
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix lint issues
npm run type-check      # TypeScript validation
npm run format          # Format with Prettier
```

## 📄 Dependencies & Licensing

This project uses **tldraw** (@tldraw/tldraw) which has specific licensing requirements:

- ✅ **Development use**: Free (current usage)
- ⚠️ **Production use**: Requires paid license OR accepts "Made with tldraw" watermark
- 🆓 **Trial option**: 100-day free trial available for production testing

For more information, see [tldraw licensing](https://tldraw.dev/community/license).

## 🗂️ Project Structure

```
src/
├── components/
│   ├── ui/             # Radix + Tailwind base components
│   └── business/       # Domain-specific components
├── lib/
│   ├── validation/     # Zod schemas and types
│   ├── calculations/   # Business logic (treemap, scaling)
│   └── utils/          # Shared utilities
└── stores/             # Zustand state management
```

## 🎨 Key Features (Planned)

- [x] Interactive whiteboard canvas
- [x] Budget-aware rectangle creation
- [ ] Area-proportional sizing (area = amount × scale)
- [ ] Real-time amount editing
- [ ] Income vs expense visual distinction
- [ ] Treemap auto-arrangement
- [ ] Recurrence calculations (weekly, monthly, yearly)
- [ ] Export to PNG/SVG/JSON

## 🤝 Contributing

This is an early-stage project. See `CLAUDE.md` for detailed development context and `plan.md` for implementation roadmap.
