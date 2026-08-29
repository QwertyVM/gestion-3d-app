'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Clock, 
  Search, 
  X,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ShoppingBag,
  Truck,
  DollarSign
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export interface EgresoItem {
  id: string
  persona: string
  categoria: 'ACTIVO_FIJO' | 'INSUMO' | 'SERVICIO' | 'APORTE_CAPITAL'
  subcategoria?: string | null
  itemConcepto: string
  especificacionColor?: string | null
  presentacion?: string | null
  cantidad: number
  costoUnitario: number
  costoEnvio?: number | null
  costoTotal: number
  costoPorGramo?: number | null
  createdAt: string
}

export interface VentaItem {
  id: string
  fecha: string
  cliente: string
  cantidad: number
  precioUnitario: number
  total: number
  montoPagado: number
  saldoPendiente: number
  estado: string
  producto: {
    nombreModelo: string
    lineaCategoria: string
  }
}

export interface IngresoDirectoItem {
  id: string
  fecha: string
  cliente: string
  concepto: string
  categoria: string
  monto: number
  metodoPago?: string
  notas?: string
}

interface FlujoCajaClientProps {
  egresos: EgresoItem[]
  ventas: VentaItem[]
  ingresosDirectos?: IngresoDirectoItem[]
}

const ITEMS_PER_PAGE = 5

