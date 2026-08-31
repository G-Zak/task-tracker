import { FolderKanban, ListTodo, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { DashboardKpis as DashboardKpisData } from '@/src/services/dashboard.service'
import { KpiCard } from '@/src/components/dashboard/KpiCard'

interface DashboardKpisProps {
    kpis: DashboardKpisData
    scopeLabel: string
}

export function DashboardKpis({ kpis, scopeLabel }: DashboardKpisProps) {
    const { activeProjects, overdueTasks, tasksByStatus, totalTasks } = kpis

    const closedTasks = (tasksByStatus.DONE ?? 0) + (tasksByStatus.CANCELLED ?? 0)
    const openTasks = totalTasks - closedTasks
    const completionRate = totalTasks === 0 ? 0 : Math.round(((tasksByStatus.DONE ?? 0) / totalTasks) * 100)

    return (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={<FolderKanban className="h-3.5 w-3.5" />} label="Projets actifs" value={activeProjects} hint={scopeLabel} delayMs={0} />
            <KpiCard icon={<ListTodo className="h-3.5 w-3.5" />} label="Tâches ouvertes" value={openTasks} hint="à faire, en cours, à contrôler" delayMs={60} />
            <KpiCard
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                label="En retard"
                value={overdueTasks}
                tone={overdueTasks > 0 ? 'warning' : 'default'}
                hint={overdueTasks > 0 ? 'nécessitent une action' : 'aucune échéance dépassée'}
                delayMs={120}
            />
            <KpiCard
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                label="Taux d'achèvement"
                value={completionRate}
                suffix="%"
                tone="success"
                hint={`${tasksByStatus.DONE ?? 0} tâche(s) terminée(s) / ${totalTasks}`}
                delayMs={180}
            />
        </div>
    )
}
