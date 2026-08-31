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

export const roleStyles: Record<Role, string> = {
	ADMIN: 'bg-status-critical-bg text-status-critical',
	PROJECT_MANAGER: 'bg-maroon-100 text-maroon-700',
	TEAM_LEADER: 'bg-steel-100 text-steel-700',
	USER: 'bg-sand-100 text-ink-500',
	VIEWER: 'bg-sand-100 text-sand-400',
}



export const projectStatusOptions = Object.values(ProjectStatus)
export const taskStatusOptions = Object.values(TaskStatus)
export const taskPriorityOptions = Object.values(TaskPriority)
export const roleOptions = Object.values(Role)
