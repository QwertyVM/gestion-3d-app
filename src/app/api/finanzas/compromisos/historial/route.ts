import { NextResponse } from 'next/server'
import { getHistorialCompromisos } from '@/actions/presupuesto'

export async function GET() {
  try {
    const historial = await getHistorialCompromisos()
    return NextResponse.json({
      success: true,
      historial
    })
  } catch (error: any) {
    console.error('Error en API /api/finanzas/compromisos/historial:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener historial de compromisos' },
      { status: 500 }
    )
  }
}
