'use server'

import prisma from '@/lib/prisma'
import { EstadoPedido, TipoPrecio } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { ajustarStockBobina } from '@/actions/inventario'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

import { revalidateDomain } from '@/core/cache/revalidation-bus'
import { OrderMapper } from '@/contracts/mappers/order.mapper'
import { PedidoView } from '@/contracts/orders.dto'

function safeRevalidate() {
  revalidateDomain('orders')
}

export interface ItemPedidoInput {
  id?: string
  productoId: string
  varianteId?: string | null
  nombreProductoSnapshot?: string | null
  costoBaseSnapshot?: number | null
  colorFilamentoId?: string | null
  coloresIds?: string[]
  personalizacion?: string | null
  cantidad: number
  tipoPrecio: TipoPrecio
  precioUnitario: number
  costoPackaging?: number
  porcentajeAdicional?: number
  gramosConsumidos?: number
}

export interface CreatePedidoInput {
  negocio?: TipoNegocio
  cliente: string
  dni?: string | null
  telefono?: string | null
  canalVenta?: string | null
  handleSocial?: string | null
  destinoEnvio?: string | null
  diaEntregaPrometida?: string | null
  notas?: string | null
  costoEnvio?: number
  items: ItemPedidoInput[]
  cajas?: {
    inversionId?: string | null
    nombreCaja?: string
    cantidad: number
    costoUnitario?: number
  }[]
  montoPagado?: number
  metodoPago?: string
  notasPago?: string
  fecha?: string | Date
  descontarStock?: boolean
}

function serializePedido(p: any, filamentosMap?: Map<string, any>): PedidoView {
  return OrderMapper.toDTO(p, filamentosMap)
}

export async function getPedidos(negocio?: TipoNegocio): Promise<PedidoView[]> {
  try {
    const targetNegocio = negocio || await getActiveNegocioServer()

    const [pedidos, allFilamentos] = await Promise.all([
      prisma.pedido.findMany({
        where: { negocio: targetNegocio },
        include: {
          items: {
            include: {
              producto: true,
              colorFilamento: true
            }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          },
          cajas: {
            include: { inversion: true }
          }
        },
        orderBy: [
          { fecha: 'desc' },
          { codigo: 'desc' }
        ]
      }),
      prisma.inventarioFilamento.findMany()
    ])

    const filMap = new Map(allFilamentos.map(f => [f.id, f]))
    return pedidos.map(p => serializePedido(p, filMap))
  } catch (error) {
    console.error('Error fetching pedidos:', error)
    return []
  }
}

export async function getPedidoById(id: string) {
  try {
    const [pedido, allFilamentos] = await Promise.all([
      prisma.pedido.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              producto: true,
              colorFilamento: true
            }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          },
          cajas: {
            include: { inversion: true }
          }
        }
      }),
      prisma.inventarioFilamento.findMany()
    ])

    if (!pedido) return null
    const filMap = new Map(allFilamentos.map(f => [f.id, f]))
    return serializePedido(pedido, filMap)
  } catch (error) {
    console.error(`Error fetching pedido ${id}:`, error)
    return null
  }
}

async function generateNextCodigoPedido(negocio: TipoNegocio = '3D'): Promise<string> {
  const prefix = negocio === 'BG' ? 'BG' : 'PED'
  const count = await prisma.pedido.count({
    where: { negocio }
  })
  const nextNum = count + 1
  return `${prefix}-${String(nextNum).padStart(3, '0')}`
}

function parseDateInput(fecha?: string | Date) {
  if (!fecha) return new Date()
  if (fecha instanceof Date) return fecha
  if (typeof fecha === 'string') {
    if (fecha.includes('T')) return new Date(fecha)
    const [year, month, day] = fecha.split('-').map(Number)
    if (year && month && day) {
      return new Date(year, month - 1, day, 12, 0, 0)
    }
    return new Date(fecha)
  }
  return new Date(fecha)
}

