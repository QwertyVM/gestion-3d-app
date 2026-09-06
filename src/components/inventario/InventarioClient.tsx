'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  Palette, 
  ShoppingCart, 
  AlertTriangle,
  Trash2,
  Package,
  Pencil,
  ChevronDown,
  Share2,
  Sparkles,
  Weight,
  Layers3,
  MoreVertical,
  Info,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
  Flame
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

// Swatches agrupados por tonalidades
const SWATCH_GROUPS = {
  neutros: [
    { name: 'Negro carbón', hex: '#18181B' },
    { name: 'Blanco hueso', hex: '#F5F5F0' },
    { name: 'Blanco marfil', hex: '#FFFBEB' },
    { name: 'Gris ceniza', hex: '#94A3B8' },
    { name: 'Arena', hex: '#D4B996' },
  ],
  calidos: [
    { name: 'Terracota', hex: '#A36F4C' },
    { name: 'Marrón latte', hex: '#854D0E' },
    { name: 'Marrón oscuro', hex: '#3E2723' },
    { name: 'Chocolate oscuro', hex: '#451A03' },
    { name: 'Rojo escarlata', hex: '#DC2626' },
    { name: 'Rojo oscuro', hex: '#7F1D1D' },
    { name: 'Naranja mandarina', hex: '#F97316' },
    { name: 'Rosa Sakura', hex: '#F472B6' },
  ],
  frios: [
    { name: 'Azul oscuro', hex: '#1E3A8A' },
    { name: 'Verde grass', hex: '#22C55E' },
    { name: 'Verde manzana', hex: '#65A30D' },
    { name: 'Verde oscuro', hex: '#14532D' },
    { name: 'Lila púrpura', hex: '#C084FC' },
    { name: 'Ciruela', hex: '#581C87' },
  ]
}

const ALL_SWATCHES = [
  ...SWATCH_GROUPS.neutros,
  ...SWATCH_GROUPS.calidos,
  ...SWATCH_GROUPS.frios,
]

const NEUTRAL_KEYWORDS = ['negro', 'blanco', 'gris', 'ceniza', 'hueso', 'marfil', 'arena', 'beige', 'plata', 'silver', 'carbón']

type FilterTab = 'todos' | 'disponibles' | 'criticos' | 'restock'

