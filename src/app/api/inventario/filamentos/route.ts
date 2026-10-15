import { NextRequest, NextResponse } from 'next/server'
import { 
  getColoresInventario, 
  archivarColor, 
  descatalogarColor, 
  reactivarColor, 
  moverEstadoColor, 
  actualizarGramosColor, 
  actualizarRollosColor, 
  editarColorFilamento, 
  agregarNuevoColor, 
  eliminarColor 
} from '@/actions/inventario'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') // 'disponibles' | 'restock' | 'descatalogados' | 'criticos' | 'todos'
    const query = (searchParams.get('q') || '').trim().toLowerCase()

    const { disponibles, restock, descatalogados } = await getColoresInventario()

    const totalCriticos = disponibles.filter(c => c.stockGramos < 300 || c.alertaCritica)
    const totalGramosActivos = disponibles.reduce((acc, c) => acc + (c.stockGramos || 0), 0)

    const counts = {
      todos: disponibles.length + restock.length,
      disponibles: disponibles.length,
      criticos: totalCriticos.length,
      restock: restock.length,
      descatalogados: descatalogados.length,
    }

    let items = disponibles
    if (tab === 'restock') items = restock
    else if (tab === 'descatalogados') items = descatalogados
    else if (tab === 'criticos') items = totalCriticos
    else if (tab === 'todos') items = [...disponibles, ...restock]

    if (query) {
      items = items.filter(c => 
        c.nombreColor.toLowerCase().includes(query) ||
        (c.codigoHex && c.codigoHex.toLowerCase().includes(query)) ||
        (c.nota && c.nota.toLowerCase().includes(query))
      )
    }

    return NextResponse.json({
      success: true,
      data: items,
      disponibles,
      restock,
      descatalogados,
      counts,
      totalGramosActivos
    })
  } catch (error: any) {
    console.error('Error en GET /api/inventario/filamentos:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al obtener filamentos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accion } = body

    if (accion === 'archivar') {
      if (!body.id) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
      const res = await archivarColor(body.id)
      return NextResponse.json(res)
    }

    if (accion === 'descatalogar') {
      if (!body.id) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
      const res = await descatalogarColor(body.id)
      return NextResponse.json(res)
    }

    if (accion === 'reactivar') {
      if (!body.id) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
      const res = await reactivarColor(body.id)
      return NextResponse.json(res)
    }

    // Por defecto, registro de nuevo color
    const nuevoColor = await agregarNuevoColor({
      nombreColor: body.nombreColor,
      codigoHex: body.codigoHex,
      estado: body.estado || 'DISPONIBLE',
      rollos: body.rollos,
      stockGramos: body.stockGramos,
      nota: body.nota
    })

    return NextResponse.json({ success: true, data: nuevoColor }, { status: 201 })
  } catch (error: any) {
    console.error('Error en POST /api/inventario/filamentos:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al procesar solicitud' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, accion } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    if (accion === 'archivar') {
      const res = await archivarColor(id)
      return NextResponse.json(res)
    }

    if (accion === 'descatalogar') {
      const res = await descatalogarColor(id)
      return NextResponse.json(res)
    }

    if (accion === 'reactivar') {
      const res = await reactivarColor(id)
      return NextResponse.json(res)
    }

    if (accion === 'mover_estado') {
      const res = await moverEstadoColor(id, body.nuevoEstado, body.nota)
      return NextResponse.json({ success: true, data: res })
    }

    if (accion === 'actualizar_gramos') {
      const res = await actualizarGramosColor(id, body.stockGramos)
      return NextResponse.json({ success: true, data: res })
    }

    if (accion === 'actualizar_rollos') {
      const res = await actualizarRollosColor(id, body.nuevosRollos)
      return NextResponse.json({ success: true, data: res })
    }

    if (accion === 'editar') {
      const res = await editarColorFilamento(id, {
        nombreColor: body.nombreColor,
        codigoHex: body.codigoHex,
        nota: body.nota
      })
      return NextResponse.json({ success: true, data: res })
    }

    return NextResponse.json({ success: false, error: 'Acción no reconocida' }, { status: 400 })
  } catch (error: any) {
    console.error('Error en PATCH /api/inventario/filamentos:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al actualizar filamento' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    const res = await eliminarColor(id)
    return NextResponse.json(res)
  } catch (error: any) {
    console.error('Error en DELETE /api/inventario/filamentos:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al eliminar filamento' },
      { status: 500 }
    )
  }
}
