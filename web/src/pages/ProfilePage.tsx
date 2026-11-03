import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  BadgeCheck,
  BookmarkCheck,
  CalendarDays,
  Check,
  CornerDownRight,
  FileText,
  Heart,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
  MessageSquare,
  Pencil,
  PencilLine,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Navbar } from '../component/home/Navbar'
import { Footer } from '../component/home/Footer'
import { useTheme } from '../component/home/themedContext'
import {
  useChangePassword,
  useMyComments,
  useProfile,
  useUpdateProfile,
} from '../api/profile'
import {
  useDeleteComment,
  useProfileStats,
  useUpdateComment,
} from '../api/admin'
import { useBookmarkedArticles, useLikedArticles } from '../api/library'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useAdminStyles } from '../admin/ui'
import { formatCount, initials, relativeTime } from '../lib/format'

/**
 * Reader profile: who the account is, what it has done (likes, saves, comments,
 * authored stories) and the two fields the API lets a reader change. The saved
 * and liked counts come from the same shelf endpoints the /library page uses,
 * so the numbers always agree with it.
 */
export function ProfilePage() {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const { status, user } = useAuth()
  const signedIn = status === 'authenticated' && Boolean(user)

  const card = isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const faint = isDark ? 'text-zinc-500' : 'text-zinc-400'

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#070b10]' : 'bg-white'}`}>
      <Navbar />

      <main className="flex-1">
        {!signedIn ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className={`rounded-2xl border p-10 text-center ${card}`}>
              <LogIn className={`mx-auto w-8 h-8 ${faint}`} />
              <p className={`mt-3 text-sm font-bold ${heading}`}>
                Sign in to see your profile
              </p>
              <p className={`mt-1 text-xs ${muted}`}>
                Your activity and account settings live with your account.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Link
                  to="/login"
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                    isDark
                      ? 'border-zinc-700 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
                      : 'border-zinc-200 text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
                  }`}
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <ProfileView />
        )}
      </main>

      <Footer />
    </div>
  )
}

function ProfileView() {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const styles = useAdminStyles()
  const { user, updateUser } = useAuth()

  const profile = useProfile()
  const stats = useProfileStats()
  // One row each is enough: only meta.total is displayed.
  const savedShelf = useBookmarkedArticles(1)
  const likedShelf = useLikedArticles(1)
  const comments = useMyComments(5)
  const save = useUpdateProfile()
  const removeComment = useDeleteComment()
  const updateComment = useUpdateComment()
  const changePassword = useChangePassword()

  const [name, setName] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Two-step delete so a stray click cannot remove a comment for good.
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [commentError, setCommentError] = useState<string | null>(null)

  // One row edits at a time; its draft is local until Save.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  // Seed the form once the account arrives; later refetches would otherwise
  // overwrite whatever the reader is typing.
  useEffect(() => {
    if (!profile.data) return
    setName(profile.data.name)
  }, [profile.data])

  const account = profile.data
  const displayName = account?.name ?? user?.name ?? ''
  const accountEmail = account?.email ?? user?.email ?? ''
  const joinedAt = account?.createdAt ?? user?.createdAt
  const role = account?.role ?? user?.role ?? 'READER'
  const verified = Boolean(account?.emailVerifiedAt ?? user?.emailVerifiedAt)

  // The address is fixed, so only a name change is a change.
  const dirty = name.trim() !== displayName

  const card = isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const faint = isDark ? 'text-zinc-500' : 'text-zinc-400'
  const divider = isDark ? 'border-zinc-800' : 'border-zinc-200'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setNotice(null)
    setError(null)

    if (name.trim() === displayName) {
      setNotice('Nothing to save — your name is unchanged.')
      return
    }

    try {
      const result = await save.mutateAsync({ name: name.trim() })
      // Keep the session copy in step so the navbar greets the new name.
      updateUser(result.user)
      setNotice(result.message)
    } catch (err) {
      setError(errorMessage(err, 'Could not save your profile'))
    }
  }

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordNotice(null)
    setPasswordError(null)

    if (newPassword.length < 8) {
      setPasswordError('The new password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match')
      return
    }

    try {
      const result = await changePassword.mutateAsync({
        currentPassword,
        newPassword,
      })
      // Nothing to re-enter: the old password is gone.
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordNotice(result.message || 'Password updated')
    } catch (err) {
      setPasswordError(errorMessage(err, 'Could not change your password'))
    }
  }

  const handleDeleteComment = async (id: string) => {
    setCommentError(null)
    setDeletingId(id)
    try {
      await removeComment.mutateAsync(id)
      setConfirmingId(null)
      setEditingId((current) => (current === id ? null : current))
    } catch (err) {
      setCommentError(errorMessage(err, 'Could not delete that comment'))
    } finally {
      setDeletingId(null)
    }
  }

  const startEditing = (id: string, content: string) => {
    setEditingId(id)
    setDraft(content)
    setConfirmingId(null)
    setCommentError(null)
  }

  const handleSaveComment = async (id: string) => {
    const content = draft.trim()
    if (!content) {
      setCommentError('A comment cannot be empty')
      return
    }
    setCommentError(null)
    setSavingId(id)
    try {
      await updateComment.mutateAsync({ id, content })
      setEditingId(null)
    } catch (err) {
      setCommentError(errorMessage(err, 'Could not save that comment'))
    } finally {
      setSavingId(null)
    }
  }

  const tiles: Array<{
    key: string
    label: string
    hint: string
    value: number | undefined
    icon: typeof Heart
    to?: string
    tone: string
  }> = [
    {
      key: 'liked',
      label: 'Articles liked',
      hint: 'Stories you gave a like',
      value: likedShelf.data?.meta.total,
      icon: Heart,
      to: '/library',
      tone: 'text-red-500',
    },
    {
      key: 'saved',
      label: 'Articles saved',
      hint: 'Waiting in your library',
      value: savedShelf.data?.meta.total,
      icon: BookmarkCheck,
      to: '/library',
      tone: 'text-yellow-500',
    },
    {
      key: 'comments',
      label: 'Comments',
      hint: 'Replies you have written',
      value: stats.data?.comments,
      icon: MessageSquare,
      tone: 'text-blue-500',
    },
    {
      key: 'articles',
      label: 'Articles authored',
      hint: 'Published and in draft',
      value: stats.data?.articles,
      icon: FileText,
      to: role !== 'READER' ? '/admin/articles' : undefined,
      tone: 'text-emerald-500',
    },
  ]

  return (
    <>
      {/* ------------------------------------------------------- header */}
      <header className={`border-b ${divider}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-wrap items-center gap-5">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-yellow-400 via-lime-400 to-emerald-500 text-2xl font-black text-black shadow-lg shadow-lime-500/20">
              {initials(displayName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${heading}`}>
                  {displayName || 'Your profile'}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    isDark ? 'bg-yellow-400/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
                  }`}
                >
                  {role}
                </span>
                {verified ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-500">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-500">
                    <XCircle className="w-3.5 h-3.5" /> Unverified
                  </span>
                )}
              </div>
              <p className={`mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${muted}`}>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {accountEmail}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Joined {joinedAt ? formatJoined(joinedAt) : '—'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* --------------------------------------------- activity */}
          <section aria-label="Activity summary">
            <h2 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${heading}`}>
              <span className="w-1 h-4 bg-yellow-400 rounded-full" />
              Activity
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {tiles.map((tile) => {
                const Icon = tile.icon
                const body = (
                  <>
                    <Icon className={`w-4 h-4 ${tile.tone}`} />
                    <span className={`mt-2 text-2xl font-extrabold leading-none ${heading}`}>
                      {tile.value === undefined ? '—' : formatCount(tile.value)}
                    </span>
                    <span className={`mt-1 text-[11px] font-black uppercase tracking-wider ${muted}`}>
                      {tile.label}
                    </span>
                    <span className={`mt-0.5 text-[11px] ${faint}`}>{tile.hint}</span>
                  </>
                )
                const shell = `flex flex-col rounded-2xl border p-4 transition-colors ${card}`
                return tile.to ? (
                  <Link
                    key={tile.key}
                    to={tile.to}
                    className={`${shell} ${isDark ? 'hover:border-yellow-400/40' : 'hover:border-yellow-500/40'}`}
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={tile.key} className={shell}>
                    {body}
                  </div>
                )
              })}
            </div>
          </section>

          {/* ------------------------------------- recent comments */}
          <section
            aria-label="Recent comments"
            className={`rounded-2xl border p-5 sm:p-6 ${card}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${heading}`}>
                <span className="w-1 h-4 bg-yellow-400 rounded-full" />
                Recent comments
              </h2>
              {comments.data && (
                <span className={`text-[11px] font-bold ${faint}`}>
                  {formatCount(comments.data.meta.total)}{' '}
                  {comments.data.meta.total === 1 ? 'comment' : 'comments'} in total
                </span>
              )}
            </div>

            {comments.isLoading && (
              <div className="mt-4 space-y-2">
                {[0, 1].map((index) => (
                  <div
                    key={index}
                    className={`h-16 animate-pulse rounded-xl border ${
                      isDark
                        ? 'border-zinc-800 bg-zinc-900/60'
                        : 'border-zinc-200 bg-zinc-50'
                    }`}
                  />
                ))}
              </div>
            )}

            {comments.isError && (
              <p className={`mt-4 text-xs ${muted}`}>
                Your comments could not be loaded.{' '}
                <button
                  type="button"
                  onClick={() => void comments.refetch()}
                  className="font-bold text-yellow-600 transition-colors hover:text-yellow-500"
                >
                  Try again
                </button>
              </p>
            )}

            {comments.data && comments.data.items.length === 0 && (
              <p className={`mt-4 text-xs ${muted}`}>
                Nothing yet — join a conversation under any story and it will
                show up here.
              </p>
            )}

            {comments.data && comments.data.items.length > 0 && (
              <ul className={`mt-4 divide-y ${divider}`}>
                {comments.data.items.map((comment) => (
                  <li key={comment.id} className="py-3 first:pt-0 last:pb-0">
                    {editingId === comment.id ? (
                      <div>
                        <textarea
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          rows={3}
                          maxLength={2000}
                          aria-label="Edit your comment"
                          className={styles.input}
                        />
                        <p className={`mt-1 text-[11px] ${faint}`}>
                          {draft.length}/2000
                        </p>
                      </div>
                    ) : (
                      <p className={`line-clamp-3 text-sm leading-relaxed ${heading}`}>
                        {comment.content}
                      </p>
                    )}
                    <div
                      className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] ${muted}`}
                    >
                      <Link
                        to={`/post/${comment.article.slug}`}
                        className="max-w-full truncate font-bold text-yellow-600 transition-colors hover:text-yellow-500"
                        title={comment.article.title}
                      >
                        {comment.article.title}
                      </Link>
                      <span>{relativeTime(comment.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {formatCount(comment._count.likes)}
                      </span>
                      {comment._count.replies > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {formatCount(comment._count.replies)}
                        </span>
                      )}
                    </div>

                    {/* Reply opens the story's discussion; edit happens in
                        place and delete asks for a second click first. */}
                    {editingId === comment.id ? (
                      <div className="mt-2 flex items-center gap-3 text-[11px] font-black uppercase tracking-wider">
                        <button
                          type="button"
                          onClick={() => void handleSaveComment(comment.id)}
                          disabled={savingId === comment.id || !draft.trim()}
                          className="flex items-center gap-1 text-yellow-600 transition-colors hover:text-yellow-500 disabled:opacity-60"
                        >
                          {savingId === comment.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          {savingId === comment.id ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null)
                            setCommentError(null)
                          }}
                          disabled={savingId === comment.id}
                          className={`${faint} transition-colors hover:text-yellow-500 disabled:opacity-60`}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                    <div className="mt-2 flex items-center gap-3 text-[11px] font-black uppercase tracking-wider">
                      <Link
                        to={`/post/${comment.article.slug}?reply=${
                          comment.parentId ?? comment.id
                        }#comments`}
                        className="flex items-center gap-1 text-yellow-600 transition-colors hover:text-yellow-500"
                      >
                        <CornerDownRight className="w-3 h-3" /> Reply
                      </Link>
                      <button
                        type="button"
                        onClick={() => startEditing(comment.id, comment.content)}
                        className={`flex items-center gap-1 ${faint} transition-colors hover:text-yellow-500`}
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>

                      {confirmingId === comment.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleDeleteComment(comment.id)}
                            disabled={deletingId === comment.id}
                            className="flex items-center gap-1 text-red-500 transition-colors hover:text-red-400 disabled:opacity-60"
                          >
                            {deletingId === comment.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            {deletingId === comment.id ? 'Deleting…' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            disabled={deletingId === comment.id}
                            className={`${faint} transition-colors hover:text-yellow-500 disabled:opacity-60`}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCommentError(null)
                            setConfirmingId(comment.id)
                          }}
                          className={`flex items-center gap-1 ${faint} transition-colors hover:text-red-500`}
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                    </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {commentError && (
              <p role="alert" className="mt-3 text-xs font-bold text-red-500">
                {commentError}
              </p>
            )}
          </section>

          {/* ----------------------------------------- edit profile */}
          <section aria-label="Edit profile" className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
            <h2 className={`text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2 ${heading}`}>
              <span className="w-1 h-4 bg-yellow-400 rounded-full" />
              Edit profile
            </h2>
            <p className={`text-[11px] ${muted}`}>
              Your display name is the only detail you can change here; the email
              address on the account stays as it is.
            </p>

            {notice && (
              <div
                role="status"
                className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-xs font-bold text-green-500"
              >
                {notice}
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500"
              >
                {error}
              </div>
            )}

            {profile.isLoading ? (
              <div className="mt-5 space-y-3">
                {[0, 1].map((index) => (
                  <div
                    key={index}
                    className={`h-11 animate-pulse rounded-xl border ${
                      isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="profile-name" className={`mb-1.5 block text-xs font-bold ${muted}`}>
                    Display name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    required
                    maxLength={100}
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={styles.input}
                  />
                </div>
                <div>
                  {/* Shown, never edited: the account keeps the address it was
                      set up with. */}
                  <label htmlFor="profile-email" className={`mb-1.5 block text-xs font-bold ${muted}`}>
                    Email address (fixed)
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={accountEmail}
                    readOnly
                    disabled
                    aria-describedby="profile-email-hint"
                    className={`${styles.input} cursor-not-allowed opacity-60`}
                  />
                  <p id="profile-email-hint" className={`mt-1.5 text-[11px] ${faint}`}>
                    Email addresses cannot be changed from your profile.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={!dirty || save.isPending}
                    className={styles.primaryBtn}
                  >
                    {save.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PencilLine className="w-4 h-4" />
                    )}
                    {save.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    disabled={!dirty || save.isPending}
                    onClick={() => {
                      setName(displayName)
                      setNotice(null)
                      setError(null)
                    }}
                    className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      isDark
                        ? 'border-zinc-700 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
                        : 'border-zinc-200 text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
                    }`}
                  >
                    Reset
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* --------------------------------------- change password */}
          <section aria-label="Change password" className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
            <h2 className={`text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2 ${heading}`}>
              <span className="w-1 h-4 bg-yellow-400 rounded-full" />
              Change password
            </h2>
            <p className={`text-[11px] ${muted}`}>
              Your current password confirms the change. Other devices are signed
              out; this one stays signed in.
            </p>

            {passwordNotice && (
              <div
                role="status"
                className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-xs font-bold text-green-500"
              >
                {passwordNotice}
              </div>
            )}
            {passwordError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500"
              >
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="current-password" className={`mb-1.5 block text-xs font-bold ${muted}`}>
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={styles.input}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-password" className={`mb-1.5 block text-xs font-bold ${muted}`}>
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className={styles.input}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className={`mb-1.5 block text-xs font-bold ${muted}`}>
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Type it again"
                    className={styles.input}
                  />
                  {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                    <p className="mt-1.5 text-[11px] font-bold text-amber-500">
                      Passwords do not match yet
                    </p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={
                  changePassword.isPending ||
                  !currentPassword ||
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword
                }
                className={styles.primaryBtn}
              >
                {changePassword.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                {changePassword.isPending ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>
        </div>

        {/* ------------------------------------------------ side rail */}
        <aside className="space-y-5">
          <section className={`rounded-2xl border p-5 ${card}`} aria-label="Account details">
            <h2 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${heading}`}>
              <ShieldCheck className="w-4 h-4 text-yellow-500" />
              Account
            </h2>
            <dl className="space-y-2.5 text-xs">
              <Detail label="Role" value={role} muted={muted} strong={heading} />
              <Detail
                label="Status"
                value={account?.isActive === false ? 'Suspended' : 'Active'}
                muted={muted}
                strong={heading}
              />
              <Detail
                label="Email"
                value={verified ? 'Verified' : 'Not verified'}
                muted={muted}
                strong={heading}
              />
              <Detail
                label="Member since"
                value={joinedAt ? formatJoined(joinedAt) : '—'}
                muted={muted}
                strong={heading}
              />
              {account && (
                <Detail
                  label="Last update"
                  value={formatJoined(account.updatedAt)}
                  muted={muted}
                  strong={heading}
                />
              )}
            </dl>
          </section>

          <section className={`rounded-2xl border p-5 ${card}`} aria-label="Shortcuts">
            <h2 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${heading}`}>
              <span className="w-1 h-4 bg-yellow-400 rounded-full" />
              Shortcuts
            </h2>
            <div className="space-y-2">
              <Shortcut to="/library" label="Saved stories" meta={savedShelf.data?.meta.total} isDark={isDark} />
              <Shortcut to="/library" label="Liked stories" meta={likedShelf.data?.meta.total} isDark={isDark} />
              {role !== 'READER' && (
                <Shortcut to="/admin/articles" label="Your newsroom" isDark={isDark} action="Dashboard" />
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}

function Detail({
  label,
  value,
  muted,
  strong,
}: {
  label: string
  value: ReactNode
  muted: string
  strong: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={muted}>{label}</dt>
      <dd className={`text-right font-bold ${strong}`}>{value}</dd>
    </div>
  )
}

function Shortcut({
  to,
  label,
  meta,
  isDark,
  action,
}: {
  to: string
  label: string
  meta?: number
  isDark: boolean
  action?: string
}) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
        isDark
          ? 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-yellow-400'
          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-yellow-600'
      }`}
    >
      <span>{label}</span>
      <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
        {meta === undefined ? (action ?? '→') : formatCount(meta)}
      </span>
    </Link>
  )
}

/** "3 November 2026" — long form, no locale surprises. */
function formatJoined(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
