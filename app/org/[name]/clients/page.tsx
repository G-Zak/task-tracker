import { prisma } from '@/lib/prisma'
import { ClientForm } from '@/components/clients/ClientForm'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { Role } from '@/src/generated/client'
import { Search } from 'lucide-react'
import { redirect } from 'next/navigation'

                        //Server Component Route / Reads Data

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
        name: { contains: searchQuery, mode: 'insensitive' }
      } : {})
    },
    include: {
      projects: true 
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Clients & Partenaires</h1>
          <p className="text-sm text-zinc-500">Gérez le portefeuille client de l'organisation.</p>
        </div>

        {/* Barre de recherche (Formulaire natif qui met à jour l'URL avec ?q=...) */}
        <form className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-zinc-400" />
          <input 
            type="text" 
            name="q" 
            defaultValue={searchQuery}
            placeholder="Rechercher un client..." 
            className="pl-9 pr-4 py-2 w-full md:w-64 rounded-lg border border-zinc-200 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Liste */}
        <div className="lg:col-span-2 space-y-4">
          {clients.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-zinc-300 bg-white">
              <p className="text-zinc-500">Aucun client trouvé.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {clients.map(client => (
                <div key={client.id} className="p-4 bg-white border border-zinc-200 rounded-xl flex justify-between items-center hover:shadow-sm transition-shadow">
                  <div>
                    <h3 className="font-semibold text-zinc-900">{client.name}</h3>
                    <p className="text-sm text-zinc-500">{client.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                      {client.projects.length} projet(s)
                    </span>
                    {/* Note: Pour la modification/suppression, tu peux ajouter un bouton ouvrant une modale ou pointant vers une page de détail */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne Formulaire (Visible uniquement si PM ou ADMIN) */}
        <div>
          {canManageClients ? (
            <ClientForm orgName={orgName} />
          ) : (
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
              <p className="text-sm text-zinc-500 text-center">Vous n'avez pas les droits pour ajouter des clients.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}