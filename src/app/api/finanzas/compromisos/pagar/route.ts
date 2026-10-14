import { NextRequest, NextResponse } from 'next/server'
import { pagarCompromisoBlindado, PagarCompromisoInput } from '@/actions/presupuesto'

export async function POST(req: NextRequest) {
  try {
    const body: PagarCompromisoInput = await req.json()

    if (!body.concepto || !body.monto) {
      return NextResponse.json(
        { error: 'El concepto y el monto son requeridos' },
        { status: 400 }
      )
    }

    const resultado = await pagarCompromisoBlindado(body)
    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('Error en API /api/finanzas/compromisos/pagar:', error)
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pago del compromiso' },
      { status: 500 }
    )
  }
}
