'use client'

import { useState, useTransition } from 'react'
import { deleteProjectNote } from '@/src/actions/note'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteNoteButtonProps {
  noteId: string
  orgSlug: string
}

export function DeleteNoteButton({ noteId, orgSlug }: DeleteNoteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    if (!confirm('Voulez-vous vraiment supprimer ce message ? Cette action est irréversible.')) {
      return
    }

    startTransition(async () => {
      setError(null)
      const res = await deleteProjectNote(noteId, orgSlug)

      if ('error' in res) {
        setError(res.error)
        setTimeout(() => setError(null), 3500)
      }
    })
  }

  return (
    <div className="relative inline-flex items-center">
      {error && (
        <span className="absolute right-8 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-red-50 border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 shadow-sm">
          {error}
        </span>
      )}

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        title="Supprimer le message"
        className="rounded-md p-1 text-zinc-300 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
