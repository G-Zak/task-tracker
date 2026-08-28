const SIZE_CLASSES = {
	sm: 'h-8 w-8 rounded-lg text-xs',
	md: 'h-11 w-11 rounded-xl text-sm',
	lg: 'h-16 w-16 rounded-2xl text-xl',
} as const

export function BrandMark({ size = 'md', className = '' }: { size?: keyof typeof SIZE_CLASSES; className?: string }) {
	return (
		<div
			className={`flex shrink-0 items-center justify-center ${SIZE_CLASSES[size]} bg-primary font-bold text-primary-foreground shadow-sm ${className}`}
		>
			AT
		</div>
	)
}
