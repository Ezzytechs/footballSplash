import { useState } from 'react'
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCategoriesQuery } from '../api/queries'
import {
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../api/admin'
import type { CategoryWithCount } from '../api/types'
import { errorMessage } from '../api/client'
import { EmptyState, Modal, PageHeader, SkeletonRows, useAdminStyles } from './ui'

export function CategoriesPage() {
  const styles = useAdminStyles()
  const { data: categories = [], isLoading, isError, error, refetch } = useCategoriesQuery()

  const create = useCreateCategory()
  const update = useUpdateCategory()
  const remove = useDeleteCategory()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState<CategoryWithCount | null>(null)
  const [editName, setEditName] = useState('')
  const [confirm, setConfirm] = useState<CategoryWithCount | null>(null)
  const [error2, setError2] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    setError2('')
    try {
      await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      setName('')
      setDescription('')
    } catch (err) {
      setError2(errorMessage(err, 'Could not create the category'))
    }
  }

  const handleUpdate = async () => {
    if (!editing || !editName.trim()) return
    setError2('')
    try {
      await update.mutateAsync({ id: editing.id, name: editName.trim() })
      setEditing(null)
    } catch (err) {
      setError2(errorMessage(err, 'Could not save the category'))
    }
  }

  const handleDelete = async (id: string) => {
    setError2('')
    try {
      await remove.mutateAsync(id)
    } catch (err) {
      setError2(errorMessage(err, 'Could not delete the category'))
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        icon={<FolderTree className="w-5 h-5 text-yellow-400" />}
        hint="Sections that stories are filed under."
      />

      <div className={`mt-6 rounded-2xl border p-4 ${styles.surface}`}>
        <h2 className={`text-xs font-black uppercase tracking-wider ${styles.muted}`}>
          Add category
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            className={styles.input}
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
            className={styles.input}
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={create.isPending}
            className={styles.primaryBtn}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {error2 ? (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500">
          {error2}
        </p>
      ) : null}

      {isLoading && <SkeletonRows rows={3} />}

      {!isLoading && isError && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-sm font-bold text-red-500">Could not load categories.</p>
          <p className="mt-1 text-xs text-red-400">{(error as Error).message}</p>
          <button type="button" onClick={() => void refetch()} className={`${styles.primaryBtn} mt-4`}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && categories.length === 0 && (
        <EmptyState icon="📁" heading="No categories yet" body="Add one above to start filing stories." />
      )}

      {!isLoading && !isError && categories.length > 0 && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <li
              key={category.id}
              className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${styles.surface}`}
            >
              <div className="min-w-0">
                <p className={`truncate text-sm font-black ${styles.heading}`}>{category.name}</p>
                <p className={`text-xs ${styles.muted}`}>/{category.slug}</p>
                <p className={`text-[11px] ${styles.faint}`}>
                  {category._count?.articles ?? 0} article(s)
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(category)
                    setEditName(category.name)
                  }}
                  aria-label={`Rename ${category.name}`}
                  className={`rounded-lg p-1.5 transition-colors hover:text-yellow-500 ${styles.muted}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm(category)}
                  aria-label={`Delete ${category.name}`}
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
          title="Rename category"
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
          title="Delete category?"
          onClose={() => setConfirm(null)}
          confirmLabel="Delete"
          onConfirm={() => void handleDelete(confirm.id)}
        >
          <p className={`text-sm ${styles.muted}`}>
            Stories filed under “{confirm.name}” keep their current category until reassigned.
          </p>
        </Modal>
      )}
    </div>
  )
}
