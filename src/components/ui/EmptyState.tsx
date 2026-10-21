'use client'

import React from 'react'
import { LucideIcon, Boxes } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon = Boxes,
  title,
  description,
  action,
  className,
  compact = false
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!Icon) return null
    if (typeof Icon === 'function') {
      const LucideComp = Icon as LucideIcon
      return <LucideComp className={cn('stroke-[1.5]', compact ? 'h-5 w-5' : 'h-6 w-6')} />
    }
    return Icon
  }

  return (
    <div
      data-slot="empty-state"
      className={cn(
        'w-full flex flex-col items-center justify-center text-center select-none bg-card rounded-2xl border border-border shadow-xs',
        compact ? 'py-8 px-4' : 'py-14 px-6',
        className
      )}
    >
      <div
        className={cn(
          'rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3 border border-border/70',
          compact ? 'w-10 h-10' : 'w-12 h-12'
        )}
      >
        {renderIcon()}
      </div>

      <h3 className={cn('font-semibold text-foreground tracking-tight', compact ? 'text-xs' : 'text-sm')}>
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed',
            compact ? 'text-[11px]' : 'text-xs'
          )}
        >
          {description}
        </p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
