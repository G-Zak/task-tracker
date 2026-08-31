import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { getOrgStatistics } from '@/src/services/statistics.service'
import { statisticsFilterSchema } from '@/src/validations/statistics.schema'
import { Role } from '@/src/generated/client'
import { StatisticsFilters } from '@/src/components/statistics/StatisticsFilters'
import { ExportStatisticsButton } from '@/src/components/statistics/ExportStatisticsButton'
import { TaskStatusBreakdown } from '@/src/components/dashboard/TaskStatusBreakdown'
import { WorkloadChart } from '@/src/components/dashboard/WorkloadChart'
import { KpiCard } from '@/src/components/dashboard/KpiCard'
import { PriorityBreakdown } from '@/src/components/statistics/PriorityBreakdown'
import { ProjectVolumeChart } from '@/src/components/statistics/ProjectVolumeChart'
import { formatDuration } from '@/src/lib/elapsed-time'
import { BarChart3, Target, CheckCircle2, AlertTriangle, Gauge } from 'lucide-react'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    period?: string
    from?: string
    to?: string
    projectId?: string
    clientId?: string
    teamId?: string
  }>
}

const VIEWER_ROLES: Role[] = [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER]

const periodSummaryLabels: Record<string, string> = {
  week: 'Cette semaine',
  month: 'Ce mois-ci',
  quarter: 'Ce trimestre',
  custom: 'Période personnalisée',
}

function onTimeRateTone(rate: number | null): 'default' | 'success' | 'warning' | 'critical' {
  if (rate === null) return 'default'
  if (rate >= 80) return 'success'
  if (rate >= 50) return 'warning'
  return 'critical'
}

export default async function StatisticsPage({ params, searchParams }: PageProps) {
  const { slug: orgSlug } = await params
  const rawSearchParams = await searchParams

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')
  if (!VIEWER_ROLES.includes(user.role)) redirect(`/org/${orgSlug}/dashboard`)

  const filters = statisticsFilterSchema.parse({
    period: rawSearchParams.period,
    from: rawSearchParams.from,
    to: rawSearchParams.to,
    projectId: rawSearchParams.projectId,
    clientId: rawSearchParams.clientId,
    teamId: rawSearchParams.teamId,
  })

  const [stats, projects, clients, teams] = await Promise.all([
    getOrgStatistics({
      organisationId: user.organisationId,
      period: filters.period,
      customFrom: filters.period === 'custom' && filters.from ? new Date(filters.from) : undefined,
      customTo: filters.period === 'custom' && filters.to ? new Date(filters.to) : undefined,
      projectId: filters.projectId,
      clientId: filters.clientId,
      teamId: filters.teamId,
    }),
    prisma.project.findMany({
      where: { organisationId: user.organisationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.client.findMany({
      where: { organisationId: user.organisationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.team.findMany({
      where: { organisationId: user.organisationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const tone = onTimeRateTone(stats.onTimeRate)

  const filterSummaryParts = [
    filters.period === 'custom'
      ? `Du ${filters.from || '…'} au ${filters.to || '…'}`
      : periodSummaryLabels[filters.period],
    filters.projectId ? `Projet : ${projects.find((p) => p.id === filters.projectId)?.name ?? filters.projectId}` : null,
    filters.clientId ? `Client : ${clients.find((c) => c.id === filters.clientId)?.name ?? filters.clientId}` : null,
    filters.teamId ? `Équipe : ${teams.find((t) => t.id === filters.teamId)?.name ?? filters.teamId}` : null,
  ].filter((part): part is string => Boolean(part))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-maroon-100 text-maroon-700">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-heading text-[22px] font-bold tracking-tight text-ink-900">Statistiques</h1>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Vue d&apos;ensemble de l&apos;activité de l&apos;organisation pour piloter la charge et les délais.
            </p>
          </div>
        </div>

        <ExportStatisticsButton stats={stats} filterSummary={filterSummaryParts.join(' · ')} />
      </div>

      <StatisticsFilters
        projects={projects}
        clients={clients}
        teams={teams}
        currentPeriod={filters.period}
        currentFrom={filters.from}
        currentTo={filters.to}
        currentProjectId={filters.projectId}
        currentClientId={filters.clientId}
        currentTeamId={filters.teamId}
      />

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.onTimeRate === null ? (
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)]">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <Target className="h-3.5 w-3.5" />
              Respect des délais
            </div>
            <p className="mt-3 text-sm italic text-sand-400">Aucune tâche terminée avec échéance sur cette période.</p>
          </div>
        ) : (
          <KpiCard
            icon={<Target className="h-3.5 w-3.5" />}
            label="Respect des délais"
            value={stats.onTimeRate}
            suffix="%"
            tone={tone}
            hint={`${stats.onTimeCount} à temps · ${stats.lateCount} en retard`}
          />
        )}

        <KpiCard
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="Tâches en retard"
          value={stats.overdueCount}
          tone={stats.overdueCount > 0 ? 'warning' : 'default'}
          hint={stats.overdueCount > 0 ? 'échéance dépassée, non terminées' : 'aucune échéance dépassée'}
          delayMs={60}
        />

        {stats.avgCompletionMs === null ? (
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)]">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <Gauge className="h-3.5 w-3.5" />
              Temps moyen de cycle
            </div>
            <p className="mt-3 text-sm italic text-sand-400">Aucune tâche terminée avec horodatage complet.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)]">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <Gauge className="h-3.5 w-3.5" />
              Temps moyen de cycle
            </div>
            <p className="font-data mt-2 text-[30px] font-medium leading-none tracking-tight text-ink-900">
              {formatDuration(stats.avgCompletionMs)}
            </p>
            <p className="mt-2 text-[11.5px] text-ink-500">prise en charge → validation</p>
          </div>
        )}

        <KpiCard icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Tâches sur la période" value={stats.totalTasks} hint="toutes, quel que soit le statut" delayMs={180} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-3">
        <TaskStatusBreakdown tasksByStatus={stats.tasksByStatus} totalTasks={stats.totalTasks} className="lg:col-span-2" />

        <PriorityBreakdown tasksByPriority={stats.tasksByPriority} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectVolumeChart data={stats.projectVolume} />
        </div>

        <WorkloadChart
          data={stats.teamWorkload}
          title={`Charge par équipe (${stats.teamWorkload.length})`}
          emptyLabel="Aucune équipe ou aucune tâche active pour ce filtre."
        />
      </div>
    </div>
  )
}
