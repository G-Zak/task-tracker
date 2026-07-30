'use client'

import { roleLabels } from '@/lib/labels'
import type { Role } from '@/generated/enums'


export function MemberPicker({
	members,
	selectedIds,
	onChange,
	emptyLabel = 'Aucun membre disponible.',
}: {
	members: { id: string; name: string; role: string }[]
	selectedIds: string[]
	onChange: (ids: string[]) => void
	emptyLabel?: string
}) {
	const toggle = (memberId: string) => {
		if (selectedIds.includes(memberId)) {
			onChange(selectedIds.filter((id) => id !== memberId))
		} else {
			onChange([...selectedIds, memberId])
		}
	}

	if (members.length === 0) {
		return <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500">{emptyLabel}</p>
	}

	return (
		<div className="max-h-44 divide-y divide-zinc-100 overflow-y-auto rounded-xl border border-zinc-200 p-1">
			{members.map((member) => {
				const isSelected = selectedIds.includes(member.id)

				return (
					<label
						key={member.id}
						className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50"
					>
						<span className="min-w-0">
							<span className="block truncate text-xs font-medium text-zinc-900">{member.name}</span>
							<span className="block text-[10px] text-zinc-400">{roleLabels[member.role as Role] ?? member.role}</span>
						</span>

						<input
							type="checkbox"
							checked={isSelected}
							onChange={() => toggle(member.id)}
							className="h-4 w-4 shrink-0 rounded border-zinc-300 text-primary focus:ring-primary"
						/>
					</label>
				)
			})}
		</div>
	)
}
