import { NextRequest, NextResponse } from 'next/server'
import { revertirPagoCompromisoBlindado, RevertirCompromisoInput } from '@/actions/presupuesto'

export async function POST(req: NextRequest) {
  try {
    const body: RevertirCompromisoInput = await req.json()

    if (!body.inversionId && !body.numeroCuota && !body.partidaId) {
      return NextResponse.json(
        { error: 'Se requiere al menos un identificador (inversionId, numeroCuota o partidaId) para revertir' },
        { status: 400 }
      )
    }

    const resultado = await revertirPagoCompromisoBlindado(body)
    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('Error en API /api/finanzas/compromisos/revertir:', error)
    return NextResponse.json(
      { error: error.message || 'Error al revertir el compromiso' },
      { status: 500 }
    )
  }
}
