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
  // Seul ADMIN peut gérer les comptes (US-007) — cohérent avec navigationConfig, qui ne montre
  // déjà "Utilisateurs" qu'à ce rôle, désormais aussi appliqué côté serveur.
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="h-6 w-6 text-zinc-700" />
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Utilisateurs</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Comptes, rôles et accès de l&apos;organisation ({users.length}).
          </p>
        </div>

        <InviteUserModal orgSlug={orgSlug} />
      </div>

      {pendingUsers.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-3">
            <Hourglass className="h-4 w-4 text-amber-700" />
            <h2 className="text-sm font-semibold text-amber-800">
              Demandes d&apos;inscription en attente ({pendingUsers.length})
            </h2>
          </div>
          <ul className="divide-y divide-amber-100">
            {pendingUsers.map((row) => (
              <PendingUserRow key={row.id} user={row} orgSlug={orgSlug} />
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
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
