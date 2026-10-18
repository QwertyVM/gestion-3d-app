'use client'

import React from 'react'
import {
  Package,
  Layers,
  X,
  Calendar,
  User,
  ShoppingBag,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { StockCajasResumen, LoteCajaItem } from '@/actions/cajas'
import { formatCurrency } from './orderUtils'

interface BoxLotsModalProps {
  isOpen: boolean
  onClose: () => void
  stockCajas: StockCajasResumen | null
  onSelectOrder?: (pedidoId: string) => void
}

export function BoxLotsModal({
  isOpen,
  onClose,
  stockCajas,
  onSelectOrder
}: BoxLotsModalProps) {
  if (!isOpen || !stockCajas) return null

  return (
    <div
      className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-background border border-border rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER DEL MODAL */}
        <div className="bg-card border-b border-border p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  Lotes de Cajas Registrados
                </h2>
                <Badge className="bg-secondary text-foreground text-xs font-semibold px-2 py-0.5 rounded-md border border-border">
                  {stockCajas.lotes.length} compras en egresos
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Seguimiento de compras de cajas, stock remanente y pedidos donde se asignaron.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* METRICAS PRINCIPALES (BARRA DE RESUMEN) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-muted/20 border-b border-border text-xs shrink-0">
          <div className="bg-card border border-border rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Total Compradas
            </span>
            <span className="text-lg font-black font-mono text-foreground block mt-0.5">
              {stockCajas.totalCajasCompradas} uds
            </span>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Asignadas a Pedidos
            </span>
            <span className="text-lg font-black font-mono text-foreground block mt-0.5">
              {stockCajas.totalCajasAsignadas} uds
            </span>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold tracking-wider block">
              Stock Disponible
            </span>
            <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {stockCajas.totalStockDisponible} uds
            </span>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Valorización Stock
            </span>
            <span className="text-lg font-black font-mono text-foreground block mt-0.5">
              {formatCurrency(stockCajas.valorTotalStockDisponible)}
            </span>
          </div>
        </div>

        {/* TABLA DE LOTES CON CERO SCROLL HORIZONTAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="border border-border rounded-2xl overflow-hidden shadow-2xs bg-card">
            <Table className="w-full">
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border">
                  <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground py-3 pl-4">
                    CONCEPTO / FECHA
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground py-3 text-center w-24">
                    COSTO UNIT.
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground py-3 text-center w-28">
                    COMPRADAS
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground py-3 text-center w-28">
                    USADAS
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground py-3 text-right pr-4 w-28">
                    DISPONIBLE
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs divide-y divide-border">
                {stockCajas.lotes.map((lote) => {
                  const is50Lot = lote.cantidadComprada === 50
                  const isDispo = lote.stockDisponible > 0

                  return (
                    <React.Fragment key={lote.id}>
                      <TableRow className="hover:bg-muted/30 border-border">
                        <TableCell className="py-3 pl-4 align-middle">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 border border-primary/25 px-1.5 py-0.2 rounded-md">
                                {lote.codigo || `LOT-${lote.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`}
                              </span>
                              <span className="font-bold text-foreground text-xs sm:text-sm">
                                {lote.concepto}
                              </span>
                              {is50Lot && (
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 font-semibold">
                                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                  Lote 50 uds
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                              <span>📅 {lote.fecha.slice(0, 10)}</span>
                              <span>• Por: {lote.persona}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 text-center align-middle font-mono font-semibold text-foreground">
                          {formatCurrency(lote.costoUnitario)}
                        </TableCell>

                        <TableCell className="py-3 text-center align-middle font-mono font-bold text-foreground">
                          {lote.cantidadComprada} uds
                        </TableCell>

                        <TableCell className="py-3 text-center align-middle font-mono text-muted-foreground">
                          {lote.cajasAsignadasCount} uds
                        </TableCell>

                        <TableCell className="py-3 pr-4 text-right align-middle">
                          <Badge
                            className={`font-mono text-xs font-bold ${
                              isDispo
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {lote.stockDisponible} uds
                          </Badge>
                        </TableCell>
                      </TableRow>

                      {/* Desglose de pedidos asignados si existen */}
                      {lote.asignaciones.length > 0 && (
                        <TableRow className="bg-muted/10 border-border">
                          <TableCell colSpan={5} className="py-2.5 px-4 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-foreground">Pedidos que usaron este lote:</span>
                              {lote.asignaciones.map((asig) => (
                                <button
                                  key={asig.asignacionId}
                                  type="button"
                                  onClick={() => onSelectOrder && onSelectOrder(asig.pedidoId)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/80 border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
                                >
                                  <span className="font-mono font-bold">{asig.codigoPedido}</span>
                                  <span>({asig.cliente})</span>
                                  <span className="font-bold text-primary">×{asig.cantidad}</span>
                                </button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-card border-t border-border p-3 sm:p-4 flex items-center justify-end shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-9 px-4 rounded-xl border-border cursor-pointer font-medium"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
