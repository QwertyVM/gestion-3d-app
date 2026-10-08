'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  Layers,
  Package,
  Plus,
  FolderOpen,
  FilterX
} from 'lucide-react'
import { toast } from 'sonner'
import {
  CategoriaItem,
  createCategoria,
  updateCategoria,
  deleteCategoria
} from '@/actions/categorias'
import { CategoryStatsCards, CategoryFilterTab } from './CategoryStatsCards'
import { CategorySearchBar } from './CategorySearchBar'
import { CategoryRowItem } from './CategoryRowItem'
import { CategoryFormDialog } from './CategoryFormDialog'

export interface CategoriasClientProps {
  categoriasIniciales: CategoriaItem[]
}

export function CategoriasClient({ categoriasIniciales }: CategoriasClientProps) {
  const [categorias, setCategorias] = useState<CategoriaItem[]>(categoriasIniciales)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<CategoryFilterTab>('todas')
  const [expandedCatIds, setExpandedCatIds] = useState<Record<string, boolean>>({})

  // Modal State
  const [openModal, setOpenModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoriaItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // KPIs
  const totalRegistradas = categorias.length
  const conModelosCount = useMemo(
    () => categorias.filter((c) => c.totalProductos > 0).length,
    [categorias]
  )
  const vaciasCount = useMemo(
    () => categorias.filter((c) => c.totalProductos === 0).length,
    [categorias]
  )
  const totalModelosSum = useMemo(
    () => categorias.reduce((sum, c) => sum + c.totalProductos, 0),
    [categorias]
  )

  // Filtered categories
  const filteredCategorias = useMemo(() => {
    let list = categorias

    if (activeTab === 'con_modelos') {
      list = list.filter((c) => c.totalProductos > 0)
    } else if (activeTab === 'vacias') {
      list = list.filter((c) => c.totalProductos === 0)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.descripcion.toLowerCase().includes(q) ||
          c.productos.some((p) => p.nombreModelo.toLowerCase().includes(q))
      )
    }

    return list.sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    )
  }, [categorias, activeTab, search])

  // Toggle inline accordion
  const toggleExpand = (id: string) => {
    setExpandedCatIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCategory(null)
    setOpenModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (cat: CategoriaItem) => {
    setEditingCategory(cat)
    setOpenModal(true)
  }

  // Submit Modal (Create or Edit)
  const handleSubmitForm = async (data: { nombre: string; descripcion: string }) => {
    setIsSubmitting(true)
    try {
      if (editingCategory) {
        const updated = await updateCategoria(editingCategory.id, {
          nombre: data.nombre,
          descripcion: data.descripcion || undefined
        })
        setCategorias((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? updated : c))
        )
        toast.success(`Categoría "${data.nombre}" actualizada correctamente`)
      } else {
        const created = await createCategoria({
          nombre: data.nombre,
          descripcion: data.descripcion || undefined
        })
        setCategorias((prev) => [...prev, created])
        toast.success(`Categoría "${data.nombre}" creada exitosamente`)
      }

      setOpenModal(false)
      setEditingCategory(null)
    } catch (err: any) {
      toast.error(err.message || 'Ocurrió un error al guardar la categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Category
  const handleDeleteCategory = async (cat: CategoriaItem) => {
    if (cat.totalProductos > 0) {
      toast.error(
        `No puedes eliminar "${cat.nombre}" porque tiene ${cat.totalProductos} modelo(s) vinculado(s).`
      )
      return
    }

    if (!confirm(`¿Estás seguro de eliminar la categoría vacía "${cat.nombre}"?`)) {
      return
    }

    // Optimistic removal
    setCategorias((prev) => prev.filter((c) => c.id !== cat.id))

    try {
      await deleteCategoria(cat.id)
      toast.success(`Categoría "${cat.nombre}" eliminada`)
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar')
      setCategorias((prev) => [...prev, cat])
    }
  }

  const hasActiveFilters = Boolean(search.trim() || activeTab !== 'todas')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-background text-foreground min-h-screen">
      {/* ========================================================================= */}
      {/* 1. CABECERA & ACCIONES PRINCIPALES                                        */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        {/* Breadcrumb sutil */}
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
          <Link
            href="/catalogo"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <span>Catálogo</span>
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-semibold">Categorías de Productos</span>
        </div>

        {/* Título Principal & Botones de Acción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Gestión de Categorías
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Organización y familias de modelos 3D del taller.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Ver Productos */}
            <Link
              href="/catalogo"
              className="border border-border bg-card text-foreground hover:bg-secondary rounded-xl h-10 px-4 text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <Package className="w-4 h-4 text-primary" />
              <span>Ver Productos ({totalModelosSum})</span>
            </Link>

            {/* + Nueva Categoría */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-4 text-xs font-semibold shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Categoría</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GRILLA DE KPIS SUPERIORES (3 COLUMNAS BALANCEADAS)                     */}
      {/* ========================================================================= */}
      <CategoryStatsCards
        totalCategorias={totalRegistradas}
        totalModelos={totalModelosSum}
        conModelosCount={conModelosCount}
        vaciasCount={vaciasCount}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* ========================================================================= */}
      {/* 3. FILTROS Y BÚSQUEDA HORIZONTAL                                          */}
      {/* ========================================================================= */}
      <CategorySearchBar
        search={search}
        onSearchChange={setSearch}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalCount={totalRegistradas}
        conModelosCount={conModelosCount}
        vaciasCount={vaciasCount}
      />

      {/* ========================================================================= */}
      {/* 4. LISTA MODULAR DE CATEGORÍAS                                            */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredCategorias.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-xl border border-dashed border-border shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              {hasActiveFilters ? (
                <FilterX className="w-6 h-6 text-muted-foreground" />
              ) : (
                <FolderOpen className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                No se encontraron categorías
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'No hay categorías que coincidan con los criterios de búsqueda o filtro seleccionados.'
                  : 'Aún no se han registrado familias de categorías en el taller.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setActiveTab('todas')
                  }}
                  className="border border-border bg-card text-foreground hover:bg-secondary rounded-xl h-9 px-3.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-9 px-4 text-xs font-semibold shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Categoría</span>
              </button>
            </div>
          </div>
        ) : (
          filteredCategorias.map((cat) => (
            <CategoryRowItem
              key={cat.id}
              categoria={cat}
              isExpanded={Boolean(expandedCatIds[cat.id])}
              onToggleExpand={() => toggleExpand(cat.id)}
              onEdit={() => handleOpenEdit(cat)}
              onDelete={() => handleDeleteCategory(cat)}
            />
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL DE CREACIÓN / EDICIÓN                                            */}
      {/* ========================================================================= */}
      <CategoryFormDialog
        open={openModal}
        onOpenChange={setOpenModal}
        categoryToEdit={editingCategory}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

// Alias para consistencia
export const CategoriesManagementView = CategoriasClient
