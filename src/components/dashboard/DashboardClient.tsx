'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  ComposedChart, 
  Bar, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts'
import { 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Wallet,
  RefreshCw,
  Trophy,
  Users,
  ShoppingBag,
  Package,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Plus,
  Activity,
  Sparkles,
  Layers,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Target
} from 'lucide-react'

import { CategoryFinancialBreakdownCard } from '@/components/dashboard/CategoryFinancialBreakdownCard'
import { AcquisitionChannelsCard } from '@/components/dashboard/AcquisitionChannelsCard'
import { ClienteDetalleDrawer } from '@/components/clientes/ClienteDetalleDrawer'
import { OperationalPulseBar } from '@/components/dashboard/OperationalPulseBar'
import { useBusiness } from '@/context/BusinessContext'
import { KpiExplainerModal } from '@/components/ui/KpiExplainerModal'
import { KpiInfoTrigger } from '@/components/ui/KpiInfoTrigger'
import { ExecutiveKpiRows } from '@/components/dashboard/ExecutiveKpiRows'
import { 
  DatePreset,
  DateRange, 
  getPresetDateRange, 
  getMonthYearDateRange, 
  isDateInRange, 
  formatFechaEvolucion, 
  MESES_ES 
} from '@/lib/date-utils'
import { formatCurrency, getInitials, formatClienteNombre } from '@/lib/utils'

