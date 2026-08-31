import { getCurrentUserSession } from '@/src/lib/rbac'
import { getTeamDetail } from '@/src/services/team.service'
import { Role } from '@/src/generated/client'
import { roleLabels, taskStatusLabels, taskPriorityLabels } from '@/src/lib/labels'
import { taskStatusStyles, taskPriorityStyles } from '@/src/lib/status-colors'
import { ArrowLeft, Crown, FolderKanban, Calendar } from 'lucide-react'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string; teamId: string }>
}

const VIEWER_ROLES: Role[] = [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER]

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { slug: orgSlug, teamId } = await params

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')
  if (!VIEWER_ROLES.includes(user.role)) redirect(`/org/${orgSlug}/dashboard`)

  const team = await getTeamDetail(teamId, user.organisationId)
  if (!team) notFound()

  const now = new Date()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-5">
        <Link
          href={`/org/${orgSlug}/teams`}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{team.name}</h1>
          {team.description && <p className="mt-1 text-sm text-zinc-500">{team.description}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          {team.leader && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Chef d&apos;équipe</span>
              <div className="mt-2 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-zinc-900">
                  {team.leader.firstName} {team.leader.lastName}
                </span>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Membres ({team.members.length})
            </span>

            {team.members.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-400 italic">Aucun membre assigné à cette équipe.</p>
            ) : (
              <div className="mt-3 space-y-1">
                {team.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-zinc-50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-white">
                        {member.firstName.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate text-sm text-zinc-900">
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] text-zinc-400">{roleLabels[member.role]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Tâches assignées ({team.tasks.length})
              </span>
            </div>

            {team.tasks.length === 0 ? (
              <p className="p-8 text-center text-sm text-zinc-400 italic">
                {team.members.length === 0
                  ? "Aucune tâche : ajoutez d'abord des membres à cette équipe."
                  : "Aucune tâche assignée aux membres de cette équipe."}
              </p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {team.tasks.map((task) => {
                  const isOverdue = task.dueDate && task.dueDate < now && task.status !== 'DONE' && task.status !== 'CANCELLED'

                  return (
                    <div key={task.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 truncate">{task.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span
                            className={`font-data inline-block rounded-[5px] px-2 py-1 text-[10px] font-medium ${taskStatusStyles[task.status] ?? 'bg-sand-100 text-ink-500'}`}
                          >
                            {taskStatusLabels[task.status]}
                          </span>
                          <span
                            className={`font-data inline-block rounded-[5px] px-2 py-1 text-[10px] font-medium ${taskPriorityStyles[task.priority] ?? 'bg-sand-100 text-ink-500'}`}
                          >
                            {taskPriorityLabels[task.priority]}
                          </span>
                          {task.project && (
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <FolderKanban className="h-3 w-3 text-zinc-400" />
                              {task.project.name}
                            </span>
                          )}
                          <span className="text-xs text-zinc-500">
                            {task.assignees.map((assignee) => assignee.firstName).join(', ')}
                          </span>
                        </div>
                      </div>

                      {task.dueDate && (
                        <div className={`flex shrink-0 items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-zinc-400'}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
