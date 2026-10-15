import { NextRequest, NextResponse } from 'next/server'
import { getDistribucionFinanciera } from '@/actions/distribucionFinanciera'
import { TipoNegocio } from '@/lib/business'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const negocioParam = (searchParams.get('negocio') as TipoNegocio) || undefined
    const desde = searchParams.get('desde') || searchParams.get('from') || undefined
    const hasta = searchParams.get('hasta') || searchParams.get('to') || undefined

    const distribucion = await getDistribucionFinanciera({
      negocio: negocioParam,
      desde,
      hasta
    })

    return NextResponse.json({
      success: true,
      data: distribucion
    })
  } catch (error: any) {
    console.error('Error en API /api/finanzas/distribucion:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener distribución financiera' },
      { status: 500 }
    )
  }
}
