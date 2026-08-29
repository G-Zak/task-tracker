'use client'

import { useState, useTransition } from 'react'
import { addMemberToProject } from '@/src/actions/project'
import { Plus, Loader2, X } from 'lucide-react'

interface AddMemberModalProps {
  projectId: string
  orgSlug: string
  existingMemberIds: string[]
}

export function AddMemberModal({
  projectId,
  orgSlug,
  existingMemberIds,
}: AddMemberModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenModal = async () => {
    setIsOpen(true)
    setIsLoadingUsers(true)
    setError(null)

    try {
      // TODO: Fetch available users from service
      setAvailableUsers([])
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return

    startTransition(async () => {
      try {
        const result = await addMemberToProject(projectId, selectedUserId, orgSlug)
        if ('error' in result) {
          setError(result.error)
        } else {
          setIsOpen(false)
          setSelectedUserId('')
          setError(null)
        }
      } catch (err: any) {
        setError(err.message || 'Erreur')
      }
    })
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Ajouter
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">
                Ajouter un membre
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-zinc-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 uppercase block mb-2">
                  Sélectionner un membre
                </label>

                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center">
                    <p className="text-sm text-zinc-600">
                      Tous les utilisateurs sont déjà membres du projet
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choisir...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!selectedUserId || isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isPending ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
