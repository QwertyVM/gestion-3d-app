'use client'

import React from 'react'
import { KpiInfoTrigger } from '@/components/ui/KpiInfoTrigger'
import { cn } from '@/lib/utils'

export type StatCardVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info'

export interface StatCardProps {
  label: string
  value: React.ReactNode
  sublabel?: React.ReactNode
  icon?: React.ReactNode
  variant?: StatCardVariant
  className?: string
  onInfoClick?: () => void
  infoTitle?: string
  onClick?: () => void
  active?: boolean
  delta?: {
    value: string
    isPositive?: boolean
    label?: string
  }
  badge?: {
    text: string
    variant?: 'success' | 'warning' | 'destructive' | 'info' | 'neutral'
  }
}

const variantStyles: Record<StatCardVariant, { valueClass: string; iconBgClass: string }> = {
  default: {
    valueClass: 'text-foreground',
    iconBgClass: 'text-muted-foreground/80'
  },
  success: {
    valueClass: 'text-emerald-600 dark:text-emerald-400',
    iconBgClass: 'text-emerald-600 dark:text-emerald-400'
  },
  warning: {
    valueClass: 'text-amber-600 dark:text-amber-400',
    iconBgClass: 'text-amber-600 dark:text-amber-400'
  },
  destructive: {
    valueClass: 'text-rose-600 dark:text-rose-400',
    iconBgClass: 'text-rose-600 dark:text-rose-400'
  },
  info: {
    valueClass: 'text-blue-600 dark:text-blue-400',
    iconBgClass: 'text-blue-600 dark:text-blue-400'
  }
}

const badgeVariantsMap: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  destructive: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  neutral: 'bg-muted/60 text-muted-foreground border-border/50'
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  variant = 'default',
  className,
  onInfoClick,
  infoTitle,
  onClick,
  active = false,
  delta,
  badge
}: StatCardProps) {
  const isInteractive = Boolean(onClick)
  const styles = variantStyles[variant] || variantStyles.default

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      data-slot="stat-card"
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'min-h-[96px] p-4 rounded-xl border border-border/60 bg-card shadow-none transition-all flex flex-col justify-between select-none relative',
        isInteractive && 'cursor-pointer hover:border-border transition-colors active:scale-[0.99]',
        active && 'border-primary ring-1 ring-primary/30',
        className
      )}
    >
      {/* Header: Label + Info trigger + Badge / Icon */}
      <div className="flex items-center justify-between text-muted-foreground gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase truncate select-none">
            {label}
          </span>
          {onInfoClick && (
            <KpiInfoTrigger
              onClick={onInfoClick}
              title={infoTitle || `Ver detalles y fórmula de ${label}`}
            />
          )}
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span
              className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-md border font-mono',
                badgeVariantsMap[badge.variant || 'neutral']
              )}
            >
              {badge.text}
            </span>
          )}
          {icon && (
            <div className={cn('w-4 h-4 shrink-0 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5', styles.iconBgClass)}>
              {React.isValidElement(icon)
                ? icon
                : typeof icon === 'function' || (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))
                  ? React.createElement(icon as any, { className: 'w-3.5 h-3.5' })
                  : (icon as any)}
            </div>
          )}
        </div>
      </div>

      {/* Metric value and sublabel / delta */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <div
            className={cn(
              'text-2xl font-semibold font-mono tabular-nums tracking-tight leading-tight',
              styles.valueClass
            )}
          >
            {value}
          </div>

          {delta && (
            <div
              className={cn(
                'text-[11px] font-medium font-mono flex items-center gap-0.5',
                delta.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}
            >
              <span>{delta.isPositive ? '↑' : '↓'}</span>
              <span>{delta.value}</span>
              {delta.label && <span className="text-muted-foreground font-normal text-[10px] ml-0.5">({delta.label})</span>}
            </div>
          )}
        </div>

        {sublabel && (
          <div className="text-[11px] text-muted-foreground font-normal mt-1.5 leading-snug line-clamp-2">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}
