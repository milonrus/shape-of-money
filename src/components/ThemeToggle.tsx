import clsx from 'clsx'
import { useTheme } from '../lib/theme/ThemeProvider'

type ThemeToggleProps = {
  className?: string
  size?: 'default' | 'compact'
}

const iconClasses: Record<'default' | 'compact', string> = {
  default: 'text-lg',
  compact: 'text-base',
}

export function ThemeToggle({ className, size = 'default' }: ThemeToggleProps) {
  const { mode, toggleMode } = useTheme()
  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-pressed={isDark}
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-slate-500',
        size === 'compact' && 'rounded-md px-2 py-1 text-xs',
        className,
      )}
    >
      <span role="img" aria-hidden="true" className={iconClasses[size]}>
        {isDark ? '🌙' : '☀️'}
      </span>
      <span className="hidden sm:inline">{isDark ? 'Dark mode' : 'Light mode'}</span>
      <span className="sm:hidden">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}
