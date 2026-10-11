'use client'

import React from 'react'
import { EstadoPedido } from '@prisma/client'
import { ChevronDown, Check, Loader2 } from 'lucide-react'
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
      'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20',
    dotClass: 'bg-blue-600'
  },
  LISTO_ENTREGA: {
    label: 'Por Entregar',
    badgeClass:
      'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/20',
    dotClass: 'bg-amber-500'
  },
  ENTREGADO: {
    label: 'Entregado',
    badgeClass:
      'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/20',
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
      'bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/20',
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
  onChange?: (nuevoEstado: EstadoPedido) => void | Promise<any>
  disabled?: boolean
  className?: string
  loading?: boolean
}

export function OrderStatusBadge({
  value,
  onChange,
  disabled = false,
  className = '',
  loading = false
}: OrderStatusBadgeProps) {
  const [optimisticValue, setOptimisticValue] = React.useState<EstadoPedido>(value)
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false)

  // Sincronizar estado cuando cambie la prop externa
  React.useEffect(() => {
    setOptimisticValue(value)
  }, [value])

  const currentConfig = ESTADO_PEDIDO_CONFIG[optimisticValue] || ESTADO_PEDIDO_CONFIG.PENDIENTE
  const isInteractive = Boolean(onChange && !disabled)
  const showSpinner = isUpdating || loading

  const handleSelect = async (nuevo: EstadoPedido) => {
    if (nuevo === optimisticValue || isUpdating || disabled) return
    const prev = optimisticValue
    setOptimisticValue(nuevo)
    setIsUpdating(true)
    try {
      if (onChange) {
        await Promise.resolve(onChange(nuevo))
      }
    } catch {
      setOptimisticValue(prev)
    } finally {
      setIsUpdating(false)
    }
  }

  // Si no es interactivo, renderizar solo la pastilla estática
  if (!isInteractive) {
    return (
      <div
        className={cn(
          'rounded-lg px-2.5 py-1 text-xs font-semibold border inline-flex items-center gap-1.5 select-none shadow-2xs',
          currentConfig.badgeClass,
          className
        )}
      >
        {showSpinner ? (
          <Loader2 className="w-3 h-3 animate-spin shrink-0 text-current" />
        ) : (
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', currentConfig.dotClass)} />
        )}
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
          disabled={disabled || showSpinner}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'rounded-lg px-2.5 py-1 text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-all select-none shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            currentConfig.badgeClass,
            showSpinner && 'opacity-85 pointer-events-none'
          )}
        >
          {showSpinner ? (
            <Loader2 className="w-3 h-3 animate-spin shrink-0 text-current opacity-80" />
          ) : (
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', currentConfig.dotClass)} />
          )}
          <span className="truncate">{currentConfig.label}</span>
          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
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
