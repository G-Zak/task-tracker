import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { TaskForm } from '@/src/components/tasks/taskForm'
import { Role } from '@/src/generated/client'
import { ArrowLeft, CheckSquare } from 'lucide-react'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string; taskId: string }>
}

export default async function EditTaskPage({ params }: PageProps) {
  const { slug: orgSlug, taskId } = await params

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  const canEdit = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER
  if (!canEdit) redirect(`/org/${orgSlug}/tasks`)

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignees: { select: { id: true } } },
  })

  if (!task) notFound()
  if (task.organisationId !== user.organisationId) redirect('/authentication')

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

  const toDateInputValue = (date: Date | null) =>
    date ? new Date(date).toISOString().split('T')[0] : ''

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-5">
        <Link
          href={`/org/${orgSlug}/tasks`}
          className="p-2 hover:bg-zinc-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-600" />
        </Link>
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-zinc-700" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Modifier « {task.title} »
          </h1>
        </div>
      </div>

      <TaskForm
        orgSlug={orgSlug}
        projects={projects}
        taskTypes={taskTypes}
        members={organizationMembers}
        mode="edit"
        redirectTo={`/org/${orgSlug}/tasks`}
        task={{
          id: task.id,
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          projectId: task.projectId ?? '',
          taskTypeId: task.taskTypeId ?? '',
          dueDate: toDateInputValue(task.dueDate),
          assigneeIds: task.assignees.map((assignee) => assignee.id),
        }}
      />
    </div>
  )
}
