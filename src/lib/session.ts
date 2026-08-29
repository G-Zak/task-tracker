import crypto from 'node:crypto'

const SESSION_SECRET = process.env.SESSION_SECRET

if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET manquant — définissez-le dans .env avant de démarrer.')
}

export interface SessionPayload {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    organisationId: string
}

function sign(value: string): string {
    return crypto.createHmac('sha256', SESSION_SECRET!).update(value).digest('base64url')
}

export function encodeSession(payload: SessionPayload): string {
    const json = Buffer.from(JSON.stringify(payload)).toString('base64url')
    return `${json}.${sign(json)}`
}

export function decodeSession(cookieValue: string): SessionPayload | null {
    const separatorIndex = cookieValue.lastIndexOf('.')
    if (separatorIndex === -1) return null

    const json = cookieValue.slice(0, separatorIndex)
    const signature = cookieValue.slice(separatorIndex + 1)
    const expected = sign(json)

    // Comparaison en temps constant : une comparaison naïve (`===`) laisse fuir, via le temps de
    // réponse, à quelle position la signature fournie diverge de celle attendue.
    const provided = Buffer.from(signature)
    const reference = Buffer.from(expected)
    if (provided.length !== reference.length || !crypto.timingSafeEqual(provided, reference)) {
        return null
    }

    try {
        return JSON.parse(Buffer.from(json, 'base64url').toString('utf-8'))
    } catch {
        return null
    }
}
