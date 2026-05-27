'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Hash, List, BookOpen, Wifi, ChefHat, Database } from 'lucide-react'

export function AtendenteNavbar() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 bg-green-800 text-white z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/atendente" className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-green-300" />
            <div>
              <p className="text-xs text-green-300 leading-none">RU Digital</p>
              <p className="text-sm font-bold leading-none">UFOB</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink href="/atendente/validar" active={pathname === '/atendente/validar'}>
              <Hash className="w-4 h-4" />
              <span className="hidden sm:inline">Validar</span>
            </NavLink>
            <NavLink href="/atendente/pedidos" active={pathname === '/atendente/pedidos'}>
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </NavLink>
            <NavLink href="/atendente/cardapio" active={pathname === '/atendente/cardapio'}>
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Cardápio</span>
            </NavLink>
            <NavLink href="/atendente/whatsapp" active={pathname === '/atendente/whatsapp'}>
              <Wifi className="w-4 h-4" />
              <span className="hidden sm:inline">WA</span>
            </NavLink>
            <NavLink href="/atendente/backup" active={pathname === '/atendente/backup'}>
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Backup</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-green-700 text-white' : 'text-green-300 hover:text-white hover:bg-green-700'
      }`}
    >
      {children}
    </Link>
  )
}
