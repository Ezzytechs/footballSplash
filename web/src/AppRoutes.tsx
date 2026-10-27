import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Home from './home'
import { CategoryPage } from './pages/CategoryPage'
import { PostPage } from './pages/PostPage'
import { TagPage } from './pages/TagPage'
import { ThemedApp } from './component/home/ThemedApp'
import { Footer } from './component/home/Footer'
import { Navbar } from './component/home/Navbar'

/** Routes change scroll position; every navigation starts back at the top. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <ThemedApp>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <p className="text-6xl font-black text-yellow-400">404</p>
        <h1 className="mt-4 text-2xl font-extrabold">
          That page has gone missing
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          The story you are looking for may have been unpublished or renamed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"
        >
          Back to the homepage
        </Link>
      </main>
      <Footer />
    </ThemedApp>
  )
}

export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post/:slug" element={<PostPage />} />
        <Route path="/tag/:slug" element={<TagPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
