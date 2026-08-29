// Serveur WebSocket autonome pour la messagerie temps réel du fil de discussion (US-033).
// Process séparé de Next.js — ne modifie ni next dev/build/start ni Turbopack.
// Lancement : npm run dev:ws (voir documentation/Conception/07-Guide-Construction.md §6.11).

import { createServer, type IncomingMessage } from 'node:http'
import { WebSocket, WebSocketServer } from 'ws'
import { prisma } from '@/lib/prisma'
import { canAccessProject } from '@/lib/rbac'
import { decodeSession } from '@/lib/session'

const PORT = Number(process.env.WS_PORT ?? 4001)
const BROADCAST_SECRET = process.env.WS_BROADCAST_SECRET ?? ''

// projectId -> connexions ouvertes sur ce fil de discussion
const rooms = new Map<string, Set<WebSocket>>()

// Process séparé de Next.js (voir en-tête du fichier) : le cookie est désormais signé
// (src/lib/session.ts), donc décodé/vérifié ici plutôt que JSON.parse en clair. La partie "cet
// utilisateur est-il toujours actif/approuvé" est revérifiée juste après, via Prisma, plutôt que
// de faire confiance à ce que contenait le cookie au moment où il a été signé.
function parseSessionCookie(cookieHeader: string | undefined) {
    if (!cookieHeader) return null

    const entry = cookieHeader
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('session_user='))

    if (!entry) return null

    return decodeSession(decodeURIComponent(entry.slice('session_user='.length)))
}

interface BroadcastPayload {
    projectId: string
    type: 'note:created' | 'note:deleted'
}

async function readJsonBody(req: IncomingMessage): Promise<BroadcastPayload> {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const raw = Buffer.concat(chunks).toString('utf-8')
    return JSON.parse(raw)
}

function joinRoom(projectId: string, socket: WebSocket) {
    if (!rooms.has(projectId)) rooms.set(projectId, new Set())
    rooms.get(projectId)!.add(socket)

    socket.on('close', () => {
        const room = rooms.get(projectId)
        room?.delete(socket)
        if (room && room.size === 0) rooms.delete(projectId)
    })
}

const httpServer = createServer(async (req, res) => {
    // Déclenché par les Server Actions (createProjectNote/deleteProjectNote) après écriture en base.
    if (req.method === 'POST' && req.url === '/broadcast') {
        if (req.headers['x-ws-broadcast-secret'] !== BROADCAST_SECRET) {
            res.writeHead(401).end()
            return
        }

        try {
            const { projectId, type } = await readJsonBody(req)
            const room = rooms.get(projectId)
            const payload = JSON.stringify({ type, projectId })

            let delivered = 0
            if (room) {
                for (const socket of room) {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(payload)
                        delivered += 1
                    }
                }
            }

            res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ delivered }))
        } catch {
            res.writeHead(400).end()
        }
        return
    }

    res.writeHead(404).end()
})

const wss = new WebSocketServer({ noServer: true })

// Auth vérifiée avant d'accepter la connexion (pas après) : un client non autorisé
// reçoit un refus HTTP à la poignée de main, il ne rejoint jamais une room.
httpServer.on('upgrade', async (req, socket, head) => {
    try {
        const url = new URL(req.url ?? '', `http://localhost:${PORT}`)
        const projectId = url.searchParams.get('projectId')
        const payload = parseSessionCookie(req.headers.cookie)

        if (!projectId || !payload) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
            socket.destroy()
            return
        }

        // Revérifié en base plutôt que de faire confiance au cookie signé : un compte désactivé
        // depuis la signature du cookie ne doit pas pouvoir ouvrir un canal temps réel (même
        // logique que getCurrentUserSession() côté Next.js, src/lib/rbac.ts).
        const liveUser = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, role: true, organisationId: true, isActive: true, isApproved: true },
        })

        if (!liveUser || !liveUser.isActive || !liveUser.isApproved) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
            socket.destroy()
            return
        }

        const user = liveUser

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { select: { id: true } } },
        })

        const authorized =
            project &&
            project.organisationId === user.organisationId &&
            canAccessProject(user, project.members.map((m) => m.id))

        if (!authorized) {
            socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
            socket.destroy()
            return
        }

        wss.handleUpgrade(req, socket, head, (ws) => joinRoom(projectId, ws))
    } catch (error) {
        console.error('[ws-server] Erreur de connexion :', error)
        socket.destroy()
    }
})

httpServer.listen(PORT, () => {
    console.log(`[ws-server] Messagerie temps réel en écoute sur le port ${PORT}`)
})
