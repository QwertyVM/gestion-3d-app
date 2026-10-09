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
  RotateCcw,
  CheckCircle2
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
import { ProductionQueueView } from './ProductionQueueView'
import { ProductionByColorView } from './ProductionByColorView'

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

  // Métricas dinámicas calculadas en tiempo real para el ciclo operativo de taller
  const metricasActivas = useMemo(() => {
    const pendientes = todasPiezas.filter(p => p.estado === 'PENDIENTE').reduce((sum, p) => sum + p.cantidad, 0)
    const enProduccion = todasPiezas.filter(p => p.estado === 'EN_PRODUCCION').reduce((sum, p) => sum + p.cantidad, 0)
    const listos = todasPiezas.filter(p => p.estado === 'LISTO_ENTREGA').reduce((sum, p) => sum + p.cantidad, 0)

    // Piezas por fabricar / en proceso en taller
    const piezasTaller = todasPiezas.filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_PRODUCCION')

    // Modelos distintos de las piezas activas a fabricar
    const modelosSet = new Set<string>()
    piezasTaller.forEach(p => modelosSet.add(p.productoId || p.nombreModelo))
    const totalModelosDistintos = modelosSet.size > 0 ? modelosSet.size : data.metricas.totalModelosUnicos

    // Colores distintos asignados a la tanda activa
    const coloresMap = new Map<string, { nombreColor: string; codigoHex: string }>()
    piezasTaller.forEach(p => {
      if (p.colores && p.colores.length > 0) {
        p.colores.forEach(c => {
          const key = c.nombreColor || c.id
          if (!coloresMap.has(key)) coloresMap.set(key, { nombreColor: c.nombreColor, codigoHex: c.codigoHex })
        })
      } else if (p.nombreColor) {
        if (!coloresMap.has(p.nombreColor)) {
          coloresMap.set(p.nombreColor, { nombreColor: p.nombreColor, codigoHex: p.codigoHex || '#94A3B8' })
        }
      }
    })
    const coloresList = Array.from(coloresMap.values())
    const totalColoresAsignados = coloresList.length > 0 ? coloresList.length : data.metricas.totalColoresRequeridos

    return {
      ...data.metricas,
      totalPiezasPendientes: pendientes,
      totalPiezasEnProduccion: enProduccion,
      totalPiezasListas: listos,
      totalPiezasActivas: pendientes + enProduccion + listos,
      totalModelosDistintos,
      totalColoresAsignados,
      coloresPreview: coloresList.slice(0, 4)
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

  // Recalcular Grupos por Color filtrados con clave normalizada alfabéticamente
  const gruposPorColorFiltrados = useMemo(() => {
    const map = new Map<string, GrupoColorTaller>()

    piezasProcesadas.forEach(p => {
      // Normalizar lista de colores ordenados alfabéticamente
      const sortedColores = (p.colores && p.colores.length > 0)
        ? [...p.colores].sort((a, b) => a.nombreColor.localeCompare(b.nombreColor))
        : (p.nombreColor ? p.nombreColor.split(' + ').map(s => s.trim()).sort().map(name => ({
            id: p.colorFilamentoId || undefined,
            nombreColor: name,
            codigoHex: p.codigoHex || '#94A3B8',
            tipoMaterial: p.tipoMaterial || 'PLA'
          })) : [])

      const normalizedColorKey = sortedColores.length > 0
        ? sortedColores.map(c => c.nombreColor.trim().toLowerCase()).join(' + ')
        : (p.nombreColor || 'sin-especificar').toLowerCase()

      const displayTitle = sortedColores.length > 0
        ? sortedColores.map(c => c.nombreColor).join(' + ')
        : (p.nombreColor || 'Sin especificar')

      if (!map.has(normalizedColorKey)) {
        const orig = data.gruposPorColor.find(g => {
          const gKey = (g.colores && g.colores.length > 0)
            ? g.colores.map(c => c.nombreColor.trim().toLowerCase()).sort().join(' + ')
            : (g.nombreColor || '').split(' + ').map(s => s.trim().toLowerCase()).sort().join(' + ')
          return gKey === normalizedColorKey || (g.colorId && g.colorId === p.colorFilamentoId)
        })

        const stockBobinas = orig?.stockBobinasActual || (p.colorFilamentoId ? 1 : sortedColores.length)

        map.set(normalizedColorKey, {
          colorId: p.colorFilamentoId,
          nombreColor: displayTitle,
          codigoHex: p.codigoHex,
          tipoMaterial: p.tipoMaterial,
          colores: sortedColores,
          stockGramosActual: orig?.stockGramosActual || 0,
          stockBobinasActual: stockBobinas,
          alertaCritica: orig?.alertaCritica || false,
          totalUnidades: 0,
          totalGramosRequeridos: 0,
          deficitGramos: 0,
          modelos: []
        })
      }

      const cGrp = map.get(normalizedColorKey)!
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
        personalizacion: p.personalizacion,
        canalVenta: p.canalVenta
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
      {/* 2. CICLO OPERATIVO DE TALLER: 4 KPIS EN CUADRÍCULA BALANCEADA              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* KPI 1 - POR FABRICAR */}
        <ProductionKpiCard
          label="POR FABRICAR"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{metricasActivas.totalPiezasPendientes}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">
                {metricasActivas.totalPiezasPendientes === 1 ? 'pza' : 'uds'}
              </span>
            </span>
          }
          sublabel={
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>En espera de impresión</span>
            </div>
          }
          icon={<Clock className="w-4 h-4 text-primary/70" />}
        />

        {/* KPI 2 - MODELOS DISTINTOS */}
        <ProductionKpiCard
          label="MODELOS DISTINTOS"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{metricasActivas.totalModelosDistintos}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">
                {metricasActivas.totalModelosDistintos === 1 ? 'diseño' : 'diseños'}
              </span>
            </span>
          }
          sublabel={
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>Agrupados para lote</span>
            </div>
          }
          icon={<Layers className="w-4 h-4 text-primary/70" />}
        />

        {/* KPI 3 (Nuevo) - COLORES ASIGNADOS */}
        <ProductionKpiCard
          label="COLORES ASIGNADOS"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{metricasActivas.totalColoresAsignados}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">
                {metricasActivas.totalColoresAsignados === 1 ? 'color' : 'colores'}
              </span>
            </span>
          }
          sublabel={
            <div className="flex items-center gap-1.5 min-w-0">
              <Palette className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">Carretes requeridos</span>
              {metricasActivas.coloresPreview.length > 0 && (
                <div className="flex items-center -space-x-1 ml-1 shrink-0">
                  {metricasActivas.coloresPreview.slice(0, 3).map((col, idx) => (
                    <span
                      key={idx}
                      className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-2xs inline-block shrink-0"
                      style={{ backgroundColor: col.codigoHex }}
                      title={col.nombreColor}
                    />
                  ))}
                </div>
              )}
            </div>
          }
          icon={<Palette className="w-4 h-4 text-primary/70" />}
        />

        {/* KPI 4 (Nuevo) - LISTAS PARA DESPACHO */}
        <ProductionKpiCard
          label="LISTAS PARA DESPACHO"
          className="p-4.5 pr-5"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{metricasActivas.totalPiezasListas}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">
                {metricasActivas.totalPiezasListas === 1 ? 'pieza lista' : 'piezas listas'}
              </span>
            </span>
          }
          sublabel={
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">Listas para empaque o recojo</span>
            </div>
          }
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. SELECTOR DE MODO DE VISTA Y CONTROLES                                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="bg-card border border-border rounded-xl p-1 flex items-center gap-1 shadow-2xs self-start overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setModoVista('COLA')}
            className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              modoVista === 'COLA'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cola de Producción</span>
            <span className="font-mono text-[10px] opacity-80">({metricasActivas.totalPiezasActivas})</span>
          </button>
          <button
            type="button"
            onClick={() => setModoVista('MODELO')}
            className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              modoVista === 'MODELO'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Por Modelo ({gruposPorModeloFiltrados.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setModoVista('COLOR')}
            className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              modoVista === 'COLOR'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Por Color ({gruposPorColorFiltrados.length})</span>
          </button>
        </div>

        {/* Buscador secundario para vista por modelo / color */}
        {modoVista !== 'COLA' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar en vista agrupada..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-9 text-xs bg-card border-input rounded-xl pl-8 pr-3 w-full focus-visible:ring-1 focus-visible:ring-primary text-foreground placeholder:text-muted-foreground shadow-2xs"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. VISUALIZACIÓN DE DATOS (COLA DE PRODUCCIÓN O VISTAS AGRUPADAS)          */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA 1: COLA DE PRODUCCIÓN ELEVADA (ProductionQueueView)                 */}
      {/* ------------------------------------------------------------------------- */}
      {modoVista === 'COLA' && (
        <ProductionQueueView
          piezas={todasPiezas}
          loadingPieceId={loadingPieceId}
          onCambiarEstado={handleCambiarEstado}
          metricasActivas={metricasActivas}
        />
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
        <ProductionByColorView
          grupos={gruposPorColorFiltrados}
          coloresExpandidos={coloresExpandidos}
          onToggleExpandido={toggleColorExpandido}
        />
      )}
    </div>
  )
}

// Aliases para máxima compatibilidad con las especificaciones de arquitectura
export { TallerClient as ProductionDashboardView, TallerClient as TallerProduccionPage }
