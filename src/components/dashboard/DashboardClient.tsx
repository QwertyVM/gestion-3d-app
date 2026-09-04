'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts'
import { 
  DollarSign, 
  TrendingUp, 
  Layers, 
  Clock, 
  Activity, 
  Sparkles,
  ArrowUpRight,
  Receipt,
  Palette,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Wallet,
  Coins
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const NOVA_CHART_COLORS = ['#A36F4C', '#944917', '#1E5E3A', '#8C6D1F', '#633E20', '#B57D68']

// Formateador de fecha amigable para el tooltip y eje X (ej: 26 Ago 2026)
function formatFechaEvolucion(rawDate: string, conAnio = true) {
  if (!rawDate) return ''
  const parts = String(rawDate).split('-')
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
    const day = d.getDate()
    const month = months[d.getMonth()]
    return conAnio ? `${day} ${month} ${d.getFullYear()}` : `${day} ${month}`
  }
  return rawDate
}

// Tooltip Personalizado con Flujo Contable Estándar
function CustomEvolucionTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const ingresos = Number(data.ingresos || 0)
    const costo = Number(data.costo || 0)
    const ganancia = Number(data.ganancia != null ? data.ganancia : (ingresos - costo))

    return (
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl shadow-xl overflow-hidden min-w-[200px] sm:min-w-[220px] text-xs font-sans">
        {/* Cabecera: Fecha destacada con fondo NOVA */}
        <div className="bg-[#F8F6F2] border-b border-[#E2D9CC] px-3 py-1.5 sm:px-3.5 sm:py-2 flex items-center justify-between">
          <span className="font-bold text-[#241C15]">{formatFechaEvolucion(label, true)}</span>
          <span className="text-[9px] sm:text-[10px] text-[#75695D] font-mono uppercase font-semibold">Resumen</span>
        </div>

        {/* Cuerpo del Tooltip: Flujo Contable */}
        <div className="p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2">
          {/* Fila 1: Ingresos / Cobrado */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#A36F4C] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A36F4C]" />
              Ingresos / Cobrado:
            </span>
            <span className="font-mono font-bold text-[#A36F4C]">
              S/ {ingresos.toFixed(2)}
            </span>
          </div>

          {/* Fila 2: Costo de Fabricación */}
          <div className="flex items-center justify-between gap-3 text-[#75695D]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#75695D]" />
              (-) Costo Fab.:
            </span>
            <span className="font-mono font-semibold">
              S/ {costo.toFixed(2)}
            </span>
          </div>

          {/* Divisor horizontal sutil */}
          <div className="border-t border-[#E2D9CC] my-1" />

          {/* Fila 3: Ganancia Neta */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <span className={`${ganancia >= 0 ? 'text-[#1E5E3A]' : 'text-[#8C6D1F]'} font-extrabold flex items-center gap-1.5`}>
              <span className={`w-2 h-2 rounded-full ${ganancia >= 0 ? 'bg-[#1E5E3A]' : 'bg-[#8C6D1F]'}`} />
              (=) Ganancia Neta:
            </span>
            <span className={`font-mono font-extrabold ${ganancia >= 0 ? 'text-[#1E5E3A]' : 'text-[#8C6D1F]'}`}>
              {ganancia < 0 ? `-S/ ${Math.abs(ganancia).toFixed(2)}` : `+S/ ${ganancia.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Leyenda personalizada con jerarquía horizontal responsive
function CustomLegend() {
  return (
    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3 sm:gap-5 text-[11px] sm:text-xs pb-2 sm:pb-3 pt-1">
      <div className="flex items-center gap-1.5 font-bold text-[#A36F4C]">
        <span className="w-3 h-0.5 bg-[#A36F4C] rounded-full inline-block" />
        <span>Ingresos / Ventas</span>
      </div>
      <div className="flex items-center gap-1.5 font-medium text-[#75695D]">
        <span className="w-3 h-0 border-t-2 border-dashed border-[#75695D] inline-block" />
        <span>Costo Fabricación</span>
      </div>
      <div className="flex items-center gap-1.5 font-bold text-[#1E5E3A]">
        <span className="w-2 h-2 rounded-full bg-[#1E5E3A] border border-white shadow-xs inline-block" />
        <span>Ganancia Neta</span>
      </div>
    </div>
  )
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

export interface CapacidadGastoData {
  saldoActualCaja: number
  totalBlindadoMes: number
  cuotaPrestamoMensual: number
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
  cuentasPorCobrar: any[]
  topColores?: TopColorItem[]
}

export function DashboardClient({ 
  kpis, 
  capacidadGasto,
  graficoEvolucion, 
  graficoInversion, 
  cuentasPorCobrar,
  topColores = []
}: DashboardClientProps) {
  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Default de capacidad de gasto si no está provisto (Sincronizado con Plan de Gastos)
  const gasto = capacidadGasto || {
    saldoActualCaja: Math.max(0, kpis.totalCobradoVentas + kpis.totalIngresosDirectos - kpis.egresosTotales),
    totalBlindadoMes: 368.88 + 878.00 + 111.00,
    cuotaPrestamoMensual: 368.88,
    reservaCapexMensual: 878.00,
    gastosFijosTaller: 111.00,
    gastoDisponibleHoy: Math.max(0, (kpis.totalCobradoVentas + kpis.totalIngresosDirectos - kpis.egresosTotales) - (368.88 + 878.00 + 111.00)),
    gastoDisponibleProyectado: Math.max(0, (kpis.totalCobradoVentas + kpis.totalIngresosDirectos - kpis.egresosTotales) + 1746 - (368.88 + 878.00 + 111.00)),
    pedidosProyectadosMes: 18,
    gananciaProyectadaMes: 1746.00
  }

  const porcentajeCubiertoBlindado = gasto.totalBlindadoMes > 0 
    ? Math.min(100, Math.round((gasto.saldoActualCaja / gasto.totalBlindadoMes) * 100))
    : 100

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm flex-shrink-0">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
            </div>
            <span>Dashboard General</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#75695D] mt-0.5 sm:mt-1">
            Métricas clave de rendimiento, rentabilidad sobre costos y flujo comercial.
          </p>
        </div>

        <Link
          href="/finanzas/proyecciones"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#633E20] border border-[#D4BEA7] shadow-2xs transition-all self-start sm:self-auto"
        >
          <TrendingUp className="h-3.5 w-3.5 text-[#A36F4C]" />
          <span>Simulador & Presupuesto del Mes</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* HERO BANNER: CAPACIDAD DE GASTO LIBRE + INDICADORES A LA DERECHA         */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#D4BEA7] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* LADO IZQUIERDO: Capacidad de Gasto Libre */}
          <div className="lg:col-span-6 flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl border flex-shrink-0 ${
              gasto.gastoDisponibleHoy > 0 
                ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                : 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]'
            }`}>
              <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#75695D]">
                  Capacidad de Gasto Libre
                </span>
                <Badge variant="outline" className={`text-[10px] font-bold py-0.5 px-2 ${
                  gasto.gastoDisponibleHoy > 0
                    ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                    : 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]'
                }`}>
                  {gasto.gastoDisponibleHoy > 0 ? 'Excedente Libre Hoy' : 'Fondos Comprometidos'}
                </Badge>
              </div>
              
              <div className="text-2xl sm:text-3xl font-black font-mono leading-tight mt-0.5">
                <span className={gasto.gastoDisponibleHoy > 0 ? 'text-[#1E5E3A]' : 'text-[#8C6D1F]'}>
                  {formatCurrency(gasto.gastoDisponibleHoy)}
                </span>
              </div>
              <span className="text-xs text-[#75695D] block mt-0.5">
                disponibles para compras/insumos sin tocar lo blindado
              </span>
            </div>
          </div>

          {/* LADO DERECHO: Lo que tengo en Caja & Lo Blindado */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Lo que tengo en Caja */}
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-1">
              <div className="flex items-center justify-between text-[#75695D]">
                <span className="font-bold text-[10px] uppercase">Lo que tengo en Caja</span>
                <Wallet className="h-4 w-4 text-[#1E5E3A]" />
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-[#241C15]">
                {formatCurrency(gasto.saldoActualCaja)}
              </div>
              <span className="text-[10px] text-[#75695D] block truncate">
                Cobrado efectivo de ventas
              </span>
            </div>

            {/* 2. Lo Blindado */}
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-1">
              <div className="flex items-center justify-between text-[#75695D]">
                <span className="font-bold text-[10px] uppercase">Lo Blindado / Intocable</span>
                <Lock className="h-4 w-4 text-[#A36F4C]" />
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-[#633E20]">
                {formatCurrency(gasto.totalBlindadoMes)}
              </div>
              <span className="text-[10px] text-[#75695D] block truncate">
                Préstamo + CAPEX + Fijos
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* KPIs Grid - Compact Height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* 1. GANANCIA NETA EN VENTAS */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm hover:border-[#1E5E3A] transition-all relative overflow-hidden rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E5E3A]" />
          <CardHeader className="flex flex-row items-center justify-between pb-0.5 pt-2.5 px-3.5 sm:px-4">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#1E5E3A]">
              Ganancia Neta (Ventas)
            </CardTitle>
            <div className="p-1 rounded-md bg-[#EBF7EE] text-[#1E5E3A]">
              <DollarSign className="h-3.5 w-3.5 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 pb-2.5 px-3.5 sm:px-4">
            <div className="text-lg sm:text-xl font-extrabold text-[#1E5E3A] font-mono leading-tight truncate">
              +{formatCurrency(kpis.gananciaNeta)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#75695D]">
              <span>Margen sobre costo:</span>
              <span className="font-bold text-[#1E5E3A] font-mono">
                +{kpis.margenPorcentaje.toFixed(1)}%
              </span>
            </div>
            <p className="text-[10px] text-[#75695D] truncate leading-tight">
              Ventas ({formatCurrency(kpis.ingresosVentas)}) - Costo Fab. ({formatCurrency(kpis.costoFabricacionTotal)})
            </p>
          </CardContent>
        </Card>
        
        {/* 2. INGRESOS TOTALES EN VENTAS */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm hover:border-[#A36F4C] transition-all relative overflow-hidden rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#A36F4C]" />
          <CardHeader className="flex flex-row items-center justify-between pb-0.5 pt-2.5 px-3.5 sm:px-4">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#A36F4C]">
              Ingresos por Ventas
            </CardTitle>
            <div className="p-1 rounded-md bg-[#EFE5D8] text-[#A36F4C]">
              <TrendingUp className="h-3.5 w-3.5 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 pb-2.5 px-3.5 sm:px-4">
            <div className="text-lg sm:text-xl font-extrabold text-[#241C15] font-mono leading-tight truncate">
              {formatCurrency(kpis.ingresosVentas)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#75695D]">
              <span>Ticket Promedio:</span>
              <span className="font-mono text-[#241C15] font-bold">
                {formatCurrency(kpis.ticketPromedio)}
              </span>
            </div>
            <p className="text-[10px] text-[#75695D] truncate leading-tight">Total facturado en modelos 3D</p>
          </CardContent>
        </Card>

        {/* 3. COSTO TOTAL DE FABRICACIÓN */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm hover:border-[#944917] transition-all relative overflow-hidden rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#944917]" />
          <CardHeader className="flex flex-row items-center justify-between pb-0.5 pt-2.5 px-3.5 sm:px-4">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#944917]">
              Costo de Fabricación
            </CardTitle>
            <div className="p-1 rounded-md bg-[#F4EFEA] text-[#944917]">
              <Layers className="h-3.5 w-3.5 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 pb-2.5 px-3.5 sm:px-4">
            <div className="text-lg sm:text-xl font-extrabold text-[#944917] font-mono leading-tight truncate">
              {formatCurrency(kpis.costoFabricacionTotal)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#75695D]">
              <span>Costo por modelo:</span>
              <span className="font-mono text-[#241C15] font-bold">
                {kpis.ingresosVentas > 0 
                  ? `${((kpis.costoFabricacionTotal / kpis.ingresosVentas) * 100).toFixed(0)}% del precio`
                  : '0%'}
              </span>
            </div>
            <p className="text-[10px] text-[#75695D] truncate leading-tight">Filamento, energía y amortización</p>
          </CardContent>
        </Card>

        {/* 4. SALDO POR COBRAR / COBRADO */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm hover:border-[#8C6D1F] transition-all relative overflow-hidden rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#8C6D1F]" />
          <CardHeader className="flex flex-row items-center justify-between pb-0.5 pt-2.5 px-3.5 sm:px-4">
            <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8C6D1F]">
              Cobranzas & Saldos
            </CardTitle>
            <div className="p-1 rounded-md bg-[#FDF6E2] text-[#8C6D1F]">
              <Clock className="h-3.5 w-3.5 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 pb-2.5 px-3.5 sm:px-4">
            <div className="text-lg sm:text-xl font-extrabold text-[#8C6D1F] font-mono leading-tight truncate">
              {formatCurrency(kpis.saldoPorCobrar)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#75695D]">
              <span>Cobrado en Caja:</span>
              <span className="font-mono text-[#1E5E3A] font-bold">
                {formatCurrency(kpis.totalCobradoVentas)}
              </span>
            </div>
            <p className="text-[10px] text-[#75695D] truncate leading-tight">Saldos pendientes de entrega</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        
        {/* Gráfico de Evolución: Ingresos vs Costo vs Ganancia */}
        <Card className="lg:col-span-4 bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-[#241C15] text-sm sm:text-base font-bold flex items-center justify-between flex-wrap gap-2">
              <span>Evolución: Ventas, Costo y Ganancia</span>
              <span className="text-[11px] text-[#75695D] font-normal font-mono bg-[#FAF8F5] border border-[#E2D9CC] px-2 py-0.5 rounded-md">
                Historial
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-[#75695D]">
              Comparativa entre precio cobrado y costo de fabricación.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 pt-0">
            <div className="h-[250px] sm:h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={graficoEvolucion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gananciaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E5E3A" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#1E5E3A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" vertical={false} opacity={0.7} />
                  
                  <XAxis 
                    dataKey="fecha" 
                    stroke="#75695D" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: '#E2D9CC' }}
                    tickFormatter={(val) => formatFechaEvolucion(val, false)}
                    dy={4}
                  />
                  
                  <YAxis 
                    stroke="#75695D" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => val < 0 ? `-S/${Math.abs(val)}` : `S/${val}`}
                  />
                  
                  <Tooltip content={<CustomEvolucionTooltip />} />
                  
                  <Legend content={<CustomLegend />} verticalAlign="top" />

                  {/* Área sombreada debajo de la curva de Ganancia Neta */}
                  <Area 
                    type="monotone" 
                    dataKey="ganancia" 
                    stroke="none" 
                    fill="url(#gananciaGradient)" 
                    legendType="none" 
                    tooltipType="none" 
                  />

                  {/* Línea 1: Ventas Totales */}
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#A36F4C" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#A36F4C', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#A36F4C', stroke: '#FFFFFF', strokeWidth: 2 }}
                    name="ingresos" 
                  />

                  {/* Línea 2: Costo de Fabricación */}
                  <Line 
                    type="monotone" 
                    dataKey="costo" 
                    stroke="#75695D" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    dot={{ r: 2.5, fill: '#75695D', stroke: '#FFFFFF', strokeWidth: 1 }}
                    activeDot={{ r: 4.5, fill: '#75695D', stroke: '#FFFFFF', strokeWidth: 2 }}
                    name="costo" 
                  />

                  {/* Línea 3: Ganancia Neta */}
                  <Line 
                    type="monotone" 
                    dataKey="ganancia" 
                    stroke="#1E5E3A" 
                    strokeWidth={2.5} 
                    dot={{ r: 3.5, fill: '#1E5E3A', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 5.5, fill: '#1E5E3A', stroke: '#FFFFFF', strokeWidth: 2 }}
                    name="ganancia" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Distribución de Egresos */}
        <Card className="lg:col-span-3 bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-[#241C15] text-sm sm:text-base font-bold">Distribución de Gastos</CardTitle>
            <CardDescription className="text-xs text-[#75695D]">
              Maquinaria, insumos, packaging y servicios operativos.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 pt-0">
            <div className="h-[250px] sm:h-[300px] w-full flex flex-col items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={graficoInversion}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {graficoInversion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={NOVA_CHART_COLORS[index % NOVA_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CC', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', fontSize: '12px' }}
                    formatter={(val: any) => [`S/ ${Number(val).toFixed(2)}`, 'Gasto']}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    formatter={(val) => <span className="text-[11px] sm:text-xs text-[#241C15] font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none pb-7">
                <span className="text-[10px] text-[#75695D] uppercase font-bold tracking-wider">Total</span>
                <span className="text-sm sm:text-base font-extrabold text-[#241C15] font-mono">{formatCurrency(kpis.egresosTotales)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fila Inferior: Cuentas Pendientes por Cobrar & Top 5 Colores de Filamento */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 items-start">
        {/* 1. Cuentas por Cobrar */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl h-full flex flex-col justify-between overflow-hidden">
          <CardHeader className="p-4 sm:p-5 pb-3">
            <CardTitle className="text-[#241C15] text-sm sm:text-base font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-[#8C6D1F]" />
              <span>Cuentas Pendientes por Cobrar</span>
            </CardTitle>
            <CardDescription className="text-xs text-[#75695D]">
              Pedidos con saldos pendientes de liquidación.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-0.5">
              {cuentasPorCobrar.length === 0 ? (
                <div className="p-6 text-center text-[#75695D] text-xs sm:text-sm bg-[#F8F6F2] rounded-xl border border-[#E2D9CC]">
                  No hay cuentas pendientes por cobrar 🎉
                </div>
              ) : (
                cuentasPorCobrar.slice(0, 5).map((cuenta) => (
                  <div key={cuenta.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] hover:bg-[#F4EFEA] transition-colors gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-[#241C15] truncate">{cuenta.cliente}</p>
                      <p className="text-[11px] text-[#75695D] mt-0.5 truncate">
                        {cuenta.producto?.nombreModelo ? `${cuenta.producto.nombreModelo} • ` : ''}{formatDate(cuenta.fecha)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-[#8C6D1F] border-[#E8D49B] bg-[#FDF6E2] font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5">
                        Debe: {formatCurrency(Number(cuenta.saldoPendiente))}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Top 5 Colores Más Utilizados */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl h-full flex flex-col justify-between overflow-hidden">
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-[#241C15] text-sm sm:text-base font-bold flex items-center gap-2">
                <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-[#A36F4C]" />
                <span>Top Colores Más Usados</span>
              </CardTitle>
              <Link 
                href="/catalogo/inventario" 
                className="text-[11px] sm:text-xs font-semibold text-[#A36F4C] hover:underline flex items-center gap-1 flex-shrink-0"
              >
                <span>Inventario</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <CardDescription className="text-xs text-[#75695D]">
              Filamentos con mayor frecuencia de uso y rotación.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-0.5">
              {(!topColores || topColores.length === 0) ? (
                <div className="p-6 text-center text-[#75695D] text-xs sm:text-sm bg-[#F8F6F2] rounded-xl border border-[#E2D9CC]">
                  Aún no hay pedidos con colores asignados 🎨
                </div>
              ) : (
                topColores.map((color, index) => {
                  const isFirst = index === 0
                  const esCritico = color.alertaCritica || color.stockGramosActual < 300

                  return (
                    <div 
                      key={color.id || color.nombreColor} 
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                        isFirst
                          ? 'bg-[#FDFBF7] border-[#D4BEA7] shadow-2xs'
                          : 'bg-[#FAF8F5] border-[#E2D9CC] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Rank Badge */}
                          <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black font-mono flex-shrink-0 ${
                            isFirst 
                              ? 'bg-[#A36F4C] text-white shadow-2xs' 
                              : index === 1 
                                ? 'bg-[#EAE4DC] text-[#241C15]' 
                                : 'bg-[#F4EFEA] text-[#75695D]'
                          }`}>
                            #{index + 1}
                          </div>

                          {/* Color Swatch */}
                          <div 
                            className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border border-black/15 shadow-xs flex-shrink-0"
                            style={{ backgroundColor: color.codigoHex }}
                            title={color.nombreColor}
                          />

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-[#241C15] truncate">
                                {color.nombreColor}
                              </span>
                              {isFirst && (
                                <span className="text-[8px] sm:text-[9px] font-black text-[#A36F4C] bg-[#EFE5D8] border border-[#D4BEA7] px-1 py-0.2 rounded uppercase flex-shrink-0">
                                  Top 1
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#75695D] mt-0.5 flex-wrap">
                              <span><strong className="text-[#241C15] font-mono">{color.pedidosCount}</strong> ped.</span>
                              <span>•</span>
                              <span><strong className="text-[#241C15] font-mono">{color.unidadesCount}</strong> un.</span>
                              <span>•</span>
                              <span className="font-mono text-[#A36F4C] font-semibold">{color.gramosTotal}g</span>
                            </div>
                          </div>
                        </div>

                        {/* Stock en Taller Badge */}
                        <div className="flex flex-col items-end flex-shrink-0">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] sm:text-xs font-mono font-bold px-1.5 sm:px-2 py-0.5 shadow-2xs ${
                              esCritico
                                ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]'
                                : 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                            }`}
                          >
                            {esCritico ? `⚠️ ${color.stockGramosActual}g` : `${color.stockGramosActual}g`}
                          </Badge>
                          <span className="text-[9px] sm:text-[10px] font-mono text-[#75695D] mt-0.5">
                            {color.porcentajeUso}% uso
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#EAE4DC] h-1 sm:h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className="h-full rounded-full bg-[#A36F4C] transition-all duration-300"
                          style={{ width: `${Math.max(6, color.porcentajeUso)}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
