import { NextResponse } from 'next/server'
import { getStockCajas } from '@/actions/cajas'
import { TipoNegocio } from '@/lib/business'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const negocio = (searchParams.get('negocio') as TipoNegocio) || '3D'
    const data = await getStockCajas(negocio)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
