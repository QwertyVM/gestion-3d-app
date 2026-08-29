'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Search, 
  Package, 
  Archive, 
  RotateCcw, 
  Sparkles, 
  X,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Trash2,
  Check,
  Tag,
  ArrowRight,
  Database,
  Loader2,
  Pencil
} from 'lucide-react'
import { 
  createProducto, 
  updateProducto, 
  toggleEstadoProducto 
} from '@/actions/productos'
import { 
  createCategoria, 
  updateCategoria, 
  deleteCategoria 
} from '@/actions/categorias'
import { toast } from 'sonner'
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { SearchableCombobox, ComboboxItem } from '@/components/ui/SearchableCombobox'

export interface ProductoItem {
  id: string
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioAmigos: number
  precioMercado: number
  precioComunidad: number
  activo: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CategoriaItem {
  id: string
  nombre: string
  descripcion?: string
  totalProductos?: number
  createdAt?: string
  updatedAt?: string
}

interface CatalogoClientProps {
  productos: ProductoItem[]
  categoriasIniciales?: CategoriaItem[]
  initialTab?: 'productos' | 'categorias'
}

const ITEMS_PER_PAGE = 5

export function CatalogoClient({ 
  productos, 
  categoriasIniciales = [], 
  initialTab = 'productos' 
}: CatalogoClientProps) {
  const router = useRouter()

  // Main sub-section tab: 'productos' or 'categorias'
  const [activeTab, setActiveTab] = useState<'productos' | 'categorias'>(initialTab)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  const handleTabChange = (tab: 'productos' | 'categorias') => {
    setActiveTab(tab)
    if (tab === 'productos') {
      router.push('/catalogo')
    } else {
      router.push('/catalogo/categorias')
    }
  }

  // Products filters and view
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODOS')
  const [estadoFilter, setEstadoFilter] = useState<'TODOS' | 'ACTIVOS' | 'DESCONTINUADOS'>('TODOS')
  const [sortBy, setSortBy] = useState<'categoria' | 'nombre' | 'amigosDesc' | 'mercadoDesc' | 'comunidadDesc'>('categoria')
  const [currentPage, setCurrentPage] = useState(1)

  // Categorias state
  const [categorias, setCategorias] = useState<CategoriaItem[]>(categoriasIniciales)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatNombre, setEditingCatNombre] = useState('')
  const [editingCatDesc, setEditingCatDesc] = useState('')
  const [newCatNombre, setNewCatNombre] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [isCatSubmitting, setIsCatSubmitting] = useState(false)
  const [catSearch, setCatSearch] = useState('')

  // Quick inline category creator in product modal
  const [isQuickAddingCat, setIsQuickAddingCat] = useState(false)
  const [quickCatName, setQuickCatName] = useState('')
  const [quickCatDesc, setQuickCatDesc] = useState('')

