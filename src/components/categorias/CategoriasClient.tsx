'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Boxes,
  Package,
  Plus,
  FolderOpen,
  FilterX
} from 'lucide-react'
import { toast } from 'sonner'
import {
  CategoriaItem,
  CategoriaProductoSummary,
  createCategoria,
  updateCategoria,
  deleteCategoria
} from '@/actions/categorias'
import { ProductDetailsModal as ProductDetailDialog } from '@/components/catalogo/ProductDetailsModal'
import type { ProductoItem } from '@/components/catalogo/CatalogoClient'
import { CategoryStatsCards, CategoryFilterTab } from './CategoryStatsCards'
import { CategorySearchBar } from './CategorySearchBar'
import { CategoryRowItem } from './CategoryRowItem'
import { CategoryFormDialog } from './CategoryFormDialog'

export interface CategoriasClientProps {
  categoriasIniciales: CategoriaItem[]
}

export function CategoriasClient({ categoriasIniciales }: CategoriasClientProps) {
  const router = useRouter()
  const [categorias, setCategorias] = useState<CategoriaItem[]>(categoriasIniciales)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<CategoryFilterTab>('todas')
  const [expandedCatIds, setExpandedCatIds] = useState<Record<string, boolean>>({})

  // Modal Category Form State
  const [openModal, setOpenModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoriaItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Product Detail Dialog State
  const [selectedProduct, setSelectedProduct] = useState<{
    summary: CategoriaProductoSummary
    categoriaNombre: string
  } | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

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

  // Select Product to open ProductDetailDialog
  const handleSelectProduct = (prod: CategoriaProductoSummary, cat: CategoriaItem) => {
    setSelectedProduct({
      summary: prod,
      categoriaNombre: cat.nombre
    })
    setDetailModalOpen(true)
  }

  // Map to ProductoItem for ProductDetailDialog
  const singleProductForModal: ProductoItem | null = useMemo(() => {
    if (!selectedProduct) return null
    const { summary, categoriaNombre } = selectedProduct
    return {
      id: summary.id,
      nombreModelo: summary.nombreModelo,
      lineaCategoria: categoriaNombre,
      costoBase: summary.costoBase,
      precioMenor: summary.precioMenor,
      precioMayor: summary.precioMayor || 0,
      activo: summary.activo,
      imagenUrl: summary.imagenUrl || null,
      enlaceMakerworld: summary.enlaceMakerworld || null,
      descripcionWeb: summary.descripcionWeb || null,
      createdAt: summary.createdAt,
      pedidosCount: summary.pedidosCount || 0
    }
  }, [selectedProduct])

  // Formatting helpers for ProductDetailDialog
  const formatCurrency = (val: number) =>
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const calcMargen = (precio: number, costo: number) => {
    if (costo <= 0) return precio > 0 ? '+100%' : '+0%'
    const margen = ((precio - costo) / costo) * 100
    return margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`
  }

  const formatFechaRegistro = (rawDate: string | Date | null | undefined) => {
    if (!rawDate) return '-'
    const dateStr = String(rawDate).split('T')[0]
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic']
      const day = parts[2]
      const month = months[Number(parts[1]) - 1] || ''
      const year = parts[0]
      return `${day} ${month}. ${year}`
    }
    return dateStr
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
    <div className="max-w-7xl mx-auto space-y-5 text-foreground">
      {/* ========================================================================= */}
      {/* 1. CABECERA & ACCIONES PRINCIPALES                                        */}
      {/* ========================================================================= */}
      <div className="space-y-1.5">
        {/* Breadcrumb sutil */}
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
          <Link
            href="/catalogo"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <span>Catálogo</span>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-foreground font-medium">Categorías de Productos</span>
        </div>

        {/* Título Principal & Botones de Acción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Boxes className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                Gestión de Categorías
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Organización y familias de modelos 3D del taller
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Ver Productos */}
            <Link
              href="/catalogo"
              className="border border-border/80 bg-background text-foreground hover:bg-muted rounded-lg h-8 px-3 text-xs font-medium shadow-none flex items-center gap-1.5 transition-colors cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <Package className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Ver Productos ({totalModelosSum})</span>
            </Link>

            {/* + Nueva Categoría */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-8 px-3 text-xs font-medium shadow-none flex items-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
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
      {/* 4. LISTA MODULAR DE TARJETAS DE CATEGORÍA                                 */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {filteredCategorias.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-2xl border border-dashed border-border shadow-2xs space-y-3">
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
                  className="border border-border bg-card text-foreground hover:bg-secondary rounded-xl h-9 px-3.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-9 px-4 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
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
              onSelectProduct={(prod) => handleSelectProduct(prod, cat)}
            />
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL DE CREACIÓN / EDICIÓN DE CATEGORÍA                               */}
      {/* ========================================================================= */}
      <CategoryFormDialog
        open={openModal}
        onOpenChange={setOpenModal}
        categoryToEdit={editingCategory}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
      />

      {/* ========================================================================= */}
      {/* 6. MODAL: DETALLE CENTRADO DEL PRODUCTO (ProductDetailDialog)              */}
      {/* ========================================================================= */}
      <ProductDetailDialog
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedProduct(null)
        }}
        singleProduct={singleProductForModal}
        onEdit={() => {
          if (singleProductForModal) {
            setDetailModalOpen(false)
            router.push(`/catalogo?search=${encodeURIComponent(singleProductForModal.nombreModelo)}`)
          }
        }}
        onCreateOrder={(prod) => {
          setDetailModalOpen(false)
          if (prod) {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('nova_preselected_product_id', prod.id)
            }
            router.push(`/pedidos?productoId=${prod.id}`)
          }
        }}
        formatCurrency={formatCurrency}
        calcMargen={calcMargen}
        formatFechaRegistro={formatFechaRegistro}
      />
    </div>
  )
}

// Alias para consistencia
export const CategoriesManagementView = CategoriasClient
