'use client'

import { useEffect, useRef, useState } from 'react'

export type SocketStatus = 'connecting' | 'open' | 'reconnecting' | 'unavailable'

export interface ProjectSocketEvent {
    type: 'note:created' | 'note:deleted'
    projectId: string
}

const MAX_RECONNECT_ATTEMPTS = 5

export function useProjectSocket(projectId: string, onEvent: (event: ProjectSocketEvent) => void): SocketStatus {
    const [status, setStatus] = useState<SocketStatus>('connecting')
    const onEventRef = useRef(onEvent)

    useEffect(() => {
        onEventRef.current = onEvent
    }, [onEvent])

    useEffect(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL
        let socket: WebSocket | null = null
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null
        let attempts = 0
        let cancelled = false

        function connect() {
            if (cancelled) return

            if (!wsUrl) {
                setStatus('unavailable')
                return
            }

            setStatus(attempts === 0 ? 'connecting' : 'reconnecting')
            socket = new WebSocket(`${wsUrl}/?projectId=${encodeURIComponent(projectId)}`)

            socket.onopen = () => {
                attempts = 0
                setStatus('open')
            }

            socket.onmessage = (event) => {
                try {
                    const data: ProjectSocketEvent = JSON.parse(event.data)
                    onEventRef.current(data)
                } catch {
                    // message mal formé, ignoré
                }
            }

            socket.onclose = () => {
                if (cancelled) return

                attempts += 1
                if (attempts > MAX_RECONNECT_ATTEMPTS) {
                    setStatus('unavailable')
                    return
                }

                setStatus('reconnecting')
                const delay = Math.min(1000 * 2 ** attempts, 15000)
                reconnectTimer = setTimeout(connect, delay)
            }

            socket.onerror = () => {
                socket?.close()
            }
        }

        connect()

        return () => {
            cancelled = true
            if (reconnectTimer) clearTimeout(reconnectTimer)
            socket?.close()
        }
    }, [projectId])

    return status
}
