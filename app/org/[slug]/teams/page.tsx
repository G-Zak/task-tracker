import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { Role } from '@/src/generated/client'
import { Users, Crown } from 'lucide-react'
import { redirect } from 'next/navigation'
import { TeamCreateModal } from '@/src/components/teams/TeamCreateModal'
import { EditTeamModal } from '@/src/components/teams/EditTeamModal'
import { DeleteTeamButton } from '@/src/components/teams/DeleteTeamButton'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function TeamsPage({ params }: PageProps) {
  const { slug: orgSlug } = await params

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  const canManageTeams = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

  const [teams, membersRaw] = await Promise.all([
    prisma.team.findMany({
      where: { organisationId: user.organisationId },
      include: {
        leader: { select: { id: true, firstName: true, lastName: true } },
        members: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { organisationId: user.organisationId },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: { firstName: 'asc' },
    }),
  ])

  const members = membersRaw.map((member) => ({
    id: member.id,
    name: `${member.firstName} ${member.lastName}`,
    role: String(member.role),
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-zinc-700" />
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Équipes</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">Organisation des utilisateurs par pôle de travail.</p>
        </div>

        {canManageTeams && <TeamCreateModal orgSlug={orgSlug} members={members} />}
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
          <div className="rounded-full bg-zinc-100 p-3 text-zinc-500 mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-zinc-900">Aucune équipe créée</h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-sm">
            {canManageTeams
              ? 'Créez une première équipe pour organiser vos collaborateurs par pôle de travail.'
              : "Aucune équipe n'est encore enregistrée pour cette organisation."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-zinc-900 leading-tight">{team.name}</h3>
                {canManageTeams && (
                  <div className="flex items-center gap-0.5 shrink-0 -mr-1.5 -mt-1">
                    <EditTeamModal
                      orgSlug={orgSlug}
                      members={members}
                      team={{
                        id: team.id,
                        name: team.name,
                        description: team.description ?? '',
                        leaderId: team.leaderId ?? '',
                        memberIds: team.members.map((member) => member.id),
                      }}
                    />
                    <DeleteTeamButton teamId={team.id} teamName={team.name} orgSlug={orgSlug} />
                  </div>
                )}
              </div>

              {team.description && <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{team.description}</p>}

              {team.leader && (
                <div className="mt-3 flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700 ring-1 ring-inset ring-amber-600/20">
                  <Crown className="h-3 w-3" />
                  {team.leader.firstName} {team.leader.lastName}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                <span className="text-xs text-zinc-400">
                  {team.members.length} membre{team.members.length > 1 ? 's' : ''}
                </span>

                {team.members.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {team.members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        title={`${member.firstName} ${member.lastName}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-white ring-2 ring-white"
                      >
                        {member.firstName.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {team.members.length > 5 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-semibold text-zinc-600 ring-2 ring-white">
                        +{team.members.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
