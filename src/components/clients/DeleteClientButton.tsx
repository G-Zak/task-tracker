'use client'

import { useState, useTransition } from 'react'
import { deleteClient } from '@/src/actions/client'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteClientButtonProps {
  clientId: string
  clientName: string
  orgSlug: string
  hasProjects: boolean
}

export function DeleteClientButton({ clientId, clientName, orgSlug, hasProjects }: DeleteClientButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    if (hasProjects) {
      setError('Impossible : ce client possède des projets.')
      setTimeout(() => setError(null), 3500)
      return
    }

    if (!confirm(`Voulez-vous vraiment supprimer le client "${clientName}" ?`)) {
      return
    }

    startTransition(async () => {
      setError(null)
      const res = await deleteClient(clientId, orgSlug)
      if ('error' in res) {
        setError(res.error)
        setTimeout(() => setError(null), 3500)
      }
    })
  }

  return (
    <div className="relative inline-flex items-center">
      {error && (
        <span className="absolute right-0 top-full mt-1.5 z-10 whitespace-nowrap rounded-md bg-status-critical-bg border border-status-critical-bg px-2 py-1 text-xs font-medium text-status-critical shadow-sm animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        title={hasProjects ? "Impossible de supprimer (projets associés)" : "Supprimer le client"}
        className="rounded-lg p-2 text-sand-400 hover:bg-status-critical-bg hover:text-status-critical transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-status-critical" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}