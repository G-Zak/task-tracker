'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { TeamForm } from '@/src/components/teams/TeamForm'

interface TeamCreateModalProps {
    orgSlug: string
    members: { id: string; name: string; role: string }[]
}

export function TeamCreateModal({ orgSlug, members }: TeamCreateModalProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
                <Plus className="h-4 w-4" />
                Nouvelle équipe
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    {/* TeamForm porte déjà sa propre carte (titre, bordure, fond) ; la modale
                        se contente d'ajouter le fond, le centrage et le bouton de fermeture. */}
                    <div className="relative max-w-lg w-full max-h-[85vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute right-3 top-3 z-10 rounded-lg bg-white p-1.5 shadow-sm hover:bg-zinc-100"
                        >
                            <X className="h-5 w-5 text-zinc-500" />
                        </button>

                        <TeamForm orgSlug={orgSlug} members={members} onSuccess={() => setIsOpen(false)} />
                    </div>
                </div>
            )}
        </>
    )
}
