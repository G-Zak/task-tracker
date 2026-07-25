import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { Role } from '@/src/generated/client'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AddMemberModal } from '@/src/components/projects/AddMemberModal'
import { RemoveMemberButton } from '@/src/components/projects/RemoveMemberButton'
import { DeleteProjectButton } from '@/src/components/projects/DeleteProjectButton'

interface PageProps {
  params: Promise<{ name: string; projectId: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {

    const { name: orgName, projectId } = await params
  
  
  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')
  
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        }
      },
      
      members: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          avatarUrl: true,
        }
      },
      
      tasks: {
        include: {
          assignees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      
      notes: {
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })
  
  
  if (!project) {
    notFound()  
  }
  
  if (project.organisationId !== user.organisationId) {
    redirect('/authentication')  
  }
  
  
  const canEdit = 
    user.role === Role.ADMIN || 
    user.role === Role.PROJECT_MANAGER
  
  // US-013 : "En tant que PM/Admin" -> mêmes rôles que canEdit, cohérent avec
  // authorizeRole(Role.PROJECT_MANAGER) côté serveur dans deleteProject()
  const canDelete =
    user.role === Role.ADMIN ||
    user.role === Role.PROJECT_MANAGER
  
  const canManageMembers = 
    user.role === Role.ADMIN || 
    user.role === Role.PROJECT_MANAGER
  
  
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-3">
          <a 
            href={`/org/${orgName}/projects`}
            className="p-2 hover:bg-zinc-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-600" />
          </a>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              {project.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-block px-2 py-1 bg-zinc-100 text-xs font-semibold text-zinc-600 rounded-md uppercase">
                {project.status}
              </span>
              {project.client && (
                <span className="text-xs text-zinc-500">
                  Client: {project.client.name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <a
              href={`/org/${orgName}/projects/${projectId}/edit`}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
            >
              Modifier
            </a>
          )}
          {canDelete && (
            <DeleteProjectButton
              projectId={projectId}
              projectName={project.name}
              orgName={orgName}
            />
          )}
        </div>
      </div>
      
      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* LEFT COLUMN - PROJECT INFO & CLIENT */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PROJECT INFO CARD */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900">
              Informations du projet
            </h2>
            
            {project.description && (
              <div>
                <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">
                  Description
                </p>
                <p className="text-sm text-zinc-700">
                  {project.description}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">
                  Date de début
                </p>
                <p className="text-sm text-zinc-700 font-medium">
                  {project.startDate 
                    ? new Date(project.startDate).toLocaleDateString('fr-FR')
                    : '—'
                  }
                </p>
              </div>
              
              <div>
                <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">
                  Date de fin
                </p>
                <p className="text-sm text-zinc-700 font-medium">
                  {project.endDate
                    ? new Date(project.endDate).toLocaleDateString('fr-FR')
                    : '—'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* CLIENT CARD */}
          {project.client && (
            <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                Client
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">
                    Nom
                  </p>
                  <p className="text-sm text-zinc-700 font-medium">
                    {project.client.name}
                  </p>
                </div>
                
                {project.client.email && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">
                      Email
                    </p>
                    <a 
                      href={`mailto:${project.client.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {project.client.email}
                    </a>
                  </div>
                )}
                
                {project.client.phone && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">
                      Téléphone
                    </p>
                    <a
                      href={`tel:${project.client.phone}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {project.client.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* RIGHT COLUMN - MEMBERS */}
        <div className="space-y-6">
          {/* MEMBERS CARD */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">
                Membres ({project.members.length})
              </h2>
              {canManageMembers && (
                <AddMemberModal 
                  projectId={projectId}
                  orgName={orgName}
                  existingMemberIds={project.members.map(m => m.id)}
                />
              )}
            </div>
            
            <div className="space-y-2">
              {project.members.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">
                  Aucun membre assigné
                </p>
              ) : (
                project.members.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {member.avatarUrl && (
                        <img
                          src={member.avatarUrl}
                          alt={member.firstName}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-zinc-500 capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    
                    {canManageMembers && (
                      <RemoveMemberButton 
                        projectId={projectId}
                        memberId={member.id}
                        memberName={`${member.firstName} ${member.lastName}`}
                        orgName={orgName}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* TASKS SECTION */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">
            Tâches du projet ({project.tasks.length})
          </h2>
          {canManageMembers && (
            <a
              href={`/org/${orgName}/projects/${projectId}/tasks/new`}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
            >
              + Nouvelle tâche
            </a>
          )}
        </div>
        
        {project.tasks.length === 0 ? (
          <p className="text-sm text-zinc-500 italic py-8 text-center">
            Aucune tâche pour ce projet
          </p>
        ) : (
          <div className="space-y-2">
            {project.tasks.map((task) => (
              <div 
                key={task.id}
                className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2 py-1 bg-zinc-100 text-[10px] font-semibold text-zinc-600 rounded uppercase">
                      {task.status}
                    </span>
                    <h3 className="font-medium text-zinc-900">
                      {task.title}
                    </h3>
                  </div>
                  
                  {task.assignees.length > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                      {task.assignees.map((assignee) => (
                        <span 
                          key={assignee.id}
                          className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded"
                        >
                          {assignee.firstName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}