  // Product Modals
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDetails, setOpenDetails] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<ProductoItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states for Product Create/Edit
  const [formCategoria, setFormCategoria] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formCostoBase, setFormCostoBase] = useState<string>('')
  const [formPrecioAmigos, setFormPrecioAmigos] = useState<string>('')
  const [formPrecioMercado, setFormPrecioMercado] = useState<string>('')
  const [formPrecioComunidad, setFormPrecioComunidad] = useState<string>('')
  const [formActivo, setFormActivo] = useState(true)

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Calculate profit margin percentage
  const calcMargen = (precio: number, costo: number) => {
    if (costo <= 0) return '+0%'
    const margen = ((precio - costo) / costo) * 100
    return margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`
  }

  // Extract distinct category names for select options
  const categoryNamesList = useMemo(() => {
    const set = new Set<string>()
    categorias.forEach(c => set.add(c.nombre))
    productos.forEach(p => {
      if (p.lineaCategoria) set.add(p.lineaCategoria.trim())
    })
    return Array.from(set).sort()
  }, [categorias, productos])

  const categoriasFilterComboboxItems: ComboboxItem[] = useMemo(() => {
    const allOption: ComboboxItem = {
      id: 'TODOS',
      label: 'Todas las Categorías',
      badge: `${productos.length}`
    }
    const catOptions: ComboboxItem[] = categoryNamesList.map(cat => ({
      id: cat,
      label: cat,
      icon: FolderTree,
      badge: `${productos.filter(p => p.lineaCategoria === cat).length}`
    }))
    return [allOption, ...catOptions]
  }, [categoryNamesList, productos])

  const categoriasFormComboboxItems: ComboboxItem[] = useMemo(() => {
    return categoryNamesList.map(cat => ({
      id: cat,
      label: cat,
      icon: FolderTree
    }))
  }, [categoryNamesList])

  // KPIs Products
  const totalProductsCount = productos.length
  const activeProductsCount = productos.filter(p => p.activo).length
  const discontinuedProductsCount = totalProductsCount - activeProductsCount

  // KPIs Categories
  const totalCategoriesCount = categorias.length
  const categoriesWithProductsCount = categorias.filter(c => {
    const count = productos.filter(p => p.lineaCategoria === c.nombre).length
    return count > 0
  }).length
  const emptyCategoriesCount = totalCategoriesCount - categoriesWithProductsCount

  // Filter and sort products
  const filteredProductos = useMemo(() => {
    return productos.filter(p => {
      const matchSearch = 
        p.nombreModelo.toLowerCase().includes(search.toLowerCase()) ||
        p.lineaCategoria.toLowerCase().includes(search.toLowerCase())

      const matchCat = categoriaFilter === 'TODOS' || p.lineaCategoria === categoriaFilter

      let matchEstado = true
      if (estadoFilter === 'ACTIVOS') matchEstado = p.activo
      if (estadoFilter === 'DESCONTINUADOS') matchEstado = !p.activo

      return matchSearch && matchCat && matchEstado
    }).sort((a, b) => {
      if (estadoFilter === 'TODOS' && a.activo !== b.activo) {
        return a.activo ? -1 : 1
      }

      if (sortBy === 'categoria') {
        const catCompare = a.lineaCategoria.localeCompare(b.lineaCategoria)
        if (catCompare !== 0) return catCompare
        return a.nombreModelo.localeCompare(b.nombreModelo)
      }
      if (sortBy === 'nombre') {
        return a.nombreModelo.localeCompare(b.nombreModelo)
      }
      if (sortBy === 'amigosDesc') {
        return b.precioAmigos - a.precioAmigos
      }
      if (sortBy === 'mercadoDesc') {
        return b.precioMercado - a.precioMercado
      }
      if (sortBy === 'comunidadDesc') {
        return b.precioComunidad - a.precioComunidad
      }
      return 0
    })
  }, [productos, search, categoriaFilter, estadoFilter, sortBy])

  // Filter categories
  const filteredCategorias = useMemo(() => {
    return categorias.filter(c => 
      c.nombre.toLowerCase().includes(catSearch.toLowerCase()) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(catSearch.toLowerCase()))
    )
  }, [categorias, catSearch])

  // Reset to page 1 whenever product filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoriaFilter, estadoFilter, sortBy])

  // Pagination calculation (7 items per page)
  const totalPages = Math.max(1, Math.ceil(filteredProductos.length / ITEMS_PER_PAGE))
  const paginatedProductos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProductos.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProductos, currentPage])

  // Auto-calculate suggested prices
  const handleAutoCalculatePrices = (baseCostStr: string) => {
    const base = parseFloat(baseCostStr)
    if (!isNaN(base) && base > 0) {
      setFormPrecioAmigos(Math.round(base * 1.35).toString())
      setFormPrecioMercado(Math.round(base * 1.60).toString())
      setFormPrecioComunidad(Math.round(base * 1.80).toString())
    }
  }

  // CATEGORY CRUD ACTIONS
  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatNombre.trim()) {
      toast.error('El nombre de la categoría es obligatorio')
      return
    }

    setIsCatSubmitting(true)
    try {
      const created = await createCategoria({
        nombre: newCatNombre,
        descripcion: newCatDesc,
      })
      setCategorias(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setNewCatNombre('')
      setNewCatDesc('')
      toast.success(`Categoría "${created.nombre}" guardada con éxito`)
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear la categoría')
    } finally {
      setIsCatSubmitting(false)
    }
  }

  const handleStartEditCat = (cat: CategoriaItem) => {
    setEditingCatId(cat.id)
    setEditingCatNombre(cat.nombre)
    setEditingCatDesc(cat.descripcion || '')
  }

  const handleSaveEditCat = async (id: string) => {
    if (!editingCatNombre.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    setIsCatSubmitting(true)
    try {
      const updated = await updateCategoria(id, {
        nombre: editingCatNombre,
        descripcion: editingCatDesc,
      })
      setCategorias(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
      setEditingCatId(null)
      toast.success('Categoría actualizada')
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar categoría')
    } finally {
      setIsCatSubmitting(false)
    }
  }

  const handleDeleteCat = async (id: string, nombre: string) => {
    if (confirm(`¿Deseas eliminar la categoría "${nombre}"?`)) {
      try {
        const res = await deleteCategoria(id)
        setCategorias(prev => prev.filter(c => c.id !== id))
        toast.success(res.message)
      } catch (err: any) {
        toast.error(err?.message || 'Error al eliminar categoría')
      }
    }
  }

  const handleFilterByCategoryFromTab = (catName: string) => {
    setCategoriaFilter(catName)
    setActiveTab('productos')
    router.push('/catalogo')
  }

  // Quick inline category add inside product modal
  const handleQuickAddCategory = async () => {
    if (!quickCatName.trim()) return
    try {
      const created = await createCategoria({ 
        nombre: quickCatName,
        descripcion: quickCatDesc || undefined
      })
      setCategorias(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setFormCategoria(created.nombre)
      setQuickCatName('')
      setQuickCatDesc('')
      setIsQuickAddingCat(false)
      toast.success(`Categoría "${created.nombre}" creada y seleccionada`)
    } catch (err: any) {
      toast.error(err?.message || 'Error al agregar categoría')
    }
  }

  const handleOpenCreate = () => {
    setFormCategoria(categoryNamesList[0] || 'JUEGOS DE MESA')
    setFormNombre('')
    setFormCostoBase('')
    setFormPrecioAmigos('')
    setFormPrecioMercado('')
    setFormPrecioComunidad('')
    setFormActivo(true)
    setIsQuickAddingCat(false)
    setOpenCreate(true)
  }

  const handleOpenDetails = (prod: ProductoItem) => {
    setSelectedProducto(prod)
    setOpenDetails(true)
  }

  const handleOpenEdit = (prod: ProductoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedProducto(prod)
    setFormCategoria(prod.lineaCategoria)
    setFormNombre(prod.nombreModelo)
    setFormCostoBase(prod.costoBase.toString())
    setFormPrecioAmigos(prod.precioAmigos.toString())
    setFormPrecioMercado(prod.precioMercado.toString())
    setFormPrecioComunidad(prod.precioComunidad.toString())
    setFormActivo(prod.activo)
    setIsQuickAddingCat(false)
    setOpenDetails(false)
    setOpenEdit(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNombre.trim() || !formCategoria.trim() || !formCostoBase) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      await createProducto({
        lineaCategoria: formCategoria,
        nombreModelo: formNombre,
        costoBase: parseFloat(formCostoBase) || 0,
        precioAmigos: parseFloat(formPrecioAmigos) || 0,
        precioMercado: parseFloat(formPrecioMercado) || 0,
        precioComunidad: parseFloat(formPrecioComunidad) || 0,
        activo: formActivo,
      })
      toast.success('Producto creado con éxito')
      setOpenCreate(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || 'Error al crear producto (verifica que el nombre no esté duplicado)')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProducto) return

    setIsSubmitting(true)
    try {
      await updateProducto(selectedProducto.id, {
        lineaCategoria: formCategoria,
        nombreModelo: formNombre,
        costoBase: parseFloat(formCostoBase) || 0,
        precioAmigos: parseFloat(formPrecioAmigos) || 0,
        precioMercado: parseFloat(formPrecioMercado) || 0,
        precioComunidad: parseFloat(formPrecioComunidad) || 0,
        activo: formActivo,
      })
      toast.success('Producto actualizado con éxito')
      setOpenEdit(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || 'Error al actualizar producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleEstado = async (id: string, currentlyActive: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      await toggleEstadoProducto(id)
      if (selectedProducto && selectedProducto.id === id) {
        setSelectedProducto(prev => prev ? { ...prev, activo: !currentlyActive } : null)
      }
      toast.success(currentlyActive ? 'Producto marcado como Descontinuado' : 'Producto Reactivado')
      router.refresh()
    } catch (error) {
      toast.error('Error al cambiar el estado del producto')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm">
              {activeTab === 'productos' ? (
                <Package className="h-6 w-6 stroke-[2.5]" />
              ) : (
                <FolderTree className="h-6 w-6 stroke-[2.5]" />
              )}
            </div>
            {activeTab === 'productos' ? 'Catálogo de Productos' : 'Gestión de Categorías'}
          </h1>
          <p className="text-sm text-[#75695D] mt-1">
            {activeTab === 'productos' 
              ? 'Modelos 3D disponibles con costos base, precios escalonados y control de estado.' 
              : 'Estructura de clasificación de productos sincronizada en base de datos.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'productos' ? (
            <>
              <Link href="/catalogo/categorias">
                <Button variant="outline" className="border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#F4EFEA] hover:border-[#DCD3C6] cursor-pointer rounded-xl text-xs h-10 shadow-sm font-medium">
                  <FolderTree className="h-4 w-4 mr-1.5 text-[#A36F4C]" />
                  Gestionar Categorías
                </Button>
              </Link>

              <Button 
                onClick={handleOpenCreate}
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-[#FFFFFF] font-bold shadow-md shadow-[#A36F4C]/20 transition-all cursor-pointer rounded-xl px-4 py-2.5 text-xs h-10 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
                Nuevo Producto
              </Button>
            </>
          ) : (
            <Link href="/catalogo">
              <Button variant="outline" className="border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#F4EFEA] hover:border-[#DCD3C6] cursor-pointer rounded-xl text-xs h-10 shadow-sm font-medium">
                <Package className="h-4 w-4 mr-1.5 text-[#A36F4C]" />
                Ver Productos
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBSECTION 1: PRODUCTOS                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'productos' && (
        <div className="space-y-6">
          {/* KPI Stats Chips Light Mode */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A36F4C] flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Total Modelos
              </span>
              <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">{totalProductsCount}</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1E5E3A] animate-pulse"></span>
                Activos en Venta
              </span>
              <div className="text-2xl font-extrabold text-[#1E5E3A] font-mono mt-1">{activeProductsCount}</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#75695D] flex items-center gap-1.5">
                <Archive className="h-3.5 w-3.5" />
                Descontinuados
              </span>
              <div className="text-2xl font-extrabold text-[#75695D] font-mono mt-1">{discontinuedProductsCount}</div>
            </div>

            <div 
              onClick={() => router.push('/catalogo/categorias')}
              className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm cursor-pointer hover:border-[#A36F4C] hover:bg-[#FDFBF7] transition-all group"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#633E20] flex items-center justify-between">
                Categorías
                <ArrowRight className="h-3.5 w-3.5 text-[#A36F4C] group-hover:translate-x-0.5 transition-transform" />
              </span>
              <div className="text-2xl font-extrabold text-[#A36F4C] font-mono mt-1">{totalCategoriesCount}</div>
            </div>
          </div>

          {/* 1-Row Compact Filter Toolbar */}
          <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Lado Izquierdo: Campo de Búsqueda */}
            <div className="relative w-full md:w-72 lg:w-80 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
              <Input 
                placeholder="Buscar modelo o categoría..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs md:text-sm rounded-xl h-9 focus:border-[#A36F4C] focus:ring-1 focus:ring-[#A36F4C] focus:bg-[#FFFFFF] transition-all"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-0.5 rounded cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Lado Derecho: Controles y Selectores */}
            <div className="flex flex-wrap md:flex-nowrap items-center justify-end gap-2.5 w-full md:w-auto">
              {/* Category Combobox */}
              <div className="w-full sm:w-56 flex-shrink-0">
                <SearchableCombobox
                  items={categoriasFilterComboboxItems}
                  value={categoriaFilter}
                  onChange={(val) => setCategoriaFilter(val || 'TODOS')}
                  size="sm"
                  icon={FolderTree}
                  placeholder="Todas las Categorías"
                  searchPlaceholder="Buscar categoría..."
                  clearable={false}
                  className="w-full"
                />
              </div>

              {/* Sort Dropdown */}
              <select 
                className="bg-[#F4EFEA] border border-[#E2D9CC] text-[#241C15] rounded-xl px-3 py-1.5 text-xs font-medium focus:border-[#A36F4C] focus:ring-1 focus:ring-[#A36F4C] cursor-pointer outline-none h-9 shadow-sm hidden lg:block"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
              >
                <option value="categoria">Ordenar: Categoría</option>
                <option value="nombre">Ordenar: Nombre (A-Z)</option>
                <option value="amigosDesc">P. Amigos: Mayor a Menor</option>
                <option value="mercadoDesc">P. Mercado: Mayor a Menor</option>
                <option value="comunidadDesc">P. Comunidad: Mayor a Menor</option>
              </select>

              {/* Status Tabs Pills */}
              <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC]">
                <button
                  onClick={() => setEstadoFilter('TODOS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    estadoFilter === 'TODOS'
                      ? 'bg-[#A36F4C] text-white font-bold shadow-sm'
                      : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setEstadoFilter('ACTIVOS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    estadoFilter === 'ACTIVOS'
                      ? 'bg-[#1E5E3A] text-white font-bold shadow-sm'
                      : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
                  }`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setEstadoFilter('DESCONTINUADOS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    estadoFilter === 'DESCONTINUADOS'
                      ? 'bg-[#75695D] text-white font-bold shadow-sm'
                      : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
                  }`}
                >
                  Descontinuados
                </button>
              </div>
            </div>
          </div>

          {/* Main Table View (Light Mode NOVA) */}
          {filteredProductos.length === 0 ? (
            <Card className="bg-[#FFFFFF] border-[#E2D9CC] p-12 text-center rounded-2xl shadow-sm">
              <div className="flex flex-col items-center justify-center space-y-3">
                <Package className="h-12 w-12 text-[#A89B8D]" />
                <h3 className="text-lg font-bold text-[#241C15]">No se encontraron productos</h3>
                <p className="text-sm text-[#75695D] max-w-sm">
                  {search || categoriaFilter !== 'TODOS' || estadoFilter !== 'TODOS'
                    ? 'Prueba ajustando los filtros de búsqueda para ver más resultados.'
                    : 'Comienza agregando tu primer producto al catálogo.'}
                </p>
                <Button 
                  onClick={handleOpenCreate}
                  className="mt-2 bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="bg-[#FFFFFF] border-[#E2D9CC] overflow-hidden shadow-md rounded-2xl">
              <div className="overflow-x-auto scrollbar-thin">
                <Table className="w-full min-w-[650px]">
                  <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
                  <TableRow className="border-[#E2D9CC] hover:bg-transparent">
                    <TableHead className="text-[#241C15] font-bold px-4 py-3 text-left">Producto / Modelo</TableHead>
                    <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left hidden sm:table-cell">Categoría</TableHead>
                    <TableHead className="text-[#241C15] font-bold px-3 py-3 text-center">Estado</TableHead>
                    <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">P. Amigos</TableHead>
                    <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">P. Mercado</TableHead>
                    <TableHead className="text-[#241C15] font-bold px-4 py-3 text-right">P. Comunidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProductos.map((p) => {
                    const isDiscontinued = !p.activo

                    return (
                      <TableRow 
                        key={p.id} 
                        onClick={() => handleOpenDetails(p)}
                        className={`border-[#E2D9CC]/70 transition-colors cursor-pointer group ${
                          isDiscontinued 
                            ? 'bg-[#FDFBF7]/50 opacity-70 hover:opacity-100 hover:bg-[#FDFBF7]' 
                            : 'hover:bg-[#FDFBF7]'
                        }`}
                      >
                        {/* Modelo & mobile category */}
                        <TableCell className="font-medium text-[#241C15] px-4 py-3">
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold transition-colors ${
                              isDiscontinued 
                                ? 'line-through text-[#75695D]' 
                                : 'text-[#241C15] group-hover:text-[#A36F4C]'
                            }`}>
                              {p.nombreModelo}
                            </span>
                            <span className="sm:hidden text-[11px] text-[#75695D] mt-0.5">
                              {p.lineaCategoria}
                            </span>
                          </div>
                        </TableCell>

                        {/* Categoría (Desktop) */}
                        <TableCell className="px-3 py-3 hidden sm:table-cell">
                          <Badge variant="outline" className="text-[#633E20] border-[#D4BEA7] bg-[#EFE5D8] text-xs font-semibold truncate max-w-[170px]">
                            {p.lineaCategoria}
                          </Badge>
                        </TableCell>

                        {/* Estado */}
                        <TableCell className="text-center px-3 py-3 whitespace-nowrap">
                          {p.activo ? (
                            <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs gap-1 inline-flex items-center px-2 py-0.5 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1E5E3A]"></span>
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-[#F4EFEA] text-[#75695D] border-[#E2D9CC] text-xs gap-1 inline-flex items-center px-2 py-0.5 font-medium">
                              <Archive className="w-3 h-3" />
                              Descontinuado
                            </Badge>
                          )}
                        </TableCell>

                        {/* 1. Precio Amigos */}
                        <TableCell className="text-right px-3 py-3 whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-[#1E5E3A] text-sm font-mono">
                              {formatCurrency(p.precioAmigos)}
                            </span>
                            <span className="text-[10px] text-[#1E5E3A]/80 font-medium">
                              {calcMargen(p.precioAmigos, p.costoBase)} ganancia
                            </span>
                          </div>
                        </TableCell>

                        {/* 2. Precio Mercado */}
                        <TableCell className="text-right px-3 py-3 whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-[#944917] text-sm font-mono">
                              {formatCurrency(p.precioMercado)}
                            </span>
                            <span className="text-[10px] text-[#944917]/80 font-medium">
                              {calcMargen(p.precioMercado, p.costoBase)} ganancia
                            </span>
                          </div>
                        </TableCell>

                        {/* 3. Precio Comunidad */}
                        <TableCell className="text-right px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-[#A36F4C] text-sm font-mono">
                              {formatCurrency(p.precioComunidad)}
                            </span>
                            <span className="text-[10px] text-[#A36F4C]/80 font-medium">
                              {calcMargen(p.precioComunidad, p.costoBase)} ganancia
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              </div>

              {/* Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E2D9CC] bg-[#F4EFEA] text-xs text-[#75695D]">
                <div>
                  Mostrando página <span className="text-[#241C15] font-bold">{currentPage}</span> de <span className="text-[#241C15] font-bold">{totalPages}</span> ({filteredProductos.length} modelos)
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentPage === page
                              ? 'bg-[#A36F4C] text-white shadow-sm'
                              : 'bg-[#FFFFFF] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC]'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer shadow-sm"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBSECTION 2: GESTIÓN DE CATEGORÍAS (CRUD COMPLETO EN BD)               */}
      {/* ========================================================================= */}
      {activeTab === 'categorias' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Categories KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A36F4C] flex items-center gap-2">
                <Database className="h-4 w-4" />
                Categorías Registradas
              </span>
              <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">{totalCategoriesCount}</div>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A] flex items-center gap-2">
                <Package className="h-4 w-4" />
                Con Productos Asignados
              </span>
              <div className="text-2xl font-extrabold text-[#1E5E3A] font-mono mt-1">{categoriesWithProductsCount}</div>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#75695D] flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categorías Sin Modelos
              </span>
              <div className="text-2xl font-extrabold text-[#75695D] font-mono mt-1">{emptyCategoriesCount}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 items-start">
            {/* Column 1: Create Category Card Form */}
            <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-[#241C15]">
                  <Plus className="h-5 w-5 text-[#A36F4C]" />
                  Nueva Categoría
                </CardTitle>
                <CardDescription className="text-xs text-[#75695D]">
                  Registra una nueva categoría directamente en la base de datos para organizar tus modelos 3D.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCategoria} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">
                      Nombre de la Categoría *
                    </Label>
                    <Input 
                      placeholder="Ej: Joyería & Moda"
                      value={newCatNombre}
                      onChange={(e) => setNewCatNombre(e.target.value)}
                      required
                      className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">
                      Descripción (Opcional)
                    </Label>
                    <Input 
                      placeholder="Ej: Anillos, dijes y accesorios 3D"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isCatSubmitting || !newCatNombre.trim()}
                    className="w-full bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold rounded-xl shadow-md shadow-[#A36F4C]/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2 stroke-[2.5]" />
                    {isCatSubmitting ? 'Guardando en BD...' : 'Guardar Categoría en BD'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Column 2 & 3: Categories List and Table */}
            <Card className="lg:col-span-2 bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FDFBF7] border-b border-[#E2D9CC]">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-[#241C15]">
                    <FolderTree className="h-5 w-5 text-[#A36F4C]" />
                    Listado de Categorías
                  </CardTitle>
                  <CardDescription className="text-xs text-[#75695D]">
                    Edita el nombre de las categorías o elimínalas si no tienen productos asociados.
                  </CardDescription>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#75695D]" />
                  <Input 
                    placeholder="Filtrar categorías..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    className="pl-8 h-9 bg-[#F4EFEA] border-[#DCD3C6] text-xs text-[#241C15] placeholder:text-[#75695D] rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                  />
                  {catSearch && (
                    <button 
                      onClick={() => setCatSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredCategorias.length === 0 ? (
                  <div className="p-10 text-center text-[#75695D]">
                    No se encontraron categorías registradas.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2D9CC]/70 max-h-[360px] overflow-y-auto">
                    {filteredCategorias.map((cat) => {
                      const isEditing = editingCatId === cat.id
                      const prodCount = productos.filter(p => p.lineaCategoria === cat.nombre).length

                      return (
                        <div key={cat.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FDFBF7] transition-colors">
                          {isEditing ? (
                            <div className="flex-1 grid sm:grid-cols-2 gap-2">
                              <Input 
                                value={editingCatNombre}
                                onChange={(e) => setEditingCatNombre(e.target.value)}
                                placeholder="Nombre de categoría"
                                className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] text-xs h-9 rounded-xl focus:border-[#A36F4C]"
                                autoFocus
                              />
                              <Input 
                                value={editingCatDesc}
                                onChange={(e) => setEditingCatDesc(e.target.value)}
                                placeholder="Descripción (opcional)"
                                className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] text-xs h-9 rounded-xl focus:border-[#A36F4C]"
                              />
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-[#241C15]">
                                  {cat.nombre}
                                </span>
                                <button
                                  onClick={() => handleFilterByCategoryFromTab(cat.nombre)}
                                  className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors flex items-center gap-1 font-semibold cursor-pointer ${
                                    prodCount > 0 
                                      ? 'bg-[#EFE5D8] border-[#D4BEA7] text-[#633E20] hover:bg-[#EAE4DC]' 
                                      : 'bg-[#F4EFEA] border-[#E2D9CC] text-[#75695D]'
                                  }`}
                                  title="Ver productos en el catálogo"
                                >
                                  <span>{prodCount} {prodCount === 1 ? 'modelo' : 'modelos'}</span>
                                  {prodCount > 0 && <ArrowRight className="h-2.5 w-2.5" />}
                                </button>
                              </div>
                              {cat.descripcion && (
                                <p className="text-xs text-[#75695D] mt-1">
                                  {cat.descripcion}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingCatId(null)}
                                  className="h-8 px-2.5 text-[#75695D] hover:text-[#241C15] text-xs rounded-xl cursor-pointer"
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEditCat(cat.id)}
                                  disabled={isCatSubmitting || !editingCatNombre.trim()}
                                  className="h-8 px-3 bg-[#1E5E3A] hover:bg-[#16472C] text-white text-xs font-bold rounded-xl cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  Guardar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartEditCat(cat)}
                                  className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#F4EFEA] hover:border-[#DCD3C6] text-xs rounded-xl cursor-pointer font-medium"
                                >
                                  <Pencil className="h-3 w-3 mr-1 text-[#A36F4C]" />
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteCat(cat.id, cat.nombre)}
                                  disabled={prodCount > 0}
                                  className={`h-8 px-2.5 text-xs transition-colors rounded-xl cursor-pointer ${
                                    prodCount > 0 
                                      ? 'text-[#A89B8D] cursor-not-allowed opacity-40' 
                                      : 'text-[#A34335] hover:text-red-700 hover:bg-red-50 font-medium'
                                  }`}
                                  title={prodCount > 0 ? `Tiene ${prodCount} producto(s) asignado(s)` : 'Eliminar categoría'}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Eliminar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VER DETALLE DEL PRODUCTO (LIGHT MODE NOVA)                         */}
      {/* ========================================================================= */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] sm:max-w-[560px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          {selectedProducto && (
            <>
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[#A36F4C] shadow-sm">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-[#633E20] border-[#D4BEA7] bg-[#EFE5D8] text-[10px] font-semibold">
                        {selectedProducto.lineaCategoria}
                      </Badge>
                      {selectedProducto.activo ? (
                        <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] gap-1 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E5E3A]"></span>
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-[#F4EFEA] text-[#75695D] border-[#E2D9CC] text-[10px]">
                          <Archive className="w-2.5 h-2.5" />
                          Descontinuado
                        </Badge>
                      )}
                    </div>
                    <DialogTitle className="text-lg font-bold text-[#241C15] tracking-tight">
                      {selectedProducto.nombreModelo}
                    </DialogTitle>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenDetails(false)}
                  className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Costo Base Hero Box */}
                <div className="p-4 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#75695D] font-bold">Costo Base de Fabricación</span>
                    <p className="text-[11px] text-[#75695D] mt-0.5">Filamento, energía y depreciación estimada</p>
                  </div>
                  <div className="text-2xl font-extrabold text-[#241C15] font-mono">
                    {formatCurrency(selectedProducto.costoBase)}
                  </div>
                </div>

                {/* Precios & Márgenes */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#75695D]">
                    Estructura de Precios y Márgenes
                  </span>

                  {/* 1. Amigos */}
                  {(() => {
                    const ganancia = selectedProducto.precioAmigos - selectedProducto.costoBase
                    const margen = selectedProducto.costoBase > 0 ? (ganancia / selectedProducto.costoBase) * 100 : 0
                    return (
                      <div className="p-3 rounded-xl bg-[#F4EFEA] border border-[#E2D9CC] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1E5E3A]"></span>
                          <div>
                            <span className="text-xs font-bold text-[#1E5E3A]">Precio Amigos</span>
                            <span className="block text-[11px] text-[#75695D]">
                              Ganancia: +{formatCurrency(ganancia)} ({margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`})
                            </span>
                          </div>
                        </div>
                        <span className="text-base font-bold text-[#1E5E3A] font-mono">
                          {formatCurrency(selectedProducto.precioAmigos)}
                        </span>
                      </div>
                    )
                  })()}

                  {/* 2. Mercado */}
                  {(() => {
                    const ganancia = selectedProducto.precioMercado - selectedProducto.costoBase
                    const margen = selectedProducto.costoBase > 0 ? (ganancia / selectedProducto.costoBase) * 100 : 0
                    return (
                      <div className="p-3 rounded-xl bg-[#F4EFEA] border border-[#E2D9CC] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#944917]"></span>
                          <div>
                            <span className="text-xs font-bold text-[#944917]">Precio Mercado</span>
                            <span className="block text-[11px] text-[#75695D]">
                              Ganancia: +{formatCurrency(ganancia)} ({margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`})
                            </span>
                          </div>
                        </div>
                        <span className="text-base font-bold text-[#944917] font-mono">
                          {formatCurrency(selectedProducto.precioMercado)}
                        </span>
                      </div>
                    )
                  })()}

                  {/* 3. Comunidad */}
                  {(() => {
                    const ganancia = selectedProducto.precioComunidad - selectedProducto.costoBase
                    const margen = selectedProducto.costoBase > 0 ? (ganancia / selectedProducto.costoBase) * 100 : 0
                    return (
                      <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#D4BEA7] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#A36F4C]"></span>
                          <div>
                            <span className="text-xs font-bold text-[#A36F4C]">Precio Comunidad</span>
                            <span className="block text-[11px] text-[#75695D]">
                              Ganancia: +{formatCurrency(ganancia)} ({margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`})
                            </span>
                          </div>
                        </div>
                        <span className="text-base font-extrabold text-[#A36F4C] font-mono">
                          {formatCurrency(selectedProducto.precioComunidad)}
                        </span>
                      </div>
                    )
                  })()}
                </div>

                {/* Quick actions inside Detail Modal */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E2D9CC]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleEstado(selectedProducto.id, selectedProducto.activo)}
                    className={`border-[#E2D9CC] text-xs rounded-xl cursor-pointer font-medium ${
                      selectedProducto.activo 
                        ? 'text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA]' 
                        : 'text-[#1E5E3A] hover:text-[#16472C] hover:bg-emerald-50'
                    }`}
                  >
                    {selectedProducto.activo ? (
                      <>
                        <Archive className="h-3.5 w-3.5 mr-1.5" />
                        Descontinuar Producto
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Reactivar Producto
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button 
                      type="button"
                      variant="ghost"
                      onClick={() => setOpenDetails(false)}
                      className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs rounded-xl cursor-pointer"
                    >
                      Cerrar
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => handleOpenEdit(selectedProducto)}
                      className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white text-xs font-bold rounded-xl shadow-md shadow-[#A36F4C]/20 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Editar Producto
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: NUEVO PRODUCTO (LIGHT MODE NOVA)                                   */}
      {/* ========================================================================= */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] sm:max-w-[540px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[#A36F4C] shadow-sm">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#241C15] tracking-tight">
                  Nuevo Producto en Catálogo
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                  Registra un modelo 3D con sus costos base y precios de venta.
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenCreate(false)}
              className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            {/* Categoría Selector with Quick Add */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">
                  Línea / Categoría *
                </Label>
                <button
                  type="button"
                  onClick={() => setIsQuickAddingCat(!isQuickAddingCat)}
                  className="text-xs text-[#A36F4C] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  {isQuickAddingCat ? 'Elegir existente' : 'Crear nueva categoría'}
                </button>
              </div>

              {isQuickAddingCat ? (
                <div className="p-3 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#75695D] font-medium">Nombre de la nueva categoría *</Label>
                    <Input 
                      value={quickCatName}
                      onChange={(e) => setQuickCatName(e.target.value)}
                      placeholder="Ej: Joyería & Accesorios..."
                      className="h-9 bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] text-xs rounded-xl focus:border-[#A36F4C]"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button 
                      type="button" 
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsQuickAddingCat(false)}
                      className="h-8 px-2.5 text-[#75695D] text-xs rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={handleQuickAddCategory}
                      disabled={!quickCatName.trim()}
                      className="h-8 px-3 bg-[#A36F4C] hover:bg-[#8E5E3E] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                    >
                      Guardar en BD
                    </Button>
                  </div>
                </div>
              ) : (
                <SearchableCombobox
                  items={categoriasFormComboboxItems}
                  value={formCategoria}
                  onChange={(val) => setFormCategoria(val)}
                  allowCustomInput={true}
                  customCreateLabel="Crear categoría:"
                  placeholder="Seleccionar o escribir categoría..."
                  searchPlaceholder="Buscar categoría..."
                  icon={FolderTree}
                  inputClassName="bg-[#F4EFEA]"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">
                Nombre del Modelo / Producto *
              </Label>
              <Input 
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej: Inserto Catan 3D (5 Placas)"
                required
                className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
              />
            </div>

            {/* Costo Base & Auto-calculate Button */}
            <div className="space-y-1.5 pt-2 border-t border-[#E2D9CC]">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">
                  Costo Base de Fabricación (S/) *
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAutoCalculatePrices(formCostoBase)}
                  disabled={!formCostoBase || parseFloat(formCostoBase) <= 0}
                  className="h-6 text-xs text-[#A36F4C] font-semibold hover:underline p-0 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Sugerir Precios
                </Button>
              </div>
              <div className="relative flex items-center w-full">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCostoBase}
                  onChange={(e) => {
                    setFormCostoBase(e.target.value)
                    if (!formPrecioAmigos && !formPrecioMercado && !formPrecioComunidad) {
                      handleAutoCalculatePrices(e.target.value)
                    }
                  }}
                  placeholder="0.00"
                  required
                  className="pl-10 bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] font-mono font-bold text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>

            {/* Price Tiers Grid: 1. Amigos, 2. Mercado, 3. Comunidad */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#1E5E3A] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E5E3A]"></span>
                  P. Amigos
                </Label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrecioAmigos}
                    onChange={(e) => setFormPrecioAmigos(e.target.value)}
                    placeholder="0.00"
                    required
                    className="pl-8 bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono font-bold text-sm rounded-xl focus:border-[#A36F4C]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#944917] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#944917]"></span>
                  P. Mercado
                </Label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrecioMercado}
                    onChange={(e) => setFormPrecioMercado(e.target.value)}
                    placeholder="0.00"
                    required
                    className="pl-8 bg-[#F4EFEA] border-[#DCD3C6] text-[#944917] font-mono font-bold text-sm rounded-xl focus:border-[#A36F4C]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#A36F4C] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A36F4C]"></span>
                  P. Comunidad
                </Label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrecioComunidad}
                    onChange={(e) => setFormPrecioComunidad(e.target.value)}
                    placeholder="0.00"
                    required
                    className="pl-8 bg-[#F4EFEA] border-[#DCD3C6] text-[#A36F4C] font-mono font-bold text-sm rounded-xl focus:border-[#A36F4C]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 text-xs text-[#241C15] font-medium cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="rounded border-[#DCD3C6] text-[#A36F4C] focus:ring-[#A36F4C]"
                />
                Producto activo disponible para ventas
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2D9CC]">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenCreate(false)}
                className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2 rounded-xl cursor-pointer font-medium"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#A36F4C]/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Producto'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR PRODUCTO (LIGHT MODE NOVA)                                  */}
      {/* ========================================================================= */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] sm:max-w-[540px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[#A36F4C] shadow-sm">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#241C15] tracking-tight">
                  Editar Producto
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                  Actualiza los datos del modelo, categoría o estructura de precios.
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenEdit(false)}
              className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
            {/* Categoría Selector with Quick Add */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">
                  Línea / Categoría *
                </Label>
                <button
                  type="button"
                  onClick={() => setIsQuickAddingCat(!isQuickAddingCat)}
                  className="text-xs text-[#A36F4C] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  {isQuickAddingCat ? 'Elegir existente' : 'Crear nueva categoría'}
                </button>
              </div>

              {isQuickAddingCat ? (
                <div className="p-3 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#75695D] font-medium">Nombre de la nueva categoría *</Label>
                    <Input 
                      value={quickCatName}
                      onChange={(e) => setQuickCatName(e.target.value)}
                      placeholder="Ej: Joyería & Accesorios..."
                      className="h-9 bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] text-xs rounded-xl focus:border-[#A36F4C]"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsQuickAddingCat(false)}
                      className="h-8 px-2.5 text-[#75695D] text-xs rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={handleQuickAddCategory}
                      disabled={!quickCatName.trim()}
                      className="h-8 px-3 bg-[#A36F4C] hover:bg-[#8E5E3E] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                    >
                      Guardar en BD
                    </Button>
                  </div>
                </div>
              ) : (
                <SearchableCombobox
                  items={categoriasFormComboboxItems}
                  value={formCategoria}
                  onChange={(val) => setFormCategoria(val)}
                  allowCustomInput={true}
                  customCreateLabel="Crear categoría:"
                  placeholder="Seleccionar o escribir categoría..."
                  searchPlaceholder="Buscar categoría..."
                  icon={FolderTree}
                  inputClassName="bg-[#F4EFEA]"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">
                Nombre del Modelo / Producto *
              </Label>
              <Input 
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                required
                className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#E2D9CC]">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">
                  Costo Base de Fabricación (S/) *
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAutoCalculatePrices(formCostoBase)}
                  disabled={!formCostoBase || parseFloat(formCostoBase) <= 0}
                  className="h-6 text-xs text-[#A36F4C] font-semibold hover:underline p-0 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Recalcular Sugeridos
                </Button>
              </div>
              <div className="relative flex items-center w-full">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCostoBase}
                  onChange={(e) => setFormCostoBase(e.target.value)}
                  required
                  className="pl-10 bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] font-mono font-bold text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>

            {/* Price Tiers Grid */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#1E5E3A] font-bold">P. Amigos</Label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrecioAmigos}
                    onChange={(e) => setFormPrecioAmigos(e.target.value)}
                    required
                    className="pl-8 bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono font-bold text-sm rounded-xl focus:border-[#A36F4C]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#944917] font-bold">P. Mercado</Label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrecioMercado}
                    onChange={(e) => setFormPrecioMercado(e.target.value)}
                    required
                    className="pl-8 bg-[#F4EFEA] border-[#DCD3C6] text-[#944917] font-mono font-bold text-sm rounded-xl focus:border-[#A36F4C]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#A36F4C] font-bold">P. Comunidad</Label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrecioComunidad}
                    onChange={(e) => setFormPrecioComunidad(e.target.value)}
                    required
                    className="pl-8 bg-[#F4EFEA] border-[#DCD3C6] text-[#A36F4C] font-mono font-bold text-sm rounded-xl focus:border-[#A36F4C]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 text-xs text-[#241C15] font-medium cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="rounded border-[#DCD3C6] text-[#A36F4C] focus:ring-[#A36F4C]"
                />
                Producto activo disponible para ventas
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2D9CC]">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenEdit(false)}
                className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2 rounded-xl cursor-pointer font-medium"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#A36F4C]/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
