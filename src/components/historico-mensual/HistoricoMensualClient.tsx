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
  Landmark,
  Package,
  Megaphone,
  Boxes,
  RotateCcw
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
  subcategoria?: string
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
  
  // Totales Dinámicos según Checklist Activo
  ingresosTotalesCalculados: number
  egresosTotalesCalculados: number
  flujoNetoCalculado: number
  margenCalculadoPct: number

  // Desglose de Ingresos
  ingresosVentasCobradas: number
  ingresosPrestamos: number
  ingresosServiciosDirectos: number
  
  // Desglose de Egresos
  egresosInsumosFilamentos: number
  egresosInsumosPackaging: number
  egresosInsumosAccesorios: number
  egresosInsumosOtros: number
  egresosServiciosLogistica: number
  egresosServiciosPauta: number
  egresosServiciosOtros: number
  egresosActivosFijosMaquinaria: number
  egresosAportesCapital: number
  
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

  // =========================================================================
  // ESTADO DEL CHECKLIST DE CONCEPTOS CONTABLES
  // =========================================================================
  // 1. Ingresos
  const [includeVentas, setIncludeVentas] = useState(true)
  const [includePrestamosIngreso, setIncludePrestamosIngreso] = useState(false)
  const [includeServiciosIngreso, setIncludeServiciosIngreso] = useState(true)

  // 2. Egresos
  const [includeActivosFijos, setIncludeActivosFijos] = useState(false) // Por defecto apagado para flujo operativo, pero activable
  const [includeFilamentos, setIncludeFilamentos] = useState(true)
  const [includePackaging, setIncludePackaging] = useState(true)
  const [includeAccesoriosInsumo, setIncludeAccesoriosInsumo] = useState(true)
  const [includeOtrosInsumos, setIncludeOtrosInsumos] = useState(true)
  const [includeLogisticaEnvios, setIncludeLogisticaEnvios] = useState(true)
  const [includePublicidadPauta, setIncludePublicidadPauta] = useState(true)
  const [includeServiciosGenerales, setIncludeServiciosGenerales] = useState(true)
  const [includeAporteCapitalEgreso, setIncludeAporteCapitalEgreso] = useState(false)

  // Presets Rápidos
  const applyPreset = (preset: 'OPERATIVO' | 'TOTAL_CON_MAQUINARIA' | 'SOLO_COMERCIAL' | 'TODO_MARCADO' | 'LIMPIAR') => {
    if (preset === 'OPERATIVO') {
      setIncludeVentas(true)
      setIncludePrestamosIngreso(false)
      setIncludeServiciosIngreso(true)
      setIncludeActivosFijos(false)
      setIncludeFilamentos(true)
      setIncludePackaging(true)
      setIncludeAccesoriosInsumo(true)
      setIncludeOtrosInsumos(true)
      setIncludeLogisticaEnvios(true)
      setIncludePublicidadPauta(true)
      setIncludeServiciosGenerales(true)
      setIncludeAporteCapitalEgreso(false)
    } else if (preset === 'TOTAL_CON_MAQUINARIA') {
      setIncludeVentas(true)
      setIncludePrestamosIngreso(true)
      setIncludeServiciosIngreso(true)
      setIncludeActivosFijos(true)
      setIncludeFilamentos(true)
      setIncludePackaging(true)
      setIncludeAccesoriosInsumo(true)
      setIncludeOtrosInsumos(true)
      setIncludeLogisticaEnvios(true)
      setIncludePublicidadPauta(true)
      setIncludeServiciosGenerales(true)
      setIncludeAporteCapitalEgreso(true)
    } else if (preset === 'SOLO_COMERCIAL') {
      setIncludeVentas(true)
      setIncludePrestamosIngreso(false)
      setIncludeServiciosIngreso(false)
      setIncludeActivosFijos(false)
      setIncludeFilamentos(true)
      setIncludePackaging(true)
      setIncludeAccesoriosInsumo(false)
      setIncludeOtrosInsumos(false)
      setIncludeLogisticaEnvios(false)
      setIncludePublicidadPauta(false)
      setIncludeServiciosGenerales(false)
      setIncludeAporteCapitalEgreso(false)
    } else if (preset === 'TODO_MARCADO') {
      setIncludeVentas(true)
      setIncludePrestamosIngreso(true)
      setIncludeServiciosIngreso(true)
      setIncludeActivosFijos(true)
      setIncludeFilamentos(true)
      setIncludePackaging(true)
      setIncludeAccesoriosInsumo(true)
      setIncludeOtrosInsumos(true)
      setIncludeLogisticaEnvios(true)
      setIncludePublicidadPauta(true)
      setIncludeServiciosGenerales(true)
      setIncludeAporteCapitalEgreso(true)
    } else if (preset === 'LIMPIAR') {
      setIncludeVentas(false)
      setIncludePrestamosIngreso(false)
      setIncludeServiciosIngreso(false)
      setIncludeActivosFijos(false)
      setIncludeFilamentos(false)
      setIncludePackaging(false)
      setIncludeAccesoriosInsumo(false)
      setIncludeOtrosInsumos(false)
      setIncludeLogisticaEnvios(false)
      setIncludePublicidadPauta(false)
      setIncludeServiciosGenerales(false)
      setIncludeAporteCapitalEgreso(false)
    }
  }

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Clasificador auxiliar de Egresos por subcategoría
  const classifyEgreso = (e: EgresoItem) => {
    const sub = (e.subcategoria || '').toLowerCase()
    const con = (e.itemConcepto || '').toLowerCase()

    if (e.categoria === 'ACTIVO_FIJO' || sub.includes('maquinaria') || con.includes('bambu') || con.includes('impresora') || con.includes('twotrees')) {
      return 'ACTIVO_FIJO'
    }
    if (sub.includes('filamento') || con.includes('pla') || con.includes('petg') || con.includes('resina') || con.includes('bobina')) {
      return 'FILAMENTOS'
    }
    if (sub.includes('caja') || sub.includes('plástico burbuja') || sub.includes('papel film') || sub.includes('stickers') || con.includes('caja') || con.includes('burbuja') || con.includes('empaque')) {
      return 'PACKAGING'
    }
    if (sub.includes('incienso') || sub.includes('vela led') || con.includes('vela') || con.includes('incienso')) {
      return 'ACCESORIOS_INSUMO'
    }
    if (sub.includes('logística') || sub.includes('envío') || con.includes('olva') || con.includes('shoppee') || con.includes('flete') || con.includes('delivery')) {
      return 'LOGISTICA_ENVIOS'
    }
    if (sub.includes('publicidad') || sub.includes('marketing') || con.includes('meta') || con.includes('pauta') || con.includes('ads')) {
      return 'PUBLICIDAD_PAUTA'
    }
    if (e.categoria === 'APORTE_CAPITAL' || sub.includes('aporte') || sub.includes('capital')) {
      return 'APORTE_CAPITAL'
    }
    if (e.categoria === 'SERVICIO' || sub.includes('servicio') || sub.includes('taller')) {
      return 'SERVICIOS_OTROS'
    }
    return 'INSUMOS_OTROS'
  }

  // Clasificador auxiliar de Ingresos directos
  const classifyIngresoDirecto = (i: IngresoDirectoItem) => {
    const cat = (i.categoria || '').toLowerCase()
    const con = (i.concepto || '').toLowerCase()
    if (cat.includes('préstamo') || cat.includes('prestamo') || cat.includes('financiamiento') || con.includes('préstamo') || con.includes('prestamo')) {
      return 'PRESTAMO'
    }
    return 'SERVICIO_DIRECTO'
  }

  // =========================================================================
  // MODELADO CONTABLE DINÁMICO EN TIEMPO REAL SEGÚN EL CHECKLIST
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
          
          ingresosTotalesCalculados: 0,
          egresosTotalesCalculados: 0,
          flujoNetoCalculado: 0,
          margenCalculadoPct: 0,
          
          ingresosVentasCobradas: 0,
          ingresosPrestamos: 0,
          ingresosServiciosDirectos: 0,
          
          egresosInsumosFilamentos: 0,
          egresosInsumosPackaging: 0,
          egresosInsumosAccesorios: 0,
          egresosInsumosOtros: 0,
          egresosServiciosLogistica: 0,
          egresosServiciosPauta: 0,
          egresosServiciosOtros: 0,
          egresosActivosFijosMaquinaria: 0,
          egresosAportesCapital: 0,
          
          movimientos: []
        }
      }
      return monthMap[key]
    }

    // 1. PROCESAR VENTAS Y CARTERA DE COBRANZAS
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

    // 2. PROCESAR COBRANZAS DE VENTAS EN CAJA EFECTIVA (CON CHECKLIST)
    ventas.forEach(v => {
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

            const isSingleFull = ((v.pagos?.length || 0) === 1 && v.saldoPendiente <= 0) || p.tipo === 'PAGO_TOTAL'
            const tipoLabel = isSingleFull ? 'Pago Total' : `Abono #${idx + 1}`

            pMonth.movimientos.push({
              id: `pago-${p.id || `${v.id}-${idx}`}`,
              fecha: p.fecha,
              tipo: 'INGRESO_VENTA',
              categoria: 'Ventas (Pedidos 3D)',
              subcategoria: 'Cobranza de Pedidos',
              concepto: `${tipoLabel}: ${v.producto?.nombreModelo || 'Producto 3D'} (x${v.cantidad})`,
              entidad: v.cliente,
              monto,
              esIngreso: true,
              incluidoEnCalculo: includeVentas,
              detalle: `${p.metodoPago || 'Yape'}${p.notas ? ` • ${p.notas}` : ''}${getMonthKey(v.fecha) < pMonthKey ? ` (Venta originada en ${monthNames[getMonthKey(v.fecha).split('-')[1]]})` : ''}`
            })
          }
        })
      } else if (v.montoPagado > 0) {
        const vMonthKey = getMonthKey(v.fecha)
        const vMonth = ensureMonth(vMonthKey)
        const monto = Number(v.montoPagado)
        
        vMonth.ingresosVentasCobradas += monto
        if (includeVentas) {
          vMonth.ingresosTotalesCalculados += monto
        }

        vMonth.movimientos.push({
          id: `v-${v.id}`,
          fecha: v.fecha,
          tipo: 'INGRESO_VENTA',
          categoria: 'Ventas (Pedidos 3D)',
          subcategoria: 'Venta Directa',
          concepto: `Venta: ${v.producto?.nombreModelo || 'Producto 3D'} (x${v.cantidad})`,
          entidad: v.cliente,
          monto,
          esIngreso: true,
          incluidoEnCalculo: includeVentas,
          detalle: 'Pago directo registrado en pedido'
        })
      }
    })

    // 3. PROCESAR INGRESOS DIRECTOS (PRÉSTAMOS / SERVICIOS CON CHECKLIST)
    ingresosDirectos.forEach(i => {
      if (i.monto > 0) {
        const iMonthKey = getMonthKey(i.fecha)
        const iMonth = ensureMonth(iMonthKey)
        const monto = Number(i.monto)
        const classification = classifyIngresoDirecto(i)

        let isIncluded = false
        if (classification === 'PRESTAMO') {
          iMonth.ingresosPrestamos += monto
          if (includePrestamosIngreso) {
            iMonth.ingresosTotalesCalculados += monto
            isIncluded = true
          }
        } else {
          iMonth.ingresosServiciosDirectos += monto
          if (includeServiciosIngreso) {
            iMonth.ingresosTotalesCalculados += monto
            isIncluded = true
          }
        }

        iMonth.movimientos.push({
          id: `ing-${i.id}`,
          fecha: i.fecha,
          tipo: classification === 'PRESTAMO' ? 'INGRESO_PRESTAMO' : 'INGRESO_SERVICIO',
          categoria: classification === 'PRESTAMO' ? 'Préstamos & Financiamiento' : 'Servicios Directos & Otros',
          subcategoria: i.categoria || 'Ingreso Directo',
          concepto: i.concepto,
          entidad: i.cliente || 'Taller',
          monto,
          esIngreso: true,
          incluidoEnCalculo: isIncluded,
          detalle: i.notas || i.metodoPago || undefined
        })
      }
    })

    // 4. PROCESAR EGRESOS (CON CLASIFICADOR Y CHECKLIST DETALLADO)
    egresos.forEach(e => {
      if (e.costoTotal > 0) {
        const eMonthKey = getMonthKey(e.createdAt)
        const eMonth = ensureMonth(eMonthKey)
        const costo = Number(e.costoTotal)
        const egType = classifyEgreso(e)

        let isIncluded = false
        let labelCategoria = 'Insumos'

        switch (egType) {
          case 'ACTIVO_FIJO':
            labelCategoria = 'Maquinaria & Activos Fijos'
            eMonth.egresosActivosFijosMaquinaria += costo
            if (includeActivosFijos) {
              eMonth.egresosTotalesCalculados += costo
              isIncluded = true
            }
            break
          case 'FILAMENTOS':
            labelCategoria = 'Filamentos (PLA/PETG)'
            eMonth.egresosInsumosFilamentos += costo
            if (includeFilamentos) {
              eMonth.egresosTotalesCalculados += costo
              isIncluded = true
            }
            break
          case 'PACKAGING':
            labelCategoria = 'Empaques & Cajas'
            eMonth.egresosInsumosPackaging += costo
            if (includePackaging) {
              eMonth.egresosTotalesCalculados += costo
              isIncluded = true
            }
            break
          case 'ACCESORIOS_INSUMO':
            labelCategoria = 'Accesorios de Insumo'
            eMonth.egresosInsumosAccesorios += costo
            if (includeAccesoriosInsumo) {
              eMonth.egresosTotalesCalculados += costo
              isIncluded = true
            }
            break
          case 'LOGISTICA_ENVIOS':
            labelCategoria = 'Logística & Envíos'
            eMonth.egresosServiciosLogistica += costo
            if (includeLogisticaEnvios) {
              eMonth.egresosTotalesCalculados += costo
              isIncluded = true
            }
            break
          case 'PUBLICIDAD_PAUTA':
            labelCategoria = 'Publicidad & Pauta'
            eMonth.egresosServiciosPauta += costo
            if (includePublicidadPauta) {
              eMonth.egresosTotalesCalculados += costo
              isIncluded = true
            }
            break
          case 'APORTE_CAPITAL':
            labelCategoria = 'Aportes de Capital'
            eMonth.egresosAportesCapital += costo
            if (includeAporteCapitalEgreso) {
              eMonth.egresosTotalesCalculados += costo
              isIncluded = true
            }
            break
          case 'SERVICIOS_OTROS':
            labelCategoria = 'Servicios Operativos'
            eMonth.egresosServiciosOtros += costo
            if (includeServiciosGenerales) {
              eMonth.egresosTotalesCalculados += costo
              isIncluded = true
            }
            break
          default:
            labelCategoria = 'Otros Insumos'
            eMonth.egresosInsumosOtros += costo
            if (includeOtrosInsumos) {
              eMonth.egresosTotalesCalculados += costo
              isIncluded = true
            }
            break
        }

        eMonth.movimientos.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: `EGRESO_${egType}`,
          categoria: labelCategoria,
          subcategoria: e.subcategoria || undefined,
          concepto: e.itemConcepto,
          entidad: e.persona || 'Taller',
          monto: costo,
          esIngreso: false,
          esActivoFijo: egType === 'ACTIVO_FIJO',
          incluidoEnCalculo: isIncluded,
          detalle: e.subcategoria ? `Subcat: ${e.subcategoria}` : undefined
        })
      }
    })

    // Ordenar cronológicamente
    const sorted = Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey))

    // 5. CÁLCULO FINAL DE FLUJO NETO Y RATIOS
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
    includePrestamosIngreso, 
    includeServiciosIngreso, 
    includeActivosFijos, 
    includeFilamentos, 
    includePackaging, 
    includeAccesoriosInsumo, 
    includeOtrosInsumos, 
    includeLogisticaEnvios, 
    includePublicidadPauta, 
    includeServiciosGenerales, 
    includeAporteCapitalEgreso
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

    // Conteo de filtros activos
    const totalFiltrosIngresos = (includeVentas ? 1 : 0) + (includePrestamosIngreso ? 1 : 0) + (includeServiciosIngreso ? 1 : 0)
    const totalFiltrosEgresos = (includeActivosFijos ? 1 : 0) + (includeFilamentos ? 1 : 0) + (includePackaging ? 1 : 0) + (includeAccesoriosInsumo ? 1 : 0) + (includeOtrosInsumos ? 1 : 0) + (includeLogisticaEnvios ? 1 : 0) + (includePublicidadPauta ? 1 : 0) + (includeServiciosGenerales ? 1 : 0) + (includeAporteCapitalEgreso ? 1 : 0)

    return {
      totalMeses,
      sumaFacturado,
      sumaIngresosCalculados,
      sumaEgresosCalculados,
      sumaFlujoNetoCalculado,
      margenGlobal,
      sumaSaldoPendienteActual,
      totalFiltrosIngresos,
      totalFiltrosEgresos,
      totalFiltrosActivos: totalFiltrosIngresos + totalFiltrosEgresos
    }
  }, [
    monthlyData, 
    includeVentas, 
    includePrestamosIngreso, 
    includeServiciosIngreso, 
    includeActivosFijos, 
    includeFilamentos, 
    includePackaging, 
    includeAccesoriosInsumo, 
    includeOtrosInsumos, 
    includeLogisticaEnvios, 
    includePublicidadPauta, 
    includeServiciosGenerales, 
    includeAporteCapitalEgreso
  ])

  // Filtrado de meses a mostrar si se selecciona un mes específico
  const displayedMonths = useMemo(() => {
    if (selectedMonthFilter === 'TODOS') return monthlyData
    return monthlyData.filter(m => m.monthKey === selectedMonthFilter)
  }, [monthlyData, selectedMonthFilter])

  // Mes de Agosto específico
  const agostoData = monthlyData.find(m => m.monthKey === '2026-08')

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO PRINCIPAL DEL MÓDULO HISTÓRICO                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FDFBF7] p-5 rounded-3xl border border-[#E2D9CC] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 rounded-2xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#633E20] shadow-sm">
              <History className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#241C15]">
              Histórico Mensual & Auditoría
            </h1>
            <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs font-extrabold px-3 py-1">
              {metricasHistoricas.totalFiltrosActivos} Filtros Activos
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#75695D] mt-1.5 max-w-3xl">
            Control contable histórico multimes. Selecciona qué conceptos de ingresos y egresos sumar al cálculo (ventas, préstamos, insumos por tags, servicios, maquinaria) y todos los indicadores se actualizarán en tiempo real.
          </p>
        </div>

        {/* Acciones y Toggle del Panel de Checklist */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className="h-9 px-3.5 text-xs font-bold border-[#D4BEA7] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#241C15] rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>{showFiltersPanel ? 'Ocultar Checklist' : 'Configurar Checklist'}</span>
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
      {/* 2. PANEL DE CONTROL DE INDICADORES (CHECKLIST DE CONCEPTOS CONTABLES)     */}
      {/* ========================================================================= */}
      {showFiltersPanel && (
        <Card className="bg-[#FFFFFF] border-[#D4BEA7] shadow-sm rounded-3xl p-5 sm:p-6 space-y-4 border-2">
          {/* Cabecera del Panel con Presets */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#E2D9CC]">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#A36F4C]" />
                <h2 className="text-sm sm:text-base font-extrabold text-[#241C15]">
                  Checklist de Conceptos: Elige qué sumar a los Indicadores
                </h2>
              </div>
              <p className="text-xs text-[#75695D] mt-0.5">
                Marca o desmarca los conceptos. Todos los KPI, gráficas y tablas mensuales se recalcularán al instante.
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
                Operativo Puro
              </button>
              <button
                type="button"
                onClick={() => applyPreset('TOTAL_CON_MAQUINARIA')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EFE5D8] text-[#633E20] hover:bg-[#E5D5C2] border border-[#D4BEA7] transition-colors cursor-pointer"
              >
                + Con Maquinaria (CAPEX)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('SOLO_COMERCIAL')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF8F5] text-[#241C15] hover:bg-[#F4EFEA] border border-[#E2D9CC] transition-colors cursor-pointer"
              >
                Solo Ventas vs Insumos
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

          {/* Grid de Checkboxes Dividido por Secciones Contables */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {/* SECCIÓN 1: INGRESOS (ENTRADAS DE DINERO) */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]/70">
                <span className="text-xs font-extrabold text-[#1E5E3A] uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4" />
                  Ingresos (Entradas)
                </span>
                <Badge variant="outline" className="text-[10px] font-bold bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]">
                  {metricasHistoricas.totalFiltrosIngresos} activos
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                {/* 1. Cobranzas de Ventas */}
                <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeVentas}
                    onChange={(e) => setIncludeVentas(e.target.checked)}
                    className="mt-0.5 rounded text-[#1E5E3A] focus:ring-[#1E5E3A] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-[#241C15] block">Ventas de Modelos 3D (Abonos)</span>
                    <span className="text-[11px] text-[#75695D]">Cobros y liquidaciones de pedidos</span>
                  </div>
                </label>

                {/* 2. Préstamos & Financiamiento */}
                <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includePrestamosIngreso}
                    onChange={(e) => setIncludePrestamosIngreso(e.target.checked)}
                    className="mt-0.5 rounded text-[#1E5E3A] focus:ring-[#1E5E3A] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-[#241C15] block">Préstamos & Financiamiento</span>
                    <span className="text-[11px] text-[#75695D]">Ingresos por préstamos bancarios / terceros</span>
                  </div>
                </label>

                {/* 3. Servicios Directos & Otros */}
                <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeServiciosIngreso}
                    onChange={(e) => setIncludeServiciosIngreso(e.target.checked)}
                    className="mt-0.5 rounded text-[#1E5E3A] focus:ring-[#1E5E3A] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-[#241C15] block">Servicios Directos & CAD</span>
                    <span className="text-[11px] text-[#75695D]">Diseños, reparaciones y ventas directas</span>
                  </div>
                </label>
              </div>
            </div>

            {/* SECCIÓN 2: EGRESOS - INSUMOS Y MATERIALES (POR TAGS) */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]/70">
                <span className="text-xs font-extrabold text-[#8C6D1F] uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4" />
                  Insumos (Tags de Taller)
                </span>
                <span className="text-[10px] text-[#75695D] font-mono">Materiales</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {/* 1. Filamentos */}
                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeFilamentos}
                    onChange={(e) => setIncludeFilamentos(e.target.checked)}
                    className="rounded text-[#8C6D1F] focus:ring-[#8C6D1F] cursor-pointer"
                  />
                  <span className="font-semibold text-[#241C15] flex-1">Filamentos (PLA, PETG, Resinas)</span>
                </label>

                {/* 2. Packaging */}
                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includePackaging}
                    onChange={(e) => setIncludePackaging(e.target.checked)}
                    className="rounded text-[#8C6D1F] focus:ring-[#8C6D1F] cursor-pointer"
                  />
                  <span className="font-semibold text-[#241C15] flex-1">Packaging (Cajas, Burbuja, Film, Stickers)</span>
                </label>

                {/* 3. Accesorios de Insumo */}
                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeAccesoriosInsumo}
                    onChange={(e) => setIncludeAccesoriosInsumo(e.target.checked)}
                    className="rounded text-[#8C6D1F] focus:ring-[#8C6D1F] cursor-pointer"
                  />
                  <span className="font-semibold text-[#241C15] flex-1">Accesorios de Insumo (Incienso, Velas LED)</span>
                </label>

                {/* 4. Otros Insumos */}
                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeOtrosInsumos}
                    onChange={(e) => setIncludeOtrosInsumos(e.target.checked)}
                    className="rounded text-[#8C6D1F] focus:ring-[#8C6D1F] cursor-pointer"
                  />
                  <span className="font-semibold text-[#241C15] flex-1">Otros Insumos y Repuestos menores</span>
                </label>
              </div>
            </div>

            {/* SECCIÓN 3: EGRESOS - SERVICIOS, ACTIVOS FIJOS Y CAPITAL */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]/70">
                <span className="text-xs font-extrabold text-[#A36F4C] uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="h-4 w-4" />
                  Servicios, Maquinaria & Capital
                </span>
                <span className="text-[10px] text-[#75695D] font-mono">Operativo/CAPEX</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {/* 1. Activos Fijos (Maquinaria) */}
                <label className={`flex items-start gap-2.5 p-2 rounded-xl transition-all cursor-pointer select-none ${includeActivosFijos ? 'bg-[#EFE5D8] border border-[#D4BEA7]' : 'hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC]'}`}>
                  <input
                    type="checkbox"
                    checked={includeActivosFijos}
                    onChange={(e) => setIncludeActivosFijos(e.target.checked)}
                    className="mt-0.5 rounded text-[#633E20] focus:ring-[#633E20] cursor-pointer"
                  />
                  <div>
                    <span className="font-extrabold text-[#633E20] block">Activos Fijos (Bambu Lab, Secadores)</span>
                    <span className="text-[11px] text-[#75695D]">Maquinaria y herramientas mayores (CAPEX)</span>
                  </div>
                </label>

                {/* 2. Logística y Envíos */}
                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeLogisticaEnvios}
                    onChange={(e) => setIncludeLogisticaEnvios(e.target.checked)}
                    className="rounded text-[#A36F4C] focus:ring-[#A36F4C] cursor-pointer"
                  />
                  <span className="font-semibold text-[#241C15] flex-1">Logística & Envíos (Olva, Shoppee)</span>
                </label>

                {/* 3. Publicidad y Pauta */}
                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#FFFFFF] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includePublicidadPauta}
                    onChange={(e) => setIncludePublicidadPauta(e.target.checked)}
                    className="rounded text-[#A36F4C] focus:ring-[#A36F4C] cursor-pointer"
                  />
                  <span className="font-semibold text-[#241C15] flex-1">Publicidad & Pauta Digital (Meta Ads)</span>
                </label>

                {/* 4. Servicios Generales / Aportes */}
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeServiciosGenerales}
                      onChange={(e) => setIncludeServiciosGenerales(e.target.checked)}
                      className="rounded text-[#A36F4C] focus:ring-[#A36F4C] cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-[#241C15]">Servicios Taller</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeAporteCapitalEgreso}
                      onChange={(e) => setIncludeAporteCapitalEgreso(e.target.checked)}
                      className="rounded text-[#A36F4C] focus:ring-[#A36F4C] cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-[#241C15]">Aportes Capital</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 3. INDICADORES DINÁMICOS GLOBALES SEGÚN EL CHECKLIST                      */}
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
            <span>{metricasHistoricas.totalFiltrosIngresos} de 3 conceptos de ingreso activos</span>
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
            <span>{metricasHistoricas.totalFiltrosEgresos} de 9 conceptos de egreso activos</span>
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
            <span>100% de los pedidos cobrados en caja</span>
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
      {/* 5. EVOLUCIÓN HISTÓRICA RECALCULADA SEGÚN EL CHECKLIST                    */}
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
              Comparativa mes a mes de ingresos y egresos según los conceptos activos en el checklist.
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
                          Ingresos (+)]
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

                    {/* Desglose de Conceptos Activos que sumaron en este Mes */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF8F5]/60 border border-[#E2D9CC]/60 text-xs text-[#75695D]">
                      <div className="flex justify-between items-center text-[#241C15] font-semibold pb-1 border-b border-[#E2D9CC]/50">
                        <span>Desglose de Conceptos en {m.mesCorto}:</span>
                        <span className="font-mono text-[11px] text-[#1E5E3A]">Margen: {m.margenCalculadoPct}%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span>Ventas Cobradas (Abonos):</span>
                        <span className="font-mono font-bold text-[#1E5E3A]">+{formatCurrency(m.ingresosVentasCobradas)}</span>
                      </div>

                      {includePrestamosIngreso && m.ingresosPrestamos > 0 && (
                        <div className="flex justify-between items-center text-[#1E5E3A]">
                          <span>Préstamos / Financiamiento:</span>
                          <span className="font-mono font-bold">+{formatCurrency(m.ingresosPrestamos)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span>Insumos & Materiales:</span>
                        <span className="font-mono font-semibold text-[#A36F4C]">-{formatCurrency(m.egresosInsumosFilamentos + m.egresosInsumosPackaging + m.egresosInsumosAccesorios + m.egresosInsumosOtros)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span>Servicios & Envíos / Pauta:</span>
                        <span className="font-mono font-semibold text-[#A36F4C]">-{formatCurrency(m.egresosServiciosLogistica + m.egresosServiciosPauta + m.egresosServiciosOtros)}</span>
                      </div>

                      {includeActivosFijos && m.egresosActivosFijosMaquinaria > 0 && (
                        <div className="flex justify-between items-center text-[#633E20] font-bold bg-[#EFE5D8]/50 p-1 rounded">
                          <span>Activos Fijos (Maquinaria):</span>
                          <span className="font-mono">-{formatCurrency(m.egresosActivosFijosMaquinaria)}</span>
                        </div>
                      )}
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
                  <TableHead className="text-[#1E5E3A] px-3 py-3 text-right">Préstamos (+)</TableHead>
                  <TableHead className="text-[#1E5E3A] px-3 py-3 text-right font-bold bg-[#EBF7EE]/40">Ingresos Tot. (+)</TableHead>
                  <TableHead className="text-[#A36F4C] px-3 py-3 text-right">Insumos (-)</TableHead>
                  <TableHead className="text-[#A36F4C] px-3 py-3 text-right">Servicios (-)</TableHead>
                  <TableHead className="text-[#633E20] px-3 py-3 text-right">Act. Fijos (-)</TableHead>
                  <TableHead className="text-[#633E20] px-3 py-3 text-right font-black bg-[#FAF8F5]">Egresos Tot. (-)</TableHead>
                  <TableHead className="text-[#1E5E3A] px-4 py-3 text-right font-black">Flujo Neto (=)</TableHead>
                  <TableHead className="text-[#241C15] px-3 py-3 text-center">Auditar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedMonths.map((m) => {
                  const isPos = m.flujoNetoCalculado >= 0
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

                      <TableCell className="px-3 py-3 text-right font-mono text-[#1E5E3A]">
                        {m.ingresosPrestamos > 0 ? `+${formatCurrency(m.ingresosPrestamos)}` : '—'}
                      </TableCell>

                      <TableCell className="px-3 py-3 text-right font-mono font-bold text-[#1E5E3A] bg-[#EBF7EE]/40">
                        +{formatCurrency(m.ingresosTotalesCalculados)}
                      </TableCell>

                      <TableCell className="px-3 py-3 text-right font-mono text-[#A36F4C]">
                        -{formatCurrency(m.egresosInsumosFilamentos + m.egresosInsumosPackaging + m.egresosInsumosAccesorios + m.egresosInsumosOtros)}
                      </TableCell>

                      <TableCell className="px-3 py-3 text-right font-mono text-[#A36F4C]">
                        -{formatCurrency(m.egresosServiciosLogistica + m.egresosServiciosPauta + m.egresosServiciosOtros)}
                      </TableCell>

                      <TableCell className="px-3 py-3 text-right font-mono text-[#633E20]">
                        {m.egresosActivosFijosMaquinaria > 0 ? formatCurrency(m.egresosActivosFijosMaquinaria) : '—'}
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

        {/* VISTA 3: Historial y Auditoría de Cuentas por Cobrar */}
        {viewMode === 'AUDITORIA_CARTERA' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E2D9CC] text-xs text-[#75695D]">
              <span className="font-bold text-[#241C15] block">Auditoría Histórica de Cartera y Recuperaciones por Mes:</span>
              Supervisa mes a mes cuánto quedó pendiente contra entrega, cuántos clientes adeudaban y las fechas en que fue liquidado.
            </div>

            <div className="space-y-3">
              {monthlyData.map((m) => (
                <div key={m.monthKey} className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2D9CC] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2D9CC]/70">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#A36F4C]" />
                      <span className="font-extrabold text-sm text-[#241C15]">{m.nombreMes}</span>
                      <Badge variant="outline" className="text-[10px] font-bold bg-[#FAF8F5] text-[#75695D] border-[#D4BEA7]">
                        {m.cantidadPedidos} pedidos
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-[#75695D]">Facturado:</span>{' '}
                        <strong className="font-mono text-[#241C15]">{formatCurrency(m.totalFacturadoVentas)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8C6D1F]">Faltó al Cierre:</span>{' '}
                        <strong className="font-mono text-[#8C6D1F]">S/ {m.saldoFaltoCobrarAlCierre.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#1E5E3A]">Recuperado:</span>{' '}
                        <strong className="font-mono text-[#1E5E3A]">+{formatCurrency(m.recuperadoEnMesesPosteriores)}</strong>
                      </div>
                    </div>
                  </div>

                  {m.clientesCartera.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {m.clientesCartera.map((c) => (
                        <div key={c.ventaId} className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-xs text-[#241C15] block truncate">{c.cliente}</span>
                              <span className="text-[10px] text-[#75695D] block truncate">{c.modelo} (x{c.cantidad})</span>
                            </div>
                            <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[9px] font-bold flex-shrink-0">
                              Saneado
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
                    <p className="text-xs text-[#75695D] italic">
                      No hubo saldos pendientes de cobranza en este período. 100% cobrado al momento de la venta.
                    </p>
                  )}
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
                            {m.categoria}
                          </Badge>
                          {!m.incluidoEnCalculo && (
                            <Badge variant="outline" className="text-[8px] bg-neutral-100 text-neutral-500 border-neutral-300">
                              Excluido por Checklist
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
