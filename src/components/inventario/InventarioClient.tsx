'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  X, 
  Copy, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Palette, 
  CheckCircle2, 
  ShoppingCart, 
  AlertTriangle,
  Sparkles,
  Trash2,
  Package,
  Pencil,
  SlidersHorizontal,
  Layers,
  Flame,
  ArrowUpDown
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  ColorFilamentoItem, 
  moverEstadoColor, 
  actualizarGramosColor,
  actualizarRollosColor,
  agregarNuevoColor, 
  eliminarColor, 
  resetColoresTaller,
  editarColorFilamento
} from '@/actions/inventario'

interface InventarioClientProps {
  disponibles: ColorFilamentoItem[]
  restock: ColorFilamentoItem[]
}

const PRESET_SWATCHES = [
  { name: 'Negro carbón', hex: '#18181B' },
  { name: 'Blanco hueso', hex: '#F5F5F0' },
  { name: 'Blanco marfil', hex: '#FFFBEB' },
  { name: 'Gris ceniza', hex: '#94A3B8' },
  { name: 'Lila púrpura', hex: '#C084FC' },
  { name: 'Rojo escarlata', hex: '#DC2626' },
  { name: 'Rojo oscuro', hex: '#7F1D1D' },
  { name: 'Azul oscuro', hex: '#1E3A8A' },
  { name: 'Verde grass', hex: '#22C55E' },
  { name: 'Verde manzana', hex: '#65A30D' },
  { name: 'Verde oscuro', hex: '#14532D' },
  { name: 'Naranja mandarina', hex: '#F97316' },
  { name: 'Marrón latte', hex: '#854D0E' },
  { name: 'Marrón oscuro', hex: '#3E2723' },
  { name: 'Chocolate oscuro', hex: '#451A03' },
  { name: 'Terracota', hex: '#A36F4C' },
  { name: 'Arena', hex: '#D4B996' },
  { name: 'Rosa Sakura', hex: '#F472B6' },
  { name: 'Ciruela', hex: '#581C87' },
]

