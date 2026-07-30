export const projectStatusStyles: Record<string, string> = {
  PLANNING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  ON_HOLD: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-zinc-100 text-zinc-500 ring-zinc-600/10',
}

export const taskStatusStyles: Record<string, string> = {
  TODO: 'bg-zinc-100 text-zinc-600 ring-zinc-600/10',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  IN_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  DONE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  BLOCKED: 'bg-red-50 text-red-700 ring-red-600/20',
  CANCELLED: 'bg-zinc-100 text-zinc-500 ring-zinc-600/10',
}

export const taskPriorityStyles: Record<string, string> = {
  LOW: 'bg-zinc-100 text-zinc-600 ring-zinc-600/10',
  MEDIUM: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  HIGH: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  CRITICAL: 'bg-red-50 text-red-700 ring-red-600/20',
}
