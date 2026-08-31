import { Users, FolderKanban, CheckSquare, Crown } from 'lucide-react'
import type { MyTask } from '@/src/services/dashboard.service'
import type { ProjectStatus } from '@/generated/enums'
import { taskStatusLabels, projectStatusLabels } from '@/src/lib/labels'
import { taskStatusStyles, projectStatusStyles } from '@/src/lib/status-colors'

interface TeamSummary {
    id: string
    name: string
}

interface ProjectSummary {
    id: string
    name: string
    status: ProjectStatus
}

interface ProfileSummaryProps {
    teams: TeamSummary[]
    ledTeams: TeamSummary[]
    projects: ProjectSummary[]
    myTasks: MyTask[]
}

export function ProfileSummary({ teams, ledTeams, projects, myTasks }: ProfileSummaryProps) {
    const ledTeamIds = new Set(ledTeams.map((t) => t.id))
    const allTeams = [...ledTeams, ...teams.filter((t) => !ledTeamIds.has(t.id))]

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-500 mb-4">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Équipe(s)</span>
                </div>

                {allTeams.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">Aucune équipe pour le moment.</p>
                ) : (
                    <ul className="space-y-2">
                        {allTeams.map((team) => (
                            <li key={team.id} className="flex items-center justify-between gap-2 text-sm">
                                <span className="text-zinc-900 truncate">{team.name}</span>
                                {ledTeamIds.has(team.id) && (
                                    <span className="flex items-center gap-1 shrink-0 text-[10px] font-semibold uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded ring-1 ring-inset ring-amber-600/20">
                                        <Crown className="h-3 w-3" /> Chef d&apos;équipe
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-500 mb-4">
                    <FolderKanban className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Projets</span>
                </div>

                {projects.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">Aucun projet pour le moment.</p>
                ) : (
                    <ul className="space-y-2">
                        {projects.map((project) => (
                            <li key={project.id} className="flex items-center justify-between gap-2 text-sm">
                                <span className="text-zinc-900 truncate">{project.name}</span>
                                <span
                                    className={`font-data shrink-0 inline-block rounded-[5px] px-2 py-1 text-[10px] font-medium ${projectStatusStyles[project.status] ?? 'bg-sand-100 text-ink-500'}`}
                                >
                                    {projectStatusLabels[project.status]}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-500 mb-4">
                    <CheckSquare className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Tâches assignées</span>
                </div>

                {myTasks.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">Aucune tâche active assignée.</p>
                ) : (
                    <ul className="space-y-2">
                        {myTasks.map((task) => (
                            <li key={task.id} className="flex items-center justify-between gap-2 text-sm">
                                <span className="text-zinc-900 truncate">{task.title}</span>
                                <span
                                    className={`font-data shrink-0 inline-block rounded-[5px] px-2 py-1 text-[10px] font-medium ${taskStatusStyles[task.status] ?? 'bg-sand-100 text-ink-500'}`}
                                >
                                    {taskStatusLabels[task.status]}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
