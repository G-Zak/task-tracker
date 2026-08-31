import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { Role } from '@/src/generated/client'
import { UserCog, Hourglass } from 'lucide-react'
import { redirect } from 'next/navigation'
import { InviteUserModal } from '@/src/components/users/InviteUserModal'
import { UserRow } from '@/src/components/users/UserRow'
import { PendingUserRow } from '@/src/components/users/PendingUserRow'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function UsersPage({ params }: PageProps) {
  const { slug: orgSlug } = await params

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')
  if (user.role !== Role.ADMIN) redirect(`/org/${orgSlug}/dashboard`)

  const [users, pendingUsers] = await Promise.all([
    prisma.user.findMany({
      where: { organisationId: user.organisationId, isApproved: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      },
      orderBy: [{ isActive: 'desc' }, { firstName: 'asc' }],
    }),
    prisma.user.findMany({
      where: { organisationId: user.organisationId, isApproved: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-maroon-100 text-maroon-700">
            <UserCog className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-heading text-[22px] font-bold tracking-tight text-ink-900">Utilisateurs</h1>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Comptes, rôles et accès de l&apos;organisation ({users.length}).
            </p>
          </div>
        </div>

        <InviteUserModal orgSlug={orgSlug} />
      </div>

      {pendingUsers.length > 0 && (
        <div className="rounded-2xl border border-status-warning-bg bg-status-warning-bg/60 shadow-[0_1px_2px_rgba(32,22,25,0.04)] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-status-warning-bg bg-status-warning-bg px-5 py-3">
            <Hourglass className="h-4 w-4 text-status-warning" />
            <h2 className="text-sm font-semibold text-status-warning">
              Demandes d&apos;inscription en attente ({pendingUsers.length})
            </h2>
          </div>
          <ul className="divide-y divide-status-warning-bg">
            {pendingUsers.map((row) => (
              <PendingUserRow key={row.id} user={row} orgSlug={orgSlug} />
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-sand-200 bg-white shadow-[0_1px_2px_rgba(32,22,25,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-sand-100 bg-sand-50 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <th className="px-5 py-3 font-semibold">Nom</th>
                <th className="px-0 py-3 font-semibold">Rôle</th>
                <th className="px-0 py-3 font-semibold">Statut</th>
                <th className="px-0 py-3 font-semibold">Dernière connexion</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="[&_td:first-child]:pl-5 [&_td:last-child]:pr-5">
              {users.map((row) => (
                <UserRow key={row.id} user={row} orgSlug={orgSlug} isSelf={row.id === user.id} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
