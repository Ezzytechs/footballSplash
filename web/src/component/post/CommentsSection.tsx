import { useState } from 'react'
import type { FormEvent } from 'react'
import { Heart, MessageCircle, Send } from 'lucide-react'
import { useTheme } from '../home/themedContext'
import {
  useCommentsQuery,
  useCreateComment,
  useLikeComment,
} from '../../api/queries'
import { errorMessage, isAuthError } from '../../api/client'
import type { CommentNode, CommentThread } from '../../api/types'
import { initials, relativeTime } from '../../lib/format'
import { useNotice } from '../../lib/notice-context'

const SIGN_IN_LIKE = 'Sign in to like comments'
const SIGN_IN_COMMENT = 'Sign in to join the discussion'

export function CommentsSection({ articleId }: { articleId: string }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const notify = useNotice()

  const [limit, setLimit] = useState(10)
  const [draft, setDraft] = useState('')
  const { data, isLoading, isError } = useCommentsQuery(articleId, limit)
  const create = useCreateComment(articleId)

  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const surface = isDark
    ? 'bg-zinc-900/50 border-zinc-800/80'
    : 'bg-white border-zinc-200/80'

  const total = data?.meta.total ?? 0
  const remaining = total - (data?.items.length ?? 0)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || create.isPending) return
    create.mutate(
      { content },
      {
        onSuccess: () => {
          setDraft('')
          notify('Comment posted')
        },
        onError: (error) =>
          notify(
            isAuthError(error)
              ? SIGN_IN_COMMENT
              : errorMessage(error, 'Could not post your comment'),
          ),
      },
    )
  }

  return (
    <section id="comments" aria-labelledby="comments-heading">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2
          id="comments-heading"
          className={`text-xl font-extrabold flex items-center gap-2 ${heading}`}
        >
          <span className="w-1.5 h-6 bg-yellow-400 rounded-full" />
          Comments
          <span
            className={`text-sm font-bold tabular-nums ${
              isDark ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            ({total})
          </span>
        </h2>
      </div>

      <form
        onSubmit={submit}
        className={`rounded-2xl border p-4 mb-6 ${surface}`}
      >
        <label htmlFor="comment-draft" className="sr-only">
          Write a comment
        </label>
        <textarea
          id="comment-draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Share your take on this story…"
          className={`w-full resize-y bg-transparent text-sm leading-relaxed placeholder:text-zinc-500 focus:outline-none ${
            isDark ? 'text-zinc-200' : 'text-zinc-800'
          }`}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className={`text-[11px] ${muted}`}>
            {draft.length}/2000 · be specific, be civil
          </p>
          <button
            type="submit"
            disabled={create.isPending || !draft.trim()}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            {create.isPending ? 'Posting…' : 'Post comment'}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="space-y-4">
          {[0, 1].map((index) => (
            <div
              key={index}
              className={`h-24 animate-pulse rounded-2xl border ${surface}`}
            />
          ))}
        </div>
      )}

      {isError && (
        <p className={`text-sm ${muted}`}>
          Comments could not be loaded right now.
        </p>
      )}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <div
          className={`rounded-2xl border p-8 text-center ${surface}`}
        >
          <MessageCircle
            className={`mx-auto w-8 h-8 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}
          />
          <p className={`mt-3 text-sm font-bold ${heading}`}>
            No comments yet
          </p>
          <p className={`mt-1 text-xs ${muted}`}>
            Be the first to weigh in on this story.
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-5">
          {data.items.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              articleId={articleId}
            />
          ))}

          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setLimit((value) => value + 10)}
              className={`w-full rounded-xl border py-3 text-xs font-black uppercase tracking-widest transition-colors ${
                isDark
                  ? 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
              }`}
            >
              Show {Math.min(remaining, 10)} more comments
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function CommentItem({
  comment,
  articleId,
  isReply = false,
}: {
  comment: CommentThread | CommentNode
  articleId: string
  isReply?: boolean
}) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const notify = useNotice()

  const replies = 'replies' in comment ? comment.replies : []
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment._count.likes)
  const [replying, setReplying] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')

  const like = useLikeComment()
  const create = useCreateComment(articleId)

  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-500' : 'text-zinc-400'

  const toggleLike = () => {
    if (like.isPending) return
    like.mutate(
      { commentId: comment.id, liked, articleId },
      {
        onSuccess: (data) => {
          setLiked(data.liked)
          setLikeCount(data.likeCount)
        },
        onError: (error) =>
          notify(
            isAuthError(error)
              ? SIGN_IN_LIKE
              : errorMessage(error, 'Could not update the like'),
          ),
      },
    )
  }

  const submitReply = (event: FormEvent) => {
    event.preventDefault()
    const content = replyDraft.trim()
    if (!content || create.isPending) return
    create.mutate(
      { content, parentId: comment.id },
      {
        onSuccess: () => {
          setReplyDraft('')
          setReplying(false)
          notify('Reply posted')
        },
        onError: (error) =>
          notify(
            isAuthError(error)
              ? SIGN_IN_COMMENT
              : errorMessage(error, 'Could not post your reply'),
          ),
      },
    )
  }

  return (
    <article className={`flex gap-3 ${isReply ? '' : ''}`}>
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-yellow-400 to-emerald-500 text-xs font-black text-black`}
        aria-hidden="true"
      >
        {initials(comment.user.name)}
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={`rounded-2xl border p-4 ${
            isDark ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-zinc-200/80 bg-white'
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`text-sm font-bold ${heading}`}>
              {comment.user.name}
            </span>
            <span className={`text-[11px] ${muted}`}>
              · {relativeTime(comment.createdAt)}
            </span>
          </div>
          <p
            className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${
              isDark ? 'text-zinc-300' : 'text-zinc-700'
            }`}
          >
            {comment.content}
          </p>

          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={toggleLike}
              aria-pressed={liked}
              className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider transition-colors ${
                liked
                  ? 'text-yellow-500'
                  : isDark
                    ? 'text-zinc-500 hover:text-yellow-400'
                    : 'text-zinc-400 hover:text-yellow-600'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
              {likeCount}
            </button>

            {!isReply && (
              <button
                type="button"
                onClick={() => setReplying((value) => !value)}
                className={`text-[11px] font-black uppercase tracking-wider transition-colors ${
                  isDark
                    ? 'text-zinc-500 hover:text-yellow-400'
                    : 'text-zinc-400 hover:text-yellow-600'
                }`}
              >
                Reply
              </button>
            )}
          </div>
        </div>

        {replying && (
          <form
            onSubmit={submitReply}
            className={`mt-2 rounded-2xl border p-3 ${
              isDark
                ? 'border-zinc-800 bg-zinc-900/60'
                : 'border-zinc-200 bg-white'
            }`}
          >
            <label className="sr-only" htmlFor={`reply-${comment.id}`}>
              Write a reply
            </label>
            <textarea
              id={`reply-${comment.id}`}
              rows={2}
              maxLength={2000}
              value={replyDraft}
              onChange={(event) => setReplyDraft(event.target.value)}
              placeholder={`Reply to ${comment.user.name}…`}
              className={`w-full resize-y bg-transparent text-sm focus:outline-none ${
                isDark ? 'text-zinc-200' : 'text-zinc-800'
              }`}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplying(false)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending || !replyDraft.trim()}
                className="rounded-lg bg-yellow-400 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300 disabled:opacity-40"
              >
                Reply
              </button>
            </div>
          </form>
        )}

        {replies.length > 0 && (
          <div className={`mt-3 space-y-3 border-l-2 pl-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                articleId={articleId}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
