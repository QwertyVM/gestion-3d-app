'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Edit2, 
  Search, 
  Package, 
  Archive, 
  RotateCcw, 
  LayoutList, 
  LayoutGrid, 
  Sparkles, 
  X,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Trash2,
  Check,
  Tag,
  ArrowRight,
  Database
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
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'

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

const ITEMS_PER_PAGE = 7

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
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

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

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

  // Auto-calculate suggested prices: Amigos, Mercado, Comunidad
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
      toast.success(`Categoría "${created.nombre}" guardada en la base de datos`)
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
      toast.success('Categoría actualizada en la base de datos')
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar categoría')
    } finally {
      setIsCatSubmitting(false)
    }
  }

  const handleDeleteCat = async (id: string, nombre: string) => {
    if (confirm(`¿Deseas eliminar la categoría "${nombre}" de la base de datos?`)) {
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
    } catch (error) {
      toast.error('Error al cambiar el estado del producto')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            {activeTab === 'productos' ? (
              <>
                <Package className="h-8 w-8 text-blue-500" />
                Catálogo de Productos
              </>
            ) : (
              <>
                <FolderTree className="h-8 w-8 text-blue-500" />
                Categorías del Catálogo
              </>
            )}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {activeTab === 'productos' 
              ? 'Haz clic en cualquier fila para ver información y costos del producto.' 
              : 'Administración de categorías persistidas en la base de datos.'}
          </p>
        </div>

        {activeTab === 'productos' && (
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUBSECTION 1: PRODUCTOS                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'productos' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* KPI Stats Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 backdrop-blur-md">
              <span className="text-xs font-medium text-zinc-400">Total Productos</span>
              <div className="text-2xl font-bold text-white mt-0.5">{totalProductsCount}</div>
            </div>
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 backdrop-blur-md">
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Activos
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-0.5">{activeProductsCount}</div>
            </div>
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 backdrop-blur-md">
              <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" />
                Descontinuados
              </span>
              <div className="text-2xl font-bold text-amber-400 mt-0.5">{discontinuedProductsCount}</div>
            </div>
            <div 
              onClick={() => handleTabChange('categorias')}
              className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 backdrop-blur-md cursor-pointer hover:border-blue-500/50 transition-colors"
            >
              <span className="text-xs font-medium text-blue-400 flex items-center justify-between">
                Categorías
                <span className="text-[10px] text-zinc-500">Ver categorías ➔</span>
              </span>
              <div className="text-2xl font-bold text-blue-400 mt-0.5">{totalCategoriesCount}</div>
            </div>
          </div>

          {/* Filters Toolbar */}
          <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input 
                    placeholder="Buscar por modelo o categoría..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-zinc-900/80 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-blue-500/50"
                  />
                  {search && (
                    <button 
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Category dropdown & Sorting */}
                <div className="flex flex-wrap items-center gap-3">
                  <select 
                    className="bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    value={categoriaFilter}
                    onChange={(e) => setCategoriaFilter(e.target.value)}
                  >
                    <option value="TODOS">Todas las Categorías ({totalProductsCount})</option>
                    {categoryNamesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select 
                    className="bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                  >
                    <option value="categoria">Ordenar por: Categoría</option>
                    <option value="nombre">Ordenar por: Nombre (A-Z)</option>
                    <option value="amigosDesc">Precio Amigos: Mayor a Menor</option>
                    <option value="mercadoDesc">Precio Mercado: Mayor a Menor</option>
                    <option value="comunidadDesc">Precio Comunidad: Mayor a Menor</option>
                  </select>

                  {/* View mode toggle */}
                  <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                    <Button 
                      type="button"
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-7 px-2.5 ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                      title="Vista en Lista"
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                    <Button 
                      type="button"
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-7 px-2.5 ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                      title="Vista en Tarjetas"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Status Tabs Pills */}
              <div className="flex items-center gap-2 pt-1 border-t border-zinc-900">
                <span className="text-xs text-zinc-500 mr-1 font-medium">Estado:</span>
                <button
                  onClick={() => setEstadoFilter('TODOS')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    estadoFilter === 'TODOS'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
                  }`}
                >
                  Todos ({totalProductsCount})
                </button>
                <button
                  onClick={() => setEstadoFilter('ACTIVOS')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    estadoFilter === 'ACTIVOS'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Activos ({activeProductsCount})
                </button>
                <button
                  onClick={() => setEstadoFilter('DESCONTINUADOS')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    estadoFilter === 'DESCONTINUADOS'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
                  }`}
                >
                  <Archive className="w-3 h-3" />
                  Descontinuados ({discontinuedProductsCount})
                </button>

                {(search || categoriaFilter !== 'TODOS' || estadoFilter !== 'TODOS') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch('')
                      setCategoriaFilter('TODOS')
                      setEstadoFilter('TODOS')
                    }}
                    className="ml-auto text-xs text-zinc-400 hover:text-zinc-200 h-7"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main View: List or Grid */}
          {filteredProductos.length === 0 ? (
            <Card className="bg-zinc-950/40 border-zinc-800/60 p-12 text-center">
              <div className="flex flex-col items-center justify-center space-y-3">
                <Package className="h-12 w-12 text-zinc-600" />
                <h3 className="text-lg font-medium text-zinc-300">No se encontraron productos</h3>
                <p className="text-sm text-zinc-500 max-w-sm">
                  {search || categoriaFilter !== 'TODOS' || estadoFilter !== 'TODOS'
                    ? 'Prueba ajustando los filtros de búsqueda para ver más resultados.'
                    : 'Comienza agregando tu primer producto al catálogo.'}
                </p>
                <Button 
                  onClick={handleOpenCreate}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>
            </Card>
          ) : viewMode === 'list' ? (
            /* COMPACT TABLE (No horizontal scroll, 7 items per page) */
            <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-zinc-900/70 border-b border-zinc-800">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-left">Producto / Modelo</TableHead>
                    <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left hidden sm:table-cell">Categoría</TableHead>
                    <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center">Estado</TableHead>
                    <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right">P. Amigos</TableHead>
                    <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right">P. Mercado</TableHead>
                    <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-right">P. Comunidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProductos.map((p) => {
                    const isDiscontinued = !p.activo

                    return (
                      <TableRow 
                        key={p.id} 
                        onClick={() => handleOpenDetails(p)}
                        className={`border-zinc-800/60 transition-colors cursor-pointer group ${
                          isDiscontinued 
                            ? 'bg-zinc-950/30 opacity-70 hover:opacity-100 hover:bg-zinc-900/40' 
                            : 'hover:bg-zinc-900/60'
                        }`}
                      >
                        {/* Modelo & mobile category */}
                        <TableCell className="font-medium text-zinc-100 px-4 py-2.5">
                          <div className="flex flex-col">
                            <span className={`text-sm font-semibold transition-colors ${
                              isDiscontinued 
                                ? 'line-through text-zinc-400' 
                                : 'text-zinc-100 group-hover:text-blue-400'
                            }`}>
                              {p.nombreModelo}
                            </span>
                            <span className="sm:hidden text-[11px] text-zinc-400 mt-0.5">
                              {p.lineaCategoria}
                            </span>
                          </div>
                        </TableCell>

                        {/* Categoría (Desktop) */}
                        <TableCell className="px-3 py-2.5 hidden sm:table-cell">
                          <Badge variant="outline" className="text-zinc-400 border-zinc-700 bg-zinc-900/90 text-xs truncate max-w-[170px]">
                            {p.lineaCategoria}
                          </Badge>
                        </TableCell>

                        {/* Estado */}
                        <TableCell className="text-center px-3 py-2.5 whitespace-nowrap">
                          {p.activo ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs gap-1 inline-flex items-center px-2 py-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs gap-1 inline-flex items-center px-2 py-0.5">
                              <Archive className="w-3 h-3" />
                              Descontinuado
                            </Badge>
                          )}
                        </TableCell>

                        {/* 1. Precio Amigos */}
                        <TableCell className="text-right px-3 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-emerald-400 text-sm">
                              {formatCurrency(p.precioAmigos)}
                            </span>
                            <span className="text-[10px] text-emerald-500/80 font-medium">
                              {calcMargen(p.precioAmigos, p.costoBase)} ganancia
                            </span>
                          </div>
                        </TableCell>

                        {/* 2. Precio Mercado */}
                        <TableCell className="text-right px-3 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-purple-300 text-sm">
                              {formatCurrency(p.precioMercado)}
                            </span>
                            <span className="text-[10px] text-purple-400/80 font-medium">
                              {calcMargen(p.precioMercado, p.costoBase)} ganancia
                            </span>
                          </div>
                        </TableCell>

                        {/* 3. Precio Comunidad */}
                        <TableCell className="text-right px-4 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-blue-400 text-sm">
                              {formatCurrency(p.precioComunidad)}
                            </span>
                            <span className="text-[10px] text-blue-400/80 font-medium">
                              {calcMargen(p.precioComunidad, p.costoBase)} ganancia
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-800/80 bg-zinc-950/70 text-xs text-zinc-400">
                <div>
                  Mostrando{' '}
                  <span className="text-white font-medium">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{' '}
                  a{' '}
                  <span className="text-white font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredProductos.length)}
                  </span>{' '}
                  de{' '}
                  <span className="text-white font-medium">{filteredProductos.length}</span>{' '}
                  productos
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                            currentPage === page
                              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                              : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
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
                      className="h-8 px-2.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            /* GRID / CARDS VIEW (7 items per page with Pagination) */
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {paginatedProductos.map((item) => {
                  const isDiscontinued = !item.activo

                  return (
                    <Card 
                      key={item.id} 
                      onClick={() => handleOpenDetails(item)}
                      className={`border backdrop-blur-xl transition-all cursor-pointer group ${
                        isDiscontinued
                          ? 'bg-zinc-950/30 border-zinc-800/50 opacity-75 hover:opacity-100'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-900/40'
                      }`}
                    >
                      <CardHeader className="pb-3 flex flex-row items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-zinc-400 border-zinc-700 bg-zinc-900 text-xs">
                              {item.lineaCategoria}
                            </Badge>
                            {isDiscontinued && (
                              <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/10 text-[10px]">
                                Descontinuado
                              </Badge>
                            )}
                          </div>
                          <CardTitle className={`text-lg leading-tight transition-colors ${
                            isDiscontinued ? 'line-through text-zinc-400' : 'text-zinc-100 group-hover:text-blue-400'
                          }`}>
                            {item.nombreModelo}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          {/* 1. Amigos */}
                          <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
                            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Amigos
                            </span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-emerald-400">{formatCurrency(item.precioAmigos)}</span>
                              <span className="block text-[10px] text-emerald-500/80 font-medium">
                                {calcMargen(item.precioAmigos, item.costoBase)} ganancia
                              </span>
                            </div>
                          </div>

                          {/* 2. Mercado */}
                          <div className="flex justify-between items-center p-2 rounded-lg bg-purple-950/20 border border-purple-800/30">
                            <span className="text-xs font-medium text-purple-300 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                              Mercado
                            </span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-purple-300">{formatCurrency(item.precioMercado)}</span>
                              <span className="block text-[10px] text-purple-400/80 font-medium">
                                {calcMargen(item.precioMercado, item.costoBase)} ganancia
                              </span>
                            </div>
                          </div>

                          {/* 3. Comunidad */}
                          <div className="flex justify-between items-center p-2 rounded-lg bg-blue-950/20 border border-blue-800/30">
                            <span className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              Comunidad
                            </span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-blue-400">{formatCurrency(item.precioComunidad)}</span>
                              <span className="block text-[10px] text-blue-400/80 font-medium">
                                {calcMargen(item.precioComunidad, item.costoBase)} ganancia
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Cards Pagination Footer */}
              {totalPages > 1 && (
                <Card className="bg-zinc-950/50 border-zinc-800 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
                  <div>
                    Mostrando página <span className="text-white font-medium">{currentPage}</span> de <span className="text-white font-medium">{totalPages}</span> ({filteredProductos.length} productos)
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                            currentPage === page
                              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                              : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
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
                      className="h-8 px-2.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              )}
            </div>
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
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-400" />
                Categorías en BD
              </span>
              <div className="text-2xl font-bold text-white mt-1">{totalCategoriesCount}</div>
            </div>
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-400" />
                Con Productos Asignados
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{categoriesWithProductsCount}</div>
            </div>
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                <Tag className="h-4 w-4 text-zinc-500" />
                Categorías Disponibles
              </span>
              <div className="text-2xl font-bold text-zinc-300 mt-1">{emptyCategoriesCount}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 items-start">
            {/* Column 1: Create Category Card Form */}
            <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                  <Plus className="h-5 w-5 text-blue-400" />
                  Nueva Categoría
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Registra una nueva categoría directamente en la base de datos para organizar tus modelos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCategoria} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300 font-semibold uppercase tracking-wider">
                      Nombre de la Categoría *
                    </Label>
                    <Input 
                      placeholder="Ej: Joyería & Moda"
                      value={newCatNombre}
                      onChange={(e) => setNewCatNombre(e.target.value)}
                      required
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300 font-semibold uppercase tracking-wider">
                      Descripción (Opcional)
                    </Label>
                    <Input 
                      placeholder="Ej: Anillos, dijes y accesorios 3D"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isCatSubmitting || !newCatNombre.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isCatSubmitting ? 'Guardando en BD...' : 'Guardar Categoría en BD'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Column 2 & 3: Categories List and Table */}
            <Card className="lg:col-span-2 bg-zinc-950/60 border-zinc-800 backdrop-blur-xl">
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                    <FolderTree className="h-5 w-5 text-blue-400" />
                    Listado de Categorías
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Edita el nombre de las categorías o elimínalas si no tienen productos asociados.
                  </CardDescription>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <Input 
                    placeholder="Filtrar categorías..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    className="pl-8 h-8 bg-zinc-900/80 border-zinc-700 text-xs text-white"
                  />
                  {catSearch && (
                    <button 
                      onClick={() => setCatSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredCategorias.length === 0 ? (
                  <div className="p-10 text-center text-zinc-500">
                    No se encontraron categorías registradas.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/80">
                    {filteredCategorias.map((cat) => {
                      const isEditing = editingCatId === cat.id
                      const prodCount = productos.filter(p => p.lineaCategoria === cat.nombre).length

                      return (
                        <div key={cat.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/40 transition-colors">
                          {isEditing ? (
                            <div className="flex-1 grid sm:grid-cols-2 gap-2">
                              <Input 
                                value={editingCatNombre}
                                onChange={(e) => setEditingCatNombre(e.target.value)}
                                placeholder="Nombre de categoría"
                                className="bg-zinc-950 border-zinc-700 text-white text-xs h-9"
                                autoFocus
                              />
                              <Input 
                                value={editingCatDesc}
                                onChange={(e) => setEditingCatDesc(e.target.value)}
                                placeholder="Descripción (opcional)"
                                className="bg-zinc-950 border-zinc-700 text-white text-xs h-9"
                              />
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-white">
                                  {cat.nombre}
                                </span>
                                <button
                                  onClick={() => handleFilterByCategoryFromTab(cat.nombre)}
                                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1 ${
                                    prodCount > 0 
                                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20' 
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                                  }`}
                                  title="Ver productos en el catálogo"
                                >
                                  <span>{prodCount} {prodCount === 1 ? 'producto' : 'productos'}</span>
                                  {prodCount > 0 && <ArrowRight className="h-2.5 w-2.5" />}
                                </button>
                              </div>
                              {cat.descripcion && (
                                <p className="text-xs text-zinc-400 mt-1">
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
                                  className="h-8 px-2.5 text-zinc-400 hover:text-white text-xs"
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEditCat(cat.id)}
                                  disabled={isCatSubmitting || !editingCatNombre.trim()}
                                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
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
                                  className="h-8 px-2.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-blue-400 hover:border-blue-500/30 text-xs"
                                >
                                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteCat(cat.id, cat.nombre)}
                                  disabled={prodCount > 0}
                                  className={`h-8 px-2.5 text-xs transition-colors ${
                                    prodCount > 0 
                                      ? 'text-zinc-600 cursor-not-allowed opacity-50' 
                                      : 'text-zinc-400 hover:text-red-400 hover:bg-red-400/10'
                                  }`}
                                  title={prodCount > 0 ? `Tiene ${prodCount} producto(s) asignado(s)` : 'Eliminar categoría'}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
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
      {/* MODAL: VER DETALLE DEL PRODUCTO                                           */}
      {/* ========================================================================= */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-[560px]">
          {selectedProducto && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700 bg-zinc-900 text-xs">
                    {selectedProducto.lineaCategoria}
                  </Badge>
                  {selectedProducto.activo ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs gap-1">
                      <Archive className="w-3 h-3" />
                      Descontinuado
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl font-bold text-white leading-tight">
                  {selectedProducto.nombreModelo}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {/* Costo Base Hero Box */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Costo Base de Fabricación</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Filamento, energía y depreciación estimada</p>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {formatCurrency(selectedProducto.costoBase)}
                  </div>
                </div>

                {/* Precios & Márgenes (Order: Amigos, Mercado, Comunidad) */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Estructura de Precios y Márgenes
                  </span>

                  {/* 1. Amigos */}
                  {(() => {
                    const ganancia = selectedProducto.precioAmigos - selectedProducto.costoBase
                    const margen = selectedProducto.costoBase > 0 ? (ganancia / selectedProducto.costoBase) * 100 : 0
                    return (
                      <div className="p-3.5 rounded-xl bg-emerald-950/15 border border-emerald-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <div>
                            <span className="text-sm font-bold text-emerald-300">Precio Amigos</span>
                            <span className="block text-xs text-emerald-400/80">
                              Ganancia: +{formatCurrency(ganancia)} ({margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`})
                            </span>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-emerald-300 font-mono">
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
                      <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/25 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                          <div>
                            <span className="text-sm font-bold text-purple-200">Precio Mercado</span>
                            <span className="block text-xs text-purple-400/80">
                              Ganancia: +{formatCurrency(ganancia)} ({margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`})
                            </span>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-purple-200 font-mono">
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
                      <div className="p-3.5 rounded-xl bg-blue-950/15 border border-blue-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <div>
                            <span className="text-sm font-bold text-blue-300">Precio Comunidad</span>
                            <span className="block text-xs text-blue-400/80">
                              Ganancia: +{formatCurrency(ganancia)} ({margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`})
                            </span>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-blue-300 font-mono">
                          {formatCurrency(selectedProducto.precioComunidad)}
                        </span>
                      </div>
                    )
                  })()}
                </div>

                {/* Quick actions inside Detail Modal */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleEstado(selectedProducto.id, selectedProducto.activo)}
                    className={`border-zinc-700 text-xs ${
                      selectedProducto.activo 
                        ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10' 
                        : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10'
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
                      className="text-zinc-400 hover:text-white text-xs"
                    >
                      Cerrar
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => handleOpenEdit(selectedProducto)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" />
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
      {/* MODAL: NUEVO PRODUCTO                                                     */}
      {/* ========================================================================= */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Nuevo Producto
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-3">
            {/* Categoría Selector with Quick Add */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Línea / Categoría *
                </Label>
                <button
                  type="button"
                  onClick={() => setIsQuickAddingCat(!isQuickAddingCat)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  {isQuickAddingCat ? 'Elegir existente' : 'Crear nueva categoría'}
                </button>
              </div>

              {isQuickAddingCat ? (
                <div className="p-3 rounded-lg bg-zinc-900 border border-blue-500/40 space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-zinc-400">Nombre de la nueva categoría *</Label>
                    <Input 
                      value={quickCatName}
                      onChange={(e) => setQuickCatName(e.target.value)}
                      placeholder="Ej: Joyería & Accesorios..."
                      className="h-8 bg-zinc-950 border-zinc-700 text-white text-xs"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button 
                      type="button" 
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsQuickAddingCat(false)}
                      className="h-7 px-2 text-zinc-400 text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={handleQuickAddCategory}
                      disabled={!quickCatName.trim()}
                      className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      Guardar en BD
                    </Button>
                  </div>
                </div>
              ) : (
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  {categoryNamesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                Nombre del Modelo / Producto *
              </Label>
              <Input 
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej: Inserto Catan 3D (5 Placas)"
                required
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>

            {/* Costo Base & Auto-calculate Button */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Costo Base de Fabricación (S/) *
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAutoCalculatePrices(formCostoBase)}
                  disabled={!formCostoBase || parseFloat(formCostoBase) <= 0}
                  className="h-6 text-xs text-blue-400 hover:text-blue-300 p-0"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Sugerir Precios
                </Button>
              </div>
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
                placeholder="Ej: 25.50"
                required
                className="bg-zinc-900 border-zinc-700 text-white font-mono text-base"
              />
            </div>

            {/* Price Tiers Grid: 1. Amigos, 2. Mercado, 3. Comunidad */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  P. Amigos
                </Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrecioAmigos}
                  onChange={(e) => setFormPrecioAmigos(e.target.value)}
                  placeholder="S/ 0.00"
                  required
                  className="bg-zinc-900 border-zinc-700 text-emerald-400 font-mono font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-purple-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  P. Mercado
                </Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrecioMercado}
                  onChange={(e) => setFormPrecioMercado(e.target.value)}
                  placeholder="S/ 0.00"
                  required
                  className="bg-zinc-900 border-zinc-700 text-purple-400 font-mono font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-blue-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  P. Comunidad
                </Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrecioComunidad}
                  onChange={(e) => setFormPrecioComunidad(e.target.value)}
                  placeholder="S/ 0.00"
                  required
                  className="bg-zinc-900 border-zinc-700 text-blue-400 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
                />
                Producto activo disponible para ventas
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenCreate(false)}
                className="text-zinc-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR PRODUCTO                                                    */}
      {/* ========================================================================= */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-400" />
              Editar Producto
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-3">
            {/* Categoría Selector with Quick Add */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Línea / Categoría *
                </Label>
                <button
                  type="button"
                  onClick={() => setIsQuickAddingCat(!isQuickAddingCat)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  {isQuickAddingCat ? 'Elegir existente' : 'Crear nueva categoría'}
                </button>
              </div>

              {isQuickAddingCat ? (
                <div className="p-3 rounded-lg bg-zinc-900 border border-blue-500/40 space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-zinc-400">Nombre de la nueva categoría *</Label>
                    <Input 
                      value={quickCatName}
                      onChange={(e) => setQuickCatName(e.target.value)}
                      placeholder="Ej: Joyería & Accesorios..."
                      className="h-8 bg-zinc-950 border-zinc-700 text-white text-xs"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsQuickAddingCat(false)}
                      className="h-7 px-2 text-zinc-400 text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={handleQuickAddCategory}
                      disabled={!quickCatName.trim()}
                      className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      Guardar en BD
                    </Button>
                  </div>
                </div>
              ) : (
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {categoryNamesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                Nombre del Modelo / Producto *
              </Label>
              <Input 
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Costo Base de Fabricación (S/) *
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAutoCalculatePrices(formCostoBase)}
                  disabled={!formCostoBase || parseFloat(formCostoBase) <= 0}
                  className="h-6 text-xs text-blue-400 hover:text-blue-300 p-0"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Recalcular Sugeridos
                </Button>
              </div>
              <Input 
                type="number"
                step="0.01"
                min="0"
                value={formCostoBase}
                onChange={(e) => setFormCostoBase(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-700 text-white font-mono text-base"
              />
            </div>

            {/* Price Tiers Grid: 1. Amigos, 2. Mercado, 3. Comunidad */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-emerald-400 font-medium">P. Amigos</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrecioAmigos}
                  onChange={(e) => setFormPrecioAmigos(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-700 text-emerald-400 font-mono font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-purple-400 font-medium">P. Mercado</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrecioMercado}
                  onChange={(e) => setFormPrecioMercado(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-700 text-purple-400 font-mono font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-blue-400 font-medium">P. Comunidad</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrecioComunidad}
                  onChange={(e) => setFormPrecioComunidad(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-700 text-blue-400 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
                />
                Producto activo disponible para ventas
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenEdit(false)}
                className="text-zinc-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
