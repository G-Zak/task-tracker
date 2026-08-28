'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { NavigationItem } from '@/src/config/navigation'
import { roleLabels } from '@/src/lib/labels'
import { Role } from '@/src/generated/client'
import { logoutAction } from '@/src/actions/auth'
import { Menu, X, Timer, LogOut } from 'lucide-react'
import {
  LayoutDashboard,
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

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
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

interface SidebarProps {
  items: NavigationItem[]
  orgSlug: string
  user: SidebarUser
}

export function Sidebar({ items, orgSlug, user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, startLogout] = useTransition()

  const basePath = `/org/${orgSlug}`
  const initial = user.firstName.charAt(0).toUpperCase()

  const handleLogout = () => {
    startLogout(async () => {
      const result = await logoutAction()
      if (result.success) {
        router.push('/authentication')
        router.refresh()
      }
    })
  }

  const NavLinks = () => (
    <>
      {items.map((item) => {
        const fullHref = `${basePath}${item.href}`
        const isActive = pathname === fullHref
        const IconComponent = ICON_MAP[item.icon] ?? User

        return (
          <Link
            key={item.href}
            href={fullHref}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            {IconComponent && <IconComponent className="h-4 w-4" />}
            {item.name}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Bouton Mobile de la Topbar (Masqué sur Desktop) */}
      <div className="flex h-16 items-center border-b border-zinc-200 bg-white/80 backdrop-blur-sm shadow-sm px-4 md:hidden justify-between w-full fixed top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            TT
          </div>
          <span className="font-bold text-zinc-900 text-lg">TaskTracker</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Menu Latéral Rideau Mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-zinc-900/40 backdrop-blur-[1px] md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col transform border-r border-zinc-200 bg-white p-4 transition-transform md:translate-x-0 md:static md:h-screen pt-20 md:pt-4 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 hidden md:flex items-center gap-2.5 px-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
            TT
          </div>
          <div>
            <span className="font-bold text-zinc-900 text-base tracking-tight leading-none block">TaskTracker</span>
            <p className="text-xs text-zinc-400 mt-0.5">ABA Technology</p>
          </div>
        </div>

        <nav className="space-y-1 flex flex-col overflow-y-auto flex-1">
          <NavLinks />
        </nav>

        <div className="mt-4 shrink-0 space-y-3">
          <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <Timer className="h-3 w-3" />
              Timer
            </div>
            <p className="mt-1 text-xs text-zinc-400 italic">Aucun Timer en cours.</p>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 border-t border-zinc-100 pt-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900 leading-none">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-zinc-400 mt-0.5">{roleLabels[user.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Déconnexion"
              className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
