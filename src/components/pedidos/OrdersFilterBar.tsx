'use client'

import React, { useMemo } from 'react'
import { Search, X, ChevronDown, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DateFilterControl } from '@/components/ui/DateFilterControl'
import { DateRange } from '@/lib/date-utils'

export interface OrdersFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  selectedEstadoFilter: string
  onEstadoFilterChange: (estado: string) => void
  selectedPagoFilter: string
  onPagoFilterChange: (pago: string) => void
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  minDate?: string | Date | null
  maxDate?: string | Date | null
}

const STATUS_TABS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'EN_PRODUCCION', label: 'Preparando' },
  { value: 'LISTO_ENTREGA', label: 'Por Entregar' },
  { value: 'ENTREGADO', label: 'Entregado' },
] as const

const PAYMENT_OPTIONS = [
  { value: 'TODOS', label: 'Pagos: Todos' },
  { value: 'PENDIENTE', label: 'Con Saldo' },
  { value: 'PAGADO', label: '100% Pagado' },
] as const

export function OrdersFilterBar({
  search,
  onSearchChange,
  selectedEstadoFilter,
  onEstadoFilterChange,
  selectedPagoFilter,
  onPagoFilterChange,
  dateRange,
  onDateRangeChange,
  minDate,
  maxDate,
}: OrdersFilterBarProps) {
  const currentPaymentLabel = useMemo(() => {
    const match = PAYMENT_OPTIONS.find((opt) => opt.value === selectedPagoFilter)
    return match ? match.label : 'Pagos: Todos'
  }, [selectedPagoFilter])

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-3 shadow-2xs mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
      {/* Bloque 1 - Izquierda (Búsqueda) */}
      <div className="relative flex-1 min-w-[200px] max-w-sm lg:max-w-md w-full">
        <Search className="left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none absolute" />
        <Input
          type="text"
          placeholder="Buscar por cliente, código (#PED-XXX) o modelo..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 transition-colors"
            title="Borrar búsqueda"
            aria-label="Borrar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Fila 2 en móviles/tablets (< 1024px) / Desenvuelto en 1 sola fila en desktop (>= 1024px) */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full lg:contents">
        {/* Bloque 2 - Centro (Estados de Producción) */}
        <div className="bg-secondary/80 border border-border/70 p-1 rounded-xl h-10 flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((tab) => {
            const isSelected = selectedEstadoFilter === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onEstadoFilterChange(tab.value)}
                className={`h-full flex items-center cursor-pointer whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-card text-foreground font-bold shadow-xs text-xs px-3.5 py-1.5 rounded-lg'
                    : 'text-muted-foreground hover:text-foreground text-xs px-3 py-1.5 rounded-lg'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Bloque 3 - Derecha (Pagos y Fecha alineados al borde derecho) */}
        <div className="flex items-center gap-2 shrink-0 lg:ml-auto">
          {/* Selector de Pagos */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-10 px-3.5 rounded-xl border border-input bg-background text-xs font-semibold text-foreground shadow-2xs flex items-center gap-1.5 hover:bg-secondary/40 transition-colors whitespace-nowrap cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary shrink-0"
              title="Filtrar por cobranza"
            >
              <span>{currentPaymentLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[140px] bg-card border border-border rounded-xl shadow-lg p-1 z-50"
            >
              {PAYMENT_OPTIONS.map((opt) => {
                const isSelected = selectedPagoFilter === opt.value
                return (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => onPagoFilterChange(opt.value)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-secondary font-bold text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Navegador de Histórico Unificado */}
          <DateFilterControl
            value={dateRange}
            onChange={onDateRangeChange}
            label="Fecha"
            align="right"
            size="sm"
            variant="unified"
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      </div>
    </div>
  )
}
