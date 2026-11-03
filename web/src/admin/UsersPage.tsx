import { useMemo, useState } from 'react'
import { Search, Shield, Trash2, UserPlus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import {
  useAssignRole,
  useCreateUser,
  useDeleteUser,
  useSetUserStatus,
  useUserStats,
  useUsers,
} from '../api/admin'
import type { UserRole } from '../api/types'
import { errorMessage } from '../api/client'
import { Badge, EmptyState, Modal, PageHeader, SkeletonRows, useAdminStyles } from './ui'

const ROLES: UserRole[] = ['ADMIN', 'EDITOR', 'AUTHOR', 'READER']

export function UsersPage() {
  const styles = useAdminStyles()
  const { user } = useAuth()

  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('EDITOR')
  const [failure, setFailure] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')

  const trimmed = search.trim()
  const { data, isLoading, isError, error, refetch } = useUsers({
    search: trimmed,
    limit: 50,
  })
  const stats = useUserStats()
  const assignRole = useAssignRole()
  const setStatus = useSetUserStatus()
  const createUser = useCreateUser()
  const deleteUser = useDeleteUser()

  const users = useMemo(() => data?.items ?? [], [data])

  const handleRole = async (id: string, role: UserRole) => {
    setFailure('')
    try {
      await assignRole.mutateAsync({ id, role })
    } catch (err) {
      setFailure(errorMessage(err, 'Could not change the role'))
    }
  }

  const handleStatus = async (id: string, active: boolean) => {
    setFailure('')
    try {
      await setStatus.mutateAsync({ id, active })
    } catch (err) {
      setFailure(errorMessage(err, 'Could not update the account'))
    }
  }

  const handleDelete = async (id: string) => {
    setFailure('')
    try {
      await deleteUser.mutateAsync(id)
    } catch (err) {
      setFailure(errorMessage(err, 'Could not delete the account'))
    }
  }

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return
    setFailure('')
    setTemporaryPassword('')
    try {
      const result = await createUser.mutateAsync({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      })
      setTemporaryPassword(result.temporaryPassword ?? '')
      setInviteName('')
      setInviteEmail('')
      setInviteOpen(false)
    } catch (err) {
      setFailure(errorMessage(err, 'Could not create the account'))
    }
  }

  const summary = [
    { label: 'Total', value: stats.data?.total ?? 0 },
    { label: 'Active', value: stats.data?.active ?? 0 },
    { label: 'Suspended', value: stats.data?.suspended ?? 0 },
    { label: 'Admins', value: stats.data?.admins ?? 0 },
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        icon={<Shield className="w-5 h-5 text-yellow-400" />}
        hint="Site-wide account directory."
        action={
          <button type="button" onClick={() => setInviteOpen(true)} className={styles.primaryBtn}>
            <UserPlus className="w-3.5 h-3.5" />
            New account
          </button>
        }
      />

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className={`rounded-2xl border p-4 ${styles.surface}`}>
            <dt className={`text-[11px] font-black uppercase tracking-wider ${styles.muted}`}>
              {item.label}
            </dt>
            <dd className={`mt-1 text-2xl font-black tabular-nums ${styles.heading}`}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {temporaryPassword ? (
        <p className="mt-4 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-xs font-bold text-yellow-600">
          Temporary password: <span className="font-mono">{temporaryPassword}</span> — share it
          with the new account holder, it is only shown once.
        </p>
      ) : null}

      {failure ? (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500">
          {failure}
        </p>
      ) : null}

      <div className="mt-5">
        <label htmlFor="user-search" className="sr-only">
          Search users
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            id="user-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email…"
            className={`${styles.input} pl-9`}
          />
        </div>
      </div>

      {isLoading && <SkeletonRows rows={4} />}

      {!isLoading && isError && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-sm font-bold text-red-500">Could not load accounts.</p>
          <p className="mt-1 text-xs text-red-400">{(error as Error).message}</p>
          <button type="button" onClick={() => void refetch()} className={`${styles.primaryBtn} mt-4`}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && users.length === 0 && (
        <EmptyState icon="👥" heading="No accounts found" body="Try a different search." />
      )}

      {!isLoading && !isError && users.length > 0 && (
        <ul className="mt-5 space-y-3">
          {users.map((account) => (
            <li
              key={account.id}
              className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${styles.surface}`}
            >
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-black ${styles.heading}`}>
                  {account.name}
                  {account.id === user?.id ? (
                    <span className={`ml-2 text-[10px] font-bold uppercase ${styles.faint}`}>
                      you
                    </span>
                  ) : null}
                </p>
                <p className={`truncate text-xs ${styles.muted}`}>{account.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge label={account.role} />
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      account.isActive ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {account.isActive ? 'active' : 'suspended'}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <label className="sr-only" htmlFor={`role-${account.id}`}>
                  Role
                </label>
                <select
                  id={`role-${account.id}`}
                  value={account.role}
                  disabled={assignRole.isPending}
                  onChange={(event) =>
                    void handleRole(account.id, event.target.value as UserRole)
                  }
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-black uppercase ${
                    styles.isDark
                      ? 'border-zinc-800 bg-zinc-950 text-zinc-300'
                      : 'border-zinc-200 bg-white text-zinc-700'
                  }`}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => void handleStatus(account.id, !account.isActive)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-black uppercase transition-colors ${
                    styles.isDark
                      ? 'border-zinc-800 text-zinc-300 hover:border-yellow-400/60'
                      : 'border-zinc-200 text-zinc-700 hover:border-yellow-500/60'
                  }`}
                >
                  {account.isActive ? 'Suspend' : 'Activate'}
                </button>

                {account.id !== user?.id ? (
                  <button
                    type="button"
                    onClick={() => setConfirm({ id: account.id, name: account.name })}
                    aria-label={`Delete ${account.name}`}
                    className={`rounded-lg p-1.5 transition-colors hover:text-red-400 ${styles.muted}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {inviteOpen && (
        <Modal
          title="Create account"
          onClose={() => setInviteOpen(false)}
          confirmLabel="Create"
          onConfirm={() => void handleInvite()}
        >
          <div className="grid gap-3">
            <input
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              placeholder="Full name"
              className={styles.input}
            />
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="Email"
              className={styles.input}
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as UserRole)}
              className={styles.input}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal
          title="Delete account?"
          onClose={() => setConfirm(null)}
          confirmLabel="Delete"
          onConfirm={() => void handleDelete(confirm.id)}
        >
          <p className={`text-sm ${styles.muted}`}>
            “{confirm.name}” loses access immediately. This cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}
