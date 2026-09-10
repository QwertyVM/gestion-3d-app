'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Hammer, 
  Package, 
  Palette, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Layers, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  User, 
  Sparkles, 
  RefreshCw, 
  ChevronDown, 
  Check, 
  Boxes,
  ExternalLink,
  Flame,
  Table as TableIcon
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
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  TallerDataResponse, 
  PiezaTaller, 
  GrupoModeloTaller, 
  GrupoColorTaller, 
  updateEstadoPieza 
} from '@/actions/taller'
import { formatDate } from '@/lib/utils'

type ModoVista = 'COLA' | 'MODELO' | 'COLOR'
type OrdenPrioridad = 'LIFO_RECIENTES' | 'FIFO_ANTIGUOS' | 'ENTREGA_URGENTE' | 'MAYOR_CANTIDAD' | 'NOMBRE_AZ'
type FiltroEstado = 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'TODOS'

// Helper para extraer la fecha calendario YYYY-MM-DD local y evitar desfases de zona horaria UTC
const extractCalendarDate = (raw: string | Date | null | undefined): { year: number; month: number; day: number } | null => {
  if (!raw) return null
  if (typeof raw === 'string') {
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1, // 0-indexed
        day: parseInt(match[3], 10)
      }
    }
  }
  const d = typeof raw === 'string' ? new Date(raw) : raw
  if (isNaN(d.getTime())) return null
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate()
  }
}

// Helper para calcular días transcurridos o días restantes
const getTiempoTranscurrido = (rawFecha: string) => {
  try {
    const dateParts = extractCalendarDate(rawFecha)
    if (!dateParts) return ''

    const hoy = new Date()
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()
    const fechaMidnight = new Date(dateParts.year, dateParts.month, dateParts.day).getTime()

    const diffDays = Math.round((hoyMidnight - fechaMidnight) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays === -1) return 'Mañana'
    if (diffDays > 1) return `Hace ${diffDays} días`
    if (diffDays < -1) return `En ${Math.abs(diffDays)} días`
    return ''
  } catch {
    return ''
  }
}

const getEntregaBadge = (diaPromesa: string | null) => {
  if (!diaPromesa) return <span className="text-[11px] text-[#A89F91]">Sin fecha</span>
  try {
    const dateParts = extractCalendarDate(diaPromesa)
    if (!dateParts) return <span className="text-[11px] text-[#75695D]">📅 {diaPromesa}</span>

    const hoy = new Date()
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()
    const promesaMidnight = new Date(dateParts.year, dateParts.month, dateParts.day).getTime()

    const diffDias = Math.round((promesaMidnight - hoyMidnight) / (1000 * 60 * 60 * 24))

    if (diffDias < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] whitespace-nowrap">
          <Flame className="w-3 h-3 text-[#DC2626]" /> Vencido ({Math.abs(diffDias)}d)
        </span>
      )
    }
    if (diffDias === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] animate-pulse whitespace-nowrap">
          <Flame className="w-3 h-3 text-[#D97706]" /> Entrega Hoy
        </span>
      )
    }
    if (diffDias === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] whitespace-nowrap">
          Mañana
        </span>
      )
    }
    if (diffDias <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] whitespace-nowrap">
          En {diffDias} días
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F1ECE4] text-[#75695D] border border-[#E2D9CC] whitespace-nowrap">
        {formatDate(diaPromesa)}
      </span>
    )
  } catch {
    return <span className="text-[11px] text-[#75695D]">📅 {diaPromesa}</span>
  }
}

