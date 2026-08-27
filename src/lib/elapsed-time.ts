export function formatDuration(ms: number): string {
    if (ms < 60_000) return '< 1 min'

    const minutes = Math.floor(ms / 60_000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days >= 1) return `${days} j`
    if (hours >= 1) return `${hours}h ${minutes % 60}m`
    return `${minutes} min`
}

export function formatElapsedSince(startedAt: Date | string | null | undefined, now: Date = new Date()): string | null {
    if (!startedAt) return null

    const start = new Date(startedAt)
    const diffMs = now.getTime() - start.getTime()
    if (diffMs < 0) return null

    return formatDuration(diffMs)
}
