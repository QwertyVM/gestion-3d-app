import React from 'react'
import { Box, Dices } from 'lucide-react'
import { useBusiness } from '@/context/BusinessContext'

interface BusinessSwitcherProps {
  compact?: boolean
  className?: string
}

export function BusinessSwitcher({ compact = false, className = '' }: BusinessSwitcherProps) {
  const { config, is3D } = useBusiness()

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-card border border-border/60 shadow-none">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Brand Avatar */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${
              is3D ? 'bg-amber-600/90' : 'bg-indigo-600/90'
            }`}
          >
            {is3D ? <Box className="w-4 h-4 stroke-[2.2]" /> : <Dices className="w-4 h-4 stroke-[2.2]" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs tracking-tight text-foreground truncate">
                {config.name}
              </span>
              <span
                className={`text-[9px] font-mono font-medium px-1.5 py-0.2 rounded-md border ${
                  is3D
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                }`}
              >
                {config.id}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {config.badge}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
