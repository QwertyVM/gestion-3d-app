'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Tag, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  X, 
  ArrowLeft, 
  ShoppingBag, 
  DollarSign, 
  Wrench,
  Truck,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { createTagInsumo, updateTagInsumo, deleteTagInsumo, TagInsumoItem, CategoriaTag } from '@/actions/tagsInsumos'
import { toast } from 'sonner'

interface TagsInsumosClientProps {
  tags: TagInsumoItem[]
}

const ITEMS_PER_PAGE = 5

const CATEGORIAS_TAG: { id: CategoriaTag; label: string; icon: any; desc: string }[] = [
  { id: 'INSUMO', label: 'Insumos & Materiales', icon: ShoppingBag, desc: 'Filamentos, Packaging, Consumibles' },
  { id: 'ACTIVO_FIJO', label: 'Activo Fijo / Equipos', icon: Wrench, desc: 'Impresoras 3D, Herramientas' },
  { id: 'SERVICIO', label: 'Servicios & Operativos', icon: Truck, desc: 'Fletes, Publicidad, Cuotas' },
]

const COLOR_OPTIONS = [
  { id: 'amber', name: 'Ámbar', bg: 'bg-[#FDF6E2]', text: 'text-[#8C6D1F]', border: 'border-[#E8D49B]' },
  { id: 'blue', name: 'Terracota', bg: 'bg-[#EFE5D8]', text: 'text-[#633E20]', border: 'border-[#D4BEA7]' },
  { id: 'emerald', name: 'Verde Taller', bg: 'bg-[#EBF7EE]', text: 'text-[#1E5E3A]', border: 'border-[#B4E3C0]' },
  { id: 'purple', name: 'Púrpura', bg: 'bg-[#F3EDFA]', text: 'text-[#6A389D]', border: 'border-[#D6C2ED]' },
  { id: 'pink', name: 'Cobre Suave', bg: 'bg-[#FDF0EE]', text: 'text-[#A34335]', border: 'border-[#F2C0B8]' },
  { id: 'indigo', name: 'Crema Arena', bg: 'bg-[#F4EFEA]', text: 'text-[#241C15]', border: 'border-[#DCD3C6]' },
]