export async function createPedido(data: CreatePedidoInput) {
  try {
    const targetNegocio = data.negocio || await getActiveNegocioServer()

    if (!data.cliente || !data.cliente.trim()) {
      return { success: false, error: 'El nombre del cliente es obligatorio' }
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return { success: false, error: 'Debes agregar al menos 1 producto al pedido' }
    }

    // 1. Fetch product snapshots to ensure accurate pricing and costs
    const targetProductIds = data.items.map(i => i.varianteId || i.productoId)
    const productosDb = await prisma.producto.findMany({
      where: { id: { in: targetProductIds } }
    })
    const prodMap = new Map(productosDb.map(p => [p.id, p]))

    // 2. Compute item subtotals
    let subtotalCalculado = 0
    const processedItems: any[] = []
    data.items.forEach(item => {
      const resolvedId = item.varianteId || item.productoId
      const prod = prodMap.get(resolvedId)
      const qty = Math.max(1, Number(item.cantidad) || 1)
      const unitPrice = Number(item.precioUnitario) || 0
      const packCost = Number(item.costoPackaging) || 0
      const itemSubtotal = Number(((unitPrice + packCost) * qty).toFixed(2))
      subtotalCalculado += itemSubtotal

      const rawColores = Array.isArray(item.coloresIds) && item.coloresIds.length > 0
        ? item.coloresIds
        : (item.colorFilamentoId ? [item.colorFilamentoId] : [])

      const is3D = targetNegocio === '3D' && (!prod || prod.negocio === '3D')
      const singleItemSubtotal = Number((unitPrice + packCost).toFixed(2))
      const singleGramos = qty > 0 ? Number(((Number(item.gramosConsumidos) || 0) / qty).toFixed(1)) : 0

      if (is3D && qty > 1) {
        // En 3D desglosamos cada unidad individual para permitir seguimiento y avance por separado en taller
        for (let q = 0; q < qty; q++) {
          processedItems.push({
            productoId: resolvedId,
            nombreProductoSnapshot: prod?.nombreModelo || 'Modelo 3D',
            costoBaseSnapshot: (item.costoBaseSnapshot != null && Number(item.costoBaseSnapshot) > 0)
              ? Number(item.costoBaseSnapshot)
              : (prod ? Number(prod.costoBase) : 0),
            colorFilamentoId: rawColores[0] || item.colorFilamentoId || null,
            coloresIds: rawColores,
            personalizacion: item.personalizacion?.trim() || null,
            cantidad: 1,
            tipoPrecio: item.tipoPrecio || 'MENOR',
            precioUnitario: unitPrice,
            costoPackaging: packCost,
            porcentajeAdicional: Number(item.porcentajeAdicional) || 0,
            gramosConsumidos: singleGramos,
            subtotal: singleItemSubtotal
          })
        }
      } else {
        processedItems.push({
          productoId: resolvedId,
          nombreProductoSnapshot: prod?.nombreModelo || (targetNegocio === 'BG' ? 'Juego de Mesa' : 'Modelo 3D'),
          costoBaseSnapshot: (item.costoBaseSnapshot != null && Number(item.costoBaseSnapshot) > 0)
            ? Number(item.costoBaseSnapshot)
            : (prod ? Number(prod.costoBase) : 0),
          colorFilamentoId: rawColores[0] || item.colorFilamentoId || null,
          coloresIds: rawColores,
          personalizacion: item.personalizacion?.trim() || null,
          cantidad: qty,
          tipoPrecio: item.tipoPrecio || 'MENOR',
          precioUnitario: unitPrice,
          costoPackaging: packCost,
          porcentajeAdicional: Number(item.porcentajeAdicional) || 0,
          gramosConsumidos: Number(item.gramosConsumidos) || 0,
          subtotal: itemSubtotal
        })
      }
    })

    const costoEnvioNum = Number(data.costoEnvio) || 0
    const totalCalculado = Number((subtotalCalculado + costoEnvioNum).toFixed(2))
    const montoPagadoNum = Math.min(totalCalculado, Math.max(0, Number(data.montoPagado) || 0))
    const saldoPendienteNum = Number(Math.max(0, totalCalculado - montoPagadoNum).toFixed(2))

    const codigoGenerado = await generateNextCodigoPedido(targetNegocio)
    const fechaPedido = parseDateInput(data.fecha)

    // 3. Database Transaction
    const nuevoPedido = await prisma.$transaction(async (tx) => {
      const p = await tx.pedido.create({
        data: {
          negocio: targetNegocio,
          codigo: codigoGenerado,
          fecha: fechaPedido,
          cliente: data.cliente.trim(),
          dni: data.dni?.trim() || null,
          telefono: data.telefono?.trim() || null,
          canalVenta: data.canalVenta || 'WhatsApp',
          handleSocial: data.handleSocial?.trim() || null,
          destinoEnvio: data.destinoEnvio?.trim() || null,
          diaEntregaPrometida: data.diaEntregaPrometida?.trim() || null,
          notas: data.notas?.trim() || null,
          metodoPago: data.metodoPago || 'YAPE',
          estado: 'PENDIENTE',
          seguimientoPostventa: false,
          costoEnvio: costoEnvioNum,
          subtotal: subtotalCalculado,
          total: totalCalculado,
          montoPagado: montoPagadoNum,
          saldoPendiente: saldoPendienteNum,
          items: {
            create: processedItems
          }
        }
      })

      // Auto-sincronizar o registrar en Directorio de Clientes
      try {
        const clienteClean = data.cliente.trim()
        const existingCliente = await tx.cliente.findFirst({
          where: {
            nombre: { equals: clienteClean, mode: 'insensitive' },
            negocio: targetNegocio
          }
        })

        if (existingCliente) {
          const updateData: any = {}
          if (!existingCliente.handleSocial && data.handleSocial?.trim()) {
            updateData.handleSocial = data.handleSocial.trim()
          }
          if (!existingCliente.telefono && data.telefono?.trim()) {
            updateData.telefono = data.telefono.trim()
          }
          if (!existingCliente.dni && data.dni?.trim()) {
            updateData.dni = data.dni.trim()
          }
          if (!existingCliente.direccion && data.destinoEnvio?.trim()) {
            updateData.direccion = data.destinoEnvio.trim()
          }
          if (Object.keys(updateData).length > 0) {
            await tx.cliente.update({
              where: { id: existingCliente.id },
              data: updateData
            })
          }
        } else {
          await tx.cliente.create({
            data: {
              negocio: targetNegocio,
              nombre: clienteClean,
              dni: data.dni?.trim() || null,
              telefono: data.telefono?.trim() || null,
              canalOrigen: data.canalVenta || 'WhatsApp',
              handleSocial: data.handleSocial?.trim() || null,
              direccion: data.destinoEnvio?.trim() || null,
              activo: true
            }
          })
        }
      } catch (errCliente) {
        console.warn('No se pudo auto-sincronizar cliente:', errCliente)
      }

      // If initial payment was made, register initial PagoPedido
      if (montoPagadoNum > 0) {
        const tipoPago = montoPagadoNum >= totalCalculado ? 'PAGO_TOTAL' : 'ANTICIPO'
        await tx.pagoPedido.create({
          data: {
            pedidoId: p.id,
            fecha: fechaPedido,
            monto: montoPagadoNum,
            metodoPago: data.metodoPago || 'YAPE',
            tipo: tipoPago,
            notas: data.notasPago?.trim() || `Pago inicial registrado con el pedido`
          }
        })
      }

      // If boxes are assigned, register AsignacionCajaPedido
      if (Array.isArray(data.cajas) && data.cajas.length > 0) {
        const toCreateCajas = data.cajas
          .filter(c => Number(c.cantidad) > 0)
          .map(c => {
            const q = Math.max(1, Math.round(Number(c.cantidad) || 1))
            const u = Number(c.costoUnitario != null ? c.costoUnitario : 2.40)
            return {
              pedidoId: p.id,
              inversionId: c.inversionId || null,
              nombreCaja: c.nombreCaja?.trim() || 'Caja de Envío',
              cantidad: q,
              costoUnitario: u,
              costoTotal: Number((q * u).toFixed(2))
            }
          })
        if (toCreateCajas.length > 0) {
          await tx.asignacionCajaPedido.createMany({ data: toCreateCajas })
        }
      }

      const fullPedido = await tx.pedido.findUnique({
        where: { id: p.id },
        include: {
          items: {
            include: { producto: true, colorFilamento: true }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          },
          cajas: {
            include: { inversion: true }
          }
        }
      })

      return fullPedido || p
    })

    // 4. Stock deduction if requested (split evenly across all selected colors)
    if (data.descontarStock) {
      for (const item of processedItems) {
        if (item.coloresIds && item.coloresIds.length > 0 && item.gramosConsumidos > 0) {
          const splitGramos = Number((item.gramosConsumidos / item.coloresIds.length).toFixed(1))
          for (const cId of item.coloresIds) {
            try {
              await ajustarStockBobina(cId, splitGramos)
            } catch (stkErr) {
              console.warn(`No se pudo descontar stock de la bobina ${cId}:`, stkErr)
            }
          }
        } else if (item.colorFilamentoId && item.gramosConsumidos > 0) {
          try {
            await ajustarStockBobina(item.colorFilamentoId, item.gramosConsumidos)
          } catch (stkErr) {
            console.warn(`No se pudo descontar stock de la bobina ${item.colorFilamentoId}:`, stkErr)
          }
        }
      }
    }

    const allFilamentos = await prisma.inventarioFilamento.findMany()
    const filMap = new Map(allFilamentos.map(f => [f.id, f]))

    safeRevalidate()
    return { success: true, pedido: serializePedido(nuevoPedido, filMap) }
  } catch (error: any) {
    console.error('Error creating pedido:', error)
    return { success: false, error: error.message || 'Error al registrar pedido' }
  }
}

