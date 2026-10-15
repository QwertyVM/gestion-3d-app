'use server'

import prisma from '@/lib/prisma'
import { getVentas } from '@/actions/ventas'
import { getResumenBlindadoOficial } from '@/actions/presupuesto'
import { getTallerData } from '@/actions/taller'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'
import { isDateInRange, MESES_ES, formatFechaEvolucion } from '@/lib/date-utils'

export interface KpiExplanationStep {
  paso: number
  descripcion: string
  operacion?: string
  resultadoParcial?: string
}

export interface KpiExplanationMetric {
  etiqueta: string
  valor: string
  tipo?: 'positivo' | 'negativo' | 'neutro' | 'destacado'
}

export interface KpiTransactionItem {
  id: string
  fecha: string
  concepto: string
  monto?: number
  montoFormateado?: string
  categoriaOEstado?: string
  cliente?: string
}

export interface KpiExplanationData {
  kpiId: string
  titulo: string
  subtitulo: string
  valorFormateado: string
  rangoFechas: {
    from: string | null
    to: string | null
    descripcion: string
  }
  formulaMatematica: string
  explicacionConceptual: string
  pasosCalculo: KpiExplanationStep[]
  resumenMetricas: KpiExplanationMetric[]
  transaccionesDetalle: KpiTransactionItem[]
  totalTransacciones: number
  notaAuditoria?: string
}

