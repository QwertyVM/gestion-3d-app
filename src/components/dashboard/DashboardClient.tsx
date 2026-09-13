'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Layers, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  Wallet,
  RefreshCw
} from 'lucide-react'

// Jerarquía de colores cálidos + verde para la distribución de gastos (Donut Chart)
// 1. Maquinaria & Equipos: Moca / Café cálido (#7C5835)
// 2. Insumos & Materiales: Taupe medio cálido (#B8A99A)
// 3. Servicios & Operativos: Verde esmeralda (#059669)
const WARM_DONUT_COLORS = ['#7C5835', '#B8A99A', '#059669', '#8C6239', '#D5C7B8', '#10B981']

// Formateador de fecha para el tooltip y eje X (ej: 26 Ago)
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

// Custom Tooltip ejecutivo con estado de resultados (P&L diario)
function CustomEvolucionTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const ingresos = Number(data.ingresos || 0)
    const costo = Number(data.costo || 0)
    const ganancia = Number(data.ganancia != null ? data.ganancia : (ingresos - costo))
    const isNegative = ganancia < 0
    const margenPct = ingresos > 0 ? ((ganancia / ingresos) * 100).toFixed(1) : null

    return (
      <div className="bg-[#FFFFFF] border border-[#E5DCD3] rounded-2xl shadow-xl overflow-hidden min-w-[240px] text-xs font-sans animate-in fade-in duration-150">
        {/* Cabecera con estado de resultado */}
        <div className={`px-3.5 py-2 flex items-center justify-between border-b ${
          isNegative 
            ? 'bg-[#FEF2F2] border-[#FEE2E2]' 
            : 'bg-[#ECFDF5] border-[#D1FAE5]'
        }`}>
          <span className="font-black text-[#1F2937]">{formatFechaEvolucion(label, true)}</span>
          <span className={`text-[10px] font-mono uppercase font-black tracking-wider ${
            isNegative ? 'text-[#DC2626]' : 'text-[#059669]'
          }`}>
            {isNegative ? '⚠️ Pérdida / Costo' : '✓ Utilidad Neta'}
          </span>
        </div>

        {/* Desglose P&L */}
        <div className="p-3.5 space-y-2">
          {/* 1. Ingreso Facturado */}
          <div className="flex items-center justify-between gap-3 text-[#6B7280]">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B8A99A]" />
              Facturación Bruta:
            </span>
            <span className="font-mono font-bold text-[#1F2937] tabular-nums">
              S/ {ingresos.toFixed(2)}
            </span>
          </div>

          {/* 2. Costo Fabricación */}
          <div className="flex items-center justify-between gap-3 text-[#6B7280]">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7C5835]" />
              (-) Costo Fabricación:
            </span>
            <span className="font-mono font-bold text-[#1F2937] tabular-nums">
              S/ {costo.toFixed(2)}
            </span>
          </div>

          {/* Línea divisoria */}
          <div className="pt-2 border-t border-[#E5DCD3] flex items-center justify-between">
            <span className={`font-black flex items-center gap-1.5 ${
              isNegative ? 'text-[#DC2626]' : 'text-[#059669]'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isNegative ? 'bg-[#DC2626]' : 'bg-[#059669]'}`} />
              (=) Resultado Neto:
            </span>
            <span className={`font-mono font-black text-sm tabular-nums ${
              isNegative ? 'text-[#DC2626]' : 'text-[#059669]'
            }`}>
              {isNegative ? `-S/ ${Math.abs(ganancia).toFixed(2)}` : `+S/ ${ganancia.toFixed(2)}`}
            </span>
          </div>

          {/* Subtexto / Margen o aclaración */}
          <div className="pt-1.5 border-t border-[#F5EFEB] flex items-center justify-between text-[10px] text-[#6B7280]">
            {margenPct !== null ? (
              <>
                <span>Margen de Rentabilidad:</span>
                <strong className={`font-mono font-black ${isNegative ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                  {isNegative ? '' : '+'}{margenPct}%
                </strong>
              </>
            ) : (
              <span className="italic text-center w-full text-[#7C5835] font-medium">
                Día de producción sin ventas registradas
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Leyenda personalizada para el gráfico: Resultado Neto (Barras) + Facturación Bruta (Línea)
function CustomEvolutionLegend() {
  return (
    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3 sm:gap-4 text-xs pb-3 pt-1">
      <div className="flex items-center gap-1.5 font-bold text-[#059669]">
        <span className="w-3 h-3 bg-[#059669] rounded-xs inline-block" />
        <span>Utilidad Neta (+)</span>
      </div>
      <div className="flex items-center gap-1.5 font-bold text-[#DC2626]">
        <span className="w-3 h-3 bg-[#DC2626] rounded-xs inline-block" />
        <span>Pérdida / Costo (-)</span>
      </div>
      <div className="flex items-center gap-1.5 font-bold text-[#7C5835]">
        <span className="relative flex items-center justify-center w-4 h-3">
          <span className="w-full h-0.5 bg-[#7C5835] rounded-full inline-block" />
          <span className="absolute w-2 h-2 rounded-full bg-[#7C5835] border border-white" />
        </span>
        <span>Facturación Bruta</span>
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
  cuentasPorCobrar?: any[]
  topColores?: TopColorItem[]
}

type RangoTemporal = '15D' | '30D' | 'MES' | 'TODO'

export function DashboardClient({ 
  kpis, 
  capacidadGasto,
  graficoEvolucion, 
  graficoInversion
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

  // Filtrado temporal interactivo del gráfico de evolución (Resultado Diario)
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

  // Cálculos de porcentajes para el gráfico de composición de ventas y cobranzas
  const totalVentasVal = kpis.ingresosVentas || 0
  const costoPct = totalVentasVal > 0 ? Math.min(100, Math.max(0, (kpis.costoFabricacionTotal / totalVentasVal) * 100)) : 0
  const gananciaPct = totalVentasVal > 0 ? Math.min(100, Math.max(0, (kpis.gananciaNeta / totalVentasVal) * 100)) : 0

  const cobradoPct = totalVentasVal > 0 ? Math.min(100, Math.max(0, (kpis.totalCobradoVentas / totalVentasVal) * 100)) : 0
  const saldoPct = totalVentasVal > 0 ? Math.min(100, Math.max(0, (kpis.saldoPorCobrar / totalVentasVal) * 100)) : 0

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 pb-8">
      {/* ========================================================================= */}
      {/* 1. HEADER EJECUTIVO                                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#F5EFEB] border border-[#E5DCD3] text-[#7C5835] shadow-2xs flex-shrink-0">
              <Sparkles className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#1F2937]">
                Dashboard General
              </h1>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Métricas financieras, rentabilidad sobre costos y flujo comercial en tiempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Pill informativa con dot verde pulsante */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-extrabold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]"></span>
            </span>
            <span>Actualización automática activa</span>
          </div>

          <button
            onClick={handleManualRefresh}
            title="Refrescar métricas ahora"
            className="p-2.5 rounded-2xl bg-[#F5EFEB] hover:bg-[#EFE8E1] border border-[#E5DCD3] text-[#6B7280] hover:text-[#1F2937] transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#7C5835]' : ''}`} />
          </button>

          {/* Enlace al Simulador & Presupuesto */}
          <Link
            href="/finanzas/proyecciones"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black bg-[#F5EFEB] hover:bg-[#EFE8E1] text-[#1F2937] border border-[#E5DCD3] shadow-2xs transition-all"
          >
            <TrendingUp className="h-4 w-4 text-[#7C5835]" />
            <span>Simulador & Presupuesto del Mes</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTROL DE TESORERÍA & ANATOMÍA FINANCIERA (LAYOUT SIDE-BY-SIDE)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* COLUMNA 1: Cuadro Unificado de Tesorería (Vertical - 5 cols) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E5DCD3] rounded-3xl shadow-xs overflow-hidden flex flex-col justify-between">
          {/* Encabezado del Cuadro */}
          <div className="bg-[#FAF7F4] px-4 sm:px-5 py-3 border-b border-[#E5DCD3] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#F5EFEB] border border-[#E5DCD3] text-[#7C5835]">
                <Wallet className="h-4 w-4 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xs font-black text-[#1F2937] uppercase tracking-wider">
                  Control de Tesorería
                </h2>
                <p className="text-[10px] text-[#6B7280]">
                  Disponibilidad, caja y blindaje del mes
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 shrink-0 ${
              gasto.gastoDisponibleHoy > 0
                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
            }`}>
              {gasto.gastoDisponibleHoy > 0 ? '✓ Excedente Libre' : '⚠️ Comprometido'}
            </Badge>
          </div>

          {/* 3 Filas Verticales */}
          <div className="divide-y divide-[#E5DCD3] flex-1 flex flex-col justify-between">
            
            {/* 1. Capacidad de Gasto Libre */}
            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-[#FAF7F4]/50 hover:bg-[#FAF7F4] transition-colors relative flex-1">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#059669]" />
              <div className="flex items-center gap-2.5 min-w-0 pl-1">
                <div className={`p-2 rounded-xl border flex-shrink-0 ${
                  gasto.gastoDisponibleHoy > 0 
                    ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                    : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                }`}>
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-[#059669] truncate">
                      Capacidad de Gasto Libre
                    </span>
                    <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 shrink-0 ${
                      gasto.gastoDisponibleHoy > 0
                        ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                        : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                    }`}>
                      {gasto.gastoDisponibleHoy > 0 ? 'Libre' : 'Ajustado'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#6B7280] truncate">
                    Excedente real sin tocar lo blindado
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg sm:text-xl font-black font-mono text-[#059669] tracking-tight tabular-nums">
                  {formatCurrency(gasto.gastoDisponibleHoy)}
                </div>
              </div>
            </div>

            {/* 2. Lo que tengo en Caja */}
            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#FAF7F4] transition-colors relative flex-1">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1F2937]" />
              <div className="flex items-center gap-2.5 min-w-0 pl-1">
                <div className="p-2 rounded-xl bg-[#F5EFEB] border border-[#E5DCD3] text-[#1F2937] flex-shrink-0">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black uppercase tracking-wider text-[#1F2937] block truncate">
                    Lo que tengo en Caja
                  </span>
                  <p className="text-[11px] text-[#6B7280] truncate">
                    Saldo efectivo disponible en cuentas
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg sm:text-xl font-black font-mono text-[#1F2937] tracking-tight tabular-nums">
                  {formatCurrency(gasto.saldoActualCaja)}
                </div>
              </div>
            </div>

            {/* 3. Fondo Blindado e Intocable */}
            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#FAF7F4] transition-colors relative flex-1">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7C5835]" />
              <div className="flex items-center gap-2.5 min-w-0 pl-1">
                <div className="p-2 rounded-xl bg-[#F5EFEB] border border-[#E5DCD3] text-[#7C5835] flex-shrink-0">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black uppercase tracking-wider text-[#7C5835] block truncate">
                    Fondo Blindado / Intocable
                  </span>
                  <p className="text-[11px] text-[#6B7280] truncate">
                    Reserva cuota BCP (S/ {gasto.cuotaPrestamoMensual.toFixed(2)}) + Capex + Costos
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg sm:text-xl font-black font-mono text-[#7C5835] tracking-tight tabular-nums">
                  {formatCurrency(gasto.totalBlindadoMes)}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* COLUMNA 2: Estructura de Ventas y Cobranzas (Derecha de Tesorería - 7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E5DCD3] rounded-3xl shadow-xs overflow-hidden flex flex-col justify-between">
          {/* Encabezado del Cuadro */}
          <div className="bg-[#FAF7F4] px-4 sm:px-5 py-3 border-b border-[#E5DCD3] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#F5EFEB] border border-[#E5DCD3] text-[#7C5835]">
                <Layers className="h-4 w-4 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xs font-black text-[#1F2937] uppercase tracking-wider">
                  Estructura de Ventas y Cobranzas
                </h2>
                <p className="text-[10px] text-[#6B7280]">
                  Facturación: <strong className="text-[#1F2937] font-bold">{formatCurrency(kpis.ingresosVentas)}</strong> • Ticket prom.: <strong className="text-[#1F2937] font-bold">{formatCurrency(kpis.ticketPromedio)}</strong>
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] shrink-0">
              Rentabilidad: +{kpis.margenPorcentaje.toFixed(1)}%
            </Badge>
          </div>

          {/* Contenido Limpio en 2 Bloques */}
          <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-around">
            {/* 1. Margen sobre Ventas */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 sm:gap-2">
                <span className="font-extrabold text-[#1F2937]">
                  Rentabilidad sobre Ventas
                </span>
                <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
                  <span className="text-[#6B7280]">
                    Costo: <strong className="font-mono text-[#1F2937]">{formatCurrency(kpis.costoFabricacionTotal)}</strong> <span className="text-[10px] text-[#8C7A6B]">({costoPct.toFixed(1)}%)</span>
                  </span>
                  <span className="text-[#059669] font-bold">
                    Ganancia: <strong className="font-mono">+{formatCurrency(kpis.gananciaNeta)}</strong> <span className="text-[10px]">({gananciaPct.toFixed(1)}%)</span>
                  </span>
                </div>
              </div>

              {/* Barra segmentada */}
              <div className="h-2.5 w-full bg-[#F5EFEB] rounded-full overflow-hidden flex border border-[#E5DCD3]/80 shadow-2xs">
                <div 
                  className="bg-[#B8A99A] h-full transition-all duration-500" 
                  style={{ width: `${costoPct}%` }}
                  title={`Costo: ${costoPct.toFixed(1)}% (${formatCurrency(kpis.costoFabricacionTotal)})`}
                />
                <div 
                  className="bg-[#059669] h-full transition-all duration-500" 
                  style={{ width: `${gananciaPct}%` }}
                  title={`Ganancia Neta: ${gananciaPct.toFixed(1)}% (${formatCurrency(kpis.gananciaNeta)})`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B8A99A]" />
                  Inversión en Insumos / Producción
                </span>
                <span className="flex items-center gap-1.5 text-[#059669] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#059669]" />
                  Utilidad Neta Real
                </span>
              </div>
            </div>

            {/* 2. Flujo de Cobranza */}
            <div className="space-y-2 pt-3 border-t border-[#E5DCD3]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 sm:gap-2">
                <span className="font-extrabold text-[#1F2937]">
                  Efectividad de Cobranza
                </span>
                <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
                  <span className="text-[#059669] font-bold">
                    Cobrado: <strong className="font-mono">{formatCurrency(kpis.totalCobradoVentas)}</strong> <span className="text-[10px]">({cobradoPct.toFixed(1)}%)</span>
                  </span>
                  <span className="text-[#7C5835] font-bold">
                    Por Cobrar: <strong className="font-mono">{formatCurrency(kpis.saldoPorCobrar)}</strong> <span className="text-[10px]">({saldoPct.toFixed(1)}%)</span>
                  </span>
                </div>
              </div>

              {/* Barra segmentada */}
              <div className="h-2.5 w-full bg-[#F5EFEB] rounded-full overflow-hidden flex border border-[#E5DCD3]/80 shadow-2xs">
                <div 
                  className="bg-[#059669] h-full transition-all duration-500" 
                  style={{ width: `${cobradoPct}%` }}
                  title={`Cobrado: ${cobradoPct.toFixed(1)}% (${formatCurrency(kpis.totalCobradoVentas)})`}
                />
                <div 
                  className="bg-[#7C5835] h-full transition-all duration-500" 
                  style={{ width: `${saldoPct}%` }}
                  title={`Por Cobrar: ${saldoPct.toFixed(1)}% (${formatCurrency(kpis.saldoPorCobrar)})`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                <span className="flex items-center gap-1.5 text-[#059669] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#059669]" />
                  Ingreso en Caja / Cuentas
                </span>
                <span className="flex items-center gap-1.5 text-[#7C5835] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#7C5835]" />
                  Saldos Pendientes de Cobro
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BLOQUE CENTRAL ANALÍTICO (GRID: COMBO BAR/LINE + DONUT DE GASTOS)       */}
      {/* ========================================================================= */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Gráfico Principal: Rentabilidad y Facturación Diaria (lg:col-span-2) */}
        <Card className="lg:col-span-2 bg-[#FFFFFF] border-[#E5DCD3] shadow-xs rounded-3xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <CardTitle className="text-[#1F2937] text-sm sm:text-base font-black">
                  Evolución Financiera y Rentabilidad
                </CardTitle>
                <CardDescription className="text-xs text-[#6B7280]">
                  Resultado neto diario (barras) con curva de facturación bruta (línea).
                </CardDescription>
              </div>

              {/* Selector de Rango Temporal (Armonizado con Sidebar) */}
              <div className="flex items-center bg-[#F5EFEB] p-1 rounded-2xl border border-[#E5DCD3] self-start sm:self-auto">
                {(['15D', '30D', 'MES', 'TODO'] as RangoTemporal[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRangoTemporal(r)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      rangoTemporal === r
                        ? 'bg-[#7C5835] text-white shadow-2xs'
                        : 'text-[#6B7280] hover:text-[#7C5835] hover:bg-[#EFE8E1]'
                    }`}
                  >
                    {r === '15D' ? '15 Días' : r === '30D' ? '30 Días' : r === 'MES' ? 'Mes actual' : 'Todo'}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-5 pt-0">
            <div className="h-[290px] sm:h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={graficoFiltrado} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DCD3" vertical={false} opacity={0.6} />
                  
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
                    tickFormatter={(val) => val === 0 ? 'S/ 0' : val < 0 ? `-S/${Math.abs(val)}` : `+S/${val}`}
                  />
                  
                  <Tooltip content={<CustomEvolucionTooltip />} />
                  
                  <Legend content={<CustomEvolutionLegend />} verticalAlign="top" />

                  {/* Línea de flotación S/ 0 */}
                  <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={1.5} />

                  {/* Barras Divergentes de Resultado Neto */}
                  <Bar 
                    dataKey="ganancia" 
                    name="Resultado Neto" 
                    radius={[4, 4, 4, 4]}
                    maxBarSize={32}
                  >
                    {graficoFiltrado.map((entry, index) => (
                      <Cell 
                        key={`bar-cell-${index}`} 
                        fill={entry.ganancia >= 0 ? '#059669' : '#DC2626'} 
                      />
                    ))}
                  </Bar>

                  {/* Línea de Evolución de Facturación Bruta */}
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    name="Facturación Bruta"
                    stroke="#7C5835" 
                    strokeWidth={2.5} 
                    dot={{ r: 3.5, fill: '#7C5835', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 5.5, fill: '#7C5835', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Donut: Distribución de Gastos (lg:col-span-1) */}
        <Card className="lg:col-span-1 bg-[#FFFFFF] border-[#E5DCD3] shadow-xs rounded-3xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-[#1F2937] text-sm sm:text-base font-black">
              Distribución de Gastos
            </CardTitle>
            <CardDescription className="text-xs text-[#6B7280]">
              Insumos, maquinaria y costos operativos.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-4">
            {/* Donut Chart Centrado */}
            <div className="h-[210px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={graficoInversion}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  >
                    {graficoInversion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={WARM_DONUT_COLORS[index % WARM_DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5DCD3', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', fontSize: '12px' }}
                    formatter={(val: any) => [`S/ ${Number(val).toFixed(2)}`, 'Gasto']}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-[10px] text-[#6B7280] uppercase font-black tracking-wider">Total Gastos</span>
                <span className="text-base sm:text-lg font-black text-[#1F2937] font-mono tabular-nums">
                  {formatCurrency(totalEgresosCalculado)}
                </span>
              </div>
            </div>

            {/* Leyenda Semántica con Montos y Porcentajes Armonizados */}
            <div className="space-y-2 pt-2 border-t border-[#E5DCD3]">
              {graficoInversion.map((item, idx) => {
                const pct = totalEgresosCalculado > 0 ? ((item.value / totalEgresosCalculado) * 100).toFixed(1) : '0'
                const color = WARM_DONUT_COLORS[idx % WARM_DONUT_COLORS.length]

                return (
                  <div key={item.name} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-bold text-[#1F2937] truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-black text-[#1F2937] tabular-nums">
                        {formatCurrency(item.value)}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono font-bold bg-[#F5EFEB] border-[#E5DCD3] text-[#6B7280] px-1.5 py-0">
                        {pct}%
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

