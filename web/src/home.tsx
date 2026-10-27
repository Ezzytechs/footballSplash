import { Navbar } from './component/home/Navbar'
import { HeroGrid } from './component/home/HeroGrid'
import { LatestNewsSection } from './component/home/LatestNewsSection'
import { NewsCategories } from './component/home/NewsCategories'
import { Sidebar } from './component/home/Sidebar'
import { Footer } from './component/home/Footer'
import { ThemedApp } from './component/home/ThemedApp'
import './index.css'

function HomeContent() {
  return (
    <>
      {/* 1. Sticky Football Navigation */}
      <Navbar />

      {/* 2. Hero + news + sidebar */}
      <main>
        <HeroGrid />

        <LatestNewsSection />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main column: news grouped by category */}
            <div className="lg:col-span-8 min-w-0">
              <NewsCategories />
            </div>

            {/* Sticky right rail: navigation + football widgets */}
            <Sidebar />
          </div>
        </div>
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
