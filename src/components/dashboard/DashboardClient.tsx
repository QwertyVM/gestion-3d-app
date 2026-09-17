'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  ComposedChart, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  ReferenceLine
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
  ArrowUpRight
} from 'lucide-react'

// Paleta de colores minimalista para gastos (Donut Chart)
const DONUT_COLORS = ['#7C5835', '#A36F4C', '#B8A99A', '#059669', '#3B82F6', '#8C6239']

// Formateador de fecha para el tooltip y eje X
function formatFechaEvolucion(rawDate: string, conAnio = false) {
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

// Obtener iniciales de un nombre
function getInitials(name: string) {
  if (!name) return 'CL'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Custom Tooltip limpio y minimalista
function CustomEvolucionTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const ingresos = Number(data.ingresos || 0)
    const costo = Number(data.costo || 0)
    const ganancia = Number(data.ganancia != null ? data.ganancia : (ingresos - costo))
    const isNegative = ganancia < 0

    return (
      <div className="bg-white border border-[#E5DCD3] rounded-xl shadow-lg p-3 min-w-[200px] text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#F5EFEB] pb-1.5 mb-2">
          <span className="font-bold text-[#1F2937]">{formatFechaEvolucion(label, true)}</span>
          <span className={`text-[10px] font-semibold ${isNegative ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
            {isNegative ? 'Pérdida' : 'Utilidad'}
          </span>
        </div>

        <div className="space-y-1.5 text-[#6B7280]">
          <div className="flex justify-between items-center">
            <span>Facturación:</span>
            <span className="font-mono font-semibold text-[#1F2937]">S/ {ingresos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Costo producción:</span>
            <span className="font-mono font-semibold text-[#1F2937]">S/ {costo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-[#F5EFEB] font-bold">
            <span className={isNegative ? 'text-[#DC2626]' : 'text-[#059669]'}>Resultado neto:</span>
            <span className={`font-mono text-sm ${isNegative ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
              {isNegative ? `-S/ ${Math.abs(ganancia).toFixed(2)}` : `+S/ ${ganancia.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Leyenda minimalista
function CustomEvolutionLegend() {
  return (
    <div className="flex items-center justify-end gap-4 text-xs pb-2 text-[#6B7280]">
      <div className="flex items-center gap-1.5 font-medium">
        <span className="w-2.5 h-2.5 bg-[#059669] rounded-xs inline-block" />
        <span>Utilidad Neta</span>
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-xs inline-block" />
        <span>Pérdida / Costo</span>
      </div>
      <div className="flex items-center gap-1.5 font-medium text-[#7C5835]">
        <span className="w-3.5 h-0.5 bg-[#7C5835] rounded-full inline-block" />
        <span>Facturación</span>
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
  unidadesVendidas: number
  totalFacturado: number
  pedidosCount: number
  precioPromedio: number
  porcentajeUnidades: number
  porcentajeFacturacion: number
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
  cuentasPorCobrar?: any[]
  topColores?: TopColorItem[]
  topClientes?: TopClienteItem[]
  topArticulos?: TopArticuloItem[]
}

type RangoTemporal = '15D' | '30D' | 'MES' | 'TODO'

export function DashboardClient({ 
  kpis, 
  capacidadGasto,
  graficoEvolucion, 
  graficoInversion,
  topClientes = [],
  topArticulos = []
}: DashboardClientProps) {
  const router = useRouter()
  const [rangoTemporal, setRangoTemporal] = useState<RangoTemporal>('30D')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Capacidad de gasto calculada
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

  // Filtrado temporal del gráfico de evolución
  const graficoFiltrado = useMemo(() => {
    if (!graficoEvolucion || graficoEvolucion.length === 0) return []
    const sorted = [...graficoEvolucion].sort((a, b) => a.fecha.localeCompare(b.fecha))
    
    let baseList = sorted
    if (rangoTemporal === '15D') {
      baseList = sorted.slice(-15)
    } else if (rangoTemporal === '30D') {
      baseList = sorted.slice(-30)
    } else if (rangoTemporal === 'MES') {
      const now = new Date()
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const mesActualItems = sorted.filter(item => item.fecha.startsWith(currentYearMonth))
      baseList = mesActualItems.length > 0 ? mesActualItems : sorted.slice(-15)
    }

    return baseList.map(item => {
      const ingresos = Number(item.ingresos || 0)
      const costo = Number(item.costo || 0)
      const ganancia = Number(item.ganancia != null ? item.ganancia : (ingresos - costo))
      return {
        ...item,
        ingresos,
        costo,
        ganancia,
      }
    })
  }, [graficoEvolucion, rangoTemporal])

  // Desglose de egresos
  const totalEgresosCalculado = useMemo(() => {
    return graficoInversion.reduce((sum, item) => sum + Number(item.value || 0), 0) || kpis.egresosTotales
  }, [graficoInversion, kpis.egresosTotales])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-10 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. HEADER MINIMALISTA                                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1F2937]">
            Dashboard
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Resumen de rendimiento comercial, tesorería y analítica operativa.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleManualRefresh}
            title="Refrescar datos"
            className="p-2 rounded-xl bg-white hover:bg-[#FAF7F4] border border-[#E5DCD3] text-[#6B7280] hover:text-[#1F2937] transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#7C5835]' : ''}`} />
          </button>

          <Link
            href="/finanzas/proyecciones"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#FAF7F4] text-[#1F2937] border border-[#E5DCD3] shadow-xs transition-all"
          >
            <span>Simulador & Presupuesto</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#7C5835]" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GRID DE 4 TARJETAS DE KPIS MINIMALISTAS                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Facturación & Utilidad */}
        <div className="bg-white border border-[#E5DCD3] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Facturación Total</span>
            <div className="p-1.5 rounded-lg bg-[#FAF7F4] text-[#7C5835]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-[#1F2937] tracking-tight tabular-nums">
              {formatCurrency(kpis.ingresosVentas)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="font-semibold text-[#059669]">
                +{kpis.margenPorcentaje.toFixed(1)}% margen
              </span>
              <span className="text-[#6B7280]">•</span>
              <span className="text-[#6B7280] truncate">
                +{formatCurrency(kpis.gananciaNeta)} util.
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Capacidad de Gasto Libre */}
        <div className="bg-white border border-[#E5DCD3] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Gasto Disponible Libre</span>
            <div className={`p-1.5 rounded-lg ${gasto.gastoDisponibleHoy > 0 ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black font-mono tracking-tight tabular-nums ${gasto.gastoDisponibleHoy > 0 ? 'text-[#059669]' : 'text-[#92400E]'}`}>
              {formatCurrency(gasto.gastoDisponibleHoy)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6B7280] truncate">
              <span>Caja: {formatCurrency(gasto.saldoActualCaja)}</span>
              <span>•</span>
              <span title={`Blindado: ${formatCurrency(gasto.totalBlindadoMes)}`}>Blindado: {formatCurrency(gasto.totalBlindadoMes)}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Cobranzas */}
        <div className="bg-white border border-[#E5DCD3] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Total Cobrado</span>
            <div className="p-1.5 rounded-lg bg-[#FAF7F4] text-[#7C5835]">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-[#1F2937] tracking-tight tabular-nums">
              {formatCurrency(kpis.totalCobradoVentas)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6B7280] truncate">
              {kpis.saldoPorCobrar > 0 ? (
                <span className="text-[#92400E] font-medium">
                  Por cobrar: {formatCurrency(kpis.saldoPorCobrar)}
                </span>
              ) : (
                <span className="text-[#059669] font-medium">
                  ✓ Cuentas 100% al día
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 4: Ticket Promedio */}
        <div className="bg-white border border-[#E5DCD3] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Ticket Promedio</span>
            <div className="p-1.5 rounded-lg bg-[#FAF7F4] text-[#7C5835]">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-[#1F2937] tracking-tight tabular-nums">
              {formatCurrency(kpis.ticketPromedio)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6B7280] truncate">
              <span>Costo prod: {formatCurrency(kpis.costoFabricacionTotal)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. GRÁFICOS ANALÍTICOS (EVOLUCIÓN FINANCIERA & DISTRIBUCIÓN DE GASTOS)     */}
      {/* ========================================================================= */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
        
        {/* Gráfico de Evolución (8 cols) */}
        <Card className="lg:col-span-8 bg-white border-[#E5DCD3] shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-[#1F2937] text-sm sm:text-base font-black">
                  Evolución Financiera
                </CardTitle>
                <CardDescription className="text-xs text-[#6B7280]">
                  Utilidad neta diaria y volumen de facturación
                </CardDescription>
              </div>

              {/* Selector temporal minimalista */}
              <div className="flex items-center bg-[#FAF7F4] p-1 rounded-xl border border-[#E5DCD3] self-start sm:self-auto">
                {(['15D', '30D', 'MES', 'TODO'] as RangoTemporal[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRangoTemporal(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      rangoTemporal === r
                        ? 'bg-white text-[#1F2937] shadow-xs'
                        : 'text-[#6B7280] hover:text-[#1F2937]'
                    }`}
                  >
                    {r === '15D' ? '15D' : r === '30D' ? '30D' : r === 'MES' ? 'Mes' : 'Todo'}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-5 pt-0">
            <div className="h-[280px] sm:h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={graficoFiltrado} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DCD3" vertical={false} opacity={0.5} />
                  
                  <XAxis 
                    dataKey="fecha" 
                    stroke="#6B7280" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#E5DCD3' }}
                    tickFormatter={(val) => formatFechaEvolucion(val, false)}
                    dy={4}
                  />
                  
                  <YAxis 
                    stroke="#6B7280" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => val === 0 ? '0' : val < 0 ? `-${Math.abs(val)}` : `${val}`}
                  />
                  
                  <Tooltip content={<CustomEvolucionTooltip />} />
                  <Legend content={<CustomEvolutionLegend />} verticalAlign="top" />

                  <ReferenceLine y={0} stroke="#D1D5DB" strokeWidth={1} />

                  <Bar 
                    dataKey="ganancia" 
                    name="Resultado Neto" 
                    radius={[3, 3, 3, 3]}
                    maxBarSize={28}
                  >
                    {graficoFiltrado.map((entry, index) => (
                      <Cell 
                        key={`bar-cell-${index}`} 
                        fill={entry.ganancia >= 0 ? '#059669' : '#DC2626'} 
                      />
                    ))}
                  </Bar>

                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    name="Facturación"
                    stroke="#7C5835" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#7C5835', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#7C5835', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Donut de Gastos (4 cols) */}
        <Card className="lg:col-span-4 bg-white border-[#E5DCD3] shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-0">
            <CardTitle className="text-[#1F2937] text-sm sm:text-base font-black">
              Distribución de Gastos
            </CardTitle>
            <CardDescription className="text-xs text-[#6B7280]">
              Egresos e inversiones en el taller
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-3">
            {/* Gráfico Donut */}
            <div className="h-[180px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={graficoInversion}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  >
                    {graficoInversion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5DCD3', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val: any) => [`S/ ${Number(val).toFixed(2)}`, 'Gasto']}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-[10px] text-[#6B7280] uppercase font-bold">Total</span>
                <span className="text-sm sm:text-base font-black text-[#1F2937] font-mono tabular-nums">
                  {formatCurrency(totalEgresosCalculado)}
                </span>
              </div>
            </div>

            {/* Lista minimalista de categorías */}
            <div className="space-y-1.5 pt-2 border-t border-[#F5EFEB]">
              {graficoInversion.map((item, idx) => {
                const pct = totalEgresosCalculado > 0 ? ((item.value / totalEgresosCalculado) * 100).toFixed(0) : '0'
                const color = DONUT_COLORS[idx % DONUT_COLORS.length]

                return (
                  <div key={item.name} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[#1F2937] truncate text-[11px] font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-semibold text-[#1F2937] tabular-nums text-[11px]">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-mono w-7 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 4. RANKINGS COMERCIALES (TOP 5 CLIENTES & TOP 5 ARTÍCULOS)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        
        {/* TOP 5 CLIENTES EN VALOR */}
        <Card className="bg-white border-[#E5DCD3] shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-[#F5EFEB]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#7C5835]" />
                <CardTitle className="text-sm sm:text-base font-black text-[#1F2937]">
                  Top Clientes en Valor
                </CardTitle>
              </div>
              <Link
                href="/pedidos"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C5835] hover:text-[#5E4328] hover:underline"
              >
                <span>Ver pedidos</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 divide-y divide-[#F5EFEB]">
            {topClientes.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280] space-y-2">
                <Users className="h-6 w-6 text-[#B8A99A] mx-auto opacity-50" />
                <p>No hay compras registradas aún.</p>
              </div>
            ) : (
              topClientes.map((c, index) => (
                <div 
                  key={`${c.cliente}-${index}`}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#FAF7F4]/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#6B7280] w-4 text-center shrink-0">
                      {index + 1}
                    </span>

                    <div className="w-7 h-7 rounded-lg bg-[#FAF7F4] border border-[#E5DCD3] text-[#7C5835] font-bold text-[11px] flex items-center justify-center shrink-0">
                      {getInitials(c.cliente)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#1F2937] truncate" title={c.cliente}>
                        {c.cliente}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] truncate">
                        {c.pedidosCount} {c.pedidosCount === 1 ? 'pedido' : 'pedidos'} • {c.piezasCount} piezas
                        {c.canalPreferido && ` • ${c.canalPreferido}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-mono font-bold text-[#1F2937] tabular-nums">
                      {formatCurrency(c.totalComprado)}
                    </div>
                    <div>
                      {c.saldoPendiente > 0 ? (
                        <span className="text-[10px] font-medium text-[#92400E]">
                          Debe {formatCurrency(c.saldoPendiente)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#059669]">
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

        {/* TOP 5 ARTÍCULOS MÁS VENDIDOS */}
        <Card className="bg-white border-[#E5DCD3] shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-[#F5EFEB]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#7C5835]" />
                <CardTitle className="text-sm sm:text-base font-black text-[#1F2937]">
                  Top Artículos Vendidos
                </CardTitle>
              </div>
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C5835] hover:text-[#5E4328] hover:underline"
              >
                <span>Ver catálogo</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 divide-y divide-[#F5EFEB]">
            {topArticulos.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280] space-y-2">
                <Package className="h-6 w-6 text-[#B8A99A] mx-auto opacity-50" />
                <p>No hay artículos despachados aún.</p>
              </div>
            ) : (
              topArticulos.map((art, index) => (
                <div 
                  key={`${art.id}-${index}`}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#FAF7F4]/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#6B7280] w-4 text-center shrink-0">
                      {index + 1}
                    </span>

                    <div className="w-7 h-7 rounded-lg bg-[#FAF7F4] border border-[#E5DCD3] text-[#7C5835] flex items-center justify-center shrink-0">
                      <Package className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#1F2937] truncate" title={art.nombreModelo}>
                        {art.nombreModelo}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] truncate">
                        {art.lineaCategoria || 'General'} • en {art.pedidosCount} {art.pedidosCount === 1 ? 'pedido' : 'pedidos'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-mono font-bold text-[#1F2937] tabular-nums">
                      {art.unidadesVendidas} <span className="font-sans text-[10px] text-[#6B7280] font-normal">unds.</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#059669]">
                      {formatCurrency(art.totalFacturado)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
