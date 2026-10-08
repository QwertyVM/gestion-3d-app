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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        className={`p-5 rounded-xl border bg-card shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
          activeTab === 'todas'
            ? 'border-primary/50 ring-1 ring-primary/30 shadow-md'
            : 'border-border hover:border-primary/40 hover:shadow-md hover:bg-secondary/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Familias Registradas
          </span>
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Folder className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums flex items-baseline gap-1.5">
            <span>{totalCategorias}</span>
            <span className="text-xs font-normal font-sans text-muted-foreground">familias</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
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
        className={`p-5 rounded-xl border bg-card shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
          activeTab === 'con_modelos'
            ? 'border-primary/50 ring-1 ring-primary/30 shadow-md'
            : 'border-border hover:border-primary/40 hover:shadow-md hover:bg-secondary/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Con Modelos Asignados
          </span>
          <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums flex items-baseline gap-1.5">
            <span>{conModelosCount}</span>
            <span className="text-xs font-normal font-sans text-muted-foreground">categorías</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
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
        className={`p-5 rounded-xl border bg-card shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
          activeTab === 'vacias'
            ? 'border-primary/50 ring-1 ring-primary/30 shadow-md'
            : 'border-border hover:border-primary/40 hover:shadow-md hover:bg-secondary/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Categorías Vacías
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              vaciasCount > 0
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums flex items-baseline gap-1.5">
            <span>{vaciasCount}</span>
            <span className="text-xs font-normal font-sans text-muted-foreground">sin modelos</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {vaciasCount > 0 ? 'Sin productos asignados en catálogo' : 'Todas tienen productos asignados'}
          </p>
        </div>
      </div>
    </div>
  )
}
