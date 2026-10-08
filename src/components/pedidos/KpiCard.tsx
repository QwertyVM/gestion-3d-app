'use client'

import React from 'react'

interface KpiCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon?: React.ReactNode
  className?: string
}

export function KpiCard({ label, value, sublabel, icon, className = '' }: KpiCardProps) {
  return (
    <div
      className={`h-24 py-3.5 px-4 rounded-xl border border-border bg-card shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between ${className}`}
    >
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
      <div>
        <div className="text-xl md:text-2xl font-bold text-foreground font-mono tabular-nums tracking-tight leading-tight">
          {value}
        </div>
        {sublabel && (
          <p className="text-[11px] text-muted-foreground font-normal mt-0.5 truncate">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}

