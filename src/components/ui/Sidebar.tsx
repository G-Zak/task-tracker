'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavigationItem } from '@/src/config/navigation'
import { Menu, X } from 'lucide-react'
import { LayoutDashboard, FolderKanban, CheckSquare, Users, Building2, UserCog, User } from 'lucide-react'


const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Building2,
  UserCog,
  User
}

interface SidebarProps {
  items: NavigationItem[]
  orgSlug: string
}

export function Sidebar({ items, orgSlug }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const basePath = `/org/${orgSlug}`

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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            AT
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
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-zinc-200 bg-white p-4 transition-transform md:translate-x-0 md:static md:h-screen pt-20 md:pt-4 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 hidden md:flex items-center gap-2.5 px-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm">
            AT
          </div>
          <div>
            <span className="font-bold text-zinc-900 text-base tracking-tight leading-none block">ABA Technology</span>
            <p className="text-xs text-zinc-400 capitalize mt-0.5">{orgSlug}</p>
          </div>
        </div>

        <nav className="space-y-1 flex flex-col">
          <NavLinks />
        </nav>
      </aside>
    </>
  )
}