export function FlujoCajaClient({ 
  egresos, 
  ventas, 
  ingresosDirectos = [] 
}: FlujoCajaClientProps) {
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'INGRESOS' | 'EGRESOS'>('TODOS')
  const [currentPage, setCurrentPage] = useState(1)

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Financial Metrics Calculation
  const totalIngresosVentas = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
  }, [ventas])

  const totalIngresosDirectos = useMemo(() => {
    return ingresosDirectos.reduce((acc, i) => acc + (i.monto || 0), 0)
  }, [ingresosDirectos])

  const totalIngresosTotales = totalIngresosVentas + totalIngresosDirectos

  const totalSaldosPorCobrar = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0)
  }, [ventas])

  const totalEgresosMaquinaria = useMemo(() => {
    return egresos
      .filter(e => e.categoria === 'ACTIVO_FIJO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [egresos])

  const totalEgresosInsumos = useMemo(() => {
    return egresos
      .filter(e => e.categoria === 'INSUMO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [egresos])

  const totalEgresosServicios = useMemo(() => {
    return egresos
      .filter(e => e.categoria === 'SERVICIO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [egresos])

  const totalEgresosTotales = totalEgresosMaquinaria + totalEgresosInsumos + totalEgresosServicios
  const saldoNetoCaja = totalIngresosTotales - totalEgresosTotales

  // Unified Chronological Movements (Libro de Caja Diario)
  const allMovements = useMemo(() => {
    const movements: Array<{
      id: string
      fecha: string
      tipo: 'INGRESO_VENTA' | 'INGRESO_DIRECTO' | 'EGRESO_MAQUINARIA' | 'EGRESO_INSUMO' | 'EGRESO_SERVICIO'
      concepto: string
      entidad: string
      monto: number
      detalle?: string
      isPositive: boolean
    }> = []

    // 1. Incomes from Product Sales
    ventas.forEach(v => {
      if (v.montoPagado > 0) {
        movements.push({
          id: `v-${v.id}`,
          fecha: v.fecha,
          tipo: 'INGRESO_VENTA',
          concepto: `Venta: ${v.producto.nombreModelo} (x${v.cantidad})`,
          entidad: v.cliente,
          monto: v.montoPagado,
          detalle: v.saldoPendiente > 0 ? `Saldo pend: ${formatCurrency(v.saldoPendiente)}` : 'Cobrado total',
          isPositive: true,
        })
      }
    })

    // 2. Incomes from Direct Services / Other
    ingresosDirectos.forEach(i => {
      movements.push({
        id: `ing-${i.id}`,
        fecha: i.fecha,
        tipo: 'INGRESO_DIRECTO',
        concepto: `${i.categoria}: ${i.concepto}`,
        entidad: i.cliente,
        monto: i.monto,
        detalle: i.metodoPago ? `Método: ${i.metodoPago}` : undefined,
        isPositive: true,
      })
    })

    // 3. Expenses / Egresos
    egresos.forEach(e => {
      if (e.categoria === 'ACTIVO_FIJO') {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_MAQUINARIA',
          concepto: `Maquinaria/Equipo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.presentacion || 'Activo / Equipo 3D',
          isPositive: false,
        })
      } else if (e.categoria === 'INSUMO') {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_INSUMO',
          concepto: `Insumo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.especificacionColor ? `Color: ${e.especificacionColor}` : (e.presentacion || 'Material'),
          isPositive: false,
        })
      } else {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_SERVICIO',
          concepto: `Gasto Operativo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: 'Servicio / Flete / Operativo',
          isPositive: false,
        })
      }
    })

    // Sort descending by date
    return movements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [ventas, ingresosDirectos, egresos])

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return allMovements.filter(m => {
      const matchSearch = 
        m.concepto.toLowerCase().includes(search.toLowerCase()) ||
        m.entidad.toLowerCase().includes(search.toLowerCase()) ||
        (m.detalle && m.detalle.toLowerCase().includes(search.toLowerCase()))

      let matchTipo = true
      if (tipoFilter === 'INGRESOS') matchTipo = m.isPositive
      if (tipoFilter === 'EGRESOS') matchTipo = !m.isPositive

      return matchSearch && matchTipo
    })
  }, [allMovements, search, tipoFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / ITEMS_PER_PAGE))
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredMovements.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredMovements, currentPage])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm">
            <Wallet className="h-6 w-6 stroke-[2.5]" />
          </div>
          Flujo de Caja (Cash Flow)
        </h1>
        <p className="text-sm text-[#75695D] mt-1">
          Balance financiero consolidado entre ingresos efectivamente cobrados y egresos operativos del taller.
        </p>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Neto en Caja */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className={`absolute top-0 left-0 right-0 h-1 ${saldoNetoCaja >= 0 ? 'bg-[#1E5E3A]' : 'bg-[#A34335]'}`} />
          <CardHeader className="pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#75695D]">
              Saldo Neto en Caja
            </span>
            <div className={`text-2xl font-extrabold font-mono mt-1 ${saldoNetoCaja >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
              {formatCurrency(saldoNetoCaja)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-[#75695D]">
              Ingresos Cobrados - Egresos Totales
            </span>
          </CardContent>
        </Card>

        {/* Ingresos Cobrados */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E5E3A]" />
          <CardHeader className="pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A] flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
              Total Ingresos
            </span>
            <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
              {formatCurrency(totalIngresosTotales)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-[#75695D]">
              Ventas: {formatCurrency(totalIngresosVentas)} • Servicios: {formatCurrency(totalIngresosDirectos)}
            </span>
          </CardContent>
        </Card>

        {/* Egresos Totales */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#A36F4C]" />
          <CardHeader className="pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A36F4C] flex items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
              Total Egresos / Gastos
            </span>
            <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
              {formatCurrency(totalEgresosTotales)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-[#75695D]">
              Maquinaria: {formatCurrency(totalEgresosMaquinaria)} • Insumos: {formatCurrency(totalEgresosInsumos)}
            </span>
          </CardContent>
        </Card>

        {/* Cuentas por Cobrar */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#8C6D1F]" />
          <CardHeader className="pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D1F] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 stroke-[2.5]" />
              Cuentas por Cobrar
            </span>
            <div className="text-2xl font-extrabold text-[#8C6D1F] font-mono mt-1">
              {formatCurrency(totalSaldosPorCobrar)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-[#75695D]">
              Saldos pendientes de clientes
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 1-Row Toolbar & Filters */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
          <Input 
            placeholder="Buscar concepto en caja..."
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

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC]">
          <button
            onClick={() => { setTipoFilter('TODOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tipoFilter === 'TODOS'
                ? 'bg-[#A36F4C] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            Todos ({allMovements.length})
          </button>
          <button
            onClick={() => { setTipoFilter('INGRESOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              tipoFilter === 'INGRESOS'
                ? 'bg-[#1E5E3A] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
            Ingresos (+)
          </button>
          <button
            onClick={() => { setTipoFilter('EGRESOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              tipoFilter === 'EGRESOS'
                ? 'bg-[#944917] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />
            Egresos (-)
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] overflow-hidden shadow-md rounded-2xl">
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="w-full min-w-[650px]">
            <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
            <TableRow className="border-[#E2D9CC] hover:bg-transparent">
              <TableHead className="text-[#241C15] font-bold px-4 py-3 text-left">Fecha</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Tipo</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Concepto & Detalle</TableHead>
              <TableHead className="text-[#241C15] font-bold px-4 py-3 text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-[#75695D]">
                  No se encontraron movimientos registrados en este periodo.
                </TableCell>
              </TableRow>
            ) : (
              paginatedMovements.map((mov) => (
                <TableRow key={mov.id} className="border-[#E2D9CC]/70 hover:bg-[#FDFBF7] transition-colors">
                  <TableCell className="px-4 py-3 text-xs text-[#75695D] font-mono whitespace-nowrap">
                    {formatDate(mov.fecha)}
                  </TableCell>

                  <TableCell className="px-3 py-3 whitespace-nowrap">
                    {mov.tipo === 'INGRESO_VENTA' && (
                      <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[11px] gap-1 font-bold">
                        <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                        Venta Cobrada
                      </Badge>
                    )}
                    {mov.tipo === 'INGRESO_DIRECTO' && (
                      <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-[11px] gap-1 font-bold">
                        <DollarSign className="h-3 w-3 stroke-[2.5]" />
                        Servicio / Directo
                      </Badge>
                    )}
                    {mov.tipo === 'EGRESO_MAQUINARIA' && (
                      <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[11px] gap-1 font-bold">
                        <Wrench className="h-3 w-3" />
                        Maquinaria / Equipo
                      </Badge>
                    )}
                    {mov.tipo === 'EGRESO_INSUMO' && (
                      <Badge variant="outline" className="bg-[#F4EFEA] text-[#A36F4C] border-[#DCD3C6] text-[11px] gap-1 font-bold">
                        <ShoppingBag className="h-3 w-3" />
                        Insumo / Material
                      </Badge>
                    )}
                    {mov.tipo === 'EGRESO_SERVICIO' && (
                      <Badge variant="outline" className="bg-[#F4EFEA] text-[#75695D] border-[#E2D9CC] text-[11px] gap-1 font-medium">
                        <Truck className="h-3 w-3" />
                        Gasto Operativo
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#241C15]">
                        {mov.concepto}
                      </span>
                      {mov.detalle && (
                        <span className="text-[11px] text-[#75695D]">
                          {mov.detalle}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right font-mono font-extrabold whitespace-nowrap">
                    <span className={mov.isPositive ? 'text-[#1E5E3A]' : 'text-[#A34335]'}>
                      {mov.isPositive ? '+' : '-'}{formatCurrency(mov.monto)}
                    </span>
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
              Mostrando página <span className="text-[#241C15] font-bold">{currentPage}</span> de <span className="text-[#241C15] font-bold">{totalPages}</span> ({filteredMovements.length} movimientos)
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
          </div>
        )}
      </Card>
    </div>
  )
}
