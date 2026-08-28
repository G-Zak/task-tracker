import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { getOrgStatistics } from '@/src/services/statistics.service'
import { statisticsFilterSchema } from '@/src/validations/statistics.schema'
import { Role } from '@/src/generated/client'
import { StatisticsFilters } from '@/src/components/statistics/StatisticsFilters'
import { TaskStatusBreakdown } from '@/src/components/dashboard/TaskStatusBreakdown'
import { WorkloadChart } from '@/src/components/dashboard/WorkloadChart'
import { BarChart3, Target, CheckCircle2, AlertTriangle } from 'lucide-react'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ period?: string; projectId?: string; clientId?: string }>
}

// Même trois rôles que la barre latérale (navigationConfig) pour "Statistiques", désormais
// appliqués côté serveur — même raisonnement que sur /teams (US-035) et /clients (US-036).
const VIEWER_ROLES: Role[] = [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER]

function onTimeRateTone(rate: number | null) {
  if (rate === null) return { border: 'border-zinc-200/80', bg: 'bg-white', text: 'text-zinc-900', label: 'text-zinc-500' }
  if (rate >= 80) return { border: 'border-emerald-200/60', bg: 'bg-emerald-50/50', text: 'text-emerald-700', label: 'text-emerald-600/80' }
  if (rate >= 50) return { border: 'border-amber-200/60', bg: 'bg-amber-50/50', text: 'text-amber-700', label: 'text-amber-600/80' }
  return { border: 'border-red-200/60', bg: 'bg-red-50/50', text: 'text-red-700', label: 'text-red-600/80' }
}

export default async function StatisticsPage({ params, searchParams }: PageProps) {
  const { slug: orgSlug } = await params
  const rawSearchParams = await searchParams

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')
  if (!VIEWER_ROLES.includes(user.role)) redirect(`/org/${orgSlug}/dashboard`)

  const filters = statisticsFilterSchema.parse({
    period: rawSearchParams.period,
    projectId: rawSearchParams.projectId,
    clientId: rawSearchParams.clientId,
  })

  const [stats, projects, clients] = await Promise.all([
    getOrgStatistics({
      organisationId: user.organisationId,
      period: filters.period,
      projectId: filters.projectId,
      clientId: filters.clientId,
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
  ])

  const tone = onTimeRateTone(stats.onTimeRate)

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-zinc-700" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Statistiques</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Vue d&apos;ensemble de l&apos;activité de l&apos;organisation pour piloter la charge et les délais.
        </p>
      </div>

      <StatisticsFilters
        projects={projects}
        clients={clients}
        currentPeriod={filters.period}
        currentProjectId={filters.projectId}
        currentClientId={filters.clientId}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all ${tone.border} ${tone.bg}`}>
          <div className={`flex items-center gap-2 ${tone.label}`}>
            <Target className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Respect des délais</span>
          </div>
          {stats.onTimeRate === null ? (
            <p className="mt-3 text-sm text-zinc-400 italic">Aucune tâche terminée avec échéance sur cette période.</p>
          ) : (
            <>
              <p className={`mt-3 text-3xl font-bold ${tone.text}`}>{stats.onTimeRate}%</p>
              <p className={`mt-1 text-xs ${tone.label}`}>
                {stats.onTimeCount} à temps · {stats.lateCount} en retard
              </p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 text-zinc-500">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tâches sur la période</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-zinc-900">{stats.totalTasks}</p>
          <p className="mt-1 text-xs text-zinc-500">Toutes, quel que soit le statut</p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 text-zinc-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Équipes suivies</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-zinc-900">{stats.teamWorkload.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Charge détaillée ci-dessous</p>
        </div>

        <TaskStatusBreakdown tasksByStatus={stats.tasksByStatus} totalTasks={stats.totalTasks} className="lg:col-span-2" />

        <WorkloadChart
          data={stats.teamWorkload}
          title="Charge par équipe"
          emptyLabel="Aucune équipe ou aucune tâche active pour ce filtre."
        />
      </div>
    </div>
  )
}
