'use server'

import prisma from '@/lib/prisma'

export async function getDashboardData() {
  const [inversiones, ventas, ingresosDirectos, filamentos] = await Promise.all([
    prisma.inversion.findMany({
      orderBy: { createdAt: 'desc' }
    }),
    prisma.venta.findMany({
      include: {
        producto: true,
        colorFilamento: true,
        pagos: { orderBy: { fecha: 'asc' } }
      },
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

  // 6. Total Cobrado en Efectivo de Ventas (calculado desde pagos o montoPagado)
  const totalCobradoVentas = ventas.reduce((sum, v) => {
    if (v.pagos && v.pagos.length > 0) {
      const sumP = v.pagos.reduce((pSum, p) => pSum + Number(p.monto), 0)
      return sum + Math.max(sumP, Number(v.montoPagado || 0))
    }
    return sum + Number(v.montoPagado || 0)
  }, 0)

  // 7. Saldo Total por Cobrar a Clientes
  const saldoPorCobrar = ventas.reduce((sum, item) => sum + Number(item.saldoPendiente), 0)

  // 8. Ticket Promedio
  const ticketPromedio = ventas.length > 0 ? ingresosVentas / ventas.length : 0

  // 9. Total Ingresos Directos / Financiamiento
  const totalIngresosDirectos = ingresosDirectos.reduce((sum, i) => sum + Number(i.monto), 0)

  // 10. Evolución de ventas, recaudación y costo en todo el historial
  const timelineMap: Record<string, { ingresos: number; costo: number; ganancia: number }> = {}

  // A. Procesar costos y ventas base en la fecha de registro
  ventas.forEach((venta) => {
    const vDate = venta.fecha.toISOString().split('T')[0]
    if (!timelineMap[vDate]) {
      timelineMap[vDate] = { ingresos: 0, costo: 0, ganancia: 0 }
    }

    const costoBaseUnit = venta.costoBaseSnapshot != null && Number(venta.costoBaseSnapshot) > 0 
      ? Number(venta.costoBaseSnapshot) 
      : (Number(venta.producto?.costoBase) || 0)
    const ventaCosto = costoBaseUnit * venta.cantidad
    timelineMap[vDate].costo += ventaCosto

    // Si la venta no cuenta con desglose de pagos (ventas anteriores a la tabla PagoVenta)
    if (!venta.pagos || venta.pagos.length === 0) {
      timelineMap[vDate].ingresos += Number(venta.montoPagado != null ? venta.montoPagado : venta.total)
    }
  })

  // B. Procesar recaudaciones/abonos en sus fechas efectivas de pago (incluyendo Septiembre)
  ventas.forEach((venta) => {
    if (venta.pagos && venta.pagos.length > 0) {
      venta.pagos.forEach((pago) => {
        const pDate = pago.fecha.toISOString().split('T')[0]
        if (!timelineMap[pDate]) {
          timelineMap[pDate] = { ingresos: 0, costo: 0, ganancia: 0 }
        }
        timelineMap[pDate].ingresos += Number(pago.monto)
      })
    }
  })

  // C. Generar array ordenado cronológicamente con todo el historial
  const graficoEvolucion = Object.entries(timelineMap)
    .map(([fecha, vals]) => ({ 
      fecha, 
      ingresos: Number(vals.ingresos.toFixed(2)),
      costo: Number(vals.costo.toFixed(2)),
      ganancia: Number((vals.ingresos - vals.costo).toFixed(2))
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

  // 12. Indicador de Capacidad de Gasto del Mes Actual (Lo que tengo vs Lo Blindado vs Lo Proyectado)
  const saldoActualCaja = Math.max(0, (totalCobradoVentas + totalIngresosDirectos) - egresosTotales)
  const cuotaPrestamoMensual = 368.88
  const reservaCapexMensual = 878.00
  const gastosFijosTaller = 111.00
  const totalBlindadoMes = cuotaPrestamoMensual + reservaCapexMensual + gastosFijosTaller
  const gastoDisponibleHoy = Math.max(0, saldoActualCaja - totalBlindadoMes)
  const margenUnitarioPromedio = ticketPromedio > 0 ? (gananciaNeta / Math.max(1, ventas.length)) : 97.00
  const pedidosProyectadosMes = Math.max(8, Math.min(30, Math.round(ventas.length / Math.max(1, 2)) || 18))
  const gananciaProyectadaMes = pedidosProyectadosMes * margenUnitarioPromedio
  const gastoDisponibleProyectado = Math.max(0, (saldoActualCaja + gananciaProyectadaMes) - totalBlindadoMes)

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
    capacidadGasto: {
      saldoActualCaja,
      totalBlindadoMes,
      cuotaPrestamoMensual,
      reservaCapexMensual,
      gastosFijosTaller,
      gastoDisponibleHoy,
      gastoDisponibleProyectado,
      pedidosProyectadosMes,
      gananciaProyectadaMes
    },
    graficoEvolucion,
    graficoInversion,
    cuentasPorCobrar,
    topColores
  }
}

