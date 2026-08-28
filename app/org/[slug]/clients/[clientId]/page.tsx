import { getCurrentUserSession } from '@/src/lib/rbac'
import { getClientDetail } from '@/src/services/client.service'
import { Role } from '@/src/generated/client'
import { projectStatusLabels } from '@/src/lib/labels'
import { projectStatusStyles } from '@/src/lib/status-colors'
import { formatDuration } from '@/src/lib/elapsed-time'
import { ArrowLeft, Mail, Phone, FolderKanban, CheckCircle2, CalendarClock, Timer, AlertTriangle } from 'lucide-react'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string; clientId: string }>
}

const VIEWER_ROLES: Role[] = [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER]

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { slug: orgSlug, clientId } = await params

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')
  if (!VIEWER_ROLES.includes(user.role)) redirect(`/org/${orgSlug}/dashboard`)

  const client = await getClientDetail(clientId, user.organisationId)
  if (!client) notFound()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-5">
        <Link
          href={`/org/${orgSlug}/clients`}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-semibold text-zinc-700">
            {client.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{client.name}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-zinc-900 hover:underline">
                  <Mail className="h-3.5 w-3.5" />
                  {client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-zinc-900 hover:underline">
                  <Phone className="h-3.5 w-3.5" />
                  {client.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Indicateurs "compte client" */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <FolderKanban className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Projets actifs</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-zinc-900">{client.activeProjectCount}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Projets terminés</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-zinc-900">{client.completedProjectCount}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <CalendarClock className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Prochaine échéance</span>
          </div>
          {client.nextDeadline ? (
            <>
              <p className="mt-3 text-xl font-bold text-zinc-900">{formatDate(client.nextDeadline.endDate)}</p>
              <p className="mt-1 text-xs text-zinc-500 truncate">{client.nextDeadline.projectName}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-zinc-400 italic">Aucune échéance à venir</p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <Timer className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Temps total passé</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-zinc-900">{formatDuration(client.totalTimeSpentMs)}</p>
          <p className="mt-1 text-xs text-zinc-500">Sur toutes les tâches démarrées</p>
        </div>
      </div>

      {/* Projets du client */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Projets ({client.projects.length})
          </span>
        </div>

        {client.projects.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-400 italic">Aucun projet pour ce client.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {client.projects.map((project) => (
              <Link
                key={project.id}
                href={`/org/${orgSlug}/projects/${project.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 truncate">{project.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase ring-1 ring-inset ${projectStatusStyles[project.status] ?? 'bg-zinc-100 text-zinc-600 ring-zinc-600/10'}`}
                    >
                      {projectStatusLabels[project.status]}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {project.taskCount} tâche{project.taskCount > 1 ? 's' : ''}
                    </span>
                    {project.isOverdue && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        En retard
                      </span>
                    )}
                  </div>
                </div>

                {project.endDate && (
                  <div className={`shrink-0 text-xs ${project.isOverdue ? 'font-medium text-red-600' : 'text-zinc-400'}`}>
                    {formatDate(project.endDate)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
