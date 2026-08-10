import { getCurrentUserSession } from '@/src/lib/rbac'
import { getFilteredTasks } from '@/src/services/task.service'
import { KanbanBoard, KanbanTask } from '@/src/components/tasks/KanbanBoard'
import { Role, TaskStatus } from '@/src/generated/client'
import { taskStatusOptions } from '@/src/lib/labels'
import { Kanban } from 'lucide-react'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function KanbanPage({ params }: PageProps) {
  const { slug: orgSlug } = await params

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  const isManager = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

  const { tasks } = await getFilteredTasks(user.organisationId, {
    restrictToUserId: isManager ? undefined : user.id,
    pageSize: 1000,
  })

  const kanbanTasks: KanbanTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status as TaskStatus,
    priority: task.priority,
    progress: task.progress,
    project: task.project ? { id: task.project.id, name: task.project.name } : null,
    assignees: task.assignees.map((assignee) => ({
      id: assignee.id,
      firstName: assignee.firstName,
      lastName: assignee.lastName,
    })),
    editable: isManager || task.assignees.some((assignee) => assignee.id === user.id),
  }))

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-2">
          <Kanban className="h-6 w-6 text-zinc-700" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Tableau Kanban</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Glissez une carte vers une autre colonne pour changer son statut.
        </p>
      </div>

      <KanbanBoard orgSlug={orgSlug} initialTasks={kanbanTasks} columns={taskStatusOptions} />
    </div>
  )
}
