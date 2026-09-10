'use server'

import prisma from '@/lib/prisma'

export async function getNavLiveMetrics() {
  try {
    const [pedidosPendientes, filamentosCriticos, itemsPedidos, ventasPendientes] = await Promise.all([
      prisma.pedido.count({
        where: {
          OR: [
            { estado: { in: ['PENDIENTE', 'EN_PRODUCCION'] } },
            { saldoPendiente: { gt: 0 } }
          ]
        }
      }),
      prisma.inventarioFilamento.count({
        where: {
          activo: true,
          OR: [
            { stockGramos: { lt: 300 } },
            { alertaCritica: true }
          ]
        }
      }),
      prisma.itemPedido.findMany({
        where: {
          pedido: {
            estado: { in: ['PENDIENTE', 'EN_PRODUCCION'] }
          }
        },
        select: { cantidad: true }
      }),
      prisma.venta.findMany({
        where: {
          estado: { in: ['PENDIENTE', 'EN_PRODUCCION'] }
        },
        select: { cantidad: true }
      })
    ])

    const totalPiezasTaller = 
      itemsPedidos.reduce((sum, it) => sum + Number(it.cantidad || 1), 0) +
      ventasPendientes.reduce((sum, v) => sum + Number(v.cantidad || 1), 0)

    return {
      pedidosPendientes,
      filamentosCriticos,
      piezasTallerPendientes: totalPiezasTaller
    }
  } catch (error) {
    console.error('Error fetching nav live metrics:', error)
    return {
      pedidosPendientes: 0,
      filamentosCriticos: 0,
      piezasTallerPendientes: 0
    }
  }
}
