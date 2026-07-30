import { ProjectStatus, Role, TaskPriority, TaskStatus } from '@/generated/enums'

export const roleLabels: Record<Role, string> = {
	ADMIN: 'Administrateur',
	PROJECT_MANAGER: 'Chef de projet',
	TEAM_LEADER: "Chef d'equipe",
	USER: 'Collaborateur',
	VIEWER: 'Observateur',
}

export const projectStatusLabels: Record<ProjectStatus, string> = {
	PLANNING: 'Planification',
	IN_PROGRESS: 'En cours',
	ON_HOLD: 'En pause',
	COMPLETED: 'Termine',
	CANCELLED: 'Annule',
}

export const taskStatusLabels: Record<TaskStatus, string> = {
	TODO: 'A faire',
	IN_PROGRESS: 'En cours',
	IN_REVIEW: 'A controler',
	DONE: 'Terminee',
	BLOCKED: 'Bloquee',
	CANCELLED: 'Annulee',
}

export const taskPriorityLabels: Record<TaskPriority, string> = {
	LOW: 'Basse',
	MEDIUM: 'Normale',
	HIGH: 'Haute',
	CRITICAL: 'Critique',
}

export const projectStatusStyles: Record<ProjectStatus, string> = {
	PLANNING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
	IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-600/20',
	ON_HOLD: 'bg-orange-50 text-orange-700 ring-orange-600/20',
	COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
	CANCELLED: 'bg-zinc-100 text-zinc-500 ring-zinc-600/10',
}

export const taskStatusStyles: Record<TaskStatus, string> = {
	TODO: 'bg-zinc-100 text-zinc-600 ring-zinc-600/15',
	IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-600/20',
	IN_REVIEW: 'bg-violet-50 text-violet-700 ring-violet-600/20',
	DONE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
	BLOCKED: 'bg-red-50 text-red-700 ring-red-600/20',
	CANCELLED: 'bg-zinc-100 text-zinc-400 ring-zinc-600/10',
}

export const taskPriorityStyles: Record<TaskPriority, string> = {
	LOW: 'bg-zinc-100 text-zinc-600 ring-zinc-600/15',
	MEDIUM: 'bg-sky-50 text-sky-700 ring-sky-600/20',
	HIGH: 'bg-amber-50 text-amber-700 ring-amber-600/20',
	CRITICAL: 'bg-red-50 text-red-700 ring-red-600/20',
}

export const roleStyles: Record<Role, string> = {
	ADMIN: 'bg-red-50 text-red-700 ring-red-600/20',
	PROJECT_MANAGER: 'bg-violet-50 text-violet-700 ring-violet-600/20',
	TEAM_LEADER: 'bg-blue-50 text-blue-700 ring-blue-600/20',
	USER: 'bg-zinc-100 text-zinc-600 ring-zinc-600/15',
	VIEWER: 'bg-zinc-100 text-zinc-400 ring-zinc-600/10',
}



export const projectStatusOptions = Object.values(ProjectStatus)
export const taskStatusOptions = Object.values(TaskStatus)
export const taskPriorityOptions = Object.values(TaskPriority)
export const roleOptions = Object.values(Role)
