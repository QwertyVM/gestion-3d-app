import { NextResponse } from 'next/server'
import { getDatosPresupuestoTranquilidad, getResumenBlindadoOficial } from '@/actions/presupuesto'

export async function GET() {
  try {
    const [datos, resumen] = await Promise.all([
      getDatosPresupuestoTranquilidad(),
      getResumenBlindadoOficial()
    ])

    return NextResponse.json({
      success: true,
      prestamoInfo: datos.prestamoInfo,
      partidasPlan: datos.partidasPlan,
      partidasBlindadas: datos.partidasBlindadasResumen,
      resumen
    })
  } catch (error: any) {
    console.error('Error en API /api/finanzas/compromisos:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener compromisos' },
      { status: 500 }
    )
  }
}
