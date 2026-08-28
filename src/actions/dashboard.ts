'use server'

import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function getDashboardData() {
  const inversiones = await prisma.inversion.findMany()
  const ventas = await prisma.venta.findMany()

  // 1. Inversión Total: Sumatoria de costoTotal
  const inversionTotal = inversiones.reduce((sum, item) => sum + Number(item.costoTotal), 0)

  // 2. Ingresos Totales (Vendido)
  const ingresosTotales = ventas.reduce((sum, item) => sum + Number(item.total), 0)

  // 3. Total Recaudado / Cobrado
  const totalCobrado = ventas.reduce((sum, item) => sum + Number(item.montoPagado), 0)

  // 4. Saldo Total por Cobrar
  const saldoPorCobrar = ventas.reduce((sum, item) => sum + Number(item.saldoPendiente), 0)

  // 5. Ganancia Neta
  const gananciaNeta = ingresosTotales - inversionTotal

  // 6. ROI (%)
  const roi = inversionTotal > 0 ? (gananciaNeta / inversionTotal) * 100 : 0

  // 7. Ticket Promedio
  const ticketPromedio = ventas.length > 0 ? ingresosTotales / ventas.length : 0

  // Datos para gráficos
  // Evolución temporal (simplificado para el dashboard)
  const ventasPorFecha = ventas.reduce((acc, venta) => {
    const date = venta.fecha.toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = 0
    }
    acc[date] += Number(venta.total)
    return acc
  }, {} as Record<string, number>)

  const graficoEvolucion = Object.entries(ventasPorFecha)
    .map(([fecha, ingresos]) => ({ fecha, ingresos }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Distribución de Inversión por Categoría
  const distribucionInversion = inversiones.reduce((acc, inv) => {
    const cat = inv.categoria
    if (!acc[cat]) acc[cat] = 0
    acc[cat] += Number(inv.costoTotal)
    return acc
  }, {} as Record<string, number>)

  const graficoInversion = Object.entries(distribucionInversion).map(([name, value]) => ({ name, value }))

  // Cuentas por cobrar
  const cuentasPorCobrar = ventas
    .filter((v) => Number(v.saldoPendiente) > 0)
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .map((v) => ({
      ...v,
      fecha: v.fecha.toISOString(),
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
      precioUnitario: Number(v.precioUnitario),
      total: Number(v.total),
      montoPagado: Number(v.montoPagado),
      saldoPendiente: Number(v.saldoPendiente),
    }))

  return {
    kpis: {
      inversionTotal,
      ingresosTotales,
      totalCobrado,
      saldoPorCobrar,
      gananciaNeta,
      roi,
      ticketPromedio
    },
    graficoEvolucion,
    graficoInversion,
    cuentasPorCobrar
  }
}
