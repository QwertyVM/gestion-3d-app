import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function safeRevalidate() {
  try {
    revalidatePath('/catalogo')
    revalidatePath('/catalogo/productos')
    revalidatePath('/catalogo/categorias')
    revalidatePath('/catalogo/inventario')
    revalidatePath('/inventario')
    revalidatePath('/ventas')
    revalidatePath('/pedidos')
    revalidatePath('/')
  } catch (e) {
    // En entornos donde revalidatePath no esté disponible
  }
}

function checkAuthorization(req: Request): boolean {
  const expectedKey = process.env.CATALOGO_API_KEY || process.env.API_SECRET_KEY
  if (!expectedKey) return false

  const authHeader = req.headers.get('authorization') || ''
  const apiKeyHeader = req.headers.get('x-api-key') || ''

  let token = ''
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim()
  } else if (authHeader) {
    token = authHeader.trim()
  } else if (apiKeyHeader) {
    token = apiKeyHeader.trim()
  }

  return Boolean(token && token === expectedKey.trim())
}

interface ProductoPayload {
  nombreModelo: string
  lineaCategoria?: string
  costoBase?: number | string
  precioMenor?: number | string
  precioMayor?: number | string
  negocio?: string
  activo?: boolean
  stock?: number | string
  descripcionWeb?: string | null
  imagenUrl?: string | null
}

async function upsertProducto(item: ProductoPayload, negocioDefault = '3D') {
  if (!item.nombreModelo || !String(item.nombreModelo).trim()) {
    throw new Error('El campo "nombreModelo" es obligatorio.')
  }

  const cleanNombre = String(item.nombreModelo).trim()
  const cleanCategoria = item.lineaCategoria ? String(item.lineaCategoria).trim() : 'General'
  const negocioTarget = item.negocio ? String(item.negocio).trim() : negocioDefault

  const costoBaseNum = Number(item.costoBase) >= 0 ? Number(Number(item.costoBase).toFixed(2)) : 0
  const precioMenorNum = Number(item.precioMenor) >= 0 ? Number(Number(item.precioMenor).toFixed(2)) : 0
  const precioMayorNum = Number(item.precioMayor) >= 0 ? Number(Number(item.precioMayor).toFixed(2)) : 0

  // Sincronizar Categoria si se especifica
  if (cleanCategoria) {
    try {
      await prisma.categoria.upsert({
        where: {
          nombre_negocio: {
            nombre: cleanCategoria,
            negocio: negocioTarget
          }
        },
        update: {},
        create: {
          nombre: cleanCategoria,
          negocio: negocioTarget
        }
      })
    } catch {}
  }

  // Buscar coincidencia insensible a mayúsculas
  const existing = await prisma.producto.findFirst({
    where: {
      nombreModelo: {
        equals: cleanNombre,
        mode: 'insensitive'
      },
      negocio: negocioTarget
    }
  })

  if (existing) {
    const updated = await prisma.producto.update({
      where: { id: existing.id },
      data: {
        nombreModelo: cleanNombre,
        lineaCategoria: cleanCategoria || existing.lineaCategoria,
        costoBase: costoBaseNum,
        precioMayor: precioMayorNum,
        precioMenor: precioMenorNum,
        ...(item.activo !== undefined ? { activo: Boolean(item.activo) } : {}),
        ...(item.stock !== undefined ? { stock: Number(item.stock) || 0 } : {}),
        ...(item.descripcionWeb !== undefined ? { descripcionWeb: item.descripcionWeb } : {}),
        ...(item.imagenUrl !== undefined ? { imagenUrl: item.imagenUrl } : {}),
      }
    })

    return {
      action: 'updated' as const,
      producto: {
        id: updated.id,
        nombreModelo: updated.nombreModelo,
        lineaCategoria: updated.lineaCategoria,
        costoBase: Number(updated.costoBase),
        precioMayor: Number(updated.precioMayor),
        precioMenor: Number(updated.precioMenor),
        activo: updated.activo,
        stock: updated.stock,
        negocio: updated.negocio,
        updatedAt: updated.updatedAt.toISOString()
      }
    }
  } else {
    const created = await prisma.producto.create({
      data: {
        nombreModelo: cleanNombre,
        lineaCategoria: cleanCategoria,
        costoBase: costoBaseNum,
        precioMayor: precioMayorNum,
        precioMenor: precioMenorNum,
        negocio: negocioTarget,
        activo: item.activo !== undefined ? Boolean(item.activo) : true,
        stock: item.stock !== undefined ? Number(item.stock) || 0 : 0,
        descripcionWeb: item.descripcionWeb ?? null,
        imagenUrl: item.imagenUrl ?? null,
      }
    })

    return {
      action: 'created' as const,
      producto: {
        id: created.id,
        nombreModelo: created.nombreModelo,
        lineaCategoria: created.lineaCategoria,
        costoBase: Number(created.costoBase),
        precioMayor: Number(created.precioMayor),
        precioMenor: Number(created.precioMenor),
        activo: created.activo,
        stock: created.stock,
        negocio: created.negocio,
        createdAt: created.createdAt.toISOString()
      }
    }
  }
}

