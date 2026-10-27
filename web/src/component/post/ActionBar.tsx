import { Bookmark, BookmarkCheck, Heart, MessageCircle, Share2 } from 'lucide-react'
import { useTheme } from '../home/themedContext'
import { formatCount } from '../../lib/format'

export interface ActionBarProps {
  likeCount: number
  liked: boolean
  onLike: () => void
  commentCount: number
  onJumpToComments: () => void
  bookmarked: boolean
  onBookmark: () => void
  onShare: () => void
}

/**
 * Sticky action cluster: a vertical rail on desktop (placed in the grid
 * gutter next to the article) and a fixed bottom bar on mobile.
 */
export function ActionBar(props: ActionBarProps & { variant: 'rail' | 'bar' }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  const {
    likeCount,
    liked,
    onLike,
    commentCount,
    onJumpToComments,
    bookmarked,
    onBookmark,
    onShare,
    variant,
  } = props

  const surface = isDark
    ? 'bg-zinc-900/70 border-zinc-800 text-zinc-300'
    : 'bg-white border-zinc-200 text-zinc-600'
  const hover = isDark ? 'hover:border-yellow-400/60 hover:text-yellow-400' : 'hover:border-yellow-500/60 hover:text-yellow-600'
  const active = isDark ? 'text-yellow-400 border-yellow-400/60' : 'text-yellow-600 border-yellow-500/60'

  const items = [
    {
      key: 'like',
      label: formatCount(likeCount),
      title: liked ? 'Remove like' : 'Like this post',
      icon: (
        <Heart
          className={`w-5 h-5 transition-transform ${liked ? 'scale-110 fill-current' : ''}`}
        />
      ),
      onClick: onLike,
      active: liked,
      pressed: liked,
    },
    {
      key: 'comments',
      label: formatCount(commentCount),
      title: 'Jump to comments',
      icon: <MessageCircle className="w-5 h-5" />,
      onClick: onJumpToComments,
      active: false,
      pressed: false,
    },
    {
      key: 'bookmark',
      label: bookmarked ? 'Saved' : 'Save',
      title: bookmarked ? 'Remove from saved' : 'Save for later',
      icon: bookmarked ? (
        <BookmarkCheck className="w-5 h-5" />
      ) : (
        <Bookmark className="w-5 h-5" />
      ),
      onClick: onBookmark,
      active: bookmarked,
      pressed: bookmarked,
    },
    {
      key: 'share',
      label: 'Share',
      title: 'Share this post',
      icon: <Share2 className="w-5 h-5" />,
      onClick: onShare,
      active: false,
      pressed: false,
    },
  ]

  if (variant === 'rail') {
    return (
      <div className="sticky top-44 flex flex-col items-center gap-2">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            title={item.title}
            aria-label={item.title}
            aria-pressed={item.pressed}
            className={`group flex w-14 flex-col items-center gap-1 rounded-2xl border px-1 py-3 transition-all ${surface} ${hover} ${
              item.active ? active : ''
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-black uppercase tracking-wider">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md lg:hidden ${
        isDark ? 'border-zinc-800 bg-zinc-950/90' : 'border-zinc-200 bg-white/95'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-around px-4 py-2">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            title={item.title}
            aria-label={item.title}
            aria-pressed={item.pressed}
            className={`flex min-w-16 flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
              isDark ? 'text-zinc-300' : 'text-zinc-600'
            } ${item.active ? active : ''}`}
          >
            {item.icon}
            <span className="text-[10px] font-black uppercase tracking-wider">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
