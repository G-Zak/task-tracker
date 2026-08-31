export type Period = 'week' | 'month' | 'quarter' | 'all'

export function periodStart(period: Period, now: Date = new Date()): Date | null {
    if (period === 'all') return null

    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90
    const start = new Date(now)
    start.setDate(start.getDate() - days)
    return start
}
