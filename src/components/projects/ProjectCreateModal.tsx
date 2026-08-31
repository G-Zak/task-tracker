'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { ProjectForm } from '@/components/projects/ProjectForm'

interface ProjectCreateModalProps {
  orgSlug: string
  clients: { id: string; name: string }[]
  users: { id: string; name: string; role: string }[]
}

export function ProjectCreateModal({ orgSlug, clients, users }: ProjectCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nouveau projet
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

            <ProjectForm
              orgSlug={orgSlug}
              clients={clients}
              users={users}
              onSuccess={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
