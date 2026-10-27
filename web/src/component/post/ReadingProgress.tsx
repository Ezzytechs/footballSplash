import { useEffect, useState } from 'react'

/**
 * Slim reading indicator pinned above the sticky header. It measures the
 * article body rather than the document so the bar completes exactly when
 * the last paragraph is reached.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const element = document.getElementById(targetId)
      if (!element) {
        setProgress(0)
        return
      }
      const rect = element.getBoundingClientRect()
      const travel = rect.height - window.innerHeight
      const ratio =
        travel > 0
          ? -rect.top / travel
          : rect.top <= 0
            ? 1
            : 0
      setProgress(Math.min(1, Math.max(0, ratio)))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [targetId])

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <div
        className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.7)] transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
}
