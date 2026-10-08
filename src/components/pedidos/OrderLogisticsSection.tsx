'use client'

import React from 'react'
import { Calendar, ChevronDown, Clock, MapPin, Radio, MessageSquareText } from 'lucide-react'
import { EstadoPedido } from '@prisma/client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface OrderLogisticsSectionProps {
  formFecha: string
  setFormFecha: (v: string) => void
  formCanal: string
  setFormCanal: (v: string) => void
  editEstado: EstadoPedido
  setEditEstado: (v: EstadoPedido) => void
  formDiaEntrega: string
  setFormDiaEntrega: (v: string) => void
  formDestino: string
  setFormDestino: (v: string) => void
  editSeguimientoPostventa: boolean
  setEditSeguimientoPostventa: (v: boolean) => void
  editFechaPostventa: string | null
  setEditFechaPostventa: (v: string | null) => void
  editNotasPostventa: string
  setEditNotasPostventa: (v: string) => void
  formNotas: string
  setFormNotas: (v: string) => void
}

const ESTADOS_DISPLAY: Record<
  EstadoPedido,
  { label: string; badgeStyle: string; dotColor: string }
> = {
  LISTO_ENTREGA: {
    label: 'Por Entregar',
    badgeStyle: 'bg-accent/60 text-accent-foreground border-accent/80',
    dotColor: 'bg-accent-foreground'
  },
  EN_PRODUCCION: {
    label: 'Preparando',
    badgeStyle: 'bg-primary/10 text-primary border-primary/20',
    dotColor: 'bg-primary'
  },
  ENTREGADO: {
    label: 'Entregado',
    badgeStyle: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    dotColor: 'bg-emerald-600'
  },
  PENDIENTE: {
    label: 'Pendiente',
    badgeStyle: 'bg-muted text-muted-foreground border-border',
    dotColor: 'bg-muted-foreground'
  },
  PAGO_VALIDADO: {
    label: 'Pago Validado',
    badgeStyle: 'bg-muted text-muted-foreground border-border',
    dotColor: 'bg-muted-foreground'
  },
  CANCELADO: {
    label: 'Cancelado',
    badgeStyle: 'bg-destructive/10 text-destructive border-destructive/20',
    dotColor: 'bg-destructive'
  }
}

export function OrderLogisticsSection({
  formFecha,
  setFormFecha,
  formCanal,
  setFormCanal,
  editEstado,
  setEditEstado,
  formDiaEntrega,
  setFormDiaEntrega,
  formDestino,
  setFormDestino,
  editSeguimientoPostventa,
  setEditSeguimientoPostventa,
  editFechaPostventa,
  setEditFechaPostventa,
  editNotasPostventa,
  setEditNotasPostventa,
  formNotas,
  setFormNotas
}: OrderLogisticsSectionProps) {
  const currentEstadoConfig = ESTADOS_DISPLAY[editEstado] || ESTADOS_DISPLAY.PENDIENTE

  return (
    <div className="space-y-3">
      {/* FILA 1: 3 Columnas Simétricas (Fecha, Canal, Estado) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Fecha del Pedido */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Fecha del Pedido *
          </Label>
          <Input
            type="date"
            required
            value={formFecha}
            onChange={(e) => setFormFecha(e.target.value)}
            className="h-9 bg-card border-input text-xs sm:text-sm rounded-xl font-mono focus-visible:ring-1 focus-visible:ring-primary transition-all duration-150 shadow-2xs"
          />
        </div>

        {/* 2. Canal de Venta */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-primary" />
            Canal de Venta
          </Label>
          <div className="relative">
            <select
              value={formCanal}
              onChange={(e) => setFormCanal(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-card px-3 pr-8 text-xs sm:text-sm text-foreground font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all duration-150 cursor-pointer shadow-2xs appearance-none"
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="Feria">Feria / Presencial</option>
              <option value="Recomendación">Recomendación</option>
              <option value="Directo">Directo / Taller</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* 3. Estado del Pedido (Pastilla interactiva minimalista según tokens NOVA) */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            Estado del Pedido
          </Label>
          <div className="relative">
            {/* Visual badge representation */}
            <div
              className={cn(
                'w-full h-9 px-3 rounded-xl border inline-flex items-center justify-between gap-2 shadow-2xs transition-all pointer-events-none select-none',
                currentEstadoConfig.badgeStyle
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className={cn('w-2 h-2 rounded-full shrink-0', currentEstadoConfig.dotColor)}
                />
                <span className="text-xs font-semibold truncate">
                  {currentEstadoConfig.label}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
            </div>

            {/* Native select overlay */}
            <select
              value={editEstado}
              onChange={(e) => setEditEstado(e.target.value as EstadoPedido)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
              aria-label="Estado del Pedido"
            >
              {Object.entries(ESTADOS_DISPLAY).map(([key, cfg]) => (
                <option key={key} value={key} className="bg-card text-foreground">
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* FILA 2: 2 Columnas de Logística (Fecha/Hora Pactada, Destino) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Fecha / Hora Pactada de Entrega
          </Label>
          <Input
            placeholder="Ej: Sábado 18:00, Mañana en Shalom..."
            value={formDiaEntrega}
            onChange={(e) => setFormDiaEntrega(e.target.value)}
            className="h-9 bg-card border-input text-xs sm:text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary transition-all duration-150 shadow-2xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            Destino / Dirección / Agencia
          </Label>
          <Input
            placeholder="Ej: Shalom Agencia Miraflores, Lima..."
            value={formDestino}
            onChange={(e) => setFormDestino(e.target.value)}
            className="h-9 bg-card border-input text-xs sm:text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary transition-all duration-150 shadow-2xs"
          />
        </div>
      </div>

      {/* SECCIÓN POSTVENTA Y NOTAS: Checkbox simple directamente alineado sobre el textarea */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground" />
            Notas del Pedido
          </Label>

          {/* Checkbox simple directamente alineado */}
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-foreground select-none">
            <input
              type="checkbox"
              checked={editSeguimientoPostventa}
              onChange={(e) => {
                const checked = e.target.checked
                setEditSeguimientoPostventa(checked)
                if (checked && !editFechaPostventa) {
                  setEditFechaPostventa(new Date().toISOString())
                } else if (!checked) {
                  setEditFechaPostventa(null)
                }
              }}
              className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary cursor-pointer accent-[#A36F4C]"
            />
            <span>¿Seguimiento postventa realizado?</span>
          </label>
        </div>

        {editSeguimientoPostventa && (
          <div className="animate-in fade-in-50 slide-in-from-top-1 duration-200">
            <Input
              placeholder="Notas de postventa (opcional)..."
              value={editNotasPostventa}
              onChange={(e) => setEditNotasPostventa(e.target.value)}
              className="h-8 text-xs bg-background border-input rounded-xl focus-visible:ring-1 focus-visible:ring-primary transition-all mb-1.5"
            />
          </div>
        )}

        <textarea
          rows={2}
          placeholder="Notas internas, indicaciones de acabado, requerimientos especiales..."
          value={formNotas}
          onChange={(e) => setFormNotas(e.target.value)}
          className="w-full min-h-[56px] h-14 bg-background border border-input text-xs text-foreground rounded-xl p-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none placeholder:text-muted-foreground shadow-2xs transition-all duration-150"
        />
      </div>
    </div>
  )
}
