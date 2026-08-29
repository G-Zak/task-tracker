'use client'

import { useState, useTransition } from 'react'
import { Check, X } from 'lucide-react'
import { approveUser, rejectUser } from '@/src/actions/user'
import { Role } from '@/src/generated/enums'
import { roleLabels, roleStyles } from '@/src/lib/labels'

interface PendingUserRowProps {
    user: {
        id: string
        firstName: string
        lastName: string
        email: string
        role: Role
        createdAt: Date
    }
    orgSlug: string
}

function formatRequestedAt(date: Date) {
    return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function PendingUserRow({ user, orgSlug }: PendingUserRowProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [handled, setHandled] = useState(false)

    const handleApprove = () => {
        setError(null)
        startTransition(async () => {
            const res = await approveUser(user.id, orgSlug)
            if ('error' in res) {
                setError(res.error)
                return
            }
            setHandled(true)
        })
    }

    const handleReject = () => {
        setError(null)
        startTransition(async () => {
            const res = await rejectUser(user.id, orgSlug)
            if ('error' in res) {
                setError(res.error)
                return
            }
            setHandled(true)
        })
    }

    if (handled) return null

    return (
        <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-semibold text-amber-800">
                    {user.firstName.charAt(0).toUpperCase()}
                    {user.lastName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                        {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                        {user.email} · demandé le {formatRequestedAt(user.createdAt)}
                    </p>
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase ring-1 ring-inset ${roleStyles[user.role]}`}
                >
                    {roleLabels[user.role]}
                </span>

                <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                >
                    <Check className="h-3.5 w-3.5" />
                    Approuver
                </button>
                <button
                    type="button"
                    onClick={handleReject}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                    <X className="h-3.5 w-3.5" />
                    Refuser
                </button>
            </div>
        </li>
    )
}
