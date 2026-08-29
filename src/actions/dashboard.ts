'use server'

import prisma from '@/lib/prisma'

export async function getDashboardData() {
  const [inversiones, ventas, ingresosDirectos] = await Promise.all([
    prisma.inversion.findMany(),
    prisma.venta.findMany({
      include: { producto: true },
      orderBy: { fecha: 'desc' }
    }),
    prisma.ingreso.findMany({
      orderBy: { fecha: 'desc' }
    }),
  ])

  // 1. Egresos / Inversión Total en el Taller (Maquinaria + Insumos + Servicios)
  const egresosTotales = inversiones.reduce((sum, item) => sum + Number(item.costoTotal), 0)

  // 2. Ingresos por Ventas de Catálogo
  const ingresosVentas = ventas.reduce((sum, item) => sum + Number(item.total), 0)

  // 3. Costo Total de Fabricación de los productos vendidos
  const costoFabricacionTotal = ventas.reduce((sum, v) => {
    const costoBaseUnit = Number(v.producto?.costoBase) || 0
    return sum + (costoBaseUnit * v.cantidad)
  }, 0)

  // 4. GANANCIA NETA EN VENTAS (Ingresos por Venta - Costo de Fabricación)
  const gananciaNeta = ingresosVentas - costoFabricacionTotal

  // 5. Margen de Ganancia sobre Costo (%)
  const margenPorcentaje = costoFabricacionTotal > 0 
    ? (gananciaNeta / costoFabricacionTotal) * 100 
    : 0

  // 6. Total Cobrado en Efectivo de Ventas
  const totalCobradoVentas = ventas.reduce((sum, item) => sum + Number(item.montoPagado), 0)

  // 7. Saldo Total por Cobrar a Clientes
  const saldoPorCobrar = ventas.reduce((sum, item) => sum + Number(item.saldoPendiente), 0)

  // 8. Ticket Promedio
  const ticketPromedio = ventas.length > 0 ? ingresosVentas / ventas.length : 0

  // 9. Total Ingresos Directos / Financiamiento
  const totalIngresosDirectos = ingresosDirectos.reduce((sum, i) => sum + Number(i.monto), 0)

  // 10. Evolución de ventas y ganancia
  const ventasPorFecha = ventas.reduce((acc, venta) => {
    const date = venta.fecha.toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { ingresos: 0, costo: 0, ganancia: 0 }
    }
    const ventaTotal = Number(venta.total)
    const ventaCosto = (Number(venta.producto?.costoBase) || 0) * venta.cantidad
    acc[date].ingresos += ventaTotal
    acc[date].costo += ventaCosto
    acc[date].ganancia += (ventaTotal - ventaCosto)
    return acc
  }, {} as Record<string, { ingresos: number; costo: number; ganancia: number }>)

  const graficoEvolucion = Object.entries(ventasPorFecha)
    .map(([fecha, vals]) => ({ 
      fecha, 
      ingresos: vals.ingresos,
      costo: vals.costo,
      ganancia: vals.ganancia
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Distribución de Egresos por Categoría
  const distribucionInversion = inversiones.reduce((acc, inv) => {
    let catName = 'Insumos & Materiales'
    if (inv.categoria === 'ACTIVO_FIJO') catName = 'Maquinaria & Equipos'
    else if (inv.categoria === 'SERVICIO') catName = 'Servicios & Operativos'
    else if (inv.categoria === 'APORTE_CAPITAL') catName = 'Aporte Capital'
    
    if (!acc[catName]) acc[catName] = 0
    acc[catName] += Number(inv.costoTotal)
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
      ingresosVentas,
      costoFabricacionTotal,
      gananciaNeta,
      margenPorcentaje,
      totalCobradoVentas,
      saldoPorCobrar,
      egresosTotales,
      ticketPromedio,
      totalIngresosDirectos
    },
    graficoEvolucion,
    graficoInversion,
    cuentasPorCobrar
  }
}
