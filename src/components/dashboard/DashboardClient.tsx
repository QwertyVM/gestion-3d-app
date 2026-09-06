'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Legend 
} from 'recharts'
import { 
  DollarSign, 
  TrendingUp, 
  Layers, 
  Clock, 
  Sparkles,
  Palette,
  ArrowRight,
  ShieldCheck,
  Lock,
  Wallet,
  CreditCard,
  X,
  CheckCircle2,
  Receipt,
  RefreshCw,
  AlertTriangle,
  Package
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { registrarAbonoDashboard } from '@/actions/dashboard'

const NOVA_DONUT_COLORS = ['#A36F4C', '#1E5E3A', '#854D0E', '#633E20', '#944917', '#B57D68']

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

// Custom Tooltip ordenado en cascada: 1) Venta Total, 2) (-) Costo Fabricación, 3) (=) Ganancia Neta
function CustomEvolucionTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const ingresos = Number(data.ingresos || 0)
    const costo = Number(data.costo || 0)
    const ganancia = Number(data.ganancia != null ? data.ganancia : (ingresos - costo))

    return (
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl shadow-xl overflow-hidden min-w-[220px] text-xs font-sans animate-in fade-in duration-150">
        {/* Cabecera */}
        <div className="bg-[#FAF8F5] border-b border-[#E2D9CC] px-3.5 py-2 flex items-center justify-between">
          <span className="font-black text-[#241C15]">{formatFechaEvolucion(label, true)}</span>
          <span className="text-[10px] text-[#75695D] font-mono uppercase font-bold">Cascada Contable</span>
        </div>

        {/* Cuerpo del Tooltip: Cascada Contable */}
        <div className="p-3.5 space-y-2">
          {/* Fila 1: Venta Total / Ingreso Bruto */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#A36F4C] font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A36F4C]" />
              1. Venta Total:
            </span>
            <span className="font-mono font-black text-[#A36F4C] tabular-nums">
              S/ {ingresos.toFixed(2)}
            </span>
          </div>

          {/* Fila 2: Costo de Fabricación */}
          <div className="flex items-center justify-between gap-3 text-[#75695D]">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#75695D]" />
              2. (-) Costo Fab.:
            </span>
            <span className="font-mono font-bold tabular-nums">
              S/ {costo.toFixed(2)}
            </span>
          </div>

          {/* Divisor sutil */}
          <div className="border-t border-[#E2D9CC] my-1" />

          {/* Fila 3: Ganancia Neta */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <span className={`${ganancia >= 0 ? 'text-[#1E5E3A]' : 'text-[#854D0E]'} font-black flex items-center gap-1.5`}>
              <span className={`w-2.5 h-2.5 rounded-full ${ganancia >= 0 ? 'bg-[#1E5E3A]' : 'bg-[#854D0E]'}`} />
              3. (=) Ganancia Neta:
            </span>
            <span className={`font-mono font-black tabular-nums ${ganancia >= 0 ? 'text-[#1E5E3A]' : 'text-[#854D0E]'}`}>
              {ganancia < 0 ? `-S/ ${Math.abs(ganancia).toFixed(2)}` : `+S/ ${ganancia.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Leyenda personalizada para el gráfico de evolución
function CustomEvolutionLegend() {
  return (
    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3 sm:gap-4 text-xs pb-3 pt-1">
      <div className="flex items-center gap-1.5 font-bold text-[#A36F4C]">
        <span className="w-3.5 h-1 bg-[#A36F4C] rounded-full inline-block" />
        <span>Ingreso Bruto</span>
      </div>
      <div className="flex items-center gap-1.5 font-semibold text-[#75695D]">
        <span className="w-3 h-3 bg-[#75695D] rounded-xs inline-block" />
        <span>Costo de Fabricación</span>
      </div>
      <div className="flex items-center gap-1.5 font-bold text-[#1E5E3A]">
        <span className="w-3 h-3 bg-[#1E5E3A] rounded-xs inline-block" />
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

type RangoTemporal = '15D' | '30D' | 'MES' | 'TODO'

export function DashboardClient({ 
  kpis, 
  capacidadGasto,
  graficoEvolucion, 
  graficoInversion, 
  cuentasPorCobrar,
  topColores = []
}: DashboardClientProps) {
  const router = useRouter()
  const [rangoTemporal, setRangoTemporal] = useState<RangoTemporal>('30D')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Estado del Modal de Cobro Rápido
  const [modalCobroOpen, setModalCobroOpen] = useState(false)
  const [selectedCuentaCobro, setSelectedCuentaCobro] = useState<any>(null)
  const [cobroMonto, setCobroMonto] = useState('')
  const [cobroMetodo, setCobroMetodo] = useState('YAPE')
  const [cobroTipo, setCobroTipo] = useState('PAGO_TOTAL')
  const [cobroNotas, setCobroNotas] = useState('')
  const [isSubmittingCobro, setIsSubmittingCobro] = useState(false)

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

  // Filtrado temporal interactivo del gráfico de evolución
  const graficoFiltrado = useMemo(() => {
    if (!graficoEvolucion || graficoEvolucion.length === 0) return []
    if (rangoTemporal === 'TODO') return graficoEvolucion

    const sorted = [...graficoEvolucion].sort((a, b) => a.fecha.localeCompare(b.fecha))
    
    if (rangoTemporal === '15D') {
      return sorted.slice(-15)
    }
    if (rangoTemporal === '30D') {
      return sorted.slice(-30)
    }
    if (rangoTemporal === 'MES') {
      const now = new Date()
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const mesActualItems = sorted.filter(item => item.fecha.startsWith(currentYearMonth))
      return mesActualItems.length > 0 ? mesActualItems : sorted.slice(-15)
    }
    return sorted
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

  const handleOpenCobroModal = (cuenta: any) => {
    setSelectedCuentaCobro(cuenta)
    const saldo = Number(cuenta.saldoPendiente || 0)
    setCobroMonto(saldo > 0 ? saldo.toFixed(2) : '')
    setCobroMetodo('YAPE')
    setCobroTipo('PAGO_TOTAL')
    setCobroNotas('')
    setModalCobroOpen(true)
  }

  const handleSubmitCobro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCuentaCobro) return

    const montoNum = Number(cobroMonto)
    if (!montoNum || montoNum <= 0) {
      alert('Por favor ingresa un monto válido a liquidar.')
      return
    }

    setIsSubmittingCobro(true)
    try {
      const res = await registrarAbonoDashboard(selectedCuentaCobro.id, {
        monto: montoNum,
        metodoPago: cobroMetodo,
        tipo: cobroTipo,
        notas: cobroNotas.trim() || undefined
      })

      if (res && res.success) {
        setModalCobroOpen(false)
        setSelectedCuentaCobro(null)
        router.refresh()
      } else {
        alert(res?.error || 'No se pudo registrar el cobro.')
      }
    } catch (err: any) {
      alert(err.message || 'Error inesperado al registrar el abono.')
    } finally {
      setIsSubmittingCobro(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 pb-8">
      {/* ========================================================================= */}
      {/* 1. HEADER EJECUTIVO                                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] p-4 sm:p-5 rounded-3xl border border-[#E2D9CC] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-2xs flex-shrink-0">
              <Sparkles className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#241C15]">
                Dashboard General
              </h1>
              <p className="text-xs text-[#75695D] mt-0.5">
                Métricas financieras, rentabilidad sobre costos y flujo comercial en tiempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Pill informativa con dot verde pulsante */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF7EE] border border-[#B4E3C0] text-[#1E5E3A] text-xs font-extrabold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E5E3A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1E5E3A]"></span>
            </span>
            <span>Actualización automática activa</span>
          </div>

          <button
            onClick={handleManualRefresh}
            title="Refrescar métricas ahora"
            className="p-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#F4EFEA] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#A36F4C]' : ''}`} />
          </button>

          {/* Enlace al Simulador & Presupuesto */}
          <Link
            href="/finanzas/proyecciones"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#241C15] border border-[#D4BEA7] shadow-2xs transition-all"
          >
            <TrendingUp className="h-4 w-4 text-[#A36F4C]" />
            <span>Simulador & Presupuesto del Mes</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BANDA DE TESORERÍA EN CASCADA (GRID 3 COLUMNAS)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Tarjeta Principal (Verde Bosque #1E5E3A) */}
        <div className="bg-[#FFFFFF] border-2 border-[#B4E3C0] rounded-3xl p-4 sm:p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1E5E3A]" />
          
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1E5E3A] block">
                Capacidad de Gasto Libre
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-[#1E5E3A] tracking-tight tabular-nums">
                {formatCurrency(gasto.gastoDisponibleHoy)}
              </div>
            </div>
            <div className={`p-2.5 rounded-2xl border flex-shrink-0 ${
              gasto.gastoDisponibleHoy > 0 
                ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                : 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]'
            }`}>
              <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2D9CC]/60 flex items-center justify-between text-xs">
            <span className="text-[#75695D] text-[11px]">
              Excedente real disponible sin tocar lo blindado
            </span>
            <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 shrink-0 ${
              gasto.gastoDisponibleHoy > 0
                ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                : 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]'
            }`}>
              {gasto.gastoDisponibleHoy > 0 ? 'Excedente Libre Hoy' : 'Fondos Comprometidos'}
            </Badge>
          </div>
        </div>

        {/* Tarjeta Neutra (#FFFFFF con top bar #241C15) */}
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl p-4 sm:p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-[#241C15]/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#241C15]" />
          
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#75695D] block">
                Lo que tengo en Caja
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-[#241C15] tracking-tight tabular-nums">
                {formatCurrency(gasto.saldoActualCaja)}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] text-[#241C15] flex-shrink-0">
              <Wallet className="h-5 w-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2D9CC]/60 text-xs text-[#75695D]">
            <span className="text-[11px]">
              Saldo efectivo cobrado y disponible en cuentas bancarias
            </span>
          </div>
        </div>

        {/* Tarjeta Blindaje (Terracota #A36F4C) */}
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl p-4 sm:p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-[#A36F4C] transition-all">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#A36F4C]" />
          
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#A36F4C] block">
                Fondo Blindado / Intocable
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-[#633E20] tracking-tight tabular-nums">
                {formatCurrency(gasto.totalBlindadoMes)}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] flex-shrink-0">
              <Lock className="h-5 w-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2D9CC]/60 text-xs text-[#75695D]">
            <span className="text-[11px]">
              Reserva para cuota BCP (S/ {gasto.cuotaPrestamoMensual.toFixed(2)}) + Capex + Costos fijos
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILA DE RENDIMIENTO OPERATIVO (GRID 4 COLUMNAS)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: GANANCIA NETA DE VENTAS */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-xs hover:border-[#1E5E3A] transition-all relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E5E3A]" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4 sm:px-5">
            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-[#1E5E3A]">
              Ganancia Neta de Ventas
            </CardTitle>
            <div className="p-1.5 rounded-xl bg-[#EBF7EE] text-[#1E5E3A]">
              <DollarSign className="h-4 w-4 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pb-4 px-4 sm:px-5">
            <div className="text-xl sm:text-2xl font-black text-[#1E5E3A] font-mono leading-tight tabular-nums">
              +{formatCurrency(kpis.gananciaNeta)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#75695D]">
              <span>Margen neto:</span>
              <Badge variant="outline" className="font-mono text-[#1E5E3A] font-bold bg-[#EBF7EE] border-[#B4E3C0] text-[10px] px-1.5 py-0">
                +{kpis.margenPorcentaje.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-[10px] text-[#75695D] pt-1 border-t border-[#E2D9CC]/50 truncate">
              Ventas ({formatCurrency(kpis.ingresosVentas)}) - Costos ({formatCurrency(kpis.costoFabricacionTotal)})
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: INGRESOS POR VENTAS */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-xs hover:border-[#A36F4C] transition-all relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#A36F4C]" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4 sm:px-5">
            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-[#A36F4C]">
              Ingresos por Ventas
            </CardTitle>
            <div className="p-1.5 rounded-xl bg-[#EFE5D8] text-[#A36F4C]">
              <TrendingUp className="h-4 w-4 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pb-4 px-4 sm:px-5">
            <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono leading-tight tabular-nums">
              {formatCurrency(kpis.ingresosVentas)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#75695D]">
              <span>Ticket Promedio:</span>
              <span className="font-mono text-[#241C15] font-extrabold tabular-nums">
                {formatCurrency(kpis.ticketPromedio)}
              </span>
            </div>
            <p className="text-[10px] text-[#75695D] pt-1 border-t border-[#E2D9CC]/50 truncate">
              Total facturado en modelos 3D y piezas
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: COSTO DE FABRICACIÓN */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-xs hover:border-[#75695D] transition-all relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#75695D]" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4 sm:px-5">
            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-[#75695D]">
              Costo de Fabricación
            </CardTitle>
            <div className="p-1.5 rounded-xl bg-[#F4EFEA] text-[#75695D]">
              <Layers className="h-4 w-4 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pb-4 px-4 sm:px-5">
            <div className="text-xl sm:text-2xl font-black text-[#75695D] font-mono leading-tight tabular-nums">
              {formatCurrency(kpis.costoFabricacionTotal)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#75695D]">
              <span>% sobre precio:</span>
              <span className="font-mono text-[#241C15] font-extrabold tabular-nums">
                {kpis.ingresosVentas > 0 
                  ? `${((kpis.costoFabricacionTotal / kpis.ingresosVentas) * 100).toFixed(1)}% del precio`
                  : '0%'}
              </span>
            </div>
            <p className="text-[10px] text-[#75695D] pt-1 border-t border-[#E2D9CC]/50 truncate">
              Filamento, energía y amortización
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: COBRANZAS & SALDOS */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-xs hover:border-[#854D0E] transition-all relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#854D0E]" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4 sm:px-5">
            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-[#854D0E]">
              Cobranzas & Saldos
            </CardTitle>
            <div className="p-1.5 rounded-xl bg-[#FEF9C3] text-[#854D0E]">
              <Clock className="h-4 w-4 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pb-4 px-4 sm:px-5">
            <div className="text-xl sm:text-2xl font-black text-[#854D0E] font-mono leading-tight tabular-nums">
              {formatCurrency(kpis.saldoPorCobrar)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#75695D]">
              <span>Cobrado en Caja:</span>
              <span className="font-mono text-[#1E5E3A] font-extrabold tabular-nums">
                {formatCurrency(kpis.totalCobradoVentas)}
              </span>
            </div>
            <p className="text-[10px] text-[#75695D] pt-1 border-t border-[#E2D9CC]/50 truncate">
              Saldos pendientes de liquidación a clientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 4. BLOQUE CENTRAL ANALÍTICO (GRID 3 COLUMNAS: 2 GRAFICO + 1 DONUT)         */}
      {/* ========================================================================= */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Gráfico Principal: Evolución Financiera y Rentabilidad (lg:col-span-2) */}
        <Card className="lg:col-span-2 bg-[#FFFFFF] border-[#E2D9CC] shadow-xs rounded-3xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <CardTitle className="text-[#241C15] text-sm sm:text-base font-black">
                  Evolución Financiera y Rentabilidad
                </CardTitle>
                <CardDescription className="text-xs text-[#75695D]">
                  Barras apiladas de Costo y Ganancia Neta coronadas con Ingreso Bruto.
                </CardDescription>
              </div>

              {/* Selector de Rango Temporal */}
              <div className="flex items-center bg-[#FAF8F5] p-1 rounded-2xl border border-[#E2D9CC] self-start sm:self-auto">
                {(['15D', '30D', 'MES', 'TODO'] as RangoTemporal[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRangoTemporal(r)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      rangoTemporal === r
                        ? 'bg-[#A36F4C] text-white shadow-2xs'
                        : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8]/50'
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" vertical={false} opacity={0.6} />
                  
                  <XAxis 
                    dataKey="fecha" 
                    stroke="#75695D" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#E2D9CC' }}
                    tickFormatter={(val) => formatFechaEvolucion(val, false)}
                    dy={4}
                  />
                  
                  <YAxis 
                    stroke="#75695D" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => val < 0 ? `-S/${Math.abs(val)}` : `S/${val}`}
                  />
                  
                  <Tooltip content={<CustomEvolucionTooltip />} />
                  
                  <Legend content={<CustomEvolutionLegend />} verticalAlign="top" />

                  {/* Barras Apiladas: Costo de Fabricación (#75695D) */}
                  <Bar 
                    dataKey="costo" 
                    name="Costo Fabricación" 
                    stackId="a"
                    fill="#75695D" 
                    radius={[0, 0, 0, 0]} 
                    maxBarSize={28}
                  />

                  {/* Barras Apiladas: Ganancia Neta (#1E5E3A) */}
                  <Bar 
                    dataKey="ganancia" 
                    name="Ganancia Neta" 
                    stackId="a"
                    fill="#1E5E3A" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={28}
                  />

                  {/* Línea Superior: Ingreso Bruto (#A36F4C) */}
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#A36F4C" 
                    strokeWidth={3} 
                    dot={{ r: 3.5, fill: '#A36F4C', stroke: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 5.5, fill: '#A36F4C', stroke: '#FFFFFF', strokeWidth: 2 }}
                    name="ingresos" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Donut: Distribución de Gastos (lg:col-span-1) */}
        <Card className="lg:col-span-1 bg-[#FFFFFF] border-[#E2D9CC] shadow-xs rounded-3xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-[#241C15] text-sm sm:text-base font-black">
              Distribución de Gastos
            </CardTitle>
            <CardDescription className="text-xs text-[#75695D]">
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
                      <Cell key={`cell-${index}`} fill={NOVA_DONUT_COLORS[index % NOVA_DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CC', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', fontSize: '12px' }}
                    formatter={(val: any) => [`S/ ${Number(val).toFixed(2)}`, 'Gasto']}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-[10px] text-[#75695D] uppercase font-black tracking-wider">Total Gastos</span>
                <span className="text-base sm:text-lg font-black text-[#241C15] font-mono tabular-nums">
                  {formatCurrency(totalEgresosCalculado)}
                </span>
              </div>
            </div>

            {/* Leyenda Semántica con Montos y Porcentajes */}
            <div className="space-y-2 pt-2 border-t border-[#E2D9CC]">
              {graficoInversion.map((item, idx) => {
                const pct = totalEgresosCalculado > 0 ? ((item.value / totalEgresosCalculado) * 100).toFixed(1) : '0'
                const color = NOVA_DONUT_COLORS[idx % NOVA_DONUT_COLORS.length]

                return (
                  <div key={item.name} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-bold text-[#241C15] truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-black text-[#241C15] tabular-nums">
                        {formatCurrency(item.value)}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono font-bold bg-[#FAF8F5] border-[#E2D9CC] text-[#75695D] px-1.5 py-0">
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

      {/* ========================================================================= */}
      {/* 5. BLOQUE INFERIOR DE ACCIÓN INMEDIATA (GRID 2 COLUMNAS)                   */}
      {/* ========================================================================= */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 items-start">
        {/* Columna Izquierda: Cuentas Pendientes por Cobrar */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-xs rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <CardTitle className="text-[#241C15] text-sm sm:text-base font-black flex items-center gap-2">
                  <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-[#854D0E]" />
                  <span>Cuentas Pendientes por Cobrar ({cuentasPorCobrar.length})</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#75695D]">
                  Pedidos pendientes con saldo a favor del taller.
                </CardDescription>
              </div>

              {kpis.saldoPorCobrar > 0 && (
                <Badge variant="outline" className="text-[#854D0E] border-[#FDE047] bg-[#FEF9C3] font-mono font-black text-xs px-2.5 py-1 shadow-2xs shrink-0">
                  {formatCurrency(kpis.saldoPorCobrar)} por liquidar
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {cuentasPorCobrar.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#E2D9CC] space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#EBF7EE] text-[#1E5E3A] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-black text-[#1E5E3A]">¡Al día! No hay cuentas pendientes 🎉</p>
                  <p className="text-xs text-[#75695D]">Todos los pedidos registrados se encuentran 100% liquidados.</p>
                </div>
              ) : (
                cuentasPorCobrar.map((cuenta) => (
                  <div 
                    key={cuenta.id} 
                    className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] hover:bg-[#F4EFEA] hover:border-[#D4BEA7] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-[#241C15]">
                          {cuenta.cliente}
                        </span>
                        {cuenta.canalVenta && (
                          <span className="text-[10px] font-bold text-[#A36F4C] bg-[#EFE5D8] px-1.5 py-0.2 rounded-md">
                            {cuenta.canalVenta}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#75695D] mt-0.5 truncate font-medium">
                        {cuenta.nombreProductoSnapshot || cuenta.producto?.nombreModelo || 'Modelo 3D'} • <span className="font-mono">{formatDate(cuenta.fecha)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                      <Badge variant="outline" className="text-[#854D0E] border-[#FDE047] bg-[#FEF9C3] font-mono text-xs font-black px-2.5 py-1">
                        Debe: {formatCurrency(Number(cuenta.saldoPendiente))}
                      </Badge>

                      <Button
                        size="sm"
                        onClick={() => handleOpenCobroModal(cuenta)}
                        className="h-8 px-3 rounded-xl bg-[#EBF7EE] hover:bg-[#D4EFE0] text-[#1E5E3A] border border-[#B4E3C0] font-black text-xs cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Liquidar Cobro</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Columna Derecha: Monitor de Consumo & Filamentos */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-xs rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <CardTitle className="text-[#241C15] text-sm sm:text-base font-black flex items-center gap-2">
                  <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-[#A36F4C]" />
                  <span>Monitor de Consumo & Filamentos</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#75695D]">
                  Filamentos con mayor frecuencia de uso y rotación en taller.
                </CardDescription>
              </div>

              <Link 
                href="/catalogo/inventario" 
                className="text-xs font-black text-[#A36F4C] hover:text-[#633E20] flex items-center gap-1 shrink-0 bg-[#FAF8F5] hover:bg-[#F4EFEA] border border-[#D4BEA7] px-3 py-1.5 rounded-xl transition-all shadow-2xs"
              >
                <span>Inventario</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {(!topColores || topColores.length === 0) ? (
                <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#E2D9CC] space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#EFE5D8] text-[#A36F4C] flex items-center justify-center mx-auto">
                    <Palette className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-black text-[#633E20]">Aún no hay pedidos con colores asignados 🎨</p>
                  <p className="text-xs text-[#75695D]">Asigna bobinas en los pedidos para visualizar el ranking de rotación.</p>
                </div>
              ) : (
                topColores.map((color, index) => {
                  const isFirst = index === 0
                  const esCritico = color.alertaCritica || color.stockGramosActual < 300

                  return (
                    <div 
                      key={color.id || color.nombreColor} 
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                        isFirst
                          ? 'bg-[#FDFBF7] border-[#D4BEA7] shadow-2xs'
                          : 'bg-[#FAF8F5] border-[#E2D9CC] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Rank Badge */}
                          <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black font-mono shrink-0 ${
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
                            className="h-7 w-7 rounded-full border border-black/15 shadow-xs shrink-0"
                            style={{ backgroundColor: color.codigoHex }}
                            title={color.nombreColor}
                          />

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-black text-[#241C15] truncate">
                                {color.nombreColor}
                              </span>
                              {isFirst && (
                                <span className="text-[9px] font-black text-[#A36F4C] bg-[#EFE5D8] border border-[#D4BEA7] px-1.5 py-0.2 rounded uppercase shrink-0">
                                  Top 1
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#75695D] mt-0.5 flex-wrap font-medium">
                              <span><strong className="text-[#241C15] font-mono">{color.pedidosCount}</strong> ped.</span>
                              <span>•</span>
                              <span><strong className="text-[#241C15] font-mono">{color.unidadesCount}</strong> un.</span>
                              <span>•</span>
                              <span className="font-mono text-[#A36F4C] font-black">{color.gramosTotal}g</span>
                            </div>
                          </div>
                        </div>

                        {/* Stock en Taller Badge */}
                        <div className="flex flex-col items-end shrink-0">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-mono font-black px-2 py-0.5 shadow-2xs ${
                              esCritico
                                ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]'
                                : 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                            }`}
                          >
                            {esCritico ? `⚠️ ${color.stockGramosActual}g (Consultar stock)` : `${color.stockGramosActual}g`}
                          </Badge>
                          <span className="text-[10px] font-mono text-[#75695D] mt-0.5 font-bold">
                            {color.porcentajeUso}% uso
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="w-full bg-[#EAE4DC] h-1.5 rounded-full overflow-hidden mt-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            esCritico ? 'bg-[#854D0E]' : 'bg-[#A36F4C]'
                          }`}
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

      {/* ========================================================================= */}
      {/* 6. MODAL: REGISTRAR COBRO / LIQUIDACIÓN RÁPIDA                            */}
      {/* ========================================================================= */}
      {modalCobroOpen && selectedCuentaCobro && (
        <div className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border border-[#D4BEA7] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#FAF8F5] border-b border-[#E2D9CC] p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#241C15] flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#1E5E3A]" />
                  <span>Registrar Cobro / Liquidación</span>
                </h3>
                <p className="text-xs text-[#75695D] mt-0.5">
                  Cliente: <strong className="text-[#241C15]">{selectedCuentaCobro.cliente}</strong>
                </p>
              </div>

              <button
                onClick={() => setModalCobroOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#EAE4DC] text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitCobro} className="p-4 sm:p-6 space-y-4">
              <div className="p-3 bg-[#FEF9C3] border border-[#FDE047] rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold text-[#854D0E]">Saldo Pendiente Actual:</span>
                <span className="font-mono font-black text-sm text-[#854D0E]">
                  {formatCurrency(Number(selectedCuentaCobro.saldoPendiente))}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#241C15]">Monto a Cobrar (S/) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={cobroMonto}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCobroMonto(e.target.value)}
                  className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl font-mono font-bold"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#241C15]">Método de Pago</Label>
                  <select
                    value={cobroMetodo}
                    onChange={(e) => setCobroMetodo(e.target.value)}
                    className="w-full h-9 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] px-3 text-xs text-[#241C15] font-bold"
                  >
                    <option value="YAPE">Yape</option>
                    <option value="PLIN">Plin</option>
                    <option value="BCP">BCP Transferencia</option>
                    <option value="EFECTIVO">Efectivo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#241C15]">Tipo de Cobro</Label>
                  <select
                    value={cobroTipo}
                    onChange={(e) => setCobroTipo(e.target.value)}
                    className="w-full h-9 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] px-3 text-xs text-[#241C15] font-bold"
                  >
                    <option value="PAGO_TOTAL">Liquidación Total</option>
                    <option value="ANTICIPO">Anticipo / Adelanto</option>
                    <option value="ABONO">Abono Parcial</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#241C15]">Nota / Referencia (Opcional)</Label>
                <Input
                  value={cobroNotas}
                  onChange={(e) => setCobroNotas(e.target.value)}
                  placeholder="Ej: Yape de confirmación, N° operación..."
                  className="bg-[#FAF8F5] border-[#E2D9CC] text-xs rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-[#E2D9CC] flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalCobroOpen(false)}
                  className="h-9 px-4 rounded-xl border-[#E2D9CC] text-xs font-bold"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmittingCobro}
                  className="h-9 px-5 rounded-xl bg-[#1E5E3A] hover:bg-[#16482C] text-white font-black text-xs cursor-pointer shadow-sm"
                >
                  {isSubmittingCobro ? 'Guardando...' : 'Confirmar Cobro'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
