import { z } from 'zod'

export const timesheetFilterSchema = z.object({
    period: z.enum(['week', 'month', 'quarter', 'all']).default('month'),
    projectId: z.string().optional(),
    userId: z.string().optional(),
    groupBy: z.enum(['user', 'project']).default('user'),
})

export type TimesheetFilters = z.infer<typeof timesheetFilterSchema>
