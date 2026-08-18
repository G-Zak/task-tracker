'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { TaskForm } from '@/components/tasks/taskForm'

interface TaskCreateModalProps {
  orgSlug: string
  projects: { id: string; name: string }[]
  taskTypes: { id: string; name: string; color: string | null }[]
  members: { id: string; name: string; role: string }[]
  defaultProjectId?: string
}

export function TaskCreateModal({ orgSlug, projects, taskTypes, members, defaultProjectId }: TaskCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nouvelle tâche
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Nouvelle tâche</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-zinc-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <TaskForm
              orgSlug={orgSlug}
              projects={projects}
              taskTypes={taskTypes}
              members={members}
              defaultProjectId={defaultProjectId}
              onSuccess={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
