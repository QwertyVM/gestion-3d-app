'use client'

import React, { useState, useMemo, useTransition } from 'react'
import {
  ProductoDemandaFavoritosItem,
  toggleAvisoFavorito,
  marcarTodosAvisosProducto,
} from '@/actions/tienda'
import { TipoNegocio } from '@/lib/business'
import {
  Heart,
  Bell,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Package,
  Search,
  MessageCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'

interface TabFavoritosDemandaProps {
  negocio: TipoNegocio
  favoritos: ProductoDemandaFavoritosItem[]
  onRefresh: () => void
}

type FilterPriority = 'TODOS' | 'CRITICA' | 'ALTA' | 'MEDIA' | 'ESTABLE'

export function TabFavoritosDemanda({
  negocio,
  favoritos,
  onRefresh,
}: TabFavoritosDemandaProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('TODOS')
  const [categoryFilter, setCategoryFilter] = useState('TODAS')
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Categories list
  const categories = useMemo(() => {
    const list = Array.from(
      new Set(favoritos.map((p) => p.lineaCategoria?.trim()).filter(Boolean))
    )
    list.sort()
    return list
  }, [favoritos])

  // KPIs
  const totalFavoritosCount = useMemo(
    () => favoritos.reduce((acc, p) => acc + p.totalFavoritos, 0),
    [favoritos]
  )

  const totalAvisosPendientesCount = useMemo(
    () => favoritos.reduce((acc, p) => acc + p.totalAvisosPendientes, 0),
    [favoritos]
  )

  const totalAgotadosConDemanda = useMemo(
    () =>
      favoritos.filter(
        (p) => p.controlarStock && p.stock <= 0 && p.totalFavoritos > 0
      ).length,
    [favoritos]
  )

  const totalAvisadosCount = useMemo(
    () => favoritos.reduce((acc, p) => acc + p.totalAvisosEnviados, 0),
    [favoritos]
  )

  // Filtered items
  const filteredItems = useMemo(() => {
    return favoritos.filter((p) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchesName = p.nombreModelo.toLowerCase().includes(q)
        const matchesCat = p.lineaCategoria.toLowerCase().includes(q)
        if (!matchesName && !matchesCat) return false
      }

      if (categoryFilter !== 'TODAS' && p.lineaCategoria !== categoryFilter) {
        return false
      }

      if (priorityFilter !== 'TODOS' && p.prioridad !== priorityFilter) {
        return false
      }

      return true
    })
  }, [favoritos, searchTerm, categoryFilter, priorityFilter])

  const handleToggleAviso = (favoritoId: string, currentAvisado: boolean) => {
    startTransition(async () => {
      try {
        await toggleAvisoFavorito(favoritoId, !currentAvisado)
        toast.success(
          !currentAvisado
            ? 'Marcado como avisado'
            : 'Marcado como pendiente de aviso'
        )
        onRefresh()
      } catch (err) {
        toast.error('Error al actualizar el estado del aviso')
      }
    })
  }

  const handleMarcarTodos = (productoId: string) => {
    startTransition(async () => {
      try {
        await marcarTodosAvisosProducto(productoId, true)
        toast.success('Todos los clientes fueron marcados como avisados')
        onRefresh()
      } catch (err) {
        toast.error('Error al marcar avisos')
      }
    })
  }

  const cleanPhoneNumber = (phone: string | null) => {
    if (!phone) return ''
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 9) return `51${digits}`
    return digits
  }

  return (
    <div className="space-y-6">
      {/* 1. DECISION SUMMARY / KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Favoritos Guardados
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-foreground mt-1 tabular-nums">
              {totalFavoritosCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              En {favoritos.length} juegos del catálogo
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
        </div>

        {/* KPI 2: Reabastecimiento Crítico */}
        <div className="bg-card rounded-2xl border border-rose-500/20 p-4 sm:p-5 shadow-xs flex items-center justify-between bg-gradient-to-br from-rose-500/5 to-card">
          <div>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              Agotados con Demanda
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
              {totalAgotadosConDemanda}
            </div>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium mt-0.5">
              Reabastecer con prioridad
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Flame className="w-6 h-6 fill-current" />
          </div>
        </div>

        {/* KPI 3: Clientes en Espera */}
        <div className="bg-card rounded-2xl border border-amber-500/20 p-4 sm:p-5 shadow-xs flex items-center justify-between bg-gradient-to-br from-amber-500/5 to-card">
          <div>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Clientes Esperando Aviso
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
              {totalAvisosPendientesCount}
            </div>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium mt-0.5">
              Ventas directas al llegar stock
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Bell className="w-6 h-6 fill-current" />
          </div>
        </div>

        {/* KPI 4: Avisos Enviados */}
        <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Avisos Notificados
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {totalAvisadosCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Clientes ya contactados
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar juego por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border/80 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-ring transition-colors"
            />
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-background border border-border/80 text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="TODAS">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isPending}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shrink-0"
            title="Refrescar datos"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
        </div>

        {/* Priority Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-xs">
          <button
            onClick={() => setPriorityFilter('TODOS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              priorityFilter === 'TODOS'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos ({favoritos.length})
          </button>
          <button
            onClick={() => setPriorityFilter('CRITICA')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              priorityFilter === 'CRITICA'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Crítica: Agotado + Esperando Aviso</span>
          </button>
          <button
            onClick={() => setPriorityFilter('ALTA')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              priorityFilter === 'ALTA'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alta: Agotado con Favoritos</span>
          </button>
          <button
            onClick={() => setPriorityFilter('MEDIA')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              priorityFilter === 'MEDIA'
                ? 'bg-yellow-600 text-white shadow-xs'
                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20'
            }`}
          >
            Media: Stock Bajo (≤ 2 un.)
          </button>
          <button
            onClick={() => setPriorityFilter('ESTABLE')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              priorityFilter === 'ESTABLE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            Con Stock Disponible
          </button>
        </div>
      </div>

      {/* 3. PRODUCT DEMAND LIST (Zero horizontal scroll layout compliant with rule) */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center border border-rose-500/20">
              <Heart className="w-8 h-8 fill-rose-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No se encontraron registros de favoritos
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Cuando los clientes guarden juegos como favoritos en la tienda web o
              soliciten avisos cuando se agota el stock, aparecerán aquí para que
              puedas tomar decisiones de compra y reabastecimiento informadas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredItems.map((p) => {
              const isExpanded = expandedProductId === p.id
              const isOutOfStock = p.controlarStock && p.stock <= 0
              const isLowStock = p.controlarStock && p.stock > 0 && p.stock <= 2

              return (
                <div key={p.id} className="transition-colors hover:bg-muted/30">
                  {/* Main Product Card Row */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Cover & Info */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        {p.imagenUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imagenUrl}
                            alt={p.nombreModelo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-primary" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/60">
                            {p.lineaCategoria || 'General'}
                          </span>

                          {/* Decision Recommendation Badge */}
                          {p.prioridad === 'CRITICA' && (
                            <span className="text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                              <Flame className="w-3 h-3 fill-rose-600 text-rose-600" />
                              <span>URGENTE: AGOTADO CON CLIENTES EN ESPERA</span>
                            </span>
                          )}

                          {p.prioridad === 'ALTA' && (
                            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                              <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>REABASTECER: AGOTADO CON FAVORITOS</span>
                            </span>
                          )}

                          {p.prioridad === 'MEDIA' && (
                            <span className="text-[10px] font-semibold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                              STOCK BAJO CON DEMANDA
                            </span>
                          )}

                          {p.prioridad === 'ESTABLE' && (
                            <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              DISPONIBLE
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm sm:text-base font-semibold text-foreground leading-snug break-words">
                          {p.nombreModelo}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                          <span>
                            Precio:{' '}
                            <strong className="text-foreground tabular-nums">
                              S/ {p.precioMenor.toFixed(2)}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Stock Status & Counters */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap shrink-0">
                      {/* Current Stock */}
                      <div className="text-center px-3 py-1.5 rounded-xl border border-border/60 bg-muted/20">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                          Stock Actual
                        </span>
                        <span
                          className={`text-xs font-bold tabular-nums ${
                            isOutOfStock
                              ? 'text-rose-600 dark:text-rose-400'
                              : isLowStock
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isOutOfStock ? '0 (Agotado)' : `${p.stock} unidades`}
                        </span>
                      </div>

                      {/* Total Favorites */}
                      <div className="text-center px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10">
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold uppercase block flex items-center justify-center gap-1">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                          <span>Favoritos</span>
                        </span>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          {p.totalFavoritos} guardados
                        </span>
                      </div>

                      {/* Stock Alerts Pending */}
                      <div className="text-center px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase block flex items-center justify-center gap-1">
                          <Bell className="w-3 h-3 fill-amber-600 text-amber-600" />
                          <span>Avisos Pendientes</span>
                        </span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          {p.totalAvisosPendientes} clientes
                        </span>
                      </div>

                      {/* Accordion / Customer list button */}
                      {p.clientesAviso.length > 0 && (
                        <button
                          onClick={() =>
                            setExpandedProductId(isExpanded ? null : p.id)
                          }
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-foreground text-background shadow-xs'
                              : 'bg-card border border-border/60 text-foreground hover:bg-muted/30'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Ver Clientes ({p.clientesAviso.length})</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Accordion: Customers waiting for alerts or saved */}
                  {isExpanded && p.clientesAviso.length > 0 && (
                    <div className="bg-muted/20 border-t border-border/40 p-4 sm:p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>
                            Clientes interesados en &ldquo;{p.nombreModelo}&rdquo;
                          </span>
                        </h5>

                        {p.totalAvisosPendientes > 0 && (
                          <button
                            onClick={() => handleMarcarTodos(p.id)}
                            disabled={isPending}
                            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer self-start sm:self-auto"
                          >
                            Marcar a todos como avisados
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {p.clientesAviso.map((c) => {
                          const cleanPhone = cleanPhoneNumber(c.clienteTelefono)
                          const whatsappMsg = `🎲 ¡Hola ${
                            c.clienteNombre || ''
                          }! Te escribimos de NOVA Board Games. El juego "${
                            p.nombreModelo
                          }" que tenías en tus favoritos ya está disponible en nuestra tienda web: https://novabg.pe/catalogo. ¡Asegura el tuyo antes de que se vuelva a agotar!`
                          const waUrl = cleanPhone
                            ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                whatsappMsg
                              )}`
                            : ''

                          return (
                            <div
                              key={c.id}
                              className="bg-card rounded-xl border border-border/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-foreground">
                                    {c.clienteNombre || 'Cliente Registrado'}
                                  </span>
                                  {c.deseaAvisoStock && (
                                    <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                                      Solicitó aviso de stock
                                    </span>
                                  )}
                                  {c.avisado ? (
                                    <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Avisado</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">
                                      Pendiente de aviso
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-muted-foreground text-[11px] flex-wrap">
                                  {c.clienteTelefono && (
                                    <span className="tabular-nums">Tel: {c.clienteTelefono}</span>
                                  )}
                                  {c.clienteEmail && (
                                    <span>Email: {c.clienteEmail}</span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span className="tabular-nums">
                                      Guardado el{' '}
                                      {new Date(c.createdAt).toLocaleDateString(
                                        'es-PE'
                                      )}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                {waUrl && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                                    title="Notificar por WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>Avisar por WhatsApp</span>
                                  </a>
                                )}

                                <button
                                  onClick={() =>
                                    handleToggleAviso(c.id, c.avisado)
                                  }
                                  disabled={isPending}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                                    c.avisado
                                      ? 'bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted'
                                      : 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary shadow-xs'
                                  }`}
                                >
                                  {c.avisado
                                    ? 'Marcar Pendiente'
                                    : 'Marcar Avisado'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