export function InventarioClient({ 
  disponibles: initialDisponibles, 
  restock: initialRestock 
}: InventarioClientProps) {
  const [disponibles, setDisponibles] = useState<ColorFilamentoItem[]>(initialDisponibles)
  const [restock, setRestock] = useState<ColorFilamentoItem[]>(initialRestock)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('todos')
  const [isPending, startTransition] = useTransition()

  // Copy Feedback State
  const [isCopied, setIsCopied] = useState(false)
  const [showCopyDropdown, setShowCopyDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Details Modal State for invested products
  const [selectedColorForDetails, setSelectedColorForDetails] = useState<ColorFilamentoItem | null>(null)
  const [openColorDetailsModal, setOpenColorDetailsModal] = useState(false)

  // Close copy dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCopyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      toast.success(`Color "${editNombre.trim()}" actualizado`)
    } catch (err: any) {
      toast.error('Error al editar: ' + (err?.message || 'Error desconocido'))
    }
  }

  const handleOpenColorDetails = (item: ColorFilamentoItem) => {
    setSelectedColorForDetails(item)
    setOpenColorDetailsModal(true)
  }

  // Stock KPI Calculations
  const totalGramosActivos = useMemo(() => {
    return disponibles.reduce((acc, c) => acc + (c.stockGramos || 0), 0)
  }, [disponibles])

  const totalRollosActivos = useMemo(() => {
    return disponibles.reduce((acc, c) => acc + (c.rollos || 1), 0)
  }, [disponibles])

  const totalCriticos = useMemo(() => {
    return disponibles.filter(c => (c.stockGramos || 0) < 300)
  }, [disponibles])

  // Move from Disponible -> Restock
  const handleMoverARestock = async (item: ColorFilamentoItem) => {
    setDisponibles(prev => prev.filter(c => c.id !== item.id))
    setRestock(prev => [{ ...item, estado: 'RESTOCK', stockGramos: 0, alertaCritica: true, nota: 'Por terminar / En reposición' }, ...prev])

    try {
      await moverEstadoColor(item.id, 'RESTOCK', 'Por terminar / En reposición')
      toast.info(`"${item.nombreColor}" movido a Restock`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      setRestock(prev => prev.filter(c => c.id !== item.id))
      setDisponibles(prev => [item, ...prev])
    }
  }

  // Move from Restock -> Disponible
  const handleMoverADisponible = async (item: ColorFilamentoItem) => {
    const rollos = item.rollos || 1
    const capacidadGramos = rollos * 1000
    setRestock(prev => prev.filter(c => c.id !== item.id))
    setDisponibles(prev => [{ ...item, estado: 'DISPONIBLE', stockGramos: capacidadGramos, alertaCritica: false, nota: null }, ...prev])

    try {
      await moverEstadoColor(item.id, 'DISPONIBLE')
      toast.success(`"${item.nombreColor}" marcado como Disponible (${capacidadGramos.toLocaleString()}g)`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
      setRestock(prev => [item, ...prev])
    }
  }

  // =========================================================================
  // FUNCIONALIDAD COMERCIAL: COPIAR COLORES PARA CLIENTES
  // =========================================================================
  const handleCopiarColoresClientes = (tipo: 'todos_disponibles' | 'solo_neutros' = 'todos_disponibles') => {
    setShowCopyDropdown(false)

    const coloresDisponibles = disponibles.filter(c => (c.stockGramos ?? 1000) > 0)

    if (coloresDisponibles.length === 0) {
      toast.info('No hay colores disponibles con stock activo en este momento')
      return
    }

    let seleccionados = coloresDisponibles

    if (tipo === 'solo_neutros') {
      seleccionados = coloresDisponibles.filter(c => {
        const nombreLower = c.nombreColor.toLowerCase()
        return NEUTRAL_KEYWORDS.some(k => nombreLower.includes(k))
      })

      if (seleccionados.length === 0) {
        toast.info('No se encontraron tonos neutros con stock disponible')
        return
      }
    }

    const itemsText = seleccionados
      .sort((a, b) => a.nombreColor.localeCompare(b.nombreColor, 'es', { sensitivity: 'base' }))
      .map(c => `• ${c.nombreColor}`)
      .join('\n')

    const header = tipo === 'solo_neutros'
      ? '🎨 *Catálogo de Tonos Neutros Disponibles - NOVA 3D*'
      : '🎨 *Catálogo de Colores Disponibles - NOVA 3D*'

    const message = `${header}\n${itemsText}\n\n_Consulta por combinaciones multicolor o disponibilidad para piezas de gran volumen._`

    navigator.clipboard.writeText(message)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success(tipo === 'solo_neutros' ? 'Tonos neutros copiados al portapapeles' : 'Catálogo de colores disponible copiado')
  }

  // Quick Grams Update (-50g / +50g)
  const handleAjustarGramos = async (item: ColorFilamentoItem, delta: number) => {
    const maxGramos = (item.rollos || 1) * 1000
    const nuevosGramos = Math.max(0, Math.min(maxGramos, (item.stockGramos || 0) + delta))
    
    setDisponibles(prev => prev.map(c => c.id === item.id ? { 
      ...c, 
      stockGramos: nuevosGramos,
      alertaCritica: nuevosGramos < 300,
      nota: nuevosGramos < 300 ? `⚠️ Solo ${nuevosGramos}g restantes` : null
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
      nota: num < 300 ? `⚠️ Solo ${num}g restantes` : null
    } : c))

    try {
      await actualizarGramosColor(item.id, num)
      toast.success(`Gramos de "${item.nombreColor}" actualizados a ${num.toLocaleString()}g`)
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

    const isDisp = item.estado === 'DISPONIBLE'
    const updater = (prev: ColorFilamentoItem[]) => prev.map(c => c.id === item.id ? { 
      ...c, 
      rollos: nuevosRollos,
      pesoInicialGramos: nuevoTotal,
      stockGramos: nuevosGramos,
      alertaCritica: nuevosGramos < 300,
      nota: nuevosGramos < 300 ? `⚠️ Solo ${nuevosGramos}g restantes` : null
    } : c)

    if (isDisp) setDisponibles(updater)
    else setRestock(updater)

    try {
      await actualizarRollosColor(item.id, nuevosRollos)
      toast.success(`"${item.nombreColor}" configurado en ${nuevosRollos} un. (${nuevoTotal.toLocaleString()}g)`)
    } catch (e: any) {
      toast.error('Error al actualizar bobinas: ' + e.message)
    }
  }

  // Delete color
  const handleEliminarColor = async (item: ColorFilamentoItem) => {
    if (!confirm(`¿Estás seguro de archivar/eliminar "${item.nombreColor}" del inventario?`)) return

    if (item.estado === 'DISPONIBLE') {
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
    } else {
      setRestock(prev => prev.filter(c => c.id !== item.id))
    }

    try {
      const res = await eliminarColor(item.id)
      if (res.softDeleted) {
        toast.success(`"${item.nombreColor}" archivado`)
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

  // Reset workshop list
  const handleReset = async () => {
    if (!confirm('¿Restablecer el inventario a la lista oficial del taller NOVA 3D?')) return
    try {
      const data = await resetColoresTaller()
      setDisponibles(data.disponibles)
      setRestock(data.restock)
      toast.success('Lista de colores restablecida con éxito')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
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

      toast.success(`"${created.nombreColor}" registrado en el taller`)
      setNuevoNombre('')
      setNuevaNota('')
      setNuevoRollos('1')
      setNuevoGramos('1000')
      setOpenAddModal(false)
    } catch (e: any) {
      toast.error('Error al registrar: ' + e.message)
    }
  }

  // Combined and Filtered Color List for the Grid Matrix
  const filteredGridItems = useMemo(() => {
    let combined: ColorFilamentoItem[] = []

    if (activeTab === 'todos') {
      combined = [...disponibles, ...restock]
    } else if (activeTab === 'disponibles') {
      combined = [...disponibles]
    } else if (activeTab === 'criticos') {
      combined = disponibles.filter(c => (c.stockGramos ?? 1000) < 300 || Boolean(c.alertaCritica))
    } else if (activeTab === 'restock') {
      combined = [...restock]
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      combined = combined.filter(c => 
        c.nombreColor.toLowerCase().includes(q) ||
        (c.nota && c.nota.toLowerCase().includes(q)) ||
        (c.stockGramos && c.stockGramos.toString().includes(q))
      )
    }

    // Ordenar: Críticos primero, luego disponibles por orden alfabético, luego restock
    return combined.sort((a, b) => {
      const aIsDisp = a.estado === 'DISPONIBLE'
      const bIsDisp = b.estado === 'DISPONIBLE'
      const aCrit = aIsDisp && ((a.stockGramos ?? 1000) < 300 || Boolean(a.alertaCritica))
      const bCrit = bIsDisp && ((b.stockGramos ?? 1000) < 300 || Boolean(b.alertaCritica))

      if (aCrit && !bCrit) return -1
      if (!aCrit && bCrit) return 1
      if (aIsDisp && !bIsDisp) return -1
      if (!aIsDisp && bIsDisp) return 1

      return a.nombreColor.localeCompare(b.nombreColor, 'es', { sensitivity: 'base' })
    })
  }, [disponibles, restock, activeTab, search])

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-200 px-1 sm:px-2 pb-16">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA Y RESUMEN EJECUTIVO (KPIS EN LIGHT MODE)                      */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        
        {/* Fila Título + Sync Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#75695D] font-medium mb-1">
              <Link href="/catalogo" className="hover:text-[#A36F4C] transition-colors flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-[#A36F4C]" />
                <span>Catálogo</span>
              </Link>
              <span className="text-[#D4BEA7]">/</span>
              <span className="text-[#241C15] font-bold">Inventario de Filamentos</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#241C15] tracking-tight flex items-center gap-2">
                <Palette className="h-6 w-6 sm:h-7 sm:w-7 text-[#A36F4C] flex-shrink-0" />
                <span>Inventario de Filamentos</span>
              </h1>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF7EE] border border-[#B4E3C0] text-[#1E5E3A] text-[11px] font-bold">
                <span className="h-2 w-2 rounded-full bg-[#1E5E3A] animate-pulse" />
                <span>Sincronizado en vivo</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title="Restablecer lista de taller oficial"
              className="h-9 px-3 text-xs font-bold text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] rounded-xl cursor-pointer transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Restablecer
            </Button>
          </div>
        </div>

        {/* Fila de 4 KPIs Compactos (2x2 Móvil, 4 Cols Desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* KPI 1: Kilos en Taller */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider truncate">
                Total Kilos en Taller
              </span>
              <div className="p-1.5 rounded-lg bg-[#EBF7EE] text-[#1E5E3A] flex-shrink-0">
                <Weight className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-black text-[#1E5E3A] font-mono tracking-tight">
                {(totalGramosActivos / 1000).toFixed(2)} kg
              </div>
              <span className="text-[10px] sm:text-xs text-[#75695D] font-medium mt-0.5 block truncate">
                {totalGramosActivos.toLocaleString()} g activos
              </span>
            </div>
          </div>

          {/* KPI 2: Bobinas Físicas */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider truncate">
                Bobinas Físicas
              </span>
              <div className="p-1.5 rounded-lg bg-[#F5EBE1] text-[#A36F4C] flex-shrink-0">
                <Layers3 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-black text-[#241C15] font-mono tracking-tight">
                {totalRollosActivos} un.
              </div>
              <span className="text-[10px] sm:text-xs text-[#1E5E3A] font-bold mt-0.5 block truncate">
                {disponibles.length} colores activos
              </span>
            </div>
          </div>

          {/* KPI 3: Stock Crítico (<300g) */}
          <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col justify-between shadow-2xs transition-colors ${
            totalCriticos.length > 0 
              ? 'bg-[#FEF9C3] border-[#FDE047] text-[#854D0E]' 
              : 'bg-[#FAF8F5] border-[#E2D9CC] text-[#241C15]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate ${
                totalCriticos.length > 0 ? 'text-[#854D0E]' : 'text-[#75695D]'
              }`}>
                Stock Crítico (&lt;300g)
              </span>
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                totalCriticos.length > 0 ? 'bg-[#FEF08A] text-[#854D0E]' : 'bg-[#EBF7EE] text-[#1E5E3A]'
              }`}>
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className={`text-lg sm:text-2xl font-black font-mono tracking-tight ${
                totalCriticos.length > 0 ? 'text-[#854D0E]' : 'text-[#1E5E3A]'
              }`}>
                {totalCriticos.length} {totalCriticos.length === 1 ? 'color' : 'colores'}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold mt-0.5 block truncate ${
                totalCriticos.length > 0 ? 'text-[#854D0E]' : 'text-[#75695D]'
              }`}>
                {totalCriticos.length > 0 ? '⚠️ Reponer pronto' : 'Stock en nivel óptimo'}
              </span>
            </div>
          </div>

          {/* KPI 4: Para Restock */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider truncate">
                Para Restock
              </span>
              <div className="p-1.5 rounded-lg bg-[#FEF9C3] text-[#854D0E] flex-shrink-0">
                <ShoppingCart className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-black text-[#A36F4C] font-mono tracking-tight">
                {restock.length} colores
              </div>
              <span className="text-[10px] sm:text-xs text-[#854D0E] font-bold mt-0.5 block truncate">
                🛒 Marcados para compra
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE FILTROS INTELIGENTE (SINGLE-ROW BAR & ACTIONS)                 */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Buscador Interactivo */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
            <Input 
              placeholder="Buscar color, acabado o nota..."
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

          {/* Segmented Control Compacto */}
          <div className="bg-[#EAE4DC] p-1 rounded-2xl border border-[#D4BEA7] flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'todos'
                  ? 'bg-[#FFFFFF] text-[#241C15] shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#FAF8F5] rounded-md text-[#75695D]">
                {disponibles.length + restock.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('disponibles')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'disponibles'
                  ? 'bg-[#FFFFFF] text-[#1E5E3A] shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-[#1E5E3A]" />
              <span>Disponibles</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#EBF7EE] text-[#1E5E3A] rounded-md">
                {disponibles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('criticos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'criticos'
                  ? 'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] shadow-xs'
                  : 'text-[#75695D] hover:text-[#854D0E] hover:bg-[#FFFFFF]/40'
              }`}
            >
              <AlertTriangle className="h-3 w-3 text-[#854D0E]" />
              <span>Críticos</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#FEF08A] text-[#854D0E] rounded-md font-bold">
                {totalCriticos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('restock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'restock'
                  ? 'bg-[#FFFFFF] text-[#A36F4C] shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
              }`}
            >
              <ShoppingCart className="h-3 w-3 text-[#A36F4C]" />
              <span>Para Restock</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#F5EBE1] text-[#A36F4C] rounded-md">
                {restock.length}
              </span>
            </button>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            
            {/* BOTÓN COPIAR DISPONIBLES PARA CLIENTES */}
            <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
              <div className="flex rounded-2xl shadow-xs border border-[#E2D9CC] overflow-hidden bg-[#FFFFFF] hover:bg-[#F4EFEA] transition-colors">
                <button
                  type="button"
                  onClick={() => handleCopiarColoresClientes('todos_disponibles')}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#241C15] cursor-pointer active:scale-[0.98] transition-all flex-1"
                  title="Copiar lista de colores disponibles para WhatsApp o Instagram"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 text-[#1E5E3A] stroke-[2.5] animate-in zoom-in-50 duration-150" />
                      <span className="text-[#1E5E3A] font-extrabold truncate">¡Copiado al portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-[#A36F4C] flex-shrink-0" />
                      <span className="truncate">Copiar Disponibles para Clientes</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCopyDropdown(prev => !prev)}
                  className="px-2 py-2 border-l border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC]/50 cursor-pointer flex items-center justify-center transition-colors"
                  title="Opciones de catálogo"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showCopyDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown de opciones de copiado */}
              {showCopyDropdown && (
                <div className="absolute right-0 mt-1.5 w-64 bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#75695D] uppercase tracking-wider border-b border-[#E2D9CC]/60">
                    Opciones de Copiado
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopiarColoresClientes('todos_disponibles')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-[#F4EFEA] text-xs font-bold text-[#241C15] transition-colors cursor-pointer"
                  >
                    <Palette className="h-4 w-4 text-[#A36F4C] flex-shrink-0" />
                    <div>
                      <div>Todos los disponibles ({disponibles.length})</div>
                      <div className="text-[10px] font-normal text-[#75695D]">Catálogo completo activo</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopiarColoresClientes('solo_neutros')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-[#F4EFEA] text-xs font-bold text-[#241C15] transition-colors cursor-pointer"
                  >
                    <span className="h-3 w-3 rounded-full bg-gradient-to-tr from-[#18181B] via-[#94A3B8] to-[#F5F5F0] border border-[#D4BEA7]" />
                    <div>
                      <div>Solo tonos neutros</div>
                      <div className="text-[10px] font-normal text-[#75695D]">Blanco, Negro, Gris, Arena...</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* BOTÓN NUEVO COLOR */}
            <Button
              type="button"
              onClick={() => setOpenAddModal(true)}
              className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs h-10 px-4 rounded-2xl shadow-xs cursor-pointer transition-all active:scale-[0.98] flex-1 sm:flex-initial"
            >
              <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
              Nuevo Color
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MATRIZ VISUAL DE BOBINAS (CARD GRID LAYOUT 2x 3x 4x)                  */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredGridItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#75695D] italic rounded-3xl border border-dashed border-[#E2D9CC] bg-[#FFFFFF] shadow-xs">
            {search 
              ? 'No se encontraron filamentos que coincidan con la búsqueda.' 
              : 'No hay colores registrados en esta categoría.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {filteredGridItems.map((item) => {
              const isDisp = item.estado === 'DISPONIBLE'
              const rollos = item.rollos || 1
              const pesoInicial = item.pesoInicialGramos || (rollos * 1000)
              const gramos = isDisp ? (item.stockGramos ?? pesoInicial) : 0
              const pct = isDisp ? Math.min(100, Math.round((gramos / pesoInicial) * 100)) : 0
              const esCritico = isDisp && (gramos < 300 || Boolean(item.alertaCritica))

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between bg-[#FFFFFF] border rounded-2xl p-3 sm:p-3.5 transition-all duration-200 shadow-2xs hover:shadow-md ${
                    esCritico
                      ? 'border-[#FDE047] ring-1 ring-[#FEF08A]/70 bg-[#FFFDF7]'
                      : !isDisp
                      ? 'border-[#E2D9CC] opacity-90 bg-[#FAF8F5]'
                      : 'border-[#E2D9CC] hover:border-[#A36F4C]/50'
                  }`}
                >
                  {/* Encabezado de la Tarjeta */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1.5">
                      
                      {/* Swatch Círculo & Textura de Bobina */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditColor(item)}
                          className="relative h-6 w-6 sm:h-7 sm:w-7 rounded-full border border-black/15 shadow-2xs flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform flex items-center justify-center group"
                          style={{ backgroundColor: item.codigoHex }}
                          title={`Editar "${item.nombreColor}"`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-white/40 border border-black/10" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditColor(item)}
                          className="font-bold text-xs sm:text-sm text-[#241C15] truncate hover:text-[#A36F4C] hover:underline cursor-pointer text-left"
                          title={item.nombreColor}
                        >
                          {item.nombreColor}
                        </button>
                      </div>

                      {/* Badge de Estado */}
                      <div className="flex-shrink-0">
                        {esCritico ? (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] uppercase tracking-wider inline-flex items-center gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Crítico
                          </span>
                        ) : isDisp ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#EBF7EE] text-[#1E5E3A] border border-[#B4E3C0] uppercase tracking-wider">
                            Disponible
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] uppercase tracking-wider">
                            Restock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Nota o etiqueta contextual si existe */}
                    {item.nota && (
                      <div className="text-[10px] text-[#854D0E] bg-[#FEF9C3] px-2 py-0.5 rounded-lg border border-[#FDE047]/60 truncate">
                        {item.nota}
                      </div>
                    )}

                    {/* Cuerpo de la Tarjeta: Nivel de Filamento & Selector de Bobinas */}
                    <div className="space-y-2 pt-1">
                      {isDisp ? (
                        <>
                          {/* Barra de Progreso y Gramos */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <button
                                type="button"
                                onClick={() => handleSetGramosPrompt(item)}
                                className="font-extrabold text-[#241C15] hover:text-[#A36F4C] hover:underline cursor-pointer"
                                title="Toca para ingresar gramos exactos"
                              >
                                {gramos.toLocaleString()}g
                              </button>
                              <span className="text-[#75695D] text-[10px]">
                                / {pesoInicial.toLocaleString()}g ({pct}%)
                              </span>
                            </div>

                            <div className="w-full bg-[#EAE4DC] h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  esCritico ? 'bg-[#854D0E]' : pct < 50 ? 'bg-[#A36F4C]' : 'bg-[#1E5E3A]'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Microtexto si está crítico */}
                            {esCritico && (
                              <div className="text-[10px] font-bold text-[#854D0E] flex items-center gap-1 animate-pulse">
                                <span>⚠️ Solo {gramos}g restantes</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="py-2 text-center text-[11px] text-[#854D0E] font-bold bg-[#FEF9C3]/70 rounded-xl border border-[#FDE047]/50">
                          🛒 Marcado para Reposición
                        </div>
                      )}

                      {/* Contador de Bobinas Físicas */}
                      <div className="flex items-center justify-between bg-[#FAF8F5] border border-[#E2D9CC] rounded-xl px-2 py-1 text-xs">
                        <span className="text-[10px] font-bold text-[#75695D] uppercase tracking-wider">
                          Bobinas
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAjustarRollos(item, -1)}
                            disabled={rollos <= 1}
                            className="h-4.5 w-4.5 rounded flex items-center justify-center bg-white border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] disabled:opacity-30 cursor-pointer font-bold text-[11px] active:bg-[#FAF8F5]"
                            title="Restar bobina"
                          >
                            -
                          </button>
                          <span className="text-xs font-black font-mono text-[#241C15] min-w-[28px] text-center">
                            {rollos} un.
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAjustarRollos(item, 1)}
                            className="h-4.5 w-4.5 rounded flex items-center justify-center bg-white border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] cursor-pointer font-bold text-[11px] active:bg-[#FAF8F5]"
                            title="Agregar bobina"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pie de la Tarjeta: Acciones Rápidas */}
                  <div className="pt-2.5 mt-2.5 border-t border-[#E2D9CC]/70 space-y-2">
                    {/* Botones de Consumo Rápido (-50g / +50g) */}
                    {isDisp && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAjustarGramos(item, -50)}
                          className="flex-1 py-1 text-[10px] font-bold rounded-lg bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] active:scale-95 transition-transform cursor-pointer text-center"
                          title="Descontar 50g"
                        >
                          -50g
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAjustarGramos(item, 50)}
                          className="flex-1 py-1 text-[10px] font-bold rounded-lg bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] active:scale-95 transition-transform cursor-pointer text-center"
                          title="Añadir 50g"
                        >
                          +50g
                        </button>
                      </div>
                    )}

                    {/* Fila de Acciones: Toggle Estado + Menú de Opciones */}
                    <div className="flex items-center justify-between gap-1.5">
                      {isDisp ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleMoverARestock(item)}
                          className={`h-6.5 flex-1 text-[10px] font-bold rounded-lg px-2 cursor-pointer transition-colors ${
                            esCritico 
                              ? 'bg-[#854D0E] text-white border-[#854D0E] hover:bg-[#713F12]' 
                              : 'bg-white text-[#A36F4C] border-[#E2D9CC] hover:bg-[#F5EBE1]'
                          }`}
                        >
                          A Restock
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleMoverADisponible(item)}
                          className="h-6.5 flex-1 text-[10px] font-bold bg-[#1E5E3A] hover:bg-[#164B2E] text-white rounded-lg px-2 cursor-pointer shadow-2xs"
                        >
                          Marcar Disponible
                        </Button>
                      )}

                      {/* Icono Info de Fabricación */}
                      <button
                        type="button"
                        onClick={() => handleOpenColorDetails(item)}
                        title="Ver modelos fabricados con esta bobina"
                        className="h-6.5 w-6.5 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#A36F4C] hover:bg-[#F4EFEA] transition-colors cursor-pointer border border-[#E2D9CC] bg-white"
                      >
                        <Info className="h-3 w-3" />
                      </button>

                      {/* Icono Editar */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditColor(item)}
                        title={`Editar "${item.nombreColor}"`}
                        className="h-6.5 w-6.5 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#A36F4C] hover:bg-[#F4EFEA] transition-colors cursor-pointer border border-[#E2D9CC] bg-white"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>

                      {/* Icono Eliminar / Archivar */}
                      <button
                        type="button"
                        onClick={() => handleEliminarColor(item)}
                        title={`Eliminar "${item.nombreColor}"`}
                        className="h-6.5 w-6.5 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer border border-[#E2D9CC] bg-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL REFACTORIZADO: NUEVO COLOR (1 SOLA COLUMNA LIMPIA)               */}
      {/* ========================================================================= */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[460px] max-h-[92dvh] overflow-y-auto p-0 rounded-3xl shadow-2xl z-50">
          <form onSubmit={handleAddColorSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3">
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-[#241C15]">
                  Registrar Nuevo Color
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                  Agrega un filamento al inventario del taller
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-xl hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Nombre */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Nombre del Filamento / Color *
                </Label>
                <Input 
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Negro Carbón, Terracota Seda, Turquesa..."
                  required
                  autoFocus
                  className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-bold text-[#241C15] h-10"
                />
              </div>

              {/* 2. Selector Visual de Muestras (HEX Swatches agrupados) */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#F8F6F2] border border-[#E2D9CC]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241C15]">Muestra Visual (HEX)</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={nuevoHex}
                      onChange={(e) => setNuevoHex(e.target.value)}
                      className="h-6 w-8 rounded-lg border border-[#E2D9CC] cursor-pointer"
                    />
                    <Input 
                      value={nuevoHex}
                      onChange={(e) => setNuevoHex(e.target.value)}
                      className="w-20 h-6 text-xs font-mono font-bold bg-white border-[#E2D9CC] p-1 rounded-md text-center"
                    />
                  </div>
                </div>

                {/* Tonos Neutros */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#75695D] uppercase tracking-wider">Tonos Neutros:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SWATCH_GROUPS.neutros.map(sw => (
                      <button
                        key={sw.name}
                        type="button"
                        onClick={() => {
                          setNuevoHex(sw.hex)
                          if (!nuevoNombre) setNuevoNombre(sw.name)
                        }}
                        className={`h-7 w-7 rounded-full border shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer flex items-center justify-center ${
                          nuevoHex === sw.hex ? 'ring-2 ring-[#A36F4C] ring-offset-1 border-black' : 'border-black/15'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                        title={sw.name}
                      >
                        {nuevoHex === sw.hex && <Check className="h-3 w-3 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tonos Cálidos */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#75695D] uppercase tracking-wider">Tonos Cálidos:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SWATCH_GROUPS.calidos.map(sw => (
                      <button
                        key={sw.name}
                        type="button"
                        onClick={() => {
                          setNuevoHex(sw.hex)
                          if (!nuevoNombre) setNuevoNombre(sw.name)
                        }}
                        className={`h-7 w-7 rounded-full border shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer flex items-center justify-center ${
                          nuevoHex === sw.hex ? 'ring-2 ring-[#A36F4C] ring-offset-1 border-black' : 'border-black/15'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                        title={sw.name}
                      >
                        {nuevoHex === sw.hex && <Check className="h-3 w-3 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tonos Fríos */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#75695D] uppercase tracking-wider">Tonos Fríos:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SWATCH_GROUPS.frios.map(sw => (
                      <button
                        key={sw.name}
                        type="button"
                        onClick={() => {
                          setNuevoHex(sw.hex)
                          if (!nuevoNombre) setNuevoNombre(sw.name)
                        }}
                        className={`h-7 w-7 rounded-full border shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer flex items-center justify-center ${
                          nuevoHex === sw.hex ? 'ring-2 ring-[#A36F4C] ring-offset-1 border-black' : 'border-black/15'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                        title={sw.name}
                      >
                        {nuevoHex === sw.hex && <Check className="h-3 w-3 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Cantidad de Bobinas */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                    Bobinas Iniciales (1 un. = 1,000g)
                  </Label>
                  <span className="text-xs text-[#A36F4C] font-bold">
                    Capacidad: {(Math.max(1, parseInt(nuevoRollos || '1', 10)) * 1000).toLocaleString()} g
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
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
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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

              {/* 4. Estado Inicial */}
              <div className="space-y-1.5">
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
                        ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] shadow-2xs'
                        : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC]'
                    }`}
                  >
                    🟡 Para Restock
                  </button>
                </div>
              </div>

              {/* 5. Gramos Iniciales con Presets (250g, 500g, 1000g) */}
              {nuevoEstado === 'DISPONIBLE' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                      Gramos Iniciales
                    </Label>
                    <span className="text-xs font-mono font-bold text-[#1E5E3A]">
                      {nuevoGramos} g
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {[250, 500, 750, 1000].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setNuevoGramos(g.toString())}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          nuevoGramos === g.toString()
                            ? 'bg-[#241C15] text-white border-[#241C15]'
                            : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC] hover:bg-white'
                        }`}
                      >
                        {g}g
                      </button>
                    ))}
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

              {/* Nota */}
              {nuevoEstado === 'RESTOCK' && (
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                    Nota de Reposición (Opcional)
                  </Label>
                  <Input 
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Ej: Solicitado para proyecto especial..."
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
                Registrar Color
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 5. MODAL: EDITAR COLOR                                                    */}
      {/* ========================================================================= */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[440px] max-h-[92dvh] overflow-y-auto p-0 rounded-3xl shadow-2xl z-50">
          <form onSubmit={handleEditColorSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="h-8 w-8 rounded-full border border-black/15 shadow-2xs flex-shrink-0"
                  style={{ backgroundColor: editHex }}
                />
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-[#241C15]">
                    Editar Bobina / Color
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D]">
                    Modifica el nombre y acabado visual
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenEditModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-xl hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Nombre del Filamento *
                </Label>
                <Input 
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  placeholder="Ej: Negro Carbón..."
                  required
                  autoFocus
                  className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-bold text-[#241C15] h-10"
                />
              </div>

              {/* Selector Visual de Color */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#F8F6F2] border border-[#E2D9CC]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241C15]">Muestra Visual (HEX)</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={editHex}
                      onChange={(e) => setEditHex(e.target.value)}
                      className="h-6 w-8 rounded-lg border border-[#E2D9CC] cursor-pointer"
                    />
                    <Input 
                      value={editHex}
                      onChange={(e) => setEditHex(e.target.value)}
                      className="w-20 h-6 text-xs font-mono font-bold bg-white border-[#E2D9CC] p-1 rounded-md text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-1.5 pt-1">
                  {ALL_SWATCHES.slice(0, 18).map(sw => (
                    <button
                      key={sw.name}
                      type="button"
                      onClick={() => setEditHex(sw.hex)}
                      className={`h-7 w-7 rounded-full border shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer mx-auto flex items-center justify-center ${
                        editHex === sw.hex ? 'ring-2 ring-[#A36F4C] ring-offset-1 border-black' : 'border-black/15'
                      }`}
                      style={{ backgroundColor: sw.hex }}
                      title={sw.name}
                    >
                      {editHex === sw.hex && <Check className="h-3 w-3 text-white drop-shadow" />}
                    </button>
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
                  placeholder="Ej: Lote #2, Bobina especial..."
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
      {/* 6. MODAL: DETALLE DE MODELOS Y PRODUCTOS FABRICADOS                       */}
      {/* ========================================================================= */}
      <Dialog open={openColorDetailsModal} onOpenChange={setOpenColorDetailsModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[580px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-3xl z-50">
          {selectedColorForDetails && (
            <div className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
              {/* Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-[#E2D9CC] bg-[#FAF8F5] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-9 w-9 rounded-full border border-black/15 shadow-xs flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: selectedColorForDetails.codigoHex }}
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge 
                        variant="outline" 
                        className={selectedColorForDetails.estado === 'DISPONIBLE'
                          ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold'
                          : 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] text-[10px] font-bold'
                        }
                      >
                        {selectedColorForDetails.estado === 'DISPONIBLE' ? '🟢 En Taller' : '🟡 En Restock'}
                      </Badge>
                      <span className="text-xs text-[#75695D] font-mono font-bold">
                        {selectedColorForDetails.rollos || 1} {selectedColorForDetails.rollos === 1 ? 'bobina' : 'bobinas'}
                      </span>
                    </div>
                    <DialogTitle className="text-base sm:text-lg font-black text-[#241C15] tracking-tight truncate max-w-[220px] sm:max-w-[340px]">
                      {selectedColorForDetails.nombreColor}
                    </DialogTitle>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenColorDetailsModal(false)}
                  className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-xl hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
                {/* KPIs de Producción */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] text-center">
                    <span className="text-[10px] uppercase font-bold text-[#75695D] block truncate">
                      Total Piezas
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#241C15] font-mono block mt-0.5">
                      {selectedColorForDetails.totalProductosImpresos || 0}
                    </span>
                    <span className="text-[10px] text-[#75695D] truncate block">fabricadas</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] text-center">
                    <span className="text-[10px] uppercase font-bold text-[#75695D] block truncate">
                      Filamento Usado
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#A36F4C] font-mono block mt-0.5">
                      {(selectedColorForDetails.totalGramosConsumidos || 0).toLocaleString()} g
                    </span>
                    <span className="text-[10px] text-[#75695D] truncate block">consumidos</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] text-center">
                    <span className="text-[10px] uppercase font-bold text-[#75695D] block truncate">
                      Stock Restante
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#1E5E3A] font-mono block mt-0.5">
                      {(selectedColorForDetails.stockGramos || 0).toLocaleString()} g
                    </span>
                    <span className="text-[10px] text-[#75695D] truncate block">en taller</span>
                  </div>
                </div>

                {/* Lista de Modelos Fabricados */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#241C15] uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-[#A36F4C]" />
                      Modelos Fabricados ({selectedColorForDetails.productosInvertidos?.length || 0})
                    </span>
                  </div>

                  {(!selectedColorForDetails.productosInvertidos || selectedColorForDetails.productosInvertidos.length === 0) ? (
                    <div className="p-6 rounded-2xl border border-dashed border-[#E2D9CC] bg-[#FAF8F5] text-center space-y-1.5">
                      <Package className="h-7 w-7 text-[#D4BEA7] mx-auto opacity-70" />
                      <p className="text-xs font-bold text-[#75695D]">
                        No hay productos registrados con este color todavía.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedColorForDetails.productosInvertidos.map((prod) => (
                        <div 
                          key={prod.productoId}
                          className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] hover:bg-[#FFFFFF] transition-all space-y-2 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-bold text-[#241C15]">
                                  {prod.nombreModelo}
                                </span>
                                {prod.lineaCategoria && (
                                  <Badge variant="outline" className="text-[9px] px-2 py-0 bg-[#F5EBE1] text-[#A36F4C] border-[#E2D9CC]">
                                    {prod.lineaCategoria}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-[#75695D] block mt-0.5">
                                Peso: {prod.pesoGramosUnitario > 0 ? `${prod.pesoGramosUnitario}g c/u` : 'N/E'}
                              </span>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="text-xs font-black text-[#241C15] font-mono block">
                                {prod.totalUnidades} {prod.totalUnidades === 1 ? 'ud' : 'uds'}
                              </span>
                              <span className="text-xs font-bold text-[#A36F4C] font-mono">
                                {prod.totalGramos.toLocaleString()}g
                              </span>
                            </div>
                          </div>

                          {/* Mini Historial de Pedidos */}
                          {prod.ultimosPedidos && prod.ultimosPedidos.length > 0 && (
                            <div className="pt-2 border-t border-[#E2D9CC]/70 space-y-1">
                              <div className="space-y-1">
                                {prod.ultimosPedidos.slice(0, 3).map((ped, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs bg-white px-2 py-1 rounded-xl border border-[#E2D9CC]/60">
                                    <span className="text-[#241C15] font-medium truncate max-w-[140px] sm:max-w-[200px]">
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
              <div className="px-5 sm:px-6 py-3 border-t border-[#E2D9CC] bg-[#FAF8F5] flex items-center justify-end flex-shrink-0">
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
