'use client'

import { useState, useTransition } from 'react'
import { Power } from 'lucide-react'
import { updateUserRole, setUserActive } from '@/src/actions/user'
import { Role } from '@/src/generated/enums'
import { roleLabels, roleStyles } from '@/src/lib/labels'

interface UserRowProps {
    user: {
        id: string
        firstName: string
        lastName: string
        email: string
        role: Role
        isActive: boolean
        lastLoginAt: Date | null
    }
    orgSlug: string
    isSelf: boolean
}

function formatLastLogin(date: Date | null) {
    if (!date) return 'Jamais connecté'
    return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function UserRow({ user, orgSlug, isSelf }: UserRowProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [role, setRole] = useState(user.role)
    const [isActive, setIsActive] = useState(user.isActive)

    const handleRoleChange = (newRole: Role) => {
        setError(null)
        const previous = role
        setRole(newRole)

        startTransition(async () => {
            const res = await updateUserRole(user.id, newRole, orgSlug)
            if ('error' in res) {
                setError(res.error)
                setRole(previous)
            }
        })
    }

    const handleToggleActive = () => {
        setError(null)
        const next = !isActive
        setIsActive(next)

        startTransition(async () => {
            const res = await setUserActive(user.id, next, orgSlug)
            if ('error' in res) {
                setError(res.error)
                setIsActive(!next)
            }
        })
    }

    return (
        <tr className={`border-b border-zinc-100 last:border-0 ${!isActive ? 'opacity-60' : ''}`}>
            <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-white">
                        {user.firstName.charAt(0).toUpperCase()}
                        {user.lastName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                            {user.firstName} {user.lastName}
                            {isSelf && <span className="ml-1.5 text-xs font-normal text-zinc-400">(vous)</span>}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                </div>
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </td>

            <td className="py-3 pr-4">
                {isSelf ? (
                    <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase ring-1 ring-inset ${roleStyles[role]}`}
                    >
                        {roleLabels[role]}
                    </span>
                ) : (
                    <select
                        value={role}
                        onChange={(e) => handleRoleChange(e.target.value as Role)}
                        disabled={isPending}
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
                    >
                        {Object.values(Role).map((r) => (
                            <option key={r} value={r}>
                                {roleLabels[r]}
                            </option>
                        ))}
                    </select>
                )}
            </td>

            <td className="py-3 pr-4">
                <span
                    className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase ring-1 ring-inset ${
                        isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-zinc-100 text-zinc-500 ring-zinc-600/10'
                    }`}
                >
                    {isActive ? 'Actif' : 'Désactivé'}
                </span>
            </td>

            <td className="py-3 pr-4 text-xs text-zinc-500">{formatLastLogin(user.lastLoginAt)}</td>

            <td className="py-3 text-right">
                {!isSelf && (
                    <button
                        type="button"
                        onClick={handleToggleActive}
                        disabled={isPending}
                        title={isActive ? 'Désactiver ce compte' : 'Réactiver ce compte'}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                            isActive
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                    >
                        <Power className="h-3.5 w-3.5" />
                        {isActive ? 'Désactiver' : 'Réactiver'}
                    </button>
                )}
            </td>
        </tr>
    )
}