export async function updateEstadoPedido(id: string, nuevoEstado: EstadoPedido) {
  try {
    const pedido = await prisma.$transaction(async (tx) => {
      const pedidoActual = await tx.pedido.findUnique({
        where: { id },
        include: { items: true, pagos: true }
      })

      if (!pedidoActual) {
        throw new Error('Pedido no encontrado')
      }

      // Si cambia a PAGO_VALIDADO y antes no lo estaba
      if (nuevoEstado === 'PAGO_VALIDADO' && pedidoActual.estado !== 'PAGO_VALIDADO') {
        // Disminuir stock de los productos asociados
        for (const it of pedidoActual.items) {
          if (it.productoId) {
            await tx.producto.update({
              where: { id: it.productoId },
              data: {
                stock: {
                  decrement: it.cantidad
                }
              }
            })
          }
        }

        // Si aún tiene saldo pendiente, marcar como pagado registrando el abono
        const saldo = Number(pedidoActual.saldoPendiente)
        if (saldo > 0) {
          await tx.pagoPedido.create({
            data: {
              pedidoId: id,
              monto: saldo,
              metodoPago: pedidoActual.metodoPago || 'TRANSFERENCIA',
              tipo: 'LIQUIDACION',
              notas: 'Pago validado manualmente desde pedidos'
            }
          })

          await tx.pedido.update({
            where: { id },
            data: {
              montoPagado: Number(pedidoActual.total),
              saldoPendiente: 0
            }
          })
        }
      }

      // Si se cancela un pedido que ya tenía PAGO_VALIDADO, restaurar stock
      if (pedidoActual.estado === 'PAGO_VALIDADO' && nuevoEstado === 'CANCELADO') {
        for (const it of pedidoActual.items) {
          if (it.productoId) {
            await tx.producto.update({
              where: { id: it.productoId },
              data: {
                stock: {
                  increment: it.cantidad
                }
              }
            })
          }
        }
      }

      await tx.itemPedido.updateMany({
        where: { pedidoId: id },
        data: { estado: nuevoEstado }
      })

      // SLA Automatizado de Postventa: al marcar ENTREGADO, programar automáticamente seguimiento a +3 días
      const postventaAuto = nuevoEstado === 'ENTREGADO' ? {
        seguimientoPostventa: true,
        fechaPostventa: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      } : {}

      const p = await tx.pedido.update({
        where: { id },
        data: { 
          estado: nuevoEstado,
          ...postventaAuto
        },
        include: {
          items: {
            include: { producto: true, colorFilamento: true }
          },
          pagos: true
        }
      })
      return p
    })

    const allFilamentos = await prisma.inventarioFilamento.findMany()
    const filMap = new Map(allFilamentos.map(f => [f.id, f]))

    safeRevalidate()
    return { success: true, pedido: serializePedido(pedido, filMap) }
  } catch (error: any) {
    console.error('Error updating estado pedido:', error)
    return { success: false, error: error.message || 'Error al actualizar estado del pedido' }
  }
}

