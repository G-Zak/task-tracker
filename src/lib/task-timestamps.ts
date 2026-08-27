import { TaskStatus } from '@/src/generated/enums'

interface TaskTimestampParams {
    previousStatus: TaskStatus
    nextStatus?: TaskStatus
    startedAt: Date | null
}

export function computeTaskTimestampUpdates({ previousStatus, nextStatus, startedAt }: TaskTimestampParams) {
    const updates: { startedAt?: Date; approvedAt?: Date } = {}

    if (!nextStatus || nextStatus === previousStatus) return updates

    if (nextStatus === TaskStatus.IN_PROGRESS && !startedAt) {
        updates.startedAt = new Date()
    }

    if (nextStatus === TaskStatus.DONE) {
        updates.approvedAt = new Date()
    }

    return updates
}
