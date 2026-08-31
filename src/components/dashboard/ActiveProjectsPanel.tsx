import { FolderKanban } from 'lucide-react'
import type { ProjectOverviewItem } from '@/src/services/dashboard.service'
import { projectStatusLabels } from '@/src/lib/labels'
import type { ProjectStatus } from '@/generated/enums'

interface ActiveProjectsPanelProps {
    projects: ProjectOverviewItem[]
}

const STATUS_PILL: Record<ProjectStatus, string> = {
    PLANNING: 'bg-sand-100 text-ink-500',
    IN_PROGRESS: 'bg-steel-100 text-steel-700',
    ON_HOLD: 'bg-status-warning-bg text-status-warning',
    COMPLETED: 'bg-status-success-bg text-status-success',
    CANCELLED: 'bg-sand-100 text-sand-400',
}

export function ActiveProjectsPanel({ projects }: ActiveProjectsPanelProps) {
    return (
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)] transition-shadow hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)]">
            <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-sand-100 text-ink-500 [&_svg]:h-3.5 [&_svg]:w-3.5">
                    <FolderKanban />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Projets</span>
            </div>

            {projects.length === 0 ? (
                <p className="text-xs italic text-sand-400">Aucun projet actif pour le moment.</p>
            ) : (
                <div>
                    {projects.map((project) => (
                        <div key={project.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3.5 border-t border-sand-100 py-2.5 first:border-t-0 first:pt-0">
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-ink-900">{project.name}</p>
                                {project.clientName && <p className="mt-0.5 truncate text-[11.5px] text-ink-500">{project.clientName}</p>}
                            </div>
                            <span className={`font-data shrink-0 whitespace-nowrap rounded-[5px] px-2 py-1 text-[10px] font-medium tracking-wide ${STATUS_PILL[project.status]}`}>
                                {projectStatusLabels[project.status]}
                            </span>
                            <span className="font-data shrink-0 text-right text-[12px] text-ink-500">{project.taskCount} tâches</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
