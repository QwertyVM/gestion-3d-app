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
    <div className="w-full bg-card border border-border rounded-2xl p-3 shadow-2xs mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Izquierda: Buscador elástico */}
      <div className="relative flex-1 max-w-md w-full">
        <Search className="left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none absolute" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre, descripción o modelo..."
          className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs outline-none transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Derecha: Segmented control de estados */}
      <div className="bg-secondary/80 border border-border/70 p-1 rounded-xl flex items-center gap-1 shrink-0 overflow-x-auto">
        {/* Todas */}
        <button
          type="button"
          onClick={() => onTabChange('todas')}
          className={`text-xs px-3 py-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
            activeTab === 'todas'
              ? 'bg-card text-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Todas</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-foreground">
            {totalCount}
          </span>
        </button>

        {/* Con Modelos */}
        <button
          type="button"
          onClick={() => onTabChange('con_modelos')}
          className={`text-xs px-3 py-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
            activeTab === 'con_modelos'
              ? 'bg-card text-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Con Modelos</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-foreground">
            {conModelosCount}
          </span>
        </button>

        {/* Vacías */}
        <button
          type="button"
          onClick={() => onTabChange('vacias')}
          className={`text-xs px-3 py-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
            activeTab === 'vacias'
              ? 'bg-card text-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Vacías</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-foreground">
            {vaciasCount}
          </span>
        </button>
      </div>
    </div>
  )
}
