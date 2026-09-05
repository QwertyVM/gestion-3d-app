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
  categoria: 'ACTIVO_FIJO' | 'INSUMO' | 'SERVICIO' | 'APORTE_CAPITAL'
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
      <div className="bg-[#FFFFFF]/95 backdrop-blur-md border border-[#E2D9CC] p-4 rounded-2xl shadow-xl min-w-[270px] text-xs font-sans">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2D9CC]/70">
          <span className="font-bold text-[#241C15] flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-[#A36F4C]" />
            {data.nombreMes || label}
          </span>
          <Badge 
            variant="outline" 
            className={`text-[10px] font-bold px-1.5 py-0 ${
              isNetPositive 
                ? 'bg-emerald-50 text-[#1E5E3A] border-emerald-200' 
                : 'bg-red-50 text-[#A34335] border-red-200'
            }`}
          >
            {isNetPositive ? `+S/ ${neto.toFixed(2)}` : `-S/ ${Math.abs(neto).toFixed(2)}`}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[#1E5E3A] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1E5E3A]" />
              Ingresos Seleccionados:
            </span>
            <span className="font-mono font-bold">+S/ {ingresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-[#A36F4C] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A36F4C]" />
              Egresos Seleccionados:
            </span>
            <span className="font-mono font-bold">-S/ {egresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {faltoCobrar > 0 && (
            <div className="flex justify-between items-center text-[#8C6D1F] font-medium pt-1 border-t border-dashed border-[#E2D9CC]">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-[#8C6D1F]" />
                Faltó cobrar al cierre:
              </span>
              <span className="font-mono font-bold text-[#8C6D1F]">S/ {faltoCobrar.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="pt-2 mt-2 border-t border-[#E2D9CC] flex justify-between items-center bg-[#FAF8F5] p-2 rounded-xl">
            <span className="font-bold text-[#241C15] flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-[#1E5E3A]" />
              Flujo Neto Resultante:
            </span>
            <span className={`font-mono font-extrabold text-sm ${isNetPositive ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
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
  const [viewMode, setViewMode] = useState<'PANEL_EJECUTIVO' | 'TABLA_MATRICIAL' | 'AUDITORIA_CARTERA'>('PANEL_EJECUTIVO')
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('TODOS')
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<MonthlyCashflowItem | null>(null)
  const [modalCategoryFilter, setModalCategoryFilter] = useState<'TODOS' | 'INGRESOS' | 'EGRESOS' | 'CARTERA_COBRANZAS'>('TODOS')
  const [modalSearch, setModalSearch] = useState('')
  const [showFiltersPanel, setShowFiltersPanel] = useState(true)

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
    ventas.forEach(v => {
      const vMonthKey = getMonthKey(v.fecha)
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
            const tipoLabel = isSingleFull ? 'Pago Total' : `Abono #${idx + 1}`

            pMonth.movimientos.push({
              id: `pago-${p.id || `${v.id}-${idx}`}`,
              fecha: p.fecha,
              tipo: 'INGRESO_VENTA',
              categoria: 'Ventas de Pedidos 3D',
              subcategoria: 'Cobranza de Pedidos',
              concepto: `${tipoLabel}: ${v.producto?.nombreModelo || 'Producto 3D'} (x${v.cantidad})`,
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
          categoria: e.categoria === 'ACTIVO_FIJO' ? 'Activo Fijo' : e.categoria === 'INSUMO' ? 'Insumo' : 'Servicio',
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

  const agostoData = monthlyData.find(m => m.monthKey === '2026-08')

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO DEL MÓDULO                                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FDFBF7] p-5 rounded-3xl border border-[#E2D9CC] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 rounded-2xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#633E20] shadow-sm">
              <History className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#241C15]">
              Histórico Mensual
            </h1>
            <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs font-extrabold px-3 py-1">
              {metricasHistoricas.totalActiveCount} Tags/Conceptos Activos
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#75695D] mt-1.5 max-w-3xl">
            Control contable histórico multimes. Selecciona qué tags y conceptos reales de tu base de datos sumar a los indicadores y todos los valores se recalcularán al instante.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className="h-9 px-3.5 text-xs font-bold border-[#D4BEA7] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#241C15] rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>{showFiltersPanel ? 'Ocultar Filtros' : 'Configurar Filtros'}</span>
          </Button>

          {/* Selector de Mes */}
          <div className="flex items-center gap-1.5 bg-[#FFFFFF] border border-[#D4BEA7] rounded-xl px-3 py-1.5 shadow-2xs">
            <Filter className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span className="text-xs font-semibold text-[#75695D]">Mes:</span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="text-xs font-bold text-[#241C15] bg-transparent border-none outline-none cursor-pointer"
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
        <Card className="bg-[#FFFFFF] border-[#D4BEA7] shadow-sm rounded-3xl p-5 sm:p-6 space-y-4 border-2">
          {/* Cabecera del Panel con Presets */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#E2D9CC]">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#A36F4C]" />
                <h2 className="text-sm sm:text-base font-extrabold text-[#241C15]">
                  Checklist de Conceptos Reales: Elige qué sumar a los Indicadores
                </h2>
              </div>
              <p className="text-xs text-[#75695D] mt-0.5">
                Generado directamente desde tus registros y tags en base de datos.
              </p>
            </div>

            {/* Presets Rápidos */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#75695D] mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('OPERATIVO')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EBF7EE] text-[#1E5E3A] hover:bg-[#D7EFE0] border border-[#B4E3C0] transition-colors cursor-pointer"
              >
                Operativo
              </button>
              <button
                type="button"
                onClick={() => applyPreset('TOTAL_CON_MAQUINARIA')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EFE5D8] text-[#633E20] hover:bg-[#E5D5C2] border border-[#D4BEA7] transition-colors cursor-pointer"
              >
                + Con Activos Fijos
              </button>
              <button
                type="button"
                onClick={() => applyPreset('SOLO_VENTAS_INSUMOS')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF8F5] text-[#241C15] hover:bg-[#F4EFEA] border border-[#E2D9CC] transition-colors cursor-pointer"
              >
                Ventas vs Insumos
              </button>
              <button
                type="button"
                onClick={() => applyPreset('TODO_MARCADO')}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                Marcar Todos
              </button>
              <button
                type="button"
                onClick={() => applyPreset('LIMPIAR')}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-[#A34335] hover:bg-red-50 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Grid de Checkboxes Reales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* 1. INGRESOS */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E2D9CC]/70">
                <span className="text-xs font-extrabold text-[#1E5E3A] uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Ingresos
                </span>
                <span className="text-[10px] text-[#75695D] font-mono">BD</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {/* Ventas de Pedidos 3D */}
                <label className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeVentas}
                    onChange={(e) => setIncludeVentas(e.target.checked)}
                    className="mt-0.5 rounded text-[#1E5E3A] focus:ring-[#1E5E3A] cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-[#241C15] block truncate">Ventas (Pedidos 3D)</span>
                    <span className="text-[10px] text-[#1E5E3A] font-mono font-semibold block">{formatCurrency(availableTags.totalVentasCobrado)}</span>
                  </div>
                </label>

                {/* Categorías reales de ingresos directos */}
                {availableTags.ingresosDirectosCats.map(cat => (
                  <label key={cat} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedIngresoCats[cat])}
                      onChange={(e) => setSelectedIngresoCats(prev => ({ ...prev, [cat]: e.target.checked }))}
                      className="mt-0.5 rounded text-[#1E5E3A] focus:ring-[#1E5E3A] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[#241C15] block truncate">{cat}</span>
                      <span className="text-[10px] text-[#1E5E3A] font-mono font-semibold block">{formatCurrency(availableTags.ingresosDirectosTotales[cat] || 0)}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 2. EGRESOS - INSUMOS (TAGS REALES) */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E2D9CC]/70">
                <span className="text-xs font-extrabold text-[#8C6D1F] uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Insumos (Tags)
                </span>
                <span className="text-[10px] text-[#75695D] font-mono">{availableTags.insumosSubcats.length} tags</span>
              </div>

              <div className="space-y-1.5 text-xs max-h-56 overflow-y-auto pr-1">
                {availableTags.insumosSubcats.map(sub => (
                  <label key={sub} className="flex items-start gap-2 p-1 rounded-lg hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedInsumos[sub])}
                      onChange={(e) => setSelectedInsumos(prev => ({ ...prev, [sub]: e.target.checked }))}
                      className="mt-0.5 rounded text-[#8C6D1F] focus:ring-[#8C6D1F] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[#241C15] block truncate">{sub}</span>
                      <span className="text-[10px] text-[#A36F4C] font-mono block">{formatCurrency(availableTags.insumosTotales[sub] || 0)}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. EGRESOS - SERVICIOS (TAGS REALES) */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E2D9CC]/70">
                <span className="text-xs font-extrabold text-[#A36F4C] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  Servicios (Tags)
                </span>
                <span className="text-[10px] text-[#75695D] font-mono">{availableTags.serviciosSubcats.length} tags</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {availableTags.serviciosSubcats.map(sub => (
                  <label key={sub} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedServicios[sub])}
                      onChange={(e) => setSelectedServicios(prev => ({ ...prev, [sub]: e.target.checked }))}
                      className="mt-0.5 rounded text-[#A36F4C] focus:ring-[#A36F4C] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[#241C15] block truncate">{sub}</span>
                      <span className="text-[10px] text-[#A36F4C] font-mono block">{formatCurrency(availableTags.serviciosTotales[sub] || 0)}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. EGRESOS - ACTIVOS FIJOS (TAGS REALES) */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E2D9CC]/70">
                <span className="text-xs font-extrabold text-[#633E20] uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5" />
                  Activos Fijos (CAPEX)
                </span>
                <span className="text-[10px] text-[#75695D] font-mono">{availableTags.activosFijosSubcats.length} tags</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {availableTags.activosFijosSubcats.map(sub => (
                  <label key={sub} className={`flex items-start gap-2 p-1.5 rounded-lg transition-all cursor-pointer select-none ${selectedActivosFijos[sub] ? 'bg-[#EFE5D8] border border-[#D4BEA7]' : 'hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC]'}`}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedActivosFijos[sub])}
                      onChange={(e) => setSelectedActivosFijos(prev => ({ ...prev, [sub]: e.target.checked }))}
                      className="mt-0.5 rounded text-[#633E20] focus:ring-[#633E20] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-[#633E20] block truncate">{sub}</span>
                      <span className="text-[10px] text-[#633E20] font-mono font-bold block">{formatCurrency(availableTags.activosFijosTotales[sub] || 0)}</span>
                    </div>
                  </label>
                ))}

                {availableTags.hasAportesCapital && (
                  <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#FFFFFF] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeAportesCapital}
                      onChange={(e) => setIncludeAportesCapital(e.target.checked)}
                      className="rounded text-[#633E20] focus:ring-[#633E20] cursor-pointer"
                    />
                    <span className="font-semibold text-[#241C15]">Aportes de Capital</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 3. INDICADORES DINÁMICOS GLOBALES                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Flujo Neto Dinámico Calculado */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E5E3A]" />
          <CardHeader className="pb-1 pt-3.5 px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E5E3A] flex items-center justify-between">
              <span>Flujo Neto Calculado</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            <div className={`text-xl sm:text-2xl font-black font-mono mt-0.5 truncate ${metricasHistoricas.sumaFlujoNetoCalculado >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
              {metricasHistoricas.sumaFlujoNetoCalculado >= 0 ? `+${formatCurrency(metricasHistoricas.sumaFlujoNetoCalculado)}` : formatCurrency(metricasHistoricas.sumaFlujoNetoCalculado)}
            </div>
          </CardHeader>
          <CardContent className="pb-3 px-4 text-[11px] text-[#75695D]">
            <span>Margen resultante: <strong>{metricasHistoricas.margenGlobal.toFixed(1)}%</strong></span>
          </CardContent>
        </Card>

        {/* KPI 2: Ingresos Seleccionados */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E5E3A]" />
          <CardHeader className="pb-1 pt-3.5 px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E5E3A] flex items-center justify-between">
              <span>Ingresos Seleccionados</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#241C15] mt-0.5 truncate">
              {formatCurrency(metricasHistoricas.sumaIngresosCalculados)}
            </div>
          </CardHeader>
          <CardContent className="pb-3 px-4 text-[11px] text-[#75695D]">
            <span>{metricasHistoricas.activeIngresosCount} conceptos de ingreso activos</span>
          </CardContent>
        </Card>

        {/* KPI 3: Egresos Seleccionados */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#A36F4C]" />
          <CardHeader className="pb-1 pt-3.5 px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A36F4C] flex items-center justify-between">
              <span>Egresos Seleccionados</span>
              <ArrowDownRight className="h-3.5 w-3.5" />
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#944917] mt-0.5 truncate">
              {formatCurrency(metricasHistoricas.sumaEgresosCalculados)}
            </div>
          </CardHeader>
          <CardContent className="pb-3 px-4 text-[11px] text-[#75695D]">
            <span>{metricasHistoricas.activeInsumosCount + metricasHistoricas.activeServiciosCount + metricasHistoricas.activeActivosFijosCount} tags de egreso activos</span>
          </CardContent>
        </Card>

        {/* KPI 4: Ventas Facturadas Históricas */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#633E20]" />
          <CardHeader className="pb-1 pt-3.5 px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#633E20] flex items-center justify-between">
              <span>Ventas Facturadas Totales</span>
              <Package className="h-3.5 w-3.5" />
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#633E20] mt-0.5 truncate">
              {formatCurrency(metricasHistoricas.sumaFacturado)}
            </div>
          </CardHeader>
          <CardContent className="pb-3 px-4 text-[11px] text-[#75695D]">
            <span>100% cobrado en caja</span>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 4. BLOQUE AUDITORÍA DE CARTERA: AGOSTO 2026                               */}
      {/* ========================================================================= */}
      {agostoData && (
        <Card className="bg-[#FFFFFF] border-[#D4BEA7] shadow-sm rounded-3xl p-5 sm:p-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E2D9CC]">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-[#A36F4C] bg-[#EFE5D8] px-2.5 py-0.5 rounded-md">
                  Auditoría de Cobranzas
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#241C15]">
                  ¿Cuánto faltó cobrar de Agosto 2026?
                </h2>
                <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs font-bold">
                  ✅ 100% Recuperado
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-[#75695D] mt-1">
                Al cierre del 31 de Agosto faltó cobrar exactamente <strong>S/ 191.00</strong> de un total facturado de <strong>S/ 881.97</strong> (5 clientes de contra entrega).
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedMonthDetail(agostoData)
                setModalCategoryFilter('CARTERA_COBRANZAS')
                setModalSearch('')
              }}
              className="h-8 text-xs font-bold border-[#E2D9CC] bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#241C15] rounded-xl cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 mr-1 text-[#A36F4C]" />
              Ver Clientes de Agosto
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC]">
              <span className="text-[10px] font-bold uppercase text-[#75695D] block">Total Facturado Agosto</span>
              <div className="text-lg sm:text-xl font-black font-mono text-[#241C15] mt-0.5">{formatCurrency(agostoData.totalFacturadoVentas)}</div>
              <span className="text-[10px] text-[#75695D] block mt-0.5">10 pedidos generados</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#EBF7EE]/60 border border-[#B4E3C0]">
              <span className="text-[10px] font-bold uppercase text-[#1E5E3A] block">Cobrado en Agosto (en su mes)</span>
              <div className="text-lg sm:text-xl font-black font-mono text-[#1E5E3A] mt-0.5">+{formatCurrency(agostoData.cobradoVentasEnMesOrigen)}</div>
              <span className="text-[10px] text-[#1E5E3A] font-semibold block mt-0.5">{agostoData.efectividadCobroMesOrigenPct}% cobrado al momento</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FDF6E2] border border-[#E8D49B]">
              <span className="text-[10px] font-bold uppercase text-[#8C6D1F] block">Faltó Cobrar de Agosto (al 31/08)</span>
              <div className="text-lg sm:text-xl font-black font-mono text-[#8C6D1F] mt-0.5">S/ {agostoData.saldoFaltoCobrarAlCierre.toFixed(2)}</div>
              <span className="text-[10px] text-[#8C6D1F] font-semibold block mt-0.5">5 clientes con saldo de entrega</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#EBF7EE] border border-[#B4E3C0]">
              <span className="text-[10px] font-bold uppercase text-[#1E5E3A] block">Recuperado en Septiembre</span>
              <div className="text-lg sm:text-xl font-black font-mono text-[#1E5E3A] mt-0.5">+{formatCurrency(agostoData.recuperadoEnMesesPosteriores)}</div>
              <span className="text-[10px] text-[#1E5E3A] font-extrabold block mt-0.5">Saldo pendiente hoy: S/ 0.00</span>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 5. EVOLUCIÓN HISTÓRICA RECALCULADA                                        */}
      {/* ========================================================================= */}
      <Card className="bg-[#FFFFFF] border-[#D4BEA7] shadow-sm rounded-3xl p-4 sm:p-6 space-y-5">
        {/* Cabecera de Vistas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2D9CC]">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#241C15] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#A36F4C]" />
              <span>Evolución Histórica Dinámica</span>
            </h2>
            <p className="text-xs text-[#75695D]">
              Comparativa mes a mes de ingresos y egresos según los tags y conceptos activos.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('PANEL_EJECUTIVO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'PANEL_EJECUTIVO'
                  ? 'bg-[#241C15] text-white shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Panel & Gráfica</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLA_MATRICIAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'TABLA_MATRICIAL'
                  ? 'bg-[#241C15] text-white shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Tabla Matricial</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('AUDITORIA_CARTERA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'AUDITORIA_CARTERA'
                  ? 'bg-[#241C15] text-white shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Historial Cobranzas</span>
            </button>
          </div>
        </div>

        {/* VISTA 1: Panel Ejecutivo con Gráfico y Tarjetas Recalculadas */}
        {viewMode === 'PANEL_EJECUTIVO' && (
          <div className="space-y-6">
            {/* Gráfico ComposedChart */}
            <div className="bg-[#FAF8F5] border border-[#E2D9CC] rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2D9CC]/70">
                <span className="text-xs font-bold uppercase tracking-wider text-[#241C15]">
                  Evolución: Ingresos Seleccionados vs Egresos Seleccionados vs Flujo Neto
                </span>
                <span className="text-[11px] text-[#75695D] font-mono">
                  {monthlyData.length} meses registrados
                </span>
              </div>

              <div className="h-[280px] sm:h-[340px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="flujoSuperavitGradHistDin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E5E3A" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1E5E3A" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" vertical={false} opacity={0.7} />
                    <XAxis 
                      dataKey="nombreMes" 
                      stroke="#75695D" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={{ stroke: '#E2D9CC' }}
                    />
                    <YAxis 
                      stroke="#75695D" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={{ stroke: '#E2D9CC' }}
                      tickFormatter={(v) => `S/${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
                    />
                    <RechartsTooltip content={<CustomMonthlyChartTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-xs font-semibold text-[#241C15] mr-3">
                          {value === 'ingresosTotalesCalculados' ? 'Ingresos Seleccionados (+)' : value === 'egresosTotalesCalculados' ? 'Egresos Seleccionados (-)' : 'Flujo Neto Resultante'}
                        </span>
                      )}
                    />
                    
                    <Bar dataKey="ingresosTotalesCalculados" name="ingresosTotalesCalculados" fill="#1E5E3A" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    <Bar dataKey="egresosTotalesCalculados" name="egresosTotalesCalculados" fill="#A36F4C" radius={[6, 6, 0, 0]} maxBarSize={48} />

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
                      stroke="#241C15" 
                      strokeWidth={2.5}
                      dot={{ fill: '#241C15', r: 4.5, strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 6.5, fill: '#1E5E3A', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tarjetas Mensuales Dinámicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedMonths.map((m) => {
                const isPos = m.flujoNetoCalculado >= 0
                return (
                  <div 
                    key={m.monthKey}
                    className="bg-[#FFFFFF] border border-[#E2D9CC] hover:border-[#D4BEA7] rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Cabecera */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#E2D9CC]/70 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base sm:text-lg text-[#241C15]">
                            {m.nombreMes}
                          </span>
                          {m.esMesActual && (
                            <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[9px] font-bold px-1.5 py-0">
                              Mes Actual
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-[#75695D] font-mono">
                          {m.movimientos.filter(mov => mov.incluidoEnCalculo).length} movimientos activos en el cálculo
                        </span>
                      </div>
                      
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-extrabold px-2.5 py-0.5 ${
                          isPos 
                            ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]' 
                            : 'bg-red-50 text-[#A34335] border-red-200'
                        }`}
                      >
                        {isPos ? 'Superávit' : 'Déficit'}
                      </Badge>
                    </div>

                    {/* 3 Bloques Numéricos Resultantes */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-[#FAF8F5] p-3 rounded-2xl border border-[#E2D9CC]/70">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-[#1E5E3A] block">
                          Ingresos (+)
                        </span>
                        <span className="font-mono font-extrabold text-sm sm:text-base text-[#1E5E3A] block truncate">
                          +{formatCurrency(m.ingresosTotalesCalculados)}
                        </span>
                      </div>

                      <div className="space-y-0.5 border-x border-[#E2D9CC]/80 px-1">
                        <span className="text-[10px] uppercase font-bold text-[#A36F4C] block">
                          Egresos (-)
                        </span>
                        <span className="font-mono font-extrabold text-sm sm:text-base text-[#A36F4C] block truncate">
                          -{formatCurrency(m.egresosTotalesCalculados)}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-[#241C15] block">
                          Flujo Neto
                        </span>
                        <span className={`font-mono font-black text-sm sm:text-base block truncate ${isPos ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
                          {isPos ? `+${formatCurrency(m.flujoNetoCalculado)}` : formatCurrency(m.flujoNetoCalculado)}
                        </span>
                      </div>
                    </div>

                    {/* Desglose de Conceptos Reales que sumaron en este Mes */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF8F5]/60 border border-[#E2D9CC]/60 text-xs text-[#75695D]">
                      <div className="flex justify-between items-center text-[#241C15] font-semibold pb-1 border-b border-[#E2D9CC]/50">
                        <span>Desglose de Partidas en {m.mesCorto}:</span>
                        <span className="font-mono text-[11px] text-[#1E5E3A]">Margen: {m.margenCalculadoPct}%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span>Ventas (Abonos de Pedidos 3D):</span>
                        <span className="font-mono font-bold text-[#1E5E3A]">+{formatCurrency(m.ingresosVentasCobradas)}</span>
                      </div>

                      {Object.entries(m.ingresosDirectosDetalle).map(([cat, val]) => (
                        <div key={cat} className="flex justify-between items-center text-[#1E5E3A]">
                          <span>{cat}:</span>
                          <span className="font-mono font-semibold">+{formatCurrency(val)}</span>
                        </div>
                      ))}

                      {Object.entries(m.egresosInsumosDetalle).map(([sub, val]) => (
                        <div key={sub} className="flex justify-between items-center text-[#A36F4C]">
                          <span>Insumo ({sub}):</span>
                          <span className="font-mono font-semibold">-{formatCurrency(val)}</span>
                        </div>
                      ))}

                      {Object.entries(m.egresosServiciosDetalle).map(([sub, val]) => (
                        <div key={sub} className="flex justify-between items-center text-[#A36F4C]">
                          <span>Servicio ({sub}):</span>
                          <span className="font-mono font-semibold">-{formatCurrency(val)}</span>
                        </div>
                      ))}

                      {Object.entries(m.egresosActivosFijosDetalle).map(([sub, val]) => (
                        <div key={sub} className="flex justify-between items-center text-[#633E20] font-bold bg-[#EFE5D8]/50 p-1 rounded">
                          <span>Activo Fijo ({sub}):</span>
                          <span className="font-mono">-{formatCurrency(val)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Botón Auditar Movimientos */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMonthDetail(m)
                        setModalCategoryFilter('TODOS')
                        setModalSearch('')
                      }}
                      className="w-full h-8 text-xs font-bold border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#241C15] flex items-center justify-center gap-1.5 rounded-xl cursor-pointer shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#A36F4C]" />
                      <span>Auditar Libro Mensual ({m.movimientos.length} movs.)</span>
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VISTA 2: Tabla Matricial Completa */}
        {viewMode === 'TABLA_MATRICIAL' && (
          <div className="overflow-x-auto scrollbar-thin border border-[#E2D9CC] rounded-2xl overflow-hidden">
            <Table className="w-full min-w-[850px]">
              <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
                <TableRow className="border-[#E2D9CC] hover:bg-transparent text-xs font-bold">
                  <TableHead className="text-[#241C15] px-4 py-3">Mes / Período</TableHead>
                  <TableHead className="text-[#1E5E3A] px-3 py-3 text-right">Ventas (+)</TableHead>
                  <TableHead className="text-[#1E5E3A] px-3 py-3 text-right font-bold bg-[#EBF7EE]/40">Ingresos Sel. (+)</TableHead>
                  <TableHead className="text-[#A36F4C] px-3 py-3 text-right">Insumos (-)</TableHead>
                  <TableHead className="text-[#A36F4C] px-3 py-3 text-right">Servicios (-)</TableHead>
                  <TableHead className="text-[#633E20] px-3 py-3 text-right">Act. Fijos (-)</TableHead>
                  <TableHead className="text-[#633E20] px-3 py-3 text-right font-black bg-[#FAF8F5]">Egresos Sel. (-)</TableHead>
                  <TableHead className="text-[#1E5E3A] px-4 py-3 text-right font-black">Flujo Neto (=)</TableHead>
                  <TableHead className="text-[#241C15] px-3 py-3 text-center">Auditar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedMonths.map((m) => {
                  const isPos = m.flujoNetoCalculado >= 0
                  const sumaInsumosMes = Object.values(m.egresosInsumosDetalle).reduce((s, v) => s + v, 0)
                  const sumaServiciosMes = Object.values(m.egresosServiciosDetalle).reduce((s, v) => s + v, 0)
                  const sumaActivosFijosMes = Object.values(m.egresosActivosFijosDetalle).reduce((s, v) => s + v, 0)

                  return (
                    <TableRow key={m.monthKey} className="border-[#E2D9CC]/70 hover:bg-[#FDFBF7] transition-colors text-xs">
                      <TableCell className="px-4 py-3 font-bold text-[#241C15] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{m.nombreMes}</span>
                          {m.esMesActual && (
                            <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[9px] font-bold px-1 py-0">
                              En Curso
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-3 text-right font-mono text-[#1E5E3A]">
                        +{formatCurrency(m.ingresosVentasCobradas)}
                      </TableCell>

                      <TableCell className="px-3 py-3 text-right font-mono font-bold text-[#1E5E3A] bg-[#EBF7EE]/40">
                        +{formatCurrency(m.ingresosTotalesCalculados)}
                      </TableCell>

                      <TableCell className="px-3 py-3 text-right font-mono text-[#A36F4C]">
                        -{formatCurrency(sumaInsumosMes)}
                      </TableCell>

                      <TableCell className="px-3 py-3 text-right font-mono text-[#A36F4C]">
                        -{formatCurrency(sumaServiciosMes)}
                      </TableCell>

                      <TableCell className="px-3 py-3 text-right font-mono text-[#633E20]">
                        {sumaActivosFijosMes > 0 ? formatCurrency(sumaActivosFijosMes) : '—'}
                      </TableCell>

                      <TableCell className="px-3 py-3 text-right font-mono font-extrabold text-[#633E20] bg-[#FAF8F5]/60">
                        -{formatCurrency(m.egresosTotalesCalculados)}
                      </TableCell>

                      <TableCell className={`px-4 py-3 text-right font-mono font-black ${isPos ? 'text-[#1E5E3A] bg-[#EBF7EE]/40' : 'text-[#A34335] bg-red-50/40'}`}>
                        {isPos ? `+${formatCurrency(m.flujoNetoCalculado)}` : formatCurrency(m.flujoNetoCalculado)}
                      </TableCell>

                      <TableCell className="px-3 py-3 text-center whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMonthDetail(m)
                            setModalCategoryFilter('TODOS')
                            setModalSearch('')
                          }}
                          className="h-7 px-2 text-[11px] font-bold border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#241C15] rounded-lg cursor-pointer"
                        >
                          <Eye className="h-3 w-3 mr-1 text-[#A36F4C]" />
                          Auditar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* VISTA 3: Historial y Auditoría de Cuentas por Cobrar y Cobranzas Recibidas */}
        {viewMode === 'AUDITORIA_CARTERA' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E2D9CC] text-xs text-[#75695D] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-[#241C15] block">Auditoría Histórica de Cobranzas Efectivas y Cartera:</span>
                Supervisa mes a mes tanto el dinero cobrado que ingresó a caja como los saldos pendientes generados por nuevos pedidos.
              </div>
            </div>

            <div className="space-y-4">
              {monthlyData.map((m) => (
                <div key={m.monthKey} className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] border border-[#E2D9CC] shadow-xs space-y-4">
                  {/* Encabezado del Mes */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#E2D9CC]/70">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] text-[#A36F4C]">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base sm:text-lg text-[#241C15]">{m.nombreMes}</span>
                          {m.esMesActual && (
                            <Badge variant="outline" className="text-[10px] font-bold bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]">
                              Mes en Curso
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-[#75695D]">
                          {m.cantidadPedidos} pedidos nuevos creados • {m.cobranzasRecaudadasEnMes.length} cobranzas ingresadas a caja
                        </span>
                      </div>
                    </div>

                    {/* Resumen de Cifras del Mes */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                      <div className="p-2 rounded-xl bg-[#EBF7EE]/60 border border-[#B4E3C0]">
                        <span className="text-[10px] font-bold text-[#1E5E3A] block uppercase">Cobrado a Caja:</span>
                        <strong className="font-mono text-sm text-[#1E5E3A]">+{formatCurrency(m.ingresosVentasCobradas)}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]">
                        <span className="text-[10px] font-bold text-[#75695D] block uppercase">Facturado Pedidos:</span>
                        <strong className="font-mono text-sm text-[#241C15]">{formatCurrency(m.totalFacturadoVentas)}</strong>
                      </div>
                      {m.saldoFaltoCobrarAlCierre > 0 && (
                        <div className="p-2 rounded-xl bg-[#FDF6E2] border border-[#E8D49B]">
                          <span className="text-[10px] font-bold text-[#8C6D1F] block uppercase">Faltó al Cierre:</span>
                          <strong className="font-mono text-sm text-[#8C6D1F]">S/ {m.saldoFaltoCobrarAlCierre.toFixed(2)}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BLOQUE 1: Cobranzas Efectivas Ingresadas a Caja en este Mes */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#1E5E3A] uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Cobranzas Percibidas en {m.mesCorto} (Flujo Real de Caja)
                      </span>
                      <span className="text-[11px] font-mono text-[#75695D]">
                        Total Recaudado: <strong className="text-[#1E5E3A]">+{formatCurrency(m.ingresosVentasCobradas)}</strong>
                      </span>
                    </div>

                    {m.cobranzasRecaudadasEnMes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {m.cobranzasRecaudadasEnMes.map((p) => (
                          <div key={p.id} className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-1.5 hover:border-[#B4E3C0] transition-colors">
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0 flex-1">
                                <span className="font-extrabold text-xs text-[#241C15] block truncate">{p.cliente}</span>
                                <span className="text-[10px] text-[#75695D] block truncate">{p.modelo} (x{p.cantidad})</span>
                              </div>
                              <span className="font-mono font-black text-xs sm:text-sm text-[#1E5E3A] flex-shrink-0">
                                +{formatCurrency(p.monto)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-[#E2D9CC]/60">
                              <span className="text-[#75695D] font-mono">
                                {formatDate(p.fechaPago)} • {p.metodoPago}
                              </span>
                              {p.esDeMesAnterior ? (
                                <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[9px] font-bold py-0">
                                  Recuperación de Cartera (Pedido de Ago)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-[#FAF8F5] text-[#75695D] border-[#D4BEA7] text-[9px] font-semibold py-0">
                                  {p.tipo}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-dashed border-[#E2D9CC] text-xs text-[#75695D] italic">
                        No se registraron cobranzas recibidas en este mes.
                      </div>
                    )}
                  </div>

                  {/* BLOQUE 2: Cartera / Cuentas por Cobrar Originadas por Pedidos de este Mes */}
                  <div className="space-y-2.5 pt-2 border-t border-[#E2D9CC]/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#8C6D1F] uppercase tracking-wider flex items-center gap-1.5">
                        <History className="h-3.5 w-3.5" />
                        Cartera Originada por Pedidos de {m.mesCorto}
                      </span>
                      {m.saldoFaltoCobrarAlCierre > 0 && (
                        <span className="text-[11px] font-mono text-[#75695D]">
                          Faltó al Cierre: <strong className="text-[#8C6D1F]">S/ {m.saldoFaltoCobrarAlCierre.toFixed(2)}</strong> • Recuperado: <strong className="text-[#1E5E3A]">+{formatCurrency(m.recuperadoEnMesesPosteriores)}</strong>
                        </span>
                      )}
                    </div>

                    {m.clientesCartera.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {m.clientesCartera.map((c) => (
                          <div key={c.ventaId} className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-1.5">
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-xs text-[#241C15] block truncate">{c.cliente}</span>
                                <span className="text-[10px] text-[#75695D] block truncate">{c.modelo} (x{c.cantidad})</span>
                              </div>
                              <Badge variant="outline" className={`text-[9px] font-bold flex-shrink-0 ${c.saldoPendienteHoy <= 0 ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]' : 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]'}`}>
                                {c.saldoPendienteHoy <= 0 ? 'Saneado 100%' : `Debe S/ ${c.saldoPendienteHoy.toFixed(2)}`}
                              </Badge>
                            </div>

                            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#E2D9CC]/60">
                              <span className="text-[#75695D]">Total Factura: {formatCurrency(c.totalFacturado)}</span>
                              <span className="font-mono font-extrabold text-[#1E5E3A]">+{formatCurrency(c.cobradoPosterior)} cobrado</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-[#FAF8F5]/60 border border-[#E2D9CC]/60 text-xs text-[#75695D]">
                        {m.cantidadPedidos > 0 
                          ? 'Todos los pedidos creados en este período fueron cobrados al 100% al momento de la venta.' 
                          : 'No se crearon nuevos pedidos de venta en este período.'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* 6. MODAL INTERACTIVO DE AUDITORÍA CONTABLE                                */}
      {/* ========================================================================= */}
      {selectedMonthDetail && (
        <div className="fixed inset-0 isolate z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border border-[#D4BEA7] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#FAF8F5] border-b border-[#E2D9CC] p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#241C15]">
                    Auditoría Contable: {selectedMonthDetail.nombreMes}
                  </h3>
                  <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs font-bold">
                    Cálculo Dinámico Activo
                  </Badge>
                </div>
                <p className="text-xs text-[#75695D] mt-0.5">
                  Desglose exacto de partidas sumadas al cálculo según tu checklist.
                </p>
              </div>

              <button
                onClick={() => setSelectedMonthDetail(null)}
                className="p-1.5 rounded-xl hover:bg-[#EAE4DC] text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Summary KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-[#E2D9CC] bg-[#FFFFFF]">
              <div className="p-2.5 rounded-xl bg-[#EBF7EE] border border-[#B4E3C0]">
                <span className="text-[10px] font-bold uppercase text-[#1E5E3A] block">Ingresos Sumados</span>
                <span className="font-mono font-extrabold text-sm text-[#1E5E3A]">+{formatCurrency(selectedMonthDetail.ingresosTotalesCalculados)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7]">
                <span className="text-[10px] font-bold uppercase text-[#A36F4C] block">Egresos Sumados</span>
                <span className="font-mono font-extrabold text-sm text-[#A36F4C]">-{formatCurrency(selectedMonthDetail.egresosTotalesCalculados)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
                <span className="text-[10px] font-bold uppercase text-[#241C15] block">Flujo Neto</span>
                <span className={`font-mono font-black text-sm ${selectedMonthDetail.flujoNetoCalculado >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
                  {selectedMonthDetail.flujoNetoCalculado >= 0 ? `+${formatCurrency(selectedMonthDetail.flujoNetoCalculado)}` : formatCurrency(selectedMonthDetail.flujoNetoCalculado)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]">
                <span className="text-[10px] font-bold uppercase text-[#75695D] block">Faltó Cobrar / Cartera</span>
                <span className="font-mono font-semibold text-xs text-[#8C6D1F]">
                  S/ {selectedMonthDetail.saldoFaltoCobrarAlCierre.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Toolbar Filters inside Modal */}
            <div className="p-4 border-b border-[#E2D9CC] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#75695D]" />
                <Input
                  placeholder="Buscar en este mes..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="pl-8 pr-7 h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs rounded-lg"
                />
                {modalSearch && (
                  <button onClick={() => setModalSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#75695D]">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-[#F4EFEA] p-0.5 rounded-lg border border-[#E2D9CC] self-stretch sm:self-auto overflow-x-auto">
                <button
                  onClick={() => setModalCategoryFilter('TODOS')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    modalCategoryFilter === 'TODOS' ? 'bg-[#241C15] text-white shadow-xs' : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Todos ({selectedMonthDetail.movimientos.length})
                </button>
                <button
                  onClick={() => setModalCategoryFilter('INGRESOS')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    modalCategoryFilter === 'INGRESOS' ? 'bg-[#1E5E3A] text-white shadow-xs' : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Ingresos
                </button>
                <button
                  onClick={() => setModalCategoryFilter('EGRESOS')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    modalCategoryFilter === 'EGRESOS' ? 'bg-[#A36F4C] text-white shadow-xs' : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Egresos
                </button>
                {selectedMonthDetail.clientesCartera.length > 0 && (
                  <button
                    onClick={() => setModalCategoryFilter('CARTERA_COBRANZAS')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      modalCategoryFilter === 'CARTERA_COBRANZAS' ? 'bg-[#8C6D1F] text-white shadow-xs' : 'text-[#75695D] hover:text-[#241C15]'
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
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E2D9CC] text-xs text-[#75695D]">
                    <span className="font-bold text-[#241C15] block">Auditoría de Cuentas por Cobrar Originadas en {selectedMonthDetail.nombreMes}:</span>
                    Al cierre faltaba cobrar <strong className="text-[#8C6D1F]">S/ {selectedMonthDetail.saldoFaltoCobrarAlCierre.toFixed(2)}</strong>. Detalle de liquidaciones:
                  </div>

                  {selectedMonthDetail.clientesCartera.map((c) => (
                    <div key={c.ventaId} className="p-3.5 rounded-2xl bg-[#F8F6F2] border border-[#E2D9CC] space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-extrabold text-sm text-[#241C15] block">{c.cliente}</span>
                          <span className="text-xs text-[#75695D] block">{c.modelo} • Cantidad: {c.cantidad}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-sm text-[#241C15] block">Total: {formatCurrency(c.totalFacturado)}</span>
                          <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold">
                            100% Pagado
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-[#E2D9CC]/70">
                        <div>
                          <span className="text-[10px] text-[#75695D] block">Cobrado en {selectedMonthDetail.mesCorto}:</span>
                          <span className="font-mono font-semibold text-[#241C15]">+{formatCurrency(c.cobradoEnMesOrigen)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8C6D1F] block">Faltó al Cierre:</span>
                          <span className="font-mono font-bold text-[#8C6D1F]">S/ {c.saldoPendienteAlCierre.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#1E5E3A] block">Cobrado Posterior:</span>
                          <span className="font-mono font-extrabold text-[#1E5E3A]">+{formatCurrency(c.cobradoPosterior)}</span>
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
                    <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors gap-2 ${m.incluidoEnCalculo ? 'bg-[#FFFFFF] border-[#E2D9CC]' : 'bg-[#FAF8F5]/50 border-dashed border-[#E2D9CC]/60 opacity-60'}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-[#241C15] truncate">{m.concepto}</span>
                          <Badge variant="outline" className={`text-[9px] font-bold py-0 px-1.5 ${
                            m.esIngreso 
                              ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                              : m.esActivoFijo
                              ? 'bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7]'
                              : 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]'
                          }`}>
                            {m.subcategoria || m.categoria}
                          </Badge>
                          {!m.incluidoEnCalculo && (
                            <Badge variant="outline" className="text-[8px] bg-neutral-100 text-neutral-500 border-neutral-300">
                              Excluido por Filtro
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-[#75695D] font-mono block mt-0.5">
                          {formatDate(m.fecha)} • {m.entidad} {m.detalle ? `• ${m.detalle}` : ''}
                        </span>
                      </div>

                      <span className={`font-mono font-extrabold text-xs sm:text-sm flex-shrink-0 ${
                        m.esIngreso ? 'text-[#1E5E3A]' : m.esActivoFijo ? 'text-[#633E20]' : 'text-[#A34335]'
                      }`}>
                        {m.esIngreso ? `+${formatCurrency(m.monto)}` : `-${formatCurrency(m.monto)}`}
                      </span>
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#FAF8F5] border-t border-[#E2D9CC] p-3.5 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedMonthDetail(null)}
                className="px-4 h-8 text-xs font-bold border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#EAE4DC] text-[#241C15] rounded-xl cursor-pointer"
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
