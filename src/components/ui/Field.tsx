import { cn } from '@/lib/utils'

// Champs de formulaire standards

const baseFieldClasses =
	'w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2 text-sm text-ink-900 placeholder:text-sand-400 transition-colors focus:border-maroon-600 focus:outline-none focus:ring-1 focus:ring-maroon-600 disabled:cursor-not-allowed disabled:bg-sand-50 disabled:text-sand-400'

export function Label({ children, htmlFor, required }: { children: React.ReactNode; htmlFor?: string; required?: boolean }) {
	return (
		<label htmlFor={htmlFor} className="text-xs font-semibold text-ink-700">
			{children}
			{required && <span className="ml-0.5 text-status-critical">*</span>}
		</label>
	)
}

export function FieldError({ message }: { message?: string }) {
	if (!message) return null
	return <p className="mt-1 text-xs text-status-critical">{message}</p>
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
			{hint && !error && <p className="mt-1 text-[11px] text-sand-400">{hint}</p>}
			<FieldError message={error} />
		</div>
	)
}

export function FormAlert({ type, message }: { type: 'error' | 'success'; message: string }) {
	return (
		<div
			className={cn(
				'rounded-xl border p-3 text-xs',
				type === 'error' ? 'border-status-critical-bg bg-status-critical-bg text-status-critical' : 'border-status-success-bg bg-status-success-bg text-status-success'
			)}
		>
			{message}
		</div>
	)
}
