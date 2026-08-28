import { getCurrentUserSession } from '@/src/lib/rbac'
import { AssistantChat } from '@/src/components/assistant/AssistantChat'
import { Sparkles } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AssistantPage() {
  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-zinc-700" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Assistant IA</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Posez une question en langage naturel sur vos projets, tâches et échanges — 100% local, aucune donnée envoyée hors de l&apos;organisation.
        </p>
      </div>

      <AssistantChat />
    </div>
  )
}
