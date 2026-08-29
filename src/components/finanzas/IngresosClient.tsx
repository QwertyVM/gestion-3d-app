'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Package,
  DollarSign,
  Loader2,
  Landmark,
  CreditCard,
  Tag
} from 'lucide-react'
import { createIngreso, deleteIngreso } from '@/actions/ingresos'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SearchableCombobox, ComboboxItem } from '@/components/ui/SearchableCombobox'
import { VentaItem, IngresoDirectoItem } from './FlujoCajaClient'

interface IngresosClientProps {
  ventas: VentaItem[]
  ingresosDirectos: IngresoDirectoItem[]
}

const ITEMS_PER_PAGE = 7

export function IngresosClient({ ventas, ingresosDirectos }: IngresosClientProps) {
  const router = useRouter()
  const [directos, setDirectos] = useState<IngresoDirectoItem[]>(ingresosDirectos)

  useEffect(() => {
    setDirectos(ingresosDirectos)
  }, [ingresosDirectos])

  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'VENTAS' | 'DIRECTOS'>('TODOS')
  const [openModal, setOpenModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Form states
  const [formCliente, setFormCliente] = useState('')
  const [formConcepto, setFormConcepto] = useState('')
  const [formCategoria, setFormCategoria] = useState('Servicio de Impresión 3D')
  const [formMonto, setFormMonto] = useState('')
  const [formMetodoPago, setFormMetodoPago] = useState('YAPE')
  const [formNotas, setFormNotas] = useState('')

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Financial KPIs
  const totalIngresosCobradosVentas = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
  }, [ventas])

  const totalIngresosDirectos = useMemo(() => {
    return directos.reduce((acc, i) => acc + (i.monto || 0), 0)
  }, [directos])

  const totalIngresosCobrados = totalIngresosCobradosVentas + totalIngresosDirectos

  const totalFacturadoVentas = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.total || 0), 0)
  }, [ventas])

  const totalSaldosPorCobrar = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0)
  }, [ventas])

  // Consolidated Incomes List
  const unifiedIngresos = useMemo(() => {
    const list: Array<{
      id: string
      rawId: string
      fecha: string
      origen: 'VENTA_CATALOGO' | 'INGRESO_DIRECTO'
      cliente: string
      concepto: string
      categoria: string
      montoCobrado: number
      totalOriginal?: number
      saldoPendiente?: number
      metodoPago?: string
      canDelete: boolean
    }> = []

    // From Sales
    ventas.forEach(v => {
      list.push({
        id: `v-${v.id}`,
        rawId: v.id,
        fecha: v.fecha,
        origen: 'VENTA_CATALOGO',
        cliente: v.cliente,
        concepto: `${v.producto.nombreModelo} (x${v.cantidad})`,
        categoria: v.producto.lineaCategoria,
        montoCobrado: v.montoPagado,
        totalOriginal: v.total,
        saldoPendiente: v.saldoPendiente,
        metodoPago: 'Venta',
        canDelete: false,
      })
    })

    // From Direct Incomes
    directos.forEach(i => {
      list.push({
        id: `dir-${i.id}`,
        rawId: i.id,
        fecha: i.fecha,
        origen: 'INGRESO_DIRECTO',
        cliente: i.cliente,
        concepto: i.concepto,
        categoria: i.categoria,
        montoCobrado: i.monto,
        metodoPago: i.metodoPago,
        canDelete: true,
      })
    })

    return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [ventas, directos])

  // Filtered List
  const filteredIngresos = useMemo(() => {
    return unifiedIngresos.filter(item => {
      const matchSearch = 
        item.cliente.toLowerCase().includes(search.toLowerCase()) ||
        item.concepto.toLowerCase().includes(search.toLowerCase()) ||
        item.categoria.toLowerCase().includes(search.toLowerCase())

      let matchTipo = true
      if (tipoFilter === 'VENTAS') matchTipo = item.origen === 'VENTA_CATALOGO'
      if (tipoFilter === 'DIRECTOS') matchTipo = item.origen === 'INGRESO_DIRECTO'

      return matchSearch && matchTipo
    })
  }, [unifiedIngresos, search, tipoFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredIngresos.length / ITEMS_PER_PAGE))
  const paginatedIngresos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredIngresos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredIngresos, currentPage])

  const handleOpenCreate = () => {
    setFormCliente('')
    setFormConcepto('')
    setFormCategoria('Servicio de Impresión 3D')
    setFormMonto('')
    setFormMetodoPago('YAPE')
    setFormNotas('')
    setOpenModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCliente.trim() || !formConcepto.trim() || !formMonto) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createIngreso({
        cliente: formCliente.trim(),
        concepto: formConcepto.trim(),
        categoria: formCategoria,
        monto: parseFloat(formMonto) || 0,
        metodoPago: formMetodoPago,
        notas: formNotas.trim() || undefined,
      })
      setDirectos(prev => [created as any, ...prev])
      toast.success('Ingreso registrado exitosamente')
      setOpenModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar ingreso')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDirect = async (id: string, concepto: string) => {
    if (confirm(`¿Seguro que deseas eliminar el ingreso "${concepto}"?`)) {
      try {
        await deleteIngreso(id)
        setDirectos(prev => prev.filter(item => item.id !== id))
        toast.success('Ingreso eliminado')
        router.refresh()
      } catch (err) {
        toast.error('Error al eliminar ingreso')
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EBF7EE] border border-[#B4E3C0] text-[#1E5E3A] shadow-sm">
              <ArrowUpRight className="h-6 w-6 stroke-[2.5]" />
            </div>
            Registro de Ingresos
          </h1>
          <p className="text-sm text-[#75695D] mt-1">
            Control de cobros por ventas de productos 3D y servicios de impresión / diseño personalizado.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate}
          className="bg-[#1E5E3A] hover:bg-[#16472C] text-white font-bold rounded-xl shadow-md shadow-[#1E5E3A]/20 transition-all cursor-pointer h-10 px-4 text-xs"
        >
          <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
          Registrar Ingreso Directo
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E5E3A]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
            Total Ingresos Cobrados
          </span>
          <div className="text-2xl font-extrabold text-[#1E5E3A] font-mono mt-1">
            {formatCurrency(totalIngresosCobrados)}
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">
            Dinero real ingresado a caja
          </span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A36F4C] flex items-center gap-2">
            <Package className="h-4 w-4 stroke-[2.5]" />
            Facturación Total en Ventas
          </span>
          <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
            {formatCurrency(totalFacturadoVentas)}
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">
            Monto total de ventas generadas
          </span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D1F] flex items-center gap-2">
            <Clock className="h-4 w-4 stroke-[2.5]" />
            Cuentas por Cobrar (Saldos)
          </span>
          <div className="text-2xl font-extrabold text-[#8C6D1F] font-mono mt-1">
            {formatCurrency(totalSaldosPorCobrar)}
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">
            Saldos pendientes de entrega
          </span>
        </div>
      </div>

      {/* 1-Row Toolbar */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
          <Input 
            placeholder="Buscar por cliente, modelo o servicio..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 pr-8 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs md:text-sm rounded-xl h-9 focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC]">
          <button
            onClick={() => { setTipoFilter('TODOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tipoFilter === 'TODOS'
                ? 'bg-[#1E5E3A] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            Todos ({unifiedIngresos.length})
          </button>
          <button
            onClick={() => { setTipoFilter('VENTAS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              tipoFilter === 'VENTAS'
                ? 'bg-[#A36F4C] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            <Package className="h-3 w-3 stroke-[2.5]" />
            Ventas Catálogo
          </button>
          <button
            onClick={() => { setTipoFilter('DIRECTOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              tipoFilter === 'DIRECTOS'
                ? 'bg-[#8C6D1F] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            <DollarSign className="h-3 w-3 stroke-[2.5]" />
            Servicios Directos
          </button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] overflow-hidden shadow-md rounded-2xl">
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="w-full min-w-[650px]">
            <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
            <TableRow className="border-[#E2D9CC] hover:bg-transparent">
              <TableHead className="text-[#241C15] font-bold px-4 py-3 text-left">Fecha</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Origen / Tipo</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Cliente</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Concepto / Detalle</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-center hidden sm:table-cell">Método</TableHead>
              <TableHead className="text-[#241C15] font-bold px-4 py-3 text-right">Monto Cobrado</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedIngresos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-[#75695D]">
                  No se encontraron ingresos registrados en este periodo.
                </TableCell>
              </TableRow>
            ) : (
              paginatedIngresos.map((ing) => (
                <TableRow key={ing.id} className="border-[#E2D9CC]/70 hover:bg-[#FDFBF7] transition-colors">
                  <TableCell className="px-4 py-3 text-xs text-[#75695D] font-mono whitespace-nowrap">
                    {formatDate(ing.fecha)}
                  </TableCell>

                  <TableCell className="px-3 py-3 whitespace-nowrap">
                    {ing.origen === 'VENTA_CATALOGO' ? (
                      <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-xs font-bold">
                        Venta Catálogo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-xs font-bold">
                        Servicio Directo
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="px-3 py-3 font-bold text-[#241C15] whitespace-nowrap">
                    {ing.cliente}
                  </TableCell>

                  <TableCell className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#241C15]">
                        {ing.concepto}
                      </span>
                      {ing.saldoPendiente && ing.saldoPendiente > 0 ? (
                        <span className="text-[11px] text-[#8C6D1F] font-bold">
                          Saldo pendiente: {formatCurrency(ing.saldoPendiente)}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-3 text-center hidden sm:table-cell whitespace-nowrap">
                    <Badge variant="outline" className="bg-[#F4EFEA] border-[#E2D9CC] text-[#75695D] text-xs">
                      {ing.metodoPago || 'Yape'}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right font-mono font-extrabold text-[#1E5E3A] whitespace-nowrap">
                    +{formatCurrency(ing.montoCobrado)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-center whitespace-nowrap">
                    {ing.canDelete ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteDirect(ing.rawId, ing.concepto)}
                        className="h-8 w-8 text-[#75695D] hover:text-[#A34335] hover:bg-red-50 rounded-xl cursor-pointer"
                        title="Eliminar ingreso directo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-[11px] text-[#75695D] font-medium">Desde Ventas</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E2D9CC] bg-[#F4EFEA] text-xs text-[#75695D]">
            <div>
              Mostrando página <span className="text-[#241C15] font-bold">{currentPage}</span> de <span className="text-[#241C15] font-bold">{totalPages}</span> ({filteredIngresos.length} ingresos)
            </div>

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
                        ? 'bg-[#1E5E3A] text-white shadow-sm'
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
          </div>
        )}
      </Card>

      {/* Modal: Registrar Ingreso Directo */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#EBF7EE] border border-[#B4E3C0] flex items-center justify-center text-[#1E5E3A] shadow-sm">
                <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#241C15] tracking-tight">
                  Registrar Nuevo Ingreso Directo
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D]">
                  Ingresos por servicios de impresión, diseño 3D o aportes a caja.
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Cliente / Empresa *</Label>
              <Input 
                value={formCliente}
                onChange={(e) => setFormCliente(e.target.value)}
                placeholder="Ej: Juan Pérez / Empresa ABC"
                required
                className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Concepto / Servicio Realizado *</Label>
              <Input 
                value={formConcepto}
                onChange={(e) => setFormConcepto(e.target.value)}
                placeholder="Ej: Impresión pieza técnica en PETG, Modelado 3D..."
                required
                className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Categoría *</Label>
                <SearchableCombobox
                  items={[
                    { id: 'Servicio de Impresión 3D', label: 'Servicio de Impresión 3D', sublabel: 'Fabricación a pedido', icon: Package },
                    { id: 'Diseño & Modelado CAD', label: 'Diseño & Modelado CAD', sublabel: 'Modelado 3D y prototipado', icon: Tag },
                    { id: 'Préstamo Bancario / Financiamiento', label: 'Préstamo Bancario / Financiamiento', sublabel: 'Inyección de liquidez', icon: Landmark },
                    { id: 'Venta Directa', label: 'Venta Directa / Feria', sublabel: 'Venta de stock presencial', icon: DollarSign },
                    { id: 'Servicio Técnico', label: 'Servicio Técnico / Calibración', sublabel: 'Mantenimiento de impresoras', icon: Package },
                    { id: 'Aporte de Capital', label: 'Aporte de Capital', sublabel: 'Fondos propios', icon: Landmark },
                    { id: 'Otros Ingresos', label: 'Otros Ingresos', sublabel: 'Ingresos varios no clasificados' },
                  ]}
                  value={formCategoria}
                  onChange={(val) => setFormCategoria(val)}
                  allowCustomInput={true}
                  customCreateLabel="Usar categoría:"
                  placeholder="Seleccionar categoría..."
                  icon={Tag}
                  inputClassName="bg-[#F4EFEA]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Método de Pago *</Label>
                <SearchableCombobox
                  items={[
                    { id: 'YAPE', label: 'Yape', sublabel: 'Billetera digital BCP', badge: 'Digital' },
                    { id: 'PLIN', label: 'Plin', sublabel: 'Billetera digital BBVA/Interbank', badge: 'Digital' },
                    { id: 'TRANSFERENCIA_BCP', label: 'Transferencia BCP', sublabel: 'Cuenta bancaria BCP', badge: 'Banco' },
                    { id: 'TRANSFERENCIA_BBVA', label: 'Transferencia BBVA', sublabel: 'Cuenta bancaria BBVA', badge: 'Banco' },
                    { id: 'TRANSFERENCIA_INTERBANK', label: 'Transferencia Interbank', sublabel: 'Cuenta bancaria Interbank', badge: 'Banco' },
                    { id: 'EFECTIVO', label: 'Efectivo', sublabel: 'Dinero en mano física', badge: 'Caja física' },
                  ]}
                  value={formMetodoPago}
                  onChange={(val) => setFormMetodoPago(val)}
                  placeholder="Seleccionar método..."
                  icon={CreditCard}
                  clearable={false}
                  inputClassName="bg-[#F4EFEA]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Monto Cobrado (S/) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-[#75695D]">S/</span>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formMonto}
                  onChange={(e) => setFormMonto(e.target.value)}
                  placeholder="0.00"
                  required
                  className="pl-8 bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono font-extrabold text-base rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Notas / Observaciones (Opcional)</Label>
              <Input 
                value={formNotas}
                onChange={(e) => setFormNotas(e.target.value)}
                placeholder="Ej: Pago adelantado del 100%"
                className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2D9CC]">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenModal(false)}
                className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2 rounded-xl cursor-pointer font-medium"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#1E5E3A] hover:bg-[#16472C] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#1E5E3A]/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Ingreso'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
