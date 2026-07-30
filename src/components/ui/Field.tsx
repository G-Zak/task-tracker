import { cn } from '@/lib/utils'

// Champs de formulaire standards

const baseFieldClasses =
	'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400'

export function Label({ children, htmlFor, required }: { children: React.ReactNode; htmlFor?: string; required?: boolean }) {
	return (
		<label htmlFor={htmlFor} className="text-xs font-semibold text-zinc-700">
			{children}
			{required && <span className="ml-0.5 text-red-500">*</span>}
		</label>
	)
}

export function FieldError({ message }: { message?: string }) {
	if (!message) return null
	return <p className="mt-1 text-xs text-red-600">{message}</p>
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
	return <input className={cn(baseFieldClasses, className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return <textarea className={cn(baseFieldClasses, 'resize-y', className)} {...props} />
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
	return (
		<select className={cn(baseFieldClasses, className)} {...props}>
			{children}
		</select>
	)
}

export function FormField({
	label,
	error,
	required,
	hint,
	children,
}: {
	label: string
	error?: string
	required?: boolean
	hint?: string
	children: React.ReactNode
}) {
	return (
		<div>
			<Label required={required}>{label}</Label>
			<div className="mt-1">{children}</div>
			{hint && !error && <p className="mt-1 text-[11px] text-zinc-400">{hint}</p>}
			<FieldError message={error} />
		</div>
	)
}

export function FormAlert({ type, message }: { type: 'error' | 'success'; message: string }) {
	return (
		<div
			className={cn(
				'rounded-xl border p-3 text-xs',
				type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
			)}
		>
			{message}
		</div>
	)
}
