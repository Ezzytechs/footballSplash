import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Loader2, Trash2, Upload } from 'lucide-react'
import { firstSuccessful, useCategoriesQuery, useTagsQuery } from '../api/queries'
import { useCreateArticle, useUpdateArticle, useUploadFile } from '../api/admin'
import { useAuth } from '../auth/AuthContext'
import { errorMessage } from '../api/client'
import type { ArticleStatus, ArticleSummary } from '../api/types'
import { Modal, useAdminStyles } from './ui'

const STATUSES: ArticleStatus[] = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']

interface ArticleEditorProps {
  /** When present the form edits this article instead of creating one. */
  article?: ArticleSummary | null
  onClose: () => void
  onSaved: (message: string) => void
}

/**
 * Mounted only while the dialog is open, so every field (and the WYSIWYG body
 * editor) initialises straight from the props instead of being reset in an
 * effect.
 */
export function ArticleEditor({ article, onClose, onSaved }: ArticleEditorProps) {
  const styles = useAdminStyles()
  const { user } = useAuth()
  // Authors draft and submit; only editors and admins take a story live.
  // The edit dialog only renders for the author of the article they are
  // looking at, so a preview page for another writer cannot reach this form.
  const isAuthor = user?.role === 'AUTHOR'
  const categories = useCategoriesQuery()
  const tags = useTagsQuery()

  const createMutation = useCreateArticle()
  const updateMutation = useUpdateArticle()
  const uploadMutation = useUploadFile()

  const [title, setTitle] = useState(article?.title ?? '')
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? '')
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? '')
  const [tagIds, setTagIds] = useState<string[]>(
    article?.tags.map((tag) => tag.id) ?? [],
  )
  const [status, setStatus] = useState<ArticleStatus>(
    (article?.status as ArticleStatus) ?? 'DRAFT',
  )
  const [error, setError] = useState('')
  // True once the stored body has been loaded (edit) — or immediately (create).
  const [contentLoaded, setContentLoaded] = useState(!article)

  // An author can only open this dialog to edit their own article. Editors
  // and admins own the whole editorial toolset.
  const canEditOwn = Boolean(
    (isAuthor && article?.author?.id && user?.id === article.author.id) ||
    user?.role === 'EDITOR' ||
    user?.role === 'ADMIN',
  )

  // WYSIWYG body editor (Tiptap). Created once and re-populated every time the
  // dialog opens; every edit is mirrored back into the `content` state so the
  // article save always sends the current HTML.
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: true } })],
    content: '',
    editorProps: {
      attributes: {
        // Dark canvas: white text plus readable spacing/typography for the
        // elements StarterKit produces (headings, lists, quotes, code, links).
        class:
          'text-sm leading-7 text-white break-words focus:outline-none ' +
          '[&_p]:my-2 ' +
          '[&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-extrabold ' +
          '[&_h2]:my-2 [&_h2]:text-xl [&_h2]:font-bold ' +
          '[&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-bold ' +
          '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 ' +
          '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 ' +
          '[&_li]:my-0.5 ' +
          '[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-yellow-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-zinc-300 ' +
          '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-900 [&_pre]:p-3 [&_pre]:text-sm ' +
          '[&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:text-yellow-300 ' +
          '[&_a]:text-yellow-400 [&_a]:underline ' +
          '[&_hr]:my-4 [&_hr]:border-zinc-700',
      },
    },
    onUpdate: ({ editor: current }) => {
      setContent(current.getHTML())
    },
  })

  // Full content is not part of the list payload, so fetch it when editing.
  // `article` and `editor` are fixed for this mounted instance.
  useEffect(() => {
    if (!article) return

    const loadBody = (html: string) => {
      setContent(html)
      editor.commands.setContent(html)
      setContentLoaded(true)
    }

    // A draft is invisible on /articles/:slug and a published story by another
    // writer is not in /articles/mine/*, so the routes are raced and the first
    // successful body is the one that loads.
    firstSuccessful<{ content: string }>(
      [
        article.id ? `/articles/mine/${article.id}` : null,
        `/articles/mine/${article.slug}`,
        `/articles/${article.slug}`,
      ].filter((path): path is string => Boolean(path)),
    ).then((data) => {
      if (data) loadBody(data.content ?? '')
    })
  }, [article, editor])

  const busy = createMutation.isPending || updateMutation.isPending

  // Only staff changes the status of a story - an editor or admin can set
  // DRAFT, REVIEW, PUBLISHED or ARCHIVED. Authors keep their own story as it
  // is and can only move between DRAFT and REVIEW, so they never publish
  // directly from the editor.
  const statusOptions: ArticleStatus[] = isAuthor
    ? (['DRAFT', 'REVIEW', status] as ArticleStatus[]).filter(
        (value, index, all) => all.indexOf(value) === index,
      )
    : STATUSES

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters')
      return
    }
    // An "empty" Tiptap document is still `<p></p>`, so check the visible text.
    const bodyText = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
    if (!bodyText && (!article || contentLoaded)) {
      setError('Body content is required')
      return
    }
    if (!categoryId) {
      setError('Pick a category')
      return
    }

    const body = {
      title: title.trim(),
      excerpt: excerpt.trim() || undefined,
      // Omit content when the stored body could not be fetched, so a save
      // never wipes the body of an existing article.
      content: contentLoaded || !article ? content : undefined,
      coverImage: coverImage.trim() || undefined,
      categoryId,
      tagIds,
      status,
    }

    try {
      if (article) {
        await updateMutation.mutateAsync({ id: article.id, ...body })
        onSaved('Article updated')
      } else {
        await createMutation.mutateAsync(body)
        onSaved('Article created')
      }
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'Could not save the article'))
    }
  }

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    setError('')
    try {
      const result = await uploadMutation.mutateAsync(file)
      if (!result.nodeId) {
        throw new Error('Upload did not return a file id')
      }
      // Only the nodeId comes back from the backend. Build the full view URL
      // by combining the backend base URL (same VITE_API_URL /api/v1 base the
      // axios client uses) with the nodeId:
      //   <origin>/api/v1/storage/view/<nodeId>?folder=uploads
      const apiBase = import.meta.env.VITE_API_URL || '/api/v1'
      const viewUrl = new URL(
        `${apiBase.replace(/\/$/, '')}/storage/view/${result.nodeId}?folder=uploads`,
        window.location.origin,
      ).toString()
      setCoverImage(viewUrl)
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'))
    }
  }

  return (
    <Modal
      open
      wide
      title={article ? 'Edit article' : 'New article'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {article && !canEditOwn && (
          <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-xs font-bold text-yellow-500">
            You can only edit your own articles.
          </div>
        )}
        {article && !canEditOwn && (
          <div className="mt-3 text-center text-xs font-bold text-zinc-500">
            <button
              type="button"
              onClick={onClose}
              className="font-black text-yellow-500 hover:text-yellow-400"
            >
              Close this dialog
            </button>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500">
            {error}
          </div>
        )}

        {article && !contentLoaded && (
          <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-xs font-bold text-yellow-500">
            The body could not be loaded from the API. Saving will keep the
            stored body untouched.
          </div>
        )}

        <div>
          <label className={`mb-1.5 block text-xs font-bold ${styles.muted}`} htmlFor="title">
            Title
          </label>
          <input
            id="title"
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Late winner seals the derby"
            className={styles.input}
          />
        </div>

        <div>
          <label className={`mb-1.5 block text-xs font-bold ${styles.muted}`} htmlFor="excerpt">
            Excerpt <span className={styles.faint}>(shown on cards, max 500)</span>
          </label>
          <textarea
            id="excerpt"
            rows={2}
            maxLength={500}
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="One-sentence summary of the story"
            className={`${styles.input} resize-y`}
          />
        </div>

        <div>
          <label className={`mb-1.5 block text-xs font-bold ${styles.muted}`} htmlFor="content">
            Body
          </label>
          <div className="overflow-hidden rounded-xl border border-zinc-700 bg-black">
            <EditorToolbar editor={editor} />
            <div className="max-h-[420px] min-h-[240px] overflow-y-auto p-4">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={`mb-1.5 block text-xs font-bold ${styles.muted}`} htmlFor="category">
              Category
            </label>
            <select
              id="category"
              required
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
             className={styles.input}
            >
              <option value="">Select a category…</option>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {(categories.data ?? []).length === 0 && (
              <p className={`mt-1 text-[11px] ${styles.faint}`}>
                No categories yet — create one first.
              </p>
            )}
          </div>

          <div>
            <label className={`mb-1.5 block text-xs font-bold ${styles.muted}`} htmlFor="status">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ArticleStatus)}
              className={styles.input}
            >
              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={`mb-1.5 block text-xs font-bold ${styles.muted}`} htmlFor="cover">
            Cover image
          </label>
          <div className="flex gap-2">
            <input
              id="cover"
              type="url"
              value={coverImage}
              onChange={(event) => setCoverImage(event.target.value)}
              placeholder="https://…/cover.jpg"
              className={styles.input}
            />
            <label className={`${styles.ghostBtn} shrink-0 cursor-pointer`}>
              {uploadMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleUpload(event.target.files?.[0])}
              />
            </label>
          </div>
          {coverImage && (
            <div className="relative mt-2">
              <img
                src={coverImage}
                alt="Cover preview"
                className="h-24 w-full rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={() => setCoverImage('')}
                title="Remove cover image"
                aria-label="Remove cover image"
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white shadow-lg transition-colors hover:bg-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <span className={`mb-1.5 block text-xs font-bold ${styles.muted}`}>Tags</span>
          {(tags.data ?? []).length === 0 ? (
            <p className={`text-[11px] ${styles.faint}`}>No tags created yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(tags.data ?? []).map((tag) => {
                const selected = tagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setTagIds((previous) =>
                        selected
                          ? previous.filter((id) => id !== tag.id)
                          : [...previous, tag.id],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-colors ${
                      selected
                        ? 'border-yellow-400 bg-yellow-400 text-black'
                        : styles.isDark
                          ? 'border-zinc-700 text-zinc-400 hover:border-yellow-400/60'
                          : 'border-zinc-200 text-zinc-600 hover:border-yellow-500/60'
                    }`}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className={`flex justify-end gap-3 border-t pt-4 ${styles.border}`}>
          <button type="button" onClick={onClose} className={styles.ghostBtn}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={styles.primaryBtn}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {busy
              ? 'Saving…'
              : article
                ? 'Save changes'
                : status === 'PUBLISHED'
                  ? 'Publish'
                  : 'Create article'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/** Small toolbar button that keeps focus in the editor while clicked. */
function ToolButton({
  label,
  title,
  active = false,
  onClick,
}: {
  label: ReactNode
  title: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      // Prevent the mousedown from stealing the selection out of the editor.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs font-black transition-colors ${
        active
          ? 'bg-yellow-400 text-black'
          : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

const ToolSeparator = () => (
  <span aria-hidden className="mx-1 h-5 w-px bg-zinc-700" />
)

/**
 * Formatting toolbar for the body editor: headings, emphasis, lists, quotes,
 * code, links and history. Re-renders on editor transactions so the active
 * highlighting tracks the caret.
 */
function EditorToolbar({ editor }: { editor: Editor }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      h1: current.isActive('heading', { level: 1 }),
      h2: current.isActive('heading', { level: 2 }),
      h3: current.isActive('heading', { level: 3 }),
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      underline: current.isActive('underline'),
      strike: current.isActive('strike'),
      bulletList: current.isActive('bulletList'),
      orderedList: current.isActive('orderedList'),
      blockquote: current.isActive('blockquote'),
      codeBlock: current.isActive('codeBlock'),
      link: current.isActive('link'),
    }),
  })

  const toggleLink = () => {
    if (active.link) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    const href = window.prompt('Link URL', 'https://')
    if (href) {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800 bg-zinc-950 px-2 py-2">
      <ToolButton
        label="H1"
        title="Heading 1"
        active={active.h1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolButton
        label="H2"
        title="Heading 2"
        active={active.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolButton
        label="H3"
        title="Heading 3"
        active={active.h3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolSeparator />
      <ToolButton
        label={<span className="font-bold">B</span>}
        title="Bold"
        active={active.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolButton
        label={<span className="italic">I</span>}
        title="Italic"
        active={active.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolButton
        label={<span className="underline">U</span>}
        title="Underline"
        active={active.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolButton
        label={<span className="line-through">S</span>}
        title="Strikethrough"
        active={active.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolSeparator />
      <ToolButton
        label="•"
        title="Bullet list"
        active={active.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolButton
        label="1."
        title="Numbered list"
        active={active.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolButton
        label="”"
        title="Blockquote"
        active={active.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolButton
        label="</>"
        title="Code block"
        active={active.codeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <ToolSeparator />
      <ToolButton
        label="Link"
        title="Add or remove link"
        active={active.link}
        onClick={toggleLink}
      />
      <ToolSeparator />
      <ToolButton
        label="↶"
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolButton
        label="↷"
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  )
}
