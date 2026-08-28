'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Package, ShoppingCart, Box } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inversiones', href: '/inversiones', icon: Wallet },
  { name: 'Catálogo', href: '/catalogo', icon: Package },
  { name: 'Ventas y Pedidos', href: '/ventas', icon: ShoppingCart },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-zinc-950 text-zinc-300 shadow-xl">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-6">
        <Box className="h-6 w-6 text-emerald-500" />
        <span className="text-lg font-bold text-white tracking-tight">Gestión 3D</span>
      </div>
      <div className="flex-1 overflow-auto py-6">
        <nav className="flex flex-col gap-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'hover:bg-zinc-800/50 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="border-t border-zinc-800 p-4">
        <div className="rounded-lg bg-zinc-900 p-3 text-xs text-zinc-400 text-center">
          Modo Administrador
        </div>
      </div>
    </div>
  )
}
