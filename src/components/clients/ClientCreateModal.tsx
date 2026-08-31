'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { ClientForm } from '@/src/components/clients/ClientForm'

interface ClientCreateModalProps {
    orgSlug: string
}

export function ClientCreateModal({ orgSlug }: ClientCreateModalProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-maroon-600 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-700 transition-colors"
            >
                <Plus className="h-4 w-4" />
                Nouveau client
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-md w-full max-h-[85vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute right-3 top-3 z-10 rounded-lg bg-white p-1.5 shadow-sm hover:bg-sand-100"
                        >
                            <X className="h-5 w-5 text-ink-500" />
                        </button>

                        <ClientForm orgSlug={orgSlug} onSuccess={() => setIsOpen(false)} />
                    </div>
                </div>
            )}
        </>
    )
}
