'use client'

import React, { useState, useMemo, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Boxes,
  Layers,
  Palette,
  Clock,
  RefreshCw,
  ExternalLink,
  Search,
  Package,
  Sparkles,
  ChevronDown,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  TallerDataResponse,
  PiezaTaller,
  GrupoModeloTaller,
  GrupoColorTaller,
  updateEstadoPieza
} from '@/actions/taller'
import { ProductionKpiCard } from './ProductionKpiCard'
import { ProductionRow } from './ProductionRow'

type ModoVista = 'COLA' | 'MODELO' | 'COLOR'
type OrdenPrioridad = 'LIFO_RECIENTES' | 'FIFO_ANTIGUOS' | 'ENTREGA_URGENTE' | 'MAYOR_CANTIDAD' | 'NOMBRE_AZ'
type FiltroEstado = 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'TODOS'

export function TallerClient({ data }: { data: TallerDataResponse }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modos de visualización y filtros
  const [modoVista, setModoVista] = useState<ModoVista>('COLA')
  const [orden, setOrden] = useState<OrdenPrioridad>('LIFO_RECIENTES')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODOS')
  const [filtroColor, setFiltroColor] = useState<string>('TODOS')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS')
  const [busqueda, setBusqueda] = useState('')

  // Estado expandido para tarjetas de modelos/colores
  const [modelosExpandidos, setModelosExpandidos] = useState<Record<string, boolean>>({})
  const [coloresExpandidos, setColoresExpandidos] = useState<Record<string, boolean>>({})

  const toggleModeloExpandido = (key: string) => {
    setModelosExpandidos(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleColorExpandido = (key: string) => {
    setColoresExpandidos(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Estado optimista local y loader individual para feedback instantáneo (<50ms)
  const [piezasOpt, setPiezasOpt] = useState<Record<string, 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'>>({})
  const [loadingPieceId, setLoadingPieceId] = useState<string | null>(null)

  // Reset de estado optimista al recibir nuevos datos del servidor
  useEffect(() => {
    setPiezasOpt({})
  }, [data])

  // Piezas con estado optimista integrado
  const todasPiezas = useMemo(() => {
    return data.piezas.map(p => {
      const opt = piezasOpt[p.id]
      return opt ? { ...p, estado: opt } : p
    })
  }, [data.piezas, piezasOpt])

  // Métricas dinámicas calculadas en tiempo real
  const metricasActivas = useMemo(() => {
    const pendientes = todasPiezas.filter(p => p.estado === 'PENDIENTE').reduce((sum, p) => sum + p.cantidad, 0)
    const enProduccion = todasPiezas.filter(p => p.estado === 'EN_PRODUCCION').reduce((sum, p) => sum + p.cantidad, 0)
    const listos = todasPiezas.filter(p => p.estado === 'LISTO_ENTREGA').reduce((sum, p) => sum + p.cantidad, 0)
    return {
      ...data.metricas,
      totalPiezasPendientes: pendientes,
      totalPiezasEnProduccion: enProduccion,
      totalPiezasListas: listos,
      totalPiezasActivas: pendientes + enProduccion + listos
    }
  }, [todasPiezas, data.metricas])

  // Lista única de categorías y colores para los filtros
  const listaCategorias = useMemo(() => {
    const cats = new Set<string>()
    todasPiezas.forEach(p => {
      if (p.lineaCategoria) cats.add(p.lineaCategoria)
    })
    return Array.from(cats).sort()
  }, [todasPiezas])

  const listaColores = useMemo(() => {
    const cols = new Map<string, { nombreColor: string; codigoHex: string }>()
    todasPiezas.forEach(p => {
      const key = p.nombreColor || 'Sin especificar'
      if (!cols.has(key)) {
        cols.set(key, { nombreColor: key, codigoHex: p.codigoHex || '#94A3B8' })
      }
    })
    return Array.from(cols.values()).sort((a, b) => a.nombreColor.localeCompare(b.nombreColor))
  }, [todasPiezas])

  // Filtrado y Ordenamiento Dinámico de Piezas
  const piezasProcesadas = useMemo(() => {
    let result = [...todasPiezas]

    // 1. Filtro de Búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim()
      result = result.filter(p => 
        p.nombreModelo.toLowerCase().includes(q) ||
        p.cliente.toLowerCase().includes(q) ||
        p.codigoRef.toLowerCase().includes(q) ||
        p.nombreColor.toLowerCase().includes(q) ||
        (p.personalizacion && p.personalizacion.toLowerCase().includes(q))
      )
    }

    // 2. Filtro por Estado
    if (filtroEstado !== 'TODOS') {
      result = result.filter(p => p.estado === filtroEstado)
    }

    // 3. Filtro por Color
    if (filtroColor !== 'TODOS') {
      result = result.filter(p => p.nombreColor === filtroColor)
    }

    // 4. Filtro por Categoría
    if (filtroCategoria !== 'TODOS') {
      result = result.filter(p => p.lineaCategoria === filtroCategoria)
    }

    // 5. Ordenamiento de Prioridad
    result.sort((a, b) => {
      if (orden === 'LIFO_RECIENTES') {
        return new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
      }
      if (orden === 'FIFO_ANTIGUOS') {
        return new Date(a.fechaSolicitud).getTime() - new Date(b.fechaSolicitud).getTime()
      }
      if (orden === 'ENTREGA_URGENTE') {
        if (!a.diaEntregaPrometida && !b.diaEntregaPrometida) {
          return new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
        }
        if (!a.diaEntregaPrometida) return 1
        if (!b.diaEntregaPrometida) return -1
        return new Date(a.diaEntregaPrometida).getTime() - new Date(b.diaEntregaPrometida).getTime()
      }
      if (orden === 'MAYOR_CANTIDAD') {
        return b.cantidad - a.cantidad
      }
      if (orden === 'NOMBRE_AZ') {
        return a.nombreModelo.localeCompare(b.nombreModelo)
      }
      return 0
    })

    return result
  }, [todasPiezas, busqueda, filtroEstado, filtroColor, filtroCategoria, orden])

  // Subgrupos de piezas por estado cuando se ve "TODOS"
  const piezasPendientes = useMemo(() => piezasProcesadas.filter(p => p.estado === 'PENDIENTE'), [piezasProcesadas])
  const piezasEnProduccion = useMemo(() => piezasProcesadas.filter(p => p.estado === 'EN_PRODUCCION'), [piezasProcesadas])
  const piezasListas = useMemo(() => piezasProcesadas.filter(p => p.estado === 'LISTO_ENTREGA'), [piezasProcesadas])

  // Recalcular Grupos por Modelo filtrados
  const gruposPorModeloFiltrados = useMemo(() => {
    const map = new Map<string, GrupoModeloTaller>()

    piezasProcesadas.forEach(p => {
      const key = p.productoId || p.nombreModelo
      if (!map.has(key)) {
        map.set(key, {
          productoId: p.productoId,
          nombreModelo: p.nombreModelo,
          lineaCategoria: p.lineaCategoria,
          pesoGramosUnitario: p.pesoGramosUnitario,
          totalUnidades: 0,
          totalGramos: 0,
          pendientes: 0,
          enProduccion: 0,
          listos: 0,
          colores: [],
          pedidos: []
        })
      }

      const grp = map.get(key)!
      grp.totalUnidades += p.cantidad
      grp.totalGramos = Number((grp.totalGramos + p.pesoGramosTotal).toFixed(1))

      if (p.estado === 'PENDIENTE') grp.pendientes += p.cantidad
      else if (p.estado === 'EN_PRODUCCION') grp.enProduccion += p.cantidad
      else if (p.estado === 'LISTO_ENTREGA') grp.listos += p.cantidad

      const colorKey = p.colorFilamentoId || p.nombreColor
      let colEntry = grp.colores.find(c => (c.colorId || c.nombreColor) === colorKey)
      if (!colEntry) {
        colEntry = {
          colorId: p.colorFilamentoId,
          nombreColor: p.nombreColor,
          codigoHex: p.codigoHex,
          tipoMaterial: p.tipoMaterial,
          cantidad: 0,
          gramos: 0,
          piezasIds: []
        }
        grp.colores.push(colEntry)
      }
      colEntry.cantidad += p.cantidad
      colEntry.gramos = Number((colEntry.gramos + p.pesoGramosTotal).toFixed(1))
      colEntry.piezasIds.push(p.id)

      grp.pedidos.push({
        piezaId: p.id,
        codigoRef: p.codigoRef,
        cliente: p.cliente,
        fechaSolicitud: p.fechaSolicitud,
        diaEntregaPrometida: p.diaEntregaPrometida,
        cantidad: p.cantidad,
        nombreColor: p.nombreColor,
        codigoHex: p.codigoHex,
        personalizacion: p.personalizacion,
        estado: p.estado
      })
    })

    return Array.from(map.values()).sort((a, b) => b.totalUnidades - a.totalUnidades)
  }, [piezasProcesadas])

  // Recalcular Grupos por Color filtrados
  const gruposPorColorFiltrados = useMemo(() => {
    const map = new Map<string, GrupoColorTaller>()

    piezasProcesadas.forEach(p => {
      const colorKey = p.colorFilamentoId || p.nombreColor
      if (!map.has(colorKey)) {
        const orig = data.gruposPorColor.find(g => (g.colorId || g.nombreColor) === colorKey)
        map.set(colorKey, {
          colorId: p.colorFilamentoId,
          nombreColor: p.nombreColor,
          codigoHex: p.codigoHex,
          tipoMaterial: p.tipoMaterial,
          stockGramosActual: orig?.stockGramosActual || 0,
          stockBobinasActual: orig?.stockBobinasActual || 0,
          alertaCritica: orig?.alertaCritica || false,
          totalUnidades: 0,
          totalGramosRequeridos: 0,
          deficitGramos: 0,
          modelos: []
        })
      }

      const cGrp = map.get(colorKey)!
      cGrp.totalUnidades += p.cantidad
      cGrp.totalGramosRequeridos = Number((cGrp.totalGramosRequeridos + p.pesoGramosTotal).toFixed(1))
      cGrp.deficitGramos = Number(Math.max(0, cGrp.totalGramosRequeridos - cGrp.stockGramosActual).toFixed(1))

      cGrp.modelos.push({
        productoId: p.productoId,
        nombreModelo: p.nombreModelo,
        cantidad: p.cantidad,
        gramos: p.pesoGramosTotal,
        cliente: p.cliente,
        codigoRef: p.codigoRef,
        estado: p.estado,
        personalizacion: p.personalizacion
      })
    })

    return Array.from(map.values()).sort((a, b) => b.totalUnidades - a.totalUnidades)
  }, [piezasProcesadas, data.gruposPorColor])

  // Acción instantánea con optimistic update para cambiar estado de la pieza individual
  const handleCambiarEstado = async (
    tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
    piezaId: string,
    nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'
  ) => {
    setPiezasOpt(prev => ({ ...prev, [piezaId]: nuevoEstado }))
    setLoadingPieceId(piezaId)

    try {
      const res = await updateEstadoPieza(tipoRegistro, piezaId, nuevoEstado)
      if (res.success) {
        if (nuevoEstado === 'EN_PRODUCCION') {
          toast.success('Pieza pasada a En Impresión')
        } else if (nuevoEstado === 'LISTO_ENTREGA') {
          toast.success('Pieza marcada como Lista para Entrega')
        } else if (nuevoEstado === 'ENTREGADO') {
          toast.success('Pedido marcado como Entregado')
        } else {
          toast.success('Pieza reabierta a Pendiente')
        }
        startTransition(() => {
          router.refresh()
        })
      } else {
        setPiezasOpt(prev => {
          const next = { ...prev }
          delete next[piezaId]
          return next
        })
        toast.error(res.error || 'Error al actualizar estado')
      }
    } catch (err: any) {
      setPiezasOpt(prev => {
        const next = { ...prev }
        delete next[piezaId]
        return next
      })
      toast.error(err.message || 'Error de conexión')
    } finally {
      setLoadingPieceId(null)
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Renderizador de Tabla Estructurada de Piezas con CERO SCROLL HORIZONTAL
  const renderTablaDePiezas = (
    piezasLista: PiezaTaller[],
    titulo: string,
    subtitulo: string,
    badgeCount: number
  ) => {
    if (piezasLista.length === 0) return null

    const totalUds = piezasLista.reduce((acc, p) => acc + p.cantidad, 0)
    const totalGramos = piezasLista.reduce((acc, p) => acc + p.pesoGramosTotal, 0).toFixed(1)

    return (
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {/* Cabecera de Sección */}
        <div className="p-3.5 sm:p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">
                {titulo}
              </h2>
              <span className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full border border-border">
                {badgeCount}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {subtitulo}
            </p>
          </div>

          <div className="text-xs text-muted-foreground font-medium self-end sm:self-auto">
            <span className="font-semibold text-foreground">
              {totalUds} {totalUds === 1 ? 'unidad' : 'unidades'}
            </span>
            <span className="mx-1.5">•</span>
            <span>{totalGramos}g estimados</span>
          </div>
        </div>

        {/* Tabla Fixed w-full (Cero scroll horizontal) */}
        <div className="w-full overflow-hidden">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[36%] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Pieza & Especificación Técnica
                </TableHead>
                <TableHead className="w-[20%] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Cliente & Referencia
                </TableHead>
                <TableHead className="w-[16%] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Entrega & Antigüedad
                </TableHead>
                <TableHead className="w-[14%] px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="w-[14%] px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Acción Operativa
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {piezasLista.map((pieza) => (
                <ProductionRow
                  key={pieza.id}
                  pieza={pieza}
                  isLoading={loadingPieceId === pieza.id}
                  onCambiarEstado={handleCambiarEstado}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Taller de Producción 3D
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cola de fabricación por tablas, piezas por modelo y priorización por entrega.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isPending}
            className="rounded-xl border-border bg-card text-foreground hover:bg-muted text-xs h-9 px-3 cursor-pointer shadow-xs gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isPending ? 'animate-spin text-primary' : ''}`} />
            <span>Actualizar</span>
          </Button>

          <Link href="/pedidos">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-muted-foreground hover:text-foreground text-xs h-9 px-3 cursor-pointer gap-1.5 transition-all"
            >
              <span>Ver Pedidos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TARJETAS KPI COMPACTAS Y UNIFORMES (4 EN CUADRÍCULA SIMÉTRICA)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <ProductionKpiCard
          label="Total por Fabricar"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{data.metricas.totalPiezasActivas}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">uds</span>
            </span>
          }
          sublabel={
            <div className="flex items-center gap-1.5">
              <span>{data.metricas.totalPiezasPendientes} pend.</span>
              <span>•</span>
              <span>{data.metricas.totalPiezasEnProduccion} en cama</span>
            </div>
          }
          icon={<Boxes className="w-3.5 h-3.5" />}
        />

        <ProductionKpiCard
          label="Modelos Distintos"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{data.metricas.totalModelosUnicos}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">diseños</span>
            </span>
          }
          sublabel="Agrupados por tandas"
          icon={<Layers className="w-3.5 h-3.5" />}
        />

        <ProductionKpiCard
          label="Material Requerido"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{data.metricas.totalGramosRequeridos}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">g</span>
            </span>
          }
          sublabel={`En ${data.metricas.totalColoresRequeridos} ${
            data.metricas.totalColoresRequeridos === 1 ? 'color de bobina' : 'colores de bobina'
          }`}
          icon={<Palette className="w-3.5 h-3.5" />}
        />

        <ProductionKpiCard
          label="Entregas Críticas"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{data.metricas.entregasUrgentes}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">urgentes</span>
            </span>
          }
          isDestructive={data.metricas.entregasUrgentes > 0}
          sublabel={data.metricas.entregasUrgentes > 0 ? 'Priorizar hoy' : 'Sin pedidos vencidos'}
          icon={<Clock className="w-3.5 h-3.5" />}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTROS Y BÚSQUEDA (TOOLBAR SIMÉTRICA)                                 */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-xl p-1.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5 shadow-xs">
        {/* Segmented Control de Estados a la izquierda (shrink-0 para evitar colapso de pestañas) */}
        <div className="bg-muted/60 p-0.5 rounded-lg flex items-center gap-0.5 shrink-0 overflow-x-auto max-w-full">
          {[
            { id: 'PENDIENTE', label: 'Pendientes', count: metricasActivas.totalPiezasPendientes },
            { id: 'EN_PRODUCCION', label: 'En Impresión', count: metricasActivas.totalPiezasEnProduccion },
            { id: 'LISTO_ENTREGA', label: 'Listos', count: metricasActivas.totalPiezasListas },
            { id: 'TODOS', label: 'Todos', count: metricasActivas.totalPiezasActivas }
          ].map((st) => {
            const isSelected = filtroEstado === st.id
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setFiltroEstado(st.id as FiltroEstado)}
                className={`flex items-center gap-1.5 text-xs py-1 transition-all cursor-pointer whitespace-nowrap rounded-md shrink-0 ${
                  isSelected
                    ? 'bg-card text-foreground font-semibold px-3 shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground px-2.5 transition-colors'
                }`}
              >
                <span>{st.label}</span>
                <span className="font-mono text-[10px] opacity-75">({st.count})</span>
              </button>
            )
          })}
        </div>

        {/* Lado Derecho: Buscador Integrado */}
        <div className="relative w-full sm:w-72 md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar pieza..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-8 text-xs bg-background border-input rounded-lg pl-8 pr-3 w-full focus-visible:ring-1 focus-visible:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VISUALIZACIÓN DE DATOS (COLA DE PRODUCCIÓN O VISTAS AGRUPADAS)          */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA 1: COLA DE PRODUCCIÓN EN TABLA                                      */}
      {/* ------------------------------------------------------------------------- */}
      {modoVista === 'COLA' && (
        <div className="space-y-4">
          {piezasProcesadas.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-muted text-muted-foreground/40 flex items-center justify-center mx-auto mb-3 border border-border">
                <Boxes className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">
                {filtroEstado === 'PENDIENTE'
                  ? 'No hay piezas pendientes de fabricar'
                  : filtroEstado === 'EN_PRODUCCION'
                  ? 'No hay piezas en impresión en este momento'
                  : filtroEstado === 'LISTO_ENTREGA'
                  ? 'No hay piezas listas para entrega'
                  : 'Taller al día'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {filtroEstado === 'PENDIENTE'
                  ? 'Todas las piezas solicitadas ya están en impresión o listas para entrega.'
                  : 'No hay piezas con los filtros activos actualmente.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {filtroEstado !== 'TODOS' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFiltroEstado('TODOS')
                      setBusqueda('')
                      setFiltroColor('TODOS')
                      setFiltroCategoria('TODOS')
                    }}
                    className="rounded-lg border-border bg-card text-foreground hover:bg-muted text-xs font-medium cursor-pointer h-8"
                  >
                    <span>Revisar la cola completa</span>
                  </Button>
                )}
              </div>
            </div>
          ) : filtroEstado === 'TODOS' ? (
            <div className="space-y-4">
              {/* Tabla 1: Pendientes */}
              {renderTablaDePiezas(
                piezasPendientes,
                'Piezas Pendientes',
                'Piezas en cola esperando asignación de cama de impresión.',
                piezasPendientes.length
              )}

              {/* Tabla 2: En Impresión */}
              {renderTablaDePiezas(
                piezasEnProduccion,
                'Piezas en Impresión',
                'Piezas actualmente en proceso activo de impresión 3D en taller.',
                piezasEnProduccion.length
              )}

              {/* Tabla 3: Listos */}
              {renderTablaDePiezas(
                piezasListas,
                'Piezas Listas para Entrega',
                'Piezas impresas y verificadas listas para despacho o recojo.',
                piezasListas.length
              )}
            </div>
          ) : (
            <div>
              {renderTablaDePiezas(
                piezasProcesadas,
                filtroEstado === 'PENDIENTE'
                  ? 'Piezas Pendientes'
                  : filtroEstado === 'EN_PRODUCCION'
                  ? 'Piezas en Impresión'
                  : 'Piezas Listas para Entrega',
                filtroEstado === 'PENDIENTE'
                  ? 'Listado ordenado de piezas que requieren fabricación en taller.'
                  : filtroEstado === 'EN_PRODUCCION'
                  ? 'Piezas en proceso activo de impresión 3D.'
                  : 'Piezas terminadas listas para entrega al cliente.',
                piezasProcesadas.length
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA 2: AGRUPACIÓN POR MODELO                                            */}
      {/* ------------------------------------------------------------------------- */}
      {modoVista === 'MODELO' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {gruposPorModeloFiltrados.length} modelos consolidados para producción
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {gruposPorModeloFiltrados.map((modelo) => {
              const expandido = modelosExpandidos[modelo.productoId || modelo.nombreModelo] || false
              const pctListo = modelo.totalUnidades > 0 ? ((modelo.listos / modelo.totalUnidades) * 100).toFixed(0) : '0'

              return (
                <Card
                  key={modelo.productoId || modelo.nombreModelo}
                  className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-bold text-foreground">
                            {modelo.nombreModelo}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] font-medium border-border text-muted-foreground">
                            {modelo.lineaCategoria}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                          Peso aprox: {modelo.pesoGramosUnitario}g/u • Total: {modelo.totalGramos}g
                        </CardDescription>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xl font-bold text-foreground font-mono tabular-nums block">
                          {modelo.totalUnidades}
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          unidades
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progreso de Fabricación */}
                    <div className="space-y-1 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                        <span>Progreso: {pctListo}% listo</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span>{modelo.pendientes} pend.</span>
                          <span>•</span>
                          <span>{modelo.enProduccion} imprimiendo</span>
                          <span>•</span>
                          <span>{modelo.listos} listos</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex border border-border/50">
                        <div style={{ width: `${(modelo.listos / modelo.totalUnidades) * 100}%` }} className="bg-accent-foreground transition-all" />
                        <div style={{ width: `${(modelo.enProduccion / modelo.totalUnidades) * 100}%` }} className="bg-primary transition-all" />
                        <div style={{ width: `${(modelo.pendientes / modelo.totalUnidades) * 100}%` }} className="bg-muted-foreground/40 transition-all" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3">
                    {/* Desglose de Colores Requeridos */}
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Colores a Imprimir:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {modelo.colores.map((col, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium bg-muted/40 border border-border text-foreground"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                              style={{ backgroundColor: col.codigoHex }}
                            />
                            <span>{col.cantidad}× {col.nombreColor}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">({col.gramos}g)</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Desplegable de Pedidos Asociados */}
                    <div className="pt-2 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => toggleModeloExpandido(modelo.productoId || modelo.nombreModelo)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer py-1 transition-colors"
                      >
                        <span>Ver {modelo.pedidos.length} pedidos individuales ({modelo.totalUnidades} piezas)</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`} />
                      </button>

                      {expandido && (
                        <div className="space-y-1.5 mt-2 pt-2 border-t border-border/40 text-xs animate-in fade-in duration-150">
                          {modelo.pedidos.map((ped, pIdx) => (
                            <div key={pIdx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/60">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-foreground">{ped.cliente}</span>
                                  <span className="text-[10px] font-mono text-muted-foreground">({ped.codigoRef})</span>
                                  <span className="text-[10px] text-muted-foreground">• {ped.cantidad} ud(s)</span>
                                </div>
                                {ped.personalizacion && (
                                  <p className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-500 font-medium">
                                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                                    {ped.personalizacion}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ped.codigoHex }} />
                                  {ped.nombreColor}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA 3: AGRUPACIÓN POR COLOR (OPTIMIZACIÓN DE BOBINAS)                   */}
      {/* ------------------------------------------------------------------------- */}
      {modoVista === 'COLOR' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {gruposPorColorFiltrados.length} colores requeridos en producción
            </span>
            <span className="text-xs text-muted-foreground">
              Agrupa impresiones por bobina para optimizar cambios de filamento
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {gruposPorColorFiltrados.map((grupo) => {
              const expandido = coloresExpandidos[grupo.colorId || grupo.nombreColor] || false
              const faltaStock = grupo.deficitGramos > 0

              return (
                <Card
                  key={grupo.colorId || grupo.nombreColor}
                  className={`bg-card border rounded-xl shadow-xs overflow-hidden flex flex-col justify-between ${
                    faltaStock ? 'border-destructive/40 ring-1 ring-destructive/20' : 'border-border'
                  }`}
                >
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg border border-black/15 shadow-xs flex items-center justify-center shrink-0"
                          style={{ backgroundColor: grupo.codigoHex }}
                        />
                        <div>
                          <CardTitle className="text-sm font-bold text-foreground">
                            {grupo.nombreColor}
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground">
                            Material: {grupo.tipoMaterial} • Stock: {grupo.stockGramosActual}g ({grupo.stockBobinasActual} bobinas)
                          </CardDescription>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-bold text-foreground font-mono tabular-nums block">
                          {grupo.totalUnidades} uds
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {grupo.totalGramosRequeridos}g req.
                        </span>
                      </div>
                    </div>

                    {/* Alerta de Stock insuficiente si aplica */}
                    {faltaStock && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium mt-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Faltan {grupo.deficitGramos}g para completar todas las piezas.</span>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3">
                    {/* Lista de Modelos que usan este color */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Piezas que usan este color:
                      </span>

                      <div className="space-y-1">
                        {grupo.modelos.slice(0, expandido ? undefined : 3).map((mod, mIdx) => (
                          <div key={mIdx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 border border-border/40">
                            <span className="font-medium text-foreground truncate pr-2">
                              {mod.cantidad}× {mod.nombreModelo}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {mod.gramos}g
                              </span>
                              <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-border text-muted-foreground">
                                {mod.codigoRef}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      {grupo.modelos.length > 3 && (
                        <button
                          type="button"
                          onClick={() => toggleColorExpandido(grupo.colorId || grupo.nombreColor)}
                          className="text-xs font-medium text-primary hover:underline cursor-pointer pt-1 block"
                        >
                          {expandido ? 'Mostrar menos' : `+ Ver ${grupo.modelos.length - 3} piezas más`}
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
