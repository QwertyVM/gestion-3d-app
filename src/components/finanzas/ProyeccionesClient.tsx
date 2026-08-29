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
  DollarSign, 
  Calendar, 
  RotateCcw, 
  Sliders, 
  Sparkles,
  ShieldCheck,
  Clock,
  Layers,
  Scale
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine
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

  // Punto de equilibrio mensual
  const pedidosPuntoEquilibrio = margenUnitarioPorPedido > 0 
    ? Math.ceil(gastosFijosTotalesMensuales / margenUnitarioPorPedido) 
    : 0

  const montoVentasPuntoEquilibrio = pedidosPuntoEquilibrio * ticketPromedio

  // Runway de caja chica
  const runwayMeses = gastosFijosTotalesMensuales > 0 
    ? Math.max(0, Number((saldoActual / gastosFijosTotalesMensuales).toFixed(1))) 
    : 99

  // GENERACIÓN DE LA PROYECCIÓN MES A MES
  const proyeccionMeses = useMemo(() => {
    const mesesData = []
    let saldoAcumulado = saldoActual

    for (let i = 1; i <= horizonte; i++) {
      const factorCrecimiento = Math.pow(1 + crecimientoMensualPct / 100, i - 1)
      const pedidosMes = Math.round(pedidosMensuales * factorCrecimiento)

      const ventasEstimadasMes = pedidosMes * ticketPromedio
      const cobroCuentasPendientes = i === 1 ? cuentasPorCobrar : 0
      const totalIngresosMes = ventasEstimadasMes + cobroCuentasPendientes

      const costoMaterialesMes = pedidosMes * costoMaterialPorPedido
      const cuotaBancoMes = cuotaPrestamo
      const gastosOperativosMes = gastosFijos
      const gastoExtraordinarioMes = (inversionExtraMonto > 0 && inversionExtraMes === i) ? inversionExtraMonto : 0

      const totalEgresosMes = costoMaterialesMes + cuotaBancoMes + gastosOperativosMes + gastoExtraordinarioMes
      const flujoNetoMes = totalIngresosMes - totalEgresosMes

      const saldoInicial = saldoAcumulado
      saldoAcumulado = saldoAcumulado + flujoNetoMes

      mesesData.push({
        mesNumero: i,
        nombreMes: `Mes +${i}`,
        pedidosEstimados: pedidosMes,
        ventasEstimadas: ventasEstimadasMes,
        ingresosExtras: cobroCuentasPendientes,
        totalIngresos: totalIngresosMes,
        costoMateriales: costoMaterialesMes,
        cuotaBanco: cuotaBancoMes,
        gastosOperativos: gastosOperativosMes,
        gastoExtraordinario: gastoExtraordinarioMes,
        totalEgresos: totalEgresosMes,
        flujoNeto: flujoNetoMes,
        saldoInicial: saldoInicial,
        saldoFinalCaja: saldoAcumulado,
        fondoReserva: fondoReserva,
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
    fondoReserva, 
    inversionExtraMonto, 
    inversionExtraMes
  ])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm">
              <TrendingUp className="h-6 w-6 stroke-[2.5]" />
            </div>
            Caja Chica & Proyecciones Financieras
          </h1>
          <p className="text-sm text-[#75695D] mt-1">
            Simulador de supervivencia (runway), amortización de préstamo bancario y escenarios de crecimiento.
          </p>
        </div>

        {/* Horizonte Selector */}
        <div className="flex items-center gap-1.5 bg-[#FFFFFF] border border-[#E2D9CC] p-1 rounded-2xl shadow-sm">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setHorizonte(m as HorizonteTiempo)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                horizonte === m
                  ? 'bg-[#A36F4C] text-white shadow-sm'
                  : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA]'
              }`}
            >
              {m} Meses
            </button>
          ))}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Actual Caja Chica */}
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E5E3A]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A] flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 stroke-[2.5]" />
            Saldo Real en Caja
          </span>
          <div className="text-2xl font-extrabold text-[#1E5E3A] font-mono mt-1">
            {formatCurrency(saldoActual)}
          </div>
          <span className="text-xs text-[#75695D] mt-1 block">
            {saldoActual >= fondoReserva 
              ? '✅ Por encima del fondo de reserva' 
              : '⚠️ Bajo nivel mínimo de seguridad'}
          </span>
        </div>

        {/* Compromisos Fijos Mensuales */}
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#944917] flex items-center gap-1.5">
            <Layers className="h-4 w-4 stroke-[2.5]" />
            Compromisos Mensuales
          </span>
          <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
            {formatCurrency(gastosFijosTotalesMensuales)}
          </div>
          <span className="text-xs text-[#75695D] mt-1 block">
            Cuota Banco ({formatCurrency(cuotaPrestamo)}) + Fijos ({formatCurrency(gastosFijos)})
          </span>
        </div>

        {/* Runway de Supervivencia */}
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A36F4C] flex items-center gap-1.5">
            <Clock className="h-4 w-4 stroke-[2.5]" />
            Runway (Supervivencia)
          </span>
          <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
            {runwayMeses} <span className="text-sm font-normal text-[#75695D]">meses</span>
          </div>
          <span className="text-xs text-[#75695D] mt-1 block">
            Capacidad de cubrir fijos sin ventas
          </span>
        </div>

        {/* Punto de Equilibrio */}
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D1F] flex items-center gap-1.5">
            <Scale className="h-4 w-4 stroke-[2.5]" />
            Punto de Equilibrio
          </span>
          <div className="text-2xl font-extrabold text-[#8C6D1F] font-mono mt-1">
            {pedidosPuntoEquilibrio} <span className="text-sm font-normal text-[#75695D]">pedidos/mes</span>
          </div>
          <span className="text-xs text-[#75695D] mt-1 block">
            {formatCurrency(montoVentasPuntoEquilibrio)} de facturación mínima
          </span>
        </div>
      </div>

      {/* Simulador Interactivo de Parámetros */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl">
        <CardHeader className="pb-3 border-b border-[#E2D9CC]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-[#241C15] flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#A36F4C]" />
                Simulador de Parámetros & Escenarios del Taller
              </CardTitle>
              <CardDescription className="text-xs text-[#75695D] mt-0.5">
                Ajusta las variables de producción y ventas para proyectar el flujo de caja en tiempo real.
              </CardDescription>
            </div>

            {/* Escenarios Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#75695D] mr-1 font-bold">Escenario:</span>
              <button
                onClick={() => handleSelectEscenario('CONSERVADOR')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  escenario === 'CONSERVADOR'
                    ? 'bg-[#8C6D1F] text-white shadow-sm'
                    : 'bg-[#F4EFEA] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15]'
                }`}
              >
                Conservador
              </button>
              <button
                onClick={() => handleSelectEscenario('BASE')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  escenario === 'BASE'
                    ? 'bg-[#A36F4C] text-white shadow-sm'
                    : 'bg-[#F4EFEA] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15]'
                }`}
              >
                Base (Real)
              </button>
              <button
                onClick={() => handleSelectEscenario('OPTIMISTA')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  escenario === 'OPTIMISTA'
                    ? 'bg-[#1E5E3A] text-white shadow-sm'
                    : 'bg-[#F4EFEA] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15]'
                }`}
              >
                Optimista
              </button>
              <button
                onClick={handleReset}
                title="Restablecer valores originales"
                className="p-1.5 rounded-xl bg-[#F4EFEA] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Controles de Simulación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <div className="flex justify-between items-center">
                <Label className="text-[#241C15] font-bold">Pedidos por Mes</Label>
                <span className="text-[#A36F4C] font-mono font-bold">{pedidosMensuales}</span>
              </div>
              <Input
                type="number"
                min="0"
                max="200"
                value={pedidosMensuales}
                onChange={(e) => {
                  setPedidosMensuales(parseInt(e.target.value) || 0)
                  setEscenario('PERSONALIZADO')
                }}
                className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] font-mono text-sm h-8 rounded-xl"
              />
              <span className="text-[11px] text-[#75695D] block">Volumen de ventas mensuales</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <div className="flex justify-between items-center">
                <Label className="text-[#241C15] font-bold">Ticket Promedio (S/)</Label>
                <span className="text-[#1E5E3A] font-mono font-bold">{formatCurrency(ticketPromedio)}</span>
              </div>
              <Input
                type="number"
                step="5"
                min="10"
                value={ticketPromedio}
                onChange={(e) => {
                  setTicketPromedio(parseFloat(e.target.value) || 0)
                  setEscenario('PERSONALIZADO')
                }}
                className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] font-mono text-sm h-8 rounded-xl"
              />
              <span className="text-[11px] text-[#75695D] block">Precio promedio por modelo</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <div className="flex justify-between items-center">
                <Label className="text-[#241C15] font-bold">Costo Material (S/)</Label>
                <span className="text-[#944917] font-mono font-bold">{formatCurrency(costoMaterialPorPedido)}</span>
              </div>
              <Input
                type="number"
                step="1"
                min="0"
                value={costoMaterialPorPedido}
                onChange={(e) => {
                  setCostoMaterialPorPedido(parseFloat(e.target.value) || 0)
                  setEscenario('PERSONALIZADO')
                }}
                className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] font-mono text-sm h-8 rounded-xl"
              />
              <span className="text-[11px] text-[#75695D] block">Filamento + Packaging</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <div className="flex justify-between items-center">
                <Label className="text-[#241C15] font-bold">Crecimiento Mensual (%)</Label>
                <span className="text-[#A36F4C] font-mono font-bold">+{crecimientoMensualPct}%</span>
              </div>
              <Input
                type="number"
                step="1"
                min="-20"
                max="50"
                value={crecimientoMensualPct}
                onChange={(e) => {
                  setCrecimientoMensualPct(parseFloat(e.target.value) || 0)
                  setEscenario('PERSONALIZADO')
                }}
                className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] font-mono text-sm h-8 rounded-xl"
              />
              <span className="text-[11px] text-[#75695D] block">Tasa de aumento mensual</span>
            </div>
          </div>

          {/* Gastos Fijos y Fondo de Reserva */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <div className="flex justify-between items-center">
                <Label className="text-[#241C15] font-bold">Cuota Préstamo Bancario (S/)</Label>
                <span className="text-[#75695D] font-mono">{formatCurrency(cuotaPrestamo)}/mes</span>
              </div>
              <Input
                type="number"
                step="10"
                value={cuotaPrestamo}
                onChange={(e) => setCuotaPrestamo(parseFloat(e.target.value) || 0)}
                className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] font-mono text-sm h-8 rounded-xl"
              />
              <span className="text-[11px] text-[#75695D] block">Préstamo bancario (24 cuotas)</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <div className="flex justify-between items-center">
                <Label className="text-[#241C15] font-bold">Gastos Fijos Taller (S/)</Label>
                <span className="text-[#75695D] font-mono">{formatCurrency(gastosFijos)}/mes</span>
              </div>
              <Input
                type="number"
                step="10"
                value={gastosFijos}
                onChange={(e) => setGastosFijos(parseFloat(e.target.value) || 0)}
                className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] font-mono text-sm h-8 rounded-xl"
              />
              <span className="text-[11px] text-[#75695D] block">Luz, internet y servicios</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <div className="flex justify-between items-center">
                <Label className="text-[#241C15] font-bold">Fondo Mínimo de Seguridad (S/)</Label>
                <span className="text-[#8C6D1F] font-mono font-bold">{formatCurrency(fondoReserva)}</span>
              </div>
              <Input
                type="number"
                step="100"
                value={fondoReserva}
                onChange={(e) => setFondoReserva(parseFloat(e.target.value) || 0)}
                className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] font-mono text-sm h-8 rounded-xl"
              />
              <span className="text-[11px] text-[#75695D] block">Colchón de reserva bancario</span>
            </div>
          </div>

          {/* Inversión Extraordinaria Planificada */}
          <div className="p-3.5 rounded-xl bg-[#FDFBF7] border border-[#D4BEA7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#A36F4C]" />
              <span className="font-bold text-[#241C15]">
                Simular Inversión Extraordinaria (Ej: Nueva Máquina / Stock Masivo):
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Concepto (ej. Bambu Lab P1S)"
                value={inversionExtraConcepto}
                onChange={(e) => setInversionExtraConcepto(e.target.value)}
                className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] text-xs h-8 w-44 rounded-xl"
              />
              <div className="flex items-center gap-1">
                <span className="text-[#75695D] font-medium">Monto S/:</span>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={inversionExtraMonto}
                  onChange={(e) => setInversionExtraMonto(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="bg-[#FFFFFF] border-[#DCD3C6] text-[#A36F4C] font-mono text-xs font-bold h-8 w-24 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#75695D] font-medium">En Mes:</span>
                <select
                  value={inversionExtraMes}
                  onChange={(e) => setInversionExtraMes(parseInt(e.target.value))}
                  className="bg-[#FFFFFF] border border-[#DCD3C6] text-[#241C15] rounded-xl px-2 py-1 text-xs h-8 focus:outline-none"
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

      {/* GRÁFICO INTERACTIVO: CURVA DE EVOLUCIÓN DE CAJA CHICA */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#241C15] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#1E5E3A]" />
                Curva de Evolución Proyectada de Caja Chica ({horizonte} Meses)
              </CardTitle>
              <CardDescription className="text-xs text-[#75695D] mt-0.5">
                Proyección del saldo acumulado en caja considerando ingresos, egresos, cuota del préstamo y fondo de reserva.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[#1E5E3A] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E5E3A] inline-block"></span>
                Saldo en Caja
              </span>
              <span className="flex items-center gap-1 text-[#A34335] font-bold">
                <span className="w-2.5 h-0.5 bg-[#A34335] inline-block"></span>
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
                    <stop offset="5%" stopColor="#1E5E3A" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#1E5E3A" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" vertical={false} />
                <XAxis 
                  dataKey="nombreMes" 
                  stroke="#75695D" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#75695D" 
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `S/ ${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-[#FFFFFF] border border-[#E2D9CC] p-3 rounded-2xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
                          <div className="font-bold text-[#241C15] border-b border-[#E2D9CC] pb-1 flex justify-between">
                            <span>{data.nombreMes}</span>
                            <span className="text-[#75695D]">{data.pedidosEstimados} pedidos</span>
                          </div>
                          <div className="space-y-1 text-[#241C15]">
                            <div className="flex justify-between">
                              <span className="text-[#75695D]">Ingresos:</span>
                              <span className="font-mono text-[#1E5E3A] font-bold">+{formatCurrency(data.totalIngresos)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#75695D]">Egresos:</span>
                              <span className="font-mono text-[#944917]">-{formatCurrency(data.totalEgresos)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#75695D]">Flujo Neto:</span>
                              <span className={`font-mono font-bold ${data.flujoNeto >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
                                {data.flujoNeto >= 0 ? '+' : ''}{formatCurrency(data.flujoNeto)}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-[#E2D9CC] font-bold">
                              <span className="text-[#241C15]">Saldo en Caja:</span>
                              <span className="font-mono text-[#1E5E3A]">{formatCurrency(data.saldoFinalCaja)}</span>
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
                  stroke="#A34335" 
                  strokeDasharray="4 4" 
                  label={{ value: `Reserva: S/ ${fondoReserva}`, fill: '#A34335', fontSize: 10, position: 'insideTopLeft' }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="saldoFinalCaja" 
                  stroke="#1E5E3A" 
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

      {/* TABLA DETALLADA DE LA PROYECCIÓN MES A MES */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-[#E2D9CC] bg-[#FDFBF7]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#241C15] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#A36F4C]" />
                Desglose Financiero Proyectado Mes a Mes
              </CardTitle>
              <CardDescription className="text-xs text-[#75695D] mt-0.5">
                Detalle mensual de entradas de ventas, costos de materiales, cuota del banco y saldo final de caja chica.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-[#EFE5D8] border-[#D4BEA7] text-[#633E20] font-bold text-xs">
              {horizonte} Períodos
            </Badge>
          </div>
        </CardHeader>

        <Table className="w-full">
          <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
            <TableRow className="border-[#E2D9CC] hover:bg-transparent">
              <TableHead className="text-[#241C15] font-bold px-4 py-3 text-left">Período</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-center">Pedidos</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">Saldo Inicial</TableHead>
              <TableHead className="text-[#1E5E3A] font-bold px-3 py-3 text-right">(+) Ingresos</TableHead>
              <TableHead className="text-[#944917] font-bold px-3 py-3 text-right">(-) Materiales</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">(-) Cuota Banco</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">Flujo Neto</TableHead>
              <TableHead className="text-[#241C15] font-bold px-4 py-3 text-right">Saldo Caja Chica</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-center">Salud</TableHead>
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
                  className="border-[#E2D9CC]/70 hover:bg-[#FDFBF7] transition-colors text-xs"
                >
                  <TableCell className="px-4 py-3 font-bold text-[#241C15]">
                    {m.nombreMes}
                    {m.gastoExtraordinario > 0 && (
                      <span className="block text-[10px] text-[#A36F4C]">
                        ⭐ {inversionExtraConcepto} (-{formatCurrency(m.gastoExtraordinario)})
                      </span>
                    )}
                    {m.ingresosExtras > 0 && (
                      <span className="block text-[10px] text-[#1E5E3A]">
                        📥 Cobro Saldos Pendientes (+{formatCurrency(m.ingresosExtras)})
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-center font-mono font-bold text-[#241C15]">
                    {m.pedidosEstimados}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono text-[#75695D]">
                    {formatCurrency(m.saldoInicial)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono text-[#1E5E3A] font-bold">
                    +{formatCurrency(m.totalIngresos)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono text-[#944917]">
                    -{formatCurrency(m.costoMateriales)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono text-[#75695D]">
                    -{formatCurrency(m.cuotaBanco)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono font-bold">
                    <span className={m.flujoNeto >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}>
                      {m.flujoNeto >= 0 ? '+' : ''}{formatCurrency(m.flujoNeto)}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right font-mono font-extrabold text-[#241C15] text-sm">
                    {formatCurrency(m.saldoFinalCaja)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-center">
                    {isHealthy ? (
                      <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold">
                        Óptimo
                      </Badge>
                    ) : isWarning ? (
                      <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-bold">
                        Alerta
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-[#FDF2F0] text-[#A34335] border-[#F0BCB4] text-[10px] font-bold">
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
