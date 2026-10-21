'use client'

import React, { useState, useRef, KeyboardEvent } from 'react'
import { X, Plus, Tag as TagIcon, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface MultiTagInputProps {
  value: string[] | string // Supports both string array or comma-separated string
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  label?: string
  className?: string
  maxTags?: number
}

// Paleta de colores armónicos NOVA para los tags
const TAG_COLOR_PALETTES = [
  'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
]

export function getTagColorClass(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTES.length
  return TAG_COLOR_PALETTES[index]
}

export function MultiTagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Escribe un tag y presiona Enter...',
  label,
  className = '',
  maxTags = 10
}: MultiTagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Normalize value to array
  const currentTags: string[] = Array.isArray(value)
    ? value
    : (typeof value === 'string' && value.trim() ? value.split(',').map(s => s.trim()).filter(Boolean) : [])

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim()
    if (!clean) return
    if (currentTags.some(t => t.toLowerCase() === clean.toLowerCase())) {
      setInputValue('')
      return
    }
    if (currentTags.length >= maxTags) return

    const updated = [...currentTags, clean]
    onChange(updated)
    setInputValue('')
  }

  const handleRemoveTag = (indexToRemove: number) => {
    const updated = currentTags.filter((_, idx) => idx !== indexToRemove)
    onChange(updated)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && currentTags.length > 0) {
      e.preventDefault()
      handleRemoveTag(currentTags.length - 1)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    const isSelected = currentTags.some(t => t.toLowerCase() === suggestion.trim().toLowerCase())
    if (isSelected) {
      onChange(currentTags.filter(t => t.toLowerCase() !== suggestion.trim().toLowerCase()))
    } else {
      handleAddTag(suggestion)
    }
  }

  // Filter out suggestions that are already selected or match search
  const availableSuggestions = suggestions.filter(s => s && s.trim())

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <TagIcon className="h-3.5 w-3.5 text-primary" />
            <span>{label}</span>
          </label>
          <span className="text-[10px] text-muted-foreground">
            {currentTags.length}/{maxTags} tags
          </span>
        </div>
      )}

      {/* Input container with chips */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className="min-h-[42px] p-2 bg-background border border-border/80 rounded-xl flex flex-wrap items-center gap-1.5 focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/50 transition-all cursor-text shadow-2xs"
      >
        {currentTags.map((tag, idx) => {
          const colorClass = getTagColorClass(tag)
          return (
            <span
              key={`${tag}-${idx}`}
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border shadow-2xs transition-all ${colorClass}`}
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveTag(idx)
                }}
                className="hover:opacity-75 p-0.5 rounded-full cursor-pointer"
                title="Eliminar tag"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )
        })}

        {currentTags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) {
                handleAddTag(inputValue)
              }
            }}
            placeholder={currentTags.length === 0 ? placeholder : 'Agregar otro tag...'}
            className="flex-1 min-w-[140px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none py-1 px-1"
          />
        )}
      </div>

      {/* Sugerencias Rápidas */}
      {availableSuggestions.length > 0 && (
        <div className="space-y-1 pt-0.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Sugerencias de Tags:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {availableSuggestions.slice(0, 12).map((sug) => {
              const isSelected = currentTags.some(t => t.toLowerCase() === sug.trim().toLowerCase())
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSuggestionClick(sug)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                      : 'bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 border-border/80'
                  }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  <span>{sug}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