export const actualizarEstadoPedido = updateEstadoPedido

export async function addPagoPedido(pedidoId: string, data: {
  monto: number
  metodoPago?: string
  tipo?: string
  notas?: string
  fecha?: string | Date
}) {
  try {
    const montoNum = Number(data.monto)
    if (!montoNum || montoNum <= 0) {
      return { success: false, error: 'El monto a abonar debe ser mayor a 0' }
    }

    const pedidoActual = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { pagos: true }
    })

    if (!pedidoActual) {
      return { success: false, error: 'Pedido no encontrado' }
    }

    const fechaPago = parseDateInput(data.fecha)

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Create payment record
      await tx.pagoPedido.create({
        data: {
          pedidoId,
          fecha: fechaPago,
          monto: montoNum,
          metodoPago: data.metodoPago || 'YAPE',
          tipo: data.tipo || 'ABONO',
          notas: data.notas?.trim() || null
        }
      })

      // 2. Recalculate totals
      const allPagos = await tx.pagoPedido.findMany({
        where: { pedidoId }
      })
      const totalPagado = allPagos.reduce((sum, p) => sum + Number(p.monto), 0)
      const totalPedido = Number(pedidoActual.total)
      const nuevoSaldo = Math.max(0, Number((totalPedido - totalPagado).toFixed(2)))

      const pActualizado = await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          montoPagado: totalPagado,
          saldoPendiente: nuevoSaldo
        },
        include: {
          items: {
            include: { producto: true, colorFilamento: true }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          }
        }
      })

      return pActualizado
    })

    const allFilamentos = await prisma.inventarioFilamento.findMany()
    const filMap = new Map(allFilamentos.map(f => [f.id, f]))

    safeRevalidate()
    return { success: true, pedido: serializePedido(updated, filMap) }
  } catch (error: any) {
    console.error('Error adding pago pedido:', error)
    return { success: false, error: error.message || 'Error al registrar abono' }
  }
}

