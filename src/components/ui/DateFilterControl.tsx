'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Check, RotateCcw } from 'lucide-react'
import { 
  DatePreset, 
  DateRange, 
  getPresetDateRange, 
  getMonthYearDateRange, 
  MESES_ES, 
  formatFechaEvolucion 
} from '@/lib/date-utils'

interface DateFilterControlProps {
  value: DateRange
  onChange: (range: DateRange) => void
  label?: string
  align?: 'left' | 'right'
  className?: string
  showAllOption?: boolean
  showMonthSwitcher?: boolean
  size?: 'sm' | 'md'
  maxDate?: string | Date | null
  minDate?: string | Date | null
}

function parseDateToYearMonth(d: string | Date | null | undefined): { year: number; month: number } | null {
  if (!d) return null
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return null
    return { year: d.getFullYear(), month: d.getMonth() }
  }
  const str = String(d).trim()
  if (!str) return null
  const ymd = str.split('T')[0].split('-').map(Number)
  if (ymd.length >= 2 && !isNaN(ymd[0]) && !isNaN(ymd[1])) {
    return { year: ymd[0], month: ymd[1] - 1 }
  }
  const dateObj = new Date(str)
  if (!isNaN(dateObj.getTime())) {
    return { year: dateObj.getFullYear(), month: dateObj.getMonth() }
  }
  return null
}

