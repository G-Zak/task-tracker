import { getCurrentUserSession } from '@/src/lib/rbac'
import { navigationConfig } from '@/src/config/navigation'
import { Sidebar } from '@/src/components/ui/Sidebar'
import { Role } from '@/src/generated/client'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

interface OrgLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const user = await getCurrentUserSession()
  const { slug: rawSlug } = await params
  // Next.js ne décode pas systématiquement `params.slug` (constaté directement : un slug contenant
  // un espace revient encore percent-encodé, ex. "ABA%20Technology") — décodé explicitement pour
  // comparer à `organisation.name`, sans quoi la redirection ci-dessous boucle indéfiniment sur
  // elle-même (le slug "corrigé" ne matche alors jamais la comparaison suivante).
  const orgSlug = decodeURIComponent(rawSlug)

  if (!user || !user.role) {
    redirect('/authentication')
  }

  // [slug] n'était jusqu'ici jamais validé contre la session : n'importe quelle chaîne rendait la
  // page (voir Application-Analysis-2026-08-28.md §1.1). Un utilisateur connecté ne doit naviguer
  // que dans le slug de sa propre organisation, même si l'URL est modifiée à la main.
  const organisation = await prisma.organisation.findUnique({ where: { id: user.organisationId } })
  const expectedSlug = organisation?.name ?? user.organisationId
  if (orgSlug !== expectedSlug) {
    redirect(`/org/${encodeURIComponent(expectedSlug)}/dashboard`)
  }

  const filteredNavigation = navigationConfig.filter((item) =>
    item.allowedRoles.includes(user.role as Role)
  )

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100/60">
      <Sidebar
        items={filteredNavigation}
        orgSlug={orgSlug}
        user={{ firstName: user.firstName, lastName: user.lastName, role: user.role as Role }}
      />

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
