'use client'

import React from 'react'

interface ProductionKpiCardProps {
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
      className={`h-24 py-3.5 px-4 rounded-xl border border-border bg-card shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between ${className}`}
    >
      {/* Fila superior: Título en mayúsculas pequeñas con icono sutil a la derecha */}
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        {icon && (
          <div className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">
            {icon}
          </div>
        )}
      </div>

      {/* Fila inferior: Cifra y subtexto */}
      <div>
        <div
          className={`text-2xl font-bold font-mono tabular-nums tracking-tight leading-tight ${
            isDestructive ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {value}
        </div>
        {sublabel && (
          <div className="text-[11px] text-muted-foreground font-normal mt-0.5 truncate">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}