export function DateFilterControl({
  value,
  onChange,
  label = 'Filtrar por Fecha',
  align = 'right',
  className = '',
  showAllOption = true,
  showMonthSwitcher = true,
  size = 'md',
  maxDate,
  minDate,
}: DateFilterControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Límites temporales según data disponible o mes actual
  const now = new Date()
  const maxLimit = parseDateToYearMonth(maxDate) || { year: now.getFullYear(), month: now.getMonth() }
  const minLimit = parseDateToYearMonth(minDate)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelectPreset = (preset: DatePreset) => {
    const newRange = getPresetDateRange(preset)
    onChange(newRange)
    setIsOpen(false)
  }

  // Obtener año y mes activo (0-11) para la navegación
  const getActiveMonthAndYear = () => {
    if (value.from) {
      const parts = value.from.split('-').map(Number)
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { year: parts[0], month: parts[1] - 1 }
      }
    }
    return { year: maxLimit.year, month: maxLimit.month }
  }

  const { year: currentYear, month: currentMonth } = getActiveMonthAndYear()
  const prevDate = new Date(currentYear, currentMonth - 1, 1)
  const nextDate = new Date(currentYear, currentMonth + 1, 1)
  const prevMonthLabel = `${MESES_ES[prevDate.getMonth()]} ${prevDate.getFullYear()}`
  const nextMonthLabel = `${MESES_ES[nextDate.getMonth()]} ${nextDate.getFullYear()}`

  // ¿El botón siguiente debe estar deshabilitado porque no hay data en meses posteriores?
  const isNextDisabled =
    value.preset === 'TODO' ||
    currentYear > maxLimit.year ||
    (currentYear === maxLimit.year && currentMonth >= maxLimit.month)

  // ¿El botón anterior debe estar deshabilitado porque se alcanzó el mes más antiguo con data?
  const isPrevDisabled = Boolean(
    minLimit &&
      (currentYear < minLimit.year ||
        (currentYear === minLimit.year && currentMonth <= minLimit.month))
  )

  // Navegar horizontalmente un mes atrás o adelante
  const handleNavigateMonth = (direction: -1 | 1) => {
    if (direction === 1 && isNextDisabled) return
    if (direction === -1 && isPrevDisabled) return

    if (value.preset === 'TODO') {
      if (direction === -1) {
        // Desde Histórico, ir al mes más reciente disponible con data
        const targetYear = maxLimit.year
        const targetMonth = maxLimit.month
        const isCurrentMonth = targetYear === now.getFullYear() && targetMonth === now.getMonth()

        if (isCurrentMonth) {
          onChange(getPresetDateRange('ESTE_MES'))
          return
        }

        const newRange = getMonthYearDateRange(targetYear, targetMonth + 1)
        onChange(newRange)
        return
      }
      return
    }

    const targetDate = new Date(currentYear, currentMonth + direction, 1)
    const targetYear = targetDate.getFullYear()
    const targetMonth = targetDate.getMonth() // 0-11

    const isCurrentMonth = targetYear === now.getFullYear() && targetMonth === now.getMonth()

    if (isCurrentMonth) {
      onChange(getPresetDateRange('ESTE_MES'))
      return
    }

    // getMonthYearDateRange toma mes 1-12
    const newRange = getMonthYearDateRange(targetYear, targetMonth + 1)
    onChange(newRange)
  }

  // Detectar si el rango actual corresponde a un mes calendario completo
  const getFullCalendarMonthInfo = () => {
    if (!value.from || !value.to) return null
    const [fromY, fromM, fromD] = value.from.split('-').map(Number)
    const [toY, toM, toD] = value.to.split('-').map(Number)
    if (fromY === toY && fromM === toM && fromD === 1) {
      const lastDayOfMonth = new Date(fromY, fromM, 0).getDate()
      if (toD === lastDayOfMonth) {
        return { year: fromY, monthIndex: fromM - 1 }
      }
    }
    return null
  }

  const fullMonthInfo = getFullCalendarMonthInfo()

  // Label description for button display
  const getDisplayLabel = () => {
    if (value.preset === 'ESTE_MES') {
      const now = new Date()
      return `${MESES_ES[now.getMonth()]} ${now.getFullYear()} (Mes Actual)`
    }
    if (value.preset === 'MES_ANTERIOR') {
      const prev = new Date()
      prev.setMonth(prev.getMonth() - 1)
      return `${MESES_ES[prev.getMonth()]} ${prev.getFullYear()}`
    }
    if (value.preset === 'ESTA_SEMANA') {
      if (value.from && value.to) {
        return `Esta Semana (${formatFechaEvolucion(value.from)} - ${formatFechaEvolucion(value.to)})`
      }
      return 'Esta Semana (Lun - Dom)'
    }
    if (value.preset === 'SEMANA_ANTERIOR') {
      if (value.from && value.to) {
        return `Semana Pasada (${formatFechaEvolucion(value.from)} - ${formatFechaEvolucion(value.to)})`
      }
      return 'Semana Pasada (Lun - Dom)'
    }
    if (value.preset === 'ULTIMOS_3_MESES') {
      return 'Hace 3 meses'
    }
    if (value.preset === 'TODO') {
      return 'Histórico'
    }
    if (fullMonthInfo) {
      const now = new Date()
      const isCurrentMonth = fullMonthInfo.year === now.getFullYear() && fullMonthInfo.monthIndex === now.getMonth()
      return `${MESES_ES[fullMonthInfo.monthIndex]} ${fullMonthInfo.year}${isCurrentMonth ? ' (Mes Actual)' : ''}`
    }
    if (value.from && value.to) {
      return `${formatFechaEvolucion(value.from)} - ${formatFechaEvolucion(value.to)}`
    }
    return 'Histórico'
  }

  const isAllActive = value.preset === 'TODO'
  const isCustomSpecificMonth = fullMonthInfo !== null && value.preset !== 'ESTE_MES'
  const estaSemanaRange = getPresetDateRange('ESTA_SEMANA')
  const semanaAnteriorRange = getPresetDateRange('SEMANA_ANTERIOR')

  return (
    <div className={`relative inline-flex items-center gap-1 text-left ${className}`} ref={dropdownRef}>
      {/* Botón Mes Anterior */}
      {showMonthSwitcher && (
        <button
          type="button"
          onClick={() => handleNavigateMonth(-1)}
          disabled={isPrevDisabled}
          title={
            isPrevDisabled
              ? 'No hay registros de meses anteriores'
              : value.preset === 'TODO'
              ? `Ver ${MESES_ES[maxLimit.month]} ${maxLimit.year}`
              : `Mes anterior (${prevMonthLabel})`
          }
          aria-label={
            isPrevDisabled
              ? 'No hay registros de meses anteriores'
              : value.preset === 'TODO'
              ? `Ver ${MESES_ES[maxLimit.month]} ${maxLimit.year}`
              : `Mes anterior (${prevMonthLabel})`
          }
          className={`${
            size === 'sm' ? 'h-8 w-8 rounded-full' : 'h-9 w-9 rounded-full'
          } border flex items-center justify-center transition-all shrink-0 ${
            isPrevDisabled
              ? 'opacity-35 cursor-not-allowed bg-[#FAF8F5] border-[#E2D9CC] text-[#B0A495] shadow-none'
              : !isAllActive
              ? 'bg-[#FDF6E2] border-[#D4BEA7] text-[#633E20] hover:bg-[#F9ECCF] cursor-pointer shadow-2xs'
              : 'bg-background border-input text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer shadow-2xs'
          }`}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Trigger Button (Abre el menú desplegable con opciones) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          size === 'sm' ? 'h-8 px-3 rounded-full' : 'h-9 px-3.5 rounded-full'
        } border flex items-center gap-1.5 sm:gap-2 text-xs font-medium transition-all shadow-2xs cursor-pointer ${
          !isAllActive
            ? 'bg-[#FDF6E2] border-[#D4BEA7] text-[#633E20] hover:bg-[#F9ECCF]'
            : 'bg-background border-input text-muted-foreground hover:text-foreground hover:bg-muted/40'
        }`}
      >
        <Calendar className={`h-3.5 w-3.5 shrink-0 ${!isAllActive ? 'text-[#A36F4C]' : 'text-muted-foreground'}`} />
        <span className="truncate max-w-[170px] sm:max-w-[220px]">{getDisplayLabel()}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Botón Mes Siguiente */}
      {showMonthSwitcher && (
        <button
          type="button"
          onClick={() => handleNavigateMonth(1)}
          disabled={isNextDisabled}
          title={
            isNextDisabled
              ? 'No hay datos disponibles en meses posteriores'
              : `Mes siguiente (${nextMonthLabel})`
          }
          aria-label={
            isNextDisabled
              ? 'No hay datos disponibles en meses posteriores'
              : `Mes siguiente (${nextMonthLabel})`
          }
          className={`${
            size === 'sm' ? 'h-8 w-8 rounded-full' : 'h-9 w-9 rounded-full'
          } border flex items-center justify-center transition-all shrink-0 ${
            isNextDisabled
              ? 'opacity-35 cursor-not-allowed bg-[#FAF8F5] border-[#E2D9CC] text-[#B0A495] shadow-none'
              : !isAllActive
              ? 'bg-[#FDF6E2] border-[#D4BEA7] text-[#633E20] hover:bg-[#F9ECCF] cursor-pointer shadow-2xs'
              : 'bg-background border-input text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer shadow-2xs'
          }`}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 w-76 sm:w-84 max-w-[calc(100vw-24px)] rounded-2xl bg-[#FFFFFF] border border-[#E2D9CC] shadow-2xl z-50 p-3.5 space-y-3 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]/70">
            <span className="text-[11px] font-bold text-[#241C15] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#A36F4C]" />
              {label}
            </span>
            {value.preset !== 'TODO' && (
              <button
                type="button"
                onClick={() => handleSelectPreset('TODO')}
                className="text-[10px] text-[#A36F4C] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                Ir a Histórico
              </button>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-col gap-1.5">
            {showAllOption && (
              <button
                type="button"
                onClick={() => handleSelectPreset('TODO')}
                className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                  value.preset === 'TODO'
                    ? 'bg-[#75695D] text-white shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA]'
                }`}
              >
                <span>🌐 Histórico</span>
                {value.preset === 'TODO' && <Check className="h-3.5 w-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectPreset('ESTE_MES')}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'ESTE_MES'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <span>📅 Mes Actual ({MESES_ES[new Date().getMonth()]})</span>
              {value.preset === 'ESTE_MES' && <Check className="h-3.5 w-3.5" />}
            </button>

            {/* Mes personalizado seleccionado mediante flechas horizontales */}
            {isCustomSpecificMonth && (
              <div className="px-3 py-2 rounded-lg text-xs font-bold bg-[#A36F4C] text-white flex items-center justify-between shadow-2xs">
                <span>📅 {MESES_ES[fullMonthInfo.monthIndex]} {fullMonthInfo.year}</span>
                <Check className="h-3.5 w-3.5 shrink-0" />
              </div>
            )}

            <button
              type="button"
              onClick={() => handleSelectPreset('ESTA_SEMANA')}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'ESTA_SEMANA'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <div className="flex flex-col">
                <span>📆 Esta Semana (Lun - Dom)</span>
                <span className={`text-[10px] font-normal ${value.preset === 'ESTA_SEMANA' ? 'text-white/80' : 'text-[#75695D]'}`}>
                  {formatFechaEvolucion(estaSemanaRange.from!)} - {formatFechaEvolucion(estaSemanaRange.to!)}
                </span>
              </div>
              {value.preset === 'ESTA_SEMANA' && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('SEMANA_ANTERIOR')}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'SEMANA_ANTERIOR'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <div className="flex flex-col">
                <span>⏪ Semana Pasada (Última semana)</span>
                <span className={`text-[10px] font-normal ${value.preset === 'SEMANA_ANTERIOR' ? 'text-white/80' : 'text-[#75695D]'}`}>
                  {formatFechaEvolucion(semanaAnteriorRange.from!)} - {formatFechaEvolucion(semanaAnteriorRange.to!)}
                </span>
              </div>
              {value.preset === 'SEMANA_ANTERIOR' && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('ULTIMOS_3_MESES')}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'ULTIMOS_3_MESES'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <span>⏱️ Hace 3 meses</span>
              {value.preset === 'ULTIMOS_3_MESES' && <Check className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

