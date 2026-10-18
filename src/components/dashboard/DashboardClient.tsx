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
  RotateCcw
} from 'lucide-react'

import { CategoryFinancialBreakdownCard } from '@/components/dashboard/CategoryFinancialBreakdownCard'
import { ClienteDetalleDrawer } from '@/components/clientes/ClienteDetalleDrawer'
import { KpiExplainerModal } from '@/components/ui/KpiExplainerModal'
import { KpiInfoTrigger } from '@/components/ui/KpiInfoTrigger'
import { 
  DatePreset,
  DateRange, 
  getPresetDateRange, 
  getMonthYearDateRange, 
  isDateInRange, 
  formatFechaEvolucion, 
  MESES_ES 
} from '@/lib/date-utils'

// Obtener iniciales de un nombre
function getInitials(name: string) {
  if (!name) return 'CL'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Capitalizar nombres automáticamente (ej: "con rad" -> "Con Rad")
function formatClienteNombre(name: string) {
  if (!name) return 'Cliente'
  return name
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

// Tooltip interactivo para Margen por Pedido
function MargenTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const venta = Number(data.ventaTotal || 0)
    const costo = Number(data.costoProduccion || 0)
    const utilidad = Number(data.utilidad || 0)
    const margenPct = data.margenPct || 0

    return (
      <div className="bg-card border border-border/80 rounded-xl shadow-xl p-3 min-w-[210px] text-xs font-sans">
        <div className="flex items-center justify-between border-b border-border/60 pb-1.5 mb-2">
          <span className="font-bold text-foreground">{formatFechaEvolucion(label, true)}</span>
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            {margenPct}% margen
          </span>
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>Venta Total:</span>
            <span className="font-mono font-bold text-foreground">S/ {venta.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Costo de Filamento/Luz:</span>
            <span className="font-mono font-medium text-foreground/80">S/ {costo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-border/60 font-bold">
            <span className="text-emerald-700">Margen Neto:</span>
            <span className="font-mono text-sm text-emerald-700">
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
      <div className="bg-card border border-border/80 rounded-xl shadow-xl p-3 min-w-[220px] text-xs font-sans">
        <div className="flex items-center justify-between border-b border-border/60 pb-1.5 mb-2">
          <span className="font-bold text-foreground">{formatFechaEvolucion(label, true)}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            isNegative ? 'text-destructive bg-destructive/10' : 'text-emerald-800 bg-emerald-500/10'
          }`}>
            {isNegative ? 'Margen Negativo' : 'Margen Acumulado'}
          </span>
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A36F4C]" />
              Venta Acumulada:
            </span>
            <span className="font-mono font-bold text-foreground">S/ {ventas.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E2D9CC]" />
              Costo Acumulado:
            </span>
            <span className="font-mono font-medium text-foreground/80">S/ {costo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-border/60 font-bold">
            <span className="text-emerald-700">Utilidad Acumulada:</span>
            <span className={`font-mono text-sm ${isNegative ? 'text-destructive' : 'text-emerald-700'}`}>
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
}: DashboardClientProps) {
  const router = useRouter()

  // Default al Mes Actual (Este Mes)
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDateRange('ESTE_MES'))
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [chartMode, setChartMode] = useState<'DIARIO' | 'ACUMULADO'>('DIARIO')
  const [soloDiasConVentas, setSoloDiasConVentas] = useState(true)
  const [rankingArticulosMode, setRankingArticulosMode] = useState<'RENTABILIDAD' | 'VOLUMEN'>('RENTABILIDAD')

  // Drawer de Detalle del Cliente
  const [selectedClienteDrawer, setSelectedClienteDrawer] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Modal de Auditoría y Explicación de KPIs
  const [selectedKpiExplainer, setSelectedKpiExplainer] = useState<string | null>(null)

  const handleOpenClienteDetalle = (cliente: string) => {
    setSelectedClienteDrawer(cliente)
    setDrawerOpen(true)
  }

  const formatCurrency = (val: number) => 
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
      return initialKpis
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
    const margenPorcentaje = costoDirectoTotal > 0 ? (gananciaNeta / costoDirectoTotal) * 100 : 0

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

    return {
      ingresosVentas,
      costoFabricacionTotal,
      costoCajasTotal,
      costoEnvioTotal,
      costoDirectoTotal,
      gananciaNeta,
      margenPorcentaje,
      totalCobradoVentas,
      saldoPorCobrar,
      egresosTotales,
      ticketPromedio,
      totalIngresosDirectos
    }
  }, [filteredVentas, filteredInversiones, filteredIngresosDirectos, dateRange, rawVentas, rawInversiones, initialKpis])

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

  // Label de visualización del período activo
  const activeDateLabel = useMemo(() => {
    if (dateRange.preset === 'ESTE_MES') {
      return `Este Mes (${currentMonthName})`
    }
    if (dateRange.preset === 'MES_ANTERIOR') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return `Mes Anterior (${MESES_ES[prev.getMonth()]})`
    }
    if (dateRange.preset === 'ULTIMOS_3_MESES') {
      return 'Trimestre'
    }
    if (dateRange.preset === 'TODO') {
      return 'Histórico'
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
    return 'Este Mes'
  }, [dateRange, currentMonthName])

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
            <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" vertical={false} opacity={0.6} />
            <XAxis 
              dataKey="fecha" 
              stroke="#75695D" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#E2D9CC' }}
              interval={chartData.length <= 10 ? 0 : 'preserveStartEnd'}
              minTickGap={32}
              tickFormatter={(val) => formatFechaEvolucion(val, false)}
              dy={4}
            />
            <YAxis 
              stroke="#75695D" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip content={<MargenTooltip />} />
            <Legend 
              verticalAlign="top"
              content={() => (
                <div className="flex flex-wrap items-center justify-end gap-3.5 text-[11px] pb-2 text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 bg-emerald-700 rounded-xs inline-block" />
                    <span>Utilidad Neta</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 bg-[#E2D9CC] rounded-xs inline-block border border-border/80" />
                    <span>Costo Producción</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-primary">
                    <span className="w-3.5 h-0.5 bg-primary rounded-full inline-block" />
                    <span>Venta Total</span>
                  </div>
                </div>
              )}
            />
            {/* Costo de Producción en Beige NOVA #E2D9CC */}
            <Bar 
              dataKey="costoProduccion" 
              name="Costo Producción" 
              stackId="venta" 
              fill="#E2D9CC" 
              radius={[0, 0, 0, 0]}
              maxBarSize={32}
            />
            {/* Utilidad Neta en Verde Esmeralda #047857 (emerald-700) */}
            <Bar 
              dataKey="utilidad" 
              name="Utilidad Neta" 
              stackId="venta" 
              fill="#047857" 
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            {/* Venta Total en Terracota #A36F4C */}
            <Line 
              type="monotone" 
              dataKey="ventaTotal" 
              name="Venta Total" 
              stroke="#A36F4C" 
              strokeWidth={2} 
              dot={{ r: 3, fill: '#A36F4C', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#A36F4C', stroke: '#FFFFFF', strokeWidth: 2 }}
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
              <stop offset="5%" stopColor="#A36F4C" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#A36F4C" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="colorCostosAcum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E2D9CC" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#E2D9CC" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" vertical={false} opacity={0.6} />
          <XAxis 
            dataKey="fecha" 
            stroke="#75695D" 
            fontSize={11} 
            tickLine={false} 
            axisLine={{ stroke: '#E2D9CC' }}
            interval={data.length <= 10 ? 0 : 'preserveStartEnd'}
            minTickGap={32}
            tickFormatter={(val) => formatFechaEvolucion(val, false)}
            dy={4}
          />
          <YAxis 
            stroke="#75695D" 
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
                <div className="flex items-center gap-1.5 font-medium text-primary">
                  <span className="w-2.5 h-2.5 bg-primary rounded-xs inline-block" />
                  <span>Ventas Acumuladas</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 bg-[#E2D9CC] rounded-xs inline-block border border-border" />
                  <span>Costo Acumulado</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <span className="w-3.5 h-0.5 bg-emerald-700 rounded-full inline-block" />
                  <span>Utilidad Neta Acum.</span>
                </div>
              </div>
            )}
          />
          <Area 
            type="monotone" 
            dataKey="ventasAcum" 
            name="Venta Acumulada" 
            stroke="#A36F4C" 
            strokeWidth={2}
            fill="url(#colorVentasAcum)" 
          />
          <Area 
            type="monotone" 
            dataKey="costosAcum" 
            name="Costo Acumulado" 
            stroke="#C4B8A9" 
            strokeWidth={1.5}
            fill="url(#colorCostosAcum)" 
          />
          <Line 
            type="monotone" 
            dataKey="utilidadAcum" 
            name="Utilidad Acumulada" 
            stroke="#047857" 
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
      {/* 1. CABECERA MAESTRA CON NAVEGADOR TEMPORAL Y PRESETS RÁPIDOS              */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            DASHBOARD: Rendimiento Comercial & Taller
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Métricas de facturación, márgenes reales y rentabilidad del taller.
          </p>
        </div>

        {/* Controles de Período y Enlaces */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          
          {/* Navegador Temporal Maestro [ < Este Mes (Octubre) > ] */}
          <div className="inline-flex items-center bg-card border border-border rounded-xl h-9 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => handleNavigateMonth(-1)}
              title="Mes anterior"
              className="h-full px-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="px-2.5 py-1 text-xs font-bold text-foreground border-x border-border/70 flex items-center gap-1.5 whitespace-nowrap">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{activeDateLabel}</span>
            </div>

            <button
              type="button"
              onClick={() => handleNavigateMonth(1)}
              title="Mes siguiente"
              className="h-full px-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Presets Rápidos: [ Este Mes | Mes Anterior | Trimestre | Histórico ] */}
          <div className="hidden sm:inline-flex items-center p-0.5 rounded-xl bg-secondary border border-border/70 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectPreset('ESTE_MES')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateRange.preset === 'ESTE_MES'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('MES_ANTERIOR')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateRange.preset === 'MES_ANTERIOR'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mes Anterior
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('ULTIMOS_3_MESES')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateRange.preset === 'ULTIMOS_3_MESES'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Trimestre
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('TODO')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateRange.preset === 'TODO'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Histórico
            </button>
          </div>

          {/* Refrescar */}
          <button
            onClick={handleManualRefresh}
            title="Refrescar datos"
            className="p-2 rounded-xl bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </button>

          {/* Botón Flujo de Caja → */}
          <Link
            href="/finanzas/flujo-caja"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-card hover:bg-secondary text-foreground border border-border shadow-xs transition-all cursor-pointer"
          >
            <span>Flujo de Caja</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GRID DE 4 TARJETAS DE KPIS PRINCIPALES (CON AUDITORÍA Y EXPLICADOR)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Facturación del Período */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground truncate">Facturación del Período</span>
              <KpiInfoTrigger
                onClick={() => setSelectedKpiExplainer('facturacion_periodo')}
                title="Ver fórmula y desglose de pedidos facturados"
              />
            </div>
            <div className="p-1.5 rounded-lg bg-secondary text-primary shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-foreground tracking-tight tabular-nums">
              {formatCurrency(dynamicKpis.ingresosVentas)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                +{dynamicKpis.margenPorcentaje.toFixed(1)}% margen
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground truncate">
                +{formatCurrency(dynamicKpis.gananciaNeta)} util.
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Gasto Disponible Libre */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground truncate">Gasto Libre Disponible</span>
              <KpiInfoTrigger
                onClick={() => setSelectedKpiExplainer('gasto_libre_disponible')}
                title="Ver fórmula y cálculo de liquidez menos fondos blindados"
              />
            </div>
            <div className={`p-1.5 rounded-lg shrink-0 ${gasto.gastoDisponibleHoy > 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black font-mono tracking-tight tabular-nums ${gasto.gastoDisponibleHoy > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {formatCurrency(gasto.gastoDisponibleHoy)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground truncate">
              <span>Caja: {formatCurrency(gasto.saldoActualCaja)}</span>
              <span>•</span>
              <span title={`Blindado: ${formatCurrency(gasto.totalBlindadoMes)}`}>
                Blindado: {formatCurrency(gasto.totalBlindadoMes)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Total Cobrado */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground truncate">Total Cobrado</span>
              <KpiInfoTrigger
                onClick={() => setSelectedKpiExplainer('total_cobrado')}
                title="Ver fórmula y desglose de cobros recibidos"
              />
            </div>
            <div className="p-1.5 rounded-lg bg-secondary text-primary shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-foreground tracking-tight tabular-nums">
              {formatCurrency(dynamicKpis.totalCobradoVentas)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground truncate">
              {dynamicKpis.saldoPorCobrar > 0 ? (
                <span className="text-amber-700 font-bold">
                  Por cobrar: {formatCurrency(dynamicKpis.saldoPorCobrar)}
                </span>
              ) : (
                <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                  ✓ Cuentas 100% al día
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 4: Ticket Promedio */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground truncate">Ticket Promedio</span>
              <KpiInfoTrigger
                onClick={() => setSelectedKpiExplainer('ticket_promedio')}
                title="Ver fórmula y división por cantidad de pedidos"
              />
            </div>
            <div className="p-1.5 rounded-lg bg-secondary text-primary shrink-0">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-foreground tracking-tight tabular-nums">
              {formatCurrency(dynamicKpis.ticketPromedio)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground truncate">
              <span>Costo dir: {formatCurrency(dynamicKpis.costoDirectoTotal || dynamicKpis.costoFabricacionTotal)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. ZONA CENTRAL: 2 COLUMNAS EQUILIBRADAS                                   */}
      {/*    Columna 1: Margen Real por Pedido                                      */}
      {/*    Columna 2: Canales de Venta & Familias (SalesMixCard)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        
        {/* Columna Izquierda: Gráfico Margen Real por Pedido */}
        <Card className="bg-card border-border/70 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-foreground text-sm sm:text-base font-bold">
                    {chartMode === 'DIARIO' ? 'Margen Real por Pedido' : 'Curva Acumulativa del Período'}
                  </CardTitle>
                  {chartMode === 'DIARIO' && (
                    <button
                      type="button"
                      onClick={() => setSoloDiasConVentas(!soloDiasConVentas)}
                      className="text-[10px] text-primary hover:text-primary/80 bg-secondary border border-border/70 px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors"
                      title="Alternar entre ver solo días con ventas o todo el calendario"
                    >
                      {soloDiasConVentas ? '⚡ Días con venta' : '📅 Todo el mes'}
                    </button>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  {chartMode === 'DIARIO' 
                    ? 'Barras apiladas de costo + ganancia neta día a día con curva de venta total' 
                    : 'Tendencia acumulada de facturación y margen neto del período'}
                </CardDescription>
              </div>

              {/* Selector Simplificado: [ Margen Diario | Acumulado ] */}
              <div className="inline-flex items-center p-0.5 rounded-xl bg-secondary border border-border/70 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartMode('DIARIO')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    chartMode === 'DIARIO'
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Margen Diario
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('ACUMULADO')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    chartMode === 'ACUMULADO'
                      ? 'bg-primary text-primary-foreground shadow-2xs'
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

        {/* Columna Derecha: Distribución de Ingresos & Egresos (CategoryFinancialBreakdownCard) */}
        <CategoryFinancialBreakdownCard
          ventas={filteredVentas}
          inversiones={filteredInversiones}
          ingresosDirectos={filteredIngresosDirectos}
          ticketPromedio={dynamicKpis.ticketPromedio}
          totalPedidos={filteredVentas.length}
          className="h-full min-h-[380px]"
        />

      </div>

      {/* ========================================================================= */}
      {/* 4. RANKINGS ESTRATÉGICOS (TOP CLIENTES & TOP ARTÍCULOS CON FOTO REAL)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        
        {/* TOP CLIENTES EN VALOR */}
        <Card className="bg-card border-border/70 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                  Top Clientes en Valor
                </CardTitle>
              </div>
              <Link
                href="/pedidos"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 hover:underline"
              >
                <span>Ver pedidos</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 divide-y divide-border/60">
            {topClientesDinamico.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
                <Users className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                <p>No hay compras registradas en este período.</p>
              </div>
            ) : (
              topClientesDinamico.map((c, index) => (
                <div 
                  key={`${c.cliente}-${index}`}
                  onClick={() => handleOpenClienteDetalle(c.cliente)}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-secondary/50 transition-colors cursor-pointer group"
                  title={`Ver estado de cuenta de ${formatClienteNombre(c.cliente)}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-bold text-muted-foreground w-4 text-center shrink-0">
                      {index + 1}
                    </span>

                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border/70 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors">
                      {getInitials(c.cliente)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {formatClienteNombre(c.cliente)}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {c.pedidosCount} {c.pedidosCount === 1 ? 'pedido' : 'pedidos'} • {c.piezasCount} piezas
                        {c.canalPreferido && ` • ${c.canalPreferido}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    <div className="text-xs sm:text-sm font-mono font-bold text-foreground tabular-nums">
                      {formatCurrency(c.totalComprado)}
                    </div>
                    <div>
                      {c.saldoPendiente > 0 ? (
                        <span className="text-[10px] font-bold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-full inline-block">
                          Debe {formatCurrency(c.saldoPendiente)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
                          Al día
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* TOP ARTÍCULOS MÁS RENTABLES (CON FOTOS REALES Y PRODUCTOS DESAGREGADOS) */}
        <Card className="bg-card border-border/70 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                  Top Artículos Más Rentables
                </CardTitle>
              </div>

              {/* Selector de ordenamiento: Rentabilidad vs Volumen */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center p-0.5 rounded-xl bg-secondary border border-border/70 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRankingArticulosMode('RENTABILIDAD')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      rankingArticulosMode === 'RENTABILIDAD'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    💰 Ganancia
                  </button>
                  <button
                    type="button"
                    onClick={() => setRankingArticulosMode('VOLUMEN')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      rankingArticulosMode === 'VOLUMEN'
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    📦 Unidades
                  </button>
                </div>

                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 hover:underline shrink-0"
                >
                  <span>Catálogo</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 divide-y divide-border/60">
            {topArticulosDinamico.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
                <Package className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                <p>No hay artículos despachados en este período.</p>
              </div>
            ) : (
              topArticulosDinamico.map((art, index) => (
                <div 
                  key={`${art.id}-${index}`}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-bold text-muted-foreground w-4 text-center shrink-0">
                      {index + 1}
                    </span>

                    {/* Miniatura Fotográfica Real o Cubo 3D en bg-secondary */}
                    {art.imageUrl ? (
                      <img 
                        src={art.imageUrl} 
                        alt={art.nombreModelo} 
                        className="w-10 h-10 rounded-lg object-cover border border-border/70 shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-secondary border border-border/70 flex items-center justify-center shrink-0 text-muted-foreground">
                        <Package className="h-5 w-5 stroke-[1.5]" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-1" title={art.nombreModelo}>
                        {art.nombreModelo}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {art.unidadesVendidas} {art.unidadesVendidas === 1 ? 'unidad vendida' : 'unidades vendidas'} • Ventas: {formatCurrency(art.totalFacturado)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    <div className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 tabular-nums font-mono">
                      +{formatCurrency(art.gananciaNeta || 0)}
                    </div>
                    <div className="text-[10px] font-medium text-muted-foreground">
                      {art.margenPorcentaje != null ? `${art.margenPorcentaje.toFixed(0)}% margen` : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 5. DRAWER DE DETALLE DEL CLIENTE & MODAL DE AUDITORÍA DE KPIS             */}
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
