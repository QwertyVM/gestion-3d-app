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
  statusCounts?: Record<string, number>
}

const STATUS_TABS = [
  { value: 'ACTIVOS', label: 'Activos' },
  { value: 'EN_PRODUCCION', label: 'Imprimiendo' },
  { value: 'EN_TALLER', label: 'En taller' },
  { value: 'EMPAQUETANDO', label: 'Empaquetando' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'TODOS', label: 'Todos' },
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
  statusCounts,
}: OrdersFilterBarProps) {
  const currentPaymentLabel = useMemo(() => {
    const match = PAYMENT_OPTIONS.find((opt) => opt.value === selectedPagoFilter)
    return match ? match.label : 'Pagos: Todos'
  }, [selectedPagoFilter])

  return (
    <div className="w-full bg-card border border-border rounded-xl p-2.5 shadow-2xs mb-4 flex flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-2.5">
      {/* Bloque 1 - Izquierda (Búsqueda) */}
      <div className="relative flex-1 min-w-[220px] max-w-md w-full">
        <Search className="left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70 pointer-events-none absolute" />
        <Input
          type="text"
          placeholder="Buscar por cliente, código (#PED-XXX) o modelo..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8.5 w-full rounded-md border border-input bg-background pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground/70 focus:ring-1 focus:ring-primary focus:border-primary shadow-2xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 transition-colors"
            title="Borrar búsqueda"
            aria-label="Borrar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Fila 2 en pantallas medianas (< 1536px) / Desenvuelto en 1 sola fila en monitores anchos (>= 1536px) */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full 2xl:contents">
        {/* Bloque 2 - Centro (Estados de Producción) */}
        <div className="bg-secondary/70 border border-border/70 p-0.5 rounded-md h-8.5 flex items-center gap-0.5 shrink-0 overflow-x-auto no-scrollbar max-w-full">
          {STATUS_TABS.map((tab) => {
            const isSelected = selectedEstadoFilter === tab.value
            const count = statusCounts ? statusCounts[tab.value] : undefined
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onEstadoFilterChange(tab.value)}
                className={`h-full flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all text-xs px-2.5 py-1 rounded-sm ${
                  isSelected
                    ? 'bg-background text-foreground font-semibold shadow-2xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <span>{tab.label}</span>
                {count !== undefined && (
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded-md font-mono transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'bg-muted text-muted-foreground font-medium'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Bloque 3 - Derecha (Pagos y Fecha alineados al borde derecho) */}
        <div className="flex items-center gap-2 shrink-0 2xl:ml-auto">
          {/* Selector de Pagos */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-8.5 px-3 rounded-md border border-input bg-background text-xs font-semibold text-foreground shadow-2xs flex items-center gap-1.5 hover:bg-secondary/40 transition-colors whitespace-nowrap cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary shrink-0"
              title="Filtrar por cobranza"
            >
              <span>{currentPaymentLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[140px] bg-card border border-border rounded-lg shadow-lg p-1 z-50"
            >
              {PAYMENT_OPTIONS.map((opt) => {
                const isSelected = selectedPagoFilter === opt.value
                return (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => onPagoFilterChange(opt.value)}
                    className={`text-xs px-2.5 py-1.5 rounded-md cursor-pointer flex items-center justify-between transition-colors ${
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
