'use client'

import React from 'react'

export interface ProductionKpiCardProps {
  label: string
  value: React.ReactNode
  sublabel?: React.ReactNode
  icon?: React.ReactNode
  isDestructive?: boolean
  className?: string
}

export function ProductionKpiCard({
  label,
  value,
  sublabel,
  icon,
  isDestructive = false,
  className = ''
}: ProductionKpiCardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col justify-between h-[104px] hover:border-primary/40 transition-all ${className}`}
    >
      {/* Encabezado: Título en mayúsculas pequeñas e ícono temático a la derecha */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </span>
        {icon && (
          <div className="w-4 h-4 text-primary/70 shrink-0 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
            {icon}
          </div>
        )}
      </div>

      {/* Valor principal y subtítulo operativo */}
      <div className="min-w-0">
        <div
          className={`text-2xl font-extrabold tracking-tight leading-none ${
            isDestructive ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {value}
        </div>
        {sublabel && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 min-w-0">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}
