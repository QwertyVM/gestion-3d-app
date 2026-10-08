'use client'

import { Search, X, AlertTriangle } from 'lucide-react'
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
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-4">
      {/* Buscador ágil */}
      <div className="relative flex-1 max-w-md w-full">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre, descripción o modelo..."
          className="w-full h-10 rounded-xl border border-input bg-card pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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

      {/* Segmented Control de Estados */}
      <div className="bg-secondary/70 border border-border/80 p-1 rounded-xl flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
        {/* Todas */}
        <button
          type="button"
          onClick={() => onTabChange('todas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center cursor-pointer flex-1 sm:flex-initial ${
            activeTab === 'todas'
              ? 'bg-card text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
          }`}
        >
          <span>Todas</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'todas'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Con Modelos */}
        <button
          type="button"
          onClick={() => onTabChange('con_modelos')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center cursor-pointer flex-1 sm:flex-initial ${
            activeTab === 'con_modelos'
              ? 'bg-card text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
          }`}
        >
          <span>Con Modelos</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'con_modelos'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {conModelosCount}
          </span>
        </button>

        {/* Vacías */}
        <button
          type="button"
          onClick={() => onTabChange('vacias')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center cursor-pointer flex-1 sm:flex-initial ${
            activeTab === 'vacias'
              ? 'bg-card text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
          }`}
        >
          {vaciasCount > 0 && (
            <AlertTriangle className="w-3 h-3 mr-1 text-destructive shrink-0" />
          )}
          <span>Vacías</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              vaciasCount > 0
                ? 'bg-destructive/10 text-destructive'
                : activeTab === 'vacias'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {vaciasCount}
          </span>
        </button>
      </div>
    </div>
  )
}
