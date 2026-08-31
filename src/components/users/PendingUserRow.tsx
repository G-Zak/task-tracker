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
                <div className="font-data flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-warning text-xs font-semibold text-white">
                    {user.firstName.charAt(0).toUpperCase()}
                    {user.lastName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                        {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-ink-500 truncate">
                        {user.email} · demandé le {formatRequestedAt(user.createdAt)}
                    </p>
                    {error && <p className="mt-1 text-xs text-status-critical">{error}</p>}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span
                    className={`font-data inline-block rounded-[5px] px-2 py-1 text-[10px] font-medium ${roleStyles[user.role]}`}
                >
                    {roleLabels[user.role]}
                </span>

                <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-status-success-bg px-2.5 py-1.5 text-xs font-medium text-status-success hover:bg-status-success-bg transition-colors disabled:opacity-50"
                >
                    <Check className="h-3.5 w-3.5" />
                    Approuver
                </button>
                <button
                    type="button"
                    onClick={handleReject}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-status-critical-bg px-2.5 py-1.5 text-xs font-medium text-status-critical hover:bg-status-critical-bg transition-colors disabled:opacity-50"
                >
                    <X className="h-3.5 w-3.5" />
                    Refuser
                </button>
            </div>
        </li>
    )
}
