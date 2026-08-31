'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  ShoppingCart, 
  Wallet, 
  ChevronDown, 
  DollarSign, 
  TrendingUp, 
  FileCheck, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  Tag, 
  Package, 
  FolderTree,
  Landmark,
  FlaskConical,
  Sparkles,
  Palette
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Section dropdown states
  const isFinanzasSection = pathname === '/finanzas/flujo-caja' || pathname === '/finanzas/ingresos' || pathname.startsWith('/finanzas/egresos') || pathname.startsWith('/finanzas/tags')
  const isCatalogoSection = pathname.startsWith('/catalogo') || pathname.startsWith('/inventario')
  const isEgresosSection = pathname.startsWith('/finanzas/egresos') || pathname.startsWith('/finanzas/tags')
  const isPruebasSection = pathname.startsWith('/finanzas/proyecciones') || pathname.startsWith('/finanzas/cierres') || pathname.startsWith('/finanzas/caja-chica')
  const isInventarioSection = pathname.startsWith('/inventario') || pathname.startsWith('/catalogo/inventario')

  const [finanzasOpen, setFinanzasOpen] = useState(true)
  const [egresosOpen, setEgresosOpen] = useState(true)
  const [catalogoOpen, setCatalogoOpen] = useState(true)
  const [pruebasOpen, setPruebasOpen] = useState(true)

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Get current page name for mobile topbar
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard General'
    if (pathname.startsWith('/ventas')) return 'Ventas y Pedidos'
    if (pathname === '/catalogo/inventario' || pathname.startsWith('/inventario')) return 'Inventario de Filamentos'
    if (pathname === '/finanzas/flujo-caja') return 'Flujo de Caja'
    if (pathname === '/finanzas/ingresos') return 'Ingresos'
    if (pathname === '/finanzas/egresos') return 'Registro de Egresos'
    if (pathname === '/finanzas/tags') return 'Tags & Subcategorías'
    if (pathname === '/catalogo/categorias') return 'Categorías'
    if (pathname.startsWith('/catalogo')) return 'Catálogo de Productos'
    if (pathname === '/finanzas/proyecciones') return 'Tesorería & Asignación'
    if (pathname === '/finanzas/cierres') return 'Cierres de Mes'
    return 'NOVA 3D'
  }

  const renderNavLinks = (isMobile: boolean = false) => (
    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 bg-[#FFFFFF]">
      {/* 1. Dashboard */}
      <Link
        href="/"
        onClick={() => isMobile && setMobileMenuOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 min-h-[44px]',
          pathname === '/'
            ? 'bg-[#EFE5D8] text-[#633E20] font-bold shadow-sm border border-[#D4BEA7]'
            : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
        )}
      >
        <LayoutDashboard className="h-4 w-4 flex-shrink-0 text-[#A36F4C]" />
        <span>Dashboard</span>
      </Link>

      {/* 2. Ventas y Pedidos */}
      <Link
        href="/ventas"
        onClick={() => isMobile && setMobileMenuOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 min-h-[44px]',
          pathname === '/ventas'
            ? 'bg-[#EFE5D8] text-[#633E20] font-bold shadow-sm border border-[#D4BEA7]'
            : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
        )}
      >
        <ShoppingCart className="h-4 w-4 flex-shrink-0 text-[#633E20]" />
        <span>Ventas y Pedidos</span>
      </Link>

      {/* 3. Finanzas */}
      <div className="space-y-1 pt-1">
        <div
          onClick={() => setFinanzasOpen(!finanzasOpen)}
          className={cn(
            'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer min-h-[44px]',
            isFinanzasSection
              ? 'text-[#241C15] font-bold bg-[#F4EFEA]'
              : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
          )}
        >
          <div className="flex items-center gap-3">
            <Wallet className={cn('h-4 w-4 flex-shrink-0', isFinanzasSection ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
            <span>Finanzas</span>
          </div>
          <ChevronDown 
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200 text-[#75695D]',
              finanzasOpen ? 'rotate-0' : '-rotate-90'
            )} 
          />
        </div>

        {finanzasOpen && (
          <div className="pl-3 pr-1 space-y-1 transition-all">
            {/* Flujo de Caja */}
            <Link
              href="/finanzas/flujo-caja"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 min-h-[40px]',
                pathname === '/finanzas/flujo-caja' || pathname === '/finanzas'
                  ? 'bg-[#EFE5D8] text-[#633E20] font-bold border border-[#D4BEA7]'
                  : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
              )}
            >
              <DollarSign className="h-3.5 w-3.5 flex-shrink-0 text-[#1E5E3A]" />
              <span>Flujo de Caja</span>
            </Link>

            {/* Ingresos */}
            <Link
              href="/finanzas/ingresos"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 min-h-[40px]',
                pathname === '/finanzas/ingresos'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                  : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
              <span>Ingresos</span>
            </Link>

            {/* Egresos como Grupo con Subcategoría Tags */}
            <div className="space-y-0.5 pt-0.5">
              <div
                onClick={() => setEgresosOpen(!egresosOpen)}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer min-h-[40px]',
                  isEgresosSection
                    ? 'text-[#241C15] font-bold bg-[#F4EFEA]'
                    : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <ArrowDownRight className={cn('h-3.5 w-3.5 flex-shrink-0', isEgresosSection ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
                  <span>Egresos</span>
                </div>
                <ChevronDown 
                  className={cn(
                    'h-3 w-3 transition-transform duration-200 text-[#75695D]',
                    egresosOpen ? 'rotate-0' : '-rotate-90'
                  )} 
                />
              </div>

              {egresosOpen && (
                <div className="pl-4 space-y-0.5 border-l-2 border-[#E2D9CC] ml-4 my-1">
                  <Link
                    href="/finanzas/egresos"
                    onClick={() => isMobile && setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150 min-h-[36px]',
                      pathname === '/finanzas/egresos'
                        ? 'bg-[#EFE5D8] text-[#633E20] font-bold border border-[#D4BEA7]'
                        : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
                    )}
                  >
                    <Receipt className="h-3 w-3 flex-shrink-0" />
                    <span>Registro de Egresos</span>
                  </Link>

                  <Link
                    href="/finanzas/tags"
                    onClick={() => isMobile && setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150 min-h-[36px]',
                      pathname === '/finanzas/tags'
                        ? 'bg-[#EFE5D8] text-[#633E20] font-bold border border-[#D4BEA7]'
                        : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
                    )}
                  >
                    <Tag className="h-3 w-3 flex-shrink-0" />
                    <span>Tags & Subcategorías</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Catálogo */}
      <div className="space-y-1 pt-1">
        <div
          onClick={() => setCatalogoOpen(!catalogoOpen)}
          className={cn(
            'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer min-h-[44px]',
            isCatalogoSection
              ? 'text-[#241C15] font-bold bg-[#F4EFEA]'
              : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
          )}
        >
          <div className="flex items-center gap-3">
            <Package className={cn('h-4 w-4 flex-shrink-0', isCatalogoSection ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
            <span>Catálogo</span>
          </div>
          <ChevronDown 
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200 text-[#75695D]',
              catalogoOpen ? 'rotate-0' : '-rotate-90'
            )} 
          />
        </div>

        {catalogoOpen && (
          <div className="pl-4 pr-1 space-y-1 transition-all">
            <Link
              href="/catalogo"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 min-h-[40px]',
                pathname === '/catalogo'
                  ? 'bg-[#EFE5D8] text-[#633E20] font-bold border border-[#D4BEA7]'
                  : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
              )}
            >
              <Package className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Productos</span>
            </Link>

            <Link
              href="/catalogo/categorias"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 min-h-[40px]',
                pathname === '/catalogo/categorias'
                  ? 'bg-[#EFE5D8] text-[#633E20] font-bold border border-[#D4BEA7]'
                  : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
              )}
            >
              <FolderTree className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Categorías</span>
            </Link>

            <Link
              href="/catalogo/inventario"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 min-h-[40px]',
                isInventarioSection
                  ? 'bg-[#EFE5D8] text-[#633E20] font-bold border border-[#D4BEA7]'
                  : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
              )}
            >
              <Palette className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Inventario de Filamentos</span>
            </Link>
          </div>
        )}
      </div>

      {/* 5. Módulos de Prueba (Al mismo nivel de Catálogo) */}
      <div className="space-y-1 pt-1">
        <div
          onClick={() => setPruebasOpen(!pruebasOpen)}
          className={cn(
            'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer min-h-[44px]',
            isPruebasSection
              ? 'text-[#241C15] font-bold bg-[#F4EFEA]'
              : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
          )}
        >
          <div className="flex items-center gap-3">
            <FlaskConical className={cn('h-4 w-4 flex-shrink-0', isPruebasSection ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
            <div className="flex items-center gap-1.5">
              <span>Módulos de Prueba</span>
            </div>
          </div>
          <ChevronDown 
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200 text-[#75695D]',
              pruebasOpen ? 'rotate-0' : '-rotate-90'
            )} 
          />
        </div>

        {pruebasOpen && (
          <div className="pl-4 pr-1 space-y-1 transition-all">
            {/* Tesorería & Asignación */}
            <Link
              href="/finanzas/proyecciones"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 min-h-[40px]',
                pathname === '/finanzas/proyecciones' || pathname === '/finanzas/caja-chica'
                  ? 'bg-[#EFE5D8] text-[#633E20] font-bold border border-[#D4BEA7]'
                  : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-3.5 w-3.5 flex-shrink-0 text-[#A36F4C]" />
                <span>Tesorería & Asignación</span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#F4EFEA] text-[#75695D] border border-[#E2D9CC]">
                Prueba
              </span>
            </Link>

            {/* Cierres Mensuales */}
            <Link
              href="/finanzas/cierres"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 min-h-[40px]',
                pathname === '/finanzas/cierres'
                  ? 'bg-[#EFE5D8] text-[#633E20] font-bold border border-[#D4BEA7]'
                  : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <FileCheck className="h-3.5 w-3.5 flex-shrink-0 text-[#633E20]" />
                <span>Cierres de Mes</span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#F4EFEA] text-[#75695D] border border-[#E2D9CC]">
                Prueba
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )

  const renderFooter = () => (
    <div className="border-t border-[#E2D9CC] p-3 bg-[#FDFBF7] flex-shrink-0">
      <div className="rounded-xl bg-[#FFFFFF] border border-[#E2D9CC] px-3 py-2.5 text-xs text-[#75695D] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-6 w-6 rounded-full bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center font-bold text-[11px] flex-shrink-0">
            N
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[#241C15] font-bold truncate text-[11px] leading-tight">NOVA Workshop</span>
            <span className="text-[10px] text-[#75695D]">Taller Activo</span>
          </div>
        </div>
        <span className="w-2 h-2 rounded-full bg-[#1E5E3A] animate-pulse flex-shrink-0 ml-2" title="Conectado" />
      </div>
    </div>
  )

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full bg-[#F8F6F2] overflow-hidden text-[#241C15] relative">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (>= lg)                                                   */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex h-full w-64 flex-col bg-[#FFFFFF] text-[#75695D] shadow-md border-r border-[#E2D9CC] select-none flex-shrink-0 z-30">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-[#E2D9CC] px-6 bg-[#FDFBF7] flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#A36F4C] to-[#C48C68] shadow-sm text-white flex-shrink-0">
            <span className="font-extrabold text-sm tracking-tighter text-white">N</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-extrabold text-[#241C15] tracking-wide leading-tight truncate">
              NOVA <span className="text-[#A36F4C] font-semibold text-xs">3D</span>
            </span>
            <span className="text-[10px] text-[#75695D] font-medium truncate">Taller & Gestión</span>
          </div>
        </div>

        {/* Links */}
        {renderNavLinks(false)}

        {/* Footer */}
        {renderFooter()}
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER / SHEET (< lg)                                              */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          />

          {/* Drawer Sidebar */}
          <aside className="relative flex w-72 max-w-[85vw] h-full flex-col bg-[#FFFFFF] text-[#75695D] shadow-2xl z-50 animate-in slide-in-from-left duration-300 border-r border-[#E2D9CC]">
            {/* Drawer Header */}
            <div className="flex h-16 items-center justify-between border-b border-[#E2D9CC] px-5 bg-[#FDFBF7] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#A36F4C] to-[#C48C68] shadow-sm text-white">
                  <span className="font-extrabold text-sm tracking-tighter text-white">N</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold text-[#241C15] tracking-wide leading-tight">
                    NOVA <span className="text-[#A36F4C] font-semibold text-xs">3D</span>
                  </span>
                  <span className="text-[10px] text-[#75695D] font-medium">Taller & Gestión</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                title="Cerrar Menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Links */}
            {renderNavLinks(true)}

            {/* Footer */}
            {renderFooter()}
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT CONTAINER (HEADER + SCROLLABLE CONTENT)                     */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
        {/* Mobile / Tablet Topbar (< lg) */}
        <header className="flex lg:hidden h-14 items-center justify-between px-4 border-b border-[#E2D9CC] bg-[#FFFFFF] shadow-sm flex-shrink-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-xl text-[#241C15] hover:bg-[#F4EFEA] border border-[#E2D9CC] transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Abrir Menú"
            >
              <Menu className="h-5 w-5 text-[#241C15]" />
            </button>
            <span className="font-extrabold text-sm text-[#241C15] truncate">
              {getPageTitle()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#A36F4C] to-[#C48C68] flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
              N
            </div>
          </div>
        </header>

        {/* Scrollable Main Content (Strictly Mobile-First & Overflow protected) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8F6F2] p-3 sm:p-5 md:p-6 lg:p-8 pb-32 sm:pb-24 md:pb-16 text-[#241C15] overscroll-y-contain">
          <div className="mx-auto max-w-7xl w-full pb-8 sm:pb-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
