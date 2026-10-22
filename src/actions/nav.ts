'use server'

import prisma from '@/lib/prisma'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

export async function getNavLiveMetrics(negocio?: TipoNegocio) {
  try {
    const targetNegocio = negocio || await getActiveNegocioServer()

    const [pedidosPendientes, filamentosCriticos, itemsPedidos] = await Promise.all([
      prisma.pedido.count({
        where: {
          negocio: targetNegocio,
          estado: {
            notIn: ['ENTREGADO', 'CANCELADO']
          }
        }
      }),
      targetNegocio === '3D' ? prisma.inventarioFilamento.count({
        where: {
          activo: true,
          OR: [
            { stockGramos: { lt: 300 } },
            { alertaCritica: true }
          ]
        }
      }) : Promise.resolve(0),
      targetNegocio === '3D' ? prisma.itemPedido.aggregate({
        where: {
          pedido: {
            negocio: '3D',
            estado: { in: ['PENDIENTE', 'EN_PRODUCCION', 'EN_TALLER', 'EMPAQUETANDO'] }
          }
        },
        _sum: { cantidad: true }
      }) : Promise.resolve({ _sum: { cantidad: 0 } })
    ])

    const totalPiezasTaller = Number(itemsPedidos?._sum?.cantidad || 0)

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

