'use client'

import { useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { TeamForm } from '@/src/components/teams/TeamForm'
import type { TeamFormValues } from '@/src/validations/team.schema'

interface EditTeamModalProps {
    orgSlug: string
    members: { id: string; name: string; role: string }[]
    team: TeamFormValues & { id: string }
}

export function EditTeamModal({ orgSlug, members, team }: EditTeamModalProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title="Modifier l'équipe"
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
                <Pencil className="h-4 w-4" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-lg w-full max-h-[85vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute right-3 top-3 z-10 rounded-lg bg-white p-1.5 shadow-sm hover:bg-sand-100"
                        >
                            <X className="h-5 w-5 text-ink-500" />
                        </button>

                        <TeamForm orgSlug={orgSlug} members={members} mode="edit" team={team} onSuccess={() => setIsOpen(false)} />
                    </div>
                </div>
            )}
        </>
    )
}
