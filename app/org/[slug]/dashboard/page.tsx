import { getCurrentUserSession } from '@/lib/rbac'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { DashboardKpis } from '@/src/components/dashboard/DashboardKpis'
import { MyActivityWidget } from '@/src/components/dashboard/MyActivityWidget'
import { TaskTrendChart } from '@/src/components/dashboard/TaskTrendChart'
import { WorkloadChart } from '@/src/components/dashboard/WorkloadChart'
import { TaskStatusBreakdown } from '@/src/components/dashboard/TaskStatusBreakdown'
import { ActiveProjectsPanel } from '@/src/components/dashboard/ActiveProjectsPanel'
import {
  getDashboardKpis,
  getMyAssignedTasks,
  getRecentActivity,
  getOrgActivitySummary,
  getWeeklyTaskTrend,
  getWorkloadByMember,
  getActiveProjectsOverview,
} from '@/src/services/dashboard.service'
import { Role } from '@/generated/client'
import { Gauge } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUserSession()

  if (!user) {
    return <p className="p-8 text-red-500">Erreur : Session introuvable.</p>
  }

  const isAdmin = user.role === Role.ADMIN
  const isManagerOrAdmin = isAdmin || user.role === Role.PROJECT_MANAGER

  const [kpis, myTasks, recentActivity, orgSummary, weeklyTrend, workload, projects] = await Promise.all([
    getDashboardKpis({
      organisationId: user.organisationId,
      restrictToUserId: isManagerOrAdmin ? undefined : user.id,
    }),
    getMyAssignedTasks(user.organisationId, user.id),
    getRecentActivity(user.organisationId, user.id),
    isAdmin ? getOrgActivitySummary(user.organisationId) : Promise.resolve(null),
    getWeeklyTaskTrend(user.organisationId, isManagerOrAdmin ? undefined : user.id),
    isManagerOrAdmin ? getWorkloadByMember(user.organisationId) : Promise.resolve([]),
    getActiveProjectsOverview({
      organisationId: user.organisationId,
      restrictToUserId: isManagerOrAdmin ? undefined : user.id,
    }),
  ])

  const scopeLabel = isManagerOrAdmin ? "Toute l'organisation" : 'Vos projets'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-sand-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-maroon-100 text-maroon-700">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-heading text-[22px] font-bold tracking-tight text-ink-900">Tableau de bord</h1>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Espace organisationnel — <span className="font-medium text-ink-700">{user.firstName} {user.lastName}</span> ({user.role})
            </p>
          </div>
        </div>

        <LogoutButton />
      </div>

      <DashboardKpis kpis={kpis} scopeLabel={scopeLabel} />

      <MyActivityWidget myTasks={myTasks} recentActivity={recentActivity} orgSummary={orgSummary} />

      <div className="grid gap-3.5 lg:grid-cols-2">
        <TaskStatusBreakdown tasksByStatus={kpis.tasksByStatus} totalTasks={kpis.totalTasks} />
        <ActiveProjectsPanel projects={projects} />
      </div>

      <div className={`grid gap-3.5 ${isManagerOrAdmin ? 'lg:grid-cols-3' : ''}`}>
        <div className={isManagerOrAdmin ? 'lg:col-span-2' : ''}>
          <TaskTrendChart data={weeklyTrend} />
        </div>
        {isManagerOrAdmin && (
          <WorkloadChart data={workload.map((member) => ({ id: member.userId, name: member.name, activeTaskCount: member.activeTaskCount }))} />
        )}
      </div>
    </div>
  )
}
