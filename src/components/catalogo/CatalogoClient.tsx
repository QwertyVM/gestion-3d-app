'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
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
  ChevronDown
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  createProducto, 
  updateProducto, 
  toggleEstadoProducto, 
  duplicarProducto, 
  deleteProducto 
} from '@/actions/productos'

export interface ProductoItem {
  id: string
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioAmigos: number
  precioMercado: number
  precioComunidad: number
  pesoGramos?: number
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
}

type EstadoFilter = 'TODOS' | 'ACTIVOS' | 'DESCONTINUADOS'

export function CatalogoClient({ 
  productos: initialProductos, 
  categoriasIniciales = [] 
}: CatalogoClientProps) {
  const [productos, setProductos] = useState<ProductoItem[]>(initialProductos)
  const [categorias, setCategorias] = useState<CategoriaItem[]>(categoriasIniciales)
  
  // Toolbar and Filters
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODAS')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('TODOS')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()

  // Modal State
  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombreModelo: '',
    lineaCategoria: '',
    pesoGramos: '',
    tiempoHoras: '',
    costoBase: '',
    precioAmigos: '',
    precioMercado: '',
    precioComunidad: '',
    activo: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    if (costo <= 0) return '+0%'
    const margen = ((precio - costo) / costo) * 100
    return margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`
  }

  // Estimate print time (approx 22g/hour as workshop baseline)
  const estimarTiempoImpresion = (gramos: number) => {
    if (!gramos || gramos <= 0) return '—'
    const horas = gramos / 22
    if (horas < 1) return `${Math.round(horas * 60)} min`
    return `${horas.toFixed(1)}h`
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
        const gramos = (p.pesoGramos || '').toString()

        return nombre.includes(q) || cat.includes(q) || gramos.includes(q)
      })
    }

    return list.sort((a, b) => {
      if (a.activo && !b.activo) return -1
      if (!a.activo && b.activo) return 1
      return a.nombreModelo.localeCompare(b.nombreModelo, 'es', { sensitivity: 'base' })
    })
  }, [productos, estadoFilter, categoriaFilter, search])

  // Copy Quotation to Clipboard for WhatsApp: "[Nombre] - Precio: S/ [Mercado]"
  const handleCopiarCotizacion = (p: ProductoItem) => {
    const message = `${p.nombreModelo} - Precio: ${formatCurrency(p.precioMercado)}`
    navigator.clipboard.writeText(message)
    setCopiedId(p.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success(`Cotización de "${p.nombreModelo}" copiada`)
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

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({
      nombreModelo: '',
      lineaCategoria: categoryNamesList[0] || 'General',
      pesoGramos: '150',
      tiempoHoras: '4.5',
      costoBase: '9.75',
      precioAmigos: '18.00',
      precioMercado: '30.00',
      precioComunidad: '25.00',
      activo: true
    })
    setOpenModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (p: ProductoItem) => {
    setEditingId(p.id)
    const gramos = p.pesoGramos || 0
    setFormData({
      nombreModelo: p.nombreModelo,
      lineaCategoria: p.lineaCategoria || 'General',
      pesoGramos: gramos > 0 ? gramos.toString() : '',
      tiempoHoras: gramos > 0 ? (gramos / 22).toFixed(1) : '',
      costoBase: p.costoBase.toString(),
      precioAmigos: p.precioAmigos.toString(),
      precioMercado: p.precioMercado.toString(),
      precioComunidad: p.precioComunidad.toString(),
      activo: p.activo
    })
    setOpenModal(true)
  }

  // Recalculate base cost automatically from grams
  const handleGramosChange = (val: string) => {
    const g = parseFloat(val) || 0
    const horas = g > 0 ? (g / 22).toFixed(1) : ''
    const costoEstimado = g > 0 ? (g * 0.065).toFixed(2) : ''
    
    setFormData(prev => ({
      ...prev,
      pesoGramos: val,
      tiempoHoras: horas,
      costoBase: costoEstimado || prev.costoBase
    }))
  }

  // Submit Modal
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombreModelo.trim()) {
      toast.error('El nombre del modelo es obligatorio')
      return
    }

    const payload = {
      nombreModelo: formData.nombreModelo.trim(),
      lineaCategoria: formData.lineaCategoria.trim() || 'General',
      pesoGramos: formData.pesoGramos ? parseFloat(formData.pesoGramos) : 0,
      costoBase: parseFloat(formData.costoBase) || 0,
      precioAmigos: parseFloat(formData.precioAmigos) || 0,
      precioMercado: parseFloat(formData.precioMercado) || 0,
      precioComunidad: parseFloat(formData.precioComunidad) || 0,
      activo: formData.activo
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        const updated = await updateProducto(editingId, payload)
        setProductos(prev => prev.map(p => p.id === editingId ? updated : p))
        toast.success(`Modelo "${payload.nombreModelo}" actualizado`)
      } else {
        const created = await createProducto(payload)
        setProductos(prev => [created, ...prev])
        toast.success(`Modelo "${payload.nombreModelo}" registrado en catálogo`)
      }
      setOpenModal(false)
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA Y BARRA DE ACCIONES                                           */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        
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
              Modelos 3D disponibles con costos base, tiempos de impresión y precios escalonados.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Botón Inventario de Filamentos */}
            <Link
              href="/catalogo/inventario"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#241C15] border border-[#E2D9CC] shadow-2xs transition-all cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <Palette className="h-4 w-4 text-[#A36F4C]" />
              <span>Filamentos</span>
            </Link>

            {/* Botón Gestionar Categorías */}
            <Link
              href="/catalogo/categorias"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#241C15] border border-[#E2D9CC] shadow-2xs transition-all cursor-pointer flex-1 sm:flex-initial justify-center"
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
        {/* 2. FILA SUPERIOR DE KPIS (GRID 4 COLUMNAS)                                */}
        {/* ========================================================================= */}
        {/* Fila de 4 KPIs Interactivos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
          {/* KPI 1: Total Modelos */}
          <div 
            onClick={() => setEstadoFilter('TODOS')}
            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between shadow-2xs cursor-pointer transition-all ${
              estadoFilter === 'TODOS'
                ? 'bg-[#FAF8F5] border-[#A36F4C] ring-2 ring-[#A36F4C]/25 shadow-xs'
                : 'bg-[#FAF8F5] border-[#E2D9CC] hover:border-[#A36F4C]/50 hover:bg-[#F4EFEA]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider truncate">
                Total Modelos
              </span>
              <div className="p-1.5 rounded-xl bg-[#F5EBE1] text-[#A36F4C] flex-shrink-0">
                <Boxes className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-black text-[#241C15] font-mono tracking-tight">
                {totalModelos} diseños
              </div>
              <span className="text-[10px] sm:text-xs text-[#75695D] font-medium mt-0.5 block truncate">
                En base de datos del taller
              </span>
            </div>
          </div>

          {/* KPI 2: Activos en Venta (Verde #1E5E3A) */}
          <div 
            onClick={() => setEstadoFilter('ACTIVOS')}
            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between shadow-2xs cursor-pointer transition-all ${
              estadoFilter === 'ACTIVOS'
                ? 'bg-[#EBF7EE]/40 border-[#1E5E3A] ring-2 ring-[#1E5E3A]/25 shadow-xs'
                : 'bg-[#FAF8F5] border-[#E2D9CC] hover:border-[#1E5E3A]/50 hover:bg-[#F4EFEA]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider truncate">
                Activos en Venta
              </span>
              <div className="p-1.5 rounded-xl bg-[#EBF7EE] text-[#1E5E3A] flex-shrink-0">
                <PackageCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-black text-[#1E5E3A] font-mono tracking-tight">
                {activosCount} modelos
              </div>
              <span className="text-[10px] sm:text-xs text-[#1E5E3A] font-bold mt-0.5 block truncate">
                Disponibles para pedidos
              </span>
            </div>
          </div>

          {/* KPI 3: Descontinuados */}
          <div 
            onClick={() => setEstadoFilter('DESCONTINUADOS')}
            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between shadow-2xs cursor-pointer transition-all ${
              estadoFilter === 'DESCONTINUADOS'
                ? 'bg-[#FAF8F5] border-[#75695D] ring-2 ring-[#75695D]/25 shadow-xs'
                : 'bg-[#FAF8F5] border-[#E2D9CC] hover:border-[#75695D]/50 hover:bg-[#F4EFEA]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider truncate">
                Descontinuados
              </span>
              <div className="p-1.5 rounded-xl bg-[#EAE4DC] text-[#75695D] flex-shrink-0">
                <Archive className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-black text-[#75695D] font-mono tracking-tight">
                {descontinuadosCount} archivados
              </div>
              <span className="text-[10px] sm:text-xs text-[#75695D] font-medium mt-0.5 block truncate">
                Fuera de catálogo activo
              </span>
            </div>
          </div>

          {/* KPI 4: Categorías Activas */}
          <Link
            href="/catalogo/categorias"
            className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] hover:border-[#A36F4C]/50 flex flex-col justify-between shadow-2xs transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider truncate">
                Categorías Activas
              </span>
              <div className="p-1.5 rounded-xl bg-[#F5EBE1] text-[#A36F4C] flex-shrink-0">
                <Layers className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-black text-[#A36F4C] font-mono tracking-tight">
                {categoriasActivasCount} familias
              </div>
              <span className="text-[10px] sm:text-xs text-[#A36F4C] font-bold mt-0.5 block truncate">
                Organización de catálogo →
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE HERRAMIENTAS Y FILTROS (SINGLE-ROW TOOLBAR)                   */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Lado Izquierdo: Buscador + Dropdown Categorías */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
              <Input 
                placeholder="Buscar modelo, tag o gramaje..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs sm:text-sm rounded-2xl h-10 focus:border-[#A36F4C] focus:bg-[#FFFFFF] transition-all"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-1 rounded-md cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown de Categorías */}
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="h-10 px-3 bg-[#F8F6F2] border border-[#E2D9CC] text-xs font-bold text-[#241C15] rounded-2xl focus:border-[#A36F4C] focus:bg-white cursor-pointer min-w-[150px]"
            >
              <option value="TODAS">Todas las Categorías</option>
              {categoryNamesList.map(cat => (
                <option key={cat} value={cat}>
                  {cat} ({productos.filter(p => p.lineaCategoria.toLowerCase() === cat.toLowerCase()).length})
                </option>
              ))}
            </select>
          </div>

          {/* Lado Derecho: Segmented Control Estado */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            <div className="bg-[#EAE4DC] p-1 rounded-2xl border border-[#D4BEA7] flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setEstadoFilter('TODOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  estadoFilter === 'TODOS'
                    ? 'bg-[#FFFFFF] text-[#241C15] shadow-xs'
                    : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
                }`}
              >
                Todos ({productos.length})
              </button>

              <button
                type="button"
                onClick={() => setEstadoFilter('ACTIVOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  estadoFilter === 'ACTIVOS'
                    ? 'bg-[#FFFFFF] text-[#1E5E3A] shadow-xs'
                    : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-[#1E5E3A]" />
                <span>Activos ({activosCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setEstadoFilter('DESCONTINUADOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  estadoFilter === 'DESCONTINUADOS'
                    ? 'bg-[#FFFFFF] text-[#75695D] shadow-xs'
                    : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
                }`}
              >
                Archivados ({descontinuadosCount})
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Filtros Activos & Reset si hay búsqueda o filtros aplicados */}
        {(search || estadoFilter !== 'TODOS' || categoriaFilter !== 'TODAS') && (
          <div className="flex items-center justify-between pt-2 border-t border-[#E2D9CC]/60 text-xs text-[#75695D]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">Mostrando:</span>
              <span className="font-bold text-[#241C15] bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#E2D9CC]">
                {filteredProductos.length} {filteredProductos.length === 1 ? 'modelo' : 'modelos'}
              </span>
              {search && (
                <span className="text-[#75695D]">
                  para &ldquo;<strong className="text-[#241C15]">{search}</strong>&rdquo;
                </span>
              )}
              {categoriaFilter !== 'TODAS' && (
                <span className="text-[#75695D]">
                  en <strong>{categoriaFilter}</strong>
                </span>
              )}
              {estadoFilter !== 'TODOS' && (
                <span className="text-[#75695D]">
                  estado <strong>{estadoFilter}</strong>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setEstadoFilter('TODOS')
                setCategoriaFilter('TODAS')
              }}
              className="text-xs text-[#A36F4C] hover:text-[#8E5E3E] font-bold underline flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. TABLA OPERATIVA PRINCIPAL (EXCLUSIVA Y 100% RESPONSIVE)               */}
      {/* ========================================================================= */}
      
      {/* VISTA ESCRITORIO (>= md / 768px): Tabla estructurada con scroll seguro y sin cortes */}
      <div className="hidden md:block w-full bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-auto sm:table-fixed text-xs min-w-[760px]">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[26%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#F4EFEA] border-b border-[#E2D9CC] text-[#75695D] text-[11px] font-semibold">
                <th className="py-3.5 px-4 font-bold text-left">Modelo & Familia</th>
                <th className="py-3.5 px-4 font-bold text-center">Especificaciones</th>
                <th className="py-3.5 px-4 font-bold text-right">Costo Base</th>
                <th className="py-3.5 px-4 font-bold text-center">Niveles de Precios (Amigos / Mercado / Comunidad)</th>
                <th className="py-3.5 px-4 font-bold text-center">Estado</th>
                <th className="py-3.5 px-4 font-bold text-right pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D9CC]">
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#75695D] italic bg-[#FFFFFF]">
                    No se encontraron productos con ese criterio de búsqueda
                  </td>
                </tr>
              ) : (
                filteredProductos.map((p) => {
                  const gramos = p.pesoGramos || 0
                  const costo = p.costoBase || 0
                  const isMenuOpen = activeMenuId === p.id

                  return (
                    <tr 
                      key={p.id} 
                      className={`h-16 transition-colors ${
                        !p.activo ? 'bg-[#FAF8F5]/60 opacity-80' : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {/* Columna 1: Modelo & Familia */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <Package className="h-4.5 w-4.5 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-[#241C15] block truncate" title={p.nombreModelo}>
                              {p.nombreModelo}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-2 py-0 bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC] mt-0.5">
                              {p.lineaCategoria || 'General'}
                            </Badge>
                          </div>
                        </div>
                      </td>

                      {/* Columna 2: Especificaciones Técnicas */}
                      <td className="py-3 px-4 text-center font-mono text-xs text-[#241C15] min-w-[110px]">
                        <span className="font-bold block">
                          {gramos > 0 ? `${gramos}g` : '—'}
                        </span>
                        <span className="text-[10px] text-[#75695D] block">
                          {estimarTiempoImpresion(gramos)}
                        </span>
                      </td>

                      {/* Columna 3: Costo Base */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#241C15] text-xs min-w-[90px] tabular-nums">
                        {formatCurrency(costo)}
                      </td>

                      {/* Columna 4: Niveles de Precios (3 Columnas delgadas) */}
                      <td className="py-3 px-4 min-w-[280px]">
                        <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-xs tabular-nums">
                          {/* Amigos */}
                          <div className="p-1 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]/70">
                            <span className="text-[9px] text-[#75695D] block font-sans">Amigos</span>
                            <span className="font-semibold text-[#241C15] block">
                              {formatCurrency(p.precioAmigos)}
                            </span>
                            <span className="text-[9px] text-[#1E5E3A] font-bold block">
                              {calcMargen(p.precioAmigos, costo)}
                            </span>
                          </div>

                          {/* Mercado */}
                          <div className="p-1 rounded-xl bg-[#FFFFFF] border border-[#A36F4C]/40 shadow-2xs ring-1 ring-[#A36F4C]/10">
                            <span className="text-[9px] text-[#A36F4C] block font-sans font-bold">Mercado</span>
                            <span className="font-black text-[#A36F4C] block">
                              {formatCurrency(p.precioMercado)}
                            </span>
                            <span className="text-[9px] text-[#1E5E3A] font-bold block">
                              {calcMargen(p.precioMercado, costo)}
                            </span>
                          </div>

                          {/* Comunidad */}
                          <div className="p-1 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]/70">
                            <span className="text-[9px] text-[#75695D] block font-sans">Comunidad</span>
                            <span className="font-semibold text-[#241C15] block">
                              {formatCurrency(p.precioComunidad)}
                            </span>
                            <span className="text-[9px] text-[#1E5E3A] font-bold block">
                              {calcMargen(p.precioComunidad, costo)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Columna 5: Estado */}
                      <td className="py-3 px-4 text-center min-w-[100px]">
                        {p.activo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#B4E3C0] text-[#1E5E3A] text-[11px] font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1E5E3A]" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] text-[11px] font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#75695D]" />
                            <span>Archivado</span>
                          </span>
                        )}
                      </td>

                      {/* Columna 6: Acciones Rápidas (Extremo Derecho Visible) */}
                      <td className="py-3 px-4 text-right pr-4 min-w-[120px]">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Copiar Cotización */}
                          <button
                            type="button"
                            onClick={() => handleCopiarCotizacion(p)}
                            className="p-1.5 rounded-xl border border-[#E2D9CC] bg-white hover:bg-[#F4EFEA] text-[#75695D] hover:text-[#A36F4C] transition-colors cursor-pointer shadow-2xs"
                            title="Copiar cotización para WhatsApp"
                          >
                            {copiedId === p.id ? (
                              <Check className="h-3.5 w-3.5 text-[#1E5E3A]" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Botón Editar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-xl border border-[#E2D9CC] bg-white hover:bg-[#F4EFEA] text-[#75695D] hover:text-[#A36F4C] transition-colors cursor-pointer shadow-2xs"
                            title="Editar producto"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* Menú de Tres Puntos */}
                          <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(isMenuOpen ? null : p.id)}
                              className="p-1.5 rounded-xl border border-[#E2D9CC] bg-white hover:bg-[#F4EFEA] text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer shadow-2xs"
                              title="Más opciones"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>

                            {/* Dropdown contextual */}
                            {isMenuOpen && (
                              <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E2D9CC] rounded-2xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicar(p)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left rounded-xl hover:bg-[#F4EFEA] text-xs font-bold text-[#241C15] cursor-pointer"
                                >
                                  <CopyPlus className="h-3.5 w-3.5 text-[#A36F4C]" />
                                  <span>Duplicar Modelo</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleEstado(p)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left rounded-xl hover:bg-[#F4EFEA] text-xs font-bold text-[#241C15] cursor-pointer"
                                >
                                  {p.activo ? (
                                    <>
                                      <Archive className="h-3.5 w-3.5 text-[#75695D]" />
                                      <span>Descontinuar</span>
                                    </>
                                  ) : (
                                    <>
                                      <RotateCcw className="h-3.5 w-3.5 text-[#1E5E3A]" />
                                      <span>Reactivar</span>
                                    </>
                                  )}
                                </button>

                                <div className="border-t border-[#E2D9CC]/60 my-0.5" />

                                <button
                                  type="button"
                                  onClick={() => handleDelete(p)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left rounded-xl hover:bg-red-50 text-xs font-bold text-[#DC2626] cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Eliminar / Archivar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VISTA MÓVIL (< md / 768px): Tarjetas colapsables limpias y táctiles */}
      <div className="block md:hidden space-y-3">
        {filteredProductos.length === 0 ? (
          <div className="p-8 text-center bg-[#FFFFFF] rounded-3xl border border-dashed border-[#E2D9CC] text-[#75695D] italic text-xs">
            No se encontraron productos
          </div>
        ) : (
          filteredProductos.map((p) => {
            const gramos = p.pesoGramos || 0
            const costo = p.costoBase || 0

            return (
              <div
                key={p.id}
                className={`bg-[#FFFFFF] border rounded-3xl p-4 shadow-2xs space-y-3 ${
                  !p.activo ? 'border-[#E2D9CC] opacity-85 bg-[#FAF8F5]' : 'border-[#E2D9CC]'
                }`}
              >
                {/* Fila 1: Header móvil con Avatar, Título y Estado */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Package className="h-4.5 w-4.5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-[#241C15] block truncate" title={p.nombreModelo}>
                        {p.nombreModelo}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-2 py-0 bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC] mt-0.5">
                        {p.lineaCategoria || 'General'}
                      </Badge>
                    </div>
                  </div>

                  {p.activo ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#B4E3C0] text-[#1E5E3A] text-[10px] font-bold shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1E5E3A]" />
                      <span>Activo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] text-[10px] shrink-0 font-medium">
                      Archivado
                    </span>
                  )}
                </div>

                {/* Fila 2: Especificaciones Técnicas y Costo Base */}
                <div className="flex items-center justify-between text-xs font-mono bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#E2D9CC]/70">
                  <div className="flex items-center gap-3">
                    <span className="text-[#75695D]">
                      Peso: <strong className="text-[#241C15]">{gramos > 0 ? `${gramos}g` : '—'}</strong>
                    </span>
                    <span className="text-[#75695D]">
                      Tiempo: <strong className="text-[#241C15]">{estimarTiempoImpresion(gramos)}</strong>
                    </span>
                  </div>
                  <span className="font-bold text-[#241C15]">
                    Costo: {formatCurrency(costo)}
                  </span>
                </div>

                {/* Fila 3: Precios Escalonados (3 Cols) */}
                <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-xs tabular-nums">
                  <div className="p-1.5 bg-[#FAF8F5] rounded-xl border border-[#E2D9CC]/70">
                    <span className="text-[9px] text-[#75695D] block font-sans">Amigos</span>
                    <span className="font-bold text-[#241C15] block">{formatCurrency(p.precioAmigos)}</span>
                    <span className="text-[9px] text-[#1E5E3A] font-bold block">{calcMargen(p.precioAmigos, costo)}</span>
                  </div>

                  <div className="p-1.5 bg-[#FFFFFF] rounded-xl border border-[#A36F4C]/40 ring-1 ring-[#A36F4C]/10">
                    <span className="text-[9px] text-[#A36F4C] block font-sans font-bold">Mercado</span>
                    <span className="font-black text-[#A36F4C] block">{formatCurrency(p.precioMercado)}</span>
                    <span className="text-[9px] text-[#1E5E3A] font-bold block">{calcMargen(p.precioMercado, costo)}</span>
                  </div>

                  <div className="p-1.5 bg-[#FAF8F5] rounded-xl border border-[#E2D9CC]/70">
                    <span className="text-[9px] text-[#75695D] block font-sans">Comunidad</span>
                    <span className="font-bold text-[#241C15] block">{formatCurrency(p.precioComunidad)}</span>
                    <span className="text-[9px] text-[#1E5E3A] font-bold block">{calcMargen(p.precioComunidad, costo)}</span>
                  </div>
                </div>

                {/* Fila 4: Acciones Móvil */}
                <div className="pt-2 border-t border-[#E2D9CC]/70 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopiarCotizacion(p)}
                    className="flex-1 h-8 px-3 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#241C15] font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {copiedId === p.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#1E5E3A]" />
                        <span className="text-[#1E5E3A]">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5 text-[#A36F4C]" />
                        <span>Copiar Cotización</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="h-8 px-3 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#75695D] hover:text-[#A36F4C] font-bold text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicar(p)}
                    className="h-8 w-8 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#75695D] flex items-center justify-center shadow-2xs"
                    title="Duplicar"
                  >
                    <CopyPlus className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleEstado(p)}
                    className={`h-8 w-8 rounded-xl border flex items-center justify-center shadow-2xs ${
                      p.activo ? 'border-[#E2D9CC] text-[#75695D]' : 'border-[#B4E3C0] bg-[#EBF7EE] text-[#1E5E3A]'
                    }`}
                    title={p.activo ? 'Descontinuar' : 'Reactivar'}
                  >
                    {p.activo ? <Archive className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: CREAR / EDITAR PRODUCTO 3D (2 COLUMNAS)                         */}
      {/* ========================================================================= */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[560px] max-h-[92dvh] overflow-y-auto p-0 rounded-3xl shadow-2xl z-50">
          <form onSubmit={handleSubmitModal} className="p-5 sm:p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  {editingId ? <Pencil className="h-5 w-5" /> : <Boxes className="h-5 w-5" />}
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-[#241C15]">
                    {editingId ? 'Editar Modelo 3D' : 'Registrar Nuevo Producto 3D'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                    Define costos base, parámetros técnicos y precios escalonados
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-xl hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Formulario en 2 Columnas */}
            <div className="space-y-4">
              
              {/* Fila 1: Nombre & Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                    Nombre del Modelo *
                  </Label>
                  <Input 
                    value={formData.nombreModelo}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombreModelo: e.target.value }))}
                    placeholder="Ej: Maceta Hexagonal XL"
                    required
                    autoFocus
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-bold text-[#241C15] h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                    Categoría / Familia *
                  </Label>
                  <Input 
                    value={formData.lineaCategoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, lineaCategoria: e.target.value }))}
                    placeholder="Ej: Macetas & Jardín"
                    required
                    list="categorias-list"
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-bold text-[#241C15] h-10"
                  />
                  <datalist id="categorias-list">
                    {categoryNamesList.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Fila 2: Parámetros Técnicos (Gramos, Tiempo, Costo Base) */}
              <div className="p-3.5 bg-[#FAF8F5] border border-[#E2D9CC] rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241C15] uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5 text-[#A36F4C]" />
                    Parámetros de Taller & Costo
                  </span>
                  <span className="text-[10px] text-[#75695D]">
                    Auto-cálculo de costo sugerido
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-[#75695D]">Peso (g)</Label>
                    <Input 
                      type="number"
                      step="1"
                      value={formData.pesoGramos}
                      onChange={(e) => handleGramosChange(e.target.value)}
                      placeholder="150"
                      className="bg-white border-[#E2D9CC] rounded-xl text-xs font-mono font-bold h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-[#75695D]">Tiempo (h)</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      value={formData.tiempoHoras}
                      onChange={(e) => setFormData(prev => ({ ...prev, tiempoHoras: e.target.value }))}
                      placeholder="4.5"
                      className="bg-white border-[#E2D9CC] rounded-xl text-xs font-mono font-bold h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-[#1E5E3A]">Costo Base (S/)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.costoBase}
                      onChange={(e) => setFormData(prev => ({ ...prev, costoBase: e.target.value }))}
                      placeholder="9.75"
                      required
                      className="bg-white border-[#B4E3C0] text-[#1E5E3A] rounded-xl text-xs font-mono font-black h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 3: Precios Escalonados & Márgenes en Tiempo Real */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Precios Escalonados de Venta (S/)
                </Label>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Amigos */}
                  <div className="space-y-1 p-2 bg-[#F8F6F2] rounded-xl border border-[#E2D9CC]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#75695D]">Amigos</span>
                      <span className="font-mono font-bold text-[#1E5E3A]">
                        {calcMargen(parseFloat(formData.precioAmigos) || 0, parseFloat(formData.costoBase) || 0)}
                      </span>
                    </div>
                    <Input 
                      type="number"
                      step="0.5"
                      value={formData.precioAmigos}
                      onChange={(e) => setFormData(prev => ({ ...prev, precioAmigos: e.target.value }))}
                      placeholder="18.00"
                      className="bg-white border-[#E2D9CC] rounded-lg text-xs font-mono font-bold h-8"
                    />
                  </div>

                  {/* Mercado */}
                  <div className="space-y-1 p-2 bg-[#FAF8F5] rounded-xl border border-[#A36F4C]/40 ring-1 ring-[#A36F4C]/10">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#A36F4C]">Mercado</span>
                      <span className="font-mono font-bold text-[#1E5E3A]">
                        {calcMargen(parseFloat(formData.precioMercado) || 0, parseFloat(formData.costoBase) || 0)}
                      </span>
                    </div>
                    <Input 
                      type="number"
                      step="0.5"
                      value={formData.precioMercado}
                      onChange={(e) => setFormData(prev => ({ ...prev, precioMercado: e.target.value }))}
                      placeholder="30.00"
                      className="bg-white border-[#A36F4C]/50 rounded-lg text-xs font-mono font-black h-8 text-[#A36F4C]"
                    />
                  </div>

                  {/* Comunidad */}
                  <div className="space-y-1 p-2 bg-[#F8F6F2] rounded-xl border border-[#E2D9CC]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#75695D]">Comunidad</span>
                      <span className="font-mono font-bold text-[#1E5E3A]">
                        {calcMargen(parseFloat(formData.precioComunidad) || 0, parseFloat(formData.costoBase) || 0)}
                      </span>
                    </div>
                    <Input 
                      type="number"
                      step="0.5"
                      value={formData.precioComunidad}
                      onChange={(e) => setFormData(prev => ({ ...prev, precioComunidad: e.target.value }))}
                      placeholder="25.00"
                      className="bg-white border-[#E2D9CC] rounded-lg text-xs font-mono font-bold h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 4: Estado Inicial */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Estado del Producto
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, activo: true }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formData.activo
                        ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] shadow-2xs'
                        : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC]'
                    }`}
                  >
                    🟢 Activo en Venta
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, activo: false }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      !formData.activo
                        ? 'bg-[#FAF8F5] text-[#75695D] border-[#D4BEA7] shadow-2xs'
                        : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC]'
                    }`}
                  >
                    📁 Descontinuado
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#E2D9CC]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenModal(false)}
                className="text-xs rounded-xl cursor-pointer text-[#75695D]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-5 rounded-xl cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
