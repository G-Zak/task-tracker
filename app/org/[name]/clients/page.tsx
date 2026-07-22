import { prisma } from '@/lib/prisma'
import { ClientForm } from '@/components/clients/ClientForm'
import { DeleteClientButton } from '@/components/clients/DeleteClientButton'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { Role } from '@/src/generated/client'
import { Search, Building2, FolderKanban, Mail, ShieldAlert } from 'lucide-react'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ name: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function ClientsPage({ params, searchParams }: PageProps) {
  const { name: orgName } = await params
  const { q: searchQuery } = await searchParams
  
  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  const canManageClients = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

  const clients = await prisma.client.findMany({
    where: {
      organisationId: user.organisationId,
      ...(searchQuery ? {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } }
        ]
      } : {})
    },
    include: {
      projects: {
        select: { id: true }
      } 
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-8">
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-zinc-700" />
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Clients & Partenaires</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Portefeuille des comptes commanditaires et suivi des partenariats.
          </p>
        </div>

        {/* Barre de recherche */}
        <form className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input 
            type="text" 
            name="q" 
            defaultValue={searchQuery}
            placeholder="Rechercher par nom ou email..." 
            className="w-full sm:w-72 rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </form>
      </div>

      {/* Grille principale : Liste + Formulaire */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        
        {/* Colonne Liste des Clients (2 Cols sur écran large) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Comptes enregistrés ({clients.length})
            </span>
          </div>

          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
              <div className="rounded-full bg-zinc-100 p-3 text-zinc-500 mb-3">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-zinc-900">Aucun client trouvé</h3>
              <p className="mt-1 text-sm text-zinc-500 max-w-sm">
                {searchQuery 
                  ? `Aucun résultat ne correspond à la recherche "${searchQuery}".` 
                  : "Aucun client n'est encore enregistré pour cette organisation."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {clients.map((client) => {
                const projectCount = client.projects.length

                return (
                  <div 
                    key={client.id} 
                    className="group relative flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-semibold text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-semibold text-zinc-900 leading-none">
                          {client.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Mail className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{client.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Badge Nombre de Projets */}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                        <FolderKanban className="h-3.5 w-3.5 text-purple-600" />
                        {projectCount} {projectCount > 1 ? 'projets' : 'projet'}
                      </span>

                      {/* Bouton de Suppression (Réservé aux PM & ADMIN) */}
                      {canManageClients && (
                        <DeleteClientButton 
                          clientId={client.id}
                          clientName={client.name}
                          orgName={orgName}
                          hasProjects={projectCount > 0}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Colonne Formulaire (Sticky sur Desktop) */}
        <div className="lg:sticky lg:top-8">
          {canManageClients ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm">
              <ClientForm orgName={orgName} />
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-6 text-center">
              <ShieldAlert className="mx-auto h-8 w-8 text-amber-600 mb-2" />
              <h3 className="font-medium text-amber-900 text-sm">Permissions restreintes</h3>
              <p className="mt-1 text-xs text-amber-700">
                Seuls les Administrateurs et Chefs de Projets peuvent ajouter ou supprimer des comptes clients.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}