'use client'

import React from 'react'
import { ChevronDown, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export type StatusCategory = 'success' | 'warning' | 'info' | 'destructive' | 'neutral'

export interface StatusItemConfig {
  label: string
  category: StatusCategory
  customDotColor?: string
  customBgColor?: string
}

const categoryStyles: Record<StatusCategory, { badgeClass: string; dotClass: string }> = {
  success: {
    badgeClass: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20',
    dotClass: 'bg-emerald-600 dark:bg-emerald-500'
  },
  warning: {
    badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20',
    dotClass: 'bg-amber-600 dark:bg-amber-500'
  },
  info: {
    badgeClass: 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/20',
    dotClass: 'bg-sky-600 dark:bg-sky-500'
  },
  destructive: {
    badgeClass: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20',
    dotClass: 'bg-rose-600 dark:bg-rose-500'
  },
  neutral: {
    badgeClass: 'bg-secondary text-foreground/80 border-border/80',
    dotClass: 'bg-slate-400 dark:bg-slate-500'
  }
}

export interface StatusBadgeProps<T extends string = string> {
  value: T
  options?: Record<T, StatusItemConfig>
  orderedKeys?: T[]
  onChange?: (newValue: T) => void | Promise<any>
  disabled?: boolean
  className?: string
  loading?: boolean
  size?: 'sm' | 'md'
}

export function StatusBadge<T extends string = string>({
  value,
  options,
  orderedKeys,
  onChange,
  disabled = false,
  className = '',
  loading = false,
  size = 'sm'
}: StatusBadgeProps<T>) {
  const [optimisticValue, setOptimisticValue] = React.useState<T>(value)
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false)

  React.useEffect(() => {
    setOptimisticValue(value)
  }, [value])

  const currentOption: StatusItemConfig = options?.[optimisticValue] || {
    label: optimisticValue,
    category: 'neutral'
  }

  const styles = categoryStyles[currentOption.category] || categoryStyles.neutral
  const isInteractive = Boolean(onChange && !disabled && options && orderedKeys && orderedKeys.length > 0)
  const showSpinner = isUpdating || loading

  const handleSelect = async (newValue: T) => {
    if (newValue === optimisticValue || isUpdating || disabled) return
    const prev = optimisticValue
    setOptimisticValue(newValue)
    setIsUpdating(true)
    try {
      if (onChange) {
        await Promise.resolve(onChange(newValue))
      }
    } catch {
      setOptimisticValue(prev)
    } finally {
      setIsUpdating(false)
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'

  if (!isInteractive) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md font-semibold border select-none tracking-tight shadow-2xs',
          sizeClasses,
          currentOption.customBgColor || styles.badgeClass,
          className
        )}
      >
        {showSpinner ? (
          <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0 text-current" />
        ) : (
          <span
            className={cn('w-1.5 h-1.5 rounded-full shrink-0', currentOption.customDotColor || styles.dotClass)}
          />
        )}
        <span className="truncate">{currentOption.label}</span>
      </span>
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
            'inline-flex items-center gap-1.5 rounded-md font-semibold border cursor-pointer select-none tracking-tight shadow-2xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            sizeClasses,
            currentOption.customBgColor || styles.badgeClass,
            showSpinner && 'opacity-80 pointer-events-none'
          )}
        >
          {showSpinner ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0 text-current" />
          ) : (
            <span
              className={cn('w-1.5 h-1.5 rounded-full shrink-0', currentOption.customDotColor || styles.dotClass)}
            />
          )}
          <span className="truncate">{currentOption.label}</span>
          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={4}
          className="min-w-[150px] p-1 bg-popover text-popover-foreground border border-border shadow-md rounded-lg z-50"
        >
          {orderedKeys?.map((key) => {
            const opt = options?.[key] || { label: key, category: 'neutral' }
            const optStyle = categoryStyles[opt.category] || categoryStyles.neutral
            const isSelected = key === optimisticValue

            return (
              <DropdownMenuItem
                key={key}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(key)
                }}
                className={cn(
                  'flex items-center justify-between px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-md transition-colors',
                  isSelected
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-foreground hover:bg-muted/70'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn('w-1.5 h-1.5 rounded-full shrink-0', opt.customDotColor || optStyle.dotClass)}
                  />
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-foreground ml-2 shrink-0" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
