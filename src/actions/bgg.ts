'use server'

import { revalidatePath } from 'next/cache'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function updateBggStats(id: string, data: {
  bggRating?: number | null
  bggWeight?: number | null
  bggMinPlayers?: number | null
  bggMaxPlayers?: number | null
  bggPlaytime?: number | null
}) {
  try {
    const updated = await prisma.producto.update({
      where: { id },
      data: {
        bggRating: data.bggRating !== undefined ? data.bggRating : undefined,
        bggWeight: data.bggWeight !== undefined ? data.bggWeight : undefined,
        bggMinPlayers: data.bggMinPlayers !== undefined ? data.bggMinPlayers : undefined,
        bggMaxPlayers: data.bggMaxPlayers !== undefined ? data.bggMaxPlayers : undefined,
        bggPlaytime: data.bggPlaytime !== undefined ? data.bggPlaytime : undefined,
        bggRatingUpdatedAt: new Date()
      }
    })

    revalidatePath('/catalogo')
    return { success: true, message: 'Estadísticas de BGG actualizadas' }
  } catch (error: any) {
    console.error('Error updating BGG stats:', error)
    throw new Error('No se pudo actualizar las estadísticas de BGG')
  }
}
