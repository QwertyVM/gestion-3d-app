'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, 
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
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

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
  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-emerald-500" />
            Dashboard General
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Métricas de rendimiento, rentabilidad sobre costos de fabricación y flujo comercial.
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. GANANCIA NETA EN VENTAS (Ingresos - Costo Fabricación) */}
        <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl hover:border-emerald-500/50 transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Ganancia Neta (Ventas)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              +{formatCurrency(kpis.gananciaNeta)}
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span>Margen sobre costo:</span>
              <span className="font-bold text-emerald-400 font-mono">
                +{kpis.margenPorcentaje.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Ventas ({formatCurrency(kpis.ingresosVentas)}) - Costo Fab. ({formatCurrency(kpis.costoFabricacionTotal)})
            </p>
          </CardContent>
        </Card>
        
        {/* 2. INGRESOS TOTALES EN VENTAS */}
        <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl hover:border-blue-500/50 transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Ingresos por Ventas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-white font-mono">
              {formatCurrency(kpis.ingresosVentas)}
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span>Ticket Promedio:</span>
              <span className="font-mono text-zinc-300 font-medium">
                {formatCurrency(kpis.ticketPromedio)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Total facturado en modelos 3D</p>
          </CardContent>
        </Card>

        {/* 3. COSTO TOTAL DE FABRICACIÓN */}
        <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl hover:border-purple-500/50 transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Costo de Fabricación
            </CardTitle>
            <Layers className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-purple-300 font-mono">
              {formatCurrency(kpis.costoFabricacionTotal)}
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span>Costo por modelo vendido:</span>
              <span className="font-mono text-zinc-300 font-medium">
                {kpis.ingresosVentas > 0 
                  ? `${((kpis.costoFabricacionTotal / kpis.ingresosVentas) * 100).toFixed(0)}% del precio`
                  : '0%'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Filamento, energía y depreciación base</p>
          </CardContent>
        </Card>

        {/* 4. SALDO POR COBRAR / COBRADO */}
        <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl hover:border-amber-500/50 transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Cobranzas & Saldos
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-amber-400 font-mono">
              {formatCurrency(kpis.saldoPorCobrar)}
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span>Cobrado en Caja:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {formatCurrency(kpis.totalCobradoVentas)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Saldos pendientes de entrega</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Gráfico de Evolución: Ingresos vs Costo de Fabricación vs Ganancia Neta */}
        <Card className="lg:col-span-4 bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base flex items-center justify-between">
              <span>Evolución: Ventas, Costo y Ganancia Neta</span>
              <span className="text-xs text-zinc-500 font-normal font-mono">Por fecha</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Comparativa histórica entre el precio cobrado y el costo base de fabricación.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graficoEvolucion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="fecha" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `S/${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                    formatter={(value: any, name: any) => [
                      `S/ ${Number(value).toFixed(2)}`,
                      name === 'ingresos' ? 'Venta Total' : name === 'costo' ? 'Costo Fabricación' : 'Ganancia Neta'
                    ]}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    formatter={(val) => (
                      <span className="text-xs text-zinc-300">
                        {val === 'ingresos' ? 'Ventas' : val === 'costo' ? 'Costo Fabricación' : 'Ganancia Neta'}
                      </span>
                    )}
                  />
                  <Line type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="ingresos" />
                  <Line type="monotone" dataKey="costo" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="costo" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="ganancia" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} name="ganancia" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Distribución de Egresos */}
        <Card className="lg:col-span-3 bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Distribución de Gastos del Taller</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Maquinaria (impresoras/secador), insumos y servicios.
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                    formatter={(val: any) => [`S/ ${Number(val).toFixed(2)}`, 'Gasto']}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    formatter={(val) => <span className="text-xs text-zinc-400">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none pb-8">
                <span className="text-[11px] text-zinc-500 uppercase font-semibold">Total Gastos</span>
                <span className="text-lg font-bold text-white font-mono">{formatCurrency(kpis.egresosTotales)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cuentas por Cobrar */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-500" />
            Cuentas Pendientes por Cobrar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cuentasPorCobrar.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-sm">
                No hay cuentas pendientes por cobrar 🎉
              </div>
            ) : (
              cuentasPorCobrar.map((cuenta) => (
                <div key={cuenta.id} className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 hover:bg-zinc-900/80 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-white">{cuenta.cliente}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {cuenta.producto?.nombreModelo ? `${cuenta.producto.nombreModelo} • ` : ''}{formatDate(cuenta.fecha)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/10 font-mono text-xs">
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