export async function updatePagoPedido(pagoId: string, data: {
  fecha?: string | Date
  monto?: number
  metodoPago?: string
  tipo?: string
  notas?: string | null
}) {
  try {
    const existingPago = await prisma.pagoPedido.findUnique({
      where: { id: pagoId },
      include: { pedido: true }
    })

    if (!existingPago) {
      return { success: false, error: 'Abono no encontrado' }
    }

    const pedidoId = existingPago.pedidoId
    const fechaPago = data.fecha ? parseDateInput(data.fecha) : existingPago.fecha
    const newMonto = data.monto !== undefined ? Number(data.monto) : Number(existingPago.monto)

    if (newMonto < 0) {
      return { success: false, error: 'El monto no puede ser negativo' }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Actualizar el pago
      await tx.pagoPedido.update({
        where: { id: pagoId },
        data: {
          fecha: fechaPago,
          monto: newMonto,
          metodoPago: data.metodoPago !== undefined ? data.metodoPago : existingPago.metodoPago,
          tipo: data.tipo !== undefined ? data.tipo : existingPago.tipo,
          notas: data.notas !== undefined ? (data.notas?.trim() || null) : existingPago.notas
        }
      })

      // 2. Recalcular total pagado y saldo
      const allPagos = await tx.pagoPedido.findMany({
        where: { pedidoId }
      })
      const totalPagado = allPagos.reduce((sum, p) => sum + Number(p.monto), 0)
      const totalPedido = Number(existingPago.pedido.total)
      const nuevoSaldo = Math.max(0, Number((totalPedido - totalPagado).toFixed(2)))

      const pActualizado = await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          montoPagado: totalPagado,
          saldoPendiente: nuevoSaldo
        },
        include: {
          items: {
            include: { producto: true, colorFilamento: true }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          }
        }
      })

      return pActualizado
    })

    const allFilamentos = await prisma.inventarioFilamento.findMany()
    const filMap = new Map(allFilamentos.map(f => [f.id, f]))

    safeRevalidate()
    return { success: true, pedido: serializePedido(updated, filMap) }
  } catch (error: any) {
    console.error('Error updating pago pedido:', error)
    return { success: false, error: error.message || 'Error al actualizar abono' }
  }
}

export async function deletePagoPedido(pagoId: string) {
  try {
    const existingPago = await prisma.pagoPedido.findUnique({
      where: { id: pagoId },
      include: { pedido: true }
    })

    if (!existingPago) {
      return { success: false, error: 'Abono no encontrado' }
    }

    const pedidoId = existingPago.pedidoId

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Eliminar el pago
      await tx.pagoPedido.delete({
        where: { id: pagoId }
      })

      // 2. Recalcular total pagado y saldo
      const allPagos = await tx.pagoPedido.findMany({
        where: { pedidoId }
      })
      const totalPagado = allPagos.reduce((sum, p) => sum + Number(p.monto), 0)
      const totalPedido = Number(existingPago.pedido.total)
      const nuevoSaldo = Math.max(0, Number((totalPedido - totalPagado).toFixed(2)))

      const pActualizado = await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          montoPagado: totalPagado,
          saldoPendiente: nuevoSaldo
        },
        include: {
          items: {
            include: { producto: true, colorFilamento: true }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          }
        }
      })

      return pActualizado
    })

    const allFilamentos = await prisma.inventarioFilamento.findMany()
    const filMap = new Map(allFilamentos.map(f => [f.id, f]))

    safeRevalidate()
    return { success: true, pedido: serializePedido(updated, filMap) }
  } catch (error: any) {
    console.error('Error deleting pago pedido:', error)
    return { success: false, error: error.message || 'Error al eliminar abono' }
  }
}

export async function deletePedido(id: string) {
  try {
    await prisma.pedido.delete({
      where: { id }
    })

    safeRevalidate()
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting pedido:', error)
    return { success: false, error: error.message || 'Error al eliminar pedido' }
  }
}

export interface UpdatePedidoInput {
  cliente: string
  dni?: string | null
  telefono?: string | null
  canalVenta?: string | null
  handleSocial?: string | null
  destinoEnvio?: string | null
  diaEntregaPrometida?: string | null
  notas?: string | null
  estado?: EstadoPedido
  costoEnvio?: number
  montoPagado?: number
  items: ItemPedidoInput[]
  cajas?: {
    id?: string
    inversionId?: string | null
    nombreCaja?: string
    cantidad: number
    costoUnitario?: number
  }[]
  fecha?: string | Date
  seguimientoPostventa?: boolean
  fechaPostventa?: string | Date | null
  notasPostventa?: string | null
}

