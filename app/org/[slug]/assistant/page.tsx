import { getCurrentUserSession } from '@/src/lib/rbac'
import { AssistantChat } from '@/src/components/assistant/AssistantChat'
import { Sparkles } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AssistantPage() {
  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 border-b border-sand-200 pb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-maroon-100 text-maroon-700">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h1 className="font-heading text-[22px] font-bold tracking-tight text-ink-900">Assistant IA</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-500">
            Posez une question en langage naturel sur vos projets, tâches et échanges — 100% local, aucune donnée envoyée hors de l&apos;organisation.
          </p>
        </div>
      </div>

      <AssistantChat />
    </div>
  )
}
