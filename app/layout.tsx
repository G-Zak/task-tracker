import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter, Archivo, IBM_Plex_Mono } from 'next/font/google'

import { cn } from '@/lib/utils'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

const archivo = Archivo({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-archivo' })

const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-mono' })

export const metadata: Metadata = {
	title: 'TaskTracker',
	description: 'Task tracking and team coordination workspace',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang="en"
			className={cn(
				'h-full',
				'antialiased',
				geistSans.variable,
				geistMono.variable,
				'font-sans',
				inter.variable,
				archivo.variable,
				plexMono.variable
			)}
		>
			<body className="min-h-full flex flex-col" suppressHydrationWarning>
				{children}
			</body>
		</html>
	)
}