'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Clock, 
  Search, 
  X,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ShoppingBag,
  Truck,
  DollarSign,
  TrendingUp,
  Activity,
  ShieldCheck,
  Zap,
  Calendar,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react'
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
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

interface FlujoCajaClientProps {
  egresos: EgresoItem[]
  ventas: VentaItem[]
  ingresosDirectos?: IngresoDirectoItem[]
}

const ITEMS_PER_PAGE = 5

// Custom Tooltip for Evolution Chart
function CustomCashFlowTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const isNetPositive = (data.ingresos || 0) >= (data.egresos || 0)
    const neto = (data.ingresos || 0) - (data.egresos || 0)

    return (
      <div className="bg-[#FFFFFF]/95 backdrop-blur-md border border-[#E2D9CC] p-4 rounded-2xl shadow-xl min-w-[240px] text-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2D9CC]/70">
          <span className="font-bold text-[#241C15] flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-[#A36F4C]" />
            {data.fechaCompleta || label}
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
              Ingresos Cobrados:
            </span>
            <span className="font-mono font-bold">+S/ {Number(data.ingresos || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-[#A36F4C] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A36F4C]" />
              Egresos / Gastos:
            </span>
            <span className="font-mono font-bold">-S/ {Number(data.egresos || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="pt-2 mt-2 border-t border-[#E2D9CC] flex justify-between items-center bg-[#FAF8F5] p-2 rounded-xl">
            <span className="font-bold text-[#241C15] flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5 text-[#241C15]" />
              Saldo en Cuenta:
            </span>
            <span className="font-mono font-extrabold text-[#241C15] text-sm">
              S/ {Number(data.saldoAcumulado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function FlujoCajaClient({ 
  egresos, 
  ventas, 
  ingresosDirectos = [] 
}: FlujoCajaClientProps) {
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'INGRESOS' | 'EGRESOS'>('TODOS')
  const [periodFilter, setPeriodFilter] = useState<'HISTORICO' | '30_DIAS' | 'ESTE_MES'>('HISTORICO')
  const [currentPage, setCurrentPage] = useState(1)

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Financial Metrics Calculation
  const totalIngresosVentas = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
  }, [ventas])

  const totalIngresosDirectos = useMemo(() => {
    return ingresosDirectos.reduce((acc, i) => acc + (i.monto || 0), 0)
  }, [ingresosDirectos])

  const totalIngresosTotales = totalIngresosVentas + totalIngresosDirectos

  const totalSaldosPorCobrar = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0)
  }, [ventas])

  const totalEgresosMaquinaria = useMemo(() => {
    return egresos
      .filter(e => e.categoria === 'ACTIVO_FIJO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [egresos])

  const totalEgresosInsumos = useMemo(() => {
    return egresos
      .filter(e => e.categoria === 'INSUMO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [egresos])

  const totalEgresosServicios = useMemo(() => {
    return egresos
      .filter(e => e.categoria === 'SERVICIO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [egresos])

  const totalEgresosTotales = totalEgresosMaquinaria + totalEgresosInsumos + totalEgresosServicios
  const saldoNetoCaja = totalIngresosTotales - totalEgresosTotales

  // Evolution Chart Timeline Data Calculation
  const chartTimelineData = useMemo(() => {
    const dayMap = new Map<string, { ingresos: number; egresos: number }>()

    // Group Sales
    ventas.forEach(v => {
      if (v.montoPagado > 0) {
        const day = v.fecha.split('T')[0]
        const curr = dayMap.get(day) || { ingresos: 0, egresos: 0 }
        curr.ingresos += v.montoPagado
        dayMap.set(day, curr)
      }
    })

    // Group Direct Incomes
    ingresosDirectos.forEach(i => {
      if (i.monto > 0) {
        const day = i.fecha.split('T')[0]
        const curr = dayMap.get(day) || { ingresos: 0, egresos: 0 }
        curr.ingresos += i.monto
        dayMap.set(day, curr)
      }
    })

    // Group Expenses
    egresos.forEach(e => {
      if (e.costoTotal > 0) {
        const day = e.createdAt.split('T')[0]
        const curr = dayMap.get(day) || { ingresos: 0, egresos: 0 }
        curr.egresos += e.costoTotal
        dayMap.set(day, curr)
      }
    })

    // Chronological Sort (Ascending)
    const sortedDays = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

    let runningBalance = 0
    const points = sortedDays.map(([day, val]) => {
      const netoDia = val.ingresos - val.egresos
      runningBalance += netoDia
      const parts = day.split('-')
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
      const dayNum = parseInt(parts[2], 10)
      const monthName = months[parseInt(parts[1], 10) - 1] || ''
      const formattedShort = `${dayNum} ${monthName}`
      const formattedLong = `${dayNum} ${monthName} ${parts[0]}`

      return {
        rawDate: day,
        fechaLabel: formattedShort,
        fechaCompleta: formattedLong,
        ingresos: Number(val.ingresos.toFixed(2)),
        egresos: Number(val.egresos.toFixed(2)),
        neto: Number(netoDia.toFixed(2)),
        saldoAcumulado: Number(runningBalance.toFixed(2)),
      }
    })

    // Filter by period
    if (periodFilter === '30_DIAS') {
      return points.slice(-30)
    }
    if (periodFilter === 'ESTE_MES') {
      const currentYearMonth = new Date().toISOString().slice(0, 7)
      const filtered = points.filter(p => p.rawDate.startsWith(currentYearMonth))
      return filtered.length > 0 ? filtered : points
    }
    return points
  }, [ventas, ingresosDirectos, egresos, periodFilter])

  // Donut Chart: Cash Allocation Breakdown
  const fundAllocationData = useMemo(() => {
    const total = Math.max(saldoNetoCaja, 1)

    // Segment 1: Ingresos de Ventas Cobradas
    const ventasAmt = Math.min(totalIngresosVentas, total)
    // Segment 3: Fondo Operativo & Pauta (S/ 123 o proporcional)
    const opsAmt = Math.min(123.00, Math.max(0, total - ventasAmt))
    // Segment 2: Excedente de Préstamo / Capital
    const prestamoRemanente = Math.max(0, total - ventasAmt - opsAmt)

    return [
      {
        name: 'Caja Ventas Cobradas',
        value: Number(ventasAmt.toFixed(2)),
        color: '#1E5E3A',
        desc: 'Ingresos netos por ventas de catálogo',
        percent: Math.round((ventasAmt / total) * 100)
      },
      {
        name: 'Excedente Préstamo / Inversión',
        value: Number(prestamoRemanente.toFixed(2)),
        color: '#A36F4C',
        desc: 'Capital asignado a equipamiento y reserva',
        percent: Math.round((prestamoRemanente / total) * 100)
      },
      {
        name: 'Fondo de Operaciones & Pauta',
        value: Number(opsAmt.toFixed(2)),
        color: '#D9BF87',
        desc: 'Reserva para marketing y fletes',
        percent: Math.round((opsAmt / total) * 100)
      }
    ].filter(item => item.value > 0)
  }, [saldoNetoCaja, totalIngresosVentas])

  // Unified Chronological Movements (Libro de Caja Diario)
  const allMovements = useMemo(() => {
    const movements: Array<{
      id: string
      fecha: string
      tipo: 'INGRESO_VENTA' | 'INGRESO_DIRECTO' | 'EGRESO_MAQUINARIA' | 'EGRESO_INSUMO' | 'EGRESO_SERVICIO'
      concepto: string
      entidad: string
      monto: number
      detalle?: string
      isPositive: boolean
    }> = []

    // 1. Incomes from Product Sales
    ventas.forEach(v => {
      if (v.montoPagado > 0) {
        movements.push({
          id: `v-${v.id}`,
          fecha: v.fecha,
          tipo: 'INGRESO_VENTA',
          concepto: `Venta: ${v.producto.nombreModelo} (x${v.cantidad})`,
          entidad: v.cliente,
          monto: v.montoPagado,
          detalle: v.saldoPendiente > 0 ? `Saldo pend: ${formatCurrency(v.saldoPendiente)}` : 'Cobrado total',
          isPositive: true,
        })
      }
    })

    // 2. Incomes from Direct Services / Other
    ingresosDirectos.forEach(i => {
      movements.push({
        id: `ing-${i.id}`,
        fecha: i.fecha,
        tipo: 'INGRESO_DIRECTO',
        concepto: `${i.categoria}: ${i.concepto}`,
        entidad: i.cliente,
        monto: i.monto,
        detalle: i.metodoPago ? `Método: ${i.metodoPago}` : undefined,
        isPositive: true,
      })
    })

    // 3. Expenses / Egresos
    egresos.forEach(e => {
      if (e.categoria === 'ACTIVO_FIJO') {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_MAQUINARIA',
          concepto: `Maquinaria/Equipo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.presentacion || 'Activo / Equipo 3D',
          isPositive: false,
        })
      } else if (e.categoria === 'INSUMO') {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_INSUMO',
          concepto: `Insumo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.especificacionColor ? `Color: ${e.especificacionColor}` : (e.presentacion || 'Material'),
          isPositive: false,
        })
      } else {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_SERVICIO',
          concepto: `Gasto Operativo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: 'Servicio / Flete / Operativo',
          isPositive: false,
        })
      }
    })

    // Sort descending by date
    return movements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [ventas, ingresosDirectos, egresos])

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return allMovements.filter(m => {
      const matchSearch = 
        m.concepto.toLowerCase().includes(search.toLowerCase()) ||
        m.entidad.toLowerCase().includes(search.toLowerCase()) ||
        (m.detalle && m.detalle.toLowerCase().includes(search.toLowerCase()))

      let matchTipo = true
      if (tipoFilter === 'INGRESOS') matchTipo = m.isPositive
      if (tipoFilter === 'EGRESOS') matchTipo = !m.isPositive

      return matchSearch && matchTipo
    })
  }, [allMovements, search, tipoFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / ITEMS_PER_PAGE))
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredMovements.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredMovements, currentPage])

  // Ratio de Cobertura y Métricas Rápidas
  const ratioCobertura = totalEgresosTotales > 0 ? (totalIngresosTotales / totalEgresosTotales).toFixed(2) : '1.00'
  const netCashFlow = totalIngresosTotales - totalEgresosTotales

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm">
            <Wallet className="h-6 w-6 stroke-[2.5]" />
          </div>
          Flujo de Caja (Cash Flow)
        </h1>
        <p className="text-sm text-[#75695D] mt-1">
          Balance financiero consolidado entre ingresos efectivamente cobrados y egresos operativos del taller.
        </p>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Neto en Caja */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className={`absolute top-0 left-0 right-0 h-1 ${saldoNetoCaja >= 0 ? 'bg-[#1E5E3A]' : 'bg-[#A34335]'}`} />
          <CardHeader className="pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#75695D]">
              Saldo Neto en Caja
            </span>
            <div className={`text-2xl font-extrabold font-mono mt-1 ${saldoNetoCaja >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
              {formatCurrency(saldoNetoCaja)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-[#75695D]">
              Ingresos Cobrados - Egresos Totales
            </span>
          </CardContent>
        </Card>

        {/* Ingresos Cobrados */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E5E3A]" />
          <CardHeader className="pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A] flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
              Total Ingresos
            </span>
            <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
              {formatCurrency(totalIngresosTotales)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-[#75695D]">
              Ventas: {formatCurrency(totalIngresosVentas)} • Servicios: {formatCurrency(totalIngresosDirectos)}
            </span>
          </CardContent>
        </Card>

        {/* Egresos Totales */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#A36F4C]" />
          <CardHeader className="pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A36F4C] flex items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
              Total Egresos / Gastos
            </span>
            <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
              {formatCurrency(totalEgresosTotales)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-[#75695D]">
              Maquinaria: {formatCurrency(totalEgresosMaquinaria)} • Insumos: {formatCurrency(totalEgresosInsumos)}
            </span>
          </CardContent>
        </Card>

        {/* Cuentas por Cobrar */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#8C6D1F]" />
          <CardHeader className="pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D1F] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 stroke-[2.5]" />
              Cuentas por Cobrar
            </span>
            <div className="text-2xl font-extrabold text-[#8C6D1F] font-mono mt-1">
              {formatCurrency(totalSaldosPorCobrar)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-[#75695D]">
              Saldos pendientes de clientes
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* CASH FLOW INSIGHTS ANALYTICAL DASHBOARD                                   */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COMPONENTE 1: Gráfico de Evolución y Flujo Neto (lg:col-span-2) */}
          <Card className="lg:col-span-2 bg-[#FFFFFF] border-[#E2D9CC] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            {/* Header del Gráfico */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2D9CC]/70">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#A36F4C]" />
                  <h3 className="text-base font-extrabold text-[#241C15]">
                    Evolución de Caja & Movimientos
                  </h3>
                </div>
                <p className="text-xs text-[#75695D] mt-0.5">
                  Entradas (+), salidas (-) y saldo acumulado real a través del tiempo.
                </p>
              </div>

              {/* Selector de Período */}
              <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPeriodFilter('HISTORICO')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    periodFilter === 'HISTORICO'
                      ? 'bg-[#241C15] text-white shadow-xs'
                      : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Histórico
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('30_DIAS')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    periodFilter === '30_DIAS'
                      ? 'bg-[#241C15] text-white shadow-xs'
                      : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  30 Días
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('ESTE_MES')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    periodFilter === 'ESTE_MES'
                      ? 'bg-[#241C15] text-white shadow-xs'
                      : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Este Mes
                </button>
              </div>
            </div>

            {/* Gráfico ComposedChart */}
            <div className="h-[280px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartTimelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" vertical={false} opacity={0.6} />
                  <XAxis 
                    dataKey="fechaLabel" 
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
                  <RechartsTooltip content={<CustomCashFlowTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs font-semibold text-[#241C15] mr-3">
                        {value === 'ingresos' ? 'Ingresos (+)' : value === 'egresos' ? 'Egresos (-)' : 'Saldo Acumulado'}
                      </span>
                    )}
                  />
                  {/* Barras de Ingreso y Egreso */}
                  <Bar dataKey="ingresos" name="ingresos" fill="#1E5E3A" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="egresos" name="egresos" fill="#A36F4C" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  
                  {/* Línea de Saldo Acumulado */}
                  <Line 
                    type="monotone" 
                    dataKey="saldoAcumulado" 
                    name="saldoAcumulado" 
                    stroke="#241C15" 
                    strokeWidth={2.5}
                    dot={{ fill: '#241C15', r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 6, fill: '#A36F4C', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Subleyenda informativa */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E2D9CC]/60 text-[11px] text-[#75695D]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1E5E3A]" />
                Barras Verdes = Entradas
                <span className="w-2 h-2 rounded-full bg-[#A36F4C] ml-2" />
                Barras Terracota = Salidas
              </span>
              <span className="font-mono font-bold text-[#241C15]">
                Saldo Final: {formatCurrency(saldoNetoCaja)}
              </span>
            </div>
          </Card>

          {/* COMPONENTE 2: Gráfico de Dona - Estado y Asignación de Fondos (lg:col-span-1) */}
          <Card className="lg:col-span-1 bg-[#FFFFFF] border-[#E2D9CC] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            {/* Header del Donut */}
            <div className="pb-3 border-b border-[#E2D9CC]/70">
              <div className="flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-[#1E5E3A]" />
                <h3 className="text-base font-extrabold text-[#241C15]">
                  Distribución del Efectivo
                </h3>
              </div>
              <p className="text-xs text-[#75695D] mt-0.5">
                Composición de los fondos en cuenta activa.
              </p>
            </div>

            {/* Donut Chart Central con Total en Medio */}
            <div className="relative h-[200px] w-full flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fundAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {fundAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(val: any, name: any) => [`S/ ${Number(val).toFixed(2)}`, name]}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2D9CC', borderRadius: '12px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centro de la Dona */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-[#75695D] font-bold uppercase tracking-wider">
                  Saldo Total
                </span>
                <span className="text-sm font-extrabold text-[#241C15] font-mono mt-0.5">
                  {formatCurrency(saldoNetoCaja)}
                </span>
              </div>
            </div>

            {/* Leyenda Detallada Inferior con Montos y Porcentajes */}
            <div className="space-y-2 pt-2 border-t border-[#E2D9CC]/70">
              {fundAllocationData.map((fund, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fund.color }} />
                    <span className="font-semibold text-[#241C15] truncate" title={fund.name}>
                      {fund.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 font-mono">
                    <span className="font-bold text-[#241C15]">
                      {formatCurrency(fund.value)}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1 font-bold bg-[#F4EFEA] border-[#E2D9CC] text-[#75695D]">
                      {fund.percent}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Mini KPI Bar en Footer del Dashboard */}
        <div className="bg-[#FAF8F5] border border-[#E2D9CC] rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#EBF7EE] text-[#1E5E3A] border border-[#B4E3C0]">
              <TrendingUp className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-[#75695D] tracking-wider block">
                Flujo Neto del Período
              </span>
              <span className={`text-base font-extrabold font-mono ${netCashFlow >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
                {netCashFlow >= 0 ? `+${formatCurrency(netCashFlow)}` : formatCurrency(netCashFlow)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#EFE5D8] text-[#A36F4C] border border-[#D4BEA7]">
              <Activity className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-[#75695D] tracking-wider block">
                Ratio Cobertura (Ing/Eg)
              </span>
              <span className="text-base font-extrabold font-mono text-[#241C15]">
                {ratioCobertura}x <span className="text-xs text-[#75695D] font-normal">por cada S/ 1 gastado</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FDF6E2] text-[#8C6D1F] border border-[#E8D49B]">
              <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-[#75695D] tracking-wider block">
                Salud Financiera de Caja
              </span>
              <Badge 
                variant="outline" 
                className={`text-xs font-extrabold py-0.5 px-2 mt-0.5 ${
                  saldoNetoCaja > 1500 
                    ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]' 
                    : saldoNetoCaja > 0 
                    ? 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]' 
                    : 'bg-red-50 text-[#A34335] border-red-200'
                }`}
              >
                {saldoNetoCaja > 1500 ? 'Excelente Liquidez (Estable)' : saldoNetoCaja > 0 ? 'Caja Positiva' : 'Alerta de Déficit'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Row Toolbar & Filters */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
          <Input 
            placeholder="Buscar concepto en caja..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 pr-8 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs md:text-sm rounded-xl h-9 focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC]">
          <button
            onClick={() => { setTipoFilter('TODOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tipoFilter === 'TODOS'
                ? 'bg-[#241C15] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            Todos ({allMovements.length})
          </button>
          <button
            onClick={() => { setTipoFilter('INGRESOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              tipoFilter === 'INGRESOS'
                ? 'bg-[#1E5E3A] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
            Solo Ingresos
          </button>
          <button
            onClick={() => { setTipoFilter('EGRESOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              tipoFilter === 'EGRESOS'
                ? 'bg-[#A36F4C] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />
            Solo Egresos
          </button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] overflow-hidden shadow-md rounded-2xl">
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="w-full min-w-[650px]">
            <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
              <TableRow className="border-[#E2D9CC] hover:bg-transparent">
                <TableHead className="text-[#241C15] font-bold px-4 py-3 text-left">Fecha</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Tipo</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Concepto</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Entidad / Cliente</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left hidden sm:table-cell">Detalle</TableHead>
                <TableHead className="text-[#241C15] font-bold px-4 py-3 text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-[#75695D]">
                    No se encontraron movimientos registrados con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMovements.map((mov) => (
                  <TableRow key={mov.id} className="border-[#E2D9CC]/70 hover:bg-[#FDFBF7] transition-colors">
                    <TableCell className="px-4 py-3 text-xs text-[#75695D] font-mono whitespace-nowrap">
                      {formatDate(mov.fecha)}
                    </TableCell>

                    <TableCell className="px-3 py-3 whitespace-nowrap">
                      {mov.tipo === 'INGRESO_VENTA' ? (
                        <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs font-bold gap-1">
                          <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                          Venta
                        </Badge>
                      ) : mov.tipo === 'INGRESO_DIRECTO' ? (
                        <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-xs font-bold gap-1">
                          <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                          Ingreso Directo
                        </Badge>
                      ) : mov.tipo === 'EGRESO_MAQUINARIA' ? (
                        <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-xs font-semibold gap-1">
                          <Wrench className="h-3 w-3" />
                          Maquinaria
                        </Badge>
                      ) : mov.tipo === 'EGRESO_INSUMO' ? (
                        <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-xs font-semibold gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          Insumo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-[#1E5E3A] border-emerald-200 text-xs font-semibold gap-1">
                          <Truck className="h-3 w-3" />
                          Gasto Operativo
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="px-3 py-3 font-semibold text-[#241C15]">
                      {mov.concepto}
                    </TableCell>

                    <TableCell className="px-3 py-3 text-xs font-bold text-[#241C15] whitespace-nowrap">
                      {mov.entidad}
                    </TableCell>

                    <TableCell className="px-3 py-3 text-xs text-[#75695D] hidden sm:table-cell">
                      {mov.detalle || '—'}
                    </TableCell>

                    <TableCell className={`px-4 py-3 text-right font-mono font-extrabold whitespace-nowrap ${
                      mov.isPositive ? 'text-[#1E5E3A]' : 'text-[#A34335]'
                    }`}>
                      {mov.isPositive ? `+${formatCurrency(mov.monto)}` : `-${formatCurrency(mov.monto)}`}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E2D9CC] bg-[#F4EFEA] text-xs text-[#75695D]">
            <div>
              Mostrando página <span className="text-[#241C15] font-bold">{currentPage}</span> de <span className="text-[#241C15] font-bold">{totalPages}</span> ({filteredMovements.length} movimientos)
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer shadow-sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 p-0 cursor-pointer shadow-sm ${
                      currentPage === page 
                        ? "bg-[#241C15] text-white hover:bg-[#3D332A] font-bold" 
                        : "border-[#E2D9CC] bg-[#FFFFFF] text-[#75695D] hover:bg-[#EAE4DC] hover:text-[#241C15]"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer shadow-sm"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
