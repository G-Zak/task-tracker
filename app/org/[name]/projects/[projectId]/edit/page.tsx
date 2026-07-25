import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { ProjectForm } from '@/src/components/projects/ProjectForm'
import { Role } from '@/src/generated/client'
import { ArrowLeft, FolderPlus } from 'lucide-react'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ name: string; projectId: string }>
}

export default async function EditProjectPage({ params }: PageProps) {
  const { name: orgName, projectId } = await params

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  const canEdit = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER
  if (!canEdit) redirect(`/org/${orgName}/projects/${projectId}`)

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { select: { id: true } },
    },
  })

  if (!project) notFound()
  if (project.organisationId !== user.organisationId) redirect('/authentication')

  const clients = await prisma.client.findMany({
    where: { organisationId: user.organisationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const rawUsers = await prisma.user.findMany({
    where: { organisationId: user.organisationId },
    select: { id: true, firstName: true, lastName: true, role: true },
  })

  const users = rawUsers.map((u) => ({
    id: u.id,
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Utilisateur',
    role: u.role,
  }))

  const toDateInputValue = (date: Date | null) =>
    date ? new Date(date).toISOString().split('T')[0] : ''

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-5">
        <Link
          href={`/org/${orgName}/projects/${projectId}`}
          className="p-2 hover:bg-zinc-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-600" />
        </Link>
        <div className="flex items-center gap-2">
          <FolderPlus className="h-6 w-6 text-zinc-700" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Modifier « {project.name} »
          </h1>
        </div>
      </div>

      <ProjectForm
        orgName={orgName}
        clients={clients}
        users={users}
        mode="edit"
        redirectTo={`/org/${orgName}/projects/${projectId}`}
        project={{
          id: project.id,
          name: project.name,
          description: project.description ?? '',
          startDate: toDateInputValue(project.startDate),
          endDate: toDateInputValue(project.endDate),
          status: project.status,
          clientId: project.clientId ?? '',
          memberIds: project.members.map((m) => m.id),
        }}
      />
    </div>
  )
}
