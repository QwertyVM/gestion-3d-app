'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Wallet, TrendingUp, DollarSign, Activity, ShoppingBag } from 'lucide-react'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

interface DashboardClientProps {
  kpis: {
    inversionTotal: number
    ingresosTotales: number
    totalCobrado: number
    saldoPorCobrar: number
    gananciaNeta: number
    roi: number
    ticketPromedio: number
  }
  graficoEvolucion: { fecha: string; ingresos: number }[]
  graficoInversion: { name: string; value: number }[]
  cuentasPorCobrar: any[]
}

export function DashboardClient({ kpis, graficoEvolucion, graficoInversion, cuentasPorCobrar }: DashboardClientProps) {
  
  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard General</h1>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl hover:border-emerald-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(kpis.ingresosTotales)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl hover:border-blue-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Inversión Total</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(kpis.inversionTotal)}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl hover:border-purple-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Ganancia Neta</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(kpis.gananciaNeta)}</div>
            <p className="text-xs text-zinc-500 mt-1">ROI: {kpis.roi.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl hover:border-orange-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Saldo por Cobrar</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(kpis.saldoPorCobrar)}</div>
            <p className="text-xs text-zinc-500 mt-1">Cobrado: {formatCurrency(kpis.totalCobrado)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Grafico de Evolución */}
        <Card className="lg:col-span-4 bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-zinc-100">Evolución de Ingresos</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graficoEvolucion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="fecha" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `S/${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grafico de Inversión */}
        <Card className="lg:col-span-3 bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-zinc-100">Distribución de Inversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex flex-col items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={graficoInversion}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {graficoInversion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                    formatter={(val: any) => [`S/ ${Number(val).toFixed(2)}`, 'Inversión']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-sm text-zinc-400">Total</span>
                <span className="text-xl font-bold text-white">{formatCurrency(kpis.inversionTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cuentas por Cobrar */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Cuentas por Cobrar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cuentasPorCobrar.length === 0 ? (
              <p className="text-sm text-zinc-400">No hay cuentas pendientes por cobrar 🎉</p>
            ) : (
              cuentasPorCobrar.map((cuenta) => (
                <div key={cuenta.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                  <div>
                    <p className="text-sm font-medium text-white">{cuenta.cliente}</p>
                    <p className="text-xs text-zinc-400">{new Date(cuenta.fecha).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-orange-400 border-orange-500/20 bg-orange-500/10">
                      Pendiente: {formatCurrency(Number(cuenta.saldoPendiente))}
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
