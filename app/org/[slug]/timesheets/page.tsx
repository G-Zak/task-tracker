import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { getTimesheet } from '@/src/services/timesheet.service'
import { timesheetFilterSchema } from '@/src/validations/timesheet.schema'
import { Role } from '@/src/generated/client'
import { taskStatusLabels } from '@/src/lib/labels'
import { taskStatusStyles } from '@/src/lib/status-colors'
import { formatDuration } from '@/src/lib/elapsed-time'
import { TimesheetFilters } from '@/src/components/timesheets/TimesheetFilters'
import { ExportCsvButton } from '@/src/components/timesheets/ExportCsvButton'
import { Clock, FolderKanban, Timer } from 'lucide-react'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    period?: string
    projectId?: string
    userId?: string
    groupBy?: string
  }>
}

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function TimesheetsPage({ params, searchParams }: PageProps) {
  await params
  const rawSearchParams = await searchParams

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  const canViewAll = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

  const filters = timesheetFilterSchema.parse({
    period: rawSearchParams.period,
    projectId: rawSearchParams.projectId,
    userId: rawSearchParams.userId,
    groupBy: rawSearchParams.groupBy,
  })

  const effectiveUserId = canViewAll ? filters.userId : undefined
  const restrictToUserId = canViewAll ? undefined : user.id

  const [{ groups, totalMs }, projects, membersRaw] = await Promise.all([
    getTimesheet({
      organisationId: user.organisationId,
      period: filters.period,
      projectId: filters.projectId,
      userId: effectiveUserId,
      groupBy: filters.groupBy,
      restrictToUserId,
    }),
    prisma.project.findMany({
      where: { organisationId: user.organisationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    canViewAll
      ? prisma.user.findMany({
          where: { organisationId: user.organisationId },
          select: { id: true, firstName: true, lastName: true },
          orderBy: { firstName: 'asc' },
        })
      : Promise.resolve([]),
  ])

  const members = membersRaw.map((member) => ({ id: member.id, name: `${member.firstName} ${member.lastName}` }))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-zinc-700" />
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Feuilles de temps</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {canViewAll
              ? 'Temps passé par tâche, groupé par utilisateur ou par projet.'
              : 'Temps passé sur vos tâches et celles de vos projets.'}
          </p>
        </div>

        <ExportCsvButton groups={groups} />
      </div>

      <div className="space-y-4">
        <TimesheetFilters
          projects={projects}
          members={members}
          currentPeriod={filters.period}
          currentProjectId={filters.projectId}
          currentUserId={effectiveUserId}
          currentGroupBy={filters.groupBy}
          canFilterByUser={canViewAll}
        />

        <div className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Temps total suivi</span>
          <div className="flex items-center gap-1.5 text-lg font-bold text-zinc-900">
            <Timer className="h-5 w-5 text-zinc-400" />
            {formatDuration(totalMs)}
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
            <div className="rounded-full bg-zinc-100 p-3 text-zinc-500 mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-zinc-900">Aucune donnée sur cette période</h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-sm">
              Aucune tâche démarrée ne correspond à ces filtres. Le temps est suivi à partir du moment où
              une tâche passe au statut « En cours ».
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.key} className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-900">{group.label}</h3>
                    <span className="text-xs text-zinc-400">
                      ({group.entries.length} tâche{group.entries.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
                    <Timer className="h-4 w-4 text-zinc-400" />
                    {formatDuration(group.totalMs)}
                  </div>
                </div>

                <div className="divide-y divide-zinc-100">
                  {group.entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 truncate">{entry.title}</p>
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase ring-1 ring-inset ${taskStatusStyles[entry.status] ?? 'bg-zinc-100 text-zinc-600 ring-zinc-600/10'}`}
                          >
                            {taskStatusLabels[entry.status]}
                          </span>
                          {group.key !== entry.project?.id && entry.project && (
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <FolderKanban className="h-3 w-3 text-zinc-400" />
                              {entry.project.name}
                            </span>
                          )}
                          {filters.groupBy === 'project' && entry.assignees.length > 0 && (
                            <span className="text-xs text-zinc-500">
                              {entry.assignees.map((a) => `${a.firstName} ${a.lastName}`).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-sm font-semibold text-zinc-700">{formatDuration(entry.durationMs)}</span>
                        <span className="text-[11px] text-zinc-400">
                          {formatDate(entry.startedAt)} → {entry.approvedAt ? formatDate(entry.approvedAt) : 'en cours'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
