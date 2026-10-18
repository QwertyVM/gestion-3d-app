'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

function safeRevalidate() {
  try {
    revalidatePath('/pedidos')
    revalidatePath('/packaging')
    revalidatePath('/catalogo/packaging')
    revalidatePath('/ventas')
    revalidatePath('/finanzas')
    revalidatePath('/catalogo/inventario')
    revalidatePath('/finanzas/flujo-caja')
    revalidatePath('/')
  } catch (e) {
    // Ignore outside request context
  }
}

export interface LoteCajaItem {
  id: string
  codigo: string
  concepto: string
  subcategoria: string | null
  fecha: string
  cantidadComprada: number
  costoUnitario: number
  costoTotal: number
  cajasAsignadasCount: number
  stockDisponible: number
  negocio: string
  persona: string
  asignaciones: {
    asignacionId: string
    pedidoId: string
    codigoPedido: string
    cliente: string
    cantidad: number
    costoTotal: number
    fechaPedido: string
    estadoPedido?: string
  }[]
}

export interface StockCajasResumen {
  negocio: TipoNegocio
  totalCajasCompradas: number
  totalCajasAsignadas: number
  totalStockDisponible: number
  valorTotalStockDisponible: number
  costoUnitarioPromedio: number
  loteReciente50: LoteCajaItem | null
  lotes: LoteCajaItem[]
}

export interface AsignarCajasInput {
  pedidoId: string
  cajas: {
    inversionId?: string | null
    nombreCaja?: string
    cantidad: number
    costoUnitario?: number
  }[]
}

export interface RentabilidadPedidoCalculada {
  pedidoId: string
  codigo: string
  cliente: string
  totalVenta: number
  montoPagado: number
  saldoPendiente: number
  costoFabricacion: number
  costoCajas: number
  costoEnvio: number
  costosTotales: number
  utilidadNeta: number
  margenNetoPct: number
  totalCajasCount: number
  cajasDetalle: {
    id: string
    nombreCaja: string
    cantidad: number
    costoUnitario: number
    costoTotal: number
    inversionId?: string | null
  }[]
}

/**
 * Obtiene el resumen consolidado del stock de cajas basado en los egresos registrados
 * y las asignaciones reales a pedidos.
 */