/**
 * POST /api/catalogo/producto
 * Permite registrar o actualizar productos en el catálogo de forma individual o en lote (batch).
 */
export async function POST(req: Request) {
  try {
    if (!checkAuthorization(req)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado. Se requiere un header "Authorization: Bearer <API_KEY>" o "x-api-key: <API_KEY>" válido.'
        },
        { status: 401 }
      )
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'El cuerpo de la petición debe ser un JSON válido.' },
        { status: 400 }
      )
    }

    // Soporte para envío en lote (array) o individual (objeto)
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json(
          { success: false, error: 'El array de productos está vacío.' },
          { status: 400 }
        )
      }

      const results = []
      const errors = []

      for (let i = 0; i < body.length; i++) {
        const item = body[i]
        try {
          const res = await upsertProducto(item)
          results.push(res)
        } catch (err: any) {
          errors.push({ index: i, item, error: err.message || 'Error desconocido' })
        }
      }

      safeRevalidate()

      return NextResponse.json({
        success: true,
        modo: 'batch',
        procesados: results.length,
        fallidos: errors.length,
        resultados: results,
        errores: errors.length > 0 ? errors : undefined
      })
    } else {
      const result = await upsertProducto(body)
      safeRevalidate()

      return NextResponse.json({
        success: true,
        modo: 'single',
        action: result.action,
        producto: result.producto
      })
    }
  } catch (error: any) {
    console.error('Error en POST /api/catalogo/producto:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno del servidor al procesar el producto.'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/catalogo/producto
 * Proporciona información de salud de la API o listado de productos si está autenticado.
 */
export async function GET(req: Request) {
  const isAuth = checkAuthorization(req)

  if (!isAuth) {
    return NextResponse.json({
      status: 'online',
      endpoint: '/api/catalogo/producto',
      metodo_permitido: 'POST',
      autenticacion: 'Header "Authorization: Bearer <API_KEY>" o "x-api-key: <API_KEY>"',
      ejemplo_payload: {
        nombreModelo: 'Dragón Articulado Cristal',
        lineaCategoria: 'Figuras & Decoración',
        costoBase: 8.50,
        precioMenor: 35.00,
        precioMayor: 22.00
      }
    })
  }

  // Si está autenticado, devuelve la lista de productos
  const productos = await prisma.producto.findMany({
    where: { negocio: '3D' },
    orderBy: { nombreModelo: 'asc' },
    select: {
      id: true,
      nombreModelo: true,
      lineaCategoria: true,
      costoBase: true,
      precioMenor: true,
      precioMayor: true,
      activo: true,
      updatedAt: true
    }
  })

  return NextResponse.json({
    success: true,
    total: productos.length,
    productos: productos.map(p => ({
      ...p,
      costoBase: Number(p.costoBase),
      precioMenor: Number(p.precioMenor),
      precioMayor: Number(p.precioMayor),
    }))
  })
}
