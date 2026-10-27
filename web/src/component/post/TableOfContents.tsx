import { useTheme } from '../home/themedContext'
import type { ArticleSection } from '../../lib/article'
import { scrollToId } from '../../lib/scroll'

export function TableOfContents({
  sections,
  activeId,
}: {
  sections: ArticleSection[]
  activeId: string
}) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const links = sections.filter((section) => section.title)

  if (links.length < 2) return null

  return (
    <nav
      aria-label="Table of contents"
      className={`rounded-2xl border p-4 ${
        isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
      }`}
    >
      <h3
        className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-zinc-900'
        }`}
      >
        <span className="w-1 h-4 bg-yellow-400 rounded-full" />
        On this page
      </h3>
      <ul className="space-y-1 border-l-2 border-transparent">
        {links.map((section) => {
          const isActive = section.id === activeId
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => scrollToId(section.id)}
                className={`-ml-px block w-full border-l-2 py-1.5 pl-3 text-left text-xs leading-snug transition-colors ${
                  isActive
                    ? 'border-yellow-400 font-bold text-yellow-500'
                    : isDark
                      ? 'border-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
                }`}
              >
                {section.title}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
