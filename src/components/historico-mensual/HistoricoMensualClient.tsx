'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  X, 
  Wrench, 
  ShoppingBag, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  BarChart3,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Sparkles,
  ChevronRight,
  Receipt,
  Layers,
  History,
  HelpCircle,
  CalendarDays,
  Filter,
  Check,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Package,
  Megaphone,
  Boxes
} from 'lucide-react'
import { 
  ComposedChart, 
  Bar, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts'
import { formatDate } from '@/lib/utils'

export interface EgresoItem {
  id: string
  persona: string
  categoria: 'ACTIVO_FIJO' | 'INSUMO' | 'SERVICIO' | 'PERSONAL' | 'APORTE_CAPITAL' | 'MERCADERIA' | 'FINANCIERO'
  subcategoria?: string | null
  itemConcepto: string
  especificacionColor?: string | null
  presentacion?: string | null
  cantidad: number
  costoUnitario: number
  costoEnvio?: number | null
  costoTotal: number
  costoPorGramo?: number | null
  createdAt: string
}

export interface PagoVentaItem {
  id: string
  ventaId: string
  fecha: string
  monto: number
  metodoPago: string
  tipo: string
  notas?: string | null
}

export interface VentaItem {
  id: string
  fecha: string
  cliente: string
  cantidad: number
  precioUnitario: number
  total: number
  montoPagado: number
  saldoPendiente: number
  estado: string
  producto: {
    nombreModelo: string
    lineaCategoria: string
  }
  pagos?: PagoVentaItem[]
}

export interface IngresoDirectoItem {
  id: string
  fecha: string
  cliente: string
  concepto: string
  categoria: string
  monto: number
  metodoPago?: string
  notas?: string
}

export interface CobranzaRecibidaItem {
  id: string
  ventaId: string
  cliente: string
  modelo: string
  cantidad: number
  monto: number
  fechaPago: string
  metodoPago: string
  tipo: string
  notas?: string | null
  mesOrigenVenta: string
  esDeMesAnterior: boolean
}

export interface ClienteCarteraDetalle {
  ventaId: string
  cliente: string
  modelo: string
  cantidad: number
  totalFacturado: number
  cobradoEnMesOrigen: number
  saldoPendienteAlCierre: number
  cobradoPosterior: number
  saldoPendienteHoy: number
  pagosRealizados: Array<{
    fecha: string
    monto: number
    metodo: string
    tipo: string
  }>
}

export interface MonthlyMovimiento {
  id: string
  fecha: string
  tipo: string
  categoria: string
  subcategoria: string
  concepto: string
  entidad: string
  monto: number
  esIngreso: boolean
  esActivoFijo?: boolean
  incluidoEnCalculo: boolean
  detalle?: string
}

export interface MonthlyCashflowItem {
  monthKey: string // "2026-08"
  nombreMes: string // "Agosto 2026"
  mesCorto: string // "Ago 26"
  anio: number
  numeroMes: number
  esMesActual: boolean
  
  // Facturación de Ventas
  totalFacturadoVentas: number
  cantidadPedidos: number
  cobradoVentasEnMesOrigen: number
  saldoFaltoCobrarAlCierre: number
  recuperadoEnMesesPosteriores: number
  saldoPendienteCobrarHoy: number
  efectividadCobroMesOrigenPct: number
  clientesCartera: ClienteCarteraDetalle[]
  cobranzasRecaudadasEnMes: CobranzaRecibidaItem[]
  
  // Totales Dinámicos según Checklist Activo
  ingresosTotalesCalculados: number
  egresosTotalesCalculados: number
  flujoNetoCalculado: number
  margenCalculadoPct: number

  // Desgloses Reales
  ingresosVentasCobradas: number
  ingresosDirectosDetalle: Record<string, number>
  egresosInsumosDetalle: Record<string, number>
  egresosServiciosDetalle: Record<string, number>
  egresosActivosFijosDetalle: Record<string, number>
  
  // Lista de Movimientos
  movimientos: MonthlyMovimiento[]
}

interface HistoricoMensualClientProps {
  egresos: EgresoItem[]
  ventas: VentaItem[]
  ingresosDirectos?: IngresoDirectoItem[]
}

// Tooltip para el Gráfico Multidimensional
function CustomMonthlyChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const ingresos = Number(data.ingresosTotalesCalculados || 0)
    const egresos = Number(data.egresosTotalesCalculados || 0)
    const faltoCobrar = Number(data.saldoFaltoCobrarAlCierre || 0)
    const neto = Number(data.flujoNetoCalculado || 0)
    const isNetPositive = neto >= 0

    return (
      <div className="bg-card/95 backdrop-blur-md border border-border/80 p-4 rounded-2xl shadow-xl min-w-[270px] text-xs font-sans">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
          <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            {data.nombreMes || label}
          </span>
          <Badge 
            variant="outline" 
            className={`text-[10px] font-bold px-1.5 py-0 ${
              isNetPositive 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}
          >
            {isNetPositive ? `+S/ ${neto.toFixed(2)}` : `-S/ ${Math.abs(neto).toFixed(2)}`}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Ingresos Seleccionados:
            </span>
            <span className="font-mono font-bold">+S/ {ingresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-primary font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Egresos Seleccionados:
            </span>
            <span className="font-mono font-bold">-S/ {egresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {faltoCobrar > 0 && (
            <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-medium pt-1 border-t border-dashed border-border/60">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                Faltó cobrar al cierre:
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">S/ {faltoCobrar.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="pt-2 mt-2 border-t border-border/60 flex justify-between items-center bg-muted/40 p-2 rounded-xl">
            <span className="font-bold text-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Flujo Neto Resultante:
            </span>
            <span className={`font-mono font-extrabold text-sm ${isNetPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isNetPositive ? `+S/ ${neto.toFixed(2)}` : `-S/ ${Math.abs(neto).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function HistoricoMensualClient({
  egresos,
  ventas,
  ingresosDirectos = []
}: HistoricoMensualClientProps) {
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('TODOS')
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<MonthlyCashflowItem | null>(null)
  const [modalCategoryFilter, setModalCategoryFilter] = useState<'TODOS' | 'INGRESOS' | 'EGRESOS' | 'CARTERA_COBRANZAS'>('TODOS')
  const [modalSearch, setModalSearch] = useState('')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // =========================================================================
  // 1. DESCUBRIMIENTO DINÁMICO 100% REAL DE TAGS Y CATEGORÍAS EN LA BASE DE DATOS
  // =========================================================================
  const availableTags = useMemo(() => {
    // Categorías reales de ingresos directos en la BD
    const ingresosDirectosCats = Array.from(
      new Set(ingresosDirectos.map(i => (i.categoria || 'Sin categoría').trim()))
    ).filter(Boolean)

    // Subcategorías reales de insumos en la BD
    const insumosSubcats = Array.from(
      new Set(egresos.filter(e => e.categoria === 'INSUMO').map(e => (e.subcategoria || 'Sin subcategoría').trim()))
    ).filter(Boolean)

    // Subcategorías reales de servicios en la BD
    const serviciosSubcats = Array.from(
      new Set(egresos.filter(e => e.categoria === 'SERVICIO').map(e => (e.subcategoria || 'Sin subcategoría').trim()))
    ).filter(Boolean)

    // Subcategorías reales de activos fijos en la BD
    const activosFijosSubcats = Array.from(
      new Set(egresos.filter(e => e.categoria === 'ACTIVO_FIJO').map(e => (e.subcategoria || 'Sin subcategoría').trim()))
    ).filter(Boolean)

    // Aportes de capital si existen
    const hasAportesCapital = egresos.some(e => e.categoria === 'APORTE_CAPITAL')

    // Totales históricos reales por tag
    const totalVentasCobrado = ventas.reduce((sum, v) => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        return sum + v.pagos.reduce((pSum, p) => pSum + (Number(p.monto) || 0), 0)
      }
      return sum + (Number(v.montoPagado) || 0)
    }, 0)

    const ingresosDirectosTotales: Record<string, number> = {}
    ingresosDirectos.forEach(i => {
      const k = (i.categoria || 'Sin categoría').trim()
      ingresosDirectosTotales[k] = (ingresosDirectosTotales[k] || 0) + Number(i.monto)
    })

    const insumosTotales: Record<string, number> = {}
    const serviciosTotales: Record<string, number> = {}
    const activosFijosTotales: Record<string, number> = {}

    egresos.forEach(e => {
      const k = (e.subcategoria || 'Sin subcategoría').trim()
      const c = Number(e.costoTotal) || 0
      if (e.categoria === 'INSUMO') insumosTotales[k] = (insumosTotales[k] || 0) + c
      if (e.categoria === 'SERVICIO') serviciosTotales[k] = (serviciosTotales[k] || 0) + c
      if (e.categoria === 'ACTIVO_FIJO') activosFijosTotales[k] = (activosFijosTotales[k] || 0) + c
    })

    return {
      ingresosDirectosCats,
      insumosSubcats,
      serviciosSubcats,
      activosFijosSubcats,
      hasAportesCapital,
      totalVentasCobrado,
      ingresosDirectosTotales,
      insumosTotales,
      serviciosTotales,
      activosFijosTotales
    }
  }, [ingresosDirectos, egresos, ventas])

  // =========================================================================
  // 2. ESTADO DEL CHECKLIST BASADO ESTRICTAMENTE EN DATOS REALES
  // =========================================================================
  const [includeVentas, setIncludeVentas] = useState<boolean>(true)
  
  // Categorías de ingresos directos seleccionadas (por defecto solo ventas directas/servicios, préstamos apagado)
  const [selectedIngresoCats, setSelectedIngresoCats] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    availableTags.ingresosDirectosCats.forEach(cat => {
      const isLoan = cat.toLowerCase().includes('préstamo') || cat.toLowerCase().includes('prestamo')
      init[cat] = !isLoan // Préstamos apagados por defecto en flujo operativo
    })
    return init
  })

  // Subcategorías de Insumos seleccionadas (todas activas por defecto)
  const [selectedInsumos, setSelectedInsumos] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    availableTags.insumosSubcats.forEach(sub => { init[sub] = true })
    return init
  })

  // Subcategorías de Servicios seleccionadas (todas activas por defecto)
  const [selectedServicios, setSelectedServicios] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    availableTags.serviciosSubcats.forEach(sub => { init[sub] = true })
    return init
  })

  // Subcategorías de Activos Fijos seleccionadas (apagadas por defecto para flujo operativo)
  const [selectedActivosFijos, setSelectedActivosFijos] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    availableTags.activosFijosSubcats.forEach(sub => { init[sub] = false })
    return init
  })

  const [includeAportesCapital, setIncludeAportesCapital] = useState<boolean>(false)

  // Presets Rápidos
  const applyPreset = (preset: 'OPERATIVO' | 'TOTAL_CON_MAQUINARIA' | 'SOLO_VENTAS_INSUMOS' | 'TODO_MARCADO' | 'LIMPIAR') => {
    if (preset === 'OPERATIVO') {
      setIncludeVentas(true)
      const ings: Record<string, boolean> = {}
      availableTags.ingresosDirectosCats.forEach(c => {
        ings[c] = !(c.toLowerCase().includes('préstamo') || c.toLowerCase().includes('prestamo'))
      })
      setSelectedIngresoCats(ings)

      const ins: Record<string, boolean> = {}
      availableTags.insumosSubcats.forEach(s => { ins[s] = true })
      setSelectedInsumos(ins)

      const srv: Record<string, boolean> = {}
      availableTags.serviciosSubcats.forEach(s => { srv[s] = true })
      setSelectedServicios(srv)

      const af: Record<string, boolean> = {}
      availableTags.activosFijosSubcats.forEach(s => { af[s] = false })
      setSelectedActivosFijos(af)
      setIncludeAportesCapital(false)
    } else if (preset === 'TOTAL_CON_MAQUINARIA') {
      setIncludeVentas(true)
      const ings: Record<string, boolean> = {}
      availableTags.ingresosDirectosCats.forEach(c => { ings[c] = true })
      setSelectedIngresoCats(ings)

      const ins: Record<string, boolean> = {}
      availableTags.insumosSubcats.forEach(s => { ins[s] = true })
      setSelectedInsumos(ins)

      const srv: Record<string, boolean> = {}
      availableTags.serviciosSubcats.forEach(s => { srv[s] = true })
      setSelectedServicios(srv)

      const af: Record<string, boolean> = {}
      availableTags.activosFijosSubcats.forEach(s => { af[s] = true })
      setSelectedActivosFijos(af)
      setIncludeAportesCapital(true)
    } else if (preset === 'SOLO_VENTAS_INSUMOS') {
      setIncludeVentas(true)
      const ings: Record<string, boolean> = {}
      availableTags.ingresosDirectosCats.forEach(c => { ings[c] = false })
      setSelectedIngresoCats(ings)

      const ins: Record<string, boolean> = {}
      availableTags.insumosSubcats.forEach(s => { ins[s] = true })
      setSelectedInsumos(ins)

      const srv: Record<string, boolean> = {}
      availableTags.serviciosSubcats.forEach(s => { srv[s] = false })
      setSelectedServicios(srv)

      const af: Record<string, boolean> = {}
      availableTags.activosFijosSubcats.forEach(s => { af[s] = false })
      setSelectedActivosFijos(af)
      setIncludeAportesCapital(false)
    } else if (preset === 'TODO_MARCADO') {
      setIncludeVentas(true)
      const ings: Record<string, boolean> = {}
      availableTags.ingresosDirectosCats.forEach(c => { ings[c] = true })
      setSelectedIngresoCats(ings)

      const ins: Record<string, boolean> = {}
      availableTags.insumosSubcats.forEach(s => { ins[s] = true })
      setSelectedInsumos(ins)

      const srv: Record<string, boolean> = {}
      availableTags.serviciosSubcats.forEach(s => { srv[s] = true })
      setSelectedServicios(srv)

      const af: Record<string, boolean> = {}
      availableTags.activosFijosSubcats.forEach(s => { af[s] = true })
      setSelectedActivosFijos(af)
      setIncludeAportesCapital(true)
    } else if (preset === 'LIMPIAR') {
      setIncludeVentas(false)
      const ings: Record<string, boolean> = {}
      availableTags.ingresosDirectosCats.forEach(c => { ings[c] = false })
      setSelectedIngresoCats(ings)

      const ins: Record<string, boolean> = {}
      availableTags.insumosSubcats.forEach(s => { ins[s] = false })
      setSelectedInsumos(ins)

      const srv: Record<string, boolean> = {}
      availableTags.serviciosSubcats.forEach(s => { srv[s] = false })
      setSelectedServicios(srv)

      const af: Record<string, boolean> = {}
      availableTags.activosFijosSubcats.forEach(s => { af[s] = false })
      setSelectedActivosFijos(af)
      setIncludeAportesCapital(false)
    }
  }

  // =========================================================================
  // 3. MODELADO CONTABLE Y RECALCULOS DINÁMICOS MES A MES
  // =========================================================================
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, MonthlyCashflowItem> = {}

    const getMonthKey = (dateStr: string) => {
      if (!dateStr) return '2026-08'
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr.slice(0, 7)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      return `${y}-${m}`
    }

    const monthNames: Record<string, string> = {
      '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
      '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
      '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    }

    const monthShorts: Record<string, string> = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
      '09': 'Set', '10': 'Oct', '11': 'Nov', '12': 'Dic'
    }

    const nowStr = new Date().toISOString().slice(0, 7)

    const ensureMonth = (key: string): MonthlyCashflowItem => {
      if (!monthMap[key]) {
        const [yearStr, mStr] = key.split('-')
        const anio = parseInt(yearStr, 10) || 2026
        const numeroMes = parseInt(mStr, 10) || 8
        const nombre = `${monthNames[mStr] || mStr} ${anio}`
        const corto = `${monthShorts[mStr] || mStr} ${yearStr.slice(-2)}`

        monthMap[key] = {
          monthKey: key,
          nombreMes: nombre,
          mesCorto: corto,
          anio,
          numeroMes,
          esMesActual: key === nowStr,
          
          totalFacturadoVentas: 0,
          cantidadPedidos: 0,
          cobradoVentasEnMesOrigen: 0,
          saldoFaltoCobrarAlCierre: 0,
          recuperadoEnMesesPosteriores: 0,
          saldoPendienteCobrarHoy: 0,
          efectividadCobroMesOrigenPct: 0,
          clientesCartera: [],
          cobranzasRecaudadasEnMes: [],
          
          ingresosTotalesCalculados: 0,
          egresosTotalesCalculados: 0,
          flujoNetoCalculado: 0,
          margenCalculadoPct: 0,
          
          ingresosVentasCobradas: 0,
          ingresosDirectosDetalle: {},
          egresosInsumosDetalle: {},
          egresosServiciosDetalle: {},
          egresosActivosFijosDetalle: {},
          
          movimientos: []
        }
      }
      return monthMap[key]
    }

    // 1. PROCESAR VENTAS Y CARTERA POR COBRAR
    ventas.forEach(v => {
      const vMonthKey = getMonthKey(v.fecha)
      const vMonth = ensureMonth(vMonthKey)
      const totalVenta = Number(v.total)
      vMonth.totalFacturadoVentas += totalVenta
      vMonth.cantidadPedidos += 1

      const pagosArray = Array.isArray(v.pagos) ? v.pagos : []
      const pagosMesOrigen = pagosArray.filter(p => getMonthKey(p.fecha) === vMonthKey)
      const sumPagosMesOrigen = pagosMesOrigen.reduce((s, p) => s + Number(p.monto), 0)
      const cobradoEnOrigen = pagosArray.length > 0 ? sumPagosMesOrigen : Number(v.montoPagado)

      const pagosPosteriores = pagosArray.filter(p => getMonthKey(p.fecha) > vMonthKey)
      const sumPagosPosteriores = pagosPosteriores.reduce((s, p) => s + Number(p.monto), 0)

      const faltoCobrarAlCierre = Math.max(0, totalVenta - cobradoEnOrigen)
      const saldoRestanteHoy = Number(v.saldoPendiente)

      vMonth.cobradoVentasEnMesOrigen += cobradoEnOrigen
      vMonth.saldoFaltoCobrarAlCierre += faltoCobrarAlCierre
      vMonth.recuperadoEnMesesPosteriores += sumPagosPosteriores
      vMonth.saldoPendienteCobrarHoy += saldoRestanteHoy

      if (faltoCobrarAlCierre > 0 || pagosPosteriores.length > 0) {
        vMonth.clientesCartera.push({
          ventaId: v.id,
          cliente: v.cliente,
          modelo: v.producto?.nombreModelo || 'Modelo 3D',
          cantidad: Number(v.cantidad),
          totalFacturado: totalVenta,
          cobradoEnMesOrigen: cobradoEnOrigen,
          saldoPendienteAlCierre: faltoCobrarAlCierre,
          cobradoPosterior: sumPagosPosteriores,
          saldoPendienteHoy: saldoRestanteHoy,
          pagosRealizados: pagosArray.map(p => ({
            fecha: p.fecha,
            monto: Number(p.monto),
            metodo: p.metodoPago || 'YAPE',
            tipo: p.tipo || 'ABONO'
          }))
        })
      }
    })

    // 2. PROCESAR COBRANZAS DE VENTAS EN CAJA EFECTIVA
    ventas.forEach((v, vIdx) => {
      const vMonthKey = getMonthKey(v.fecha)
      const codigo = (v as any).codigo || `PED-${String(ventas.length - vIdx).padStart(3, '0')}`
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        v.pagos.forEach((p, idx) => {
          if (p.monto > 0) {
            const pMonthKey = getMonthKey(p.fecha)
            const pMonth = ensureMonth(pMonthKey)
            const monto = Number(p.monto)
            
            pMonth.ingresosVentasCobradas += monto
            if (includeVentas) {
              pMonth.ingresosTotalesCalculados += monto
            }

            pMonth.cobranzasRecaudadasEnMes.push({
              id: p.id || `${v.id}-${idx}`,
              ventaId: v.id,
              cliente: v.cliente,
              modelo: v.producto?.nombreModelo || 'Modelo 3D',
              cantidad: Number(v.cantidad),
              monto,
              fechaPago: p.fecha,
              metodoPago: p.metodoPago || 'YAPE',
              tipo: p.tipo || 'ABONO',
              notas: p.notas,
              mesOrigenVenta: vMonthKey,
              esDeMesAnterior: vMonthKey < pMonthKey
            })

            const isSingleFull = ((v.pagos?.length || 0) === 1 && v.saldoPendiente <= 0) || p.tipo === 'PAGO_TOTAL'
            const numAbono = idx + 1
            const tipoLabel = isSingleFull ? 'Pago Total' : `Abono #${numAbono}`
            const concepto = isSingleFull
              ? `Pago Total del pedido ${codigo}: ${v.producto?.nombreModelo || 'Producto 3D'} (x${v.cantidad})`
              : `Abono número ${numAbono} del pedido ${codigo}: ${v.producto?.nombreModelo || 'Producto 3D'} (x${v.cantidad})`

            pMonth.movimientos.push({
              id: `pago-${p.id || `${v.id}-${idx}`}`,
              fecha: p.fecha,
              tipo: 'INGRESO_VENTA',
              categoria: 'Ventas de Pedidos 3D',
              subcategoria: 'Cobranza de Pedidos',
              concepto,
              entidad: v.cliente,
              monto,
              esIngreso: true,
              incluidoEnCalculo: includeVentas,
              detalle: `${p.metodoPago || 'Yape'}${p.notas ? ` • ${p.notas}` : ''}${vMonthKey < pMonthKey ? ` (Pedido originado en ${monthNames[vMonthKey.split('-')[1]]})` : ''}`
            })
          }
        })
      } else if (v.montoPagado > 0) {
        const vMonth = ensureMonth(vMonthKey)
        const monto = Number(v.montoPagado)
        
        vMonth.ingresosVentasCobradas += monto
        if (includeVentas) {
          vMonth.ingresosTotalesCalculados += monto
        }

        vMonth.cobranzasRecaudadasEnMes.push({
          id: `v-${v.id}`,
          ventaId: v.id,
          cliente: v.cliente,
          modelo: v.producto?.nombreModelo || 'Modelo 3D',
          cantidad: Number(v.cantidad),
          monto,
          fechaPago: v.fecha,
          metodoPago: 'PAGO_DIRECTO',
          tipo: 'PAGO_TOTAL',
          mesOrigenVenta: vMonthKey,
          esDeMesAnterior: false
        })

        vMonth.movimientos.push({
          id: `v-${v.id}`,
          fecha: v.fecha,
          tipo: 'INGRESO_VENTA',
          categoria: 'Ventas de Pedidos 3D',
          subcategoria: 'Venta Directa',
          concepto: `Venta: ${v.producto?.nombreModelo || 'Producto 3D'} (x${v.cantidad})`,
          entidad: v.cliente,
          monto,
          esIngreso: true,
          incluidoEnCalculo: includeVentas,
          detalle: 'Pago registrado al crear pedido'
        })
      }
    })

    // 3. PROCESAR INGRESOS DIRECTOS DE BD
    ingresosDirectos.forEach(i => {
      if (i.monto > 0) {
        const iMonthKey = getMonthKey(i.fecha)
        const iMonth = ensureMonth(iMonthKey)
        const monto = Number(i.monto)
        const catName = (i.categoria || 'Sin categoría').trim()

        iMonth.ingresosDirectosDetalle[catName] = (iMonth.ingresosDirectosDetalle[catName] || 0) + monto
        const isIncluded = Boolean(selectedIngresoCats[catName])

        if (isIncluded) {
          iMonth.ingresosTotalesCalculados += monto
        }

        iMonth.movimientos.push({
          id: `ing-${i.id}`,
          fecha: i.fecha,
          tipo: 'INGRESO_DIRECTO',
          categoria: catName,
          subcategoria: catName,
          concepto: i.concepto,
          entidad: i.cliente || 'Taller',
          monto,
          esIngreso: true,
          incluidoEnCalculo: isIncluded,
          detalle: i.notas || i.metodoPago || undefined
        })
      }
    })

    // 4. PROCESAR EGRESOS DE BD
    egresos.forEach(e => {
      if (e.costoTotal > 0) {
        const eMonthKey = getMonthKey(e.createdAt)
        const eMonth = ensureMonth(eMonthKey)
        const costo = Number(e.costoTotal)
        const subName = (e.subcategoria || 'Sin subcategoría').trim()

        let isIncluded = false

        if (e.categoria === 'INSUMO') {
          eMonth.egresosInsumosDetalle[subName] = (eMonth.egresosInsumosDetalle[subName] || 0) + costo
          isIncluded = Boolean(selectedInsumos[subName])
        } else if (e.categoria === 'SERVICIO') {
          eMonth.egresosServiciosDetalle[subName] = (eMonth.egresosServiciosDetalle[subName] || 0) + costo
          isIncluded = Boolean(selectedServicios[subName])
        } else if (e.categoria === 'ACTIVO_FIJO') {
          eMonth.egresosActivosFijosDetalle[subName] = (eMonth.egresosActivosFijosDetalle[subName] || 0) + costo
          isIncluded = Boolean(selectedActivosFijos[subName])
        } else if (e.categoria === 'APORTE_CAPITAL') {
          isIncluded = includeAportesCapital
        }

        if (isIncluded) {
          eMonth.egresosTotalesCalculados += costo
        }

        eMonth.movimientos.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: `EGRESO_${e.categoria}`,
          categoria: e.categoria === 'ACTIVO_FIJO' ? 'Activo Fijo' : e.categoria === 'INSUMO' ? 'Insumo' : e.categoria === 'PERSONAL' ? 'Personal' : 'Servicio',
          subcategoria: subName,
          concepto: e.itemConcepto,
          entidad: e.persona || 'Taller',
          monto: costo,
          esIngreso: false,
          esActivoFijo: e.categoria === 'ACTIVO_FIJO',
          incluidoEnCalculo: isIncluded,
          detalle: e.subcategoria ? `Tag: ${e.subcategoria}` : undefined
        })
      }
    })

    // Ordenar cronológicamente
    const sorted = Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey))

    // 5. CÁLCULO FINAL DE RATIOS
    sorted.forEach(m => {
      m.flujoNetoCalculado = Number((m.ingresosTotalesCalculados - m.egresosTotalesCalculados).toFixed(2))
      m.margenCalculadoPct = m.ingresosTotalesCalculados > 0
        ? Math.round((m.flujoNetoCalculado / m.ingresosTotalesCalculados) * 100)
        : 0

      m.efectividadCobroMesOrigenPct = m.totalFacturadoVentas > 0
        ? Number(((m.cobradoVentasEnMesOrigen / m.totalFacturadoVentas) * 100).toFixed(1))
        : 100

      m.movimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    })

    return sorted
  }, [
    ventas, 
    ingresosDirectos, 
    egresos, 
    includeVentas, 
    selectedIngresoCats, 
    selectedInsumos, 
    selectedServicios, 
    selectedActivosFijos, 
    includeAportesCapital
  ])

  // Métricas Consolidadas Históricas Globales
  const metricasHistoricas = useMemo(() => {
    const totalMeses = Math.max(1, monthlyData.length)
    const sumaFacturado = monthlyData.reduce((sum, m) => sum + m.totalFacturadoVentas, 0)
    const sumaIngresosCalculados = monthlyData.reduce((sum, m) => sum + m.ingresosTotalesCalculados, 0)
    const sumaEgresosCalculados = monthlyData.reduce((sum, m) => sum + m.egresosTotalesCalculados, 0)
    const sumaFlujoNetoCalculado = sumaIngresosCalculados - sumaEgresosCalculados
    const margenGlobal = sumaIngresosCalculados > 0 ? (sumaFlujoNetoCalculado / sumaIngresosCalculados) * 100 : 0
    const sumaSaldoPendienteActual = monthlyData.reduce((sum, m) => sum + m.saldoPendienteCobrarHoy, 0)

    const activeIngresosCount = (includeVentas ? 1 : 0) + Object.values(selectedIngresoCats).filter(Boolean).length
    const activeInsumosCount = Object.values(selectedInsumos).filter(Boolean).length
    const activeServiciosCount = Object.values(selectedServicios).filter(Boolean).length
    const activeActivosFijosCount = Object.values(selectedActivosFijos).filter(Boolean).length

    const totalActiveCount = activeIngresosCount + activeInsumosCount + activeServiciosCount + activeActivosFijosCount + (includeAportesCapital ? 1 : 0)

    return {
      totalMeses,
      sumaFacturado,
      sumaIngresosCalculados,
      sumaEgresosCalculados,
      sumaFlujoNetoCalculado,
      margenGlobal,
      sumaSaldoPendienteActual,
      activeIngresosCount,
      activeInsumosCount,
      activeServiciosCount,
      activeActivosFijosCount,
      totalActiveCount
    }
  }, [
    monthlyData, 
    includeVentas, 
    selectedIngresoCats, 
    selectedInsumos, 
    selectedServicios, 
    selectedActivosFijos, 
    includeAportesCapital
  ])

  const displayedMonths = useMemo(() => {
    if (selectedMonthFilter === 'TODOS') return monthlyData
    return monthlyData.filter(m => m.monthKey === selectedMonthFilter)
  }, [monthlyData, selectedMonthFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO DEL MÓDULO                                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <History className="h-6 w-6 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
              <span>Histórico Mensual</span>
            </h1>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              {metricasHistoricas.totalActiveCount} partidas activas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Evolución de flujo de caja, ingresos cobrados, egresos totales y rentabilidad operativa mes a mes.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`h-9 px-3.5 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all ${
              showFiltersPanel
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border/80 bg-card hover:bg-muted/40 text-foreground'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{showFiltersPanel ? 'Ocultar Filtros' : 'Filtros Contables'}</span>
          </Button>

          {/* Selector de Mes */}
          <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-xl px-3 py-1.5 shadow-2xs">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">Mes:</span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="text-xs font-bold text-foreground bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los Meses ({monthlyData.length})</option>
              {monthlyData.map(m => (
                <option key={m.monthKey} value={m.monthKey}>{m.nombreMes}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHECKLIST 100% REAL DE CONCEPTOS Y TAGS DE LA BASE DE DATOS            */}
      {/* ========================================================================= */}
      {showFiltersPanel && (
        <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Cabecera del Panel con Presets */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-muted/40 text-primary border border-border/70">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    Checklist de Partidas Contables
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Selecciona qué conceptos sumar a los indicadores dinámicos y métricas del taller.
                  </p>
                </div>
              </div>
            </div>

            {/* Presets Rápidos */}
            <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
              <span className="text-xs font-bold text-muted-foreground mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('OPERATIVO')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer active:scale-95"
              >
                Operativo
              </button>
              <button
                type="button"
                onClick={() => applyPreset('TOTAL_CON_MAQUINARIA')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-muted/40 text-foreground hover:bg-muted/70 border border-border/80 transition-all cursor-pointer active:scale-95"
              >
                + Activos Fijos
              </button>
              <button
                type="button"
                onClick={() => applyPreset('SOLO_VENTAS_INSUMOS')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-muted/40 text-foreground hover:bg-muted/70 border border-border/80 transition-all cursor-pointer active:scale-95"
              >
                Ventas vs Insumos
              </button>
              <button
                type="button"
                onClick={() => applyPreset('TODO_MARCADO')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent hover:border-border/60 transition-all cursor-pointer active:scale-95"
              >
                Marcar Todos
              </button>
              <button
                type="button"
                onClick={() => applyPreset('LIMPIAR')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer active:scale-95"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Grid de 4 Columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. INGRESOS */}
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Ingresos
                  </span>
                  <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-md">
                    {(includeVentas ? 1 : 0) + Object.values(selectedIngresoCats).filter(Boolean).length} activos
                  </span>
                </div>

                <div className="space-y-1.5 mt-2.5 text-xs">
                  {/* Ventas Pedidos 3D */}
                  <div
                    onClick={() => setIncludeVentas(!includeVentas)}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                      includeVentas
                        ? 'bg-card border-border/80 shadow-2xs'
                        : 'bg-transparent border-transparent hover:bg-card/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        includeVentas ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-card border-border/80'
                      }`}>
                        {includeVentas && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="font-bold text-foreground truncate">Ventas (Pedidos 3D)</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      {formatCurrency(availableTags.totalVentasCobrado)}
                    </span>
                  </div>

                  {/* Categorías Directas */}
                  {availableTags.ingresosDirectosCats.map(cat => {
                    const isChecked = Boolean(selectedIngresoCats[cat])
                    return (
                      <div
                        key={cat}
                        onClick={() => setSelectedIngresoCats(prev => ({ ...prev, [cat]: !prev[cat] }))}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-card border-border/80 shadow-2xs'
                            : 'bg-transparent border-transparent hover:bg-card/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-card border-border/80'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-foreground truncate">{cat}</span>
                        </div>
                        <span className="font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                          {formatCurrency(availableTags.ingresosDirectosTotales[cat] || 0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 2. INSUMOS */}
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Insumos
                  </span>
                  <span className="text-[10px] font-bold font-mono text-primary bg-muted/40 border border-border/70 px-1.5 py-0.2 rounded-md">
                    {Object.values(selectedInsumos).filter(Boolean).length} / {availableTags.insumosSubcats.length}
                  </span>
                </div>

                <div className="space-y-1.5 mt-2.5 text-xs max-h-56 overflow-y-auto pr-0.5 scrollbar-thin">
                  {availableTags.insumosSubcats.map(sub => {
                    const isChecked = Boolean(selectedInsumos[sub])
                    return (
                      <div
                        key={sub}
                        onClick={() => setSelectedInsumos(prev => ({ ...prev, [sub]: !prev[sub] }))}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-card border-border/80 shadow-2xs'
                            : 'bg-transparent border-transparent hover:bg-card/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            isChecked ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border/80'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-foreground truncate">{sub}</span>
                        </div>
                        <span className="font-mono text-xs text-primary shrink-0">
                          {formatCurrency(availableTags.insumosTotales[sub] || 0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 3. SERVICIOS */}
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    Servicios
                  </span>
                  <span className="text-[10px] font-bold font-mono text-primary bg-muted/40 border border-border/70 px-1.5 py-0.2 rounded-md">
                    {Object.values(selectedServicios).filter(Boolean).length} / {availableTags.serviciosSubcats.length}
                  </span>
                </div>

                <div className="space-y-1.5 mt-2.5 text-xs">
                  {availableTags.serviciosSubcats.map(sub => {
                    const isChecked = Boolean(selectedServicios[sub])
                    return (
                      <div
                        key={sub}
                        onClick={() => setSelectedServicios(prev => ({ ...prev, [sub]: !prev[sub] }))}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-card border-border/80 shadow-2xs'
                            : 'bg-transparent border-transparent hover:bg-card/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            isChecked ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border/80'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-foreground truncate">{sub}</span>
                        </div>
                        <span className="font-mono text-xs text-primary shrink-0">
                          {formatCurrency(availableTags.serviciosTotales[sub] || 0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 4. ACTIVOS FIJOS (CAPEX) */}
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    Activos Fijos (CAPEX)
                  </span>
                  <span className="text-[10px] font-bold font-mono text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded-md">
                    {Object.values(selectedActivosFijos).filter(Boolean).length} / {availableTags.activosFijosSubcats.length}
                  </span>
                </div>

                <div className="space-y-1.5 mt-2.5 text-xs">
                  {availableTags.activosFijosSubcats.map(sub => {
                    const isChecked = Boolean(selectedActivosFijos[sub])
                    return (
                      <div
                        key={sub}
                        onClick={() => setSelectedActivosFijos(prev => ({ ...prev, [sub]: !prev[sub] }))}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-card border-border/80 shadow-2xs text-amber-700 dark:text-amber-300'
                            : 'bg-transparent border-transparent hover:bg-card/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'bg-card border-border/80'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="font-bold text-foreground truncate">{sub}</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-amber-700 dark:text-amber-300 shrink-0">
                          {formatCurrency(availableTags.activosFijosTotales[sub] || 0)}
                        </span>
                      </div>
                    )
                  })}

                  {availableTags.hasAportesCapital && (
                    <div
                      onClick={() => setIncludeAportesCapital(!includeAportesCapital)}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                        includeAportesCapital
                          ? 'bg-card border-border/80 shadow-2xs'
                          : 'bg-transparent border-transparent hover:bg-card/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                          includeAportesCapital ? 'bg-amber-600 border-amber-600 text-white' : 'bg-card border-border/80'
                        }`}>
                          {includeAportesCapital && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="font-semibold text-foreground">Aportes de Capital</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. INDICADORES DINÁMICOS GLOBALES MINIMALISTAS                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Flujo Neto Dinámico Calculado */}
        <div className="bg-card border border-border/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Flujo Neto Calculado</span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl sm:text-2xl font-black font-mono tabular-nums ${metricasHistoricas.sumaFlujoNetoCalculado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {metricasHistoricas.sumaFlujoNetoCalculado >= 0 ? `+${formatCurrency(metricasHistoricas.sumaFlujoNetoCalculado)}` : formatCurrency(metricasHistoricas.sumaFlujoNetoCalculado)}
            </div>
            <span className="text-xs text-muted-foreground mt-0.5 block truncate">
              Margen resultante: <strong className="text-foreground">{metricasHistoricas.margenGlobal.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* KPI 2: Ingresos Seleccionados */}
        <div className="bg-card border border-border/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Ingresos Seleccionados</span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-foreground tabular-nums">
              {formatCurrency(metricasHistoricas.sumaIngresosCalculados)}
            </div>
            <span className="text-xs text-muted-foreground mt-0.5 block truncate">
              {metricasHistoricas.activeIngresosCount} conceptos activos
            </span>
          </div>
        </div>

        {/* KPI 3: Egresos Seleccionados */}
        <div className="bg-card border border-border/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Egresos Seleccionados</span>
            <div className="p-1 rounded-md bg-primary/10 text-primary">
              <ArrowDownRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-primary tabular-nums">
              {formatCurrency(metricasHistoricas.sumaEgresosCalculados)}
            </div>
            <span className="text-xs text-muted-foreground mt-0.5 block truncate">
              {metricasHistoricas.activeInsumosCount + metricasHistoricas.activeServiciosCount + metricasHistoricas.activeActivosFijosCount} tags activos
            </span>
          </div>
        </div>

        {/* KPI 4: Ventas Facturadas Históricas */}
        <div className="bg-card border border-border/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Ventas Facturadas</span>
            <div className="p-1 rounded-md bg-primary/10 text-primary">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-foreground tabular-nums">
              {formatCurrency(metricasHistoricas.sumaFacturado)}
            </div>
            <span className="text-xs text-muted-foreground mt-0.5 block truncate">
              100% cobrado en caja
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. EVOLUCIÓN HISTÓRICA: GRÁFICO COMBINADO                                 */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Evolución Mensual: Ingresos vs Egresos vs Flujo Neto</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comparativa histórica según las partidas y conceptos activos en el filtro contable.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground self-start sm:self-auto bg-muted/30 px-2.5 py-1 rounded-xl border border-border/70">
            {monthlyData.length} {monthlyData.length === 1 ? 'mes registrado' : 'meses registrados'}
          </span>
        </div>

        {/* Gráfico Recharts */}
        <div className="h-[280px] sm:h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="flujoSuperavitGradHistDin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} opacity={0.6} />
              <XAxis 
                dataKey="nombreMes" 
                stroke="currentColor" 
                className="text-muted-foreground"
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
              />
              <YAxis 
                stroke="currentColor" 
                className="text-muted-foreground"
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                tickFormatter={(v) => `S/${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
              />
              <RechartsTooltip content={<CustomMonthlyChartTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs font-semibold text-foreground mr-3">
                    {value === 'ingresosTotalesCalculados' ? 'Ingresos Seleccionados (+)' : value === 'egresosTotalesCalculados' ? 'Egresos Seleccionados (-)' : 'Flujo Neto Resultante'}
                  </span>
                )}
              />
              
              <Bar dataKey="ingresosTotalesCalculados" name="ingresosTotalesCalculados" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={44} />
              <Bar dataKey="egresosTotalesCalculados" name="egresosTotalesCalculados" fill="#d97706" radius={[6, 6, 0, 0]} maxBarSize={44} />

              <Area 
                type="monotone" 
                dataKey="flujoNetoCalculado" 
                stroke="none" 
                fill="url(#flujoSuperavitGradHistDin)" 
                legendType="none" 
                tooltipType="none" 
              />

              <Line 
                type="monotone" 
                dataKey="flujoNetoCalculado" 
                name="flujoNetoCalculado" 
                stroke="currentColor"
                className="text-foreground"
                strokeWidth={2.5}
                dot={{ fill: 'currentColor', r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                activeDot={{ r: 6, fill: '#10b981', stroke: 'var(--card)', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TABLA MATRICIAL MENSUAL (ZERO-SCROLL & EDITORIAL LAYOUT)                */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span>Libro Mayor & Resultados por Mes</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consolidado mensual con desglose contable, efectividad de cobranza y acceso a auditoría de partidas.
            </p>
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            Haz clic en <strong className="text-foreground">Auditar</strong> o en cualquier fila para inspeccionar movimientos.
          </span>
        </div>

        {/* Vista Desktop (>= lg): Tabla con CERO scroll horizontal */}
        <div className="hidden lg:block w-full overflow-hidden">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-muted/30 border-b border-border/60">
              <TableRow className="border-border/60 hover:bg-transparent text-xs font-bold text-muted-foreground">
                <TableHead className="w-[18%] px-4 py-3 text-left">Mes / Período</TableHead>
                <TableHead className="w-[13%] px-3 py-3 text-right text-emerald-600 dark:text-emerald-400">Ingresos Cobrados</TableHead>
                <TableHead className="w-[13%] px-3 py-3 text-right text-primary">Insumos & Operación</TableHead>
                <TableHead className="w-[11%] px-3 py-3 text-right text-amber-700 dark:text-amber-300">Activos Fijos</TableHead>
                <TableHead className="w-[13%] px-3 py-3 text-right font-bold text-foreground">Egresos Totales</TableHead>
                <TableHead className="w-[13%] px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">Flujo Neto</TableHead>
                <TableHead className="w-[7%] px-2 py-3 text-center">Margen</TableHead>
                <TableHead className="w-[7%] px-2 py-3 text-center">Cobranza</TableHead>
                <TableHead className="w-[8%] px-3 py-3 text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedMonths.map((m) => {
                const isPos = m.flujoNetoCalculado >= 0
                const sumaInsumosMes = Object.values(m.egresosInsumosDetalle).reduce((s, v) => s + v, 0) + Object.values(m.egresosServiciosDetalle).reduce((s, v) => s + v, 0)
                const sumaActivosFijosMes = Object.values(m.egresosActivosFijosDetalle).reduce((s, v) => s + v, 0)

                return (
                  <TableRow 
                    key={m.monthKey}
                    onClick={() => {
                      setSelectedMonthDetail(m)
                      setModalCategoryFilter('TODOS')
                      setModalSearch('')
                    }}
                    className="border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer text-xs group"
                  >
                    {/* 1. Mes */}
                    <TableCell className="px-4 py-3.5 font-bold text-foreground truncate">
                      <div className="flex items-center gap-2">
                        <span className="group-hover:text-primary transition-colors font-bold text-sm">
                          {m.nombreMes}
                        </span>
                        {m.esMesActual && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-[9px] font-bold px-1.5 py-0">
                            En Curso
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-normal block mt-0.5 truncate">
                        {m.cantidadPedidos} pedidos • {m.movimientos.length} movs
                      </span>
                    </TableCell>

                    {/* 2. Ingresos Cobrados */}
                    <TableCell className="px-3 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 align-middle truncate">
                      +{formatCurrency(m.ingresosTotalesCalculados)}
                    </TableCell>

                    {/* 3. Insumos & Services */}
                    <TableCell className="px-3 py-3.5 text-right font-mono text-primary align-middle truncate">
                      -{formatCurrency(sumaInsumosMes)}
                    </TableCell>

                    {/* 4. Activos Fijos */}
                    <TableCell className="px-3 py-3.5 text-right font-mono text-amber-700 dark:text-amber-300 align-middle truncate">
                      {sumaActivosFijosMes > 0 ? `-${formatCurrency(sumaActivosFijosMes)}` : <span className="text-muted-foreground/50">—</span>}
                    </TableCell>

                    {/* 5. Egresos Totales */}
                    <TableCell className="px-3 py-3.5 text-right font-mono font-bold text-foreground align-middle truncate">
                      -{formatCurrency(m.egresosTotalesCalculados)}
                    </TableCell>

                    {/* 6. Flujo Neto */}
                    <TableCell className={`px-4 py-3.5 text-right font-mono font-black text-sm align-middle truncate ${isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isPos ? `+${formatCurrency(m.flujoNetoCalculado)}` : formatCurrency(m.flujoNetoCalculado)}
                    </TableCell>

                    {/* 7. Margen % */}
                    <TableCell className="px-2 py-3.5 text-center font-mono font-bold align-middle">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                        m.margenCalculadoPct >= 30
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : m.margenCalculadoPct >= 0
                          ? 'bg-muted/40 text-foreground border border-border/70'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {m.margenCalculadoPct}%
                      </span>
                    </TableCell>

                    {/* 8. Efectividad de Cobranza */}
                    <TableCell className="px-2 py-3.5 text-center font-mono text-xs text-muted-foreground align-middle truncate">
                      {m.efectividadCobroMesOrigenPct}%
                    </TableCell>

                    {/* 9. Acción Auditar */}
                    <TableCell className="px-3 py-3.5 text-right align-middle">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedMonthDetail(m)
                          setModalCategoryFilter('TODOS')
                          setModalSearch('')
                        }}
                        className="h-7.5 px-2.5 text-xs font-bold border-border/80 bg-background hover:bg-muted text-foreground rounded-xl cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        <span>Auditar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Vista Móvil y Tablet (< lg): Tarjetas Fluidas con CERO scroll horizontal */}
        <div className="block lg:hidden p-3 space-y-3">
          {displayedMonths.map((m) => {
            const isPos = m.flujoNetoCalculado >= 0
            const sumaInsumosMes = Object.values(m.egresosInsumosDetalle).reduce((s, v) => s + v, 0) + Object.values(m.egresosServiciosDetalle).reduce((s, v) => s + v, 0)
            const sumaActivosFijosMes = Object.values(m.egresosActivosFijosDetalle).reduce((s, v) => s + v, 0)

            return (
              <div
                key={m.monthKey}
                onClick={() => {
                  setSelectedMonthDetail(m)
                  setModalCategoryFilter('TODOS')
                  setModalSearch('')
                }}
                className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-primary/50 transition-all cursor-pointer space-y-3"
              >
                {/* Cabecera del Mes */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-base text-foreground">
                        {m.nombreMes}
                      </span>
                      {m.esMesActual && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-[9px] font-bold px-1.5 py-0">
                          En Curso
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-normal block mt-0.5">
                      {m.cantidadPedidos} pedidos • {m.movimientos.length} movimientos
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedMonthDetail(m)
                      setModalCategoryFilter('TODOS')
                      setModalSearch('')
                    }}
                    className="h-7.5 px-3 text-xs font-bold border-border/80 bg-background hover:bg-muted text-foreground rounded-xl cursor-pointer shadow-2xs inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    <span>Auditar</span>
                  </Button>
                </div>

                {/* Flujo Neto Destacado */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isPos ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                }`}>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                      isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      Flujo Neto del Mes
                    </span>
                    <span className={`font-mono font-black text-lg ${
                      isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isPos ? `+${formatCurrency(m.flujoNetoCalculado)}` : formatCurrency(m.flujoNetoCalculado)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      m.margenCalculadoPct >= 30
                        ? 'bg-card text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : m.margenCalculadoPct >= 0
                        ? 'bg-card text-foreground border-border/80'
                        : 'bg-card text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}>
                      {m.margenCalculadoPct}% margen
                    </span>
                  </div>
                </div>

                {/* Grid de Partidas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block font-medium">Ingresos Cobrados:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      +{formatCurrency(m.ingresosTotalesCalculados)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block font-medium">Insumos & Operación:</span>
                    <span className="font-mono font-bold text-primary text-xs">
                      -{formatCurrency(sumaInsumosMes)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block font-medium">Activos Fijos:</span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-xs">
                      {sumaActivosFijosMes > 0 ? `-${formatCurrency(sumaActivosFijosMes)}` : '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block font-medium">Cobranza:</span>
                    <span className="font-mono font-bold text-foreground text-xs">
                      {m.efectividadCobroMesOrigenPct}% cobrado
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL INTERACTIVO DE AUDITORÍA CONTABLE                                */}
      {/* ========================================================================= */}
      {selectedMonthDetail && (
        <div className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-muted/20 border-b border-border/60 p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
                    Auditoría Contable: {selectedMonthDetail.nombreMes}
                  </h3>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold">
                    Cálculo Dinámico Activo
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Desglose exacto de partidas sumadas al cálculo según tu checklist.
                </p>
              </div>

              <button
                onClick={() => setSelectedMonthDetail(null)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Summary KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-border/60 bg-card">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Ingresos Sumados</span>
                <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">+{formatCurrency(selectedMonthDetail.ingresosTotalesCalculados)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-bold uppercase text-primary block">Egresos Sumados</span>
                <span className="font-mono font-extrabold text-sm text-primary">-{formatCurrency(selectedMonthDetail.egresosTotalesCalculados)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/70">
                <span className="text-[10px] font-bold uppercase text-foreground block">Flujo Neto</span>
                <span className={`font-mono font-black text-sm ${selectedMonthDetail.flujoNetoCalculado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {selectedMonthDetail.flujoNetoCalculado >= 0 ? `+${formatCurrency(selectedMonthDetail.flujoNetoCalculado)}` : formatCurrency(selectedMonthDetail.flujoNetoCalculado)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 block">Faltó Cobrar / Cartera</span>
                <span className="font-mono font-semibold text-xs text-amber-600 dark:text-amber-400">
                  S/ {selectedMonthDetail.saldoFaltoCobrarAlCierre.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Toolbar Filters inside Modal */}
            <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar en este mes..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="pl-8 pr-7 h-8 bg-background border-border/80 text-xs rounded-lg text-foreground"
                />
                {modalSearch && (
                  <button onClick={() => setModalSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border/70 self-stretch sm:self-auto overflow-x-auto">
                <button
                  onClick={() => setModalCategoryFilter('TODOS')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    modalCategoryFilter === 'TODOS' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todos ({selectedMonthDetail.movimientos.length})
                </button>
                <button
                  onClick={() => setModalCategoryFilter('INGRESOS')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    modalCategoryFilter === 'INGRESOS' ? 'bg-emerald-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ingresos
                </button>
                <button
                  onClick={() => setModalCategoryFilter('EGRESOS')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    modalCategoryFilter === 'EGRESOS' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Egresos
                </button>
                {selectedMonthDetail.clientesCartera.length > 0 && (
                  <button
                    onClick={() => setModalCategoryFilter('CARTERA_COBRANZAS')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      modalCategoryFilter === 'CARTERA_COBRANZAS' ? 'bg-amber-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Cartera ({selectedMonthDetail.clientesCartera.length})
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]">
              {modalCategoryFilter === 'CARTERA_COBRANZAS' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/70 text-xs text-muted-foreground">
                    <span className="font-bold text-foreground block">Auditoría de Cuentas por Cobrar Originadas en {selectedMonthDetail.nombreMes}:</span>
                    Al cierre faltaba cobrar <strong className="text-amber-600 dark:text-amber-400">S/ {selectedMonthDetail.saldoFaltoCobrarAlCierre.toFixed(2)}</strong>. Detalle de liquidaciones:
                  </div>

                  {selectedMonthDetail.clientesCartera.map((c) => (
                    <div key={c.ventaId} className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-extrabold text-sm text-foreground block">{c.cliente}</span>
                          <span className="text-xs text-muted-foreground block">{c.modelo} • Cantidad: {c.cantidad}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-sm text-foreground block">Total: {formatCurrency(c.totalFacturado)}</span>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                            100% Pagado
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-border/60">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Cobrado en {selectedMonthDetail.mesCorto}:</span>
                          <span className="font-mono font-semibold text-foreground">+{formatCurrency(c.cobradoEnMesOrigen)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 block">Faltó al Cierre:</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">S/ {c.saldoPendienteAlCierre.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Cobrado Posterior:</span>
                          <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">+{formatCurrency(c.cobradoPosterior)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                selectedMonthDetail.movimientos
                  .filter(m => {
                    const matchSearch = m.concepto.toLowerCase().includes(modalSearch.toLowerCase()) || m.entidad.toLowerCase().includes(modalSearch.toLowerCase())
                    if (!matchSearch) return false
                    if (modalCategoryFilter === 'INGRESOS') return m.esIngreso
                    if (modalCategoryFilter === 'EGRESOS') return !m.esIngreso
                    return true
                  })
                  .map(m => (
                    <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors gap-2 ${m.incluidoEnCalculo ? 'bg-card border-border/80' : 'bg-muted/20 border-dashed border-border/50 opacity-60'}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-foreground truncate">{m.concepto}</span>
                          <Badge variant="outline" className={`text-[9px] font-bold py-0 px-1.5 ${
                            m.esIngreso 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : m.esActivoFijo
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                              : 'bg-muted/40 text-primary border-border/70'
                          }`}>
                            {m.subcategoria || m.categoria}
                          </Badge>
                          {!m.incluidoEnCalculo && (
                            <Badge variant="outline" className="text-[8px] bg-muted/60 text-muted-foreground border-border/60">
                              Excluido por Filtro
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono block mt-0.5">
                          {formatDate(m.fecha)} • {m.entidad} {m.detalle ? `• ${m.detalle}` : ''}
                        </span>
                      </div>

                      <span className={`font-mono font-extrabold text-xs sm:text-sm flex-shrink-0 ${
                        m.esIngreso ? 'text-emerald-600 dark:text-emerald-400' : m.esActivoFijo ? 'text-amber-700 dark:text-amber-300' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {m.esIngreso ? `+${formatCurrency(m.monto)}` : `-${formatCurrency(m.monto)}`}
                      </span>
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-muted/20 border-t border-border/60 p-3.5 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedMonthDetail(null)}
                className="px-4 h-8 text-xs font-bold border-border/80 bg-background hover:bg-muted text-foreground rounded-xl cursor-pointer"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
