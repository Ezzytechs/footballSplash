import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Home from './home'
import { CategoryPage } from './pages/CategoryPage'
import { PostPage } from './pages/PostPage'
import { LiveScoresPage } from './pages/LiveScoresPage'
import { TagPage } from './pages/TagPage'
import { SignupPage } from './pages/SignupPage'
import { LibraryPage } from './pages/LibraryPage'
import { ProfilePage } from './pages/ProfilePage'
import {
  ForgotPasswordPage,
  ResetPasswordPage,
} from './pages/PasswordPages'
import {
  ContactPage,
  EditorialGuidelinesPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
} from './pages/InfoPages'
import { ThemedApp } from './component/home/ThemedApp'
import { Footer } from './component/home/Footer'
import { Navbar } from './component/home/Navbar'
import { AdminLayout, RoleGate } from './admin/AdminLayout'
import { LoginPage } from './admin/LoginPage'
import { OverviewPage } from './admin/OverviewPage'
import { ArticlesPage } from './admin/ArticlesPage'
import { EditArticlePage } from './admin/EditArticlePage'
import { CategoriesPage } from './admin/CategoriesPage'
import { TagsPage } from './admin/TagsPage'
import { UsersPage } from './admin/UsersPage'

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

        {/* Reader dashboard: saved and liked stories */}
        <Route
          path="/library"
          element={
            <ThemedApp>
              <LibraryPage />
            </ThemedApp>
          }
        />

        {/* Reader profile: activity breakdown and account settings */}
        <Route
          path="/profile"
          element={
            <ThemedApp>
              <ProfilePage />
            </ThemedApp>
          }
        />

        {/* Public information pages linked from the footer */}
        <Route
          path="/live-scores"
          element={
            <ThemedApp>
              <Navbar />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <LiveScoresPage />
              </main>
              <Footer />
            </ThemedApp>
          }
        />
        <Route
          path="/privacy"
          element={
            <ThemedApp>
              <PrivacyPolicyPage />
            </ThemedApp>
          }
        />
        <Route
          path="/terms"
          element={
            <ThemedApp>
              <TermsOfServicePage />
            </ThemedApp>
          }
        />
        <Route
          path="/editorial"
          element={
            <ThemedApp>
              <EditorialGuidelinesPage />
            </ThemedApp>
          }
        />
        <Route
          path="/contact"
          element={
            <ThemedApp>
              <ContactPage />
            </ThemedApp>
          }
        />

        {/* Reader accounts: register, then sign in from either entry point */}
        <Route
          path="/signup"
          element={
            <ThemedApp>
              <SignupPage />
            </ThemedApp>
          }
        />
        <Route
          path="/login"
          element={
            <ThemedApp>
              <LoginPage />
            </ThemedApp>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <ThemedApp>
              <ForgotPasswordPage />
            </ThemedApp>
          }
        />
        <Route
          path="/reset-password"
          element={
            <ThemedApp>
              <ResetPasswordPage />
            </ThemedApp>
          }
        />

        {/* Admin dashboard — guarded by AuthProvider inside AdminLayout */}
        <Route
          path="/admin/login"
          element={
            <ThemedApp>
              <LoginPage />
            </ThemedApp>
          }
        />
        <Route
          path="/admin"
          element={
            <ThemedApp>
              <AdminLayout />
            </ThemedApp>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="articles" element={<ArticlesPage />} />
          <Route path="articles/all" element={<ArticlesPage />} />
          <Route path="articles/:slug/edit" element={<EditArticlePage />} />
          <Route
            path="categories"
            element={
              <RoleGate allow={['ADMIN', 'EDITOR']}>
                <CategoriesPage />
              </RoleGate>
            }
          />
          <Route
            path="tags"
            element={
              <RoleGate allow={['ADMIN', 'EDITOR']}>
                <TagsPage />
              </RoleGate>
            }
          />
          <Route
            path="users"
            element={
              <RoleGate allow={['ADMIN']}>
                <UsersPage />
              </RoleGate>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
