import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { TaskForm } from '@/src/components/tasks/taskForm'
import { TaskQuickEdit } from '@/src/components/tasks/taskEdit'
import { Role } from '@/src/generated/client'
import { CheckSquare, FolderKanban, Pencil } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { taskStatusStyles, taskPriorityStyles } from '@/src/lib/status-colors'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function TasksPage({ params }: PageProps) {
  const { slug: orgSlug } = await params

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  const canCreateTask = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

//who and what can be visible in tasks
  const taskVisibilityFilter = canCreateTask
    ? {}
    : {
        OR: [
          { assignees: { some: { id: user.id } } },
          { project: { members: { some: { id: user.id } } } },
        ],
      }

  const rawTasks = await prisma.task.findMany({
    where: { organisationId: user.organisationId, ...taskVisibilityFilter },
    include: {
      project: { select: { id: true, name: true } },
      taskType: { select: { id: true, name: true, color: true } },
      assignees: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
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

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-zinc-700" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Tâches</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Suivi de l'ensemble des tâches techniques de l'organisation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
            {tasks.length} tâche(s) trouvée(s)
          </div>

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
              <div className="rounded-full bg-zinc-100 p-3 text-zinc-500 mb-3">
                <CheckSquare className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-zinc-900">Aucune tâche trouvée</h3>
              <p className="mt-1 text-sm text-zinc-500 max-w-sm">
                {canCreateTask
                  ? "Aucune tâche n'est encore enregistrée pour cette organisation."
                  : "Aucune tâche ne vous est assignée ni liée à l'un de vos projets pour le moment."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase ring-1 ring-inset ${taskStatusStyles[task.status] ?? 'bg-zinc-100 text-zinc-600 ring-zinc-600/10'}`}>
                          {task.status}
                        </span>
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase ring-1 ring-inset ${taskPriorityStyles[task.priority] ?? 'bg-zinc-100 text-zinc-600 ring-zinc-600/10'}`}>
                          {task.priority}
                        </span>
                      </div>
                      <h3 className="font-semibold text-zinc-900">{task.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.project && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-100">
                          <FolderKanban className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{task.project.name}</span>
                        </div>
                      )}

                      {canCreateTask && (
                        <Link
                          href={`/org/${orgSlug}/tasks/${task.id}/edit`}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </Link>
                      )}
                    </div>
                  </div>

                  {task.assignees.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {task.assignees.map((assignee) => (
                        <span
                          key={assignee.id}
                          className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded"
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
                      currentProgress={task.progress}
                      canEditPriority={canCreateTask}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-8">
          {canCreateTask ? (
            <TaskForm orgSlug={orgSlug} projects={projects} taskTypes={taskTypes} members={organizationMembers} />
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center text-xs text-zinc-500">
              Vous n'avez pas les privilèges suffisants pour créer des tâches.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
