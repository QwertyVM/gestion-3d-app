'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useBusiness } from '@/context/BusinessContext'
import { TipoNegocio, BUSINESSES } from '@/lib/business'
import { Box, Dices, Check, ChevronsUpDown, Sparkles, Loader2 } from 'lucide-react'

interface BusinessSwitcherProps {
  compact?: boolean
  className?: string
}

export function BusinessSwitcher({ compact = false, className = '' }: BusinessSwitcherProps) {
  const { negocio, setNegocio, config, isPending } = useBusiness()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectNegocio = (next: TipoNegocio) => {
    if (next === negocio) {
      setIsOpen(false)
      return
    }
    setIsOpen(false)
    setNegocio(next)
  }

  const is3D = negocio === '3D'

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Button - Native Warm Theme Card */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => !isPending && setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Cambiar negocio activo"
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-white border border-[#E2D9CC] shadow-2xs hover:bg-[#FAF7F4] hover:border-[#D4A373]/60 transition-all duration-150 text-left cursor-pointer ${
          isOpen ? 'ring-2 ring-[#A36F4C]/30 border-[#A36F4C] bg-[#FAF7F4]' : ''
        } ${isPending ? 'opacity-70 cursor-wait pointer-events-none' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Brand Avatar */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 ${
              isOpen ? 'scale-105' : ''
            } ${
              is3D
                ? 'bg-[#A36F4C] text-white'
                : 'bg-[#6366F1] text-white'
            }`}
          >
            {is3D ? (
              <Box className="w-4 h-4 stroke-[2.2]" />
            ) : (
              <Dices className="w-4 h-4 stroke-[2.2]" />
            )}
          </div>

          {/* Business Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs text-[#241C15] tracking-tight truncate">
                {config.name}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${
                  is3D
                    ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                    : 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]'
                }`}
              >
                {config.id}
              </span>
            </div>
            {!compact && (
              <p className="text-[10px] text-[#75695D] font-medium truncate leading-tight mt-0.5">
                {isPending ? 'Cambiando...' : config.subname}
              </p>
            )}
          </div>
        </div>

        {/* Chevron or Loader */}
        {isPending ? (
          <Loader2 className="w-4 h-4 text-[#75695D] animate-spin shrink-0" />
        ) : (
          <ChevronsUpDown
            className={`w-4 h-4 text-[#75695D] shrink-0 transition-transform duration-200 ${
              isOpen ? 'text-[#241C15]' : ''
            }`}
          />
        )}
      </button>

      {/* Dropdown Menu - Native Warm Palette */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 p-1.5 bg-white border border-[#E2D9CC] rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-150"
          style={{ minWidth: '220px' }}
        >
          <div className="px-2 py-1 border-b border-[#E2D9CC] mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#75695D] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#A36F4C]" />
              Cambiar Negocio
            </span>
            <span className="text-[9px] font-medium text-[#75695D] bg-[#F1ECE4] px-1.5 py-0.5 rounded">
              Misma BD
            </span>
          </div>

          {(['3D', 'BG'] as TipoNegocio[]).map((bizKey) => {
            const biz = BUSINESSES[bizKey]
            const isSelected = negocio === bizKey

            return (
              <button
                key={bizKey}
                type="button"
                onClick={() => selectNegocio(bizKey)}
                className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-lg transition-all duration-150 text-left mb-1 last:mb-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FAF7F4] border border-[#E2D9CC] text-[#241C15]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                      bizKey === '3D'
                        ? 'bg-[#A36F4C] text-white'
                        : 'bg-[#6366F1] text-white'
                    }`}
                  >
                    {bizKey === '3D' ? (
                      <Box className="w-3.5 h-3.5 stroke-[2.2]" />
                    ) : (
                      <Dices className="w-3.5 h-3.5 stroke-[2.2]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#241C15] leading-none">
                        {biz.name}
                      </span>
                      <span
                        className={`text-[8px] font-bold px-1 py-0.2 rounded border ${
                          bizKey === '3D'
                            ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                            : 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]'
                        }`}
                      >
                        {biz.id}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#75695D] truncate mt-0.5">
                      {biz.subname}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <Check
                    className={`w-4 h-4 shrink-0 ${
                      bizKey === '3D' ? 'text-[#A36F4C]' : 'text-[#6366F1]'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
