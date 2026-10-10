'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  X, 
  Package, 
  PackageCheck, 
  Archive, 
  RotateCcw, 
  Pencil, 
  CopyPlus, 
  Share2, 
  Check, 
  Layers, 
  Palette, 
  Clock, 
  Weight, 
  DollarSign, 
  Boxes, 
  Calculator, 
  MoreHorizontal,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  LayoutGrid,
  Table2
} from 'lucide-react'
import { useBusiness } from '@/context/BusinessContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  toggleEstadoProducto, 
  duplicarProducto, 
  deleteProducto,
  duplicarModeloConVariantes,
  deleteModeloConVariantes
} from '@/actions/productos'
import { 
  ProductsTableView, 
  groupProducts, 
  extractBaseAndVariant,
  ProductGroupRow, 
  OrdenCatalogType, 
  CategoryCountItem 
} from './ProductsTableView'
import { ProductFormModal } from './ProductFormModal'
import { ProductDetailsModal } from './ProductDetailsModal'
import { ProductCardGrid } from './ProductCardGrid'

export interface ProductoItem {
  id: string
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioMayor: number
  precioMenor: number
  activo: boolean
  stock?: number
  controlarStock?: boolean
  enOferta?: boolean
  precioOferta?: number | null
  porcentajeDescuento?: number | null
  imagenUrl?: string | null
  enlaceMakerworld?: string | null
  descripcionWeb?: string | null
  destacadoWeb?: boolean
  createdAt?: string
  updatedAt?: string
  negocio?: string
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
}

type EstadoFilter = 'TODOS' | 'ACTIVOS' | 'DESCONTINUADOS'

