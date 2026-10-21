'use server'

import prisma from '@/lib/prisma'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'
import { isDateInRange } from '@/lib/date-utils'
import { getPedidos } from '@/actions/pedidos'
import { calcularDistribucionFinanciera, ResumenDistribucionFinanciera } from '@/lib/distribucion'

export type { ItemDistribucion, CanalDistribucion, ResumenDistribucionFinanciera } from '@/lib/distribucion'

/**
 * Obtener distribución financiera directamente desde la base de datos con filtros
 */
export async function getDistribucionFinanciera({
  negocio,
  desde,
  hasta
}: {
  negocio?: TipoNegocio
  desde?: string
  hasta?: string
} = {}): Promise<ResumenDistribucionFinanciera> {
  const targetNegocio = negocio || await getActiveNegocioServer()

  const [inversiones, pedidos, ingresosDirectos] = await Promise.all([
    prisma.inversion.findMany({
      where: { negocio: targetNegocio },
      orderBy: { createdAt: 'desc' }
    }),
    getPedidos(targetNegocio),
    prisma.ingreso.findMany({
      where: { negocio: targetNegocio },
      orderBy: { fecha: 'desc' }
    })
  ])

  // Filtrar por fechas si vienen especificadas
  const filteredInversiones = inversiones.filter((inv) =>
    isDateInRange(inv.createdAt, desde, hasta)
  )

  const filteredPedidos = pedidos.filter((p: any) =>
    isDateInRange(p.fecha, desde, hasta)
  )

  const filteredIngresosDirectos = ingresosDirectos.filter((ing) =>
    isDateInRange(ing.fecha, desde, hasta)
  )

  return calcularDistribucionFinanciera({
    ventas: filteredPedidos,
    inversiones: filteredInversiones,
    ingresosDirectos: filteredIngresosDirectos
  })
}
