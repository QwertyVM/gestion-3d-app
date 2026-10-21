'use client'

import { Search, X } from 'lucide-react'
import { CategoryFilterTab } from './CategoryStatsCards'

interface CategorySearchBarProps {
  search: string
  onSearchChange: (value: string) => void
  activeTab: CategoryFilterTab
  onTabChange: (tab: CategoryFilterTab) => void
  totalCount: number
  conModelosCount: number
  vaciasCount: number
}

export function CategorySearchBar({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  totalCount,
  conModelosCount,
  vaciasCount
}: CategorySearchBarProps) {
  return (
    <div className="w-full bg-card border border-border/60 rounded-xl p-3 shadow-none mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Izquierda: Buscador elástico */}
      <div className="relative flex-1 max-w-md w-full">
        <Search className="left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none absolute" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre, descripción o modelo..."
          className="h-9 w-full rounded-lg border border-border/80 bg-background pl-9 pr-8 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring outline-none transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Derecha: Segmented control de estados */}
      <div className="bg-muted/40 border border-border/60 p-0.5 rounded-lg flex items-center gap-0.5 shrink-0 overflow-x-auto">
        {/* Todas */}
        <button
          type="button"
          onClick={() => onTabChange('todas')}
          className={`text-xs px-2.5 py-1 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
            activeTab === 'todas'
              ? 'bg-background text-foreground font-medium shadow-none'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Todas</span>
          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums bg-muted text-muted-foreground">
            {totalCount}
          </span>
        </button>

        {/* Con Modelos */}
        <button
          type="button"
          onClick={() => onTabChange('con_modelos')}
          className={`text-xs px-2.5 py-1 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
            activeTab === 'con_modelos'
              ? 'bg-background text-foreground font-medium shadow-none'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Con Modelos</span>
          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums bg-muted text-muted-foreground">
            {conModelosCount}
          </span>
        </button>

        {/* Vacías */}
        <button
          type="button"
          onClick={() => onTabChange('vacias')}
          className={`text-xs px-2.5 py-1 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
            activeTab === 'vacias'
              ? 'bg-background text-foreground font-medium shadow-none'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Vacías</span>
          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums bg-muted text-muted-foreground">
            {vaciasCount}
          </span>
        </button>
      </div>
    </div>
  )
}
