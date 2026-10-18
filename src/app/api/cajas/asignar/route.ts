import { NextResponse } from 'next/server'
import { asignarCajasAPedido, getRentabilidadPedido, quitarCajasDePedido } from '@/actions/cajas'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pedidoId = searchParams.get('pedidoId')
    if (!pedidoId) {
      return NextResponse.json({ success: false, error: 'pedidoId es requerido' }, { status: 400 })
    }
    const data = await getRentabilidadPedido(pedidoId)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pedidoId, cajas } = body
    if (!pedidoId) {
      return NextResponse.json({ success: false, error: 'pedidoId es requerido' }, { status: 400 })
    }
    const res = await asignarCajasAPedido({ pedidoId, cajas: cajas || [] })
    return NextResponse.json(res)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pedidoId = searchParams.get('pedidoId')
    if (!pedidoId) {
      return NextResponse.json({ success: false, error: 'pedidoId es requerido' }, { status: 400 })
    }
    const res = await quitarCajasDePedido(pedidoId)
    return NextResponse.json(res)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
