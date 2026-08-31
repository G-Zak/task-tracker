'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { NavigationItem } from '@/src/config/navigation'
import { roleLabels } from '@/src/lib/labels'
import type { Role } from '@/src/generated/client'
import { logoutAction } from '@/src/actions/auth'
import { BrandMark } from '@/src/components/branding/BrandMark'
import { Menu, X, Timer, LogOut, type LucideIcon } from 'lucide-react'
import {
  Gauge,
  FolderKanban,
  CheckSquare,
  Clock,
  MessageSquare,
  Users,
  Building2,
  BarChart3,
  UserCog,
  User,
  Sparkles,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Gauge,
  FolderKanban,
  CheckSquare,
  Clock,
  MessageSquare,
  Users,
  Building2,
  BarChart3,
  UserCog,
  User,
  Sparkles,
}

interface SidebarUser {
  firstName: string
  lastName: string
  role: Role
}

interface SidebarNextDeadline {
  taskId: string
  title: string
  dueDate: Date
}

interface SidebarProps {
  items: NavigationItem[]
  orgSlug: string
  user: SidebarUser
  nextDeadline: SidebarNextDeadline | null
}

function daysUntil(date: Date): number {
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

interface NavLinksProps {
  items: NavigationItem[]
  basePath: string
  pathname: string
  onNavigate: () => void
}

function NavLinks({ items, basePath, pathname, onNavigate }: NavLinksProps) {
  return (
    <>
      {items.map((item) => {
        const fullHref = `${basePath}${item.href}`
        const isActive = pathname === fullHref
        const IconComponent = ICON_MAP[item.icon] ?? User

        return (
          <Link
            key={item.href}
            href={fullHref}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 ${
              isActive
                ? 'bg-maroon-600 text-white shadow-sm'
                : 'text-ink-500 hover:translate-x-0.5 hover:bg-white hover:text-ink-900'
            }`}
          >
            {IconComponent && <IconComponent className="h-4 w-4 shrink-0 opacity-90" />}
            {item.name}
          </Link>
        )
      })}
    </>
  )
}

export function Sidebar({ items, orgSlug, user, nextDeadline }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, startLogout] = useTransition()

  const basePath = `/org/${orgSlug}`
  const initial = user.firstName.charAt(0).toUpperCase()
  const daysLeft = nextDeadline ? daysUntil(nextDeadline.dueDate) : null
  const organisationName = orgSlug

  const handleLogout = () => {
    startLogout(async () => {
      const result = await logoutAction()
      if (result.success) {
        router.push('/authentication')
        router.refresh()
      }
    })
  }

  return (
    <>
      {/* Bouton Mobile de la Topbar (Masqué sur Desktop) */}
      <div className="flex h-16 items-center border-b border-sand-200 bg-white/80 backdrop-blur-sm shadow-sm px-4 md:hidden justify-between w-full fixed top-0 z-40">
        <div className="flex items-center gap-2">
          <BrandMark size="sm" />
          <span className="font-heading text-ink-900 text-lg font-bold">TaskTracker</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-ink-500 hover:bg-sand-100 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Menu Latéral Rideau Mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-ink-900/40 backdrop-blur-[1px] md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col transform border-r border-sand-200 bg-sand-50 p-3.5 transition-transform md:sticky md:top-0 md:translate-x-0 md:h-screen pt-20 md:pt-4 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 hidden md:flex items-center gap-2.5 px-2.5">
          <BrandMark size="md" />
          <div>
            <span className="font-heading text-ink-900 text-[14.5px] font-bold tracking-tight leading-none block">TaskTracker</span>
            <p className="text-[11px] text-ink-500 mt-0.5">{organisationName}</p>
          </div>
        </div>

        <nav className="space-y-1 flex flex-col overflow-y-auto flex-1">
          <NavLinks items={items} basePath={basePath} pathname={pathname} onNavigate={() => setIsOpen(false)} />
        </nav>

        <div className="mt-4 shrink-0 space-y-3">
          <div className="rounded-xl bg-white border border-sand-200 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              <Timer className="h-3 w-3" />
              Prochaine échéance
            </div>
            {nextDeadline && daysLeft !== null ? (
              <>
                <p
                  className={`font-data mt-1 text-lg font-semibold leading-none ${
                    daysLeft < 0 ? 'text-status-critical' : daysLeft <= 2 ? 'text-status-warning' : 'text-ink-900'
                  }`}
                >
                  {daysLeft < 0
                    ? `En retard de ${Math.abs(daysLeft)} j`
                    : daysLeft === 0
                      ? "Aujourd'hui"
                      : daysLeft === 1
                        ? 'Demain'
                        : `${daysLeft} jours`}
                </p>
                <p className="mt-1 truncate text-xs text-ink-500" title={nextDeadline.title}>
                  {nextDeadline.title}
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs text-sand-400 italic">Aucune échéance à venir.</p>
            )}
          </div>

          <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 border-t border-sand-200 pt-3">
            <div className="font-data flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-steel-600 text-white text-xs font-semibold">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900 leading-none">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-ink-500 mt-0.5">{roleLabels[user.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Déconnexion"
              className="shrink-0 rounded-lg p-1.5 text-ink-500 hover:bg-sand-100 hover:text-maroon-600 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