function formatCurrency(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getRangoDescripcion(from: string | null, to: string | null): string {
  if (!from && !to) return 'Histórico Completo (Sin filtro de fechas)'
  if (from && to) {
    if (from === to) return `Fecha: ${from}`
    const [fY, fM, fD] = from.split('-').map(Number)
    const [tY, tM, tD] = to.split('-').map(Number)
    if (fY === tY && fM === tM && fD === 1) {
      const lastDay = new Date(fY, fM, 0).getDate()
      if (tD === lastDay) {
        return `${MESES_ES[fM - 1]} ${fY}`
      }
    }
    return `Del ${formatFechaEvolucion(from)} al ${formatFechaEvolucion(to)}`
  }
  if (from) return `Desde el ${formatFechaEvolucion(from)}`
  return `Hasta el ${formatFechaEvolucion(to!)}`
}

export async function getKpiExplanation(
  kpiId: string,
  from?: string | null,
  to?: string | null,
  negocioParam?: TipoNegocio | null
): Promise<KpiExplanationData> {
  const targetNegocio = negocioParam || await getActiveNegocioServer()
  const rangoDescripcion = getRangoDescripcion(from || null, to || null)

  // Consultar datos base
  const [ventas, inversiones, ingresosDirectos, blindado] = await Promise.all([
    getVentas(targetNegocio),
    prisma.inversion.findMany({
      where: { negocio: targetNegocio },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.ingreso.findMany({
      where: { negocio: targetNegocio },
      orderBy: { fecha: 'desc' }
    }),
    getResumenBlindadoOficial()
  ])

  // Filtrar según el rango de fechas
  const filteredVentas = ventas.filter((v: any) => isDateInRange(v.fecha, from, to))
  const filteredInversiones = inversiones.filter((inv: any) => isDateInRange(inv.createdAt, from, to))
  const filteredIngresosDirectos = ingresosDirectos.filter((i: any) => isDateInRange(i.fecha, from, to))

  // Cobranzas efectivas de ventas dentro del rango
  const cobrosEnRango: Array<{
    id: string
    fecha: string
    cliente: string
    monto: number
    metodoPago: string
    codigoRef?: string
  }> = []

  ventas.forEach((v: any) => {
    if (Array.isArray(v.pagos) && v.pagos.length > 0) {
      v.pagos.forEach((p: any) => {
        if (isDateInRange(p.fecha, from, to)) {
          cobrosEnRango.push({
            id: p.id,
            fecha: String(p.fecha).split('T')[0],
            cliente: v.cliente || 'Cliente',
            monto: Number(p.monto || 0),
            metodoPago: p.metodoPago || 'YAPE',
            codigoRef: v.codigo || v.id.slice(0, 8)
          })
        }
      })
    } else if (isDateInRange(v.fecha, from, to) && Number(v.montoPagado || 0) > 0) {
      cobrosEnRango.push({
        id: `legacy-${v.id}`,
        fecha: String(v.fecha).split('T')[0],
        cliente: v.cliente || 'Cliente',
        monto: Number(v.montoPagado || 0),
        metodoPago: 'Directo',
        codigoRef: v.codigo || v.id.slice(0, 8)
      })
    }
  })

  // =========================================================================
  // 1. DASHBOARD: FACTURACIÓN DEL PERÍODO
  // =========================================================================
  if (kpiId === 'facturacion_periodo') {
    const totalFacturado = filteredVentas.reduce((sum: number, v: any) => sum + Number(v.total || 0), 0)
    
    const costoProduccionTotal = filteredVentas.reduce((sum: number, v: any) => {
      if (Array.isArray(v.items) && v.items.length > 0) {
        return sum + v.items.reduce((iSum: number, it: any) => {
          const cUnit = it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0
            ? Number(it.costoBaseSnapshot)
            : (Number(it.producto?.costoBase) || 0)
          return iSum + (cUnit * Number(it.cantidad || 1))
        }, 0)
      }
      const cUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0 
        ? Number(v.costoBaseSnapshot) 
        : (Number(v.producto?.costoBase) || 0)
      return sum + (cUnit * Number(v.cantidad || 1))
    }, 0)

    const gananciaNeta = totalFacturado - costoProduccionTotal
    const margenPct = costoProduccionTotal > 0 ? (gananciaNeta / costoProduccionTotal) * 100 : 0

    const transacciones: KpiTransactionItem[] = filteredVentas.map((v: any) => {
      const prodName = v.items && v.items.length > 0 
        ? v.items.map((it: any) => `${it.cantidad}x ${it.nombreModelo || 'Pieza'}`).join(', ')
        : (v.producto?.nombreModelo || v.nombreProductoSnapshot || 'Pedido')

      return {
        id: v.id,
        fecha: String(v.fecha).split('T')[0],
        concepto: prodName,
        monto: Number(v.total || 0),
        montoFormateado: formatCurrency(Number(v.total || 0)),
        cliente: v.cliente || 'Cliente sin nombre',
        categoriaOEstado: v.estado || 'REGISTRADO'
      }
    })

    return {
      kpiId,
      titulo: 'Facturación del Período',
      subtitulo: 'Volumen comercial bruto contratado en las fechas seleccionadas',
      valorFormateado: formatCurrency(totalFacturado),
      rangoFechas: { from: from || null, to: to || null, descripcion: rangoDescripcion },
      formulaMatematica: 'Facturación Total = ∑ (Total de cada Pedido registrado en el rango)',
      explicacionConceptual:
        'Representa la suma de todas las ventas contratadas cuyos pedidos fueron creados dentro del rango de fechas activo. No depende de si ya se terminó de cobrar, sino del valor comercial bruto demandado por los clientes.',
      pasosCalculo: [
        {
          paso: 1,
          descripcion: `Se filtraron todos los pedidos emitidos dentro del período (${rangoDescripcion}).`,
          resultadoParcial: `${filteredVentas.length} pedidos encontrados`
        },
        {
          paso: 2,
          descripcion: 'Se sumó el total bruto acordado de cada pedido individual.',
          operacion: '∑ Total_i',
          resultadoParcial: formatCurrency(totalFacturado)
        },
        {
          paso: 3,
          descripcion: 'Cálculo de costo de fabricación base (filamento consumido + electricidad según snapshot).',
          operacion: '∑ (CostoBaseSnapshot × Cantidad)',
          resultadoParcial: formatCurrency(costoProduccionTotal)
        },
        {
          paso: 4,
          descripcion: 'Determinación de la utilidad neta directa y margen comercial sobre costo.',
          operacion: `${formatCurrency(totalFacturado)} - ${formatCurrency(costoProduccionTotal)}`,
          resultadoParcial: `${formatCurrency(gananciaNeta)} (+${margenPct.toFixed(1)}%)`
        }
      ],
      resumenMetricas: [
        { etiqueta: 'Total Facturado', valor: formatCurrency(totalFacturado), tipo: 'destacado' },
        { etiqueta: 'Costo Fabricación', valor: formatCurrency(costoProduccionTotal), tipo: 'neutro' },
        { etiqueta: 'Utilidad Neta', valor: formatCurrency(gananciaNeta), tipo: 'positivo' },
        { etiqueta: 'Margen sobre Costo', valor: `+${margenPct.toFixed(1)}%`, tipo: 'positivo' },
        { etiqueta: 'Cantidad Pedidos', valor: `${filteredVentas.length}`, tipo: 'neutro' }
      ],
      transaccionesDetalle: transacciones,
      totalTransacciones: transacciones.length,
      notaAuditoria: 'Los pedidos fuera de este rango de fechas quedan excluidos automáticamente del cálculo.'
    }
  }

  // =========================================================================
  // 2. DASHBOARD & FINANZAS: GASTO LIBRE DISPONIBLE
  // =========================================================================
  if (kpiId === 'gasto_libre_disponible' || kpiId === 'finanzas_gasto_libre') {
    const totalCobradoVentas = cobrosEnRango.reduce((sum, c) => sum + c.monto, 0)
    const totalIngresosDirectos = filteredIngresosDirectos.reduce((sum, i: any) => sum + Number(i.monto || 0), 0)
    const egresosTotales = filteredInversiones.reduce((sum, inv: any) => sum + Number(inv.costoTotal || 0), 0)

    const saldoActualCaja = Math.max(0, (totalCobradoVentas + totalIngresosDirectos) - egresosTotales)
    
    const cuotaPrestamoMensual = blindado?.cuotaPrestamoMensual ?? 388.68
    const reservaCapexMensual = blindado?.reservaCapexMensual ?? 878.00
    const gastosFijosTaller = blindado?.gastosFijosTaller ?? 111.00
    const totalBlindadoMes = blindado?.totalBlindadoMes ?? (cuotaPrestamoMensual + reservaCapexMensual + gastosFijosTaller)
    
    const gastoDisponibleHoy = Math.max(0, saldoActualCaja - totalBlindadoMes)

    const transacciones: KpiTransactionItem[] = [
      ...cobrosEnRango.map(c => ({
        id: `cobro-${c.id}`,
        fecha: c.fecha,
        concepto: `Cobranza Pedido (${c.metodoPago})`,
        monto: c.monto,
        montoFormateado: `+${formatCurrency(c.monto)}`,
        cliente: c.cliente,
        categoriaOEstado: 'Entrada Pedido'
      })),
      ...filteredIngresosDirectos.map((i: any) => ({
        id: `ingreso-${i.id}`,
        fecha: String(i.fecha).split('T')[0],
        concepto: i.concepto || 'Ingreso directo / Aporte',
        monto: Number(i.monto || 0),
        montoFormateado: `+${formatCurrency(Number(i.monto || 0))}`,
        cliente: i.origen || 'Caja',
        categoriaOEstado: 'Ingreso Directo'
      })),
      ...filteredInversiones.map((inv: any) => ({
        id: `egreso-${inv.id}`,
        fecha: String(inv.createdAt).split('T')[0],
        concepto: inv.itemConcepto || 'Compra / Gasto',
        monto: -Number(inv.costoTotal || 0),
        montoFormateado: `-${formatCurrency(Number(inv.costoTotal || 0))}`,
        cliente: inv.categoria || 'Taller',
        categoriaOEstado: inv.categoria || 'Egreso'
      }))
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    return {
      kpiId,
      titulo: 'Gasto Libre Disponible',
      subtitulo: 'Capital líquido que se puede gastar hoy sin tocar los compromisos obligatorios',
      valorFormateado: formatCurrency(gastoDisponibleHoy),
      rangoFechas: { from: from || null, to: to || null, descripcion: rangoDescripcion },
      formulaMatematica: 'Gasto Libre = Saldo Actual en Caja - Total Fondos Blindados del Mes',
      explicacionConceptual:
        'Es la regla de oro de tranquilidad financiera del taller: evalúa cuánto dinero real ingresó en efectivo a caja menos los egresos ejecutados, y reserva de forma sagrada las 3 partidas mensuales (Préstamo, Capex e Insumos Fijos). El remanente es tu capacidad de gasto seguro.',
      pasosCalculo: [
        {
          paso: 1,
          descripcion: 'Sumar cobranzas de ventas ingresadas en caja durante el período.',
          operacion: '∑ Cobranzas en efectivo',
          resultadoParcial: formatCurrency(totalCobradoVentas)
        },
        {
          paso: 2,
          descripcion: 'Sumar ingresos directos o aportes de capital del período.',
          operacion: '∑ Ingresos directos',
          resultadoParcial: formatCurrency(totalIngresosDirectos)
        },
        {
          paso: 3,
          descripcion: 'Restar todas las compras de insumos, filamento y egresos del período.',
          operacion: '∑ Egresos del período',
          resultadoParcial: `-${formatCurrency(egresosTotales)}`
        },
        {
          paso: 4,
          descripcion: 'Saldo neto resultante en caja.',
          operacion: `(${formatCurrency(totalCobradoVentas)} + ${formatCurrency(totalIngresosDirectos)}) - ${formatCurrency(egresosTotales)}`,
          resultadoParcial: formatCurrency(saldoActualCaja)
        },
        {
          paso: 5,
          descripcion: 'Descontar la reserva mensual blindada (Préstamo + Capex + Costos Fijos).',
          operacion: `-${formatCurrency(totalBlindadoMes)}`,
          resultadoParcial: `Blindado: ${formatCurrency(totalBlindadoMes)}`
        },
        {
          paso: 6,
          descripcion: 'Gasto libre disponible hoy para operar sin descapitalizarse.',
          operacion: `max(0, ${formatCurrency(saldoActualCaja)} - ${formatCurrency(totalBlindadoMes)})`,
          resultadoParcial: formatCurrency(gastoDisponibleHoy)
        }
      ],
      resumenMetricas: [
        { etiqueta: 'Gasto Libre Hoy', valor: formatCurrency(gastoDisponibleHoy), tipo: gastoDisponibleHoy > 0 ? 'positivo' : 'negativo' },
        { etiqueta: 'Saldo Actual en Caja', valor: formatCurrency(saldoActualCaja), tipo: 'destacado' },
        { etiqueta: 'Total Blindado Mes', valor: formatCurrency(totalBlindadoMes), tipo: 'negativo' },
        { etiqueta: '• Cuota Préstamo', valor: formatCurrency(cuotaPrestamoMensual), tipo: 'neutro' },
        { etiqueta: '• Reserva Capex', valor: formatCurrency(reservaCapexMensual), tipo: 'neutro' },
        { etiqueta: '• Gastos Fijos Taller', valor: formatCurrency(gastosFijosTaller), tipo: 'neutro' }
      ],
      transaccionesDetalle: transacciones,
      totalTransacciones: transacciones.length,
      notaAuditoria: 'Si el saldo en caja es menor al monto blindado, el gasto libre se ajusta a S/ 0.00 para proteger las cuotas del mes.'
    }
  }

  // =========================================================================
  // 3. DASHBOARD & PEDIDOS: TOTAL COBRADO
  // =========================================================================
  if (kpiId === 'total_cobrado' || kpiId === 'pedidos_cobrado') {
    const totalCobrado = cobrosEnRango.reduce((sum, c) => sum + c.monto, 0)
    const saldoPorCobrarPeriodo = filteredVentas.reduce((sum: number, v: any) => sum + Number(v.saldoPendiente || 0), 0)

    const transacciones: KpiTransactionItem[] = cobrosEnRango.map(c => ({
      id: c.id,
      fecha: c.fecha,
      concepto: `Cobranza de pedido #${c.codigoRef}`,
      monto: c.monto,
      montoFormateado: formatCurrency(c.monto),
      cliente: c.cliente,
      categoriaOEstado: c.metodoPago
    })).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    return {
      kpiId,
      titulo: 'Total Cobrado',
      subtitulo: 'Dinero real ingresado y liquidado efectivamente en las fechas seleccionadas',
      valorFormateado: formatCurrency(totalCobrado),
      rangoFechas: { from: from || null, to: to || null, descripcion: rangoDescripcion },
      formulaMatematica: 'Total Cobrado = ∑ (Todos los pagos y abonos registrados con fecha dentro del rango)',
      explicacionConceptual:
        'Refleja la liquidez real que ya ingresó al negocio por pagos completos o anticipos de pedidos en las fechas elegidas. A diferencia de la facturación contratada, este KPI solo cuenta el dinero que ya está en tu mano.',
      pasosCalculo: [
        {
          paso: 1,
          descripcion: `Rastrear todos los pagos y abonos con fecha efectiva entre ${rangoDescripcion}.`,
          resultadoParcial: `${cobrosEnRango.length} transacciones registradas`
        },
        {
          paso: 2,
          descripcion: 'Sumar el importe de cada pago efectuado.',
          operacion: '∑ Pago_i',
          resultadoParcial: formatCurrency(totalCobrado)
        },
        {
          paso: 3,
          descripcion: 'Contrastar con el saldo por cobrar que aún deben los clientes en este período.',
          operacion: '∑ SaldoPendiente',
          resultadoParcial: formatCurrency(saldoPorCobrarPeriodo)
        }
      ],
      resumenMetricas: [
        { etiqueta: 'Total Cobrado', valor: formatCurrency(totalCobrado), tipo: 'destacado' },
        { etiqueta: 'Cobros Registrados', valor: `${cobrosEnRango.length}`, tipo: 'neutro' },
        { etiqueta: 'Saldo Aún por Cobrar', valor: formatCurrency(saldoPorCobrarPeriodo), tipo: saldoPorCobrarPeriodo > 0 ? 'negativo' : 'positivo' }
      ],
      transaccionesDetalle: transacciones,
      totalTransacciones: transacciones.length,
      notaAuditoria: 'Los abonos realizados en fechas fuera de este rango pertenecen a su respectivo período contable.'
    }
  }

  // =========================================================================
  // 4. DASHBOARD: TICKET PROMEDIO
  // =========================================================================
  if (kpiId === 'ticket_promedio') {
    const totalFacturado = filteredVentas.reduce((sum: number, v: any) => sum + Number(v.total || 0), 0)
    const cantPedidos = filteredVentas.length
    const ticketPromedio = cantPedidos > 0 ? totalFacturado / cantPedidos : 0

    const transacciones: KpiTransactionItem[] = filteredVentas.map((v: any) => ({
      id: v.id,
      fecha: String(v.fecha).split('T')[0],
      concepto: `Pedido #${v.codigo || v.id.slice(0, 8)}`,
      monto: Number(v.total || 0),
      montoFormateado: formatCurrency(Number(v.total || 0)),
      cliente: v.cliente || 'Cliente',
      categoriaOEstado: `${v.cantidad || 1} uds.`
    }))

    return {
      kpiId,
      titulo: 'Ticket Promedio',
      subtitulo: 'Monto medio de facturación obtenido por cada orden de compra',
      valorFormateado: formatCurrency(ticketPromedio),
      rangoFechas: { from: from || null, to: to || null, descripcion: rangoDescripcion },
      formulaMatematica: 'Ticket Promedio = Facturación Total del Período ÷ Cantidad Total de Pedidos',
      explicacionConceptual:
        'Indica el gasto medio de un cliente por cada pedido efectuado en el período. Es una métrica clave para evaluar si las ventas son minoristas de bajo monto o pedidos mayoristas y corporativos.',
      pasosCalculo: [
        {
          paso: 1,
          descripcion: 'Calcular la facturación total generada en el período.',
          operacion: '∑ Total_i',
          resultadoParcial: formatCurrency(totalFacturado)
        },
        {
          paso: 2,
          descripcion: 'Contar cuántos pedidos se concretaron en ese mismo período.',
          operacion: 'Conteo(pedidos)',
          resultadoParcial: `${cantPedidos} pedidos`
        },
        {
          paso: 3,
          descripcion: 'Dividir la facturación entre la cantidad de pedidos.',
          operacion: `${formatCurrency(totalFacturado)} ÷ ${cantPedidos}`,
          resultadoParcial: formatCurrency(ticketPromedio)
        }
      ],
      resumenMetricas: [
        { etiqueta: 'Ticket Promedio', valor: formatCurrency(ticketPromedio), tipo: 'destacado' },
        { etiqueta: 'Facturación Total', valor: formatCurrency(totalFacturado), tipo: 'neutro' },
        { etiqueta: 'Cantidad de Pedidos', valor: `${cantPedidos}`, tipo: 'neutro' }
      ],
      transaccionesDetalle: transacciones,
      totalTransacciones: transacciones.length,
      notaAuditoria: 'Si no hay pedidos en el rango de fechas seleccionado, el ticket promedio es S/ 0.00.'
    }
  }

  // =========================================================================
  // 5. PEDIDOS: TOTAL PEDIDOS & PIEZAS
  // =========================================================================
  if (kpiId === 'pedidos_total') {
    const cantPedidos = filteredVentas.length
    const totalPiezas = filteredVentas.reduce((sum: number, v: any) => sum + Number(v.cantidad || 1), 0)

    const transacciones: KpiTransactionItem[] = filteredVentas.map((v: any) => ({
      id: v.id,
      fecha: String(v.fecha).split('T')[0],
      concepto: `Pedido #${v.codigo || v.id.slice(0, 8)} (${v.cantidad || 1} uds)`,
      monto: Number(v.total || 0),
      montoFormateado: formatCurrency(Number(v.total || 0)),
      cliente: v.cliente || 'Cliente',
      categoriaOEstado: v.estado || 'REGISTRADO'
    }))

    return {
      kpiId,
      titulo: 'Total de Pedidos',
      subtitulo: 'Cantidad de órdenes comerciales y volumen de piezas emitidas',
      valorFormateado: `${cantPedidos} pedidos`,
      rangoFechas: { from: from || null, to: to || null, descripcion: rangoDescripcion },
      formulaMatematica: 'Total Pedidos = Conteo(Órdenes en el rango) | Total Piezas = ∑ (Unidades por orden)',
      explicacionConceptual:
        'Muestra la actividad comercial neta en volumen de transacciones y piezas totales a imprimir que ingresaron durante el período.',
      pasosCalculo: [
        {
          paso: 1,
          descripcion: `Contar órdenes creadas entre ${rangoDescripcion}.`,
          resultadoParcial: `${cantPedidos} pedidos`
        },
        {
          paso: 2,
          descripcion: 'Sumar la cantidad de piezas demandadas en cada una de esas órdenes.',
          operacion: '∑ Cantidad_i',
          resultadoParcial: `${totalPiezas} piezas físicas`
        }
      ],
      resumenMetricas: [
        { etiqueta: 'Total Pedidos', valor: `${cantPedidos}`, tipo: 'destacado' },
        { etiqueta: 'Total Piezas', valor: `${totalPiezas}`, tipo: 'positivo' }
      ],
      transaccionesDetalle: transacciones,
      totalTransacciones: transacciones.length
    }
  }

  // =========================================================================
  // 6. PEDIDOS: PREPARANDO (EN TALLER)
  // =========================================================================
  if (kpiId === 'pedidos_preparando') {
    const enPrep = filteredVentas.filter((v: any) =>
      ['PENDIENTE', 'EN_PRODUCCION', 'EN_TALLER', 'EMPAQUETANDO'].includes(v.estado)
    )
    const cantPiezas = enPrep.reduce((sum: number, v: any) => sum + Number(v.cantidad || 1), 0)

    const transacciones: KpiTransactionItem[] = enPrep.map((v: any) => ({
      id: v.id,
      fecha: String(v.fecha).split('T')[0],
      concepto: `Pedido #${v.codigo || v.id.slice(0, 8)} (${v.cantidad || 1} uds)`,
      monto: Number(v.total || 0),
      montoFormateado: formatCurrency(Number(v.total || 0)),
      cliente: v.cliente || 'Cliente',
      categoriaOEstado: v.estado
    }))

    return {
      kpiId,
      titulo: 'Pedidos Preparando',
      subtitulo: 'Órdenes del período que se encuentran activas en fase de taller o producción',
      valorFormateado: `${enPrep.length} pedidos`,
      rangoFechas: { from: from || null, to: to || null, descripcion: rangoDescripcion },
      formulaMatematica: 'Preparando = Conteo de pedidos en estado PENDIENTE, EN_PRODUCCION, EN_TALLER o EMPAQUETANDO',
      explicacionConceptual:
        'Permite controlar el embudo operativo: cuántos de los pedidos acordados en este período todavía están siendo impresos, ensamblados o empaquetados.',
      pasosCalculo: [
        {
          paso: 1,
          descripcion: 'Filtrar pedidos del período con estado operativo no finalizado.',
          resultadoParcial: `${enPrep.length} pedidos encontrados`
        },
        {
          paso: 2,
          descripcion: 'Calcular unidades físicas en proceso de manufactura.',
          resultadoParcial: `${cantPiezas} piezas en fabricación`
        }
      ],
      resumenMetricas: [
        { etiqueta: 'Pedidos en Taller', valor: `${enPrep.length}`, tipo: 'destacado' },
        { etiqueta: 'Piezas en Producción', valor: `${cantPiezas}`, tipo: 'neutro' }
      ],
      transaccionesDetalle: transacciones,
      totalTransacciones: transacciones.length
    }
  }

  // =========================================================================
  // 7. PEDIDOS: POR ENTREGAR (LISTOS)
  // =========================================================================
  if (kpiId === 'pedidos_por_entregar') {
    const listos = filteredVentas.filter((v: any) =>
      ['LISTO', 'LISTO_ENTREGA'].includes(v.estado)
    )
    const cantPiezas = listos.reduce((sum: number, v: any) => sum + Number(v.cantidad || 1), 0)

    const transacciones: KpiTransactionItem[] = listos.map((v: any) => ({
      id: v.id,
      fecha: String(v.fecha).split('T')[0],
      concepto: `Pedido #${v.codigo || v.id.slice(0, 8)} (${v.cantidad || 1} uds)`,
      monto: Number(v.total || 0),
      montoFormateado: formatCurrency(Number(v.total || 0)),
      cliente: v.cliente || 'Cliente',
      categoriaOEstado: v.estado
    }))

    return {
      kpiId,
      titulo: 'Pedidos Por Entregar',
      subtitulo: 'Piezas terminadas con control de calidad que esperan despacho o recojo',
      valorFormateado: `${listos.length} pedidos`,
      rangoFechas: { from: from || null, to: to || null, descripcion: rangoDescripcion },
      formulaMatematica: 'Por Entregar = Conteo de pedidos en estado LISTO o LISTO_ENTREGA',
      explicacionConceptual:
        'Indica los pedidos completados al 100% en taller que están listos para ser entregados al cliente o courier.',
      pasosCalculo: [
        {
          paso: 1,
          descripcion: 'Identificar pedidos fabricados al 100% que aún no han sido marcados como ENTREGADO.',
          resultadoParcial: `${listos.length} pedidos listos`
        },
        {
          paso: 2,
          descripcion: 'Suma de unidades terminadas listas para entrega.',
          resultadoParcial: `${cantPiezas} piezas finalizadas`
        }
      ],
      resumenMetricas: [
        { etiqueta: 'Pedidos Listos', valor: `${listos.length}`, tipo: 'destacado' },
        { etiqueta: 'Piezas Listas', valor: `${cantPiezas}`, tipo: 'positivo' }
      ],
      transaccionesDetalle: transacciones,
      totalTransacciones: transacciones.length
    }
  }

  // =========================================================================
  // 8. PEDIDOS: POR COBRAR (SALDO PENDIENTE)
  // =========================================================================
  if (kpiId === 'pedidos_por_cobrar') {
    const conSaldo = filteredVentas.filter((v: any) => Number(v.saldoPendiente || 0) > 0)
    const saldoTotal = conSaldo.reduce((sum: number, v: any) => sum + Number(v.saldoPendiente || 0), 0)

    const transacciones: KpiTransactionItem[] = conSaldo.map((v: any) => ({
      id: v.id,
      fecha: String(v.fecha).split('T')[0],
      concepto: `Pedido #${v.codigo || v.id.slice(0, 8)} (Total: ${formatCurrency(Number(v.total || 0))})`,
      monto: Number(v.saldoPendiente || 0),
      montoFormateado: formatCurrency(Number(v.saldoPendiente || 0)),
      cliente: v.cliente || 'Cliente',
      categoriaOEstado: `Debe ${formatCurrency(Number(v.saldoPendiente || 0))}`
    }))

    return {
      kpiId,
      titulo: 'Saldo Por Cobrar',
      subtitulo: 'Monto adeudado por clientes de los pedidos registrados en el período',
      valorFormateado: formatCurrency(saldoTotal),
      rangoFechas: { from: from || null, to: to || null, descripcion: rangoDescripcion },
      formulaMatematica: 'Saldo Por Cobrar = ∑ (Total_i - MontoPagado_i) para pedidos del rango con saldo pendiente > 0',
      explicacionConceptual:
        'Cuentas por cobrar comerciales generadas por pedidos del período. Permite auditar exactamente qué clientes aún no han cancelado el saldo de su encargo.',
      pasosCalculo: [
        {
          paso: 1,
          descripcion: 'Buscar pedidos del período donde el monto pagado sea menor al total acordado.',
          resultadoParcial: `${conSaldo.length} pedidos con deuda encontrados`
        },
        {
          paso: 2,
          descripcion: 'Sumar los saldos individuales pendientes de liquidar.',
          operacion: '∑ SaldoPendiente_i',
          resultadoParcial: formatCurrency(saldoTotal)
        }
      ],
      resumenMetricas: [
        { etiqueta: 'Total Por Cobrar', valor: formatCurrency(saldoTotal), tipo: saldoTotal > 0 ? 'negativo' : 'positivo' },
        { etiqueta: 'Pedidos Pendientes', valor: `${conSaldo.length}`, tipo: 'neutro' }
      ],
      transaccionesDetalle: transacciones,
      totalTransacciones: transacciones.length
    }
  }

  // =========================================================================
  // 9. FINANZAS: SALDO NETO EN CAJA & FONDOS BLINDADOS
  // =========================================================================
  if (kpiId === 'finanzas_saldo_caja') {
    const totalCobradoVentas = cobrosEnRango.reduce((sum, c) => sum + c.monto, 0)
    const totalIngresosDirectos = filteredIngresosDirectos.reduce((sum, i: any) => sum + Number(i.monto || 0), 0)
    const egresosTotales = filteredInversiones.reduce((sum, inv: any) => sum + Number(inv.costoTotal || 0), 0)
    const saldoNetoCaja = (totalCobradoVentas + totalIngresosDirectos) - egresosTotales

    return {
      kpiId,
      titulo: 'Saldo Neto en Caja',
      subtitulo: 'Liquidez contable resultante entre entradas y salidas del período',
      valorFormateado: formatCurrency(saldoNetoCaja),
      rangoFechas: { from: from || null, to: to || null, descripcion: rangoDescripcion },
      formulaMatematica: 'Saldo Neto = (Cobranzas de Pedidos + Ingresos Directos) - Egresos Totales',
      explicacionConceptual:
        'Representa el balance de caja real en el período auditado. Todo sol ingresado en efectivo menos todo sol desembolsado para compras de insumos, herramientas o costos operativos.',
      pasosCalculo: [
        {
          paso: 1,
          descripcion: 'Entradas por cobranzas de ventas y pedidos en efectivo.',
          operacion: '∑ Cobros',
          resultadoParcial: formatCurrency(totalCobradoVentas)
        },
        {
          paso: 2,
          descripcion: 'Entradas por aportes o ingresos directos.',
          operacion: '∑ Ingresos Directos',
          resultadoParcial: formatCurrency(totalIngresosDirectos)
        },
        {
          paso: 3,
          descripcion: 'Salidas y egresos registrados en el período.',
          operacion: '∑ Egresos',
          resultadoParcial: `-${formatCurrency(egresosTotales)}`
        },
        {
          paso: 4,
          descripcion: 'Resultado neto en caja.',
          operacion: `(${formatCurrency(totalCobradoVentas)} + ${formatCurrency(totalIngresosDirectos)}) - ${formatCurrency(egresosTotales)}`,
          resultadoParcial: formatCurrency(saldoNetoCaja)
        }
      ],
      resumenMetricas: [
        { etiqueta: 'Saldo Neto', valor: formatCurrency(saldoNetoCaja), tipo: saldoNetoCaja >= 0 ? 'positivo' : 'negativo' },
        { etiqueta: 'Ingresos Totales', valor: formatCurrency(totalCobradoVentas + totalIngresosDirectos), tipo: 'positivo' },
        { etiqueta: 'Egresos Totales', valor: formatCurrency(egresosTotales), tipo: 'negativo' }
      ],
      transaccionesDetalle: [],
      totalTransacciones: 0
    }
  }

  if (kpiId === 'finanzas_fondos_blindados') {
    const cuotaPrestamoMensual = blindado?.cuotaPrestamoMensual ?? 388.68
    const reservaCapexMensual = blindado?.reservaCapexMensual ?? 878.00
    const gastosFijosTaller = blindado?.gastosFijosTaller ?? 111.00
    const totalBlindadoMes = blindado?.totalBlindadoMes ?? (cuotaPrestamoMensual + reservaCapexMensual + gastosFijosTaller)

    return {
      kpiId,
      titulo: 'Fondos Blindados del Mes',
      subtitulo: 'Compromisos de pago obligatorios que no pueden ser gastados libremente',
      valorFormateado: formatCurrency(totalBlindadoMes),
      rangoFechas: { from: from || null, to: to || null, descripcion: 'Presupuesto Mensual Activo' },
      formulaMatematica: 'Fondos Blindados = Cuota Préstamo + Reserva Capex + Gastos Fijos de Taller',
      explicacionConceptual:
        'Es el colchón de seguridad financiero que garantiza la continuidad del taller: amortización de deuda, depreciación de maquinaria y servicios básicos fijos.',
      pasosCalculo: [
        { paso: 1, descripcion: 'Cuota obligatoria mensual de préstamo financiero.', resultadoParcial: formatCurrency(cuotaPrestamoMensual) },
        { paso: 2, descripcion: 'Reserva mensual para Capex y reemplazo de maquinaria/repuestos.', resultadoParcial: formatCurrency(reservaCapexMensual) },
        { paso: 3, descripcion: 'Gastos fijos presupuestados para servicios del taller.', resultadoParcial: formatCurrency(gastosFijosTaller) },
        { paso: 4, descripcion: 'Suma total obligatoria reservada.', operacion: `${formatCurrency(cuotaPrestamoMensual)} + ${formatCurrency(reservaCapexMensual)} + ${formatCurrency(gastosFijosTaller)}`, resultadoParcial: formatCurrency(totalBlindadoMes) }
      ],
      resumenMetricas: [
        { etiqueta: 'Total Blindado', valor: formatCurrency(totalBlindadoMes), tipo: 'destacado' },
        { etiqueta: 'Cuota Préstamo', valor: formatCurrency(cuotaPrestamoMensual), tipo: 'neutro' },
        { etiqueta: 'Reserva Capex', valor: formatCurrency(reservaCapexMensual), tipo: 'neutro' },
        { etiqueta: 'Gastos Fijos', valor: formatCurrency(gastosFijosTaller), tipo: 'neutro' }
      ],
      transaccionesDetalle: [],
      totalTransacciones: 0
    }
  }

  // =========================================================================
  // 10. TALLER: CICLO OPERATIVO
  // =========================================================================
  if (kpiId.startsWith('taller_')) {
    const tallerData = await getTallerData()
    const { metricas, piezas, gruposPorModelo, gruposPorColor } = tallerData

    if (kpiId === 'taller_por_fabricar') {
      const piezasPorFabricar = piezas.filter((p: any) =>
        ['PENDIENTE', 'EN_PRODUCCION', 'EN_TALLER'].includes(p.estado)
      )
      const transacciones: KpiTransactionItem[] = piezasPorFabricar.map((p: any) => ({
        id: p.id,
        fecha: p.diaEntregaPrometida || p.fechaSolicitud || 'Sin fecha',
        concepto: `${p.cantidad}x ${p.nombreModelo} (${p.nombreColor || 'Color'})`,
        cliente: p.cliente || 'Cliente',
        categoriaOEstado: p.estado
      }))

      return {
        kpiId,
        titulo: 'Piezas Por Fabricar',
        subtitulo: 'Carga de trabajo física en cola activa de impresión del taller',
        valorFormateado: `${metricas.totalPiezasPendientes + metricas.totalPiezasEnProduccion + metricas.totalPiezasEnTaller} piezas`,
        rangoFechas: { from: null, to: null, descripcion: 'Cola de Producción Activa en Taller' },
        formulaMatematica: 'Por Fabricar = ∑ Cantidad de piezas en estado PENDIENTE + EN_PRODUCCION + EN_TALLER',
        explicacionConceptual:
          'Es el volumen real de piezas 3D que deben salir de las impresoras en las próximas horas o días para satisfacer los pedidos activos.',
        pasosCalculo: [
          { paso: 1, descripcion: 'Piezas esperando inicio de impresión (PENDIENTE).', resultadoParcial: `${metricas.totalPiezasPendientes} piezas` },
          { paso: 2, descripcion: 'Piezas actualmente en cama de impresión (EN_PRODUCCION).', resultadoParcial: `${metricas.totalPiezasEnProduccion} piezas` },
          { paso: 3, descripcion: 'Piezas en proceso de post-procesado en taller (EN_TALLER).', resultadoParcial: `${metricas.totalPiezasEnTaller} piezas` },
          { paso: 4, descripcion: 'Filamento total estimado necesario para completarlas.', resultadoParcial: `${metricas.totalGramosRequeridos} g` }
        ],
        resumenMetricas: [
          { etiqueta: 'Total Por Fabricar', valor: `${metricas.totalPiezasPendientes + metricas.totalPiezasEnProduccion + metricas.totalPiezasEnTaller} piezas`, tipo: 'destacado' },
          { etiqueta: 'Filamento Necesario', valor: `${metricas.totalGramosRequeridos} g`, tipo: 'neutro' },
          { etiqueta: 'Entregas Urgentes (≤48h)', valor: `${metricas.entregasUrgentes}`, tipo: metricas.entregasUrgentes > 0 ? 'negativo' : 'positivo' }
        ],
        transaccionesDetalle: transacciones,
        totalTransacciones: transacciones.length
      }
    }

    if (kpiId === 'taller_modelos_distintos') {
      const transacciones: KpiTransactionItem[] = gruposPorModelo.map((g: any) => ({
        id: g.productoId || g.nombreModelo,
        fecha: 'En cola',
        concepto: g.nombreModelo,
        cliente: `${g.pedidos?.length || 0} pedidos`,
        categoriaOEstado: `${g.totalUnidades} uds (${g.totalGramosEstimados}g)`
      }))

      return {
        kpiId,
        titulo: 'Modelos Distintos en Cola',
        subtitulo: 'Diseños 3D únicos que requieren preparar código G-code y archivos de impresión',
        valorFormateado: `${metricas.totalModelosUnicos} modelos`,
        rangoFechas: { from: null, to: null, descripcion: 'Cola de Producción Activa' },
        formulaMatematica: 'Modelos Distintos = Conteo de modelos 3D únicos en los pedidos en cola',
        explicacionConceptual:
          'Mide la diversidad de producción. Menos modelos con muchas unidades favorece la producción en serie (mismo gcode), mientras que más modelos distintos exige más cambios de placa y archivo.',
        pasosCalculo: [
          { paso: 1, descripcion: 'Revisar todos los ítems de pedidos en producción.', resultadoParcial: `${piezas.length} ítems en taller` },
          { paso: 2, descripcion: 'Agrupar por nombre de modelo 3D único.', resultadoParcial: `${metricas.totalModelosUnicos} modelos diferentes` }
        ],
        resumenMetricas: [
          { etiqueta: 'Modelos Únicos', valor: `${metricas.totalModelosUnicos}`, tipo: 'destacado' },
          { etiqueta: 'Total Piezas a Fabricar', valor: `${metricas.totalPiezasActivas}`, tipo: 'neutro' }
        ],
        transaccionesDetalle: transacciones,
        totalTransacciones: transacciones.length
      }
    }

    if (kpiId === 'taller_colores_asignados') {
      const transacciones: KpiTransactionItem[] = gruposPorColor.map((c: any) => ({
        id: c.colorId || c.nombreColor,
        fecha: 'En stock',
        concepto: c.nombreColor,
        cliente: `Stock: ${c.stockGramosActual}g`,
        categoriaOEstado: `Req: ${c.totalGramosRequeridos}g ${c.deficitGramos > 0 ? `(Déficit ${c.deficitGramos}g)` : '✓ OK'}`
      }))

      return {
        kpiId,
        titulo: 'Colores Asignados',
        subtitulo: 'Filamentos y tonos requeridos para completar los pedidos en cola',
        valorFormateado: `${metricas.totalColoresRequeridos} colores`,
        rangoFechas: { from: null, to: null, descripcion: 'Inventario de Taller Activo' },
        formulaMatematica: 'Colores = Agrupación única de tonalidades y materiales de filamento demandados',
        explicacionConceptual:
          'Supervisa los filamentos necesarios para las impresiones activas, permitiendo validar si hay stock suficiente o bobinas en alerta crítica.',
        pasosCalculo: [
          { paso: 1, descripcion: 'Identificar el color asignado a cada pieza.', resultadoParcial: `${gruposPorColor.length} colores demandados` },
          { paso: 2, descripcion: 'Sumar el gramaje total requerido.', resultadoParcial: `${metricas.totalGramosRequeridos} gramos` }
        ],
        resumenMetricas: [
          { etiqueta: 'Colores Requeridos', valor: `${metricas.totalColoresRequeridos}`, tipo: 'destacado' },
          { etiqueta: 'Filamento Total', valor: `${metricas.totalGramosRequeridos} g`, tipo: 'neutro' }
        ],
        transaccionesDetalle: transacciones,
        totalTransacciones: transacciones.length
      }
    }

    if (kpiId === 'taller_listas_despacho') {
      const listas = piezas.filter((p: any) =>
        ['LISTO_ENTREGA', 'EMPAQUETANDO'].includes(p.estado)
      )
      const transacciones: KpiTransactionItem[] = listas.map((p: any) => ({
        id: p.id,
        fecha: p.diaEntregaPrometida || p.fechaSolicitud || 'Listo',
        concepto: `${p.cantidad}x ${p.nombreModelo} (${p.nombreColor || 'Color'})`,
        cliente: p.cliente || 'Cliente',
        categoriaOEstado: p.estado
      }))

      return {
        kpiId,
        titulo: 'Listas para Despacho',
        subtitulo: 'Piezas impresas y terminadas preparadas para empaque o envío al cliente',
        valorFormateado: `${metricas.totalPiezasListas + metricas.totalPiezasEmpaquetando} listas`,
        rangoFechas: { from: null, to: null, descripcion: 'Taller de Acabado y Empaque' },
        formulaMatematica: 'Listas Despacho = ∑ Piezas en estado LISTO_ENTREGA + EMPAQUETANDO',
        explicacionConceptual:
          'Indica la productividad completada que ya no consume tiempo de máquina y solo está a la espera de entrega.',
        pasosCalculo: [
          { paso: 1, descripcion: 'Piezas en proceso de empaque.', resultadoParcial: `${metricas.totalPiezasEmpaquetando} piezas` },
          { paso: 2, descripcion: 'Piezas con empaque finalizado listas para retiro.', resultadoParcial: `${metricas.totalPiezasListas} piezas` }
        ],
        resumenMetricas: [
          { etiqueta: 'Total Listas', valor: `${metricas.totalPiezasListas + metricas.totalPiezasEmpaquetando}`, tipo: 'destacado' },
          { etiqueta: 'Por Empaquetar', valor: `${metricas.totalPiezasEmpaquetando}`, tipo: 'neutro' },
          { etiqueta: 'Listas para Entrega', valor: `${metricas.totalPiezasListas}`, tipo: 'positivo' }
        ],
        transaccionesDetalle: transacciones,
        totalTransacciones: transacciones.length
      }
    }
  }

  // Fallback genérico para cualquier otro KPI
  return {
    kpiId,
    titulo: 'Métrica Operativa',
    subtitulo: 'Indicador de gestión',
    valorFormateado: 'S/ 0.00',
    rangoFechas: { from: from || null, to: to || null, descripcion: rangoDescripcion },
    formulaMatematica: 'Fórmula estándar de gestión',
    explicacionConceptual: 'Cálculo auditado según registros de la base de datos.',
    pasosCalculo: [
      { paso: 1, descripcion: 'Lectura de registros del negocio.', resultadoParcial: 'OK' }
    ],
    resumenMetricas: [],
    transaccionesDetalle: [],
    totalTransacciones: 0
  }
}
