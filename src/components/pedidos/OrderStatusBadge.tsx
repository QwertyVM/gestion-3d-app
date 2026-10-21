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
    label: 'Imprimiendo',
    badgeClass:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    dotClass: 'bg-blue-500'
  },
  EN_TALLER: {
    label: 'En taller',
    badgeClass:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-500'
  },
  EMPAQUETANDO: {
    label: 'Empaquetando',
    badgeClass:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-500'
  },
  ENTREGADO: {
    label: 'Entregado',
    badgeClass:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    dotClass: 'bg-emerald-500'
  },
  LISTO_ENTREGA: {
    label: 'Por Entregar',
    badgeClass:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    dotClass: 'bg-blue-500'
  },
  CANCELADO: {
    label: 'Cancelado',
    badgeClass:
      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    dotClass: 'bg-rose-500'
  },
  PENDIENTE: {
    label: 'Pendiente',
    badgeClass:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-500'
  },
  PAGO_VALIDADO: {
    label: 'Pago Validado',
    badgeClass:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    dotClass: 'bg-emerald-500'
  }
}

// Estados operativos ordenados para el dropdown
export const ESTADOS_ORDENADOS: EstadoPedido[] = [
  'PENDIENTE',
  'PAGO_VALIDADO',
  'EN_PRODUCCION',
  'EN_TALLER',
  'EMPAQUETANDO',
  'LISTO_ENTREGA',
  'ENTREGADO',
  'CANCELADO'
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
          'rounded-md px-2 py-0.5 text-[11px] font-medium border inline-flex items-center gap-1.5 select-none',
          currentConfig.badgeClass,
          className
        )}
      >
        {showSpinner ? (
          <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0 text-current" />
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
            'rounded-md px-2 py-0.5 text-[11px] font-medium border inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-all select-none outline-none focus-visible:ring-1 focus-visible:ring-ring',
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
