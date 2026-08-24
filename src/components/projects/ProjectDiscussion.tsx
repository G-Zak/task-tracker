'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProjectNote } from '@/src/actions/note'
import { DeleteNoteButton } from '@/src/components/projects/DeleteNoteButton'
import { useProjectSocket, type SocketStatus } from '@/src/hooks/useProjectSocket'
import { Loader2, Send } from 'lucide-react'

const SOCKET_STATUS_DISPLAY: Record<SocketStatus, { dot: string; label: string }> = {
  connecting: { dot: 'bg-amber-400 animate-pulse', label: 'Connexion au temps réel…' },
  open: { dot: 'bg-emerald-500', label: 'Temps réel' },
  reconnecting: { dot: 'bg-amber-400 animate-pulse', label: 'Reconnexion…' },
  unavailable: { dot: 'bg-zinc-300', label: 'Temps réel indisponible (les messages restent fonctionnels)' },
}

interface NoteAuthor {
  firstName: string
  lastName: string
  avatarUrl: string | null
}

interface ProjectNoteItem {
  id: string
  content: string
  createdAt: Date | string
  authorId: string | null
  author: NoteAuthor | null
}

interface ProjectDiscussionProps {
  projectId: string
  orgSlug: string
  notes: ProjectNoteItem[]
  canPost: boolean
  currentUserId: string
  // ADMIN/PROJECT_MANAGER : peut supprimer n'importe quel message du projet (US-022)
  canModerate: boolean
}

export function ProjectDiscussion({ projectId, orgSlug, notes, canPost, currentUserId, canModerate }: ProjectDiscussionProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleRealtimeEvent = useCallback(() => {
    // US-033 : un autre membre a posté ou supprimé un message — on redemande au
    // Server Component les notes à jour plutôt que de reconstruire l'état côté client.
    router.refresh()
  }, [router])

  const socketStatus = useProjectSocket(projectId, handleRealtimeEvent)
  const statusDisplay = SOCKET_STATUS_DISPLAY[socketStatus]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      const result = await createProjectNote(projectId, { content }, orgSlug)
      if (result.error) {
        setError(result.error)
      } else {
        setContent('')
        setError(null)
      }
    })
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">
          Discussion ({notes.length})
        </h2>
        <div className="flex items-center gap-1.5" title={statusDisplay.label}>
          <span className={`h-2 w-2 rounded-full ${statusDisplay.dot}`} />
          <span className="text-xs text-zinc-400">{statusDisplay.label}</span>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-zinc-500 italic py-4 text-center">
          Aucun message pour le moment
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {notes.map((note) => (
            <div key={note.id} className="flex gap-3 p-3 bg-zinc-50 rounded-lg">
              {note.author?.avatarUrl ? (
                <img
                  src={note.author.avatarUrl}
                  alt={note.author.firstName}
                  className="w-8 h-8 rounded-full shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-200 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium text-zinc-900">
                    {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Utilisateur inconnu'}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(note.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap break-words">
                  {note.content}
                </p>
              </div>

              {(canModerate || note.authorId === currentUserId) && (
                <DeleteNoteButton noteId={note.id} orgSlug={orgSlug} />
              )}
            </div>
          ))}
        </div>
      )}

      {canPost && (
        <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-zinc-100">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrire un message..."
              rows={2}
              maxLength={2000}
              disabled={isPending}
              className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="self-end px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2 text-sm font-medium"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
