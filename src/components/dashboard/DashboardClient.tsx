'use client'

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
  Receipt
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
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl shadow-xl overflow-hidden min-w-[220px] text-xs font-sans">
        {/* Cabecera: Fecha destacada con fondo NOVA */}
        <div className="bg-[#F8F6F2] border-b border-[#E2D9CC] px-3.5 py-2 flex items-center justify-between">
          <span className="font-bold text-[#241C15]">{formatFechaEvolucion(label, true)}</span>
          <span className="text-[10px] text-[#75695D] font-mono uppercase font-semibold">Resumen</span>
        </div>

        {/* Cuerpo del Tooltip: Flujo Contable */}
        <div className="p-3.5 space-y-2">
          {/* Fila 1: Venta Total */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#A36F4C] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A36F4C]" />
              Venta Total:
            </span>
            <span className="font-mono font-bold text-[#A36F4C]">
              S/ {ingresos.toFixed(2)}
            </span>
          </div>

          {/* Fila 2: Costo de Fabricación */}
          <div className="flex items-center justify-between gap-3 text-[#75695D]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#75695D]" />
              (-) Costo Fabricación:
            </span>
            <span className="font-mono font-semibold">
              S/ {costo.toFixed(2)}
            </span>
          </div>

          {/* Divisor horizontal sutil */}
          <div className="border-t border-[#E2D9CC] my-1" />

          {/* Fila 3: Ganancia Neta */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <span className="text-[#1E5E3A] font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1E5E3A]" />
              (=) Ganancia Neta:
            </span>
            <span className="font-mono font-extrabold text-[#1E5E3A]">
              S/ {ganancia.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Leyenda personalizada con jerarquía vertical
function CustomLegend() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-5 text-xs pb-3 pt-1">
      <div className="flex items-center gap-1.5 font-bold text-[#A36F4C]">
        <span className="w-3.5 h-0.5 bg-[#A36F4C] rounded-full inline-block" />
        <span>Ventas</span>
      </div>
      <div className="flex items-center gap-1.5 font-medium text-[#75695D]">
        <span className="w-3.5 h-0 border-t-2 border-dashed border-[#75695D] inline-block" />
        <span>Costo Fabricación</span>
      </div>
      <div className="flex items-center gap-1.5 font-bold text-[#1E5E3A]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#1E5E3A] border-2 border-white shadow-xs inline-block" />
        <span>Ganancia Neta</span>
      </div>
    </div>
  )
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
  graficoEvolucion: { fecha: string; ingresos: number; costo: number; ganancia: number }[]
  graficoInversion: { name: string; value: number }[]
  cuentasPorCobrar: any[]
}

export function DashboardClient({ 
  kpis, 
  graficoEvolucion, 
  graficoInversion, 
  cuentasPorCobrar 
}: DashboardClientProps) {
  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm">
              <Sparkles className="h-6 w-6 stroke-[2.5]" />
            </div>
            Dashboard General
          </h1>
          <p className="text-sm text-[#75695D] mt-1">
            Métricas clave de rendimiento, rentabilidad sobre costos de fabricación y flujo comercial.
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. GANANCIA NETA EN VENTAS */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm hover:border-[#1E5E3A] transition-all relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E5E3A]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A]">
              Ganancia Neta (Ventas)
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-[#EBF7EE] text-[#1E5E3A]">
              <DollarSign className="h-4 w-4 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1E5E3A] font-mono">
              +{formatCurrency(kpis.gananciaNeta)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#75695D] pt-1">
              <span>Margen sobre costo:</span>
              <span className="font-bold text-[#1E5E3A] font-mono">
                +{kpis.margenPorcentaje.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-[#75695D]">
              Ventas ({formatCurrency(kpis.ingresosVentas)}) - Costo Fab. ({formatCurrency(kpis.costoFabricacionTotal)})
            </p>
          </CardContent>
        </Card>
        
        {/* 2. INGRESOS TOTALES EN VENTAS */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm hover:border-[#A36F4C] transition-all relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#A36F4C]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#A36F4C]">
              Ingresos por Ventas
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-[#EFE5D8] text-[#A36F4C]">
              <TrendingUp className="h-4 w-4 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-[#241C15] font-mono">
              {formatCurrency(kpis.ingresosVentas)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#75695D] pt-1">
              <span>Ticket Promedio:</span>
              <span className="font-mono text-[#241C15] font-bold">
                {formatCurrency(kpis.ticketPromedio)}
              </span>
            </div>
            <p className="text-[11px] text-[#75695D]">Total facturado en modelos 3D</p>
          </CardContent>
        </Card>

        {/* 3. COSTO TOTAL DE FABRICACIÓN */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm hover:border-[#944917] transition-all relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#944917]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#944917]">
              Costo de Fabricación
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-[#F4EFEA] text-[#944917]">
              <Layers className="h-4 w-4 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-[#944917] font-mono">
              {formatCurrency(kpis.costoFabricacionTotal)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#75695D] pt-1">
              <span>Costo por modelo vendido:</span>
              <span className="font-mono text-[#241C15] font-bold">
                {kpis.ingresosVentas > 0 
                  ? `${((kpis.costoFabricacionTotal / kpis.ingresosVentas) * 100).toFixed(0)}% del precio`
                  : '0%'}
              </span>
            </div>
            <p className="text-[11px] text-[#75695D]">Filamento, energía y depreciación base</p>
          </CardContent>
        </Card>

        {/* 4. SALDO POR COBRAR / COBRADO */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm hover:border-[#8C6D1F] transition-all relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#8C6D1F]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#8C6D1F]">
              Cobranzas & Saldos
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-[#FDF6E2] text-[#8C6D1F]">
              <Clock className="h-4 w-4 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-[#8C6D1F] font-mono">
              {formatCurrency(kpis.saldoPorCobrar)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#75695D] pt-1">
              <span>Cobrado en Caja:</span>
              <span className="font-mono text-[#1E5E3A] font-bold">
                {formatCurrency(kpis.totalCobradoVentas)}
              </span>
            </div>
            <p className="text-[11px] text-[#75695D]">Saldos pendientes de entrega</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Gráfico de Evolución: Ingresos vs Costo vs Ganancia */}
        <Card className="lg:col-span-4 bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-[#241C15] text-base font-bold flex items-center justify-between">
              <span>Evolución: Ventas, Costo y Ganancia Neta</span>
              <span className="text-xs text-[#75695D] font-normal font-mono">Por fecha</span>
            </CardTitle>
            <CardDescription className="text-xs text-[#75695D]">
              Comparativa histórica entre el precio cobrado y el costo base de fabricación.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={graficoEvolucion} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                    tickFormatter={(val) => `S/ ${val}`}
                    domain={[0, 'auto']}
                  />
                  
                  <Tooltip content={<CustomEvolucionTooltip />} />
                  
                  <Legend content={<CustomLegend />} verticalAlign="top" />

                  {/* Área sombreada sutil debajo de la curva de Ganancia Neta */}
                  <Area 
                    type="monotone" 
                    dataKey="ganancia" 
                    stroke="none" 
                    fill="url(#gananciaGradient)" 
                    legendType="none" 
                    tooltipType="none" 
                  />

                  {/* Línea 1: Ventas Totales (Ingreso Bruto) - Cima, Continua Gruesa Terracota */}
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#A36F4C" 
                    strokeWidth={2.5} 
                    dot={{ r: 3.5, fill: '#A36F4C', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 5.5, fill: '#A36F4C', stroke: '#FFFFFF', strokeWidth: 2 }}
                    name="ingresos" 
                  />

                  {/* Línea 2: Costo de Fabricación - Intermedio, Punteada Gris/Marrón */}
                  <Line 
                    type="monotone" 
                    dataKey="costo" 
                    stroke="#75695D" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    dot={{ r: 3, fill: '#75695D', stroke: '#FFFFFF', strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: '#75695D', stroke: '#FFFFFF', strokeWidth: 2 }}
                    name="costo" 
                  />

                  {/* Línea 3: Ganancia Neta - Base Limpia, Continua Verde Esmeralda */}
                  <Line 
                    type="monotone" 
                    dataKey="ganancia" 
                    stroke="#1E5E3A" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: '#1E5E3A', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#1E5E3A', stroke: '#FFFFFF', strokeWidth: 2 }}
                    name="ganancia" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Distribución de Egresos */}
        <Card className="lg:col-span-3 bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-[#241C15] text-base font-bold">Distribución de Gastos del Taller</CardTitle>
            <CardDescription className="text-xs text-[#75695D]">
              Maquinaria (impresoras/secador), insumos y servicios operativos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex flex-col items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={graficoInversion}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {graficoInversion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={NOVA_CHART_COLORS[index % NOVA_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CC', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                    formatter={(val: any) => [`S/ ${Number(val).toFixed(2)}`, 'Gasto']}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    formatter={(val) => <span className="text-xs text-[#241C15] font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none pb-8">
                <span className="text-[11px] text-[#75695D] uppercase font-bold tracking-wider">Total Gastos</span>
                <span className="text-lg font-extrabold text-[#241C15] font-mono">{formatCurrency(kpis.egresosTotales)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cuentas por Cobrar */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-[#241C15] text-base font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#8C6D1F]" />
            Cuentas Pendientes por Cobrar
          </CardTitle>
          <CardDescription className="text-xs text-[#75695D]">
            Pedidos entregados o en producción con saldos pendientes de pago.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {cuentasPorCobrar.length === 0 ? (
              <div className="p-8 text-center text-[#75695D] text-sm bg-[#F8F6F2] rounded-xl border border-[#E2D9CC]">
                No hay cuentas pendientes por cobrar 🎉
              </div>
            ) : (
              cuentasPorCobrar.slice(0, 5).map((cuenta) => (
                <div key={cuenta.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] hover:bg-[#F4EFEA] transition-colors">
                  <div>
                    <p className="text-sm font-bold text-[#241C15]">{cuenta.cliente}</p>
                    <p className="text-xs text-[#75695D] mt-0.5">
                      {cuenta.producto?.nombreModelo ? `${cuenta.producto.nombreModelo} • ` : ''}{formatDate(cuenta.fecha)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[#8C6D1F] border-[#E8D49B] bg-[#FDF6E2] font-mono text-xs font-bold px-3 py-1">
                      Debe: {formatCurrency(Number(cuenta.saldoPendiente))}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