export function TagsInsumosClient({ tags }: TagsInsumosClientProps) {
  const router = useRouter()
  const [items, setItems] = useState<TagInsumoItem[]>(tags)
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<'TODOS' | CategoriaTag>('TODOS')
  const [openModal, setOpenModal] = useState(false)
  const [editingTag, setEditingTag] = useState<TagInsumoItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Form states
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formColor, setFormColor] = useState('amber')
  const [formCategoria, setFormCategoria] = useState<CategoriaTag>('INSUMO')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (val: number) => 
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoriaFilter])

  // Filtered tags
  const filteredTags = useMemo(() => {
    return items.filter(t => {
      const matchSearch = 
        t.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(search.toLowerCase()))
      
      const matchCat = categoriaFilter === 'TODOS' || t.categoria === categoriaFilter
      return matchSearch && matchCat
    })
  }, [items, search, categoriaFilter])

  const totalPages = Math.max(1, Math.ceil(filteredTags.length / ITEMS_PER_PAGE))
  const paginatedTags = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredTags.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTags, currentPage])

  const totalGastoGeneral = items.reduce((acc, t) => acc + t.gastoAcumulado, 0)
  const totalItemsRegistrados = items.reduce((acc, t) => acc + t.totalEgresos, 0)

  // Open Create
  const handleOpenCreate = () => {
    setEditingTag(null)
    setFormNombre('')
    setFormDescripcion('')
    setFormColor('amber')
    setFormCategoria('INSUMO')
    setOpenModal(true)
  }

  // Open Edit
  const handleOpenEdit = (tag: TagInsumoItem) => {
    setEditingTag(tag)
    setFormNombre(tag.nombre)
    setFormDescripcion(tag.descripcion || '')
    setFormColor(tag.color || 'amber')
    setFormCategoria(tag.categoria || 'INSUMO')
    setOpenModal(true)
  }

  // Submit form (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNombre.trim()) {
      toast.error('El nombre del tag es obligatorio')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingTag) {
        const updated = await updateTagInsumo(editingTag.id, {
          nombre: formNombre.trim(),
          descripcion: formDescripcion.trim() || null,
          color: formColor,
          categoria: formCategoria,
        })
        setItems(prev => prev.map(t => t.id === editingTag.id ? { ...t, ...updated } : t))
        toast.success(`Tag "${formNombre}" actualizado exitosamente`)
      } else {
        const created = await createTagInsumo({
          nombre: formNombre.trim(),
          descripcion: formDescripcion.trim() || null,
          color: formColor,
          categoria: formCategoria,
        })
        setItems(prev => [...prev, created as any])
        toast.success(`Tag "${formNombre}" creado exitosamente`)
      }
      setOpenModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar tag')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete
  const handleDelete = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar el tag "${nombre}"?`)) {
      try {
        await deleteTagInsumo(id)
        setItems(prev => prev.filter(t => t.id !== id))
        toast.success(`Tag "${nombre}" eliminado`)
        router.refresh()
      } catch (err: any) {
        toast.error(err?.message || 'Error al eliminar tag')
      }
    }
  }

  const getTagColorClasses = (colorId: string) => {
    const opt = COLOR_OPTIONS.find(c => c.id === colorId) || COLOR_OPTIONS[0]
    return `${opt.bg} ${opt.text} ${opt.border}`
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link 
              href="/finanzas/egresos" 
              className="p-1.5 rounded-xl text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF] transition-colors border border-transparent hover:border-[#E2D9CC] shadow-sm"
              title="Volver a Egresos"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C]">
                <Tag className="h-6 w-6 stroke-[2.5]" />
              </div>
              Gestión de Tags & Subcategorías
            </h1>
          </div>
          <p className="text-sm text-[#75695D]">
            Asocia cada tag a una categoría principal para filtrarlos automáticamente al registrar egresos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/finanzas/egresos">
            <Button variant="outline" className="border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#F4EFEA] hover:border-[#DCD3C6] cursor-pointer rounded-xl text-xs h-10 shadow-sm font-medium">
              <ShoppingBag className="h-4 w-4 mr-1.5 text-[#A36F4C]" />
              Ver Egresos
            </Button>
          </Link>

          <Button 
            onClick={handleOpenCreate}
            className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-[#FFFFFF] font-bold shadow-md shadow-[#A36F4C]/20 transition-all cursor-pointer rounded-xl px-4 py-2.5 text-xs h-10 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            Nuevo Tag
          </Button>
        </div>
      </div>

      {/* KPI Cards Light Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A36F4C] flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags Creados
          </span>
          <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
            {items.length} <span className="text-sm font-normal text-[#75695D]">etiquetas</span>
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">Clasificación activa del taller</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#633E20] flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Insumos Asignados
          </span>
          <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
            {totalItemsRegistrados} <span className="text-sm font-normal text-[#75695D]">compras</span>
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">Compras etiquetadas</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A] flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Gasto Total Etiquetado
          </span>
          <div className="text-2xl font-extrabold text-[#1E5E3A] font-mono mt-1">
            {formatCurrency(totalGastoGeneral)}
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">Acumulado en compras</span>
        </div>
      </div>

      {/* 1-Row Compact Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Lado Izquierdo: Campo de Búsqueda */}
        <div className="relative w-full md:w-72 lg:w-80 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
          <Input 
            placeholder="Buscar tag o descripción..."
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

        {/* Lado Derecho: Segmented Control Tabs */}
        <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC] overflow-x-auto max-w-full">
          <button
            onClick={() => setCategoriaFilter('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
              categoriaFilter === 'TODOS'
                ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
            }`}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setCategoriaFilter('INSUMO')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              categoriaFilter === 'INSUMO'
                ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
            }`}
          >
            <ShoppingBag className="h-3 w-3" />
            Insumos
          </button>
          <button
            onClick={() => setCategoriaFilter('ACTIVO_FIJO')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              categoriaFilter === 'ACTIVO_FIJO'
                ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
            }`}
          >
            <Wrench className="h-3 w-3" />
            Maquinaria
          </button>
          <button
            onClick={() => setCategoriaFilter('SERVICIO')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              categoriaFilter === 'SERVICIO'
                ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
            }`}
          >
            <Truck className="h-3 w-3" />
            Servicios & Op.
          </button>
        </div>
      </div>

      {/* Tags Table & Mobile Cards */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] overflow-hidden shadow-md rounded-2xl">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-[#E2D9CC]/70">
          {paginatedTags.length === 0 ? (
            <div className="p-8 text-center text-[#75695D] text-xs">
              <div className="flex flex-col items-center justify-center gap-2">
                <Tag className="h-8 w-8 text-[#A89B8D]" />
                <span>No hay tags registrados con los filtros actuales.</span>
              </div>
            </div>
          ) : (
            paginatedTags.map((tag) => (
              <div key={tag.id} className="p-3.5 space-y-2 bg-[#FFFFFF] hover:bg-[#FDFBF7] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Badge variant="outline" className={`text-xs font-semibold py-1 px-2.5 gap-1.5 ${getTagColorClasses(tag.color)}`}>
                      <Tag className="h-3 w-3" />
                      {tag.nombre}
                    </Badge>
                    {tag.descripcion && (
                      <p className="text-xs text-[#75695D] mt-1.5 line-clamp-2">
                        {tag.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenEdit(tag)}
                      className="h-8 w-8 text-[#75695D] hover:text-[#A36F4C] hover:bg-[#EFE5D8] rounded-lg cursor-pointer"
                      title="Editar tag"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(tag.id, tag.nombre)}
                      className="h-8 w-8 text-[#75695D] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Eliminar tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-[#E2D9CC]/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tag.categoria === 'ACTIVO_FIJO' ? (
                      <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-[10px] font-semibold">
                        Maquinaria & Equipos
                      </Badge>
                    ) : tag.categoria === 'SERVICIO' ? (
                      <Badge variant="outline" className="bg-emerald-50 text-[#1E5E3A] border-emerald-200 text-[10px] font-semibold">
                        Servicios & Operativos
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-semibold">
                        Insumos & Materiales
                      </Badge>
                    )}
                    <span className="text-[10px] text-[#75695D] font-mono">
                      {tag.totalEgresos} {tag.totalEgresos === 1 ? 'ítem' : 'ítems'}
                    </span>
                  </div>

                  <span className="font-mono font-bold text-[#A36F4C] text-xs">
                    {formatCurrency(tag.gastoAcumulado)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto scrollbar-thin">
          <Table className="w-full min-w-[650px]">
            <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
              <TableRow className="border-[#E2D9CC] hover:bg-transparent">
                <TableHead className="text-[#241C15] font-bold px-4 py-3 text-left">Tag / Subcategoría</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Categoría Asociada</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Descripción / Uso</TableHead>
                <TableHead className="text-[#241C15] font-bold px-4 py-3 text-center">Insumos Registrados</TableHead>
                <TableHead className="text-[#241C15] font-bold px-4 py-3 text-right">Gasto Acumulado</TableHead>
                <TableHead className="text-[#241C15] font-bold px-4 py-3 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-[#75695D]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Tag className="h-8 w-8 text-[#A89B8D]" />
                      <span>No hay tags registrados con los filtros actuales.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTags.map((tag) => (
                  <TableRow 
                    key={tag.id}
                    className="border-[#E2D9CC]/70 hover:bg-[#FDFBF7] transition-colors"
                  >
                    {/* Tag Name with Color Badge */}
                    <TableCell className="px-4 py-3 font-semibold">
                      <Badge variant="outline" className={`text-xs font-semibold py-1 px-2.5 gap-1.5 ${getTagColorClasses(tag.color)}`}>
                        <Tag className="h-3 w-3" />
                        {tag.nombre}
                      </Badge>
                    </TableCell>

                    {/* Categoría Asociada */}
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {tag.categoria === 'ACTIVO_FIJO' ? (
                        <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-xs font-semibold">
                          Maquinaria & Equipos
                        </Badge>
                      ) : tag.categoria === 'SERVICIO' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-[#1E5E3A] border-emerald-200 text-xs font-semibold">
                          Servicios & Operativos
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-xs font-semibold">
                          Insumos & Materiales
                        </Badge>
                      )}
                    </TableCell>

                    {/* Description */}
                    <TableCell className="px-4 py-3 text-xs text-[#75695D]">
                      {tag.descripcion || <span className="text-[#A89B8D] italic">Sin descripción</span>}
                    </TableCell>

                    {/* Total Insumos */}
                    <TableCell className="px-4 py-3 text-center font-mono text-xs">
                      <Badge variant="outline" className="bg-[#F4EFEA] border-[#E2D9CC] text-[#241C15] font-semibold">
                        {tag.totalEgresos} {tag.totalEgresos === 1 ? 'ítem' : 'ítems'}
                      </Badge>
                    </TableCell>

                    {/* Gasto Total */}
                    <TableCell className="px-4 py-3 text-right font-mono font-bold text-[#A36F4C] text-xs">
                      {formatCurrency(tag.gastoAcumulado)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit(tag)}
                          className="h-8 w-8 text-[#75695D] hover:text-[#A36F4C] hover:bg-[#EFE5D8] rounded-lg cursor-pointer"
                          title="Editar tag"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(tag.id, tag.nombre)}
                          className="h-8 w-8 text-[#75695D] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Eliminar tag"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#FDFBF7] border-t border-[#E2D9CC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#75695D]">
              Mostrando página <strong className="text-[#241C15]">{currentPage}</strong> de <strong className="text-[#241C15]">{totalPages}</strong> ({filteredTags.length} tags)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer"
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
                        ? 'bg-[#A36F4C] text-[#FFFFFF] shadow-sm'
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
                className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR TAG (LIGHT MODE NOVA)                               */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR TAG (LIGHT MODE NOVA)                               */}
      {/* ========================================================================= */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[500px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-2xl z-50">
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[#A36F4C] shadow-sm">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-[#241C15] tracking-tight">
                    {editingTag ? 'Editar Tag de Insumo' : 'Crear Nuevo Tag de Insumo'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                    Asocia el tag a una categoría principal para que se filtre dinámicamente.
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 touch-pan-y">
              {/* 1. Categoría Asociada */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#241C15]">
                  Categoría Principal Asociada <span className="text-[#A36F4C]">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CATEGORIAS_TAG.map(c => {
                    const isSelected = formCategoria === c.id
                    const Icon = c.icon
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormCategoria(c.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                          isSelected
                            ? 'bg-[#FDFBF7] border-[#A36F4C] ring-1 ring-[#A36F4C]/40 text-[#241C15] shadow-sm'
                            : 'bg-[#FFFFFF] border-[#E2D9CC] text-[#75695D] hover:border-[#DCD3C6] hover:text-[#241C15]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-[#A36F4C]' : 'text-[#75695D]'}`} />
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#A36F4C]" />}
                        </div>
                        <div className="font-bold text-[11px] leading-tight">{c.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Nombre del Tag */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#241C15]">
                  Nombre del Tag <span className="text-[#A36F4C]">*</span>
                </Label>
                <Input 
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej: Filamento PLA, Cajas 15x15, Tornillería M3..."
                  required
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                />
              </div>

              {/* 3. Selector de Color */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#241C15]">
                  Color de Identificación Visual
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_OPTIONS.map(c => {
                    const isSelected = formColor === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormColor(c.id)}
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected 
                            ? `${c.bg} ${c.text} ${c.border} ring-2 ring-[#A36F4C]/50 shadow-sm font-bold`
                            : 'bg-[#FFFFFF] border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:border-[#DCD3C6]'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${c.bg} border ${c.border}`}></span>
                        {c.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 4. Descripción */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#241C15]">
                  Descripción / Notas (Opcional)
                </Label>
                <Input 
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Ej: Bobinas de filamento PLA para proyectos de clientes..."
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                />
              </div>

              {/* Preview */}
              <div className="p-3 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] flex items-center justify-between text-xs">
                <span className="text-[#75695D] font-medium">Vista previa del tag:</span>
                <Badge variant="outline" className={`text-xs font-semibold py-1 px-2.5 gap-1.5 ${getTagColorClasses(formColor)}`}>
                  <Tag className="h-3 w-3" />
                  {formNombre.trim() || 'Nombre del Tag'}
                </Badge>
              </div>
            </div>

            {/* Buttons */}
            <div className="px-5 sm:px-6 py-4 border-t border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-end gap-3 flex-shrink-0">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenModal(false)}
                className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2.5 rounded-xl cursor-pointer font-medium active:scale-[0.98]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-[#FFFFFF] font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#A36F4C]/20 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  editingTag ? 'Guardar Cambios' : 'Crear Tag'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
