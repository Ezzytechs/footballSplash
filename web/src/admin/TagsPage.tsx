import { useState } from 'react'
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { useTagsQuery } from '../api/queries'
import { useCreateTag, useDeleteTag, useUpdateTag } from '../api/admin'
import type { TagWithCount } from '../api/types'
import { errorMessage } from '../api/client'
import { EmptyState, Modal, PageHeader, SkeletonRows, useAdminStyles } from './ui'

export function TagsPage() {
  const styles = useAdminStyles()
  const { data: tags = [], isLoading, isError, error, refetch } = useTagsQuery()

  const create = useCreateTag()
  const update = useUpdateTag()
  const remove = useDeleteTag()

  const [name, setName] = useState('')
  const [editing, setEditing] = useState<TagWithCount | null>(null)
  const [editName, setEditName] = useState('')
  const [confirm, setConfirm] = useState<TagWithCount | null>(null)
  const [failure, setFailure] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    setFailure('')
    try {
      await create.mutateAsync({ name: name.trim() })
      setName('')
    } catch (err) {
      setFailure(errorMessage(err, 'Could not create the tag'))
    }
  }

  const handleUpdate = async () => {
    if (!editing || !editName.trim()) return
    setFailure('')
    try {
      await update.mutateAsync({ id: editing.id, name: editName.trim() })
      setEditing(null)
    } catch (err) {
      setFailure(errorMessage(err, 'Could not save the tag'))
    }
  }

  const handleDelete = async (id: string) => {
    setFailure('')
    try {
      await remove.mutateAsync(id)
    } catch (err) {
      setFailure(errorMessage(err, 'Could not delete the tag'))
    }
  }

  return (
    <div>
      <PageHeader
        title="Tags"
        icon={<Tag className="w-5 h-5 text-yellow-400" />}
        hint="Free-form labels attached to stories."
      />

      <div className={`mt-6 rounded-2xl border p-4 ${styles.surface}`}>
        <h2 className={`text-xs font-black uppercase tracking-wider ${styles.muted}`}>
          Add tag
        </h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tag name"
            className={styles.input}
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={create.isPending}
            className={`${styles.primaryBtn} shrink-0`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {failure ? (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500">
          {failure}
        </p>
      ) : null}

      {isLoading && <SkeletonRows rows={3} />}

      {!isLoading && isError && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-sm font-bold text-red-500">Could not load tags.</p>
          <p className="mt-1 text-xs text-red-400">{(error as Error).message}</p>
          <button type="button" onClick={() => void refetch()} className={`${styles.primaryBtn} mt-4`}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && tags.length === 0 && (
        <EmptyState icon="🏷️" heading="No tags yet" body="Add a tag above to organise your stories." />
      )}

      {!isLoading && !isError && tags.length > 0 && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${styles.surface}`}
            >
              <div className="min-w-0">
                <p className={`truncate text-sm font-black ${styles.heading}`}>{tag.name}</p>
                <p className={`text-xs ${styles.muted}`}>#{tag.slug}</p>
                <p className={`text-[11px] ${styles.faint}`}>
                  {tag._count?.articles ?? 0} article(s)
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(tag)
                    setEditName(tag.name)
                  }}
                  aria-label={`Rename ${tag.name}`}
                  className={`rounded-lg p-1.5 transition-colors hover:text-yellow-500 ${styles.muted}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm(tag)}
                  aria-label={`Delete ${tag.name}`}
                  className={`rounded-lg p-1.5 transition-colors hover:text-red-400 ${styles.muted}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal
          title="Rename tag"
          onClose={() => setEditing(null)}
          confirmLabel="Save"
          onConfirm={() => void handleUpdate()}
        >
          <input
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            className={styles.input}
          />
        </Modal>
      )}

      {confirm && (
        <Modal
          title="Delete tag?"
          onClose={() => setConfirm(null)}
          confirmLabel="Delete"
          onConfirm={() => void handleDelete(confirm.id)}
        >
          <p className={`text-sm ${styles.muted}`}>
            “{confirm.name}” is removed from every story that uses it.
          </p>
        </Modal>
      )}
    </div>
  )
}
