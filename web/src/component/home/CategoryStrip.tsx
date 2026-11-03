import {
  ArrowLeftRight,
  Globe,
  Newspaper,
  Shirt,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CategoryWithCount } from '../../api/types'
import { useTheme } from './themedContext'

/** Icon per category slug; categories added later fall back to a generic one. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'premier-league': Shirt,
  'champions-league': Trophy,
  transfers: ArrowLeftRight,
  'world-football': Globe,
}

interface CategoryStripProps {
  label: string
  categories: CategoryWithCount[]
}

/**
 * One horizontal line of category links. Used to share the body's categories
 * around different parts of the page instead of collecting them in a single
 * block, and it renders nothing when it has no categories to show.
 */
export function CategoryStrip({ label, categories }: CategoryStripProps) {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  if (categories.length === 0) return null

  const card = isDark
    ? 'bg-zinc-900/50 border-zinc-800/80'
    : 'bg-white border-zinc-200/80'
  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const chip = isDark
    ? 'border-zinc-700 bg-zinc-950/60 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
    : 'border-zinc-200 bg-white text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
  const iconMuted = isDark ? 'text-zinc-500' : 'text-zinc-400'

  return (
    <section
      aria-label={label}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5"
    >
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 rounded-2xl border px-4 py-3 ${card}`}
      >
        <span
          className={`shrink-0 text-xs font-black uppercase tracking-widest flex items-center gap-2 ${heading}`}
        >
          <span className="w-1.5 h-4 bg-yellow-400 rounded-full" />
          {label}
        </span>

        {/* Single line: the row scrolls sideways instead of wrapping. */}
        <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? Newspaper
            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className={`shrink-0 flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors ${chip}`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${iconMuted}`} />
                {category.name}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}