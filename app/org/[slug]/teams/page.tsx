import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { getTeamSummaries } from '@/src/services/team.service'
import { Role } from '@/src/generated/client'
import { teamStatusLabels, teamStatusStyles } from '@/src/lib/team-status'
import { Users, Crown, ListTodo, AlertTriangle } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TeamCreateModal } from '@/src/components/teams/TeamCreateModal'
import { EditTeamModal } from '@/src/components/teams/EditTeamModal'
import { DeleteTeamButton } from '@/src/components/teams/DeleteTeamButton'

interface PageProps {
  params: Promise<{ slug: string }>
}

const VIEWER_ROLES: Role[] = [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER]

export default async function TeamsPage({ params }: PageProps) {
  const { slug: orgSlug } = await params

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')
  if (!VIEWER_ROLES.includes(user.role)) redirect(`/org/${orgSlug}/dashboard`)

  const canManageTeams = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

  const [teams, membersRaw] = await Promise.all([
    getTeamSummaries(user.organisationId),
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-maroon-100 text-maroon-700">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-heading text-[22px] font-bold tracking-tight text-ink-900">Équipes</h1>
            <p className="mt-0.5 text-[12.5px] text-ink-500">Organisation et charge de travail par pôle de travail.</p>
          </div>
        </div>

        {canManageTeams && <TeamCreateModal orgSlug={orgSlug} members={members} />}
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand-200 bg-white p-12 text-center shadow-sm">
          <div className="rounded-full bg-sand-100 p-3 text-ink-500 mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-ink-900">Aucune équipe créée</h3>
          <p className="mt-1 text-sm text-ink-500 max-w-sm">
            {canManageTeams
              ? 'Créez une première équipe pour organiser vos collaborateurs par pôle de travail.'
              : "Aucune équipe n'est encore enregistrée pour cette organisation."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)]"
            >
              <div className="flex items-start justify-between gap-2">
                <Link href={`/org/${orgSlug}/teams/${team.id}`} className="min-w-0 hover:underline">
                  <h3 className="font-semibold text-ink-900 leading-tight truncate">{team.name}</h3>
                </Link>
                {canManageTeams && (
                  <div className="flex items-center gap-0.5 shrink-0 -mr-1.5 -mt-1">
                    <EditTeamModal
                      orgSlug={orgSlug}
                      members={members}
                      team={{
                        id: team.id,
                        name: team.name,
                        description: team.description ?? '',
                        leaderId: team.leader?.id ?? '',
                        memberIds: team.members.map((member) => member.id),
                      }}
                    />
                    <DeleteTeamButton teamId={team.id} teamName={team.name} orgSlug={orgSlug} />
                  </div>
                )}
              </div>

              <span
                className={`font-data mt-2 inline-flex w-fit items-center rounded-[5px] px-2 py-1 text-[10px] font-medium ${teamStatusStyles[team.status]}`}
              >
                {teamStatusLabels[team.status]}
              </span>

              {team.description && <p className="mt-2 text-xs text-ink-500 line-clamp-2">{team.description}</p>}

              {team.leader && (
                <div className="mt-3 flex w-fit items-center gap-1.5 rounded-full bg-status-warning-bg px-2 py-1 text-xs text-status-warning">
                  <Crown className="h-3 w-3" />
                  {team.leader.firstName} {team.leader.lastName}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-sand-100 pt-4">
                <span className="font-data text-xs text-sand-400">
                  {team.members.length} membre{team.members.length > 1 ? 's' : ''}
                </span>

                {team.members.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {team.members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        title={`${member.firstName} ${member.lastName}`}
                        className="font-data flex h-6 w-6 items-center justify-center rounded-full bg-steel-600 text-[10px] font-semibold text-white ring-2 ring-white"
                      >
                        {member.firstName.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {team.members.length > 5 && (
                      <div className="font-data flex h-6 w-6 items-center justify-center rounded-full bg-sand-200 text-[9px] font-semibold text-ink-500 ring-2 ring-white">
                        +{team.members.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="font-data mt-3 flex items-center gap-4 text-xs text-ink-500">
                <span className="flex items-center gap-1.5">
                  <ListTodo className="h-3.5 w-3.5 text-sand-400" />
                  {team.activeTaskCount} active{team.activeTaskCount > 1 ? 's' : ''}
                </span>
                {team.overdueTaskCount > 0 && (
                  <span className="flex items-center gap-1.5 text-status-critical">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {team.overdueTaskCount} en retard
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