export async function getStockCajas(negocioOverride?: TipoNegocio): Promise<StockCajasResumen> {
  const targetNegocio = negocioOverride || await getActiveNegocioServer()

  // 1. Obtener todas las inversiones/egresos que corresponden a Cajas
  const inversionesCajas = await prisma.inversion.findMany({
    where: {
      negocio: targetNegocio,
      OR: [
        { subcategoria: { equals: 'Cajas', mode: 'insensitive' } },
        { itemConcepto: { contains: 'caja', mode: 'insensitive' } },
        { presentacion: { contains: 'caja', mode: 'insensitive' } }
      ]
    },
    include: {
      cajasAsignadas: {
        include: {
          pedido: {
            select: {
              id: true,
              codigo: true,
              cliente: true,
              fecha: true,
              estado: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  let totalCajasCompradas = 0
  let totalCajasAsignadas = 0
  let valorTotalStockDisponible = 0

  const lotes: LoteCajaItem[] = inversionesCajas.map((inv) => {
    const cantidadComprada = Number(inv.cantidad || 0)
    const costoUnitario = Number(inv.costoUnitario || 0)
    const costoTotal = Number(inv.costoTotal || (cantidadComprada * costoUnitario))

    const asignaciones = (inv.cajasAsignadas || []).map(asig => ({
      asignacionId: asig.id,
      pedidoId: asig.pedidoId,
      codigoPedido: asig.pedido?.codigo || 'PED-???',
      cliente: asig.pedido?.cliente || 'Cliente',
      cantidad: Number(asig.cantidad || 1),
      costoTotal: Number(asig.costoTotal || 0),
      fechaPedido: asig.pedido?.fecha instanceof Date 
        ? asig.pedido.fecha.toISOString() 
        : String(asig.pedido?.fecha || ''),
      estadoPedido: asig.pedido?.estado || 'ENTREGADO'
    }))

    const cajasAsignadasCount = asignaciones.reduce((sum, a) => sum + a.cantidad, 0)
    const stockDisponible = Math.max(0, cantidadComprada - cajasAsignadasCount)

    totalCajasCompradas += cantidadComprada
    totalCajasAsignadas += cajasAsignadasCount
    valorTotalStockDisponible += stockDisponible * costoUnitario

    const codigo = `LOT-${inv.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`

    return {
      id: inv.id,
      codigo,
      concepto: inv.itemConcepto,
      subcategoria: inv.subcategoria,
      fecha: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt),
      cantidadComprada,
      costoUnitario,
      costoTotal,
      cajasAsignadasCount,
      stockDisponible,
      negocio: inv.negocio,
      persona: inv.persona,
      asignaciones
    }
  })

  const totalStockDisponible = Math.max(0, totalCajasCompradas - totalCajasAsignadas)
  const costoUnitarioPromedio = totalStockDisponible > 0
    ? Number((valorTotalStockDisponible / totalStockDisponible).toFixed(2))
    : (lotes.length > 0 ? lotes[0].costoUnitario : 2.40)

  // Encontrar el lote reciente de 50 cajas
  const loteReciente50 = lotes.find(l => l.cantidadComprada === 50) || lotes[0] || null

  return {
    negocio: targetNegocio,
    totalCajasCompradas,
    totalCajasAsignadas,
    totalStockDisponible,
    valorTotalStockDisponible: Number(valorTotalStockDisponible.toFixed(2)),
    costoUnitarioPromedio,
    loteReciente50,
    lotes
  }
}

/**
 * Asigna cajas a un pedido (crea o actualiza las asignaciones).
 * Funciona tanto para pedidos cerrados (ENTREGADO) como pedidos en curso.
 */
export async function asignarCajasAPedido(input: AsignarCajasInput) {
  const { pedidoId, cajas } = input
  if (!pedidoId) {
    return { success: false, error: 'ID de pedido obligatorio' }
  }

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId }
    })
    if (!pedido) {
      return { success: false, error: 'Pedido no encontrado' }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Eliminar asignaciones previas de este pedido
      await tx.asignacionCajaPedido.deleteMany({
        where: { pedidoId }
      })

      // 2. Crear las nuevas asignaciones
      const toCreate = (cajas || [])
        .filter(c => Number(c.cantidad) > 0)
        .map(c => {
          const qty = Math.max(1, Math.round(Number(c.cantidad) || 1))
          const unit = Number(c.costoUnitario != null ? c.costoUnitario : 2.40)
          const total = Number((qty * unit).toFixed(2))
          return {
            pedidoId,
            inversionId: c.inversionId || null,
            nombreCaja: c.nombreCaja?.trim() || 'Caja de Envío',
            cantidad: qty,
            costoUnitario: unit,
            costoTotal: total
          }
        })

      if (toCreate.length > 0) {
        await tx.asignacionCajaPedido.createMany({
          data: toCreate
        })
      }

      // 3. Obtener el pedido completo actualizado
      return await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: {
          items: {
            include: { producto: true, colorFilamento: true }
          },
          pagos: { orderBy: { fecha: 'asc' } },
          cajas: { include: { inversion: true } }
        }
      })
    })

    safeRevalidate()
    return { success: true, pedido: resultado }
  } catch (error: any) {
    console.error('Error al asignar cajas al pedido:', error)
    return { success: false, error: error.message || 'Error al asignar cajas' }
  }
}

/**
 * Asignación rápida de 1 caja estándar (por defecto del lote de 50 uds o lote activo) a un pedido.
 */
export async function asignarCajaRapida(pedidoId: string, inversionId?: string, cantidad: number = 1) {
  try {
    const targetNegocio = await getActiveNegocioServer()
    let selectedInvId = inversionId
    let unitCost = 2.40
    let boxName = 'Caja de Envío'

    if (!selectedInvId) {
      // Buscar el lote de 50 unidades o el más reciente con stock
      const stockResumen = await getStockCajas(targetNegocio)
      const loteConStock = stockResumen.lotes.find(l => l.stockDisponible >= cantidad) || stockResumen.loteReciente50 || stockResumen.lotes[0]
      if (loteConStock) {
        selectedInvId = loteConStock.id
        unitCost = loteConStock.costoUnitario
        boxName = loteConStock.concepto
      }
    } else {
      const inv = await prisma.inversion.findUnique({ where: { id: selectedInvId } })
      if (inv) {
        unitCost = Number(inv.costoUnitario)
        boxName = inv.itemConcepto
      }
    }

    return await asignarCajasAPedido({
      pedidoId,
      cajas: [{
        inversionId: selectedInvId,
        nombreCaja: boxName,
        cantidad,
        costoUnitario: unitCost
      }]
    })
  } catch (error: any) {
    console.error('Error en asignarCajaRapida:', error)
    return { success: false, error: error.message || 'Error al asignar caja rápida' }
  }
}

/**
 * Elimina todas las cajas asignadas a un pedido.
 */
