const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

const failedAttempts = new Map<string, number[]>()

function recentAttempts(key: string): number[] {
    const now = Date.now()
    const timestamps = (failedAttempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
    failedAttempts.set(key, timestamps)
    return timestamps
}

export function isRateLimited(key: string): boolean {
    return recentAttempts(key).length >= MAX_ATTEMPTS
}

export function recordFailedAttempt(key: string): void {
    const timestamps = recentAttempts(key)
    timestamps.push(Date.now())
    failedAttempts.set(key, timestamps)
}

export function clearAttempts(key: string): void {
    failedAttempts.delete(key)
}
