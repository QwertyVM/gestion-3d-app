'use server'

import prisma from '@/lib/prisma'
import { getPedidos, addPagoPedido } from '@/actions/pedidos'
import { registrarAbono } from '@/actions/ventas'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'
import { getResumenBlindadoOficial } from '@/actions/presupuesto'

export async function getDashboardData(negocio?: TipoNegocio) {
  const targetNegocio = negocio || await getActiveNegocioServer()

  const [inversiones, pedidos, ingresosDirectos, filamentos] = await Promise.all([
    prisma.inversion.findMany({
      where: { negocio: targetNegocio },
      orderBy: { createdAt: 'desc' }
    }),
    getPedidos(targetNegocio),
    prisma.ingreso.findMany({
      where: { negocio: targetNegocio },
      orderBy: { fecha: 'desc' }
    }),
    targetNegocio === '3D' ? prisma.inventarioFilamento.findMany({
      where: { activo: true }
    }) : Promise.resolve([])
  ])

  // 1. Egresos / Inversión Total en el Taller (Maquinaria + Insumos + Servicios)
  const egresosTotales = inversiones.reduce((sum, item) => sum + Number(item.costoTotal), 0)

  // 2. Ingresos por Ventas de Catálogo
  const ingresosVentas = pedidos.reduce((sum, item) => sum + Number(item.total), 0)

  // 3. Costo Total de Fabricación de los productos vendidos
  const costoFabricacionTotal = pedidos.reduce((sum, p) => sum + Number(p.costoBaseTotal || 0), 0)

  // 3.b Costo Total de Packaging (Cajas) y Envío
  const costoCajasTotal = pedidos.reduce((sum, p) => sum + Number(p.costoTotalCajas || 0), 0)
  const costoEnvioTotal = pedidos.reduce((sum, p) => sum + Number(p.costoEnvio || 0), 0)
  const costoDirectoTotal = costoFabricacionTotal + costoCajasTotal + costoEnvioTotal

  // 4. GANANCIA NETA EN VENTAS (Ingresos por Venta - Costos Directos: Fabricación + Cajas + Envío)
  const gananciaNeta = ingresosVentas - costoDirectoTotal

  // 5. Margen de Ganancia sobre Costo Real (%)
  const margenPorcentaje = costoDirectoTotal > 0 
    ? (gananciaNeta / costoDirectoTotal) * 100 
    : 0

  // 6. Total Cobrado en Efectivo de Ventas (calculado desde pagos o montoPagado)
  const totalCobradoVentas = pedidos.reduce((sum: number, p) => sum + Number(p.montoPagado || 0), 0)

  // 7. Saldo Total por Cobrar a Clientes
  const saldoPorCobrar = pedidos.reduce((sum, item) => sum + Number(item.saldoPendiente || 0), 0)

  // 8. Ticket Promedio
  const ticketPromedio = pedidos.length > 0 ? ingresosVentas / pedidos.length : 0

  // 9. Total Ingresos Directos / Financiamiento
  const totalIngresosDirectos = ingresosDirectos.reduce((sum, i) => sum + Number(i.monto), 0)

  // 10. Evolución de ventas, recaudación y costo en todo el historial
  const timelineMap: Record<string, { ingresos: number; costo: number; ganancia: number }> = {}

  // A. Procesar costos y ventas base en la fecha de registro
  pedidos.forEach((p) => {
    const vDate = String(p.fecha).split('T')[0]
    if (!timelineMap[vDate]) {
      timelineMap[vDate] = { ingresos: 0, costo: 0, ganancia: 0 }
    }

    const pCosto = Number(p.costoBaseTotal || 0) + Number(p.costoTotalCajas || 0) + Number(p.costoEnvio || 0)
    timelineMap[vDate].costo += pCosto

    // Si el pedido no cuenta con desglose de pagos
    if (!p.pagos || p.pagos.length === 0) {
      timelineMap[vDate].ingresos += Number(p.montoPagado != null ? p.montoPagado : p.total)
    }
  })

  // B. Procesar recaudaciones/abonos en sus fechas efectivas de pago
  pedidos.forEach((p) => {
    if (p.pagos && p.pagos.length > 0) {
      p.pagos.forEach((pago: any) => {
        const pDate = String(pago.fecha).split('T')[0]
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
  const isBG = targetNegocio === 'BG'
  const distribucionInversion = inversiones.reduce((acc, inv) => {
    let catName = isBG ? 'Compra de Juegos' : 'Insumos & Materiales'
    if (inv.categoria === 'MERCADERIA') catName = 'Compra de Juegos'
    else if (inv.categoria === 'PERSONAL') catName = 'Personal & Sueldos'
    else if (inv.categoria === 'FINANCIERO') catName = 'Gastos Bancarios & ITF'
    else if (inv.categoria === 'ACTIVO_FIJO') catName = isBG ? 'Equipamiento' : 'Maquinaria & Equipos'
    else if (inv.categoria === 'SERVICIO') catName = 'Servicios & Operativos'
    else if (inv.categoria === 'APORTE_CAPITAL') catName = 'Aporte Capital'
    
    if (!acc[catName]) acc[catName] = 0
    acc[catName] += Number(inv.costoTotal)
    return acc
  }, {} as Record<string, number>)

  const graficoInversion = Object.entries(distribucionInversion).map(([name, value]) => ({ name, value }))

  // Cuentas por cobrar
  const cuentasPorCobrar = pedidos
    .filter((p: any) => Number(p.saldoPendiente) > 0)
    .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .map((p: any) => {
      const firstItem = p.items?.[0]
      const prodName = p.items && p.items.length > 0
        ? p.items.map((it: any) => `${it.cantidad}x ${it.nombreProductoSnapshot || it.producto?.nombreModelo || 'Pieza'}`).join(', ')
        : 'Pedido'

      return {
        id: p.id,
        fecha: p.fecha instanceof Date ? p.fecha.toISOString() : String(p.fecha),
        cliente: p.cliente,
        productoId: firstItem?.productoId || p.id,
        nombreProductoSnapshot: prodName,
        costoBaseSnapshot: Number(p.costoBaseTotal || 0),
        colorFilamentoId: firstItem?.colorFilamentoId || null,
        personalizacion: p.notas || null,
        gramosConsumidos: p.items?.reduce((sum: number, it: any) => sum + Number(it.gramosConsumidos || 0), 0) || 0,
        cantidad: p.items?.reduce((sum: number, it: any) => sum + Number(it.cantidad || 1), 0) || 1,
        tipoPrecio: firstItem?.tipoPrecio || 'MENOR',
        precioUnitario: Number(p.total),
        total: Number(p.total),
        montoPagado: Number(p.montoPagado),
        saldoPendiente: Number(p.saldoPendiente),
        costoPackaging: Number(p.costoTotalCajas || 0),
        porcentajeAdicional: 0,
        estado: p.estado,
        diaEntregaPrometida: p.diaEntregaPrometida || null,
        destinoEnvio: p.destinoEnvio || null,
        canalVenta: p.canalVenta || null,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
        producto: firstItem?.producto ? {
          id: firstItem.producto.id,
          lineaCategoria: firstItem.producto.lineaCategoria,
          nombreModelo: firstItem.producto.nombreModelo,
          costoBase: Number(firstItem.producto.costoBase),
          precioMayor: Number(firstItem.producto.precioMayor),
          precioMenor: Number(firstItem.producto.precioMenor),
          activo: firstItem.producto.activo,
          createdAt: firstItem.producto.createdAt instanceof Date ? firstItem.producto.createdAt.toISOString() : String(firstItem.producto.createdAt),
          updatedAt: firstItem.producto.updatedAt instanceof Date ? firstItem.producto.updatedAt.toISOString() : String(firstItem.producto.updatedAt),
        } : {
          id: firstItem?.productoId || p.id,
          lineaCategoria: 'General',
          nombreModelo: prodName,
          costoBase: 0,
          precioMayor: 0,
          precioMenor: 0,
          activo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
    })

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

  pedidos.forEach((p) => {
    (p.items || []).forEach((it: any) => {
      if (it.colorFilamentoId || it.colorFilamento) {
        const colorId = it.colorFilamentoId || it.colorFilamento?.id || 'otro'
        const colorNombre = it.colorFilamento?.nombreColor || 'Color Taller'
        const colorHex = it.colorFilamento?.codigoHex || '#18181B'

        const costoBaseUnit = it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0
          ? Number(it.costoBaseSnapshot)
          : (Number(it.producto?.costoBase) || 0)

        const gramosConsumidos = it.gramosConsumidos != null && Number(it.gramosConsumidos) > 0
          ? Number(it.gramosConsumidos)
          : Number(((costoBaseUnit / 0.065) * Number(it.cantidad || 1)).toFixed(1))

        const filamentoEnTaller = filamentos.find(f => f.id === colorId || f.nombreColor.toLowerCase() === colorNombre.toLowerCase())
        const stockGramosActual = filamentoEnTaller ? Number(filamentoEnTaller.stockGramos || 0) : Number(it.colorFilamento?.stockGramos || 1000)
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
        colorUsageMap[colorNombre].unidadesCount += Number(it.cantidad || 1)
        colorUsageMap[colorNombre].gramosTotal += gramosConsumidos
        totalGramosGeneral += gramosConsumidos
      }
    })
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

  // 12. Top 5 Clientes que más han comprado en valor (Monetario Total)
  const clientesMap: Record<string, {
    cliente: string
    totalComprado: number
    totalPagado: number
    saldoPendiente: number
    pedidosCount: number
    piezasCount: number
    canales: Record<string, number>
    ultimoPedidoFecha: string
  }> = {}

  // 13. Top 5 Artículos Más Vendidos y Rentables
  const articulosMap: Record<string, {
    id: string
    nombreModelo: string
    lineaCategoria: string
    imageUrl?: string | null
    unidadesVendidas: number
    totalFacturado: number
    costoProduccionTotal: number
    pedidosCount: number
  }> = {}

  let totalUnidadesVendidas = 0

  // Procesar pedidos ya cargados en memoria
  pedidos.forEach((p) => {
    const rawCliente = (p.cliente || 'Cliente sin nombre').trim()
    const cKey = rawCliente.toLowerCase()

    if (!clientesMap[cKey]) {
      clientesMap[cKey] = {
        cliente: rawCliente,
        totalComprado: 0,
        totalPagado: 0,
        saldoPendiente: 0,
        pedidosCount: 0,
        piezasCount: 0,
        canales: {},
        ultimoPedidoFecha: String(p.fecha)
      }
    }

    const c = clientesMap[cKey]
    c.totalComprado += Number(p.total || 0)
    c.totalPagado += Number(p.montoPagado || 0)
    c.saldoPendiente += Number(p.saldoPendiente || 0)
    c.pedidosCount += 1

    const piezasPedido = Array.isArray(p.items) && p.items.length > 0
      ? p.items.reduce((acc, it) => acc + Number(it.cantidad || 1), 0)
      : 1
    c.piezasCount += piezasPedido

    if (p.canalVenta) {
      c.canales[p.canalVenta] = (c.canales[p.canalVenta] || 0) + 1
    }

    const pFecha = String(p.fecha)
    if (new Date(pFecha).getTime() > new Date(c.ultimoPedidoFecha).getTime()) {
      c.ultimoPedidoFecha = pFecha
    }

    // Artículos del pedido
    if (Array.isArray(p.items)) {
      p.items.forEach((it) => {
        const nombre = it.producto?.nombreModelo || it.nombreProductoSnapshot || 'Artículo 3D'
        const artKey = (it.productoId || nombre).trim().toLowerCase()
        const categoria = it.producto?.lineaCategoria || 'General'
        const cant = Number(it.cantidad || 1)
        const sub = Number(it.subtotal != null ? it.subtotal : (Number(it.precioUnitario || 0) * cant))
        const costoBaseUnit = it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0
          ? Number(it.costoBaseSnapshot)
          : (Number(it.producto?.costoBase) || 0)
        const costoProd = costoBaseUnit * cant
        const img = it.producto?.imagenUrl || null

        if (!articulosMap[artKey]) {
          articulosMap[artKey] = {
            id: it.productoId || artKey,
            nombreModelo: nombre,
            lineaCategoria: categoria,
            imageUrl: img,
            unidadesVendidas: 0,
            totalFacturado: 0,
            costoProduccionTotal: 0,
            pedidosCount: 0
          }
        }

        articulosMap[artKey].unidadesVendidas += cant
        articulosMap[artKey].totalFacturado += sub
        articulosMap[artKey].costoProduccionTotal += costoProd
        articulosMap[artKey].pedidosCount += 1
        if (!articulosMap[artKey].imageUrl && img) {
          articulosMap[artKey].imageUrl = img
        }
        totalUnidadesVendidas += cant
      })
    }
  })

  // Helper para capitalizar nombres
  const formatClienteNombre = (name: string) => {
    if (!name) return 'Cliente'
    return name
      .trim()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  // Generar ranking Top 5 Clientes en Valor
  const topClientes = Object.values(clientesMap)
    .sort((a, b) => b.totalComprado - a.totalComprado || b.pedidosCount - a.pedidosCount)
    .slice(0, 5)
    .map((c) => {
      let canalPreferido: string | null = null
      let maxCount = 0
      Object.entries(c.canales).forEach(([canal, count]) => {
        if (count > maxCount) {
          maxCount = count
          canalPreferido = canal
        }
      })

      return {
        cliente: formatClienteNombre(c.cliente),
        totalComprado: Number(c.totalComprado.toFixed(2)),
        totalPagado: Number(c.totalPagado.toFixed(2)),
        saldoPendiente: Number(c.saldoPendiente.toFixed(2)),
        pedidosCount: c.pedidosCount,
        piezasCount: c.piezasCount,
        porcentajeDelTotal: ingresosVentas > 0 ? Number(((c.totalComprado / ingresosVentas) * 100).toFixed(1)) : 0,
        canalPreferido,
        ultimoPedidoFecha: c.ultimoPedidoFecha
      }
    })

  // Generar ranking Top 5 Artículos Más Rentables
  const topArticulos = Object.values(articulosMap)
    .map((art) => {
      const gananciaNeta = Number((art.totalFacturado - art.costoProduccionTotal).toFixed(2))
      const margenPorcentaje = art.totalFacturado > 0
        ? Number(((gananciaNeta / art.totalFacturado) * 100).toFixed(1))
        : 0
      return {
        id: art.id,
        nombreModelo: art.nombreModelo,
        lineaCategoria: art.lineaCategoria,
        imageUrl: art.imageUrl || null,
        unidadesVendidas: art.unidadesVendidas,
        totalFacturado: Number(art.totalFacturado.toFixed(2)),
        costoProduccionTotal: Number(art.costoProduccionTotal.toFixed(2)),
        gananciaNeta,
        margenPorcentaje,
        pedidosCount: art.pedidosCount,
        precioPromedio: art.unidadesVendidas > 0 ? Number((art.totalFacturado / art.unidadesVendidas).toFixed(2)) : 0,
        porcentajeUnidades: totalUnidadesVendidas > 0 ? Number(((art.unidadesVendidas / totalUnidadesVendidas) * 100).toFixed(1)) : 0,
        porcentajeFacturacion: ingresosVentas > 0 ? Number(((art.totalFacturado / ingresosVentas) * 100).toFixed(1)) : 0
      }
    })
    .sort((a, b) => b.gananciaNeta - a.gananciaNeta || b.totalFacturado - a.totalFacturado)
    .slice(0, 5)

  // 14. Capacidad de Gasto y Fondos Blindados directos desde Proyecciones y Presupuestos
  const resumenBlindado = await getResumenBlindadoOficial()
  const saldoActualCaja = Math.max(0, (totalCobradoVentas + totalIngresosDirectos) - egresosTotales)
  const totalBlindadoMes = resumenBlindado.totalBlindadoMes
  const gastoDisponibleHoy = Math.max(0, saldoActualCaja - totalBlindadoMes)
  const margenUnitarioPromedio = ticketPromedio > 0 ? (gananciaNeta / Math.max(1, pedidos.length)) : 97.00
  const pedidosProyectadosMes = Math.max(8, Math.min(30, Math.round(pedidos.length / Math.max(1, 2)) || 18))
  const gananciaProyectadaMes = pedidosProyectadosMes * margenUnitarioPromedio
  const gastoDisponibleProyectado = Math.max(0, (saldoActualCaja + gananciaProyectadaMes) - totalBlindadoMes)

  const serializedInversiones = inversiones.map((inv: any) => ({
    id: inv.id,
    fecha: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt),
    createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt),
    categoria: inv.categoria,
    subcategoria: inv.subcategoria,
    costoTotal: Number(inv.costoTotal),
    itemConcepto: inv.itemConcepto,
    persona: inv.persona
  }))

  const serializedIngresosDirectos = ingresosDirectos.map((ing: any) => ({
    id: ing.id,
    fecha: ing.fecha instanceof Date ? ing.fecha.toISOString() : String(ing.fecha),
    monto: Number(ing.monto),
    categoria: ing.categoria,
    concepto: ing.concepto,
    cliente: ing.cliente
  }))

  const serializedFilamentos = filamentos.map((f: any) => ({
    id: f.id,
    nombreColor: f.nombreColor,
    codigoHex: f.codigoHex || '#18181B',
    stockGramos: Number(f.stockGramos || 0),
    alertaCritica: Boolean(f.alertaCritica || (f.stockGramos && Number(f.stockGramos) < 300))
  }))

  return {
    kpis: {
      ingresosVentas,
      costoFabricacionTotal,
      costoCajasTotal,
      costoEnvioTotal,
      costoDirectoTotal,
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
      cuotaPrestamoMensual: resumenBlindado.cuotaPrestamoMensual,
      cuotaPrestamoPendiente: resumenBlindado.cuotaPrestamoPendiente,
      totalPagadoPrestamoMes: resumenBlindado.totalPagadoPrestamoMes,
      reservaCapexMensual: resumenBlindado.reservaCapexMensual,
      gastosFijosTaller: resumenBlindado.gastosFijosTaller,
      gastoDisponibleHoy,
      gastoDisponibleProyectado,
      pedidosProyectadosMes,
      gananciaProyectadaMes
    },
    graficoEvolucion,
    graficoInversion,
    cuentasPorCobrar,
    topColores,
    topClientes,
    topArticulos,
    rawVentas: pedidos,
    rawInversiones: serializedInversiones,
    rawIngresosDirectos: serializedIngresosDirectos,
    rawFilamentos: serializedFilamentos
  }
}

export async function registrarAbonoDashboard(
  id: string,
  data: {
    monto: number
    metodoPago?: string
    tipo?: string
    notas?: string
    fecha?: string | Date
  }
) {
  try {
    // Check if it's a Pedido
    const ped = await prisma.pedido.findUnique({ where: { id } })
    if (ped) {
      return await addPagoPedido(id, data)
    }
    // Otherwise it's a Venta
    const v = await prisma.venta.findUnique({ where: { id } })
    if (v) {
      const res = await registrarAbono(id, data)
      return { success: true, venta: res, error: undefined }
    }
    return { success: false, error: 'Registro de cuenta por cobrar no encontrado' }
  } catch (error: any) {
    console.error('Error al registrar abono desde dashboard:', error)
    return { success: false, error: error.message || 'Error al registrar abono' }
  }
}