export function CatalogoClient({ 
  productos: initialProductos, 
  categoriasIniciales = [] 
}: CatalogoClientProps) {
  const router = useRouter()
  const { is3D, isBG } = useBusiness()
  const [productos, setProductos] = useState<ProductoItem[]>(initialProductos)
  const [categorias, setCategorias] = useState<CategoriaItem[]>(categoriasIniciales)

  // Sync state with props when business context changes and server refetches
  useEffect(() => {
    setProductos(initialProductos)
  }, [initialProductos])

  useEffect(() => {
    setCategorias(categoriasIniciales)
  }, [categoriasIniciales])
  
  // Toolbar and Filters
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODAS')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('TODOS')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()

  // Modo de visualización: Cuadrícula (Cards) vs. Tabla
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nova_catalog_view_mode')
      if (saved === 'grid' || saved === 'table') {
        setViewMode(saved)
      }
    }
  }, [])

  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('nova_catalog_view_mode', mode)
    }
  }

  // Persistencia de expansión de padres con variantes
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const handleToggleExpand = (id: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Paginación: 8 modelos/filas maestras por página
  const ITEMS_PER_PAGE = 8
  const [currentPage, setCurrentPage] = useState(1)
  const [ordenFilter, setOrdenFilter] = useState<OrdenCatalogType>('RECIENTES')

  useEffect(() => {
    setCurrentPage(1)
  }, [search, estadoFilter, categoriaFilter, ordenFilter])

  // Helpers de fecha de registro sin desajuste de zona horaria
  const getTodayDateString = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDateInputString = (val?: string | Date | null) => {
    if (!val) return getTodayDateString()
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      return val.split('T')[0]
    }
    const d = new Date(val)
    if (isNaN(d.getTime())) return getTodayDateString()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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

  // Modal State
  const [openModal, setOpenModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductoItem | null>(null)
  const [editingGroup, setEditingGroup] = useState<ProductGroupRow | null>(null)
  const [presetBaseName, setPresetBaseName] = useState<string | undefined>(undefined)
  const [presetCategoria, setPresetCategoria] = useState<string | undefined>(undefined)
  const [presetVariantName, setPresetVariantName] = useState<string | undefined>(undefined)

  // Ficha Técnica Read-Only Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDetailGroup, setSelectedDetailGroup] = useState<ProductGroupRow | null>(null)
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<ProductoItem | null>(null)

  // Close context menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Calculate profit margin percentage
  const calcMargen = (precio: number, costo: number) => {
    if (costo <= 0) return precio > 0 ? '+100%' : '+0%'
    const margen = ((precio - costo) / costo) * 100
    return margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`
  }

  // Calculate net profit
  const calcGanancia = (precio: number, costo: number) => {
    const diff = precio - costo
    return diff >= 0 ? `+S/ ${diff.toFixed(2)}` : `-S/ ${Math.abs(diff).toFixed(2)}`
  }

  // Categories list for dropdown
  const categoryNamesList = useMemo(() => {
    const set = new Set<string>()
    categorias.forEach(c => set.add(c.nombre))
    productos.forEach(p => {
      if (p.lineaCategoria) set.add(p.lineaCategoria.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  }, [categorias, productos])

  // KPIs
  const totalModelos = productos.length
  const activosCount = useMemo(() => productos.filter(p => p.activo).length, [productos])
  const descontinuadosCount = useMemo(() => productos.filter(p => !p.activo).length, [productos])
  const categoriasActivasCount = useMemo(() => {
    const activeCats = new Set(productos.filter(p => p.activo).map(p => p.lineaCategoria))
    return activeCats.size
  }, [productos])

  // Filtered Products List
  const filteredProductos = useMemo(() => {
    let list = productos

    if (estadoFilter === 'ACTIVOS') {
      list = list.filter(p => p.activo)
    } else if (estadoFilter === 'DESCONTINUADOS') {
      list = list.filter(p => !p.activo)
    }

    if (categoriaFilter !== 'TODAS') {
      list = list.filter(p => (p.lineaCategoria || '').toLowerCase() === categoriaFilter.toLowerCase())
    }

    if (search.trim()) {
      const q = search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      list = list.filter(p => {
        const nombre = (p.nombreModelo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        const cat = (p.lineaCategoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

        return nombre.includes(q) || cat.includes(q)
      })
    }

    return list.sort((a, b) => {
      if (a.activo && !b.activo) return -1
      if (!a.activo && b.activo) return 1
      return a.nombreModelo.localeCompare(b.nombreModelo, 'es', { sensitivity: 'base' })
    })
  }, [productos, estadoFilter, categoriaFilter, search])

  // Agrupación total del catálogo para conteos de modelos por familia
  const allCatalogRows = useMemo(() => {
    return groupProducts(productos, productos)
  }, [productos])

  const totalCatalogModelos = allCatalogRows.length

  const categoriesWithCounts = useMemo<CategoryCountItem[]>(() => {
    return categoryNamesList.map(name => ({
      name,
      count: allCatalogRows.filter(r => (r.lineaCategoria || '').toLowerCase() === name.toLowerCase()).length
    }))
  }, [categoryNamesList, allCatalogRows])

  // Agrupación Inteligente en Frontend (Smart Variant Grouping) sobre la lista filtrada
  const groupedRows = useMemo(() => {
    return groupProducts(filteredProductos, productos)
  }, [filteredProductos, productos])

  // Ordenamiento Dinámico Reactivo sobre los Modelos Agrupados
  const sortedGroupedRows = useMemo(() => {
    const list = [...groupedRows]
    return list.sort((a, b) => {
      if (ordenFilter === 'RECIENTES') {
        const timeA = a.latestCreatedAt ? new Date(a.latestCreatedAt).getTime() : 0
        const timeB = b.latestCreatedAt ? new Date(b.latestCreatedAt).getTime() : 0
        if (timeB !== timeA) return timeB - timeA
        return a.baseName.localeCompare(b.baseName, 'es', { sensitivity: 'base' })
      }
      if (ordenFilter === 'NOMBRE_ASC') {
        return a.baseName.localeCompare(b.baseName, 'es', { sensitivity: 'base' })
      }
      if (ordenFilter === 'NOMBRE_DESC') {
        return b.baseName.localeCompare(a.baseName, 'es', { sensitivity: 'base' })
      }
      if (ordenFilter === 'MARGEN_DESC') {
        const margA = a.minCosto > 0 ? ((a.minPrecioMenor - a.minCosto) / a.minCosto) : 0
        const margB = b.minCosto > 0 ? ((b.minPrecioMenor - b.minCosto) / b.minCosto) : 0
        return margB - margA
      }
      if (ordenFilter === 'COSTO_ASC') {
        return a.minCosto - b.minCosto
      }
      if (ordenFilter === 'COSTO_DESC') {
        return b.maxCosto - a.maxCosto
      }
      return 0
    })
  }, [groupedRows, ordenFilter])

  // Paginación calculada sobre los Modelos/Filas Maestras
  const totalPages = Math.max(1, Math.ceil(sortedGroupedRows.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const paginatedGroupedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE
    return sortedGroupedRows.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedGroupedRows, safeCurrentPage, ITEMS_PER_PAGE])

  // Copy Quotation to Clipboard for WhatsApp: "[Nombre] - Menor: S/ [X] | Mayor: S/ [Y]"
  const handleCopiarCotizacion = (p: ProductoItem) => {
    const message = `${p.nombreModelo} - Precio Menor: ${formatCurrency(p.precioMenor)} | Precio Mayor: ${formatCurrency(p.precioMayor)}`
    navigator.clipboard.writeText(message)
    setCopiedId(p.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success(`Cotización de "${p.nombreModelo}" copiada`)
  }

  // Copiar cotizaciones consolidadas de todas las variantes del producto padre
  const handleCopiarCotizacionGrupo = (group: ProductGroupRow) => {
    const lines = [
      `📦 ${group.baseName} (${group.lineaCategoria || 'General'}):`,
      ...group.variants.map(v => 
        `• ${v.variantName} - Menor: ${formatCurrency(v.producto.precioMenor)} | Mayor: ${formatCurrency(v.producto.precioMayor)}`
      )
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    toast.success(`Cotización consolidada de "${group.baseName}" copiada al portapapeles`)
  }

  // Acción rápida: Abrir modal para registrar nueva variante del modelo base
  const handleOpenCreateVariant = (baseName: string, categoria: string) => {
    setEditingProduct(null)
    setEditingGroup(null)
    setPresetBaseName(baseName)
    setPresetCategoria(categoria)
    setPresetVariantName('')
    setOpenModal(true)
  }

  // Toggle Active/Discontinued
  const handleToggleEstado = async (p: ProductoItem) => {
    const nuevoEstado = !p.activo
    setProductos(prev => prev.map(item => item.id === p.id ? { ...item, activo: nuevoEstado } : item))
    setActiveMenuId(null)

    try {
      await toggleEstadoProducto(p.id)
      toast.success(`"${p.nombreModelo}" marcado como ${nuevoEstado ? 'Activo' : 'Descontinuado'}`)
    } catch (e: any) {
      toast.error('Error al cambiar estado: ' + e.message)
      setProductos(prev => prev.map(item => item.id === p.id ? { ...item, activo: !nuevoEstado } : item))
    }
  }

  // Duplicate product
  const handleDuplicar = async (p: ProductoItem) => {
    setActiveMenuId(null)
    try {
      const duplicado = await duplicarProducto(p.id)
      setProductos(prev => [duplicado, ...prev])
      toast.success(`Modelo "${duplicado.nombreModelo}" duplicado`)
    } catch (e: any) {
      toast.error('Error al duplicar modelo: ' + e.message)
    }
  }

  // Delete product
  const handleDelete = async (p: ProductoItem) => {
    setActiveMenuId(null)
    if (!confirm(`¿Estás seguro de eliminar o archivar "${p.nombreModelo}"?`)) return

    try {
      const res = await deleteProducto(p.id)
      if (res.discontinued) {
        setProductos(prev => prev.map(item => item.id === p.id ? { ...item, activo: false } : item))
        toast.info(res.message)
      } else {
        setProductos(prev => prev.filter(item => item.id !== p.id))
        toast.success(res.message)
      }
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
    }
  }

  // Ver Detalle del Modelo (Ficha Técnica Read-Only)
  const handleViewDetail = (group?: ProductGroupRow, single?: ProductoItem) => {
    setSelectedDetailGroup(group || null)
    setSelectedDetailProduct(single || null)
    setDetailModalOpen(true)
  }

  // Duplicar Modelo con todas sus versiones
  const handleDuplicarGroup = async (group: ProductGroupRow) => {
    const variantIds = group.variants.map(v => v.producto.id)
    try {
      const duplicados = await duplicarModeloConVariantes(variantIds, group.baseName)
      setProductos(prev => [...duplicados, ...prev])
      toast.success(`Modelo "${group.baseName}" y sus ${duplicados.length} versiones fueron duplicados`)
    } catch (e: any) {
      toast.error('Error al duplicar modelo con versiones: ' + e.message)
    }
  }

  // Eliminar Modelo con todas sus versiones
  const handleDeleteGroup = async (group: ProductGroupRow) => {
    if (!confirm(`¿Estás seguro de eliminar el modelo "${group.baseName}" y sus ${group.totalVariants} versiones asociadas?`)) {
      return
    }
    const variantIds = group.variants.map(v => v.producto.id)
    try {
      const res = await deleteModeloConVariantes(variantIds)
      if (res.deletedIds.length > 0) {
        setProductos(prev => prev.filter(p => !res.deletedIds.includes(p.id)))
      }
      if (res.discontinuedIds.length > 0) {
        setProductos(prev => prev.map(p => res.discontinuedIds.includes(p.id) ? { ...p, activo: false } : p))
      }
      toast.success(res.message)
    } catch (e: any) {
      toast.error('Error al eliminar modelo: ' + e.message)
    }
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null)
    setEditingGroup(null)
    setPresetBaseName(undefined)
    setPresetCategoria(undefined)
    setPresetVariantName(undefined)
    setOpenModal(true)
  }

  // Open Edit Modal for Single Product or Specific Variant
  const handleOpenEdit = (p: ProductoItem) => {
    setEditingProduct(p)
    setEditingGroup(null)
    setPresetBaseName(undefined)
    setPresetCategoria(undefined)
    setPresetVariantName(undefined)
    setOpenModal(true)
  }

  // Open Edit Modal for Entire Group with all variants
  const handleOpenEditGroup = (group: ProductGroupRow) => {
    setEditingProduct(null)
    setEditingGroup(group)
    setPresetBaseName(undefined)
    setPresetCategoria(undefined)
    setPresetVariantName(undefined)
    setOpenModal(true)
  }

  // Callback reactivo al guardar producto(s)
  const handleSavedProduct = (savedProducts: ProductoItem[], deletedIds: string[], baseName: string) => {
    setProductos(prev => {
      let updated = prev.filter(p => !deletedIds.includes(p.id))
      savedProducts.forEach(saved => {
        const idx = updated.findIndex(p => p.id === saved.id)
        if (idx >= 0) {
          updated[idx] = saved
        } else {
          updated = [saved, ...updated]
        }
      })
      return updated
    })

    // Expandir automáticamente el producto padre en expandedParents para desplegar subfilas
    if (baseName) {
      const { baseName: cleanBase } = extractBaseAndVariant(baseName)
      setTimeout(() => {
        setExpandedParents(prev => {
          const next = new Set(prev)
          const targetGroup = allCatalogRows.find(
            r => r.baseName.toLowerCase().trim() === cleanBase.toLowerCase().trim()
          )
          if (targetGroup) {
            next.add(targetGroup.id)
          } else {
            const cat = savedProducts[0]?.lineaCategoria || 'general'
            next.add(`group_${cleanBase.toLowerCase().trim()}:::${cat.toLowerCase().trim()}`)
          }
          return next
        })
      }, 50)
    }
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA Y BARRA DE ACCIONES                                           */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Breadcrumb Contextual */}
        <div className="flex items-center gap-1.5 text-xs text-[#75695D] font-medium">
          <Link href="/catalogo" className="hover:text-[#A36F4C] transition-colors flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>Catálogo</span>
          </Link>
          <span className="text-[#D4BEA7]">/</span>
          <span className="text-[#241C15] font-bold">Catálogo de Productos</span>
        </div>

        {/* Título & Botones de Acción */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#241C15] tracking-tight flex items-center gap-2.5">
              <Boxes className="h-6 w-6 sm:h-7 sm:w-7 text-[#A36F4C] flex-shrink-0" />
              <span>Catálogo de Productos</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#75695D] mt-1">
              {is3D ? 'Modelos 3D disponibles con costos base y precios al por mayor y menor.' : 'Juegos de mesa disponibles para venta online y presencial.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">


            {/* Botón Gestionar Categorías */}
            <Link
              href="/catalogo/categorias"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#241C15] border border-[#E2D9CC] shadow-2xs transition-all cursor-pointer flex-1 sm:flex-initial justify-center h-10"
            >
              <Layers className="h-4 w-4 text-[#A36F4C]" />
              <span>Categorías</span>
            </Link>

            {/* Botón Primario + Nuevo Producto */}
            <Button
              type="button"
              onClick={handleOpenCreate}
              className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98] flex-1 sm:flex-initial flex items-center gap-2 justify-center"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Nuevo Producto</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. FILA SUPERIOR DE KPIS (GRID 4 COLUMNAS MINIMALISTA)                    */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1: Total Modelos */}
          <div 
            onClick={() => setEstadoFilter('TODOS')}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs cursor-pointer transition-all ${
              estadoFilter === 'TODOS'
                ? 'bg-white border-[#A36F4C] ring-1 ring-[#A36F4C]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Total Modelos</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
                <Boxes className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
                {totalModelos} <span className="text-xs font-normal font-sans text-[#75695D]">diseños</span>
              </div>
              <span className="text-xs text-[#75695D] mt-0.5 block truncate">
                En catálogo general
              </span>
            </div>
          </div>

          {/* KPI 2: Activos en Venta */}
          <div 
            onClick={() => setEstadoFilter('ACTIVOS')}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs cursor-pointer transition-all ${
              estadoFilter === 'ACTIVOS'
                ? 'bg-white border-[#1E5E3A] ring-1 ring-[#1E5E3A]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Activos en Venta</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
                <PackageCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#1E5E3A] font-mono tabular-nums">
                {activosCount} <span className="text-xs font-normal font-sans text-[#75695D]">modelos</span>
              </div>
              <span className="text-xs text-[#1E5E3A] font-medium mt-0.5 block truncate">
                Disponibles para pedidos
              </span>
            </div>
          </div>

          {/* KPI 3: Descontinuados */}
          <div 
            onClick={() => setEstadoFilter('DESCONTINUADOS')}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs cursor-pointer transition-all ${
              estadoFilter === 'DESCONTINUADOS'
                ? 'bg-white border-[#75695D] ring-1 ring-[#75695D]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Descontinuados</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#75695D]">
                <Archive className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#75695D] font-mono tabular-nums">
                {descontinuadosCount} <span className="text-xs font-normal font-sans text-[#75695D]">archivados</span>
              </div>
              <span className="text-xs text-[#75695D] mt-0.5 block truncate">
                Fuera de venta
              </span>
            </div>
          </div>

          {/* KPI 4: Categorías Activas */}
          <Link
            href="/catalogo/categorias"
            className="p-3.5 rounded-2xl bg-white border border-[#E2D9CC] hover:bg-[#FAF8F5] flex flex-col justify-between shadow-xs transition-colors"
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Categorías</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
                <Layers className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#A36F4C] font-mono tabular-nums">
                {categoriasActivasCount} <span className="text-xs font-normal font-sans text-[#75695D]">familias</span>
              </div>
              <span className="text-xs text-[#A36F4C] font-medium mt-0.5 block truncate">
                Gestionar categorías →
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE HERRAMIENTAS Y FILTROS INTEGRAL (TOOLBAR UNIFICADA)           */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs mb-6 space-y-3.5">
        {/* Nivel 1 (Búsqueda y Orden) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Izquierda: Input de búsqueda integrado */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar modelo o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl border-input bg-background pl-10 pr-9 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Derecha: Controles agrupados */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between md:justify-end">
            {/* Segmented control para Estado */}
            <div className="bg-secondary/70 p-1 rounded-xl border border-border/80 flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setEstadoFilter('TODOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  estadoFilter === 'TODOS'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setEstadoFilter('ACTIVOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  estadoFilter === 'ACTIVOS'
                    ? 'bg-card text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <span>Activos</span>
              </button>
              <button
                type="button"
                onClick={() => setEstadoFilter('DESCONTINUADOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  estadoFilter === 'DESCONTINUADOS'
                    ? 'bg-card text-muted-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Archivados
              </button>
            </div>

            {/* Dropdown de ordenamiento */}
            <select
              value={ordenFilter}
              onChange={(e) => setOrdenFilter(e.target.value as OrdenCatalogType)}
              className="h-10 px-3.5 rounded-xl border border-input bg-background text-xs font-semibold text-foreground shadow-2xs hover:bg-secondary/40 focus:border-primary focus:outline-none transition-colors cursor-pointer"
            >
              <option value="RECIENTES">Más recientes</option>
              <option value="NOMBRE_ASC">Nombre (A - Z)</option>
              <option value="NOMBRE_DESC">Nombre (Z - A)</option>
              <option value="MARGEN_DESC">Mayor Margen (%)</option>
              <option value="COSTO_ASC">Menor Costo Base</option>
              <option value="COSTO_DESC">Mayor Costo Base</option>
            </select>

            {/* Contador de catálogo */}
            <div className="bg-secondary text-muted-foreground text-xs font-semibold px-3 py-2 rounded-xl whitespace-nowrap border border-border/60 shadow-2xs">
              <span className="font-bold text-foreground">{filteredProductos.length}</span> {filteredProductos.length === 1 ? 'modelo' : 'modelos'}
            </div>

            {/* Selector de Alternancia de Vista: Grid ⊞ vs. Tabla ☰ */}
            <div className="bg-secondary/80 border border-border/80 p-1 rounded-xl flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={`size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista Cuadrícula (Cards)"
                aria-label="Vista Cuadrícula"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('table')}
                className={`size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista Tabla"
                aria-label="Vista Tabla"
              >
                <Table2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Nivel 2 (Filtro por Categorías con Scroll Elástico) */}
        <div className="pt-2 border-t border-border/70">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setCategoriaFilter('TODAS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 cursor-pointer ${
                categoriaFilter.toUpperCase() === 'TODAS'
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                  : 'bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60'
              }`}
            >
              <span>Todas las Categorías</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                categoriaFilter.toUpperCase() === 'TODAS'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-card text-muted-foreground border border-border/60'
              }`}>
                {totalCatalogModelos}
              </span>
            </button>

            {categoriesWithCounts.map((cat) => {
              const isSelected = categoriaFilter.toLowerCase() === cat.name.toLowerCase()
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategoriaFilter(cat.name)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                      : 'bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-card text-muted-foreground border border-border/60'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Barra de Filtros Activos & Reset si hay búsqueda o filtros aplicados */}
        {(search || estadoFilter !== 'TODOS' || categoriaFilter !== 'TODAS' || ordenFilter !== 'RECIENTES') && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">Filtrado por:</span>
              <span className="font-bold text-foreground bg-secondary px-2 py-0.5 rounded-lg border border-border">
                {filteredProductos.length} {filteredProductos.length === 1 ? 'modelo' : 'modelos'}
              </span>
              {search && (
                <span className="text-muted-foreground">
                  búsqueda &ldquo;<strong className="text-foreground">{search}</strong>&rdquo;
                </span>
              )}
              {categoriaFilter !== 'TODAS' && (
                <span className="text-muted-foreground">
                  categoría <strong className="text-foreground">{categoriaFilter}</strong>
                </span>
              )}
              {estadoFilter !== 'TODOS' && (
                <span className="text-muted-foreground">
                  estado <strong className="text-foreground">{estadoFilter}</strong>
                </span>
              )}
              {ordenFilter !== 'RECIENTES' && (
                <span className="text-muted-foreground">
                  orden <strong className="text-foreground">{
                    ordenFilter === 'NOMBRE_ASC' ? 'Nombre (A - Z)' :
                    ordenFilter === 'NOMBRE_DESC' ? 'Nombre (Z - A)' :
                    ordenFilter === 'MARGEN_DESC' ? 'Mayor Margen (%)' :
                    ordenFilter === 'COSTO_ASC' ? 'Menor Costo Base' :
                    ordenFilter === 'COSTO_DESC' ? 'Mayor Costo Base' : 'Más recientes'
                  }</strong>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setEstadoFilter('TODOS')
                setCategoriaFilter('TODAS')
                setOrdenFilter('RECIENTES')
              }}
              className="text-xs text-primary hover:text-primary/80 font-bold underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. PRESENTACIÓN DEL CATÁLOGO: CUADRÍCULA DE CARDS O TABLA MASTER-DETAIL  */}
      {/* ========================================================================= */}
      {viewMode === 'grid' ? (
        <ProductCardGrid
          rows={paginatedGroupedRows}
          allCatalogProductos={productos}
          onViewDetail={handleViewDetail}
          onEdit={handleOpenEdit}
          onEditGroup={handleOpenEditGroup}
          onDuplicar={handleDuplicar}
          onDuplicarGroup={handleDuplicarGroup}
          onDeleteProduct={handleDelete}
          onDeleteGroup={handleDeleteGroup}
          onToggleEstado={handleToggleEstado}
          onCopiarCotizacion={handleCopiarCotizacion}
          onCopyGroupQuotation={handleCopiarCotizacionGrupo}
          formatCurrency={formatCurrency}
          calcMargen={calcMargen}
        />
      ) : (
        <ProductsTableView
          rows={paginatedGroupedRows}
          allCatalogProductos={productos}
          expandedParents={expandedParents}
          onToggleExpand={handleToggleExpand}
          onViewDetail={handleViewDetail}
          onEdit={handleOpenEdit}
          onEditGroup={handleOpenEditGroup}
          onAddVariant={handleOpenCreateVariant}
          onCopiarCotizacion={handleCopiarCotizacion}
          onCopyGroupQuotation={handleCopiarCotizacionGrupo}
          onToggleEstado={handleToggleEstado}
          onDuplicar={handleDuplicar}
          onDuplicarGroup={handleDuplicarGroup}
          onDeleteProduct={handleDelete}
          onDeleteGroup={handleDeleteGroup}
          copiedId={copiedId}
          formatCurrency={formatCurrency}
          calcMargen={calcMargen}
          formatFechaRegistro={formatFechaRegistro}
          categoriaFilter={categoriaFilter}
          onCategoriaFilterChange={(cat) => setCategoriaFilter(cat)}
          categoriesWithCounts={categoriesWithCounts}
          totalCatalogModelos={totalCatalogModelos}
          ordenFilter={ordenFilter}
          onOrdenFilterChange={(o) => setOrdenFilter(o)}
        />
      )}

      {/* Controles de Paginación de Productos y Modelos */}
      {sortedGroupedRows.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl shadow-2xs">
          <div className="text-xs text-[#75695D] font-medium text-center sm:text-left">
            Mostrando <span className="font-bold text-[#241C15]">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{' '}
            <span className="font-bold text-[#241C15]">{Math.min(safeCurrentPage * ITEMS_PER_PAGE, sortedGroupedRows.length)}</span> de{' '}
            <span className="font-bold text-[#241C15]">{sortedGroupedRows.length}</span> modelos en catálogo ({filteredProductos.length} versiones)
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="h-8 px-2.5 text-xs font-bold rounded-xl border-[#E2D9CC] text-[#241C15] hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 min-w-[32px] px-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      pageNum === safeCurrentPage
                        ? 'bg-[#A36F4C] text-white shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#75695D] hover:bg-[#F4EFEA] border border-[#E2D9CC]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="h-8 px-2.5 text-xs font-bold rounded-xl border-[#E2D9CC] text-[#241C15] hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: REGISTRAR / EDITAR PRODUCTO & VERSIONES (PRODUCT FORM MODAL)    */}
      {/* ========================================================================= */}
      <ProductFormModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSaved={handleSavedProduct}
        onDeleteProduct={handleDelete}
        editingProduct={editingProduct}
        editingGroup={editingGroup}
        initialBaseName={presetBaseName}
        initialCategoria={presetCategoria}
        initialVariantName={presetVariantName}
        categoryNamesList={categoryNamesList}
        allCatalogProductos={productos}
        is3D={is3D}
      />

      {/* ========================================================================= */}
      {/* 6. MODAL: FICHA TÉCNICA DETALLADA (PRODUCT DETAILS MODAL)                 */}
      {/* ========================================================================= */}
      <ProductDetailsModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        group={selectedDetailGroup}
        singleProduct={selectedDetailProduct}
        onEdit={() => {
          setDetailModalOpen(false)
          if (selectedDetailGroup) {
            handleOpenEditGroup(selectedDetailGroup)
          } else if (selectedDetailProduct) {
            handleOpenEdit(selectedDetailProduct)
          }
        }}
        onCreateOrder={(producto) => {
          setDetailModalOpen(false)
          if (producto) {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('nova_preselected_product_id', producto.id)
            }
            router.push(`/pedidos?productoId=${producto.id}`)
            toast.info(`Iniciando pedido para "${producto.nombreModelo}"`)
          } else {
            router.push('/pedidos')
          }
        }}
        formatCurrency={formatCurrency}
        calcMargen={calcMargen}
        formatFechaRegistro={formatFechaRegistro}
      />
    </div>
  )
}

export { CatalogoClient as ProductsPage }
