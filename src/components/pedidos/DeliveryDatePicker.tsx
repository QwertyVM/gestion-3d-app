'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Sparkles,
  Pencil,
  RotateCcw
} from 'lucide-react'
import { parseDiaPromesa } from '@/lib/date-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DeliveryDatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

function formatToYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DIAS_SEMANA_CORTO = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

export function DeliveryDatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha de entrega...',
  className = '',
  id
}: DeliveryDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Determinar si el valor actual es una fecha reconocible o texto libre
  const parsedCurrent = useMemo(() => parseDiaPromesa(value), [value])
  const isCustomText = Boolean(value && value.trim() && !parsedCurrent)

  // Modo: 'CALENDAR' o 'MANUAL'
  const [mode, setMode] = useState<'CALENDAR' | 'MANUAL'>(() => (isCustomText ? 'MANUAL' : 'CALENDAR'))

  // Si el valor cambia externamente a texto libre no reconocible, activar modo manual
  useEffect(() => {
    if (isCustomText) {
      setMode('MANUAL')
    }
  }, [isCustomText])

  // Mes y año en visualización dentro del calendario
  const initialDate = parsedCurrent || new Date()
  const [viewYear, setViewYear] = useState(() => initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => initialDate.getMonth())

  // Sincronizar visualización del mes cuando se abre con una fecha seleccionada
  useEffect(() => {
    if (isOpen && parsedCurrent) {
      setViewYear(parsedCurrent.getFullYear())
      setViewMonth(parsedCurrent.getMonth())
    }
  }, [isOpen, parsedCurrent])

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  // Navegar meses
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(prev => prev - 1)
    } else {
      setViewMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(prev => prev + 1)
    } else {
      setViewMonth(prev => prev + 1)
    }
  }

  // Generar cuadrícula de días para el mes visible
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate()
    // Lunes = 0, Domingo = 6
    const startDay = (firstDay.getDay() + 6) % 7

    const prevMonthTotal = new Date(viewYear, viewMonth, 0).getDate()
    const days: Array<{
      day: number
      monthOffset: number // -1: prev, 0: current, 1: next
      date: Date
      isCurrentMonth: boolean
    }> = []

    // Relleno mes anterior
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonthTotal - i
      days.push({
        day: d,
        monthOffset: -1,
        date: new Date(viewYear, viewMonth - 1, d),
        isCurrentMonth: false
      })
    }

    // Días mes actual
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        day: d,
        monthOffset: 0,
        date: new Date(viewYear, viewMonth, d),
        isCurrentMonth: true
      })
    }

    // Relleno mes siguiente (para completar múltiplos de 7)
    const remaining = (7 - (days.length % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        monthOffset: 1,
        date: new Date(viewYear, viewMonth + 1, d),
        isCurrentMonth: false
      })
    }

    return days
  }, [viewYear, viewMonth])

  // Seleccionar fecha exacta
  const handleSelectDate = (date: Date) => {
    const ymd = formatToYMD(date)
    onChange(ymd)
    setIsOpen(false)
  }

  // Presets rápidos
  const handleSelectPreset = (daysFromToday: number) => {
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysFromToday)
    handleSelectDate(target)
  }

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    onChange('')
    setIsOpen(false)
  }

  // Información relativa de la fecha seleccionada para el badge en el trigger
  const selectedInfo = useMemo(() => {
    if (!value || !value.trim()) return null
    if (!parsedCurrent) {
      return { label: value, badge: 'Texto libre', isDate: false }
    }

    const now = new Date()
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const targetMidnight = new Date(parsedCurrent.getFullYear(), parsedCurrent.getMonth(), parsedCurrent.getDate()).getTime()
    const diffDays = Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24))

    let badge = ''
    let badgeColor = 'text-primary bg-primary/10 border-primary/20'

    if (diffDays === 0) {
      badge = 'Entrega Hoy'
      badgeColor = 'text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30'
    } else if (diffDays === 1) {
      badge = 'Mañana'
      badgeColor = 'text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30'
    } else if (diffDays > 1 && diffDays <= 4) {
      badge = `En ${diffDays} días`
      badgeColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    } else if (diffDays > 4) {
      badge = `En ${diffDays} días`
      badgeColor = 'text-foreground/80 bg-muted border-border'
    } else if (diffDays === -1) {
      badge = 'Ayer'
      badgeColor = 'text-destructive bg-destructive/10 border-destructive/20'
    } else if (diffDays < -1) {
      badge = `Vencido (${Math.abs(diffDays)}d)`
      badgeColor = 'text-destructive bg-destructive/10 border-destructive/20 font-bold'
    }

    const weekday = parsedCurrent.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '')
    const day = parsedCurrent.getDate()
    const month = parsedCurrent.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')
    const year = parsedCurrent.getFullYear()
    const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
    const capMonth = month.charAt(0).toUpperCase() + month.slice(1)

    return {
      label: `${capWeekday}, ${day} ${capMonth} ${year}`,
      badge,
      badgeColor,
      isDate: true
    }
  }, [value, parsedCurrent])

  // Verificación de hoy para resaltar en la cuadrícula
  const today = new Date()
  const todayYMD = formatToYMD(today)
  const selectedYMD = parsedCurrent ? formatToYMD(parsedCurrent) : null

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* MODO TEXTO MANUAL: Campo de texto libre con opción de volver al calendario */}
      {mode === 'MANUAL' ? (
        <div className="space-y-1.5">
          <div className="relative">
            <Input
              id={id}
              placeholder="Ej: Sábado 18:00, Mañana en Shalom..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 pr-16 bg-card border-input text-foreground text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                title="Limpiar fecha"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode('CALENDAR')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 p-1 cursor-pointer"
              title="Abrir calendario interactivo"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] px-1 text-muted-foreground">
            <span>Escribiendo indicación manual</span>
            <button
              type="button"
              onClick={() => {
                setMode('CALENDAR')
                setIsOpen(true)
              }}
              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CalendarIcon className="h-3 w-3" />
              <span>Usar calendario</span>
            </button>
          </div>
        </div>
      ) : (
        /* MODO CALENDARIO: Trigger interactivo tipo botón con estado visual claro */
        <div>
          <button
            id={id}
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className={`w-full h-10 px-3 rounded-xl border bg-card text-left text-sm flex items-center justify-between gap-2 transition-all shadow-2xs cursor-pointer ${
              isOpen
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-input hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <CalendarIcon className={`h-4 w-4 shrink-0 ${value ? 'text-primary' : 'text-muted-foreground'}`} />
              {selectedInfo ? (
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <span className="font-semibold text-foreground text-xs sm:text-sm truncate">
                    {selectedInfo.label}
                  </span>
                  {selectedInfo.badge && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${selectedInfo.badgeColor}`}
                    >
                      {selectedInfo.badge}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground text-xs sm:text-sm font-normal">
                  {placeholder}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Borrar fecha"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </button>
        </div>
      )}

      {/* POPOVER DEL CALENDARIO */}
      {isOpen && mode === 'CALENDAR' && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-full sm:w-80 bg-popover border border-border rounded-2xl shadow-xl p-3 space-y-3 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* BARRA DE PRESETS RÁPIDOS */}
          <div className="space-y-1.5 pb-2 border-b border-border/70">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Accesos rápidos</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              <button
                type="button"
                onClick={() => handleSelectPreset(0)}
                className="py-1 px-1.5 text-[11px] font-semibold rounded-lg border border-border/80 bg-secondary/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(1)}
                className="py-1 px-1.5 text-[11px] font-semibold rounded-lg border border-border/80 bg-secondary/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center cursor-pointer"
              >
                Mañana
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(2)}
                className="py-1 px-1.5 text-[11px] font-semibold rounded-lg border border-border/80 bg-secondary/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center cursor-pointer"
              >
                +2 días
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(3)}
                className="py-1 px-1.5 text-[11px] font-semibold rounded-lg border border-border/80 bg-secondary/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center cursor-pointer"
              >
                +3 días
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(7)}
                className="py-1 px-1.5 text-[11px] font-semibold rounded-lg border border-border/80 bg-secondary/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center cursor-pointer"
              >
                +1 sem
              </button>
            </div>
          </div>

          {/* CABECERA DE NAVEGACIÓN DEL MES */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-xs font-bold text-foreground">
              {MESES_ES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* CUADRÍCULA DE DÍAS */}
          <div>
            {/* Cabecera días de semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DIAS_SEMANA_CORTO.map(d => (
                <div key={d} className="text-[11px] font-bold text-muted-foreground/70 py-0.5">
                  {d}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, idx) => {
                const itemYMD = formatToYMD(item.date)
                const isSelected = selectedYMD === itemYMD
                const isToday = todayYMD === itemYMD

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDate(item.date)}
                    className={`h-8 w-full rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : item.isCurrentMonth
                        ? 'text-foreground hover:bg-secondary hover:text-foreground'
                        : 'text-muted-foreground/40 hover:bg-secondary/40'
                    } ${
                      isToday && !isSelected
                        ? 'border border-primary/60 font-bold text-primary'
                        : ''
                    }`}
                  >
                    <span>{item.day}</span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* PIE DEL POPOVER: ACCIÓN DE LIMPIEZA O CAMBIO A TEXTO LIBRE */}
          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('MANUAL')
                setIsOpen(false)
              }}
              className="text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Pencil className="h-3 w-3" />
              <span>Texto libre...</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-destructive hover:underline font-semibold cursor-pointer"
              >
                Sin fecha pactada
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