export function TallerClient({ data }: { data: TallerDataResponse }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modos de visualización y filtros
  const [modoVista, setModoVista] = useState<ModoVista>('COLA')
  const [orden, setOrden] = useState<OrdenPrioridad>('LIFO_RECIENTES')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('PENDIENTE')
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

  // Lista única de categorías y colores para los filtros
  const listaCategorias = useMemo(() => {
    const cats = new Set<string>()
    data.piezas.forEach(p => {
      if (p.lineaCategoria) cats.add(p.lineaCategoria)
    })
    return Array.from(cats).sort()
  }, [data.piezas])

  const listaColores = useMemo(() => {
    const cols = new Map<string, { nombreColor: string; codigoHex: string }>()
    data.piezas.forEach(p => {
      const key = p.nombreColor || 'Sin especificar'
      if (!cols.has(key)) {
        cols.set(key, { nombreColor: key, codigoHex: p.codigoHex || '#94A3B8' })
      }
    })
    return Array.from(cols.values()).sort((a, b) => a.nombreColor.localeCompare(b.nombreColor))
  }, [data.piezas])

  // Filtrado y Ordenamiento Dinámico de Piezas
  const piezasProcesadas = useMemo(() => {
    let result = [...data.piezas]

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
        // Más recientes primero
        return new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
      }
      if (orden === 'FIFO_ANTIGUOS') {
        // Más antiguos primero (Mayor prioridad / Cola FIFO)
        return new Date(a.fechaSolicitud).getTime() - new Date(b.fechaSolicitud).getTime()
      }
      if (orden === 'ENTREGA_URGENTE') {
        // Con fecha de entrega primero, más próxima
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
  }, [data.piezas, busqueda, filtroEstado, filtroColor, filtroCategoria, orden])

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

  // Acción para cambiar estado
  const handleCambiarEstado = async (
    tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
    registroId: string,
    nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'
  ) => {
    startTransition(async () => {
      const res = await updateEstadoPieza(tipoRegistro, registroId, nuevoEstado)
      if (res.success) {
        if (nuevoEstado === 'EN_PRODUCCION') {
          toast.success('🖨️ Pieza y pedido pasados a EN IMPRESIÓN (reflejado en Ventas)')
        } else if (nuevoEstado === 'LISTO_ENTREGA') {
          toast.success('✅ Pieza marcada como LISTA PARA ENTREGA (reflejado en Ventas)')
        } else if (nuevoEstado === 'ENTREGADO') {
          toast.success('🎉 Pedido marcado como ENTREGADO')
        } else {
          toast.success('⏳ Pieza reabierta a PENDIENTE')
        }
        router.refresh()
      } else {
        toast.error(res.error || 'Error al actualizar estado')
      }
    })
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Renderizador de Tabla Estructurada de Piezas
  const renderTablaDePiezas = (
    piezasLista: PiezaTaller[], 
    titulo?: string, 
    subtitulo?: string,
    badgeInfo?: React.ReactNode,
    colorBorde: string = 'border-[#E2D9CC]'
  ) => {
    if (piezasLista.length === 0) return null

    const totalUds = piezasLista.reduce((acc, p) => acc + p.cantidad, 0)
    const totalGramos = piezasLista.reduce((acc, p) => acc + p.pesoGramosTotal, 0).toFixed(1)

    return (
      <Card className={`bg-[#FFFFFF] ${colorBorde} rounded-3xl shadow-xs overflow-hidden`}>
        {titulo && (
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-[#E2D9CC]/60 bg-[#FAF8F5]/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <CardTitle className="text-base font-black text-[#241C15]">
                  {titulo}
                </CardTitle>
                {badgeInfo}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#75695D] font-mono">
                <span className="font-bold text-[#241C15]">{totalUds} unidades</span>
                <span>•</span>
                <span>{totalGramos}g estimados</span>
              </div>
            </div>
            {subtitulo && (
              <CardDescription className="text-xs text-[#75695D] mt-0.5">
                {subtitulo}
              </CardDescription>
            )}
          </CardHeader>
        )}

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-[#FAF8F5] border-b border-[#E2D9CC]">
                <TableRow className="hover:bg-transparent border-b border-[#E2D9CC]">
                  <TableHead className="w-10 px-2 py-2.5 text-center text-xs font-bold text-[#75695D]">#</TableHead>
                  <TableHead className="px-3 py-2.5 text-xs font-bold text-[#75695D]">Pieza / Modelo</TableHead>
                  <TableHead className="px-3 py-2.5 text-xs font-bold text-[#75695D]">Color / Material</TableHead>
                  <TableHead className="w-14 px-2 py-2.5 text-center text-xs font-bold text-[#75695D]">Cant.</TableHead>
                  <TableHead className="w-20 px-2 py-2.5 text-right text-xs font-bold text-[#75695D]">Gramos</TableHead>
                  <TableHead className="px-3 py-2.5 text-xs font-bold text-[#75695D]">Cliente & Pedido</TableHead>
                  <TableHead className="w-24 px-2 py-2.5 text-center text-xs font-bold text-[#75695D]">Solicitado</TableHead>
                  <TableHead className="w-28 px-2 py-2.5 text-center text-xs font-bold text-[#75695D]">Entrega</TableHead>
                  <TableHead className="w-28 px-2 py-2.5 text-center text-xs font-bold text-[#75695D]">Estado</TableHead>
                  <TableHead className="w-24 px-3 py-2.5 text-right text-xs font-bold text-[#75695D] pr-4">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {piezasLista.map((pieza, idx) => {
                  const tiempoTxt = getTiempoTranscurrido(pieza.fechaSolicitud)
                  const esHoy = tiempoTxt === 'Hoy'
                  const esUrgente = pieza.diaEntregaPrometida && (() => {
                    try {
                      const d = new Date(pieza.diaEntregaPrometida)
                      const hoy = new Date()
                      return !isNaN(d.getTime()) && (d.getTime() - hoy.getTime()) < 2 * 24 * 60 * 60 * 1000
                    } catch { return false }
                  })()

                  return (
                    <TableRow 
                      key={pieza.id}
                      className={`hover:bg-[#FAF8F5]/80 transition-colors border-b border-[#E2D9CC]/50 ${
                        pieza.estado === 'EN_PRODUCCION' 
                          ? 'bg-[#DBEAFE]/10' 
                          : pieza.estado === 'LISTO_ENTREGA'
                          ? 'bg-[#EBF7EE]/10'
                          : esUrgente
                          ? 'bg-[#FEF2F2]/30'
                          : ''
                      }`}
                    >
                      {/* 1. Posición */}
                      <TableCell className="w-10 px-2 py-2 text-center font-mono font-bold text-xs text-[#75695D]">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs ${
                          idx < 3 && orden === 'FIFO_ANTIGUOS'
                            ? 'bg-[#A36F4C] text-white font-black shadow-2xs'
                            : 'bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D]'
                        }`}>
                          {idx + 1}
                        </span>
                      </TableCell>

                      {/* 2. Pieza / Modelo */}
                      <TableCell className="px-3 py-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-[#241C15]">
                              {pieza.nombreModelo}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-bold border-[#E2D9CC] text-[#75695D] bg-[#FAF8F5]">
                              {pieza.lineaCategoria}
                            </Badge>
                          </div>
                          {pieza.personalizacion && (
                            <div className="inline-flex items-center gap-1 text-[11px] text-[#854D0E] bg-[#FEF9C3]/70 px-2 py-0.2 rounded-lg border border-[#FDE047] font-semibold">
                              <Sparkles className="w-3 h-3 text-[#D97706] shrink-0" />
                              <span>{pieza.personalizacion}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 3. Color & Material */}
                      <TableCell className="px-3 py-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] text-xs font-bold text-[#241C15]">
                          <span 
                            className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs" 
                            style={{ backgroundColor: pieza.codigoHex }} 
                          />
                          <span>{pieza.nombreColor}</span>
                          <span className="text-[10px] text-[#75695D] font-mono font-normal">
                            ({pieza.tipoMaterial || 'PLA'})
                          </span>
                        </div>
                      </TableCell>

                      {/* 4. Cantidad */}
                      <TableCell className="w-14 px-2 py-2 text-center font-mono font-black text-sm text-[#241C15]">
                        <span className="px-2 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#E2D9CC]">
                          {pieza.cantidad}
                        </span>
                      </TableCell>

                      {/* 5. Gramos */}
                      <TableCell className="w-20 px-2 py-2 text-right font-mono text-xs text-[#241C15]">
                        <div><strong>{pieza.pesoGramosTotal}g</strong></div>
                        <div className="text-[10px] text-[#75695D] font-normal">({pieza.pesoGramosUnitario}g c/u)</div>
                      </TableCell>

                      {/* 6. Cliente & Pedido */}
                      <TableCell className="px-3 py-2">
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-[#241C15] flex items-center gap-1">
                            <User className="w-3 h-3 text-[#75695D]" />
                            <span>{pieza.cliente}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-mono font-bold text-[#A36F4C]">
                              {pieza.codigoRef}
                            </span>
                            {pieza.canalVenta && (
                              <span className="text-[10px] text-[#75695D] bg-[#FAF8F5] px-1.5 py-0.2 rounded border border-[#E2D9CC]/60">
                                {pieza.canalVenta}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 7. Fecha Solicitud con Fix de Calendario */}
                      <TableCell className="w-24 px-2 py-2 text-center">
                        <div className="space-y-0.5 text-xs text-[#75695D]">
                          <div className="font-semibold text-[#241C15]">
                            {formatDate(pieza.fechaSolicitud)}
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              esHoy 
                                ? 'bg-[#EBF7EE] text-[#1E5E3A] border border-[#B4E3C0]' 
                                : tiempoTxt === 'Ayer'
                                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]'
                                : 'bg-[#FAF8F5] text-[#75695D] border border-[#E2D9CC]'
                            }`}>
                              {tiempoTxt}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 8. Fecha Entrega */}
                      <TableCell className="w-28 px-2 py-2 text-center">
                        {getEntregaBadge(pieza.diaEntregaPrometida)}
                      </TableCell>

                      {/* 9. Estado Badge */}
                      <TableCell className="w-28 px-2 py-2 text-center">
                        {pieza.estado === 'PENDIENTE' && (
                          <Badge className="bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] font-bold text-xs px-2 py-0.5 whitespace-nowrap">
                            ⏳ Pendiente
                          </Badge>
                        )}
                        {pieza.estado === 'EN_PRODUCCION' && (
                          <Badge className="bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD] font-bold text-xs px-2 py-0.5 whitespace-nowrap animate-pulse">
                            🖨️ En Impresión
                          </Badge>
                        )}
                        {pieza.estado === 'LISTO_ENTREGA' && (
                          <Badge className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] font-bold text-xs px-2 py-0.5 whitespace-nowrap">
                            ✅ Listo
                          </Badge>
                        )}
                      </TableCell>

                      {/* 10. Acción Rápida */}
                      <TableCell className="w-24 px-3 py-2 text-right pr-4">
                        {pieza.estado === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleCambiarEstado(pieza.tipoRegistro, pieza.registroId, 'EN_PRODUCCION')}
                            className="h-7 px-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Imprimir</span>
                          </Button>
                        )}

                        {pieza.estado === 'EN_PRODUCCION' && (
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleCambiarEstado(pieza.tipoRegistro, pieza.registroId, 'LISTO_ENTREGA')}
                            className="h-7 px-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#16472C] text-white text-xs font-bold gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                          >
                            <Check className="w-3 h-3" />
                            <span>Listo</span>
                          </Button>
                        )}

                        {pieza.estado === 'LISTO_ENTREGA' && (
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleCambiarEstado(pieza.tipoRegistro, pieza.registroId, 'PENDIENTE')}
                            variant="outline"
                            className="h-7 px-2 rounded-xl border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                            title="Volver a poner pendiente"
                          >
                            ↩️ Reabrir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO PRINCIPAL Y REFRESH                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E2D9CC] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#A36F4C] text-white flex items-center justify-center shadow-sm shrink-0 border border-[#8E5E3E]/20">
            <Hammer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#241C15] tracking-tight">
                Taller de Producción 3D
              </h1>
              <Badge className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] font-mono text-xs px-2 py-0.5 font-bold">
                {data.metricas.totalPiezasActivas} piezas activas
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#75695D] mt-0.5">
              Cola de producción por tablas, piezas por modelo, consumo de filamento y priorización por pedido.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isPending}
            className="rounded-xl border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#FAF8F5] cursor-pointer h-9 px-3 text-xs font-bold gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isPending ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>

          <Link href="/pedidos">
            <Button
              size="sm"
              className="rounded-xl bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold h-9 px-3.5 text-xs shadow-sm gap-1.5 cursor-pointer"
            >
              <span>Ver Pedidos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TARJETAS DE MÉTRICAS OPERATIVAS DEL TALLER                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Piezas por Fabricar */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] rounded-2xl shadow-xs overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-[#75695D] uppercase tracking-wider">
                Total por Fabricar
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EFE5D8] flex items-center justify-center text-[#A36F4C]">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#241C15] font-mono tabular-nums">
                {data.metricas.totalPiezasActivas}
              </span>
              <span className="text-xs text-[#75695D] font-bold">uds</span>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E2D9CC]/50 text-[11px] font-semibold text-[#75695D]">
              <span className="text-[#854D0E] font-bold">{data.metricas.totalPiezasPendientes} pendientes</span>
              <span>•</span>
              <span className="text-[#1D4ED8] font-bold">{data.metricas.totalPiezasEnProduccion} en cama</span>
            </div>
          </CardContent>
        </Card>

        {/* Modelos Únicos en Cola */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] rounded-2xl shadow-xs overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-[#75695D] uppercase tracking-wider">
                Modelos Distintos
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EBF7EE] flex items-center justify-center text-[#1E5E3A]">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#1E5E3A] font-mono tabular-nums">
                {data.metricas.totalModelosUnicos}
              </span>
              <span className="text-xs text-[#75695D] font-bold">diseños</span>
            </div>
            <p className="text-[11px] text-[#75695D] mt-2 pt-2 border-t border-[#E2D9CC]/50 truncate">
              Agrupados para tandas eficientes
            </p>
          </CardContent>
        </Card>

        {/* Filamento Requerido Total */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] rounded-2xl shadow-xs overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-[#75695D] uppercase tracking-wider">
                Material Requerido
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FEF9C3] flex items-center justify-center text-[#854D0E]">
                <Palette className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#241C15] font-mono tabular-nums">
                {data.metricas.totalGramosRequeridos}
              </span>
              <span className="text-xs text-[#75695D] font-bold">g ({data.metricas.totalColoresRequeridos} colores)</span>
            </div>
            <p className="text-[11px] text-[#75695D] mt-2 pt-2 border-t border-[#E2D9CC]/50 truncate">
              Consumo estimado de filamento
            </p>
          </CardContent>
        </Card>

        {/* Entregas Próximas o Urgentes */}
        <Card className={`bg-[#FFFFFF] border-[#E2D9CC] rounded-2xl shadow-xs overflow-hidden ${data.metricas.entregasUrgentes > 0 ? 'ring-1 ring-[#FCA5A5]' : ''}`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-[#75695D] uppercase tracking-wider">
                Entregas Críticas
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${data.metricas.entregasUrgentes > 0 ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#FAF8F5] text-[#75695D]'}`}>
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${data.metricas.entregasUrgentes > 0 ? 'text-[#DC2626]' : 'text-[#241C15]'}`}>
                {data.metricas.entregasUrgentes}
              </span>
              <span className="text-xs text-[#75695D] font-bold">urgentes</span>
            </div>
            <p className="text-[11px] text-[#75695D] mt-2 pt-2 border-t border-[#E2D9CC]/50 truncate">
              {data.metricas.entregasUrgentes > 0 ? '⚠️ Priorizar en impresora hoy' : 'Sin pedidos vencidos'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE CONTROLES: VISTAS, ORDEN DE PRIORIDAD Y FILTROS                */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-3xl border border-[#E2D9CC] shadow-xs space-y-4">
        {/* Fila 1: Filtro de Estado Principal (Pills grandes y visibles) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2D9CC]/60">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            <span className="text-xs font-bold text-[#75695D] mr-1 hidden md:inline-flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#A36F4C]" /> Estado:
            </span>

            <button
              type="button"
              onClick={() => setFiltroEstado('PENDIENTE')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                filtroEstado === 'PENDIENTE'
                  ? 'bg-[#A36F4C] text-white shadow-xs'
                  : 'bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8]/40'
              }`}
            >
              <span>⏳ Solo Pendientes</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                filtroEstado === 'PENDIENTE' ? 'bg-white/20 text-white' : 'bg-[#EFE5D8] text-[#854D0E]'
              }`}>
                {data.metricas.totalPiezasPendientes}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado('EN_PRODUCCION')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                filtroEstado === 'EN_PRODUCCION'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8]/40'
              }`}
            >
              <span>🖨️ En Impresión</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                filtroEstado === 'EN_PRODUCCION' ? 'bg-white/20 text-white' : 'bg-[#DBEAFE] text-[#1D4ED8]'
              }`}>
                {data.metricas.totalPiezasEnProduccion}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado('LISTO_ENTREGA')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                filtroEstado === 'LISTO_ENTREGA'
                  ? 'bg-[#1E5E3A] text-white shadow-xs'
                  : 'bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8]/40'
              }`}
            >
              <span>✅ Listos</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                filtroEstado === 'LISTO_ENTREGA' ? 'bg-white/20 text-white' : 'bg-[#EBF7EE] text-[#1E5E3A]'
              }`}>
                {data.metricas.totalPiezasListas}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado('TODOS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                filtroEstado === 'TODOS'
                  ? 'bg-[#241C15] text-white shadow-xs'
                  : 'bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8]/40'
              }`}
            >
              <span>⚡ Todas (Separadas)</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                filtroEstado === 'TODOS' ? 'bg-white/20 text-white' : 'bg-[#E2D9CC]/60 text-[#75695D]'
              }`}>
                {data.metricas.totalPiezasActivas}
              </span>
            </button>
          </div>

          {/* Selector de Modo de Vista (Tabla vs Modelo vs Color) */}
          <div className="flex items-center bg-[#FAF8F5] p-1 rounded-2xl border border-[#E2D9CC] self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setModoVista('COLA')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                modoVista === 'COLA'
                  ? 'bg-[#A36F4C] text-white shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8]/50'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabla de Producción</span>
            </button>

            <button
              type="button"
              onClick={() => setModoVista('MODELO')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                modoVista === 'MODELO'
                  ? 'bg-[#A36F4C] text-white shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8]/50'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Por Modelo</span>
            </button>

            <button
              type="button"
              onClick={() => setModoVista('COLOR')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                modoVista === 'COLOR'
                  ? 'bg-[#A36F4C] text-white shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8]/50'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Por Color</span>
            </button>
          </div>
        </div>

        {/* Fila 2: Ordenamiento Rápido (Más recientes vs Más antiguos) y Filtros Secundarios */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Ordenamiento Switchers */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 max-w-full">
            <span className="text-xs font-bold text-[#75695D] whitespace-nowrap flex items-center gap-1 mr-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#A36F4C]" />
              Orden:
            </span>

            <button
              type="button"
              onClick={() => setOrden('LIFO_RECIENTES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                orden === 'LIFO_RECIENTES'
                  ? 'bg-[#EFE5D8] text-[#8E5E3E] border border-[#D4BEA7] shadow-2xs font-extrabold'
                  : 'bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              ✨ Más recientes
            </button>

            <button
              type="button"
              onClick={() => setOrden('FIFO_ANTIGUOS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                orden === 'FIFO_ANTIGUOS'
                  ? 'bg-[#EFE5D8] text-[#8E5E3E] border border-[#D4BEA7] shadow-2xs font-extrabold'
                  : 'bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              🕒 Más antiguos (FIFO)
            </button>

            <button
              type="button"
              onClick={() => setOrden('ENTREGA_URGENTE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                orden === 'ENTREGA_URGENTE'
                  ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] shadow-2xs font-extrabold'
                  : 'bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              🔥 Entrega urgente
            </button>
          </div>

          {/* Filtros Secundarios: Color, Categoría y Buscador */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 lg:max-w-xl">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#75695D]" />
              <Input
                type="text"
                placeholder="Buscar modelo, cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8.5 h-8.5 text-xs rounded-xl border-[#E2D9CC] bg-[#FAF8F5] text-[#241C15] placeholder:text-[#A89F91]"
              />
            </div>

            {/* Filtro por Color de Filamento */}
            <select
              value={filtroColor}
              onChange={(e) => setFiltroColor(e.target.value)}
              aria-label="Filtrar por color de filamento"
              className="bg-[#FAF8F5] border border-[#E2D9CC] text-[#241C15] text-xs rounded-xl px-2.5 h-8.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[#A36F4C] cursor-pointer"
            >
              <option value="TODOS">🎨 Todos los Colores</option>
              {listaColores.map((c) => (
                <option key={c.nombreColor} value={c.nombreColor}>
                  {c.nombreColor}
                </option>
              ))}
            </select>

            {/* Filtro por Categoría */}
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              aria-label="Filtrar por categoría de producto"
              className="bg-[#FAF8F5] border border-[#E2D9CC] text-[#241C15] text-xs rounded-xl px-2.5 h-8.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[#A36F4C] cursor-pointer"
            >
              <option value="TODOS">📂 Categorías</option>
              {listaCategorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VISTAS DE CONTENIDO EN TABLAS SEPARADAS                                 */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA 1: TABLAS DE PRODUCCIÓN (COLA Y SEPARACIÓN POR ESTADO)              */}
      {/* ------------------------------------------------------------------------- */}
      {modoVista === 'COLA' && (
        <div className="space-y-6">
          {piezasProcesadas.length === 0 ? (
            <Card className="bg-[#FFFFFF] border-[#E2D9CC] rounded-3xl p-10 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF7EE] text-[#1E5E3A] flex items-center justify-center mx-auto mb-3.5 border border-[#B4E3C0]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-black text-[#241C15] text-lg">
                {filtroEstado === 'PENDIENTE' ? '¡No hay piezas pendientes de fabricar!' : '¡Taller al día!'}
              </h3>
              <p className="text-xs sm:text-sm text-[#75695D] mt-1 max-w-md mx-auto">
                {filtroEstado === 'PENDIENTE'
                  ? 'Todas las piezas solicitadas ya están en impresión o listas para entrega.'
                  : 'No hay piezas con los filtros seleccionados actualmente.'}
              </p>
              {filtroEstado === 'PENDIENTE' && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  {data.metricas.totalPiezasEnProduccion > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFiltroEstado('EN_PRODUCCION')}
                      className="rounded-xl border-[#2563EB]/40 bg-[#DBEAFE]/40 text-[#1D4ED8] hover:bg-[#DBEAFE] text-xs font-bold gap-1.5 cursor-pointer"
                    >
                      <span>🖨️ Ver piezas En Impresión ({data.metricas.totalPiezasEnProduccion})</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFiltroEstado('TODOS')}
                    className="rounded-xl border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#FAF8F5] text-xs font-bold cursor-pointer"
                  >
                    <span>⚡ Ver Todas las Piezas</span>
                  </Button>
                </div>
              )}
            </Card>
          ) : filtroEstado === 'TODOS' ? (
            // Si está en TODOS, separamos claramente en 3 tablas por estado
            <div className="space-y-6">
              {/* Tabla 1: Pendientes */}
              {renderTablaDePiezas(
                piezasPendientes,
                '⏳ Piezas Pendientes de Impresión',
                'Piezas en cola esperando asignación de cama de impresión.',
                <Badge className="bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] font-bold text-xs">
                  {piezasPendientes.length} piezas
                </Badge>,
                'border-[#E8D49B]'
              )}

              {/* Tabla 2: En Impresión */}
              {renderTablaDePiezas(
                piezasEnProduccion,
                '🖨️ Piezas En Impresión',
                'Piezas actualmente en proceso de impresión 3D en taller.',
                <Badge className="bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD] font-bold text-xs">
                  {piezasEnProduccion.length} piezas
                </Badge>,
                'border-[#93C5FD]'
              )}

              {/* Tabla 3: Listos */}
              {renderTablaDePiezas(
                piezasListas,
                '✅ Piezas Listas para Entrega',
                'Piezas impresas y verificadas listas para despacho o recojo.',
                <Badge className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] font-bold text-xs">
                  {piezasListas.length} piezas
                </Badge>,
                'border-[#B4E3C0]'
              )}
            </div>
          ) : (
            // Vista filtrada individual (por ejemplo: Solo Pendientes)
            <div>
              {renderTablaDePiezas(
                piezasProcesadas,
                filtroEstado === 'PENDIENTE' 
                  ? '⏳ Tabla de Piezas Pendientes de Impresión' 
                  : filtroEstado === 'EN_PRODUCCION'
                  ? '🖨️ Tabla de Piezas En Impresión'
                  : '✅ Tabla de Piezas Listas para Entrega',
                filtroEstado === 'PENDIENTE'
                  ? 'Listado ordenado de piezas que requieren fabricación en taller.'
                  : filtroEstado === 'EN_PRODUCCION'
                  ? 'Piezas en proceso activo de impresión 3D.'
                  : 'Piezas terminadas listas para entrega al cliente.',
                <Badge className={`font-bold text-xs ${
                  filtroEstado === 'PENDIENTE'
                    ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]'
                    : filtroEstado === 'EN_PRODUCCION'
                    ? 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]'
                    : 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                }`}>
                  {piezasProcesadas.length} piezas
                </Badge>,
                filtroEstado === 'PENDIENTE'
                  ? 'border-[#E8D49B]'
                  : filtroEstado === 'EN_PRODUCCION'
                  ? 'border-[#93C5FD]'
                  : 'border-[#B4E3C0]'
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA 2: AGRUPACIÓN POR MODELO / PRODUCTO EN TABLAS                       */}
      {/* ------------------------------------------------------------------------- */}
      {modoVista === 'MODELO' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#75695D]">
              {gruposPorModeloFiltrados.length} modelos consolidados para producción
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gruposPorModeloFiltrados.map((modelo) => {
              const expandido = modelosExpandidos[modelo.productoId || modelo.nombreModelo] || false
              const pctListo = modelo.totalUnidades > 0 ? ((modelo.listos / modelo.totalUnidades) * 100).toFixed(0) : '0'

              return (
                <Card 
                  key={modelo.productoId || modelo.nombreModelo} 
                  className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-black text-[#241C15]">
                            {modelo.nombreModelo}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] font-bold border-[#E2D9CC] text-[#75695D]">
                            {modelo.lineaCategoria}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs text-[#75695D] mt-0.5">
                          Peso unitario aprox: {modelo.pesoGramosUnitario}g • Total: {modelo.totalGramos}g de filamento
                        </CardDescription>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-2xl font-black text-[#A36F4C] font-mono tabular-nums block">
                          {modelo.totalUnidades}
                        </span>
                        <span className="text-[10px] font-bold text-[#75695D] uppercase">unidades</span>
                      </div>
                    </div>

                    {/* Barra de Progreso de Fabricación */}
                    <div className="space-y-1 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#75695D]">
                        <span>Progreso: {pctListo}% listo</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-[#854D0E] font-bold">{modelo.pendientes} pend.</span>
                          <span className="text-[#2563EB] font-bold">{modelo.enProduccion} imprimiendo</span>
                          <span className="text-[#1E5E3A] font-bold">{modelo.listos} listos</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#FAF8F5] rounded-full overflow-hidden flex border border-[#E2D9CC]/50">
                        <div style={{ width: `${(modelo.listos / modelo.totalUnidades) * 100}%` }} className="bg-[#1E5E3A] transition-all" />
                        <div style={{ width: `${(modelo.enProduccion / modelo.totalUnidades) * 100}%` }} className="bg-[#3B82F6] transition-all" />
                        <div style={{ width: `${(modelo.pendientes / modelo.totalUnidades) * 100}%` }} className="bg-[#F59E0B] transition-all" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3">
                    {/* Desglose de Colores Requeridos para este modelo */}
                    <div>
                      <span className="text-[11px] font-bold text-[#75695D] uppercase tracking-wider block mb-1.5">
                        Colores a Imprimir:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {modelo.colores.map((col, cIdx) => (
                          <span 
                            key={cIdx} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FAF8F5] border border-[#E2D9CC] text-[#241C15]"
                          >
                            <span 
                              className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs" 
                              style={{ backgroundColor: col.codigoHex }} 
                            />
                            <span>{col.cantidad}x {col.nombreColor}</span>
                            <span className="text-[10px] text-[#75695D] font-mono">({col.gramos}g)</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Desplegable de Pedidos Asociados */}
                    <div className="pt-2 border-t border-[#E2D9CC]/60">
                      <button
                        type="button"
                        onClick={() => toggleModeloExpandido(modelo.productoId || modelo.nombreModelo)}
                        className="w-full flex items-center justify-between text-xs font-bold text-[#75695D] hover:text-[#241C15] cursor-pointer py-1"
                      >
                        <span>Ver {modelo.pedidos.length} pedidos individuales ({modelo.totalUnidades} piezas)</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`} />
                      </button>

                      {expandido && (
                        <div className="space-y-1.5 mt-2 pt-2 border-t border-[#E2D9CC]/40 text-xs animate-in fade-in duration-150">
                          {modelo.pedidos.map((ped, pIdx) => (
                            <div key={pIdx} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]/50">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#241C15]">{ped.cliente}</span>
                                  <span className="text-[10px] font-mono font-bold text-[#A36F4C]">({ped.codigoRef})</span>
                                  <span className="text-[10px] text-[#75695D]">• {ped.cantidad} ud(s)</span>
                                </div>
                                {ped.personalizacion && (
                                  <p className="text-[11px] text-[#854D0E] font-medium">
                                    ✨ {ped.personalizacion}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#75695D]">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ped.codigoHex }} />
                                  {ped.nombreColor}
                                </span>
                                {getEntregaBadge(ped.diaEntregaPrometida)}
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
      {/* VISTA 3: AGRUPACIÓN POR COLOR DE FILAMENTO (OPTIMIZACIÓN DE BOBINAS)      */}
      {/* ------------------------------------------------------------------------- */}
      {modoVista === 'COLOR' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#75695D]">
              {gruposPorColorFiltrados.length} colores requeridos en producción
            </span>
            <span className="text-xs text-[#75695D]">
              💡 Agrupa impresiones por bobina para evitar cambios innecesarios de filamento
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gruposPorColorFiltrados.map((grupo) => {
              const expandido = coloresExpandidos[grupo.colorId || grupo.nombreColor] || false
              const faltaStock = grupo.deficitGramos > 0

              return (
                <Card 
                  key={grupo.colorId || grupo.nombreColor} 
                  className={`bg-[#FFFFFF] border rounded-3xl shadow-xs overflow-hidden flex flex-col justify-between ${
                    faltaStock ? 'border-[#FCA5A5] ring-1 ring-[#FCA5A5]/40' : 'border-[#E2D9CC]'
                  }`}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-2xl border-2 border-black/20 shadow-xs flex items-center justify-center shrink-0"
                          style={{ backgroundColor: grupo.codigoHex }}
                        />
                        <div>
                          <CardTitle className="text-base font-black text-[#241C15]">
                            {grupo.nombreColor}
                          </CardTitle>
                          <CardDescription className="text-xs text-[#75695D]">
                            Material: {grupo.tipoMaterial} • Stock: {grupo.stockGramosActual}g ({grupo.stockBobinasActual} bobinas)
                          </CardDescription>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xl font-black text-[#241C15] font-mono tabular-nums block">
                          {grupo.totalUnidades} uds
                        </span>
                        <span className="text-[11px] font-bold text-[#A36F4C] font-mono">
                          {grupo.totalGramosRequeridos}g req.
                        </span>
                      </div>
                    </div>

                    {/* Alerta de Stock insuficiente si aplica */}
                    {faltaStock && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold mt-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                        <span>Faltan {grupo.deficitGramos}g para completar todas las piezas.</span>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3">
                    {/* Lista de Modelos que usan este color */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#75695D] uppercase tracking-wider block">
                        Piezas que usan este color:
                      </span>
                      
                      <div className="space-y-1">
                        {grupo.modelos.slice(0, expandido ? undefined : 3).map((mod, mIdx) => (
                          <div key={mIdx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]/40">
                            <span className="font-bold text-[#241C15] truncate pr-2">
                              {mod.cantidad}x {mod.nombreModelo}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-[#75695D] font-mono font-semibold">
                                {mod.gramos}g
                              </span>
                              <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-[#E2D9CC]">
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
                          className="text-xs font-bold text-[#A36F4C] hover:underline cursor-pointer pt-1 block"
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
