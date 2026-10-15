import { NextRequest, NextResponse } from 'next/server'
import { getRentabilidadSueldos } from '@/actions/rentabilidad'
import { TipoNegocio } from '@/lib/business'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const negocioParam = searchParams.get('negocio') as TipoNegocio | null
    const mesKeyParam = searchParams.get('mes') || undefined

    const data = await getRentabilidadSueldos(
      negocioParam || undefined,
      mesKeyParam
    )

    return NextResponse.json({
      success: true,
      ...data,
    })
  } catch (error: any) {
    console.error('Error en API /api/finanzas/rentabilidad:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al calcular rentabilidad y sueldos' },
      { status: 500 }
    )
  }
}
