'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Package,
  Search,
  ExternalLink,
  Calendar,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Boxes
} from 'lucide-react'
import { LoteCajaItem } from '@/actions/cajas'

interface PackagingOrdersTableProps {
  lotes: LoteCajaItem[]
  selectedLotFilter?: string | null
  onClearLotFilter?: () => void
}

interface FlattenedAssignment {
  asignacionId: string
  pedidoId: string
  codigoPedido: string
  cliente: string
  nombreCaja: string
  loteId: string
  cantidad: number
  costoUnitario: number
  costoTotal: number
  fechaPedido: string
  estadoPedido: string
}

export function PackagingOrdersTable({
  lotes,
  selectedLotFilter,
  onClearLotFilter
}: PackagingOrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Aplanar todas las asignaciones de todos los lotes
  const allAssignments: FlattenedAssignment[] = useMemo(() => {
    const list: FlattenedAssignment[] = []
    for (const l of lotes) {
      for (const a of l.asignaciones) {
        list.push({
          asignacionId: a.asignacionId,
          pedidoId: a.pedidoId,
          codigoPedido: a.codigoPedido,
          cliente: a.cliente,
          nombreCaja: l.concepto,
          loteId: l.id,
          cantidad: a.cantidad,
          costoUnitario: l.costoUnitario,
          costoTotal: a.costoTotal,
          fechaPedido: a.fechaPedido,
          estadoPedido: a.estadoPedido || 'ENTREGADO'
        })
      }
    }
    // Ordenar por fecha descendente
    return list.sort((a, b) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime())
  }, [lotes])

  // Filtrado
  const filteredAssignments = useMemo(() => {
    return allAssignments.filter(item => {
      if (selectedLotFilter && item.loteId !== selectedLotFilter) return false
      const q = searchTerm.toLowerCase().trim()
      if (q) {
        const lotCode = `LOT-${item.loteId.replace(/-/g, '').slice(0, 6).toUpperCase()}`.toLowerCase()
        const match = item.codigoPedido.toLowerCase().includes(q) ||
          item.cliente.toLowerCase().includes(q) ||
          item.nombreCaja.toLowerCase().includes(q) ||
          lotCode.includes(q) ||
          item.loteId.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [allAssignments, selectedLotFilter, searchTerm])

  const formatDate = (isoString: string) => {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const selectedLot = useMemo(() => {
    if (!selectedLotFilter) return null
    return lotes.find(l => l.id === selectedLotFilter) || null
  }, [selectedLotFilter, lotes])

  const selectedLotName = useMemo(() => {
    if (!selectedLot) return null
    const code = selectedLot.codigo || `LOT-${selectedLot.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
    return `[${code}] ${selectedLot.concepto}`
  }, [selectedLot])

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
      {/* HEADER DE LA TABLA Y BUSCADOR */}
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-foreground">
              Trazabilidad de Cajas Asignadas a Pedidos
            </h3>
            <span className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-lg border border-border">
              {filteredAssignments.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historial de packaging consumido e imputado al costo de cada pedido.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedLotFilter && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-semibold">
              <span>{selectedLotName}</span>
              <button
                type="button"
                onClick={onClearLotFilter}
                className="hover:opacity-75 cursor-pointer ml-1"
                title="Quitar filtro de lote"
              >
                ✕
              </button>
            </div>
          )}

          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar pedido, cliente..."
              className="pl-8.5 h-8 text-xs bg-background border-border rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* TABLA SIN SCROLL HORIZONTAL (table-fixed) */}
      {filteredAssignments.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Package className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            {allAssignments.length === 0
              ? 'Aún no se han asignado cajas a ningún pedido'
              : 'No hay pedidos que coincidan con la búsqueda'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {allAssignments.length === 0
              ? 'Puedes asignar cajas desde la pantalla de Pedidos con el botón "+ 📦 Caja" en 1 clic.'
              : 'Intenta limpiar el buscador o el filtro de lote.'}
          </p>
          {allAssignments.length === 0 && (
            <Link href="/pedidos" className="inline-block mt-4">
              <Button size="sm" className="rounded-xl h-8 text-xs">
                Ir a Pedidos
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-secondary/40 border-y border-border/70 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[18%] pl-5 pr-2 py-3 text-left">PEDIDO</TableHead>
                <TableHead className="w-[24%] px-2 py-3 text-left">CLIENTE</TableHead>
                <TableHead className="w-[24%] px-2 py-3 text-left">TIPO DE CAJA</TableHead>
                <TableHead className="w-[12%] px-2 py-3 text-center">CANTIDAD</TableHead>
                <TableHead className="w-[12%] px-2 py-3 text-right">COSTO TOTAL</TableHead>
                <TableHead className="w-[10%] pr-5 pl-2 py-3 text-right">ACCIÓN</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredAssignments.map((row) => (
                <TableRow key={row.asignacionId} className="hover:bg-muted/30 transition-colors border-b border-border/60">
                  {/* PEDIDO */}
                  <TableCell className="pl-5 pr-2 py-3">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-xs text-foreground">
                        {row.codigoPedido}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {formatDate(row.fechaPedido)}
                      </span>
                    </div>
                  </TableCell>

                  {/* CLIENTE */}
                  <TableCell className="px-2 py-3">
                    <span className="text-xs font-semibold text-foreground truncate block">
                      {row.cliente}
                    </span>
                  </TableCell>

                  {/* TIPO DE CAJA */}
                  <TableCell className="px-2 py-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="p-1 rounded-md bg-primary/10 text-primary shrink-0">
                        <Package className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-foreground font-medium truncate block">
                          {row.nombreCaja}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-primary/80 block">
                          LOT-{row.loteId.replace(/-/g, '').slice(0, 6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* CANTIDAD */}
                  <TableCell className="px-2 py-3 text-center">
                    <Badge variant="outline" className="text-xs font-mono font-bold px-2 py-0.5">
                      {row.cantidad} ud{row.cantidad > 1 ? 's' : ''}
                    </Badge>
                  </TableCell>

                  {/* COSTO TOTAL */}
                  <TableCell className="px-2 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-xs text-foreground">
                        S/ {row.costoTotal.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        (S/ {row.costoUnitario.toFixed(2)} c/u)
                      </span>
                    </div>
                  </TableCell>

                  {/* ACCIÓN: LINK AL PEDIDO */}
                  <TableCell className="pr-5 pl-2 py-3 text-right">
                    <Link href={`/pedidos`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Ver en Pedidos"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
