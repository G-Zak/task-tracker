import { z } from 'zod'

export const statisticsFilterSchema = z.object({
    period: z.enum(['week', 'month', 'quarter', 'all']).default('month'),
    projectId: z.string().optional(),
    clientId: z.string().optional(),
})

export type StatisticsFilters = z.infer<typeof statisticsFilterSchema>
