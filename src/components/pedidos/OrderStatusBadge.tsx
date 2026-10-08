'use client'

import React from 'react'
import { EstadoPedido } from '@prisma/client'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export interface EstadoConfig {
  label: string
  badgeClass: string
  dotClass: string
}

export const ESTADO_PEDIDO_CONFIG: Record<EstadoPedido, EstadoConfig> = {
  EN_PRODUCCION: {
    label: 'Preparando',
    badgeClass:
      'bg-blue-50/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/40',
    dotClass: 'bg-blue-600'
  },
  LISTO_ENTREGA: {
    label: 'Por Entregar',
    badgeClass:
      'bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-amber-200/80 dark:border-amber-800/40',
    dotClass: 'bg-amber-500'
  },
  ENTREGADO: {
    label: 'Entregado',
    badgeClass:
      'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-800/40',
    dotClass: 'bg-emerald-600'
  },
  CANCELADO: {
    label: 'Cancelado',
    badgeClass:
      'bg-destructive/10 text-destructive border-destructive/20',
    dotClass: 'bg-destructive'
  },
  PENDIENTE: {
    label: 'Pendiente',
    badgeClass:
      'bg-muted/80 text-muted-foreground border-border',
    dotClass: 'bg-muted-foreground/70'
  },
  PAGO_VALIDADO: {
    label: 'Pago Validado',
    badgeClass:
      'bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/40',
    dotClass: 'bg-indigo-500'
  }
}

// Estados operativos ordenados para el dropdown
export const ESTADOS_ORDENADOS: EstadoPedido[] = [
  'EN_PRODUCCION',
  'LISTO_ENTREGA',
  'ENTREGADO',
  'CANCELADO',
  'PAGO_VALIDADO',
  'PENDIENTE'
]

export interface OrderStatusBadgeProps {
  value: EstadoPedido
  onChange?: (nuevoEstado: EstadoPedido) => void
  disabled?: boolean
  className?: string
}

export function OrderStatusBadge({
  value,
  onChange,
  disabled = false,
  className = ''
}: OrderStatusBadgeProps) {
  const [optimisticValue, setOptimisticValue] = React.useState<EstadoPedido>(value)

  // Sincronizar estado cuando cambie la prop externa
  React.useEffect(() => {
    setOptimisticValue(value)
  }, [value])

  const currentConfig = ESTADO_PEDIDO_CONFIG[optimisticValue] || ESTADO_PEDIDO_CONFIG.PENDIENTE
  const isInteractive = Boolean(onChange && !disabled)

  const handleSelect = (nuevo: EstadoPedido) => {
    if (nuevo === optimisticValue) return
    setOptimisticValue(nuevo)
    onChange?.(nuevo)
  }

  // Si no es interactivo, renderizar solo la pastilla estática
  if (!isInteractive) {
    return (
      <div
        className={cn(
          'rounded-lg px-2.5 py-1 text-xs font-medium border inline-flex items-center gap-1.5 select-none shadow-2xs',
          currentConfig.badgeClass,
          className
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', currentConfig.dotClass)} />
        <span className="truncate">{currentConfig.label}</span>
      </div>
    )
  }

  return (
    <div
      className={cn('relative inline-flex items-center', className)}
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'rounded-lg px-2.5 py-1 text-xs font-medium border inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-all select-none shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            currentConfig.badgeClass
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', currentConfig.dotClass)} />
          <span className="truncate">{currentConfig.label}</span>
          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          side="bottom"
          sideOffset={4}
          className="min-w-[155px] p-1 bg-popover text-popover-foreground border border-border shadow-md rounded-lg z-50"
        >
          {ESTADOS_ORDENADOS.map((estado) => {
            const config = ESTADO_PEDIDO_CONFIG[estado]
            const isSelected = estado === optimisticValue

            return (
              <DropdownMenuItem
                key={estado}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(estado)
                }}
                className={cn(
                  'flex items-center justify-between px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-md transition-colors',
                  isSelected
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-foreground hover:bg-muted/60'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotClass)} />
                  <span className="truncate">{config.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary ml-2 shrink-0" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