export async function updatePedido(id: string, data: UpdatePedidoInput) {
  try {
    if (!data.cliente || !data.cliente.trim()) {
      return { success: false, error: 'El nombre del cliente es obligatorio' }
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return { success: false, error: 'Debes tener al menos 1 producto en el pedido' }
    }

    const current = await prisma.pedido.findUnique({
      where: { id },
      include: { items: true, pagos: true }
    })

    if (!current) {
      return { success: false, error: 'Pedido no encontrado' }
    }

    // 1. Fetch product snapshots
    const targetProductIds = data.items.map(i => i.varianteId || i.productoId)
    const productosDb = await prisma.producto.findMany({
      where: { id: { in: targetProductIds } }
    })
    const prodMap = new Map(productosDb.map(p => [p.id, p]))

    // 2. Compute item subtotals
    let subtotalCalculado = 0
    const processedItems: any[] = []
    data.items.forEach(item => {
      const resolvedId = item.varianteId || item.productoId
      const prod = prodMap.get(resolvedId)
      const qty = Math.max(1, Number(item.cantidad) || 1)
      const unitPrice = Number(item.precioUnitario) || 0
      const packCost = Number(item.costoPackaging) || 0
      const itemSubtotal = Number(((unitPrice + packCost) * qty).toFixed(2))
      subtotalCalculado += itemSubtotal

      const rawColores = Array.isArray(item.coloresIds) && item.coloresIds.length > 0
        ? item.coloresIds
        : (item.colorFilamentoId ? [item.colorFilamentoId] : [])

      // Preservar snapshot histórico si el ítem ya existía en el pedido
      const existingItem = current.items.find(ci => (item.id && ci.id === item.id) || ci.productoId === resolvedId)
      
      const preservedCostoSnapshot = (item.costoBaseSnapshot != null && Number(item.costoBaseSnapshot) > 0)
        ? Number(item.costoBaseSnapshot)
        : (existingItem && existingItem.costoBaseSnapshot != null && Number(existingItem.costoBaseSnapshot) > 0
            ? Number(existingItem.costoBaseSnapshot)
            : (prod ? Number(prod.costoBase) : 0))

      const preservedNombreSnapshot = item.nombreProductoSnapshot || existingItem?.nombreProductoSnapshot || prod?.nombreModelo || 'Modelo 3D'
      const is3D = current.negocio === '3D' && (!prod || prod.negocio === '3D')
      const singleItemSubtotal = Number((unitPrice + packCost).toFixed(2))
      const singleGramos = qty > 0 ? Number(((Number(item.gramosConsumidos) || 0) / qty).toFixed(1)) : 0

      if (is3D && qty > 1) {
        for (let q = 0; q < qty; q++) {
          processedItems.push({
            pedidoId: id,
            productoId: resolvedId,
            nombreProductoSnapshot: preservedNombreSnapshot,
            costoBaseSnapshot: preservedCostoSnapshot,
            colorFilamentoId: rawColores[0] || item.colorFilamentoId || null,
            coloresIds: rawColores,
            personalizacion: item.personalizacion?.trim() || null,
            cantidad: 1,
            tipoPrecio: item.tipoPrecio || 'MENOR',
            precioUnitario: unitPrice,
            costoPackaging: packCost,
            porcentajeAdicional: Number(item.porcentajeAdicional) || 0,
            gramosConsumidos: singleGramos,
            subtotal: singleItemSubtotal,
            estado: data.estado || existingItem?.estado || current.estado || 'PENDIENTE'
          })
        }
      } else {
        processedItems.push({
          pedidoId: id,
          productoId: resolvedId,
          nombreProductoSnapshot: preservedNombreSnapshot,
          costoBaseSnapshot: preservedCostoSnapshot,
          colorFilamentoId: rawColores[0] || item.colorFilamentoId || null,
          coloresIds: rawColores,
          personalizacion: item.personalizacion?.trim() || null,
          cantidad: qty,
          tipoPrecio: item.tipoPrecio || 'MENOR',
          precioUnitario: unitPrice,
          costoPackaging: packCost,
          porcentajeAdicional: Number(item.porcentajeAdicional) || 0,
          gramosConsumidos: Number(item.gramosConsumidos) || 0,
          subtotal: itemSubtotal,
          estado: data.estado || existingItem?.estado || current.estado || 'PENDIENTE'
        })
      }
    })

    const costoEnvioNum = Number(data.costoEnvio) || 0
    const totalCalculado = Number((subtotalCalculado + costoEnvioNum).toFixed(2))
    
    // Sum current payments
    let totalPagado = current.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
    const fechaPedido = parseDateInput(data.fecha || current.fecha)

    const updated = await prisma.$transaction(async (tx) => {
      // Ajuste de abono/pago si se especificó montoPagado
      if (data.montoPagado !== undefined) {
        const targetMonto = Math.max(0, Number(data.montoPagado) || 0)
        if (current.pagos.length <= 1) {
          if (current.pagos.length === 1) {
            await tx.pagoPedido.update({
              where: { id: current.pagos[0].id },
              data: { monto: targetMonto }
            })
          } else if (targetMonto > 0) {
            await tx.pagoPedido.create({
              data: {
                pedidoId: id,
                fecha: fechaPedido,
                monto: targetMonto,
                metodoPago: current.metodoPago || 'YAPE',
                tipo: 'ABONO',
                notas: 'Abono registrado en edición'
              }
            })
          }
          totalPagado = targetMonto
        } else {
          const diff = Number((targetMonto - totalPagado).toFixed(2))
          if (diff !== 0) {
            await tx.pagoPedido.create({
              data: {
                pedidoId: id,
                fecha: new Date(),
                monto: diff,
                metodoPago: current.metodoPago || 'YAPE',
                tipo: diff > 0 ? 'ABONO' : 'AJUSTE',
                notas: 'Ajuste de saldo en edición'
              }
            })
            totalPagado = targetMonto
          }
        }
      }

      const saldoPendienteNum = Number(Math.max(0, totalCalculado - totalPagado).toFixed(2))

      // Si cambia a PAGO_VALIDADO y antes no lo estaba
      if (data.estado === 'PAGO_VALIDADO' && current.estado !== 'PAGO_VALIDADO') {
        for (const it of processedItems) {
          if (it.productoId) {
            await tx.producto.update({
              where: { id: it.productoId },
              data: { stock: { decrement: it.cantidad } }
            })
          }
        }
      }

      // Si se cancela un pedido que tenía PAGO_VALIDADO
      if (current.estado === 'PAGO_VALIDADO' && data.estado === 'CANCELADO') {
        for (const it of processedItems) {
          if (it.productoId) {
            await tx.producto.update({
              where: { id: it.productoId },
              data: { stock: { increment: it.cantidad } }
            })
          }
        }
      }

      // Delete old items
      await tx.itemPedido.deleteMany({ where: { pedidoId: id } })

      // Create new items
      await tx.itemPedido.createMany({ data: processedItems })

      // Update box assignments if provided
      if (data.cajas !== undefined) {
        await tx.asignacionCajaPedido.deleteMany({ where: { pedidoId: id } })
        if (Array.isArray(data.cajas) && data.cajas.length > 0) {
          const toCreateCajas = data.cajas
            .filter(c => Number(c.cantidad) > 0)
            .map(c => {
              const q = Math.max(1, Math.round(Number(c.cantidad) || 1))
              const u = Number(c.costoUnitario != null ? c.costoUnitario : 2.40)
              return {
                pedidoId: id,
                inversionId: c.inversionId || null,
                nombreCaja: c.nombreCaja?.trim() || 'Caja de Envío',
                cantidad: q,
                costoUnitario: u,
                costoTotal: Number((q * u).toFixed(2))
              }
            })
          if (toCreateCajas.length > 0) {
            await tx.asignacionCajaPedido.createMany({ data: toCreateCajas })
          }
        }
      }

      // SLA Automatizado de Postventa: si se marca ENTREGADO y no tenía fecha definida
      const isEntregadoNuevo = data.estado === 'ENTREGADO' && current.estado !== 'ENTREGADO'
      const postventaAuto = (isEntregadoNuevo && data.seguimientoPostventa === undefined && !current.fechaPostventa)
        ? {
            seguimientoPostventa: true,
            fechaPostventa: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        : {}

      // Update header
      const p = await tx.pedido.update({
        where: { id },
        data: {
          cliente: data.cliente.trim(),
          dni: data.dni !== undefined ? (data.dni?.trim() || null) : current.dni,
          telefono: data.telefono !== undefined ? (data.telefono?.trim() || null) : current.telefono,
          canalVenta: data.canalVenta || 'WhatsApp',
          handleSocial: data.handleSocial !== undefined ? (data.handleSocial?.trim() || null) : current.handleSocial,
          destinoEnvio: data.destinoEnvio?.trim() || null,
          diaEntregaPrometida: data.diaEntregaPrometida?.trim() || null,
          notas: data.notas?.trim() || null,
          ...(data.estado ? { estado: data.estado } : {}),
          ...postventaAuto,
          ...(data.seguimientoPostventa !== undefined ? { seguimientoPostventa: data.seguimientoPostventa } : {}),
          ...(data.fechaPostventa !== undefined ? { fechaPostventa: data.fechaPostventa ? parseDateInput(data.fechaPostventa) : null } : {}),
          ...(data.notasPostventa !== undefined ? { notasPostventa: data.notasPostventa?.trim() || null } : {}),
          costoEnvio: costoEnvioNum,
          subtotal: subtotalCalculado,
          total: totalCalculado,
          montoPagado: totalPagado,
          saldoPendiente: saldoPendienteNum,
          fecha: fechaPedido
        },
        include: {
          items: {
            include: { producto: true, colorFilamento: true }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          },
          cajas: {
            include: { inversion: true }
          }
        }
      })

      // Sync updated client information if available
      if (data.handleSocial?.trim() || data.telefono?.trim() || data.dni?.trim()) {
        try {
          const clienteClean = data.cliente.trim()
          const existingCliente = await tx.cliente.findFirst({
            where: {
              nombre: { equals: clienteClean, mode: 'insensitive' },
              negocio: current.negocio
            }
          })
          if (existingCliente) {
            const updateData: any = {}
            if (!existingCliente.handleSocial && data.handleSocial?.trim()) {
              updateData.handleSocial = data.handleSocial.trim()
            }
            if (!existingCliente.telefono && data.telefono?.trim()) {
              updateData.telefono = data.telefono.trim()
            }
            if (!existingCliente.dni && data.dni?.trim()) {
              updateData.dni = data.dni.trim()
            }
            if (Object.keys(updateData).length > 0) {
              await tx.cliente.update({
                where: { id: existingCliente.id },
                data: updateData
              })
            }
          }
        } catch (err) {
          console.warn('No se pudo actualizar datos del cliente:', err)
        }
      }

      return p
    })

    const allFilamentos = await prisma.inventarioFilamento.findMany()
    const filMap = new Map(allFilamentos.map(f => [f.id, f]))

    safeRevalidate()
    return { success: true, pedido: serializePedido(updated, filMap) }
  } catch (error: any) {
    console.error('Error updating pedido:', error)
    return { success: false, error: error.message || 'Error al actualizar pedido' }
  }
}

export async function toggleSeguimientoPostventa(id: string, seguimiento?: boolean, notas?: string) {
  try {
    const current = await prisma.pedido.findUnique({
      where: { id }
    })

    if (!current) {
      return { success: false, error: 'Pedido no encontrado' }
    }

    const nuevoSeguimiento = seguimiento !== undefined ? seguimiento : !current.seguimientoPostventa
    const fecha = nuevoSeguimiento ? (current.fechaPostventa || new Date()) : null

    const updated = await prisma.pedido.update({
      where: { id },
      data: {
        seguimientoPostventa: nuevoSeguimiento,
        fechaPostventa: fecha,
        ...(notas !== undefined ? { notasPostventa: notas.trim() || null } : {})
      },
      include: {
        items: {
          include: { producto: true, colorFilamento: true }
        },
        pagos: {
          orderBy: { fecha: 'asc' }
        }
      }
    })

    const allFilamentos = await prisma.inventarioFilamento.findMany()
    const filMap = new Map(allFilamentos.map(f => [f.id, f]))

    safeRevalidate()
    return { success: true, pedido: serializePedido(updated, filMap) }
  } catch (error: any) {
    console.error('Error toggling seguimiento postventa:', error)
    return { success: false, error: error.message || 'Error al actualizar seguimiento postventa' }
  }
}

export const crearPedido = createPedido

export async function agregarItemPedido(pedidoId: string, item: ItemPedidoInput) {
  try {
    const resolvedId = item.varianteId || item.productoId
    const prod = await prisma.producto.findUnique({
      where: { id: resolvedId }
    })
    const qty = Math.max(1, Number(item.cantidad) || 1)
    const unitPrice = Number(item.precioUnitario) || 0
    const packCost = Number(item.costoPackaging) || 0
    const itemSubtotal = Number(((unitPrice + packCost) * qty).toFixed(2))

    const rawColores = Array.isArray(item.coloresIds) && item.coloresIds.length > 0
      ? item.coloresIds
      : (item.colorFilamentoId ? [item.colorFilamentoId] : [])

    const nuevoItem = await prisma.$transaction(async (tx) => {
      const created = await tx.itemPedido.create({
        data: {
          pedidoId,
          productoId: resolvedId,
          nombreProductoSnapshot: prod?.nombreModelo || 'Modelo 3D',
          costoBaseSnapshot: prod ? Number(prod.costoBase) : 0,
          colorFilamentoId: rawColores[0] || item.colorFilamentoId || null,
          coloresIds: rawColores,
          personalizacion: item.personalizacion?.trim() || null,
          cantidad: qty,
          tipoPrecio: item.tipoPrecio || 'MENOR',
          precioUnitario: unitPrice,
          costoPackaging: packCost,
          porcentajeAdicional: Number(item.porcentajeAdicional) || 0,
          gramosConsumidos: Number(item.gramosConsumidos) || 0,
          subtotal: itemSubtotal
        }
      })

      // Recalcular subtotal y total del pedido
      const allItems = await tx.itemPedido.findMany({ where: { pedidoId } })
      const newSubtotal = allItems.reduce((acc, it) => acc + Number(it.subtotal), 0)
      const currentPedido = await tx.pedido.findUnique({ where: { id: pedidoId } })
      const envio = Number(currentPedido?.costoEnvio || 0)
      const pagado = Number(currentPedido?.montoPagado || 0)
      const newTotal = Number((newSubtotal + envio).toFixed(2))
      const newSaldo = Math.max(0, Number((newTotal - pagado).toFixed(2)))

      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          subtotal: newSubtotal,
          total: newTotal,
          saldoPendiente: newSaldo
        }
      })

      return created
    })

    safeRevalidate()
    return { success: true, item: nuevoItem }
  } catch (error: any) {
    console.error('Error al agregar item al pedido:', error)
    return { success: false, error: error.message || 'Error al agregar item al pedido' }
  }
}
