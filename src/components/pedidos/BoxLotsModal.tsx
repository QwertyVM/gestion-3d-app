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
  const [showOnlyDisponibles, setShowOnlyDisponibles] = React.useState(true)

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !stockCajas) return null

  const conStockCount = stockCajas.lotes.filter((l) => l.stockDisponible > 0).length
  const displayedLotes = showOnlyDisponibles
    ? stockCajas.lotes.filter((l) => l.stockDisponible > 0)
    : stockCajas.lotes

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-card text-foreground border border-border/80 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER DEL MODAL */}
        <div className="bg-card/95 backdrop-blur-xs border-b border-border/60 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-muted/60 border border-border/60 text-primary shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-foreground tracking-tight truncate">
                  Lotes de Cajas Registrados
                </h2>
                <button
                  type="button"
                  onClick={() => setShowOnlyDisponibles(!showOnlyDisponibles)}
                  className="cursor-pointer"
                >
                  <Badge className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                    showOnlyDisponibles
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-muted/60 text-muted-foreground border-border/50'
                  }`}>
                    {showOnlyDisponibles ? `${conStockCount} disponibles (ver todos)` : `${stockCajas.lotes.length} compras (ver solo disp.)`}
                  </Badge>
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Seguimiento de compras de cajas, stock remanente y pedidos donde se asignaron.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* METRICAS PRINCIPALES (BARRA DE RESUMEN) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-6 py-3.5 bg-muted/20 border-b border-border/60 text-xs shrink-0">
          <div className="bg-card border border-border/60 rounded-xl p-3 shadow-none">
            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider block">
              Total Compradas
            </span>
            <span className="text-lg font-semibold font-mono tabular-nums text-foreground block mt-0.5">
              {stockCajas.totalCajasCompradas} <span className="text-xs font-sans text-muted-foreground font-normal">uds</span>
            </span>
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-3 shadow-none">
            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider block">
              Asignadas a Pedidos
            </span>
            <span className="text-lg font-semibold font-mono tabular-nums text-foreground block mt-0.5">
              {stockCajas.totalCajasAsignadas} <span className="text-xs font-sans text-muted-foreground font-normal">uds</span>
            </span>
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-3 shadow-none">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-medium tracking-wider block">
              Stock Disponible
            </span>
            <span className="text-lg font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {stockCajas.totalStockDisponible} <span className="text-xs font-sans font-normal">uds</span>
            </span>
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-3 shadow-none">
            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider block">
              Valorización Stock
            </span>
            <span className="text-lg font-semibold font-mono tabular-nums text-foreground block mt-0.5">
              {formatCurrency(stockCajas.valorTotalStockDisponible)}
            </span>
          </div>
        </div>

        {/* TABLA DE LOTES CON CERO SCROLL HORIZONTAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-none">
            {/* Vista Desktop (>= sm): Tabla table-fixed */}
            <div className="hidden sm:block w-full overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-muted/20 border-b border-border/60">
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground py-2.5 pl-4 select-none">
                      CONCEPTO / FECHA
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground py-2.5 text-center w-24 select-none">
                      COSTO UNIT.
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground py-2.5 text-center w-28 select-none">
                      COMPRADAS
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground py-2.5 text-center w-28 select-none">
                      USADAS
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground py-2.5 text-right pr-4 w-28 select-none">
                      DISPONIBLE
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-border/40">
                  {displayedLotes.map((lote) => {
                    const is50Lot = lote.cantidadComprada === 50
                    const isDispo = lote.stockDisponible > 0

                    return (
                      <React.Fragment key={lote.id}>
                        <TableRow className="hover:bg-muted/30 border-border/40 transition-colors">
                          <TableCell className="py-2.5 pl-4 align-middle">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 border border-border/50 px-1.5 py-0.2 rounded">
                                  {lote.codigo || `LOT-${lote.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`}
                                </span>
                                <span className="font-medium text-foreground text-xs sm:text-sm">
                                  {lote.concepto}
                                </span>
                                {is50Lot && (
                                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 font-medium">
                                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                    Lote 50 uds
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                <span className="font-mono tabular-nums">📅 {lote.fecha.slice(0, 10)}</span>
                                <span>• Por: {lote.persona}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-2.5 text-center align-middle font-mono tabular-nums font-medium text-foreground">
                            {formatCurrency(lote.costoUnitario)}
                          </TableCell>

                          <TableCell className="py-2.5 text-center align-middle font-mono tabular-nums font-semibold text-foreground">
                            {lote.cantidadComprada} uds
                          </TableCell>

                          <TableCell className="py-2.5 text-center align-middle font-mono tabular-nums text-muted-foreground">
                            {lote.cajasAsignadasCount} uds
                          </TableCell>

                          <TableCell className="py-2.5 pr-4 text-right align-middle">
                            <Badge
                              className={`font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded-md border ${
                                isDispo
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-muted/60 text-muted-foreground border-border/50'
                              }`}
                            >
                              {lote.stockDisponible} uds
                            </Badge>
                          </TableCell>
                        </TableRow>

                        {/* Desglose de pedidos asignados si existen */}
                        {lote.asignaciones.length > 0 && (
                          <TableRow className="bg-muted/10 border-border/40">
                            <TableCell colSpan={5} className="py-2 px-4 text-[11px] text-muted-foreground">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-foreground">Pedidos que usaron este lote:</span>
                                {lote.asignaciones.map((asig) => (
                                  <button
                                    key={asig.asignacionId}
                                    type="button"
                                    onClick={() => onSelectOrder && onSelectOrder(asig.pedidoId)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border/50 text-foreground hover:bg-muted transition-colors cursor-pointer"
                                  >
                                    <span className="font-mono tabular-nums font-semibold">{asig.codigoPedido}</span>
                                    <span>({asig.cliente})</span>
                                    <span className="font-semibold text-primary font-mono tabular-nums">×{asig.cantidad}</span>
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

            {/* Vista Móvil (< sm): Tarjetas Fluidas con CERO scroll horizontal */}
            <div className="block sm:hidden divide-y divide-border/40">
              {displayedLotes.map((lote) => {
                const is50Lot = lote.cantidadComprada === 50
                const isDispo = lote.stockDisponible > 0

                return (
                  <div key={lote.id} className="p-3.5 space-y-2.5 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 border border-border/50 px-1.5 py-0.2 rounded">
                            {lote.codigo || `LOT-${lote.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`}
                          </span>
                          <span className="font-medium text-foreground text-xs truncate">
                            {lote.concepto}
                          </span>
                          {is50Lot && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 font-medium">
                              Lote 50 uds
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono tabular-nums">
                          📅 {lote.fecha.slice(0, 10)} • {lote.persona}
                        </div>
                      </div>

                      <Badge
                        className={`font-mono tabular-nums text-xs font-semibold shrink-0 px-2 py-0.5 rounded-md border ${
                          isDispo
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-muted/60 text-muted-foreground border-border/50'
                        }`}
                      >
                        {lote.stockDisponible} disp.
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-border/40">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Costo unit:</span>
                        <span className="font-mono tabular-nums font-medium text-foreground">
                          {formatCurrency(lote.costoUnitario)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Compradas:</span>
                        <span className="font-mono tabular-nums font-semibold text-foreground">
                          {lote.cantidadComprada} uds
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Usadas:</span>
                        <span className="font-mono tabular-nums text-muted-foreground">
                          {lote.cajasAsignadasCount} uds
                        </span>
                      </div>
                    </div>

                    {lote.asignaciones.length > 0 && (
                      <div className="pt-1 border-t border-border/40 text-[11px]">
                        <span className="text-muted-foreground block mb-1">Pedidos:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {lote.asignaciones.map((asig) => (
                            <button
                              key={asig.asignacionId}
                              type="button"
                              onClick={() => onSelectOrder && onSelectOrder(asig.pedidoId)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 text-[10px] text-foreground hover:bg-muted border border-border/50"
                            >
                              <span className="font-mono tabular-nums font-semibold">{asig.codigoPedido}</span>
                              <span className="text-primary font-semibold font-mono tabular-nums">×{asig.cantidad}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-muted/20 border-t border-border/60 px-6 py-3.5 flex items-center justify-end shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 px-3 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer font-medium"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
