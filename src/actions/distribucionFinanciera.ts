'use server'

import prisma from '@/lib/prisma'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'
import { isDateInRange } from '@/lib/date-utils'
import { getVentas } from '@/actions/ventas'
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

  const [inversiones, ventas, ingresosDirectos] = await Promise.all([
    prisma.inversion.findMany({
      where: { negocio: targetNegocio },
      orderBy: { createdAt: 'desc' }
    }),
    getVentas(targetNegocio),
    prisma.ingreso.findMany({
      where: { negocio: targetNegocio },
      orderBy: { fecha: 'desc' }
    })
  ])

  // Filtrar por fechas si vienen especificadas
  const filteredInversiones = inversiones.filter((inv) =>
    isDateInRange(inv.createdAt, desde, hasta)
  )

  const filteredVentas = ventas.filter((v: any) =>
    isDateInRange(v.fecha, desde, hasta)
  )

  const filteredIngresosDirectos = ingresosDirectos.filter((ing) =>
    isDateInRange(ing.fecha, desde, hasta)
  )

  return calcularDistribucionFinanciera({
    ventas: filteredVentas,
    inversiones: filteredInversiones,
    ingresosDirectos: filteredIngresosDirectos
  })
}
