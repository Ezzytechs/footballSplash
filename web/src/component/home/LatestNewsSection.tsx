import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from './themedContext'

interface LatestItem {
  title: string
  slug: string
  category: string
  time: string
  comments: number
  img: string
}

const LATEST: LatestItem[] = [
  {
    title: 'Bayern Munich Eyeing Premier League Winger in $80M Winter Swoop',
    slug: 'bayern-munich-eyeing-premier-league-winger-80m',
    category: 'TRANSFER TALK',
    time: '1 hour ago',
    comments: 42,
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=400',
  },
  {
    title:
      'Tactical Breakdown: How 3-4-2-1 Formations Are Dominating European Football',
    slug: 'how-3-4-2-1-formations-are-dominating-european-football',
    category: 'TACTICS',
    time: '3 hours ago',
    comments: 18,
    img: 'https://images.unsplash.com/photo-1560272564-66952055a4ab?auto=format&fit=crop&q=80&w=400',
  },
  {
    title:
      "Ballon d'Or Power Rankings: New Leader Emerges After Spectacular Champions League Matchday",
    slug: 'ballon-dor-power-rankings-new-leader-emerges',
    category: 'AWARDS',
    time: '5 hours ago',
    comments: 104,
    img: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=400',
  },
]
export function LatestNewsSection() {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  const surface = isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200/80'
  const borderHover = isDark ? 'hover:border-zinc-700' : 'hover:border-zinc-300'
  const textHeading = isDark ? 'text-white group-hover:text-yellow-400' : 'text-zinc-900 group-hover:text-yellow-600'
  const metaText = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const accentText = isDark ? 'text-yellow-400 hover:underline' : 'text-yellow-600 hover:underline'
  const sectionBorder = isDark ? 'border-t border-zinc-900' : 'border-t border-zinc-200'

  return (
    <section
      id="latest-headlines"
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 scroll-mt-32 lg:scroll-mt-44 ${sectionBorder}`}
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
          <span className="w-1.5 h-6 bg-yellow-400 rounded-full" />
          <span className={isDark ? 'text-white' : 'text-zinc-900'}>LATEST HEADLINES</span>
        </h3>
        <button className={`text-xs font-bold flex items-center gap-1 ${accentText}`}>
          VIEW ALL NEWS <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {LATEST.map((item, idx) => (
          <article
            key={idx}
            className={`rounded-xl overflow-hidden transition-all group flex flex-col justify-between ${surface} ${borderHover}`}
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span
                className={`absolute top-3 left-3 text-[10px] px-2.5 py-0.5 rounded uppercase ${
                  isDark
                    ? 'bg-black/80 backdrop-blur-md text-yellow-400'
                    : 'bg-black/60 backdrop-blur-md text-yellow-500'
                } font-extrabold`}
              >
                {item.category}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <h4 className={`text-sm font-bold line-clamp-2 ${textHeading}`}>
                <Link to={`/post/${item.slug}`}>{item.title}</Link>
              </h4>
              <div
                className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                  isDark ? 'border-zinc-800/60 ' + metaText : 'border-zinc-200/60 ' + metaText
                }`}
              >
                <span>{item.time}</span>
                <span>💬 {item.comments} comments</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
