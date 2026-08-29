'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  Zap, 
  RotateCcw, 
  Scale, 
  Layers, 
  Sliders, 
  Clock, 
  HelpCircle,
  PiggyBank,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Legend
} from 'recharts'
import { DatosCajaChica } from '@/actions/proyecciones'

interface ProyeccionesClientProps {
  datos: DatosCajaChica
}

type HorizonteTiempo = 3 | 6 | 12
type TipoEscenario = 'CONSERVADOR' | 'BASE' | 'OPTIMISTA' | 'PERSONALIZADO'

export function ProyeccionesClient({ datos }: ProyeccionesClientProps) {
  // Horizonte de proyección (3, 6, 12 meses)
  const [horizonte, setHorizonte] = useState<HorizonteTiempo>(6)
  const [escenario, setEscenario] = useState<TipoEscenario>('BASE')

  // Parámetros de simulación interactiva
  const [fondoReserva, setFondoReserva] = useState<number>(1500)
  const [pedidosMensuales, setPedidosMensuales] = useState<number>(18)
  const [ticketPromedio, setTicketPromedio] = useState<number>(datos.ticketPromedioVenta || 135)
  const [costoMaterialPorPedido, setCostoMaterialPorPedido] = useState<number>(datos.costoPromedioFabricacionPorPedido || 38)
  const [cuotaPrestamo, setCuotaPrestamo] = useState<number>(datos.cuotaPrestamoMensual || 363.10)
  const [gastosFijos, setGastosFijos] = useState<number>(datos.gastosFijosEstimadosMensual || 250)
  const [crecimientoMensualPct, setCrecimientoMensualPct] = useState<number>(5)
  
  // Inversión extraordinaria
  const [inversionExtraMonto, setInversionExtraMonto] = useState<number>(0)
  const [inversionExtraMes, setInversionExtraMes] = useState<number>(3)
  const [inversionExtraConcepto, setInversionExtraConcepto] = useState<string>('Nueva Impresora 3D')

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Aplicar presets de escenarios
  const handleSelectEscenario = (tipo: TipoEscenario) => {
    setEscenario(tipo)
    if (tipo === 'CONSERVADOR') {
      setPedidosMensuales(8)
      setCrecimientoMensualPct(0)
      setTicketPromedio(120)
    } else if (tipo === 'BASE') {
      setPedidosMensuales(18)
      setCrecimientoMensualPct(5)
      setTicketPromedio(datos.ticketPromedioVenta || 135)
    } else if (tipo === 'OPTIMISTA') {
      setPedidosMensuales(35)
      setCrecimientoMensualPct(12)
      setTicketPromedio(150)
    }
  }

  // Resetear a valores base del taller
  const handleReset = () => {
    setHorizonte(6)
    setEscenario('BASE')
    setFondoReserva(1500)
    setPedidosMensuales(18)
    setTicketPromedio(datos.ticketPromedioVenta || 135)
    setCostoMaterialPorPedido(datos.costoPromedioFabricacionPorPedido || 38)
    setCuotaPrestamo(datos.cuotaPrestamoMensual || 363.10)
    setGastosFijos(datos.gastosFijosEstimadosMensual || 250)
    setCrecimientoMensualPct(5)
    setInversionExtraMonto(0)
    setInversionExtraMes(3)
  }

  // Cálculos actuales
  const saldoActual = datos.saldoActualCajaChica
  const cuentasPorCobrar = datos.cuentasPorCobrar
  const gastosFijosTotalesMensuales = cuotaPrestamo + gastosFijos
  const margenUnitarioPorPedido = ticketPromedio - costoMaterialPorPedido

  // Punto de equilibrio mensual (pedidos necesarios para no quemar caja)
  const pedidosPuntoEquilibrio = margenUnitarioPorPedido > 0 
    ? Math.ceil(gastosFijosTotalesMensuales / margenUnitarioPorPedido) 
    : 0

  const montoVentasPuntoEquilibrio = pedidosPuntoEquilibrio * ticketPromedio

  // Runway de caja chica (meses de supervivencia en cero ventas)
  const runwayMeses = gastosFijosTotalesMensuales > 0 
    ? Math.max(0, Number((saldoActual / gastosFijosTotalesMensuales).toFixed(1))) 
    : 99

  // =========================================================================
  // GENERACIÓN DE LA PROYECCIÓN MES A MES
  // =========================================================================
  const proyeccionMeses = useMemo(() => {
    const mesesData = []
    let saldoAcumulado = saldoActual

    for (let i = 1; i <= horizonte; i++) {
      // Crecimiento compuesto de pedidos
      const factorCrecimiento = Math.pow(1 + crecimientoMensualPct / 100, i - 1)
      const pedidosMes = Math.round(pedidosMensuales * factorCrecimiento)

      // Ingresos del mes
      const ventasEstimadasMes = pedidosMes * ticketPromedio
      // En el Mes 1 se suman las cuentas por cobrar pendientes reales
      const cobroCuentasPendientes = i === 1 ? cuentasPorCobrar : 0
      const totalIngresosMes = ventasEstimadasMes + cobroCuentasPendientes

      // Egresos del mes
      const costoMaterialesMes = pedidosMes * costoMaterialPorPedido
      const cuotaBancoMes = cuotaPrestamo
      const gastosOperativosMes = gastosFijos
      const gastoExtraordinarioMes = (inversionExtraMonto > 0 && inversionExtraMes === i) ? inversionExtraMonto : 0

      const totalEgresosMes = costoMaterialesMes + cuotaBancoMes + gastosOperativosMes + gastoExtraordinarioMes
      const flujoNetoMes = totalIngresosMes - totalEgresosMes

      const saldoInicialMes = saldoAcumulado
      saldoAcumulado += flujoNetoMes

      mesesData.push({
        mesNumero: i,
        nombreMes: `Mes ${i}`,
        saldoInicial: Number(saldoInicialMes.toFixed(2)),
        pedidosEstimados: pedidosMes,
        ingresosVentas: Number(ventasEstimadasMes.toFixed(2)),
        ingresosExtras: Number(cobroCuentasPendientes.toFixed(2)),
        totalIngresos: Number(totalIngresosMes.toFixed(2)),
        costoMateriales: Number(costoMaterialesMes.toFixed(2)),
        cuotaBanco: Number(cuotaBancoMes.toFixed(2)),
        gastosOperativos: Number(gastosOperativosMes.toFixed(2)),
        gastoExtraordinario: Number(gastoExtraordinarioMes.toFixed(2)),
        totalEgresos: Number(totalEgresosMes.toFixed(2)),
        flujoNeto: Number(flujoNetoMes.toFixed(2)),
        saldoFinalCaja: Number(saldoAcumulado.toFixed(2)),
        fondoReserva: fondoReserva,
        alertaReserva: saldoAcumulado < fondoReserva,
      })
    }

    return mesesData
  }, [
    horizonte,
    saldoActual,
    cuentasPorCobrar,
    pedidosMensuales,
    ticketPromedio,
    costoMaterialPorPedido,
    cuotaPrestamo,
    gastosFijos,
    crecimientoMensualPct,
    inversionExtraMonto,
    inversionExtraMes,
    fondoReserva
  ])

  const saldoFinalProyectado = proyeccionMeses[proyeccionMeses.length - 1]?.saldoFinalCaja || 0
  const crecimientoCajaTotal = saldoFinalProyectado - saldoActual
  const saldoMinimoEnPeriodo = Math.min(...proyeccionMeses.map(m => m.saldoFinalCaja))
  const mesesBajoReserva = proyeccionMeses.filter(m => m.alertaReserva).length

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <PiggyBank className="h-8 w-8 text-emerald-500" />
            Caja Chica & Proyecciones Financieras
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Simulador interactivo de liquidez, fondo de reserva, punto de equilibrio y proyección de caja a futuro.
          </p>
        </div>

        {/* Horizonte Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl">
          {([3, 6, 12] as HorizonteTiempo[]).map(h => (
            <button
              key={h}
              onClick={() => setHorizonte(h)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                horizonte === h
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {h} Meses
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards (Real-Time Base vs Projections) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Real en Caja Chica */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              Saldo Real en Caja
            </span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px]">
              Actual
            </Badge>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1.5">
            {formatCurrency(saldoActual)}
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">
            {saldoActual >= fondoReserva ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Fondo de reserva cubierto
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Por debajo de reserva deseada
              </span>
            )}
          </span>
        </div>

        {/* Saldo Final Proyectado */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Saldo a {horizonte} Meses
            </span>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/20 text-[10px]">
              Proyectado
            </Badge>
          </div>
          <div className="text-2xl font-extrabold text-blue-400 font-mono mt-1.5">
            {formatCurrency(saldoFinalProyectado)}
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">
            {crecimientoCajaTotal >= 0 ? (
              <span className="text-emerald-400 font-semibold">
                +{formatCurrency(crecimientoCajaTotal)} de incremento
              </span>
            ) : (
              <span className="text-red-400 font-semibold">
                {formatCurrency(crecimientoCajaTotal)} de déficit neto
              </span>
            )}
          </span>
        </div>

        {/* Runway de Caja Chica */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Runway (Cero Ventas)
            </span>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[10px]">
              Seguridad
            </Badge>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1.5">
            {runwayMeses} <span className="text-sm font-normal text-zinc-400">meses</span>
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">
            Cubre gastos fijos ({formatCurrency(gastosFijosTotalesMensuales)}/mes)
          </span>
        </div>

        {/* Punto de Equilibrio */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Scale className="h-4 w-4" />
              Punto de Equilibrio
            </span>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-[10px]">
              Mensual
            </Badge>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1.5">
            {pedidosPuntoEquilibrio} <span className="text-sm font-normal text-zinc-400">pedidos/mes</span>
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">
            Mínimo {formatCurrency(montoVentasPuntoEquilibrio)}/mes para no quemar caja
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SIMULADOR INTERACTIVO Y CONTROLES DE ESCENARIOS                           */}
      {/* ========================================================================= */}
      <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl">
        <CardHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-400" />
                Variables del Simulador de Caja Chica
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Modifica los parámetros para proyectar diferentes escenarios de ventas, compras y gastos.
              </CardDescription>
            </div>

            {/* Escenarios Preset */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-zinc-500 mr-1">Escenario:</span>
              <button
                type="button"
                onClick={() => handleSelectEscenario('CONSERVADOR')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  escenario === 'CONSERVADOR'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                🐢 Conservador
              </button>
              <button
                type="button"
                onClick={() => handleSelectEscenario('BASE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  escenario === 'BASE'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ⚖️ Base
              </button>
              <button
                type="button"
                onClick={() => handleSelectEscenario('OPTIMISTA')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  escenario === 'OPTIMISTA'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                🚀 Escala
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="Restablecer valores"
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pedidos Estimados / Mes */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-zinc-300 font-semibold">Pedidos por Mes</Label>
                <span className="font-mono text-emerald-400 font-bold">{pedidosMensuales} uds</span>
              </div>
              <Input
                type="number"
                min="1"
                max="300"
                value={pedidosMensuales}
                onChange={(e) => {
                  setPedidosMensuales(Math.max(1, parseInt(e.target.value) || 0))
                  setEscenario('PERSONALIZADO')
                }}
                className="bg-zinc-950 border-zinc-700 text-white font-mono text-sm h-8"
              />
              <span className="text-[11px] text-zinc-500 block">Volumen de ventas mensuales</span>
            </div>

            {/* Ticket Promedio */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-zinc-300 font-semibold">Ticket Promedio (S/)</Label>
                <span className="font-mono text-blue-400 font-bold">{formatCurrency(ticketPromedio)}</span>
              </div>
              <Input
                type="number"
                step="1"
                min="10"
                value={ticketPromedio}
                onChange={(e) => {
                  setTicketPromedio(parseFloat(e.target.value) || 0)
                  setEscenario('PERSONALIZADO')
                }}
                className="bg-zinc-950 border-zinc-700 text-white font-mono text-sm h-8"
              />
              <span className="text-[11px] text-zinc-500 block">Precio promedio por modelo</span>
            </div>

            {/* Costo Material por Pedido */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-zinc-300 font-semibold">Costo Material (S/)</Label>
                <span className="font-mono text-amber-400 font-bold">{formatCurrency(costoMaterialPorPedido)}</span>
              </div>
              <Input
                type="number"
                step="1"
                min="1"
                value={costoMaterialPorPedido}
                onChange={(e) => {
                  setCostoMaterialPorPedido(parseFloat(e.target.value) || 0)
                  setEscenario('PERSONALIZADO')
                }}
                className="bg-zinc-950 border-zinc-700 text-white font-mono text-sm h-8"
              />
              <span className="text-[11px] text-zinc-500 block">Filamento + Packaging</span>
            </div>

            {/* Crecimiento Mensual */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-zinc-300 font-semibold">Crecimiento Mensual (%)</Label>
                <span className="font-mono text-purple-400 font-bold">+{crecimientoMensualPct}%</span>
              </div>
              <Input
                type="number"
                step="1"
                min="0"
                max="50"
                value={crecimientoMensualPct}
                onChange={(e) => {
                  setCrecimientoMensualPct(parseFloat(e.target.value) || 0)
                  setEscenario('PERSONALIZADO')
                }}
                className="bg-zinc-950 border-zinc-700 text-white font-mono text-sm h-8"
              />
              <span className="text-[11px] text-zinc-500 block">Tasa de aumento mensual</span>
            </div>
          </div>

          {/* Segunda fila: Gastos Fijos & Inversiones Extraordinarias */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Cuota Banco + Luz/Servicios */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-zinc-300 font-semibold">Cuota Préstamo Bancario (S/)</Label>
                <span className="text-zinc-400 font-mono">{formatCurrency(cuotaPrestamo)}/mes</span>
              </div>
              <Input
                type="number"
                step="1"
                value={cuotaPrestamo}
                onChange={(e) => setCuotaPrestamo(parseFloat(e.target.value) || 0)}
                className="bg-zinc-950 border-zinc-700 text-white font-mono text-sm h-8"
              />
              <span className="text-[11px] text-zinc-500 block">Préstamo de 24 cuotas (TEA 8.7%)</span>
            </div>

            {/* Gastos Fijos Operativos */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-zinc-300 font-semibold">Gastos Fijos Taller (S/)</Label>
                <span className="text-zinc-400 font-mono">{formatCurrency(gastosFijos)}/mes</span>
              </div>
              <Input
                type="number"
                step="10"
                value={gastosFijos}
                onChange={(e) => setGastosFijos(parseFloat(e.target.value) || 0)}
                className="bg-zinc-950 border-zinc-700 text-white font-mono text-sm h-8"
              />
              <span className="text-[11px] text-zinc-500 block">Luz, internet y servicios</span>
            </div>

            {/* Fondo de Reserva de Seguridad */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-zinc-300 font-semibold">Fondo Mínimo de Seguridad (S/)</Label>
                <span className="text-emerald-400 font-mono font-bold">{formatCurrency(fondoReserva)}</span>
              </div>
              <Input
                type="number"
                step="100"
                value={fondoReserva}
                onChange={(e) => setFondoReserva(parseFloat(e.target.value) || 0)}
                className="bg-zinc-950 border-zinc-700 text-white font-mono text-sm h-8"
              />
              <span className="text-[11px] text-zinc-500 block">Línea de contingencia para el taller</span>
            </div>
          </div>

          {/* Inversión Extraordinaria Planificada */}
          <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="font-semibold text-zinc-200">
                Simular Inversión Extraordinaria (Ej: Nueva Máquina / Stock Masivo):
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Concepto (ej. Bambu Lab P1S)"
                value={inversionExtraConcepto}
                onChange={(e) => setInversionExtraConcepto(e.target.value)}
                className="bg-zinc-950 border-zinc-700 text-white text-xs h-8 w-44"
              />
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">Monto S/:</span>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={inversionExtraMonto}
                  onChange={(e) => setInversionExtraMonto(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="bg-zinc-950 border-zinc-700 text-purple-400 font-mono text-xs font-bold h-8 w-24"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">En Mes:</span>
                <select
                  value={inversionExtraMes}
                  onChange={(e) => setInversionExtraMes(parseInt(e.target.value))}
                  className="bg-zinc-950 border border-zinc-700 text-zinc-200 rounded-lg px-2 py-1 text-xs h-8 focus:outline-none"
                >
                  {Array.from({ length: horizonte }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>Mes {m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* GRÁFICO INTERACTIVO: CURVA DE EVOLUCIÓN DE CAJA CHICA                     */}
      {/* ========================================================================= */}
      <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Curva de Evolución Proyectada de Caja Chica ({horizonte} Meses)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Proyección del saldo acumulado en caja considerando ingresos, egresos, cuota del préstamo y fondo de reserva.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                Saldo en Caja
              </span>
              <span className="flex items-center gap-1 text-red-400 font-semibold">
                <span className="w-2.5 h-0.5 bg-red-400 inline-block"></span>
                Fondo Reserva ({formatCurrency(fondoReserva)})
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={proyeccionMeses} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSaldoCaja" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="nombreMes" 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `S/ ${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
                          <div className="font-bold text-white border-b border-zinc-800 pb-1 flex justify-between">
                            <span>{data.nombreMes}</span>
                            <span className="text-zinc-400">{data.pedidosEstimados} pedidos</span>
                          </div>
                          <div className="space-y-1 text-zinc-300">
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Ingresos:</span>
                              <span className="font-mono text-emerald-400 font-bold">+{formatCurrency(data.totalIngresos)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Egresos:</span>
                              <span className="font-mono text-amber-400">-{formatCurrency(data.totalEgresos)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Flujo Neto:</span>
                              <span className={`font-mono font-bold ${data.flujoNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {data.flujoNeto >= 0 ? '+' : ''}{formatCurrency(data.flujoNeto)}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-zinc-800 font-bold">
                              <span className="text-white">Saldo en Caja:</span>
                              <span className="font-mono text-emerald-300">{formatCurrency(data.saldoFinalCaja)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <ReferenceLine 
                  y={fondoReserva} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  label={{ value: `Reserva: S/ ${fondoReserva}`, fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="saldoFinalCaja" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSaldoCaja)" 
                  name="Saldo en Caja"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* TABLA DETALLADA DE LA PROYECCIÓN MES A MES                                */}
      {/* ========================================================================= */}
      <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                Desglose Financiero Proyectado Mes a Mes
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Detalle mensual de entradas de ventas, costos de materiales, cuota del banco y saldo final de caja chica.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-300 text-xs">
              {horizonte} Períodos
            </Badge>
          </div>
        </CardHeader>

        <Table className="w-full">
          <TableHeader className="bg-zinc-900/70 border-b border-zinc-800">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-left">Período</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center">Pedidos</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right">Saldo Inicial</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right text-emerald-400">(+) Ingresos</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right text-amber-400">(-) Materiales</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right">(-) Cuota Banco</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right">Flujo Neto</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-right font-bold text-white">Saldo Caja Chica</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center">Salud</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proyeccionMeses.map((m) => {
              const isHealthy = m.saldoFinalCaja >= fondoReserva
              const isWarning = m.saldoFinalCaja > 0 && m.saldoFinalCaja < fondoReserva
              const isDanger = m.saldoFinalCaja <= 0

              return (
                <TableRow 
                  key={m.mesNumero}
                  className="border-zinc-800/60 hover:bg-zinc-900/40 transition-colors text-xs"
                >
                  <TableCell className="px-4 py-3 font-semibold text-white">
                    {m.nombreMes}
                    {m.gastoExtraordinario > 0 && (
                      <span className="block text-[10px] text-purple-400">
                        ⭐ {inversionExtraConcepto} (-{formatCurrency(m.gastoExtraordinario)})
                      </span>
                    )}
                    {m.ingresosExtras > 0 && (
                      <span className="block text-[10px] text-emerald-400">
                        📥 Cobro Saldos Pendientes (+{formatCurrency(m.ingresosExtras)})
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-center font-mono font-medium text-zinc-300">
                    {m.pedidosEstimados}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono text-zinc-400">
                    {formatCurrency(m.saldoInicial)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono text-emerald-400 font-semibold">
                    +{formatCurrency(m.totalIngresos)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono text-amber-400">
                    -{formatCurrency(m.costoMateriales)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono text-zinc-400">
                    -{formatCurrency(m.cuotaBanco)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono font-semibold">
                    <span className={m.flujoNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {m.flujoNeto >= 0 ? '+' : ''}{formatCurrency(m.flujoNeto)}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right font-mono font-bold text-white text-sm">
                    {formatCurrency(m.saldoFinalCaja)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-center">
                    {isHealthy ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                        Óptimo
                      </Badge>
                    ) : isWarning ? (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
                        Alerta
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">
                        Déficit
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
