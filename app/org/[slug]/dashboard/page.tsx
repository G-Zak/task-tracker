import { getCurrentUserSession } from '@/lib/rbac'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { DashboardKpis } from '@/src/components/dashboard/DashboardKpis'
import { MyActivityWidget } from '@/src/components/dashboard/MyActivityWidget'
import {
  getDashboardKpis,
  getMyAssignedTasks,
  getRecentActivity,
  getOrgActivitySummary,
} from '@/src/services/dashboard.service'
import { Role } from '@/generated/client'
import { LayoutDashboard } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUserSession()

  if (!user) {
    return <p className="p-8 text-red-500">Erreur : Session introuvable.</p>
  }

  const isAdmin = user.role === Role.ADMIN
  const isManagerOrAdmin = isAdmin || user.role === Role.PROJECT_MANAGER

  const [kpis, myTasks, recentActivity, orgSummary] = await Promise.all([
    getDashboardKpis({
      organisationId: user.organisationId,
      restrictToUserId: isManagerOrAdmin ? undefined : user.id,
    }),
    getMyAssignedTasks(user.organisationId, user.id),
    getRecentActivity(user.organisationId, user.id),
    isAdmin ? getOrgActivitySummary(user.organisationId) : Promise.resolve(null),
  ])

  const scopeLabel = isManagerOrAdmin ? "Toute l'organisation" : 'Vos projets'

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-zinc-700" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Espace Organisationnel — <span className="font-semibold text-zinc-700">{user.firstName} {user.lastName}</span> ({user.role})
            </p>
          </div>
        </div>

        <LogoutButton />
      </div>

      <DashboardKpis kpis={kpis} scopeLabel={scopeLabel} />
      <MyActivityWidget myTasks={myTasks} recentActivity={recentActivity} orgSummary={orgSummary} />
    </div>
  )
}