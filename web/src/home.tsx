import { useEffect, useRef, useState } from 'react'
import { Navbar } from './component/home/Navbar'
import { HeroGrid } from './component/home/HeroGrid'
import { LatestNewsSection } from './component/home/LatestNewsSection'
import { NewsCategories } from './component/home/NewsCategories'
import { LiveScoreSection } from './component/home/LiveScoreSection'
import { Sidebar } from './component/home/Sidebar'
import { CategoryStrip } from './component/home/CategoryStrip'
import { splitBodyCategories, useCategorySlots } from './component/home/categorySlots'
import { Footer } from './component/home/Footer'
import { ThemedApp } from './component/home/ThemedApp'
import { useTheme } from './component/home/themedContext'
import './index.css'

function HomeContent() {
  // The navbar takes the first six categories and the sidebar the next four;
  // whatever is left is shared around the body, never in a single block.
  const { body } = useCategorySlots()
  const { topStrip, bottomStrip } = splitBodyCategories(body)
  const { theme } = useTheme()
  const isDark = theme === 'night'

  // The rail's ceiling is this column, not the viewport: a short rail sticks,
  // a tall one scrolls inside the column's height. Measured live because the
  // headlines and category feeds arrive after the first paint.
  const columnRef = useRef<HTMLDivElement | null>(null)
  const [columnHeight, setColumnHeight] = useState<number | null>(null)

  useEffect(() => {
    const node = columnRef.current
    if (!node) return
    const observer = new ResizeObserver(() => setColumnHeight(node.offsetHeight))
    observer.observe(node)
    setColumnHeight(node.offsetHeight)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* 1. Sticky Football Navigation */}
      <Navbar />

      {/* 2. Hero + news + sidebar */}
      <main>
        <HeroGrid />

        {/* Top one-line strip: shares the first body categories */}
        <CategoryStrip label="Explore sections" categories={topStrip} />

        {/* The headlines column and the right rail share one grid row, so the
            sidebar starts level with the LATEST HEADLINES heading instead of
            being pushed below the whole strip. */}
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 border-t ${
            isDark ? 'border-zinc-900' : 'border-zinc-200'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main column: headlines, then news grouped by category */}
            <div ref={columnRef} className="lg:col-span-8 min-w-0">
              <LatestNewsSection />
              <LiveScoreSection />
              <NewsCategories />
            </div>

            {/* Sticky right rail: navigation + football widgets */}
            <Sidebar railMaxHeight={columnHeight} />
          </div>
        </div>

        {/* Bottom one-line strip: shares the last body categories */}
        <CategoryStrip label="More to explore" categories={bottomStrip} />
      </main>

      {/* 3. Footer */}
      <Footer />
    </>
  )
}

// --- Landing page shell ---
export default function App() {
  return (
    <ThemedApp>
      <HomeContent />
    </ThemedApp>
  )
}
