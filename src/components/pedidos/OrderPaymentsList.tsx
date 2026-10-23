'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  Pencil,
  Trash2,
  Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { formatCurrency } from './orderUtils'
import { PagoPedidoView } from './types'

interface OrderPaymentsListProps {
  pedidoId: string
  pagos: PagoPedidoView[]
  saldoPendiente: number
  onOpenEditPago: (pago: PagoPedidoView) => void
  onDeletePago: (pagoId: string, pedidoId: string) => Promise<void>
  onRegistrarAbono: (data: {
    monto: number
    metodoPago: string
    tipo: string
    notas?: string
    fecha?: string
  }) => Promise<boolean>
}

export function OrderPaymentsList({
  pedidoId,
  pagos,
  saldoPendiente,
  onOpenEditPago,
  onDeletePago,
  onRegistrarAbono
}: OrderPaymentsListProps) {
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState('YAPE')
  const [tipo, setTipo] = useState('SALDO_ENTREGA')
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericMonto = parseFloat(monto)
    if (isNaN(numericMonto) || numericMonto <= 0) {
      alert('Ingresa un monto válido mayor a 0.')
      return
    }

    setIsSubmitting(true)
    try {
      const ok = await onRegistrarAbono({
        monto: numericMonto,
        metodoPago: metodo,
        tipo,
        notas: notas.trim() || undefined,
        fecha: fecha || undefined
      })
      if (ok) {
        setMonto('')
        setNotas('')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (pagoId: string) => {
    setIsDeletingId(pagoId)
    try {
      await onDeletePago(pagoId, pedidoId)
    } finally {
      setIsDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Encabezado de Abonos y Saldo Restante */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Historial de Abonos ({pagos.length})</span>
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          Saldo:{' '}
          <strong className={saldoPendiente > 0 ? 'text-foreground font-bold font-mono' : 'text-muted-foreground font-mono'}>
            {formatCurrency(saldoPendiente)}
          </strong>
        </span>
      </div>

      {/* Lista de Abonos */}
      {pagos.length > 0 ? (
        <div className="space-y-1.5">
          {pagos.map((pg, idx) => (
            <div
              key={pg.id}
              className="p-2.5 rounded-lg border border-border/50 bg-muted/20 flex items-center justify-between text-xs gap-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">Abono #{idx + 1}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                    {pg.metodoPago} • {pg.tipo}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground block mt-0.5 truncate font-mono">
                  {formatDate(pg.fecha)} {pg.notas ? `• ${pg.notas}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-medium text-xs text-foreground tabular-nums">
                  +{formatCurrency(pg.monto)}
                </span>
                <button
                  type="button"
                  title="Editar abono"
                  onClick={() => onOpenEditPago(pg)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Eliminar abono"
                  disabled={isDeletingId === pg.id}
                  onClick={() => handleDelete(pg.id)}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeletingId === pg.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 rounded-lg border border-border/50 bg-muted/10 text-center">
          <p className="text-xs text-muted-foreground">No se han registrado abonos para este pedido.</p>
        </div>
      )}

      {/* Formulario para Registrar Nuevo Abono (si tiene saldo pendiente) */}
      {saldoPendiente > 0 && (
        <form onSubmit={handleSubmit} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-2.5">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
            + Registrar Abono
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Fecha *</Label>
              <Input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-8 bg-background border-border/70 text-xs font-mono rounded-md"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Monto (S/) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder={saldoPendiente.toFixed(2)}
                value={monto}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setMonto(e.target.value)}
                className="h-8 bg-background border-border/70 text-xs font-mono rounded-md tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Medio</Label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="w-full h-8 rounded-md border border-border/70 bg-background px-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
              >
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="BCP">BCP</option>
                <option value="BBVA">BBVA</option>
                <option value="EFECTIVO">Efectivo</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Tipo</Label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full h-8 rounded-md border border-border/70 bg-background px-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
              >
                <option value="SALDO_ENTREGA">Saldo Final</option>
                <option value="ABONO">Abono Parcial</option>
                <option value="ANTICIPO">Anticipo</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-0.5">
            <Input
              placeholder="Nota u operación (opcional)..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="h-8 bg-background border-border/70 text-xs flex-1 rounded-md"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg cursor-pointer shrink-0 w-full sm:w-auto shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  <span>Guardando...</span>
                </>
              ) : (
                'Registrar Abono'
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
