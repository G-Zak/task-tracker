import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { TaskQuickEdit } from '@/src/components/tasks/taskEdit'
import { TaskFilters } from '@/src/components/tasks/TaskFilters'
import { TaskViewToggle } from '@/src/components/tasks/TaskViewToggle'
import { TaskCreateModal } from '@/src/components/tasks/TaskCreateModal'
import { DeleteTaskButton } from '@/src/components/tasks/DeleteTaskButton'
import { KanbanBoard, KanbanTask } from '@/src/components/tasks/KanbanBoard'
import { Pagination } from '@/src/components/ui/Pagination'
import { getFilteredTasks } from '@/src/services/task.service'
import { taskFilterSchema } from '@/src/validations/task.schema'
import { Role, TaskStatus } from '@/src/generated/client'
import { taskStatusOptions, taskStatusLabels, taskPriorityLabels } from '@/src/lib/labels'
import { CheckSquare, FolderKanban, Pencil } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { taskStatusStyles, taskPriorityStyles } from '@/src/lib/status-colors'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    q?: string
    status?: string
    priority?: string
    projectId?: string
    page?: string
    view?: string
  }>
}

export default async function TasksPage({ params, searchParams }: PageProps) {
  const { slug: orgSlug } = await params
  const rawSearchParams = await searchParams

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  const canCreateTask = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER
  const view: 'list' | 'board' = rawSearchParams.view === 'list' ? 'list' : 'board'

  const filters = taskFilterSchema.parse({
    q: rawSearchParams.q,
    status: rawSearchParams.status,
    priority: rawSearchParams.priority,
    projectId: rawSearchParams.projectId,
    page: rawSearchParams.page || '1',
  })


  const { tasks: rawTasks, pagination } = await getFilteredTasks(user.organisationId, {
    searchQuery: filters.q,
    status: filters.status,
    priority: filters.priority,
    projectId: filters.projectId,
    page: view === 'board' ? 1 : filters.page,
    pageSize: view === 'board' ? 1000 : 10,
    restrictToUserId: canCreateTask ? undefined : user.id,
  })

  const tasks = canCreateTask
    ? rawTasks
    : [...rawTasks].sort((a, b) => {
        const aMine = a.assignees.some((assignee) => assignee.id === user.id) ? 0 : 1
        const bMine = b.assignees.some((assignee) => assignee.id === user.id) ? 0 : 1
        return aMine - bMine
      })

  const projects = await prisma.project.findMany({
    where: { organisationId: user.organisationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const taskTypes = await prisma.taskType.findMany({
    where: { organisationId: user.organisationId },
    select: { id: true, name: true, color: true },
    orderBy: { name: 'asc' },
  })

  const organizationMembersRaw = await prisma.user.findMany({
    where: { organisationId: user.organisationId },
    select: { id: true, firstName: true, lastName: true, role: true },
    orderBy: { firstName: 'asc' },
  })

  const organizationMembers = organizationMembersRaw.map((member) => ({
    id: member.id,
    name: `${member.firstName} ${member.lastName}`,
    role: String(member.role),
  }))

  const kanbanTasks: KanbanTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status as TaskStatus,
    priority: task.priority,
    startedAt: task.startedAt,
    project: task.project ? { id: task.project.id, name: task.project.name } : null,
    assignees: task.assignees.map((assignee) => ({
      id: assignee.id,
      firstName: assignee.firstName,
      lastName: assignee.lastName,
    })),
    editable: canCreateTask || task.assignees.some((assignee) => assignee.id === user.id),
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-maroon-100 text-maroon-700">
            <CheckSquare className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-heading text-[22px] font-bold tracking-tight text-ink-900">Tâches</h1>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Suivi de l&apos;ensemble des tâches techniques de l&apos;organisation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TaskViewToggle currentView={view} />
          {canCreateTask && (
            <TaskCreateModal
              orgSlug={orgSlug}
              projects={projects}
              taskTypes={taskTypes}
              members={organizationMembers}
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <TaskFilters
          projects={projects}
          currentStatus={filters.status}
          currentPriority={filters.priority}
          currentProjectId={filters.projectId}
          currentSearch={filters.q}
          currentView={view}
        />

        <div className="font-data text-xs font-semibold uppercase tracking-wider text-ink-500 px-1">
          {pagination.count} tâche(s) trouvée(s)
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand-200 bg-white p-12 text-center shadow-sm">
            <div className="rounded-full bg-sand-100 p-3 text-ink-500 mb-3">
              <CheckSquare className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-ink-900">Aucune tâche trouvée</h3>
            <p className="mt-1 text-sm text-ink-500 max-w-sm">
              {filters.q || filters.status || filters.priority || filters.projectId
                ? 'Aucune tâche ne correspond à vos critères de recherche.'
                : canCreateTask
                  ? "Aucune tâche n'est encore enregistrée pour cette organisation."
                  : "Aucune tâche ne vous est assignée ni liée à l'un de vos projets pour le moment."}
            </p>
          </div>
        ) : view === 'board' ? (
          <KanbanBoard
            key={kanbanTasks.map((task) => task.id).sort().join(',')}
            orgSlug={orgSlug}
            initialTasks={kanbanTasks}
            columns={taskStatusOptions}
          />
        ) : (
          <div className="grid gap-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-sand-200 bg-white p-4 shadow-[0_1px_2px_rgba(32,22,25,0.04)] transition-all hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)] space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-data inline-block rounded-[5px] px-2 py-1 text-[10px] font-medium ${taskStatusStyles[task.status] ?? 'bg-sand-100 text-ink-500'}`}>
                        {taskStatusLabels[task.status]}
                      </span>
                      <span className={`font-data inline-block rounded-[5px] px-2 py-1 text-[10px] font-medium ${taskPriorityStyles[task.priority] ?? 'bg-sand-100 text-ink-500'}`}>
                        {taskPriorityLabels[task.priority]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-ink-900">{task.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.project && (
                      <div className="flex items-center gap-1.5 text-xs text-ink-500 bg-sand-50 px-2.5 py-1 rounded-lg border border-sand-100">
                        <FolderKanban className="h-3.5 w-3.5 text-sand-400" />
                        <span>{task.project.name}</span>
                      </div>
                    )}

                    {canCreateTask && (
                      <Link
                        href={`/org/${orgSlug}/tasks/${task.id}/edit`}
                        className="flex items-center gap-1.5 text-xs font-medium text-steel-700 bg-steel-100 px-2.5 py-1 rounded-lg hover:bg-steel-100/70 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </Link>
                    )}

                    {canCreateTask && (
                      <DeleteTaskButton taskId={task.id} taskTitle={task.title} orgSlug={orgSlug} />
                    )}
                  </div>
                </div>

                {task.assignees.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {task.assignees.map((assignee) => (
                      <span
                        key={assignee.id}
                        className="text-xs text-ink-500 bg-sand-100 px-2 py-1 rounded"
                      >
                        {assignee.firstName} {assignee.lastName}
                      </span>
                    ))}
                  </div>
                )}

                {(canCreateTask || task.assignees.some((assignee) => assignee.id === user.id)) && (
                  <TaskQuickEdit
                    taskId={task.id}
                    orgSlug={orgSlug}
                    currentStatus={task.status}
                    currentPriority={task.priority}
                    canEditPriority={canCreateTask}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {view === 'list' && (
          <Pagination
            currentPage={pagination.current}
            totalPages={pagination.total}
            total={pagination.count}
          />
        )}
      </div>
    </div>
  )
}
