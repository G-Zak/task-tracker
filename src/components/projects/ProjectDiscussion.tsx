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
  unavailable: { dot: 'bg-sand-200', label: 'Temps réel indisponible (les messages restent fonctionnels)' },
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
  canModerate: boolean
}

export function ProjectDiscussion({ projectId, orgSlug, notes, canPost, currentUserId, canModerate }: ProjectDiscussionProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleRealtimeEvent = useCallback(() => {
    router.refresh()
  }, [router])

  const socketStatus = useProjectSocket(projectId, handleRealtimeEvent)
  const statusDisplay = SOCKET_STATUS_DISPLAY[socketStatus]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      const result = await createProjectNote(projectId, { content }, orgSlug)
      if ('error' in result) {
        setError(result.error)
      } else {
        setContent('')
        setError(null)
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-4 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)]">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-ink-900">
          Discussion ({notes.length})
        </h2>
        <div className="flex items-center gap-1.5" title={statusDisplay.label}>
          <span className={`h-2 w-2 rounded-full ${statusDisplay.dot}`} />
          <span className="text-xs text-sand-400">{statusDisplay.label}</span>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-ink-500 italic py-4 text-center">
          Aucun message pour le moment
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {notes.map((note) => (
            <div key={note.id} className="flex gap-3 p-3 bg-sand-50 rounded-xl">
              {note.author?.avatarUrl ? (
                <img
                  src={note.author.avatarUrl}
                  alt={note.author.firstName}
                  className="w-8 h-8 rounded-full shrink-0"
                />
              ) : (
                <div className="font-data flex w-8 h-8 shrink-0 items-center justify-center rounded-full bg-steel-600 text-[10px] font-semibold text-white">
                  {note.author ? note.author.firstName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium text-ink-900">
                    {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Utilisateur inconnu'}
                  </p>
                  <p className="font-data text-xs text-sand-400">
                    {new Date(note.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <p className="text-sm text-ink-700 whitespace-pre-wrap break-words">
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
        <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-sand-100">
          {error && (
            <p className="text-sm text-status-critical">{error}</p>
          )}
          <div className="flex gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrire un message..."
              rows={2}
              maxLength={2000}
              disabled={isPending}
              className="flex-1 border border-sand-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-maroon-600 focus:border-maroon-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="self-end px-3 py-2 bg-maroon-600 text-white rounded-xl hover:bg-maroon-700 disabled:opacity-50 transition flex items-center gap-2 text-sm font-medium"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
