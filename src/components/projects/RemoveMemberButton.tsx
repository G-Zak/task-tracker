'use client'

import { useState, useTransition } from 'react'
import { removeMemberFromProject } from '@/src/actions/project'
import { Trash2, Loader2 } from 'lucide-react'

interface RemoveMemberButtonProps {
  projectId: string
  memberId: string
  memberName: string
  orgSlug: string
}

export function RemoveMemberButton({
  projectId,
  memberId,
  memberName,
  orgSlug,
}: RemoveMemberButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleRemove = () => {
    startTransition(async () => {
      try {
        const result = await removeMemberFromProject(projectId, memberId, orgSlug)
        if ('error' in result) {
          setError(result.error)
        } else {
          setShowConfirm(false)
          setError(null)
        }
      } catch (err: any) {
        setError(err.message || 'Erreur')
      }
    })
  }

  if (showConfirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 transition flex items-center gap-1"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          {isPending ? 'Suppression...' : 'Confirmer'}
        </button>
        <button
          onClick={() => {
            setShowConfirm(false)
            setError(null)
          }}
          disabled={isPending}
          className="px-2 py-1 text-xs bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200"
        >
          Annuler
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition"
      title={`Retirer ${memberName}`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
