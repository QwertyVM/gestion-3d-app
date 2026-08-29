'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getCategorias() {
  // Get all products to ensure any categories are synchronized in DB
  const productos = await prisma.producto.findMany({
    select: { lineaCategoria: true },
  })

  // Ensure any product categories exist in Categoria table in database
  const distinctProductCats = Array.from(new Set(productos.map(p => p.lineaCategoria?.trim()).filter(Boolean)))
  for (const catName of distinctProductCats) {
    await prisma.categoria.upsert({
      where: { nombre: catName },
      update: {},
      create: { nombre: catName },
    })
  }

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: 'asc' },
  })

  const countMap: Record<string, number> = {}
  productos.forEach(p => {
    countMap[p.lineaCategoria] = (countMap[p.lineaCategoria] || 0) + 1
  })

  return categorias.map(c => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion || '',
    totalProductos: countMap[c.nombre] || 0,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))
}

export async function createCategoria(data: { nombre: string; descripcion?: string }) {
  const cleanNombre = data.nombre.trim()
  if (!cleanNombre) {
    throw new Error('El nombre de la categoría es obligatorio')
  }

  const existing = await prisma.categoria.findFirst({
    where: {
      nombre: {
        equals: cleanNombre,
        mode: 'insensitive',
      },
    },
  })

  if (existing) {
    throw new Error('Ya existe una categoría con este nombre')
  }

  const categoria = await prisma.categoria.create({
    data: {
      nombre: cleanNombre,
      descripcion: data.descripcion?.trim() || null,
    },
  })

  revalidatePath('/catalogo')
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion || '',
    totalProductos: 0,
    createdAt: categoria.createdAt.toISOString(),
    updatedAt: categoria.updatedAt.toISOString(),
  }
}

export async function updateCategoria(id: string, data: { nombre: string; descripcion?: string }) {
  const cleanNombre = data.nombre.trim()
  if (!cleanNombre) {
    throw new Error('El nombre de la categoría es obligatorio')
  }

  const current = await prisma.categoria.findUnique({
    where: { id },
  })

  if (!current) {
    throw new Error('Categoría no encontrada')
  }

  // Check if name is being changed and if new name already exists
  if (current.nombre !== cleanNombre) {
    const existing = await prisma.categoria.findFirst({
      where: {
        nombre: {
          equals: cleanNombre,
          mode: 'insensitive',
        },
        id: { not: id },
      },
    })

    if (existing) {
      throw new Error('Ya existe otra categoría con este nombre')
    }

    // Cascade update to all products that had the old category name
    await prisma.producto.updateMany({
      where: { lineaCategoria: current.nombre },
      data: { lineaCategoria: cleanNombre },
    })
  }

  const updated = await prisma.categoria.update({
    where: { id },
    data: {
      nombre: cleanNombre,
      descripcion: data.descripcion?.trim() || null,
    },
  })

  revalidatePath('/catalogo')
  revalidatePath('/ventas')

  return {
    id: updated.id,
    nombre: updated.nombre,
    descripcion: updated.descripcion || '',
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function deleteCategoria(id: string) {
  const current = await prisma.categoria.findUnique({
    where: { id },
  })

  if (!current) {
    throw new Error('Categoría no encontrada')
  }

  // Check if products exist with this category
  const count = await prisma.producto.count({
    where: { lineaCategoria: current.nombre },
  })

  if (count > 0) {
    throw new Error(`No se puede eliminar la categoría "${current.nombre}" porque tiene ${count} producto(s) asignado(s). Reasigna los productos primero.`)
  }

  await prisma.categoria.delete({
    where: { id },
  })

  revalidatePath('/catalogo')
  return { success: true, message: `Categoría "${current.nombre}" eliminada exitosamente.` }
}
