import { z } from 'zod'
import { TaskStatus, TaskPriority } from '@/src/generated/enums'

export const taskSchema = z.object({
    title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères.'),
    description: z.string().max(4000, 'Description trop longue.').optional(),

    status: z.nativeEnum(TaskStatus),
    priority: z.nativeEnum(TaskPriority),

    projectId: z.string().min(1, 'Veuillez rattacher la tâche à un projet.'),
    taskTypeId: z.string().optional(),
    dueDate: z.string().optional(),

    assigneeIds: z.array(z.string()).optional(),
})

export type TaskFormValues = z.infer<typeof taskSchema>

export const updateTaskMetricsSchema = z.object({
    taskId: z.string().min(1),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    progress: z.number().min(0).max(100).optional(),
})

export type UpdateTaskMetricsValues = z.infer<typeof updateTaskMetricsSchema>

export const taskFilterSchema = z.object({
    q: z.string().default(''),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    projectId: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
})

export type TaskFilters = z.infer<typeof taskFilterSchema>
