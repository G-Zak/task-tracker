import Image from 'next/image'

const SIZE_CLASSES = {
	sm: 'h-8 w-8 rounded-lg',
	md: 'h-11 w-11 rounded-xl',
	lg: 'h-16 w-16 rounded-2xl',
} as const

const SIZE_PX = { sm: 32, md: 44, lg: 64 } as const

export function BrandMark({ size = 'md', className = '' }: { size?: keyof typeof SIZE_CLASSES; className?: string }) {
	const px = SIZE_PX[size]
	return (
		<div className={`relative shrink-0 overflow-hidden ${SIZE_CLASSES[size]} shadow-sm ${className}`}>
			<Image src="/branding/aba-logo.png" alt="ABA Technology" width={px} height={px} className="h-full w-full object-cover" priority />
		</div>
	)
}