export function InventarioClient({ 
  disponibles: initialDisponibles, 
  restock: initialRestock 
}: InventarioClientProps) {
  const [disponibles, setDisponibles] = useState<ColorFilamentoItem[]>(initialDisponibles)
  const [restock, setRestock] = useState<ColorFilamentoItem[]>(initialRestock)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'disponibles' | 'restock' | 'todos'>('disponibles')
  const [filterCritico, setFilterCritico] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()

  // Quick Add State
  const [openAddModal, setOpenAddModal] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoHex, setNuevoHex] = useState('#18181B')
  const [nuevoEstado, setNuevoEstado] = useState<'DISPONIBLE' | 'RESTOCK'>('DISPONIBLE')
  const [nuevoRollos, setNuevoRollos] = useState('1')
  const [nuevoGramos, setNuevoGramos] = useState('1000')
  const [nuevaNota, setNuevaNota] = useState('')

  // Edit Spool State
  const [openEditModal, setOpenEditModal] = useState(false)
  const [editColorId, setEditColorId] = useState('')
  const [editNombre, setEditNombre] = useState('')
  const [editHex, setEditHex] = useState('#18181B')
  const [editNota, setEditNota] = useState('')

  const handleOpenEditColor = (item: ColorFilamentoItem) => {
    setEditColorId(item.id)
    setEditNombre(item.nombreColor)
    setEditHex(item.codigoHex || '#18181B')
    setEditNota(item.nota || '')
    setOpenEditModal(true)
  }

  const handleEditColorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editNombre.trim() || !editColorId) return

    try {
      await editarColorFilamento(editColorId, {
        nombreColor: editNombre.trim(),
        codigoHex: editHex,
        nota: editNota.trim() || null
      })

      const updater = (prev: ColorFilamentoItem[]) =>
        prev.map(c => c.id === editColorId ? { ...c, nombreColor: editNombre.trim(), codigoHex: editHex, nota: editNota.trim() || null } : c)

      setDisponibles(updater)
      setRestock(updater)
      setOpenEditModal(false)
      toast.success(`Bobina "${editNombre.trim()}" actualizada`)
    } catch (err: any) {
      toast.error('Error al editar: ' + (err?.message || 'Error desconocido'))
    }
  }

  // Details Modal State for invested products
  const [selectedColorForDetails, setSelectedColorForDetails] = useState<ColorFilamentoItem | null>(null)
  const [openColorDetailsModal, setOpenColorDetailsModal] = useState(false)

  const handleOpenColorDetails = (item: ColorFilamentoItem) => {
    setSelectedColorForDetails(item)
    setOpenColorDetailsModal(true)
  }

  // Filtered and sorted lists (Críticos arriba, orden alfabético)
  const filteredDisponibles = useMemo(() => {
    let list = disponibles
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.nombreColor.toLowerCase().includes(q))
    }
    if (filterCritico) {
      list = list.filter(c => (c.stockGramos ?? 1000) < 300 || Boolean(c.alertaCritica))
    }

    return [...list].sort((a, b) => {
      const aGramos = a.stockGramos ?? 1000
      const bGramos = b.stockGramos ?? 1000
      const aCritico = aGramos < 300 || Boolean(a.alertaCritica)
      const bCritico = bGramos < 300 || Boolean(b.alertaCritica)

      // 1. Críticos primero arriba
      if (aCritico && !bCritico) return -1
      if (!aCritico && bCritico) return 1

      // 2. Orden alfabético
      return a.nombreColor.localeCompare(b.nombreColor, 'es', { sensitivity: 'base' })
    })
  }, [disponibles, search, filterCritico])

  const filteredRestock = useMemo(() => {
    let list = restock
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => 
        c.nombreColor.toLowerCase().includes(q) ||
        (c.nota && c.nota.toLowerCase().includes(q))
      )
    }

    return [...list].sort((a, b) => 
      a.nombreColor.localeCompare(b.nombreColor, 'es', { sensitivity: 'base' })
    )
  }, [restock, search])

  // Move from Disponible -> Restock
  const handleMoverARestock = async (item: ColorFilamentoItem) => {
    setDisponibles(prev => prev.filter(c => c.id !== item.id))
    setRestock(prev => [{ ...item, estado: 'RESTOCK', stockGramos: 0, alertaCritica: true }, ...prev])

    try {
      await moverEstadoColor(item.id, 'RESTOCK')
      toast.info(`"${item.nombreColor}" movido a Restock`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      setRestock(prev => prev.filter(c => c.id !== item.id))
      setDisponibles(prev => [item, ...prev])
    }
  }

  // Move from Restock -> Disponible
  const handleMoverADisponible = async (item: ColorFilamentoItem) => {
    setRestock(prev => prev.filter(c => c.id !== item.id))
    setDisponibles(prev => [{ ...item, estado: 'DISPONIBLE', stockGramos: 1000, alertaCritica: false, nota: null }, ...prev])

    try {
      await moverEstadoColor(item.id, 'DISPONIBLE')
      toast.success(`"${item.nombreColor}" marcado como Disponible (1,000g)`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
      setRestock(prev => [item, ...prev])
    }
  }

  // Copy Restock list for WhatsApp
  const handleCopiarRestock = () => {
    if (restock.length === 0) {
      toast.info('No hay colores en la lista de restock')
      return
    }

    const itemsText = restock
      .map(c => `- ${c.nombreColor}${c.nota ? ` (${c.nota})` : ''}`)
      .join('\n')

    const message = `*FILAMENTOS PARA RESTOCK - TALLER NOVA*\n\n${itemsText}\n\nTotal colores: ${restock.length}`
    navigator.clipboard.writeText(message)
    toast.success('Lista de restock copiada para WhatsApp')
  }

  // Delete color from inventory
  const handleEliminarColor = async (item: ColorFilamentoItem) => {
    if (!confirm(`¿Estás seguro de eliminar "${item.nombreColor}" del inventario?`)) return

    if (item.estado === 'DISPONIBLE') {
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
    } else {
      setRestock(prev => prev.filter(c => c.id !== item.id))
    }

    try {
      const res = await eliminarColor(item.id)
      if (res.softDeleted) {
        toast.success(`"${item.nombreColor}" desactivado (mantiene historial de pedidos)`)
      } else {
        toast.success(`"${item.nombreColor}" eliminado`)
      }
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
      if (item.estado === 'DISPONIBLE') {
        setDisponibles(prev => [item, ...prev])
      } else {
        setRestock(prev => [item, ...prev])
      }
    }
  }

  // Quick Add submit
  const handleAddColorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoNombre.trim()) return

    const rollosNum = Math.max(1, parseInt(nuevoRollos || '1', 10))
    const totalGramosCapacidad = rollosNum * 1000
    const gNum = nuevoEstado === 'DISPONIBLE' 
      ? Math.min(totalGramosCapacidad, Math.max(0, parseInt(nuevoGramos || `${totalGramosCapacidad}`, 10))) 
      : 0

    try {
      const created = await agregarNuevoColor({
        nombreColor: nuevoNombre.trim(),
        codigoHex: nuevoHex,
        estado: nuevoEstado,
        rollos: rollosNum,
        stockGramos: gNum,
        nota: nuevaNota.trim() || undefined
      })

      if (nuevoEstado === 'DISPONIBLE') {
        setDisponibles(prev => [created, ...prev])
      } else {
        setRestock(prev => [created, ...prev])
      }

      toast.success(`"${created.nombreColor}" agregado con ${rollosNum} ${rollosNum === 1 ? 'rollo' : 'rollos'}`)
      setNuevoNombre('')
      setNuevaNota('')
      setNuevoRollos('1')
      setNuevoGramos('1000')
      setOpenAddModal(false)
    } catch (e: any) {
      toast.error('Error al agregar: ' + e.message)
    }
  }

  // Reset to workshop standard list
  const handleReset = async () => {
    if (!confirm('¿Restablecer la lista exacta de colores del taller NOVA?')) return
    try {
      const data = await resetColoresTaller()
      setDisponibles(data.disponibles)
      setRestock(data.restock)
      toast.success('Lista de colores restablecida')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  // Quick Rollos Adjust
  const handleAjustarRollos = async (item: ColorFilamentoItem, delta: number) => {
    const prevRollos = item.rollos || 1
    const nuevosRollos = Math.max(1, Math.min(20, prevRollos + delta))
    const nuevoTotal = nuevosRollos * 1000
    const prevGramos = item.stockGramos || 1000

    let nuevosGramos = prevGramos
    if (nuevosRollos > prevRollos) {
      nuevosGramos = prevGramos + ((nuevosRollos - prevRollos) * 1000)
    } else if (nuevosRollos < prevRollos) {
      nuevosGramos = Math.max(0, Math.min(nuevoTotal, prevGramos - ((prevRollos - nuevosRollos) * 1000)))
    }

    setDisponibles(prev => prev.map(c => c.id === item.id ? { 
      ...c, 
      rollos: nuevosRollos,
      pesoInicialGramos: nuevoTotal,
      stockGramos: nuevosGramos,
      alertaCritica: nuevosGramos < 300,
      nota: nuevosGramos < 300 ? `⚠️ Stock Crítico: ${nuevosGramos}g` : null
    } : c))

    try {
      await actualizarRollosColor(item.id, nuevosRollos)
      toast.success(`"${item.nombreColor}" actualizado a ${nuevosRollos} un.`)
    } catch (e: any) {
      toast.error('Error al actualizar: ' + e.message)
    }
  }

  // Quick Rollos Direct Input
  const handleSetRollosPrompt = async (item: ColorFilamentoItem) => {
    const input = prompt(`Ingresa la cantidad para "${item.nombreColor}" (cada unidad = 1,000g):`, (item.rollos || 1).toString())
    if (input === null) return
    const num = parseInt(input, 10)
    if (isNaN(num) || num < 1 || num > 20) {
      toast.error('Ingresa una cantidad válida entre 1 y 20')
      return
    }

    const prevRollos = item.rollos || 1
    const nuevoTotal = num * 1000
    const prevGramos = item.stockGramos || 1000

    let nuevosGramos = prevGramos
    if (num > prevRollos) {
      nuevosGramos = prevGramos + ((num - prevRollos) * 1000)
    } else if (num < prevRollos) {
      nuevosGramos = Math.max(0, Math.min(nuevoTotal, prevGramos - ((prevRollos - num) * 1000)))
    }

    setDisponibles(prev => prev.map(c => c.id === item.id ? { 
      ...c, 
      rollos: num,
      pesoInicialGramos: nuevoTotal,
      stockGramos: nuevosGramos,
      alertaCritica: nuevosGramos < 300,
      nota: nuevosGramos < 300 ? `⚠️ Stock Crítico: ${nuevosGramos}g` : null
    } : c))

    try {
      await actualizarRollosColor(item.id, num)
      toast.success(`"${item.nombreColor}" configurado con ${num} un.`)
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  // Quick Grams Update
  const handleAjustarGramos = async (item: ColorFilamentoItem, delta: number) => {
    const maxGramos = (item.rollos || 1) * 1000
    const nuevosGramos = Math.max(0, Math.min(maxGramos, (item.stockGramos || 0) + delta))
    setDisponibles(prev => prev.map(c => c.id === item.id ? { 
      ...c, 
      stockGramos: nuevosGramos,
      alertaCritica: nuevosGramos < 300,
      nota: nuevosGramos < 300 ? `⚠️ Stock Crítico: ${nuevosGramos}g` : null
    } : c))

    try {
      await actualizarGramosColor(item.id, nuevosGramos)
    } catch (e: any) {
      toast.error('Error al actualizar gramos: ' + e.message)
    }
  }

  // Quick Grams Direct Input
  const handleSetGramosPrompt = async (item: ColorFilamentoItem) => {
    const maxGramos = (item.rollos || 1) * 1000
    const input = prompt(`Ingresa los gramos restantes para "${item.nombreColor}" (0 - ${maxGramos}g):`, (item.stockGramos || maxGramos).toString())
    if (input === null) return
    const num = parseInt(input, 10)
    if (isNaN(num) || num < 0 || num > maxGramos) {
      toast.error(`Ingresa un número válido entre 0 y ${maxGramos} gramos`)
      return
    }

    setDisponibles(prev => prev.map(c => c.id === item.id ? { 
      ...c, 
      stockGramos: num,
      alertaCritica: num < 300,
      nota: num < 300 ? `⚠️ Stock Crítico: ${num}g` : null
    } : c))

    try {
      await actualizarGramosColor(item.id, num)
      toast.success(`Gramos de "${item.nombreColor}" actualizados a ${num}g`)
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  // Stock Total KPI Calculation
  const totalGramosActivos = useMemo(() => {
    return disponibles.reduce((acc, c) => acc + (c.stockGramos || 0), 0)
  }, [disponibles])

  const totalRollosActivos = useMemo(() => {
    return disponibles.reduce((acc, c) => acc + (c.rollos || 1), 0)
  }, [disponibles])

  const totalCriticos = useMemo(() => {
    return disponibles.filter(c => (c.stockGramos || 0) < 300)
  }, [disponibles])

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-200 px-0.5 sm:px-0">
      {/* ========================================================================= */}
      {/* 1. CABECERA PRINCIPAL Y ACCIONES                                          */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3">
        {/* Breadcrumb Contextual */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#75695D] font-medium">
          <Link href="/catalogo" className="hover:text-[#A36F4C] transition-colors flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>Catálogo</span>
          </Link>
          <span>/</span>
          <span className="text-[#241C15] font-bold">Inventario de Filamentos</span>
        </div>

        {/* Título & Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-[#241C15] tracking-tight flex items-center gap-2">
              <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-[#A36F4C] flex-shrink-0" />
              <span>Control de Bobinas & Filamentos</span>
            </h1>
            <p className="text-[11px] sm:text-sm text-[#75695D] mt-0.5">
              Control de peso en gramos, stock crítico y lista para reposición.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <Button
              type="button"
              onClick={() => setOpenAddModal(true)}
              className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98] flex-1 sm:flex-initial"
            >
              <Plus className="h-4 w-4 mr-1 stroke-[2.5]" />
              Nuevo Color
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopiarRestock}
              className="border-[#D4BEA7] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#633E20] font-bold text-xs h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl cursor-pointer shadow-xs active:scale-[0.98] flex-1 sm:flex-initial"
            >
              <Copy className="h-3.5 w-3.5 mr-1 text-[#A36F4C]" />
              <span>Restock ({restock.length})</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title="Restablecer lista de taller"
              className="h-9 w-9 sm:h-10 sm:w-10 p-0 text-[#75695D] hover:text-[#241C15] rounded-xl hover:bg-[#F4EFEA] cursor-pointer flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPIs SUPERIORES DE INVENTARIO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1">
          <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider block truncate">
              Stock en Gramos
            </span>
            <div className="text-sm sm:text-lg font-black text-[#1E5E3A] font-mono mt-0.5">
              {totalGramosActivos.toLocaleString()} g
            </div>
            <span className="text-[9px] sm:text-[10px] text-[#75695D] truncate">
              {(totalGramosActivos / 1000).toFixed(2)} kg activos
            </span>
          </div>

          <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider block truncate">
              Bobinas Activas
            </span>
            <div className="text-sm sm:text-lg font-black text-[#241C15] font-mono mt-0.5">
              {totalRollosActivos} un.
            </div>
            <span className="text-[9px] sm:text-[10px] text-[#1E5E3A] font-semibold truncate">
              {disponibles.length} colores
            </span>
          </div>

          <div className={`p-2.5 sm:p-3.5 rounded-xl border flex flex-col justify-between ${totalCriticos.length > 0 ? 'bg-[#FEF2F2] border-red-200' : 'bg-[#FAF8F5] border-[#E2D9CC]'}`}>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider block truncate">
              Stock Crítico (&lt;300g)
            </span>
            <div className={`text-sm sm:text-lg font-black font-mono mt-0.5 ${totalCriticos.length > 0 ? 'text-[#DC2626]' : 'text-[#1E5E3A]'}`}>
              {totalCriticos.length} {totalCriticos.length === 1 ? 'color' : 'colores'}
            </div>
            <span className={`text-[9px] sm:text-[10px] font-bold truncate ${totalCriticos.length > 0 ? 'text-[#DC2626]' : 'text-[#75695D]'}`}>
              {totalCriticos.length > 0 ? '⚠️ Alerta de reposición' : 'Nivel óptimo'}
            </span>
          </div>

          <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider block truncate">
              Para Restock
            </span>
            <div className="text-sm sm:text-lg font-black text-[#A36F4C] font-mono mt-0.5">
              {restock.length} colores
            </div>
            <span className="text-[9px] sm:text-[10px] text-[#8C6D1F] font-semibold truncate">
              🟡 Por comprar
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BUSCADOR Y FILTROS RÁPIDOS                                                */}
        {/* ========================================================================= */}
        <div className="space-y-2 pt-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
            <Input 
              placeholder="Buscar por color, nota o gramaje..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs sm:text-sm rounded-xl h-10 focus:border-[#A36F4C] focus:bg-[#FFFFFF] transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-1 rounded-md cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Chips de Filtro Rápido */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setFilterCritico(false)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex-shrink-0 ${
                !filterCritico 
                  ? 'bg-[#241C15] text-white shadow-2xs' 
                  : 'bg-[#F4EFEA] text-[#75695D] hover:text-[#241C15] border border-[#E2D9CC]'
              }`}
            >
              Todos ({disponibles.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCritico(true)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex-shrink-0 flex items-center gap-1 ${
                filterCritico 
                  ? 'bg-red-600 text-white shadow-2xs' 
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Solo Críticos &lt;300g ({totalCriticos.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PESTAÑAS SEGMENTADAS RESPONSIVE (MÓVIL / ESCRITORIO)                    */}
      {/* ========================================================================= */}
      <div className="bg-[#EAE4DC] p-1 rounded-2xl border border-[#D4BEA7] grid grid-cols-3 gap-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('disponibles')}
          className={`py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'disponibles'
              ? 'bg-[#FFFFFF] text-[#241C15] shadow-xs scale-[1.01]'
              : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-[#1E5E3A] flex-shrink-0" />
          <span className="truncate">Disponibles</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
            activeTab === 'disponibles' ? 'bg-[#EBF7EE] text-[#1E5E3A]' : 'bg-[#FAF8F5] text-[#75695D]'
          }`}>
            {filteredDisponibles.length}
          </span>
          {totalCriticos.length > 0 && (
            <span className="hidden sm:inline-flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('restock')}
          className={`py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'restock'
              ? 'bg-[#FFFFFF] text-[#241C15] shadow-xs scale-[1.01]'
              : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-[#A36F4C] flex-shrink-0" />
          <span className="truncate">Restock</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
            activeTab === 'restock' ? 'bg-[#FDF6E2] text-[#8C6D1F]' : 'bg-[#FAF8F5] text-[#75695D]'
          }`}>
            {filteredRestock.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          className={`py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'todos'
              ? 'bg-[#FFFFFF] text-[#241C15] shadow-xs scale-[1.01]'
              : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-[#633E20] flex-shrink-0" />
          <span className="truncate">Ver Ambos</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISTAS DE CONTENIDO CON TRANSICIÓN SUAVE                              */}
      {/* ========================================================================= */}
      <div className={`grid gap-4 sm:gap-5 items-start ${
        activeTab === 'todos' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
      }`}>
        
        {/* ----------------------------------------------------------------------- */}
        {/* COLUMNA 1: COLORES DISPONIBLES EN TALLER                                */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'disponibles' || activeTab === 'todos') && (
          <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3.5 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E2D9CC]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1E5E3A]" />
                <h2 className="text-xs sm:text-sm font-black text-[#241C15] uppercase tracking-wider">
                  Colores Disponibles en Taller
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                {totalCriticos.length > 0 && (
                  <Badge variant="outline" className="bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5] text-[10px] font-bold px-1.5 py-0">
                    {totalCriticos.length} críticos
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[11px] font-bold font-mono px-2 py-0.2"
                >
                  {filteredDisponibles.length} activos
                </Badge>
              </div>
            </div>

            {/* Lista Limpia y Táctil de Tarjetas */}
            <div className="space-y-2.5 sm:space-y-3">
              {filteredDisponibles.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#75695D] italic rounded-xl border border-dashed border-[#E2D9CC] bg-[#FAF8F5]">
                  {search ? 'No se encontraron colores con ese término' : 'No hay colores disponibles registrados'}
                </div>
              ) : (
                filteredDisponibles.map(item => {
                  const rollos = item.rollos || 1
                  const pesoInicial = item.pesoInicialGramos || (rollos * 1000)
                  const gramos = item.stockGramos ?? pesoInicial
                  const pct = Math.min(100, Math.round((gramos / pesoInicial) * 100))
                  const esCritico = gramos < 300

                  return (
                    <div 
                      key={item.id}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all shadow-2xs space-y-2.5 ${
                        esCritico
                          ? 'bg-[#FFFBFB] border-red-300 ring-1 ring-red-300/40'
                          : 'bg-[#FAF8F5] border-[#E2D9CC] hover:bg-[#FFFFFF] hover:border-[#1E5E3A]/40'
                      }`}
                    >
                      {/* Fila 1: Nombre + Color Dot + Selector de Cantidad + Acciones */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                        {/* Dot y Nombre */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditColor(item)}
                            className="h-7 w-7 sm:h-6 sm:w-6 rounded-full border border-black/15 shadow-xs flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                            style={{ backgroundColor: item.codigoHex }}
                            title={`Editar "${item.nombreColor}"`}
                          />
                          <button
                            type="button"
                            onClick={() => handleOpenEditColor(item)}
                            className="text-xs sm:text-sm font-bold text-[#241C15] truncate hover:text-[#A36F4C] hover:underline cursor-pointer text-left flex items-center gap-1 group"
                            title={`Clic para editar nombre "${item.nombreColor}"`}
                          >
                            <span className="truncate">{item.nombreColor}</span>
                            <Pencil className="h-3 w-3 text-[#75695D] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </button>
                        </div>

                        {/* Botones de Control en Fila 1 */}
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 ml-auto sm:ml-0">
                          {/* Selector Compacto de Cantidad */}
                          <div className="flex items-center gap-1 bg-[#F4EFEA] border border-[#D4BEA7] rounded-lg px-1 py-0.5 shadow-2xs" title="Cantidad de bobinas (1 un. = 1,000g)">
                            <button
                              type="button"
                              onClick={() => handleAjustarRollos(item, -1)}
                              disabled={rollos <= 1}
                              className="h-5 w-5 rounded flex items-center justify-center bg-white border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] disabled:opacity-30 cursor-pointer font-bold text-xs active:bg-[#FAF8F5]"
                              title="Restar bobina (-1000g)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetRollosPrompt(item)}
                              className="text-[11px] font-black font-mono text-[#241C15] hover:text-[#A36F4C] hover:underline cursor-pointer px-1 min-w-[28px] text-center"
                              title="Clic para definir cantidad de bobinas"
                            >
                              {rollos} un.
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAjustarRollos(item, 1)}
                              className="h-5 w-5 rounded flex items-center justify-center bg-white border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] cursor-pointer font-bold text-xs active:bg-[#FAF8F5]"
                              title="Agregar bobina (+1000g)"
                            >
                              +
                            </button>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoverARestock(item)}
                            className={`h-6 sm:h-7 text-[10px] sm:text-xs font-semibold px-2 rounded-lg transition-colors cursor-pointer ${
                              esCritico
                                ? 'bg-red-50 text-[#DC2626] border-red-200 hover:bg-red-100 hover:border-red-300'
                                : 'text-[#A36F4C] border-[#D4BEA7] bg-white hover:bg-[#FCE8E6] hover:text-[#A34335]'
                            }`}
                          >
                            {esCritico ? 'A Restock' : 'Restock'}
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditColor(item)}
                            title={`Editar "${item.nombreColor}"`}
                            className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#A36F4C] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminarColor(item)}
                            title={`Eliminar "${item.nombreColor}"`}
                            className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Fila 2: Gramos Restantes + Micro-ajustes + Barra */}
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 font-mono">
                            <button
                              type="button"
                              onClick={() => handleSetGramosPrompt(item)}
                              className="font-bold text-xs sm:text-sm text-[#241C15] hover:text-[#A36F4C] hover:underline cursor-pointer"
                              title="Toca para ingresar gramos exactos"
                            >
                              {gramos.toLocaleString()} g
                            </button>
                            <span className="text-[#75695D] text-[10px] sm:text-[11px]">
                              / {pesoInicial.toLocaleString()} g
                            </span>
                          </div>

                          {/* Botones de Micro-ajuste Táctil */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAjustarGramos(item, -50)}
                              className="h-5 px-1.5 text-[10px] font-bold rounded bg-white border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] active:scale-95 transition-transform cursor-pointer"
                              title="Descontar 50g"
                            >
                              -50g
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAjustarGramos(item, 50)}
                              className="h-5 px-1.5 text-[10px] font-bold rounded bg-white border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] active:scale-95 transition-transform cursor-pointer"
                              title="Añadir 50g"
                            >
                              +50g
                            </button>
                          </div>
                        </div>

                        {/* Barra de Progreso y Porcentaje */}
                        <div className="space-y-1">
                          <div className="w-full bg-[#EAE4DC] h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                esCritico ? 'bg-[#DC2626]' : pct < 50 ? 'bg-[#D97706]' : 'bg-[#1E5E3A]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#75695D] font-mono">
                            <span>{pct}% disponible</span>
                            <span>{pesoInicial - gramos > 0 ? `-${(pesoInicial - gramos).toLocaleString()}g usados` : 'Íntegro'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Fila 3: Histórico de Producción */}
                      <div className="pt-1.5 border-t border-[#E2D9CC]/70 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Package className="h-3.5 w-3.5 text-[#A36F4C] flex-shrink-0" />
                          {(item.totalProductosImpresos || 0) > 0 ? (
                            <span className="text-[#241C15] font-semibold text-[10px] sm:text-[11px] truncate">
                              <strong>{item.totalProductosImpresos} {item.totalProductosImpresos === 1 ? 'pieza' : 'piezas'}</strong> ({item.totalGramosConsumidos || 0}g)
                            </span>
                          ) : (
                            <span className="text-[#75695D] text-[10px] sm:text-[11px] italic">
                              Sin piezas fabricadas aún
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenColorDetails(item)}
                          className="text-[10px] sm:text-[11px] font-bold text-[#A36F4C] hover:text-[#8E5E3E] hover:underline flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-[#D4BEA7] shadow-2xs hover:bg-[#FDFBF7] transition-all flex-shrink-0"
                        >
                          <span>Detalle</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Bloque de Alerta de Stock Crítico (< 300g) */}
                      {esCritico && (
                        <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-[#DC2626] flex items-center gap-2 animate-in fade-in duration-150">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                          <span className="text-[11px] font-bold leading-tight">
                            Stock Crítico: solo {gramos}g restantes.
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMNA 2: COLORES PARA RESTOCK / COMPRAR                                */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'restock' || activeTab === 'todos') && (
          <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3.5 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E2D9CC]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#A36F4C]" />
                <h2 className="text-xs sm:text-sm font-black text-[#241C15] uppercase tracking-wider">
                  Colores para Restock / Comprar
                </h2>
              </div>
              <Badge 
                variant="outline" 
                className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[11px] font-bold font-mono px-2 py-0.2"
              >
                {filteredRestock.length} por pedir
              </Badge>
            </div>

            {/* Lista Limpia de Tarjetas */}
            <div className="space-y-2">
              {filteredRestock.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#75695D] italic rounded-xl border border-dashed border-[#E2D9CC] bg-[#FAF8F5]">
                  {search ? 'No se encontraron colores para restock' : '¡Todo el stock está disponible!'}
                </div>
              ) : (
                filteredRestock.map(item => (
                  <div 
                    key={item.id}
                    className="flex flex-col p-3 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#A36F4C]/50 transition-all shadow-2xs group space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Círculo / Dot Visual */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditColor(item)}
                          className="h-6 w-6 rounded-full border border-black/15 shadow-xs flex-shrink-0 opacity-80 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                          style={{ backgroundColor: item.codigoHex }}
                          title={`Editar "${item.nombreColor}"`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenEditColor(item)}
                              className="text-xs sm:text-sm font-bold text-[#241C15] truncate hover:text-[#A36F4C] hover:underline cursor-pointer text-left"
                            >
                              {item.nombreColor}
                            </button>
                            <span className="text-[10px] text-[#75695D] font-mono bg-[#EAE4DC] px-1.5 py-0.2 rounded flex-shrink-0">
                              {item.rollos || 1} un.
                            </span>
                          </div>
                          {item.nota && (
                            <span className="text-[9px] sm:text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded inline-block mt-0.5 truncate max-w-full">
                              {item.nota}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleMoverADisponible(item)}
                          className="h-7 text-xs font-bold bg-[#1E5E3A] hover:bg-[#164B2E] text-white px-2.5 sm:px-3 rounded-lg shadow-2xs cursor-pointer active:scale-[0.98]"
                        >
                          Disponible
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditColor(item)}
                          title={`Editar "${item.nombreColor}"`}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#A36F4C] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarColor(item)}
                          title={`Eliminar "${item.nombreColor}"`}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Resumen de producción si tuvo histórico */}
                    {(item.totalProductosImpresos || 0) > 0 && (
                      <div className="pt-1.5 border-t border-[#E2D9CC]/70 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[10px] sm:text-[11px] text-[#75695D] font-medium flex items-center gap-1 truncate">
                          <Package className="h-3 w-3 text-[#A36F4C] flex-shrink-0" />
                          <span className="truncate">{item.totalProductosImpresos} {item.totalProductosImpresos === 1 ? 'pieza' : 'piezas'} ({item.totalGramosConsumidos}g)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenColorDetails(item)}
                          className="text-[10px] sm:text-[11px] font-bold text-[#A36F4C] hover:underline flex items-center gap-0.5 cursor-pointer flex-shrink-0"
                        >
                          <span>Ver detalle</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL RÁPIDO: AGREGAR COLOR                                               */}
      {/* ========================================================================= */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[440px] max-h-[92dvh] overflow-y-auto p-0 rounded-2xl shadow-2xl z-50">
          <form onSubmit={handleAddColorSubmit} className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3">
              <div>
                <DialogTitle className="text-base font-bold text-[#241C15]">
                  Agregar Nuevo Color
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D]">
                  Define el color y la cantidad de bobinas (1 un. = 1,000g)
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Nombre */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Nombre del Color *
                </Label>
                <Input 
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Turquesa Pastel, Cobre Seda..."
                  required
                  autoFocus
                  className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm h-10"
                />
              </div>

              {/* Cantidad de Unidades */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                    Cantidad (1 un. = 1,000 g) *
                  </Label>
                  <span className="text-[10px] text-[#A36F4C] font-bold">
                    Total: {(Math.max(1, parseInt(nuevoRollos || '1', 10)) * 1000).toLocaleString()} g
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setNuevoRollos(r.toString())
                        if (nuevoEstado === 'DISPONIBLE') {
                          setNuevoGramos((r * 1000).toString())
                        }
                      }}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        nuevoRollos === r.toString()
                          ? 'bg-[#A36F4C] text-white border-[#A36F4C] shadow-2xs'
                          : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      {r} un.
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector Visual de Color */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241C15]">Muestra Visual (HEX)</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={nuevoHex}
                      onChange={(e) => setNuevoHex(e.target.value)}
                      className="h-6 w-8 rounded border border-[#E2D9CC] cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-[#75695D]">{nuevoHex}</span>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-1 pt-1">
                  {PRESET_SWATCHES.slice(0, 12).map(sw => (
                    <button
                      key={sw.name}
                      type="button"
                      onClick={() => {
                        setNuevoHex(sw.hex)
                        if (!nuevoNombre) setNuevoNombre(sw.name)
                      }}
                      className="h-6 rounded border border-black/10 hover:scale-105 transition-transform cursor-pointer"
                      style={{ backgroundColor: sw.hex }}
                      title={sw.name}
                    />
                  ))}
                </div>
              </div>

              {/* Estado Inicial */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Estado Inicial
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('DISPONIBLE')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      nuevoEstado === 'DISPONIBLE'
                        ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] shadow-2xs'
                        : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC]'
                    }`}
                  >
                    🟢 Disponible
                  </button>
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('RESTOCK')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      nuevoEstado === 'RESTOCK'
                        ? 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] shadow-2xs'
                        : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC]'
                    }`}
                  >
                    🟡 Para Restock
                  </button>
                </div>
              </div>

              {/* Gramos Iniciales si es Disponible */}
              {nuevoEstado === 'DISPONIBLE' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                      Gramos Restantes *
                    </Label>
                    <span className="text-[10px] text-[#75695D]">
                      Capacidad: {(Math.max(1, parseInt(nuevoRollos || '1', 10)) * 1000).toLocaleString()} g
                    </span>
                  </div>
                  <Input 
                    type="number"
                    min="0"
                    max={Math.max(1, parseInt(nuevoRollos || '1', 10)) * 1000}
                    value={nuevoGramos}
                    onChange={(e) => setNuevoGramos(e.target.value)}
                    placeholder="1000"
                    required
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-mono font-bold h-10"
                  />
                </div>
              )}

              {/* Nota opcional */}
              {nuevoEstado === 'RESTOCK' && (
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                    Nota (Opcional)
                  </Label>
                  <Input 
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Ej: Por terminar, Solicitado por cliente..."
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2D9CC]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenAddModal(false)}
                className="text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
              >
                Guardar Color
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR COLOR / BOBINA                                              */}
      {/* ========================================================================= */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[420px] max-h-[92dvh] overflow-y-auto p-0 rounded-2xl shadow-2xl z-50">
          <form onSubmit={handleEditColorSubmit} className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3">
              <div className="flex items-center gap-2.5">
                <div 
                  className="h-8 w-8 rounded-xl border border-black/15 shadow-2xs flex-shrink-0"
                  style={{ backgroundColor: editHex }}
                />
                <div>
                  <DialogTitle className="text-base font-bold text-[#241C15]">
                    Editar Bobina / Color
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D]">
                    Modifica el nombre, tono visual y notas.
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenEditModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Nombre */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Nombre de la Bobina / Color *
                </Label>
                <Input 
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  placeholder="Ej: Negro Carbón eSun, Rosa Sakura Sunlu..."
                  required
                  autoFocus
                  className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-bold text-[#241C15] h-10"
                />
              </div>

              {/* Selector Visual de Color */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241C15]">Muestra Visual (HEX)</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={editHex}
                      onChange={(e) => setEditHex(e.target.value)}
                      className="h-6 w-8 rounded border border-[#E2D9CC] cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-[#75695D]">{editHex}</span>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-1 pt-1">
                  {PRESET_SWATCHES.slice(0, 12).map(sw => (
                    <button
                      key={sw.name}
                      type="button"
                      onClick={() => setEditHex(sw.hex)}
                      className="h-6 rounded border border-black/10 hover:scale-105 transition-transform cursor-pointer"
                      style={{ backgroundColor: sw.hex }}
                      title={sw.name}
                    />
                  ))}
                </div>
              </div>

              {/* Nota opcional */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Nota de Producción (Opcional)
                </Label>
                <Input 
                  value={editNota}
                  onChange={(e) => setEditNota(e.target.value)}
                  placeholder="Ej: Lote #2, Bobina para figuras especiales..."
                  className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9 text-[#241C15]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2D9CC]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenEditModal(false)}
                className="text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE PRODUCTOS FABRICADOS POR COLOR                           */}
      {/* ========================================================================= */}
      <Dialog open={openColorDetailsModal} onOpenChange={setOpenColorDetailsModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[560px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-2xl z-50">
          {selectedColorForDetails && (
            <div className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
              {/* Header */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div 
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-black/15 shadow-xs flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: selectedColorForDetails.codigoHex }}
                  />
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge 
                        variant="outline" 
                        className={selectedColorForDetails.estado === 'DISPONIBLE'
                          ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[9px] sm:text-[10px] font-semibold'
                          : 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[9px] sm:text-[10px] font-semibold'
                        }
                      >
                        {selectedColorForDetails.estado === 'DISPONIBLE' ? '🟢 En Taller' : '🟡 En Restock'}
                      </Badge>
                      <span className="text-[11px] text-[#75695D] font-mono">
                        {selectedColorForDetails.rollos || 1} {selectedColorForDetails.rollos === 1 ? 'bobina' : 'bobinas'}
                      </span>
                    </div>
                    <DialogTitle className="text-sm sm:text-base font-bold text-[#241C15] tracking-tight truncate max-w-[200px] sm:max-w-[320px]">
                      {selectedColorForDetails.nombreColor}
                    </DialogTitle>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenColorDetailsModal(false)}
                  className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 touch-pan-y">
                {/* KPIs de Producción de la Bobina */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 sm:p-3 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] text-center">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#75695D] block truncate">
                      Total Piezas
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-[#241C15] font-mono block mt-0.5">
                      {selectedColorForDetails.totalProductosImpresos || 0}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-[#75695D] truncate block">impresas</span>
                  </div>

                  <div className="p-2 sm:p-3 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] text-center">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#75695D] block truncate">
                      Filamento Usado
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-[#A36F4C] font-mono block mt-0.5">
                      {(selectedColorForDetails.totalGramosConsumidos || 0).toLocaleString()} g
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-[#75695D] truncate block">consumidos</span>
                  </div>

                  <div className="p-2 sm:p-3 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] text-center">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#75695D] block truncate">
                      Stock Restante
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-[#1E5E3A] font-mono block mt-0.5">
                      {(selectedColorForDetails.stockGramos || 0).toLocaleString()} g
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-[#75695D] truncate block">en taller</span>
                  </div>
                </div>

                {/* Lista de Modelos Fabricados con esta Bobina */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#241C15] uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-[#A36F4C]" />
                      Modelos 3D Fabricados ({selectedColorForDetails.productosInvertidos?.length || 0})
                    </span>
                  </div>

                  {(!selectedColorForDetails.productosInvertidos || selectedColorForDetails.productosInvertidos.length === 0) ? (
                    <div className="p-6 rounded-xl border border-dashed border-[#E2D9CC] bg-[#FAF8F5] text-center space-y-1.5">
                      <Package className="h-8 w-8 text-[#D4BEA7] mx-auto opacity-70" />
                      <p className="text-xs font-medium text-[#75695D]">
                        No hay productos registrados con este color todavía.
                      </p>
                      <p className="text-[11px] text-[#75695D]/80">
                        Al asignar este color en tus pedidos de venta, el stock se descontará automáticamente y se listarán aquí los modelos producidos.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedColorForDetails.productosInvertidos.map((prod) => (
                        <div 
                          key={prod.productoId}
                          className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] hover:bg-[#FFFFFF] transition-all space-y-2 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-[#241C15]">
                                  {prod.nombreModelo}
                                </span>
                                {prod.lineaCategoria && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7]">
                                    {prod.lineaCategoria}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-[#75695D] block mt-0.5">
                                Peso unitario: {prod.pesoGramosUnitario > 0 ? `${prod.pesoGramosUnitario}g` : 'No especificado'}
                              </span>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="text-xs font-extrabold text-[#241C15] font-mono block">
                                {prod.totalUnidades} {prod.totalUnidades === 1 ? 'unidad' : 'unidades'}
                              </span>
                              <span className="text-[11px] font-bold text-[#A36F4C] font-mono">
                                {prod.totalGramos.toLocaleString()}g totales
                              </span>
                            </div>
                          </div>

                          {/* Mini Historial de Pedidos */}
                          {prod.ultimosPedidos && prod.ultimosPedidos.length > 0 && (
                            <div className="pt-2 border-t border-[#E2D9CC]/60 space-y-1">
                              <span className="text-[10px] font-bold text-[#75695D] uppercase tracking-wider block">
                                Pedidos recientes:
                              </span>
                              <div className="space-y-1">
                                {prod.ultimosPedidos.map((ped, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded-lg border border-[#E2D9CC]/60">
                                    <span className="text-[#241C15] font-medium truncate max-w-[160px] sm:max-w-[200px]">
                                      👤 {ped.cliente}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#75695D] font-mono">
                                      <span>{ped.cantidad} un. ({ped.gramos}g)</span>
                                      <span>•</span>
                                      <span>{new Date(ped.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-3 border-t border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-end flex-shrink-0">
                <Button
                  type="button"
                  onClick={() => setOpenColorDetailsModal(false)}
                  className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