// Tooltip interactivo para Margen por Pedido
function MargenTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const venta = Number(data.ventaTotal || 0)
    const costo = Number(data.costoProduccion || 0)
    const utilidad = Number(data.utilidad || 0)
    const margenPct = data.margenPct || 0

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl p-3.5 min-w-[220px] text-xs font-sans">
        <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2">
          <span className="font-semibold text-foreground">{formatFechaEvolucion(label, true)}</span>
          <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md tabular-nums">
            {margenPct}% margen
          </span>
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>Venta Total:</span>
            <span className="font-mono font-semibold text-foreground tabular-nums">S/ {venta.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Costo Insumos / Taller:</span>
            <span className="font-mono font-medium text-foreground/80 tabular-nums">S/ {costo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border/50 font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">Margen Neto:</span>
            <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
              +S/ {utilidad.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Tooltip para Curva Acumulada
function CurvaAcumuladaTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const ventas = Number(data.ventasAcum || 0)
    const costo = Number(data.costosAcum || 0)
    const utilidad = Number(data.utilidadAcum || (ventas - costo))
    const isNegative = utilidad < 0

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl p-3.5 min-w-[230px] text-xs font-sans">
        <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2">
          <span className="font-semibold text-foreground">{formatFechaEvolucion(label, true)}</span>
          <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border tabular-nums ${
            isNegative 
              ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' 
              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          }`}>
            {isNegative ? 'Margen Negativo' : 'Margen Acumulado'}
          </span>
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Venta Acumulada:
            </span>
            <span className="font-mono font-semibold text-foreground tabular-nums">S/ {ventas.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
              Costo Acumulado:
            </span>
            <span className="font-mono font-medium text-foreground/80 tabular-nums">S/ {costo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border/50 font-semibold">
            <span className={isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
              Utilidad Acumulada:
            </span>
            <span className={`font-mono text-sm tabular-nums ${
              isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {isNegative ? `-S/ ${Math.abs(utilidad).toFixed(2)}` : `+S/ ${utilidad.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export interface TopColorItem {
  id: string
  nombreColor: string
  codigoHex: string
  pedidosCount: number
  unidadesCount: number
  gramosTotal: number
  stockGramosActual: number
  alertaCritica: boolean
  porcentajeUso: number
}

export interface TopClienteItem {
  cliente: string
  totalComprado: number
  totalPagado: number
  saldoPendiente: number
  pedidosCount: number
  piezasCount: number
  porcentajeDelTotal: number
  canalPreferido: string | null
  ultimoPedidoFecha: string
}

export interface TopArticuloItem {
  id: string
  nombreModelo: string
  lineaCategoria: string
  imageUrl?: string | null
  unidadesVendidas: number
  totalFacturado: number
  pedidosCount: number
  precioPromedio: number
  porcentajeUnidades: number
  porcentajeFacturacion: number
  costoProduccionTotal?: number
  gananciaNeta?: number
  margenPorcentaje?: number
}

export interface CapacidadGastoData {
  saldoActualCaja: number
  totalBlindadoMes: number
  cuotaPrestamoMensual: number
  cuotaPrestamoPendiente?: number
  totalPagadoPrestamoMes?: number
  reservaCapexMensual: number
  gastosFijosTaller: number
  gastoDisponibleHoy: number
  gastoDisponibleProyectado: number
  pedidosProyectadosMes: number
  gananciaProyectadaMes: number
}

interface DashboardClientProps {
  kpis: {
    ingresosVentas: number
    costoFabricacionTotal: number
    costoCajasTotal?: number
    costoEnvioTotal?: number
    costoDirectoTotal?: number
    gananciaNeta: number
    margenPorcentaje: number
    markupPorcentaje?: number
    totalCobradoVentas: number
    saldoPorCobrar: number
    egresosTotales: number
    ticketPromedio: number
    totalIngresosDirectos: number
  }
  capacidadGasto?: CapacidadGastoData
  graficoEvolucion: { fecha: string; ingresos: number; costo: number; ganancia: number }[]
  graficoInversion: { name: string; value: number }[]
  cuentasPorCobrar?: any[]
  topColores?: TopColorItem[]
  topClientes?: TopClienteItem[]
  topArticulos?: TopArticuloItem[]
  rawVentas?: any[]
  rawInversiones?: any[]
  rawIngresosDirectos?: any[]
  rawFilamentos?: any[]
}

export function DashboardClient({ 
  kpis: initialKpis, 
  capacidadGasto: initialCapacidadGasto,
  topClientes: initialTopClientes = [],
  topArticulos: initialTopArticulos = [],
  rawVentas = [],
  rawInversiones = [],
  rawIngresosDirectos = [],
  rawFilamentos = [],
}: DashboardClientProps) {
  const router = useRouter()
  const { is3D } = useBusiness()

  // Default al Mes Actual (Este Mes)
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDateRange('ESTE_MES'))
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [chartMode, setChartMode] = useState<'DIARIO' | 'ACUMULADO'>('DIARIO')
  const [soloDiasConVentas, setSoloDiasConVentas] = useState(true)
  const [rankingArticulosMode, setRankingArticulosMode] = useState<'RENTABILIDAD' | 'VOLUMEN'>('RENTABILIDAD')
  const [rankingTab, setRankingTab] = useState<'CLIENTES' | 'ARTICULOS'>('CLIENTES')
  const [dashboardView, setDashboardView] = useState<'FINANZAS' | 'COMERCIAL' | 'INTEGRAL'>('FINANZAS')

  // Drawer de Detalle del Cliente
  const [selectedClienteDrawer, setSelectedClienteDrawer] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Modal de Auditoría y Explicación de KPIs
  const [selectedKpiExplainer, setSelectedKpiExplainer] = useState<string | null>(null)

  const handleOpenClienteDetalle = (cliente: string) => {
    setSelectedClienteDrawer(cliente)
    setDrawerOpen(true)
  }

  // 1. Filtrar ventas por rango de fecha
  const filteredVentas = useMemo(() => {
    if (!rawVentas || rawVentas.length === 0) return []
    return rawVentas.filter((v: any) => isDateInRange(v.fecha, dateRange.from, dateRange.to))
  }, [rawVentas, dateRange])

  // 2. Filtrar inversiones / egresos por rango de fecha
  const filteredInversiones = useMemo(() => {
    if (!rawInversiones || rawInversiones.length === 0) return []
    return rawInversiones.filter((inv: any) => isDateInRange(inv.fecha || inv.createdAt, dateRange.from, dateRange.to))
  }, [rawInversiones, dateRange])

  // 3. Filtrar ingresos directos por rango de fecha
  const filteredIngresosDirectos = useMemo(() => {
    if (!rawIngresosDirectos || rawIngresosDirectos.length === 0) return []
    return rawIngresosDirectos.filter((ing: any) => isDateInRange(ing.fecha, dateRange.from, dateRange.to))
  }, [rawIngresosDirectos, dateRange])

  // 4. Calcular KPIs dinámicamente según el período seleccionado
  const dynamicKpis = useMemo(() => {
    if (rawVentas.length === 0 && rawInversiones.length === 0) {
      const fallbackIngresos = Number(initialKpis.ingresosVentas || 0)
      const fallbackCostos = Number(initialKpis.costoDirectoTotal || initialKpis.costoFabricacionTotal || 0)
      const fallbackEgresos = Number(initialKpis.egresosTotales || 0)
      const fallbackGanancia = Number(initialKpis.gananciaNeta || 0)
      const fallbackDirectos = Number(initialKpis.totalIngresosDirectos || 0)
      const fallbackCobrado = Number(initialKpis.totalCobradoVentas || 0)
      const fallbackTotalIngresos = fallbackIngresos + fallbackDirectos
      const fallbackTotalEgresos = fallbackCostos + fallbackEgresos
      const fallbackUtilidadOperativa = fallbackTotalIngresos - fallbackTotalEgresos

      const fallbackMargen = fallbackIngresos > 0 ? (fallbackGanancia / fallbackIngresos) * 100 : 0
      const fallbackMarkup = fallbackCostos > 0 ? (fallbackGanancia / fallbackCostos) * 100 : 0

      return {
        ...initialKpis,
        margenPorcentaje: fallbackMargen,
        markupPorcentaje: fallbackMarkup,
        totalIngresosPeriodo: fallbackTotalIngresos,
        totalEgresosPeriodo: fallbackTotalEgresos,
        utilidadOperativa: fallbackUtilidadOperativa,
        margenOperativoPct: fallbackTotalIngresos > 0 ? (fallbackUtilidadOperativa / fallbackTotalIngresos) * 100 : 0,
        tasaCobranza: fallbackIngresos > 0 ? Math.min(100, (fallbackCobrado / fallbackIngresos) * 100) : 100,
        margenUnitarioPromedio: fallbackGanancia
      }
    }

    const ingresosVentas = filteredVentas.reduce((sum: number, v: any) => sum + Number(v.total || 0), 0)
    
    const costoFabricacionTotal = filteredVentas.reduce((sum: number, v: any) => {
      // Si el pedido tiene items desagregados
      if (Array.isArray(v.items) && v.items.length > 0) {
        return sum + v.items.reduce((iSum: number, it: any) => {
          const cUnit = it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0
            ? Number(it.costoBaseSnapshot)
            : (Number(it.producto?.costoBase) || 0)
          return iSum + (cUnit * Number(it.cantidad || 1))
        }, 0)
      }
      const costoBaseUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0 
        ? Number(v.costoBaseSnapshot) 
        : (Number(v.producto?.costoBase) || 0)
      return sum + (costoBaseUnit * Number(v.cantidad || 1))
    }, 0)

    const costoCajasTotal = filteredVentas.reduce((sum: number, v: any) => {
      if (v.costoTotalCajas != null) return sum + Number(v.costoTotalCajas)
      if (Array.isArray(v.cajas) && v.cajas.length > 0) {
        return sum + v.cajas.reduce((cSum: number, c: any) => cSum + Number(c.costoTotal || 0), 0)
      }
      return sum + Number(v.costoPackaging || 0)
    }, 0)

    const costoEnvioTotal = filteredVentas.reduce((sum: number, v: any) => sum + Number(v.costoEnvio || 0), 0)
    const costoDirectoTotal = costoFabricacionTotal + costoCajasTotal + costoEnvioTotal

    const gananciaNeta = ingresosVentas - costoDirectoTotal
    const margenPorcentaje = ingresosVentas > 0 ? (gananciaNeta / ingresosVentas) * 100 : 0
    const markupPorcentaje = costoDirectoTotal > 0 ? (gananciaNeta / costoDirectoTotal) * 100 : 0

    // Cobranzas efectivas dentro del período
    const totalCobradoVentas = rawVentas.reduce((sum: number, v: any) => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        const pagosEnRango = v.pagos.filter((p: any) => isDateInRange(p.fecha, dateRange.from, dateRange.to))
        return sum + pagosEnRango.reduce((pSum: number, p: any) => pSum + Number(p.monto || 0), 0)
      }
      if (isDateInRange(v.fecha, dateRange.from, dateRange.to)) {
        return sum + Number(v.montoPagado || 0)
      }
      return sum
    }, 0)

    const saldoPorCobrar = filteredVentas.reduce((sum: number, v: any) => sum + Number(v.saldoPendiente || 0), 0)
    const egresosTotales = filteredInversiones.reduce((sum: number, inv: any) => sum + Number(inv.costoTotal || 0), 0)
    const ticketPromedio = filteredVentas.length > 0 ? ingresosVentas / filteredVentas.length : 0
    const totalIngresosDirectos = filteredIngresosDirectos.reduce((sum: number, i: any) => sum + Number(i.monto || 0), 0)

    const totalIngresosPeriodo = ingresosVentas + totalIngresosDirectos
    const totalEgresosPeriodo = costoDirectoTotal + egresosTotales
    const utilidadOperativa = totalIngresosPeriodo - totalEgresosPeriodo
    const margenOperativoPct = totalIngresosPeriodo > 0 ? (utilidadOperativa / totalIngresosPeriodo) * 100 : 0
    const tasaCobranza = ingresosVentas > 0 ? Math.min(100, (totalCobradoVentas / ingresosVentas) * 100) : 100
    const margenUnitarioPromedio = filteredVentas.length > 0 ? gananciaNeta / filteredVentas.length : 0

    return {
      ingresosVentas,
      costoFabricacionTotal,
      costoCajasTotal,
      costoEnvioTotal,
      costoDirectoTotal,
      gananciaNeta,
      margenPorcentaje,
      markupPorcentaje,
      totalCobradoVentas,
      saldoPorCobrar,
      egresosTotales,
      ticketPromedio,
      totalIngresosDirectos,
      totalIngresosPeriodo,
      totalEgresosPeriodo,
      utilidadOperativa,
      margenOperativoPct,
      tasaCobranza,
      margenUnitarioPromedio
    }
  }, [filteredVentas, filteredInversiones, filteredIngresosDirectos, dateRange, rawVentas, rawInversiones, initialKpis])

  // Total de piezas despachadas o producidas en el período
  const totalPiezasPeriodo = useMemo(() => {
    return filteredVentas.reduce((sum: number, v: any) => sum + Number(v.cantidad || 1), 0)
  }, [filteredVentas])

  // 5. Capacidad de gasto calculada para el período
  const gasto = useMemo(() => {
    // El saldo de caja es un indicador de balance/stock acumulado hasta la fecha de corte seleccionada (dateRange.to).
    // La liquidez disponible en cuenta bancaria y caja física no se resetea a cero a inicio de mes; acumula los flujos históricos.
    let cobradoAcumulado = 0
    rawVentas.forEach((v: any) => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        v.pagos.forEach((p: any) => {
          if (isDateInRange(p.fecha, null, dateRange.to)) {
            cobradoAcumulado += Number(p.monto || 0)
          }
        })
      } else {
        if (isDateInRange(v.fecha, null, dateRange.to)) {
          cobradoAcumulado += Number(v.montoPagado || 0)
        }
      }
    })

    const directosAcumulados = rawIngresosDirectos.reduce((sum: number, i: any) => {
      return isDateInRange(i.fecha, null, dateRange.to) ? sum + Number(i.monto || 0) : sum
    }, 0)

    const egresosAcumulados = rawInversiones.reduce((sum: number, inv: any) => {
      return isDateInRange(inv.fecha || inv.createdAt, null, dateRange.to) ? sum + Number(inv.costoTotal || 0) : sum
    }, 0)

    const saldoActualCaja = Math.max(0, (cobradoAcumulado + directosAcumulados) - egresosAcumulados)
    const cuotaPrestamoMensual = initialCapacidadGasto?.cuotaPrestamoMensual ?? 388.68
    const reservaCapexMensual = initialCapacidadGasto?.reservaCapexMensual ?? 878.00
    const gastosFijosTaller = initialCapacidadGasto?.gastosFijosTaller ?? 111.00
    const totalBlindadoMes = initialCapacidadGasto?.totalBlindadoMes ?? (cuotaPrestamoMensual + reservaCapexMensual + gastosFijosTaller)
    const gastoDisponibleHoy = Math.max(0, saldoActualCaja - totalBlindadoMes)
    const margenUnitarioPromedio = dynamicKpis.ticketPromedio > 0 ? (dynamicKpis.gananciaNeta / Math.max(1, filteredVentas.length)) : 97.00
    const pedidosProyectadosMes = Math.max(8, Math.min(30, Math.round(filteredVentas.length / Math.max(1, 1)) || 18))
    const gananciaProyectadaMes = pedidosProyectadosMes * margenUnitarioPromedio
    const gastoDisponibleProyectado = Math.max(0, (saldoActualCaja + gananciaProyectadaMes) - totalBlindadoMes)

    return {
      saldoActualCaja,
      totalBlindadoMes,
      cuotaPrestamoMensual,
      cuotaPrestamoPendiente: initialCapacidadGasto?.cuotaPrestamoPendiente ?? 0,
      totalPagadoPrestamoMes: initialCapacidadGasto?.totalPagadoPrestamoMes ?? 0,
      reservaCapexMensual,
      gastosFijosTaller,
      gastoDisponibleHoy,
      gastoDisponibleProyectado,
      pedidosProyectadosMes,
      gananciaProyectadaMes
    }
  }, [dateRange.to, rawVentas, rawIngresosDirectos, rawInversiones, initialCapacidadGasto, dynamicKpis.ticketPromedio, dynamicKpis.gananciaNeta, filteredVentas.length])

  // 5.b Punto de Equilibrio (Break-Even Point) & Absorción de Costos Fijos
  const breakEven = useMemo(() => {
    const totalFijos = gasto.totalBlindadoMes || 1377.68
    const ganancia = dynamicKpis.gananciaNeta || 0
    const cobertura = totalFijos > 0 ? (ganancia / totalFijos) * 100 : 100
    const margenUnit = dynamicKpis.margenUnitarioPromedio > 0 ? dynamicKpis.margenUnitarioPromedio : 97
    const pedidosEquilibrio = Math.max(1, Math.ceil(totalFijos / margenUnit))
    const pedidosFaltantes = Math.max(0, pedidosEquilibrio - filteredVentas.length)
    const superavit = ganancia - totalFijos

    return {
      totalFijos,
      cobertura,
      pedidosEquilibrio,
      pedidosFaltantes,
      superavit
    }
  }, [gasto.totalBlindadoMes, dynamicKpis.gananciaNeta, dynamicKpis.margenUnitarioPromedio, filteredVentas.length])

  // 6. Métricas para el gráfico de Margen Real por Pedido & Curva Acumulada
  const metricasEvolucion = useMemo(() => {
    const timelineMap: Record<string, {
      ventaTotal: number
      costoProduccion: number
      utilidad: number
      pedidosCount: number
      pedidosDetalle?: { cliente: string; producto: string; total: number }[]
    }> = {}

    // Inicializar todos los días del período para rangos continuos
    if (dateRange.from && dateRange.to) {
      const [startYear, startMonth, startDay] = dateRange.from.split('-').map(Number)
      const [endYear, endMonth, endDay] = dateRange.to.split('-').map(Number)
      const curr = new Date(startYear, startMonth - 1, startDay)
      const end = new Date(endYear, endMonth - 1, endDay)

      const diffDays = Math.round((end.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays <= 60) {
        while (curr <= end) {
          const y = curr.getFullYear()
          const m = String(curr.getMonth() + 1).padStart(2, '0')
          const d = String(curr.getDate()).padStart(2, '0')
          timelineMap[`${y}-${m}-${d}`] = {
            ventaTotal: 0,
            costoProduccion: 0,
            utilidad: 0,
            pedidosCount: 0,
            pedidosDetalle: []
          }
          curr.setDate(curr.getDate() + 1)
        }
      }
    }

    filteredVentas.forEach((venta: any) => {
      const vDate = String(venta.fecha).split('T')[0]
      if (!timelineMap[vDate]) {
        timelineMap[vDate] = {
          ventaTotal: 0,
          costoProduccion: 0,
          utilidad: 0,
          pedidosCount: 0,
          pedidosDetalle: []
        }
      }

      let ventaCosto = 0
      if (Array.isArray(venta.items) && venta.items.length > 0) {
        ventaCosto = venta.items.reduce((sum: number, it: any) => {
          const cUnit = it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0
            ? Number(it.costoBaseSnapshot)
            : (Number(it.producto?.costoBase) || 0)
          return sum + (cUnit * Number(it.cantidad || 1))
        }, 0)
      } else {
        const costoBaseUnit = venta.costoBaseSnapshot != null && Number(venta.costoBaseSnapshot) > 0 
          ? Number(venta.costoBaseSnapshot) 
          : (Number(venta.producto?.costoBase) || 0)
        ventaCosto = costoBaseUnit * Number(venta.cantidad || 1)
      }

      const ventaCajas = Number(venta.costoTotalCajas != null ? venta.costoTotalCajas : (venta.costoPackaging || 0))
      const ventaEnvio = Number(venta.costoEnvio || 0)
      const ventaCostoTotal = ventaCosto + ventaCajas + ventaEnvio
      const ventaTotal = Number(venta.total || 0)

      timelineMap[vDate].costoProduccion += ventaCostoTotal
      timelineMap[vDate].ventaTotal += ventaTotal
      timelineMap[vDate].pedidosCount += 1
      if (!timelineMap[vDate].pedidosDetalle) {
        timelineMap[vDate].pedidosDetalle = []
      }
      timelineMap[vDate].pedidosDetalle.push({
        cliente: venta.cliente || 'Cliente sin nombre',
        producto: venta.nombreProductoSnapshot || venta.producto?.nombreModelo || 'Producto',
        total: ventaTotal
      })
    })

    const sortedEntries = Object.entries(timelineMap).sort((a, b) => a[0].localeCompare(b[0]))

    let acumVentas = 0
    let acumCostos = 0
    let acumUtilidad = 0

    return sortedEntries.map(([fecha, vals]) => {
      const ventaTotal = Number(vals.ventaTotal.toFixed(2))
      const costoProduccion = Number(vals.costoProduccion.toFixed(2))
      const utilidad = Number((ventaTotal - costoProduccion).toFixed(2))
      const margenPct = ventaTotal > 0 ? Math.round((utilidad / ventaTotal) * 100) : 0

      acumVentas += ventaTotal
      acumCostos += costoProduccion
      acumUtilidad += utilidad

      return {
        fecha,
        ventaTotal,
        costoProduccion,
        utilidad,
        margenPct,
        pedidosCount: vals.pedidosCount,
        pedidosDetalle: vals.pedidosDetalle || [],
        ventasAcum: Number(acumVentas.toFixed(2)),
        costosAcum: Number(acumCostos.toFixed(2)),
        utilidadAcum: Number(acumUtilidad.toFixed(2))
      }
    })
  }, [filteredVentas, dateRange])

  // Micro-Sparklines para los renglones ejecutivos
  const sparklineData = useMemo(() => {
    if (!metricasEvolucion || metricasEvolucion.length === 0) return undefined
    const slice = metricasEvolucion.slice(-14)
    return {
      ventas: slice.map(d => d.ventaTotal),
      margen: slice.map(d => Math.max(0, d.utilidad)),
      caja: slice.map(d => d.ventasAcum),
      cobertura: slice.map(d => Math.min(100, Math.round((d.utilidadAcum / (breakEven.totalFijos || 1)) * 100)))
    }
  }, [metricasEvolucion, breakEven.totalFijos])

  // Capital inmovilizado en stock (Filamentos disponibles en taller)
  const capitalInmovilizado = useMemo(() => {
    if (!rawFilamentos || rawFilamentos.length === 0) return 0
    return rawFilamentos.reduce((sum: number, f: any) => {
      const gramos = Number(f.stockGramos || 0)
      const costoBobina = Number(f.costoBobinaRef || 65)
      return sum + (gramos * (costoBobina / 1000))
    }, 0)
  }, [rawFilamentos])

  // 7. Top 5 Clientes en valor en el período seleccionado
  const topClientesDinamico = useMemo(() => {
    if (rawVentas.length === 0) return initialTopClientes

    const clientesMap: Record<string, {
      cliente: string
      totalComprado: number
      totalPagado: number
      saldoPendiente: number
      pedidosCount: number
      piezasCount: number
      canales: Record<string, number>
      ultimoPedidoFecha: string
    }> = {}

    filteredVentas.forEach((v: any) => {
      const rawCliente = (v.cliente || 'Cliente sin nombre').trim()
      const cKey = rawCliente.toLowerCase()

      if (!clientesMap[cKey]) {
        clientesMap[cKey] = {
          cliente: rawCliente,
          totalComprado: 0,
          totalPagado: 0,
          saldoPendiente: 0,
          pedidosCount: 0,
          piezasCount: 0,
          canales: {},
          ultimoPedidoFecha: String(v.fecha)
        }
      }

      const c = clientesMap[cKey]
      c.totalComprado += Number(v.total || 0)
      c.totalPagado += Number(v.montoPagado || 0)
      c.saldoPendiente += Number(v.saldoPendiente || 0)
      c.pedidosCount += 1
      c.piezasCount += Number(v.cantidad || 1)

      if (v.canalVenta) {
        c.canales[v.canalVenta] = (c.canales[v.canalVenta] || 0) + 1
      }

      const vFecha = String(v.fecha)
      if (new Date(vFecha).getTime() > new Date(c.ultimoPedidoFecha).getTime()) {
        c.ultimoPedidoFecha = vFecha
      }
    })

    const ingresosTotal = dynamicKpis.ingresosVentas

    return Object.values(clientesMap)
      .sort((a, b) => b.totalComprado - a.totalComprado || b.pedidosCount - a.pedidosCount)
      .slice(0, 5)
      .map((c) => {
        let canalPreferido: string | null = null
        let maxCount = 0
        Object.entries(c.canales).forEach(([canal, count]) => {
          if (count > maxCount) {
            maxCount = count
            canalPreferido = canal
          }
        })

        return {
          cliente: formatClienteNombre(c.cliente),
          totalComprado: Number(c.totalComprado.toFixed(2)),
          totalPagado: Number(c.totalPagado.toFixed(2)),
          saldoPendiente: Number(c.saldoPendiente.toFixed(2)),
          pedidosCount: c.pedidosCount,
          piezasCount: c.piezasCount,
          porcentajeDelTotal: ingresosTotal > 0 ? Number(((c.totalComprado / ingresosTotal) * 100).toFixed(1)) : 0,
          canalPreferido,
          ultimoPedidoFecha: c.ultimoPedidoFecha
        }
      })
  }, [filteredVentas, rawVentas, dynamicKpis.ingresosVentas, initialTopClientes])

  // 8. Top 5 Artículos Más Rentables en el período (Desagregados por producto individual del catálogo)
  const topArticulosDinamico = useMemo(() => {
    if (rawVentas.length === 0) return initialTopArticulos

    const articulosMap: Record<string, {
      id: string
      nombreModelo: string
      lineaCategoria: string
      imageUrl?: string | null
      unidadesVendidas: number
      totalFacturado: number
      costoProduccionTotal: number
      pedidosCount: number
    }> = {}

    let totalUnidades = 0

    filteredVentas.forEach((v: any) => {
      // Si el pedido tiene items desagregados, procesar cada producto individual
      if (Array.isArray(v.items) && v.items.length > 0) {
        v.items.forEach((it: any) => {
          const nombre = it.nombreModelo || it.nombreProductoSnapshot || it.producto?.nombreModelo || 'Artículo'
          const artKey = (it.productoId || nombre).trim().toLowerCase()
          const categoria = it.lineaCategoria || it.producto?.lineaCategoria || 'General'
          const cant = Number(it.cantidad || 1)
          const sub = Number(it.subtotal != null ? it.subtotal : (Number(it.precioUnitario || 0) * cant))
          const costoBaseUnit = it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0 
            ? Number(it.costoBaseSnapshot) 
            : (Number(it.producto?.costoBase) || 0)
          const costoProd = costoBaseUnit * cant
          const img = it.imagenUrl || it.producto?.imagenUrl || null

          if (!articulosMap[artKey]) {
            articulosMap[artKey] = {
              id: it.productoId || artKey,
              nombreModelo: nombre,
              lineaCategoria: categoria,
              imageUrl: img,
              unidadesVendidas: 0,
              totalFacturado: 0,
              costoProduccionTotal: 0,
              pedidosCount: 0
            }
          }

          articulosMap[artKey].unidadesVendidas += cant
          articulosMap[artKey].totalFacturado += sub
          articulosMap[artKey].costoProduccionTotal += costoProd
          articulosMap[artKey].pedidosCount += 1
          if (!articulosMap[artKey].imageUrl && img) {
            articulosMap[artKey].imageUrl = img
          }
          totalUnidades += cant
        })
      } else {
        // Fallback para venta individual
        const nombre = v.producto?.nombreModelo || v.nombreProductoSnapshot || 'Artículo'
        const artKey = (v.productoId || nombre).trim().toLowerCase()
        const categoria = v.producto?.lineaCategoria || 'General'
        const cant = Number(v.cantidad || 1)
        const sub = Number(v.total || 0)

        const costoBaseUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0 
          ? Number(v.costoBaseSnapshot) 
          : (Number(v.producto?.costoBase) || 0)
        const costoProd = costoBaseUnit * cant
        const img = v.producto?.imagenUrl || null

        if (!articulosMap[artKey]) {
          articulosMap[artKey] = {
            id: v.productoId || artKey,
            nombreModelo: nombre,
            lineaCategoria: categoria,
            imageUrl: img,
            unidadesVendidas: 0,
            totalFacturado: 0,
            costoProduccionTotal: 0,
            pedidosCount: 0
          }
        }

        articulosMap[artKey].unidadesVendidas += cant
        articulosMap[artKey].totalFacturado += sub
        articulosMap[artKey].costoProduccionTotal += costoProd
        articulosMap[artKey].pedidosCount += 1
        if (!articulosMap[artKey].imageUrl && img) {
          articulosMap[artKey].imageUrl = img
        }
        totalUnidades += cant
      }
    })

    const ingresosTotal = dynamicKpis.ingresosVentas

    return Object.values(articulosMap)
      .map((art) => {
        const gananciaNeta = Number((art.totalFacturado - art.costoProduccionTotal).toFixed(2))
        const margenPorcentaje = art.totalFacturado > 0 
          ? Number(((gananciaNeta / art.totalFacturado) * 100).toFixed(1)) 
          : 0

        return {
          id: art.id,
          nombreModelo: art.nombreModelo,
          lineaCategoria: art.lineaCategoria,
          imageUrl: art.imageUrl || null,
          unidadesVendidas: art.unidadesVendidas,
          totalFacturado: Number(art.totalFacturado.toFixed(2)),
          costoProduccionTotal: Number(art.costoProduccionTotal.toFixed(2)),
          gananciaNeta,
          margenPorcentaje,
          pedidosCount: art.pedidosCount,
          precioPromedio: art.unidadesVendidas > 0 ? Number((art.totalFacturado / art.unidadesVendidas).toFixed(2)) : 0,
          porcentajeUnidades: totalUnidades > 0 ? Number(((art.unidadesVendidas / totalUnidades) * 100).toFixed(1)) : 0,
          porcentajeFacturacion: ingresosTotal > 0 ? Number(((art.totalFacturado / ingresosTotal) * 100).toFixed(1)) : 0
        }
      })
      .sort((a, b) => {
        if (rankingArticulosMode === 'RENTABILIDAD') {
          return b.gananciaNeta - a.gananciaNeta || b.totalFacturado - a.totalFacturado
        }
        return b.unidadesVendidas - a.unidadesVendidas || b.totalFacturado - a.totalFacturado
      })
      .slice(0, 5)
  }, [filteredVentas, rawVentas, dynamicKpis.ingresosVentas, initialTopArticulos, rankingArticulosMode])

  // Navegador Temporal y Presets
  const now = new Date()
  const currentMonthName = MESES_ES[now.getMonth()]

  const handleSelectPreset = (preset: DatePreset) => {
    setDateRange(getPresetDateRange(preset))
  }

  // Navegar mes anterior / mes siguiente
  const handleNavigateMonth = (direction: -1 | 1) => {
    let year = now.getFullYear()
    let month = now.getMonth()
    if (dateRange.from) {
      const parts = dateRange.from.split('-').map(Number)
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        year = parts[0]
        month = parts[1] - 1
      }
    }
    const targetDate = new Date(year, month + direction, 1)
    const isCurrent = targetDate.getFullYear() === now.getFullYear() && targetDate.getMonth() === now.getMonth()
    if (isCurrent) {
      setDateRange(getPresetDateRange('ESTE_MES'))
    } else {
      setDateRange(getMonthYearDateRange(targetDate.getFullYear(), targetDate.getMonth() + 1))
    }
  }

  // Label del mes/año actual para el navegador principal (ej: "Octubre 2026")
  const monthNavLabel = useMemo(() => {
    if (dateRange.preset === 'ESTE_MES') {
      return `${currentMonthName} ${now.getFullYear()}`
    }
    if (dateRange.preset === 'MES_ANTERIOR') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return `${MESES_ES[prev.getMonth()]} ${prev.getFullYear()}`
    }
    if (dateRange.preset === 'ULTIMOS_3_MESES') {
      return 'Trimestre'
    }
    if (dateRange.preset === 'TODO') {
      return 'Histórico Completo'
    }
    if (dateRange.from && dateRange.to) {
      const [fromY, fromM, fromD] = dateRange.from.split('-').map(Number)
      const [toY, toM, toD] = dateRange.to.split('-').map(Number)
      if (fromY === toY && fromM === toM && fromD === 1) {
        const lastDay = new Date(fromY, fromM, 0).getDate()
        if (toD === lastDay) {
          return `${MESES_ES[fromM - 1]} ${fromY}`
        }
      }
      return `${formatFechaEvolucion(dateRange.from)} - ${formatFechaEvolucion(dateRange.to)}`
    }
    return `${currentMonthName} ${now.getFullYear()}`
  }, [dateRange, currentMonthName, now])

  const isCurrentMonthActive = useMemo(() => {
    if (dateRange.preset === 'ESTE_MES') return true
    if (!dateRange.from || !dateRange.to) return false
    const currPreset = getPresetDateRange('ESTE_MES')
    return dateRange.from === currPreset.from && dateRange.to === currPreset.to
  }, [dateRange])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  // Renderizado del Gráfico de Margen Real por Pedido
  const renderMargenChart = (data: any[]) => {
    const displayData = soloDiasConVentas ? data.filter(d => d.ventaTotal > 0) : data
    const chartData = displayData.length > 0 ? displayData : data

    return (
      <div className="h-full w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
            <XAxis 
              dataKey="fecha" 
              stroke="currentColor" 
              className="text-muted-foreground/60"
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              interval={chartData.length <= 10 ? 0 : 'preserveStartEnd'}
              minTickGap={32}
              tickFormatter={(val) => formatFechaEvolucion(val, false)}
              dy={4}
            />
            <YAxis 
              stroke="currentColor" 
              className="text-muted-foreground/60"
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip content={<MargenTooltip />} />
            <Legend 
              verticalAlign="top"
              content={() => (
                <div className="flex flex-wrap items-center justify-end gap-4 text-[11px] pb-2.5 text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block" />
                    <span>Utilidad Neta</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 bg-slate-400/50 rounded-xs inline-block" />
                    <span>Costo Insumos / Taller</span>
                  </div>
                </div>
              )}
            />
            {/* Costo de Producción (Base del pedido) */}
            <Bar 
              dataKey="costoProduccion" 
              name="Costo Producción" 
              stackId="venta" 
              fill="#94A3B8"
              fillOpacity={0.4} 
              radius={[0, 0, 0, 0]}
              maxBarSize={32}
            />
            {/* Utilidad Neta (Margen real generado) */}
            <Bar 
              dataKey="utilidad" 
              name="Utilidad Neta" 
              stackId="venta" 
              fill="#10B981" 
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Renderizado del Gráfico Acumulado
  const renderAcumuladoChart = (data: any[]) => (
    <div className="h-full w-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVentasAcum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="colorCostosAcum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-muted-foreground)" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="var(--color-muted-foreground)" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
          <XAxis 
            dataKey="fecha" 
            stroke="currentColor" 
            className="text-muted-foreground/60"
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            interval={data.length <= 10 ? 0 : 'preserveStartEnd'}
            minTickGap={32}
            tickFormatter={(val) => formatFechaEvolucion(val, false)}
            dy={4}
          />
          <YAxis 
            stroke="currentColor" 
            className="text-muted-foreground/60"
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `S/ ${val}`}
          />
          <Tooltip content={<CurvaAcumuladaTooltip />} />
          <Legend 
            verticalAlign="top"
            content={() => (
              <div className="flex flex-wrap items-center justify-end gap-3.5 text-[11px] pb-2 text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-xs inline-block" />
                  <span>Ventas Acumuladas</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-xs inline-block" />
                  <span>Costo Acumulado</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-3 h-0.5 bg-emerald-500 rounded-full inline-block" />
                  <span>Utilidad Neta Acum.</span>
                </div>
              </div>
            )}
          />
          <Area 
            type="monotone" 
            dataKey="ventasAcum" 
            name="Venta Acumulada" 
            stroke="var(--color-primary)" 
            strokeWidth={2}
            fill="url(#colorVentasAcum)" 
          />
          <Area 
            type="monotone" 
            dataKey="costosAcum" 
            name="Costo Acumulado" 
            stroke="var(--color-muted-foreground)" 
            strokeWidth={1.5}
            fill="url(#colorCostosAcum)" 
          />
          <Line 
            type="monotone" 
            dataKey="utilidadAcum" 
            name="Utilidad Acumulada" 
            stroke="#10B981" 
            strokeWidth={2.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. CABECERA MAESTRA MINIMALISTA Y SELECTOR DE FECHAS                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rendimiento comercial, márgenes netos y estado operativo.
          </p>
        </div>

        {/* Controles de Período Unificados (Sin duplicidades) */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-card border border-border/60 p-1 rounded-xl shadow-2xs">
          {/* Navegador Mensual: [<] [📅 Octubre 2026] [>] */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleNavigateMonth(-1)}
              title="Mes anterior"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('ESTE_MES')}
              title="Clic para volver al mes actual"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                dateRange.preset === 'ESTE_MES' || isCurrentMonthActive
                  ? 'bg-secondary text-foreground shadow-2xs'
                  : 'text-foreground hover:bg-muted/50'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{monthNavLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigateMonth(1)}
              title="Mes siguiente"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-border/60 mx-0.5" />

          {/* Horizontes Estratégicos */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => handleSelectPreset('ULTIMOS_3_MESES')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                dateRange.preset === 'ULTIMOS_3_MESES'
                  ? 'bg-secondary text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              Trimestre
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('TODO')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                dateRange.preset === 'TODO'
                  ? 'bg-secondary text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              Histórico
            </button>
          </div>

          <div className="h-4 w-px bg-border/60 mx-0.5" />

          {/* Botón Refrescar */}
          <button
            onClick={handleManualRefresh}
            title="Refrescar datos"
            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SALUD FINANCIERA EJECUTIVA (RENGLONES MINIMALISTAS DE ALTA DENSIDAD)   */}
      {/* ========================================================================= */}
      <ExecutiveKpiRows
        dynamicKpis={dynamicKpis}
        gasto={gasto}
        breakEven={breakEven}
        filteredVentasCount={filteredVentas.length}
        totalPiezasPeriodo={totalPiezasPeriodo}
        onInfoClick={setSelectedKpiExplainer}
        formatCurrency={formatCurrency}
        sparklineData={sparklineData}
        capitalInmovilizado={capitalInmovilizado}
      />

      {/* ========================================================================= */}
      {/* 2.b PULSO OPERATIVO UNIFICADO (TALLER 3D + LOGÍSTICA & SEGUIMIENTO)       */}
      {/* ========================================================================= */}
      <OperationalPulseBar 
        pedidos={rawVentas} 
        filamentos={rawFilamentos} 
        is3D={is3D}
        onOpenClienteDrawer={handleOpenClienteDetalle}
      />

      {/* ========================================================================= */}
      {/* 3. SELECTOR DE ENFOQUE ANALÍTICO (SEGMENTED CONTROL MINIMALISTA)          */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/50">
        <div className="inline-flex items-center p-0.5 rounded-xl bg-muted/40 border border-border/60 self-start">
          <button
            type="button"
            onClick={() => setDashboardView('FINANZAS')}
            aria-label="Finanzas y Flujo de Caja"
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              dashboardView === 'FINANZAS'
                ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span>Finanzas & Flujo</span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardView('COMERCIAL')}
            aria-label="Comercial y Clientes"
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              dashboardView === 'COMERCIAL'
                ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Comercial & Clientes</span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardView('INTEGRAL')}
            aria-label="Vista Completa"
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              dashboardView === 'INTEGRAL'
                ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Vista Completa</span>
          </button>
        </div>

        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          {dashboardView === 'FINANZAS' 
            ? 'Márgenes netos y desglose de caja del período' 
            : dashboardView === 'COMERCIAL' 
            ? 'Rankings de demanda y canales de captación' 
            : 'Módulos financieros y comerciales consolidados'}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 4. BLOQUE FINANCIERO (GRÁFICO DE MÁRGENES + DESGLOSE DE FONDOS Y COSTOS)  */}
      {/* ========================================================================= */}
      {(dashboardView === 'FINANZAS' || dashboardView === 'INTEGRAL') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Gráfico Margen Real por Pedido & Curva Acumulada (7 cols) */}
          <Card className="lg:col-span-7 bg-card border border-border/60 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between min-h-[420px]">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-foreground text-sm font-semibold tracking-tight">
                      {chartMode === 'DIARIO' ? 'Margen Real por Pedido' : 'Curva Acumulativa del Período'}
                    </CardTitle>
                    {chartMode === 'DIARIO' && (
                      <button
                        type="button"
                        onClick={() => setSoloDiasConVentas(!soloDiasConVentas)}
                        className="text-[10px] text-muted-foreground hover:text-foreground bg-muted/40 border border-border/50 px-2 py-0.5 rounded-md font-medium cursor-pointer transition-colors"
                        title="Alternar entre ver solo días con ventas o todo el calendario"
                      >
                        {soloDiasConVentas ? '⚡ Días con venta' : '📅 Todo el mes'}
                      </button>
                    )}
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    {chartMode === 'DIARIO' 
                      ? 'Costo de producción + ganancia neta día a día con curva de venta total' 
                      : 'Tendencia acumulada de facturación y margen neto del período'}
                  </CardDescription>
                </div>

                {/* Selector Simplificado: [ Margen Diario | Acumulado ] */}
                <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/40 border border-border/60 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setChartMode('DIARIO')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                      chartMode === 'DIARIO'
                        ? 'bg-card text-foreground font-semibold border border-border/50 shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Margen Diario
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('ACUMULADO')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                      chartMode === 'ACUMULADO'
                        ? 'bg-card text-foreground font-semibold border border-border/50 shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Acumulado
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-5 pt-3 flex-1 flex flex-col justify-center">
              {metricasEvolucion.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground italic">
                  No hay movimientos registrados en el período seleccionado.
                </div>
              ) : chartMode === 'DIARIO' ? (
                renderMargenChart(metricasEvolucion)
              ) : (
                renderAcumuladoChart(metricasEvolucion)
              )}
            </CardContent>
          </Card>

          {/* Distribución de Ingresos & Egresos (CategoryFinancialBreakdownCard) (5 cols) */}
          <div className="lg:col-span-5 h-full">
            <CategoryFinancialBreakdownCard
              ventas={filteredVentas}
              inversiones={filteredInversiones}
              ingresosDirectos={filteredIngresosDirectos}
              ticketPromedio={dynamicKpis.ticketPromedio}
              totalPedidos={filteredVentas.length}
              className="h-full min-h-[420px]"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BLOQUE DE INTELIGENCIA COMERCIAL & TALLER                              */}
      {/* ========================================================================= */}
      {(dashboardView === 'COMERCIAL' || dashboardView === 'INTEGRAL') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* RANKINGS DEL PERÍODO (6 cols): [ Top Clientes ] [ Top Artículos ] */}
          <Card className="lg:col-span-6 bg-card border border-border/60 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between min-h-[360px]">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                    Rankings del Período
                  </CardTitle>
                </div>

                {/* Selector de Rankings: [ Top Clientes | Top Artículos ] */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/40 border border-border/60 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRankingTab('CLIENTES')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        rankingTab === 'CLIENTES'
                          ? 'bg-card text-foreground font-semibold border border-border/50 shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Clientes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRankingTab('ARTICULOS')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        rankingTab === 'ARTICULOS'
                          ? 'bg-card text-foreground font-semibold border border-border/50 shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Artículos</span>
                    </button>
                  </div>

                  {rankingTab === 'CLIENTES' ? (
                    <Link
                      href="/pedidos"
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>Pedidos</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <Link
                      href="/catalogo"
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>Catálogo</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Sub-toggle para Artículos: Ganancia vs Unidades */}
              {rankingTab === 'ARTICULOS' && (
                <div className="flex items-center justify-between pt-2 text-[11px]">
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">
                    Ordenar por:
                  </span>
                  <div className="inline-flex items-center p-0.5 rounded-md bg-muted/30 border border-border/50">
                    <button
                      type="button"
                      onClick={() => setRankingArticulosMode('RENTABILIDAD')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                        rankingArticulosMode === 'RENTABILIDAD'
                          ? 'bg-card text-foreground font-semibold shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Ganancia
                    </button>
                    <button
                      type="button"
                      onClick={() => setRankingArticulosMode('VOLUMEN')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                        rankingArticulosMode === 'VOLUMEN'
                          ? 'bg-card text-foreground font-semibold shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Unidades
                    </button>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0 flex-1 divide-y divide-border/40">
              {rankingTab === 'CLIENTES' ? (
                topClientesDinamico.length === 0 ? (
                  <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
                    <Users className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                    <p>No hay compras registradas en este período.</p>
                  </div>
                ) : (
                  topClientesDinamico.map((c, index) => {
                    const rankClass = 
                      index === 0 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' :
                      index === 1 ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30' :
                      index === 2 ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30' :
                      'bg-muted/60 text-muted-foreground border-border/60'

                    return (
                      <div 
                        key={`${c.cliente}-${index}`}
                        onClick={() => handleOpenClienteDetalle(c.cliente)}
                        className="px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                        title={`Ver estado de cuenta de ${formatClienteNombre(c.cliente)}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-mono font-bold border shrink-0 ${rankClass}`}>
                            {index + 1}
                          </span>

                          <div className="w-8 h-8 rounded-full bg-muted border border-border/60 text-muted-foreground text-xs font-semibold flex items-center justify-center shrink-0 group-hover:border-primary/40 group-hover:text-primary transition-colors">
                            {getInitials(c.cliente)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors block">
                              {formatClienteNombre(c.cliente)}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate mt-0.5">
                              <span>{c.pedidosCount} {c.pedidosCount === 1 ? 'pedido' : 'pedidos'}</span>
                              <span>•</span>
                              <span>{c.piezasCount} piezas</span>
                              {c.canalPreferido && (
                                <>
                                  <span>•</span>
                                  <span className="px-1.5 py-0.2 rounded bg-secondary text-secondary-foreground text-[10px] font-medium border border-border/40">
                                    {c.canalPreferido}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-0.5">
                          <div className="text-xs sm:text-sm font-mono font-semibold text-foreground tabular-nums tracking-tight">
                            {formatCurrency(c.totalComprado)}
                          </div>
                          <div>
                            {c.saldoPendiente > 0 ? (
                              <span className="text-[10px] font-medium font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md inline-block tabular-nums">
                                Debe {formatCurrency(c.saldoPendiente)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-block">
                                Al día
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )
              ) : (
                topArticulosDinamico.length === 0 ? (
                  <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
                    <Package className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                    <p>No hay artículos despachados en este período.</p>
                  </div>
                ) : (
                  topArticulosDinamico.map((art, index) => {
                    const rankClass = 
                      index === 0 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' :
                      index === 1 ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30' :
                      index === 2 ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30' :
                      'bg-muted/60 text-muted-foreground border-border/60'

                    return (
                      <div 
                        key={`${art.id}-${index}`}
                        className="px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-mono font-bold border shrink-0 ${rankClass}`}>
                            {index + 1}
                          </span>

                          {art.imageUrl ? (
                            <img 
                              src={art.imageUrl} 
                              alt={art.nombreModelo} 
                              className="w-8 h-8 rounded-lg object-cover border border-border/60 shrink-0" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-muted border border-border/60 flex items-center justify-center shrink-0 text-muted-foreground">
                              <Package className="h-3.5 w-3.5 stroke-[1.5]" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-foreground leading-snug line-clamp-1 block" title={art.nombreModelo}>
                              {art.nombreModelo}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate mt-0.5">
                              <span>{art.unidadesVendidas} {art.unidadesVendidas === 1 ? 'ud' : 'uds'}</span>
                              <span>•</span>
                              <span className="font-mono">S/ {art.totalFacturado.toFixed(2)}</span>
                              {art.lineaCategoria && (
                                <>
                                  <span>•</span>
                                  <span className="px-1.5 py-0.2 rounded bg-secondary text-secondary-foreground text-[10px] font-medium border border-border/40">
                                    {art.lineaCategoria}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-0.5">
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono tracking-tight">
                            +{formatCurrency(art.gananciaNeta || 0)}
                          </div>
                          <div className="text-[10px] font-medium font-mono text-muted-foreground tabular-nums">
                            {art.margenPorcentaje != null ? `${art.margenPorcentaje.toFixed(0)}% margen` : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )
              )}
            </CardContent>
          </Card>

          {/* CANALES DE CAPTACIÓN (6 cols): Gráfico Donut (Círculo Pastel) + Rendimiento */}
          <div className="lg:col-span-6 h-full">
            <AcquisitionChannelsCard
              ventas={filteredVentas}
              ticketPromedio={dynamicKpis.ticketPromedio}
              totalPedidos={filteredVentas.length}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DRAWER DE DETALLE DEL CLIENTE & MODAL DE AUDITORÍA DE KPIS             */}
      {/* ========================================================================= */}
      <ClienteDetalleDrawer 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        clienteNombre={selectedClienteDrawer}
      />

      {/* Modal Explicador de Fórmulas y Transacciones de KPI */}
      <KpiExplainerModal
        isOpen={!!selectedKpiExplainer}
        onClose={() => setSelectedKpiExplainer(null)}
        kpiId={selectedKpiExplainer}
        from={dateRange.from}
        to={dateRange.to}
      />
    </div>
  )
}
