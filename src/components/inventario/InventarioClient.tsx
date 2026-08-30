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
  Package
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
  resetColoresTaller 
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
  const [isPending, startTransition] = useTransition()

  // Quick Add State
  const [openAddModal, setOpenAddModal] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoHex, setNuevoHex] = useState('#18181B')
  const [nuevoEstado, setNuevoEstado] = useState<'DISPONIBLE' | 'RESTOCK'>('DISPONIBLE')
  const [nuevoRollos, setNuevoRollos] = useState('1')
  const [nuevoGramos, setNuevoGramos] = useState('1000')
  const [nuevaNota, setNuevaNota] = useState('')

  // Filtered and sorted lists (Críticos arriba, orden alfabético)
  const filteredDisponibles = useMemo(() => {
    let list = disponibles
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.nombreColor.toLowerCase().includes(q))
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
  }, [disponibles, search])

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
    // Optimistic UI
    setDisponibles(prev => prev.filter(c => c.id !== item.id))
    setRestock(prev => [{ ...item, estado: 'RESTOCK', stockGramos: 0, alertaCritica: true }, ...prev])

    try {
      await moverEstadoColor(item.id, 'RESTOCK')
      toast.info(`"${item.nombreColor}" movido a Restock`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      // Rollback
      setRestock(prev => prev.filter(c => c.id !== item.id))
      setDisponibles(prev => [item, ...prev])
    }
  }

  // Move from Restock -> Disponible
  const handleMoverADisponible = async (item: ColorFilamentoItem) => {
    // Optimistic UI
    setRestock(prev => prev.filter(c => c.id !== item.id))
    setDisponibles(prev => [{ ...item, estado: 'DISPONIBLE', stockGramos: 1000, alertaCritica: false, nota: null }, ...prev])

    try {
      await moverEstadoColor(item.id, 'DISPONIBLE')
      toast.success(`"${item.nombreColor}" marcado como Disponible (1,000g)`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      // Rollback
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
    if (!confirm(`¿Estás seguro de eliminar el color "${item.nombreColor}" del inventario?`)) return

    // Optimistic UI
    if (item.estado === 'DISPONIBLE') {
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
    } else {
      setRestock(prev => prev.filter(c => c.id !== item.id))
    }

    try {
      const res = await eliminarColor(item.id)
      if (res.softDeleted) {
        toast.success(`"${item.nombreColor}" desactivado del inventario (mantiene historial de pedidos)`)
      } else {
        toast.success(`"${item.nombreColor}" eliminado con éxito`)
      }
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
      // Rollback
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

      toast.success(`"${created.nombreColor}" agregado con ${rollosNum} ${rollosNum === 1 ? 'rollo' : 'rollos'} (${totalGramosCapacidad.toLocaleString()}g total)`)
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
      // Al aumentar, agrega exactamente de 1000 g en 1000 g
      nuevosGramos = prevGramos + ((nuevosRollos - prevRollos) * 1000)
    } else if (nuevosRollos < prevRollos) {
      // Al disminuir, resta 1000 g por unidad (tope el nuevo total y mínimo 0)
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
      toast.success(`"${item.nombreColor}" actualizado a ${nuevosRollos} un. (${nuevoTotal.toLocaleString()}g total)`)
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
      // Al aumentar, agrega de 1000 g en 1000 g
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
      toast.success(`"${item.nombreColor}" configurado con ${num} un. (${nuevoTotal.toLocaleString()}g total)`)
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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. CABECERA PRINCIPAL Y ACCIONES                                          */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        {/* Breadcrumb Contextual */}
        <div className="flex items-center gap-2 text-xs text-[#75695D] font-medium">
          <Link href="/catalogo" className="hover:text-[#A36F4C] transition-colors flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>Catálogo</span>
          </Link>
          <span>/</span>
          <span className="text-[#241C15] font-bold">Inventario de Filamentos</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#241C15] tracking-tight flex items-center gap-2.5">
              <Palette className="h-6 w-6 text-[#A36F4C]" />
              Control de Colores & Gramaje de Filamentos
            </h1>
            <p className="text-xs sm:text-sm text-[#75695D] mt-0.5">
              Taller NOVA • Control de peso en bobinas abiertas, alertas de stock crítico y lista de restock.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopiarRestock}
              className="border-[#D4BEA7] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#633E20] font-bold text-xs h-10 px-3.5 rounded-xl cursor-pointer shadow-xs active:scale-[0.98] flex-1 sm:flex-initial"
            >
              <Copy className="h-4 w-4 mr-1.5 text-[#A36F4C]" />
              Copiar lista Restock ({restock.length})
            </Button>

            <Button
              type="button"
              onClick={() => setOpenAddModal(true)}
              className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98] flex-1 sm:flex-initial"
            >
              <Plus className="h-4 w-4 mr-1 stroke-[2.5]" />
              + Agregar Color
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title="Restablecer lista de taller"
              className="p-2.5 text-[#75695D] hover:text-[#241C15] rounded-xl hover:bg-[#F4EFEA] cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPIs SUPERIORES DE INVENTARIO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider block">
              Stock Total en Gramos
            </span>
            <div className="text-base sm:text-lg font-black text-[#1E5E3A] font-mono mt-0.5">
              {totalGramosActivos.toLocaleString()} g
            </div>
            <span className="text-[10px] text-[#75695D]">
              {(totalGramosActivos / 1000).toFixed(2)} kg activos en taller
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider block">
              Bobinas en Taller
            </span>
            <div className="text-base sm:text-lg font-black text-[#241C15] font-mono mt-0.5">
              {totalRollosActivos} bobinas
            </div>
            <span className="text-[10px] text-[#1E5E3A] font-semibold">
              🟢 {disponibles.length} colores activos (1,000g c/u)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider block">
              Stock Crítico (&lt;300g)
            </span>
            <div className={`text-base sm:text-lg font-black font-mono mt-0.5 ${totalCriticos.length > 0 ? 'text-[#DC2626]' : 'text-[#1E5E3A]'}`}>
              {totalCriticos.length} {totalCriticos.length === 1 ? 'color' : 'colores'}
            </div>
            <span className={`text-[10px] font-semibold ${totalCriticos.length > 0 ? 'text-[#DC2626]' : 'text-[#75695D]'}`}>
              {totalCriticos.length > 0 ? '⚠️ Alerta de reposición' : 'Nivel óptimo'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#75695D] uppercase tracking-wider block">
              Para Restock / Pedir
            </span>
            <div className="text-base sm:text-lg font-black text-[#A36F4C] font-mono mt-0.5">
              {restock.length} colores
            </div>
            <span className="text-[10px] text-[#8C6D1F] font-semibold">
              🟡 Lista de compra
            </span>
          </div>
        </div>

        {/* Buscador Rápido */}
        <div className="relative pt-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
          <Input 
            placeholder="Buscar color disponible, por pedir o gramaje..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-9 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs sm:text-sm rounded-xl h-10 focus:border-[#A36F4C] focus:bg-[#FFFFFF] transition-all"
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
      </div>

      {/* ========================================================================= */}
      {/* ESTRUCTURA DE 2 COLUMNAS CLARAS                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* ----------------------------------------------------------------------- */}
        {/* COLUMNA 1: COLORES DISPONIBLES EN TALLER                                */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2D9CC]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#1E5E3A]" />
              <h2 className="text-sm font-black text-[#241C15] uppercase tracking-wider">
                Colores Disponibles en Taller
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {totalCriticos.length > 0 && (
                <Badge variant="outline" className="bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5] text-[11px] font-bold">
                  {totalCriticos.length} críticos
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs font-bold font-mono px-2.5 py-0.5"
              >
                {filteredDisponibles.length} activos
              </Badge>
            </div>
          </div>

          {/* Lista Limpia de Tarjetas con Gramos y Alertas */}
          <div className="space-y-3">
            {filteredDisponibles.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#75695D] italic">
                {search ? 'No se encontraron colores disponibles' : 'No hay colores disponibles registrados'}
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
                    className={`p-3.5 rounded-xl border transition-all shadow-2xs space-y-2.5 ${
                      esCritico
                        ? 'bg-[#FFFBFB] border-red-300 ring-1 ring-red-300/40'
                        : 'bg-[#FAF8F5] border-[#E2D9CC] hover:bg-[#FFFFFF] hover:border-[#1E5E3A]/40'
                    }`}
                  >
                    {/* Fila 1: Nombre + Color Dot + Selector de Cantidad + Acción Principal y Eliminar */}
                    <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="h-6 w-6 rounded-full border border-black/15 shadow-xs flex-shrink-0"
                          style={{ backgroundColor: item.codigoHex }}
                          title={item.nombreColor}
                        />
                        <span className="text-sm font-bold text-[#241C15] truncate">
                          {item.nombreColor}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Selector Compacto de Cantidad */}
                        <div className="flex items-center gap-1 bg-[#F4EFEA] border border-[#D4BEA7] rounded-lg px-1.5 py-0.5 shadow-2xs" title="Cantidad (1 un. = 1,000g)">
                          <button
                            type="button"
                            onClick={() => handleAjustarRollos(item, -1)}
                            disabled={rollos <= 1}
                            className="h-4 w-4 rounded flex items-center justify-center bg-white border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] disabled:opacity-30 cursor-pointer font-bold text-xs"
                            title="Restar (-1000g)"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetRollosPrompt(item)}
                            className="text-xs font-black font-mono text-[#241C15] hover:text-[#A36F4C] hover:underline cursor-pointer px-1"
                            title="Clic para definir cantidad (1 un. = 1,000g)"
                          >
                            {rollos} un.
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAjustarRollos(item, 1)}
                            className="h-4 w-4 rounded flex items-center justify-center bg-white border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] cursor-pointer font-bold text-xs"
                            title="Agregar (+1000g)"
                          >
                            +
                          </button>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoverARestock(item)}
                          className={`h-7 text-xs font-semibold px-2.5 rounded-lg transition-colors cursor-pointer ${
                            esCritico
                              ? 'bg-red-50 text-[#DC2626] border-red-200 hover:bg-red-100 hover:border-red-300'
                              : 'text-[#A36F4C] border-[#D4BEA7] bg-white hover:bg-[#FCE8E6] hover:text-[#A34335]'
                          }`}
                        >
                          {esCritico ? 'Mover a Restock' : 'A Restock'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleEliminarColor(item)}
                          title={`Eliminar "${item.nombreColor}"`}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Fila 2: Gramos Restantes + Mini Barra de Progreso + Ajuste Rápido */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-mono">
                          <button
                            type="button"
                            onClick={() => handleSetGramosPrompt(item)}
                            className="font-bold text-[#241C15] hover:text-[#A36F4C] hover:underline cursor-pointer"
                            title="Haz clic para ingresar gramos exactos pesados"
                          >
                            {gramos.toLocaleString()} g
                          </button>
                          <span className="text-[#75695D] text-[11px]">
                            de {pesoInicial.toLocaleString()} g
                          </span>
                        </div>

                        {/* Botones de Micro-ajuste */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAjustarGramos(item, -50)}
                            className="h-5 px-1.5 text-[10px] font-bold rounded bg-white border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] cursor-pointer"
                            title="Descontar 50g"
                          >
                            -50g
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAjustarGramos(item, 50)}
                            className="h-5 px-1.5 text-[10px] font-bold rounded bg-white border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] cursor-pointer"
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
                          <span>{pesoInicial - gramos > 0 ? `-${(pesoInicial - gramos).toLocaleString()}g consumidos` : 'Stock íntegro'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bloque de Alerta de Stock Crítico (< 300g) */}
                    {esCritico && (
                      <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-[#DC2626] space-y-1 animate-in fade-in duration-150">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                          <span>⚠️ Stock Crítico: {gramos}g restantes (Bajo de 300g)</span>
                        </div>
                        <p className="text-[11px] text-red-700 leading-tight">
                          Puede no alcanzar para impresiones grandes o insertos.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMNA 2: COLORES PARA RESTOCK / COMPRAR                                */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2D9CC]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#A36F4C]" />
              <h2 className="text-sm font-black text-[#241C15] uppercase tracking-wider">
                Colores para Restock / Comprar
              </h2>
            </div>
            <Badge 
              variant="outline" 
              className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-xs font-bold font-mono px-2.5 py-0.5"
            >
              {filteredRestock.length} por pedir
            </Badge>
          </div>

          {/* Lista Limpia de Tarjetas */}
          <div className="space-y-2">
            {filteredRestock.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#75695D] italic">
                {search ? 'No se encontraron colores para restock' : '¡Todo el stock está disponible!'}
              </div>
            ) : (
              filteredRestock.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#A36F4C]/50 transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Círculo / Dot Visual */}
                    <div 
                      className="h-6 w-6 rounded-full border border-black/15 shadow-xs flex-shrink-0 opacity-70"
                      style={{ backgroundColor: item.codigoHex }}
                      title={item.nombreColor}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#241C15] block truncate">
                          {item.nombreColor}
                        </span>
                        <span className="text-[10px] text-[#75695D] font-mono bg-[#EAE4DC] px-1.5 py-0.2 rounded">
                          {item.rollos || 1} un.
                        </span>
                      </div>
                      {item.nota && (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded inline-block mt-0.5">
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
                      className="h-7 text-xs font-bold bg-[#1E5E3A] hover:bg-[#164B2E] text-white px-3 rounded-lg shadow-2xs cursor-pointer active:scale-[0.98]"
                    >
                      Marcar Disponible
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleEliminarColor(item)}
                      title={`Eliminar "${item.nombreColor}"`}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL RÁPIDO: AGREGAR COLOR                                               */}
      {/* ========================================================================= */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] max-w-[420px] p-0 rounded-2xl shadow-2xl z-50">
          <form onSubmit={handleAddColorSubmit} className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3">
              <div>
                <DialogTitle className="text-base font-bold text-[#241C15]">
                  Agregar Nuevo Color
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D]">
                  Ingresa el color y la cantidad de unidades (1 un. = 1,000g)
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Nombre */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase">
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
                  <Label className="text-xs font-bold text-[#241C15] uppercase">
                    Cantidad (1 un. = 1,000 g) *
                  </Label>
                  <span className="text-[10px] text-[#A36F4C] font-semibold">
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
                <Label className="text-xs font-bold text-[#241C15] uppercase">
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
                    <Label className="text-xs font-bold text-[#241C15] uppercase">
                      Gramos Restantes *
                    </Label>
                    <span className="text-[10px] text-[#75695D]">
                      Capacidad total: {(Math.max(1, parseInt(nuevoRollos || '1', 10)) * 1000).toLocaleString()} g
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
                  <Label className="text-xs font-bold text-[#241C15] uppercase">
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
    </div>
  )
}
