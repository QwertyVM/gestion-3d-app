'use server'

import prisma from '@/lib/prisma'

export async function getNavLiveMetrics() {
  try {
    const [pedidosPendientes, filamentosCriticos] = await Promise.all([
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
      })
    ])

    return {
      pedidosPendientes,
      filamentosCriticos
    }
  } catch (error) {
    console.error('Error fetching nav live metrics:', error)
    return {
      pedidosPendientes: 0,
      filamentosCriticos: 0
    }
  }
}