export async function quitarCajasDePedido(pedidoId: string) {
  try {
    await prisma.asignacionCajaPedido.deleteMany({
      where: { pedidoId }
    })

    const pedidoActualizado = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        items: {
          include: {
            producto: true,
            colorFilamento: true
          }
        },
        pagos: { orderBy: { fecha: 'asc' } },
        cajas: { include: { inversion: true } }
      }
    })

    safeRevalidate()
    return { success: true, pedido: pedidoActualizado }
  } catch (error: any) {
    console.error('Error al quitar cajas del pedido:', error)
    return { success: false, error: error.message || 'Error al quitar cajas' }
  }
}

/**
 * Calcula en el backend la rentabilidad neta real de un pedido, considerando:
 * - Total de venta cobrado / a cobrar
 * - Costo base de fabricación (filamentos y costos directos de producto)
 * - Costo de cajas y packaging asignado
 * - Costo de envío
 */
export async function getRentabilidadPedido(pedidoId: string): Promise<RentabilidadPedidoCalculada | null> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      items: {
        include: { producto: true }
      },
      cajas: true
    }
  })

  if (!pedido) return null

  const totalVenta = Number(pedido.total || 0)
  const montoPagado = Number(pedido.montoPagado || 0)
  const saldoPendiente = Number(pedido.saldoPendiente || 0)
  const costoEnvio = Number(pedido.costoEnvio || 0)

  // Costo base de fabricación
  const costoFabricacion = (pedido.items || []).reduce((sum, it) => {
    const cBase = it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0
      ? Number(it.costoBaseSnapshot)
      : (it.producto ? Number(it.producto.costoBase) : 0)
    return sum + (cBase * Number(it.cantidad || 1))
  }, 0)

  // Costo de cajas asignadas
  const cajasDetalle = (pedido.cajas || []).map(c => ({
    id: c.id,
    nombreCaja: c.nombreCaja,
    cantidad: Number(c.cantidad || 1),
    costoUnitario: Number(c.costoUnitario || 0),
    costoTotal: Number(c.costoTotal || 0),
    inversionId: c.inversionId
  }))

  const costoCajas = cajasDetalle.reduce((sum, c) => sum + c.costoTotal, 0)
  const totalCajasCount = cajasDetalle.reduce((sum, c) => sum + c.cantidad, 0)

  const costosTotales = Number((costoFabricacion + costoCajas + costoEnvio).toFixed(2))
  const utilidadNeta = Number((totalVenta - costosTotales).toFixed(2))
  const margenNetoPct = totalVenta > 0
    ? Number(((utilidadNeta / totalVenta) * 100).toFixed(1))
    : 0

  return {
    pedidoId: pedido.id,
    codigo: pedido.codigo,
    cliente: pedido.cliente,
    totalVenta,
    montoPagado,
    saldoPendiente,
    costoFabricacion: Number(costoFabricacion.toFixed(2)),
    costoCajas: Number(costoCajas.toFixed(2)),
    costoEnvio,
    costosTotales,
    utilidadNeta,
    margenNetoPct,
    totalCajasCount,
    cajasDetalle
  }
}

export interface RegistrarCompraCajasInput {
  itemConcepto: string
  cantidad: number
  costoUnitario: number
  costoEnvio?: number
  persona?: string
  fecha?: string
  negocioOverride?: TipoNegocio
}

/**
 * Registra una nueva compra/inversión de cajas de packaging.
 * Se almacena en la tabla Inversion vinculada a la subcategoría 'Cajas',
 * integrándose automáticamente en el flujo financiero y aumentando el stock de cajas.
 */
export async function registrarCompraCajas(input: RegistrarCompraCajasInput) {
  try {
    const targetNegocio = input.negocioOverride || await getActiveNegocioServer()
    const cant = Number(input.cantidad) || 1
    const unitario = Number(input.costoUnitario) || 0
    const envio = Number(input.costoEnvio) || 0
    const total = (cant * unitario) + envio

    const fechaCreacion = input.fecha ? new Date(input.fecha) : new Date()

    const nuevaInversion = await prisma.inversion.create({
      data: {
        itemConcepto: input.itemConcepto.trim() || 'Cajas de Packaging',
        categoria: 'INSUMO',
        subcategoria: 'Cajas',
        cantidad: cant,
        costoUnitario: unitario,
        costoEnvio: envio,
        costoTotal: total,
        persona: input.persona || 'Víctor',
        negocio: targetNegocio,
        createdAt: fechaCreacion
      }
    })

    safeRevalidate()
    return { success: true, inversion: nuevaInversion }
  } catch (error: any) {
    console.error('Error al registrar compra de cajas:', error)
    return { success: false, error: error.message || 'Error al registrar compra de cajas' }
  }
}
