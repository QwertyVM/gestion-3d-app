'use client'

import React from 'react'
import { FilamentoOption } from './types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ColorDotProps {
  filamento: FilamentoOption
  className?: string
}

export function ColorDot({ filamento, className = '' }: ColorDotProps) {
  const label = `${filamento.nombreColor}${filamento.tipoMaterial ? ` • ${filamento.tipoMaterial}` : ''}`

  return (
    <TooltipProvider delay={100}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              tabIndex={0}
              role="img"
              aria-label={label}
              className={cn(
                'w-2 h-2 rounded-full border border-black/15 shadow-2xs mr-1 inline-block hover:scale-125 transition-transform duration-150 cursor-pointer shrink-0',
                className
              )}
              style={{ backgroundColor: filamento.codigoHex || '#1E1E1E' }}
            />
          }
        />
        <TooltipContent
          sideOffset={4}
          className="bg-foreground text-background text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5 z-50 pointer-events-none select-none"
        >
          <span>{filamento.nombreColor}</span>
          {filamento.tipoMaterial && (
            <span className="text-muted/80 text-[10px]">• {filamento.tipoMaterial}</span>
          )}
          {filamento.codigoHex && (
            <span className="font-mono text-[9px] opacity-75 text-muted/70">
              ({filamento.codigoHex})
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
