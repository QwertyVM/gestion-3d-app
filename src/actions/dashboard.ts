'use server'

import prisma from '@/lib/prisma'

export async function getDashboardData() {
  const [inversiones, ventas, ingresosDirectos, filamentos] = await Promise.all([
    prisma.inversion.findMany(),
    prisma.venta.findMany({
      include: { producto: true, colorFilamento: true },
      orderBy: { fecha: 'desc' }
    }),
    prisma.ingreso.findMany({
      orderBy: { fecha: 'desc' }
    }),
    prisma.inventarioFilamento.findMany({
      where: { activo: true }
    })
  ])

  // 1. Egresos / Inversión Total en el Taller (Maquinaria + Insumos + Servicios)
  const egresosTotales = inversiones.reduce((sum, item) => sum + Number(item.costoTotal), 0)

  // 2. Ingresos por Ventas de Catálogo
  const ingresosVentas = ventas.reduce((sum, item) => sum + Number(item.total), 0)

  // 3. Costo Total de Fabricación de los productos vendidos (usando snapshot histórico)
  const costoFabricacionTotal = ventas.reduce((sum, v) => {
    const costoBaseUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0 
      ? Number(v.costoBaseSnapshot) 
      : (Number(v.producto?.costoBase) || 0)
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
    const costoBaseUnit = venta.costoBaseSnapshot != null && Number(venta.costoBaseSnapshot) > 0 
      ? Number(venta.costoBaseSnapshot) 
      : (Number(venta.producto?.costoBase) || 0)
    const ventaCosto = costoBaseUnit * venta.cantidad
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
      id: v.id,
      fecha: v.fecha.toISOString(),
      cliente: v.cliente,
      productoId: v.productoId,
      nombreProductoSnapshot: v.nombreProductoSnapshot || v.producto?.nombreModelo || '',
      costoBaseSnapshot: v.costoBaseSnapshot != null ? Number(v.costoBaseSnapshot) : (v.producto ? Number(v.producto.costoBase) : 0),
      colorFilamentoId: v.colorFilamentoId || null,
      personalizacion: v.personalizacion || null,
      gramosConsumidos: v.gramosConsumidos != null ? Number(v.gramosConsumidos) : 0,
      cantidad: Number(v.cantidad),
      tipoPrecio: v.tipoPrecio,
      precioUnitario: Number(v.precioUnitario),
      total: Number(v.total),
      montoPagado: Number(v.montoPagado),
      saldoPendiente: Number(v.saldoPendiente),
      costoPackaging: v.costoPackaging != null ? Number(v.costoPackaging) : 0,
      porcentajeAdicional: v.porcentajeAdicional != null ? Number(v.porcentajeAdicional) : 0,
      estado: v.estado,
      diaEntregaPrometida: v.diaEntregaPrometida || null,
      destinoEnvio: v.destinoEnvio || null,
      canalVenta: v.canalVenta || null,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
      producto: v.producto ? {
        id: v.producto.id,
        lineaCategoria: v.producto.lineaCategoria,
        nombreModelo: v.producto.nombreModelo,
        costoBase: Number(v.producto.costoBase),
        precioAmigos: Number(v.producto.precioAmigos),
        precioMercado: Number(v.producto.precioMercado),
        precioComunidad: Number(v.producto.precioComunidad),
        activo: v.producto.activo,
        createdAt: v.producto.createdAt.toISOString(),
        updatedAt: v.producto.updatedAt.toISOString(),
      } : {
        id: v.productoId,
        lineaCategoria: 'General',
        nombreModelo: v.nombreProductoSnapshot || 'Producto',
        costoBase: 0,
        precioAmigos: 0,
        precioMercado: 0,
        precioComunidad: 0,
        activo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }))

  // 11. Top 5 Colores Más Utilizados en Taller
  const colorUsageMap: Record<string, {
    id: string
    nombreColor: string
    codigoHex: string
    pedidosCount: number
    unidadesCount: number
    gramosTotal: number
    stockGramosActual: number
    alertaCritica: boolean
  }> = {}

  let totalGramosGeneral = 0

  ventas.forEach((v) => {
    if (v.colorFilamentoId || v.colorFilamento) {
      const colorId = v.colorFilamentoId || v.colorFilamento?.id || 'otro'
      const colorNombre = v.colorFilamento?.nombreColor || 'Color Taller'
      const colorHex = v.colorFilamento?.codigoHex || '#18181B'

      const costoBaseUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0
        ? Number(v.costoBaseSnapshot)
        : (Number(v.producto?.costoBase) || 0)

      const gramosConsumidos = v.gramosConsumidos != null && Number(v.gramosConsumidos) > 0
        ? Number(v.gramosConsumidos)
        : Number(((costoBaseUnit / 0.065) * Number(v.cantidad || 1)).toFixed(1))

      const filamentoEnTaller = filamentos.find(f => f.id === colorId || f.nombreColor.toLowerCase() === colorNombre.toLowerCase())
      const stockGramosActual = filamentoEnTaller ? Number(filamentoEnTaller.stockGramos || 0) : Number(v.colorFilamento?.stockGramos || 1000)
      const alertaCritica = stockGramosActual < 300 || Boolean(filamentoEnTaller?.alertaCritica)

      if (!colorUsageMap[colorNombre]) {
        colorUsageMap[colorNombre] = {
          id: colorId,
          nombreColor: colorNombre,
          codigoHex: colorHex,
          pedidosCount: 0,
          unidadesCount: 0,
          gramosTotal: 0,
          stockGramosActual,
          alertaCritica
        }
      }

      colorUsageMap[colorNombre].pedidosCount += 1
      colorUsageMap[colorNombre].unidadesCount += Number(v.cantidad || 1)
      colorUsageMap[colorNombre].gramosTotal += gramosConsumidos
      totalGramosGeneral += gramosConsumidos
    }
  })

  const topColores = Object.values(colorUsageMap)
    .sort((a, b) => b.pedidosCount - a.pedidosCount || b.unidadesCount - a.unidadesCount || b.gramosTotal - a.gramosTotal)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      nombreColor: c.nombreColor,
      codigoHex: c.codigoHex,
      pedidosCount: c.pedidosCount,
      unidadesCount: c.unidadesCount,
      gramosTotal: Number(c.gramosTotal.toFixed(1)),
      stockGramosActual: c.stockGramosActual,
      alertaCritica: c.alertaCritica,
      porcentajeUso: totalGramosGeneral > 0 ? Math.min(100, Math.round((c.gramosTotal / totalGramosGeneral) * 100)) : 0
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
    cuentasPorCobrar,
    topColores
  }
}
