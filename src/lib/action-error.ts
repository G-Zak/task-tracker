
export function catchActionError(error: unknown, fallback: string): { error: string } {
    if (error instanceof Error && error.message) {
        return { error: error.message }
    }
    return { error: fallback }
}

export function isPrismaErrorCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === code
}
