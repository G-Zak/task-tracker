import { z } from 'zod'

export const statisticsFilterSchema = z.object({
    period: z.enum(['week', 'month', 'quarter', 'custom']).default('month'),
    from: z.string().optional(),
    to: z.string().optional(),
    projectId: z.string().optional(),
    clientId: z.string().optional(),
    teamId: z.string().optional(),
})

export type StatisticsFilterValues = z.infer<typeof statisticsFilterSchema>
