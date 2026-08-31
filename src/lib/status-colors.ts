export const projectStatusStyles: Record<string, string> = {
  PLANNING: 'bg-maroon-100 text-maroon-700',
  IN_PROGRESS: 'bg-steel-100 text-steel-700',
  ON_HOLD: 'bg-status-warning-bg text-status-warning',
  COMPLETED: 'bg-status-success-bg text-status-success',
  CANCELLED: 'bg-sand-100 text-sand-400',
}

export const taskStatusStyles: Record<string, string> = {
  TODO: 'bg-sand-100 text-ink-500',
  IN_PROGRESS: 'bg-steel-100 text-steel-700',
  IN_REVIEW: 'bg-maroon-100 text-maroon-700',
  DONE: 'bg-status-success-bg text-status-success',
  BLOCKED: 'bg-status-critical-bg text-status-critical',
  CANCELLED: 'bg-sand-100 text-sand-400',
}

export const taskPriorityStyles: Record<string, string> = {
  LOW: 'bg-sand-100 text-ink-500',
  MEDIUM: 'bg-steel-100 text-steel-700',
  HIGH: 'bg-status-warning-bg text-status-warning',
  CRITICAL: 'bg-status-critical-bg text-status-critical',
}

export const taskStatusSolidStyles: Record<string, string> = {
  TODO: 'bg-steel-300',
  IN_PROGRESS: 'bg-steel-600',
  IN_REVIEW: 'bg-maroon-500',
  DONE: 'bg-status-success',
  BLOCKED: 'bg-status-critical',
  CANCELLED: 'bg-sand-200',
}
