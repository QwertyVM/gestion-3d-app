'use client'

import { Folder, PackageCheck, AlertTriangle } from 'lucide-react'

export type CategoryFilterTab = 'todas' | 'con_modelos' | 'vacias'

interface CategoryStatsCardsProps {
  totalCategorias: number
  totalModelos: number
  conModelosCount: number
  vaciasCount: number
  activeTab: CategoryFilterTab
  onSelectTab: (tab: CategoryFilterTab) => void
}

export function CategoryStatsCards({
  totalCategorias,
  totalModelos,
  conModelosCount,
  vaciasCount,
  activeTab,
  onSelectTab
}: CategoryStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {/* 1. Categorías Registradas */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectTab('todas')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelectTab('todas')
          }
        }}
        className={`p-4 sm:p-5 rounded-xl border bg-card shadow-none transition-all duration-150 cursor-pointer flex flex-col justify-between select-none ${
          activeTab === 'todas'
            ? 'border-primary ring-1 ring-primary/30'
            : 'border-border/60 hover:border-border hover:bg-muted/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Familias Registradas
          </span>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Folder className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-semibold tracking-tight text-foreground font-mono tabular-nums flex items-baseline gap-1.5">
            <span>{totalCategorias}</span>
            <span className="text-xs font-normal font-sans text-muted-foreground">familias</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono tabular-nums">
            {totalModelos} {totalModelos === 1 ? 'modelo 3D distribuido' : 'modelos 3D distribuidos'}
          </p>
        </div>
      </div>

      {/* 2. Con Productos Asignados */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectTab('con_modelos')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelectTab('con_modelos')
          }
        }}
        className={`p-4 sm:p-5 rounded-xl border bg-card shadow-none transition-all duration-150 cursor-pointer flex flex-col justify-between select-none ${
          activeTab === 'con_modelos'
            ? 'border-primary ring-1 ring-primary/30'
            : 'border-border/60 hover:border-border hover:bg-muted/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Con Modelos Asignados
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-semibold tracking-tight text-foreground font-mono tabular-nums flex items-baseline gap-1.5">
            <span>{conModelosCount}</span>
            <span className="text-xs font-normal font-sans text-muted-foreground">categorías</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Catálogo activo con modelos vinculados
          </p>
        </div>
      </div>

      {/* 3. Categorías Vacías */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectTab('vacias')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelectTab('vacias')
          }
        }}
        className={`p-4 sm:p-5 rounded-xl border bg-card shadow-none transition-all duration-150 cursor-pointer flex flex-col justify-between select-none ${
          activeTab === 'vacias'
            ? 'border-primary ring-1 ring-primary/30'
            : 'border-border/60 hover:border-border hover:bg-muted/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Categorías Vacías
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              vaciasCount > 0
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-muted/60 text-muted-foreground border border-border/50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-semibold tracking-tight text-foreground font-mono tabular-nums flex items-baseline gap-1.5">
            <span>{vaciasCount}</span>
            <span className="text-xs font-normal font-sans text-muted-foreground">sin modelos</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {vaciasCount > 0 ? 'Sin productos asignados en catálogo' : 'Todas tienen productos asignados'}
          </p>
        </div>
      </div>
    </div>
  )
}
