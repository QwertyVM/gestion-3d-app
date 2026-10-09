'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Boxes,
  Palette,
  TrendingUp,
  ChevronDown,
  Inbox
} from 'lucide-react'
import { PiezaTaller } from '@/actions/taller'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'

export interface ProductionInsightsSectionProps {
  piezas: PiezaTaller[]
}

export function ProductionInsightsSection({ piezas }: ProductionInsightsSectionProps) {
  const [colapsado, setColapsado] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Trigger para animación suave ease-out al montar
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // 1. Agregación de Modelos Más Fabricados (Top 5)
  const { topModelos, totalUnidadesModelos, maxModelosUnidades } = useMemo(() => {
    const map = new Map<
      string,
      {
        nombreModelo: string
        totalUnidades: number
        pedidosSet: Set<string>
        categoria?: string
      }
    >()
    let totalUnidades = 0

    piezas.forEach((p) => {
      const nombre = (p.nombreModelo || 'Pieza 3D').trim()
      const cant = Number(p.cantidad || 1)
      totalUnidades += cant

      if (!map.has(nombre)) {
        map.set(nombre, {
          nombreModelo: nombre,
          totalUnidades: 0,
          pedidosSet: new Set(),
          categoria: p.lineaCategoria
        })
      }
      const entry = map.get(nombre)!
      entry.totalUnidades += cant
      if (p.codigoRef || p.registroId) {
        entry.pedidosSet.add(p.codigoRef || p.registroId)
      }
    })

    const sorted = Array.from(map.values())
      .sort((a, b) => b.totalUnidades - a.totalUnidades)
      .slice(0, 3)
      .map((m) => ({
        ...m,
        pedidosCount: m.pedidosSet.size
      }))

    const maxUnits = sorted.length > 0 ? sorted[0].totalUnidades : 1

    return {
      topModelos: sorted,
      totalUnidadesModelos: totalUnidades,
      maxModelosUnidades: maxUnits
    }
  }, [piezas])

  // 2. Agregación de Colores de Filamento Más Usados (Top 5)
  const { topColores, variedadColores, maxColorUsos } = useMemo(() => {
    const map = new Map<
      string,
      {
        nombreColor: string
        codigoHex: string
        tipoMaterial: string
        usos: number
        pedidosSet: Set<string>
      }
    >()
    let totalUsos = 0

    piezas.forEach((p) => {
      const cant = Number(p.cantidad || 1)
      const pedidoKey = p.codigoRef || p.registroId || 'pedido'

      if (p.colores && p.colores.length > 0) {
        p.colores.forEach((c) => {
          const colorName = (c.nombreColor || 'Sin color').trim()
          totalUsos += cant

          if (!map.has(colorName)) {
            map.set(colorName, {
              nombreColor: colorName,
              codigoHex: c.codigoHex || '#94A3B8',
              tipoMaterial: c.tipoMaterial || 'PLA',
              usos: 0,
              pedidosSet: new Set()
            })
          }
          const entry = map.get(colorName)!
          entry.usos += cant
          entry.pedidosSet.add(pedidoKey)
        })
      } else if (p.nombreColor && p.nombreColor !== 'Sin especificar') {
        const parts = p.nombreColor.split(' + ').map((s) => s.trim())
        parts.forEach((name) => {
          totalUsos += cant
          if (!map.has(name)) {
            map.set(name, {
              nombreColor: name,
              codigoHex: p.codigoHex || '#94A3B8',
              tipoMaterial: p.tipoMaterial || 'PLA',
              usos: 0,
              pedidosSet: new Set()
            })
          }
          const entry = map.get(name)!
          entry.usos += cant
          entry.pedidosSet.add(pedidoKey)
        })
      }
    })

    const variedad = map.size
    const sorted = Array.from(map.values())
      .sort((a, b) => b.usos - a.usos)
      .slice(0, 3)
      .map((c) => ({
        ...c,
        pedidosCount: c.pedidosSet.size,
        porcentaje: totalUsos > 0 ? Math.round((c.usos / totalUsos) * 100) : 0
      }))

    const maxUsos = sorted.length > 0 ? sorted[0].usos : 1

    return {
      topColores: sorted,
      totalUsosColores: totalUsos,
      variedadColores: variedad,
      maxColorUsos: maxUsos
    }
  }, [piezas])

  return (
    <TooltipProvider delay={100}>
      <section className="mb-6 space-y-3">
        {/* Encabezado colapsable con control sutil */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Estadísticas Operativas de Producción
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setColapsado((prev) => !prev)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer transition-colors"
            aria-expanded={!colapsado}
          >
            <span>{colapsado ? 'Mostrar métricas' : 'Ocultar métricas'}</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                !colapsado && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Bloque de Métricas Visuales (Grid de 2 Columnas) */}
        {!colapsado && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
            {/* =================================================================== */}
            {/* COLUMNA IZQUIERDA: TARJETA 1 - MODELOS MÁS FABRICADOS (TOP 5)       */}
            {/* =================================================================== */}
            <div className="h-full bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
              {/* Cabecera de la Tarjeta */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        Modelos Más Fabricados
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Histórico de producción acumulada
                      </p>
                    </div>
                  </div>
                  <span className="bg-secondary border border-border text-foreground text-xs font-semibold px-2.5 py-1 rounded-md shrink-0">
                    {totalUnidadesModelos} {totalUnidadesModelos === 1 ? 'ud acumulada' : 'uds acumuladas'}
                  </span>
                </div>

                {/* Lista de Filas del Ranking */}
                {topModelos.length > 0 ? (
                  <div className="space-y-3.5">
                    {topModelos.map((modelo, idx) => {
                      const pos = idx + 1
                      const pctRelativo = Math.max(8, Math.round((modelo.totalUnidades / maxModelosUnidades) * 100))
                      const tooltipMsg = `${modelo.nombreModelo}: ${modelo.totalUnidades} ${
                        modelo.totalUnidades === 1 ? 'unidad' : 'unidades'
                      } en ${modelo.pedidosCount} ${
                        modelo.pedidosCount === 1 ? 'pedido' : 'pedidos'
                      }`

                      return (
                        <Tooltip key={modelo.nombreModelo}>
                          <TooltipTrigger
                            render={
                              <div className="group hover:bg-secondary/40 rounded-lg p-1.5 -mx-1.5 transition-colors duration-150 cursor-default">
                                <div className="flex items-center justify-between gap-2.5 mb-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {/* Indicador de posición (#1 dorado/primary, #2-5 secondary) */}
                                    <span
                                      className={cn(
                                        'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0',
                                        pos === 1
                                          ? 'bg-primary text-primary-foreground shadow-2xs'
                                          : 'bg-secondary text-muted-foreground border border-border/60'
                                      )}
                                    >
                                      {pos}
                                    </span>
                                    <span className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-[260px]">
                                      {modelo.nombreModelo}
                                    </span>
                                  </div>
                                  <span className="text-xs font-bold text-foreground text-right shrink-0 font-mono">
                                    {modelo.totalUnidades} {modelo.totalUnidades === 1 ? 'unidad' : 'unidades'}
                                  </span>
                                </div>

                                {/* Barra de proporción horizontal artesanal */}
                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1.5">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                    style={{ width: mounted ? `${pctRelativo}%` : '0%' }}
                                  />
                                </div>
                              </div>
                            }
                          />
                          <TooltipContent sideOffset={4} className="text-xs max-w-xs font-medium">
                            <span>{tooltipMsg}</span>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                    <Inbox className="w-7 h-7 text-muted-foreground stroke-[1.5]" />
                    <p className="text-xs italic text-muted-foreground">
                      Sin suficientes impresiones registradas para generar el ranking
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================================== */}
            {/* COLUMNA DERECHA: TARJETA 2 - COLORES DE FILAMENTO MÁS USADOS (TOP 5)*/}
            {/* =================================================================== */}
            <div className="h-full bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
              {/* Cabecera de la Tarjeta */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        Colores Más Utilizados
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Frecuencia de filamentos en pedidos
                      </p>
                    </div>
                  </div>
                  <span className="bg-secondary border border-border text-foreground text-xs font-semibold px-2.5 py-1 rounded-md shrink-0">
                    {variedadColores} {variedadColores === 1 ? 'tono' : 'tonos'}
                  </span>
                </div>

                {/* Lista de Filas del Ranking */}
                {topColores.length > 0 ? (
                  <div className="space-y-3.5">
                    {topColores.map((color, idx) => {
                      const pos = idx + 1
                      const pctRelativo = Math.max(8, Math.round((color.usos / maxColorUsos) * 100))
                      const tooltipMsg = `${color.nombreColor}: utilizado en el ${color.porcentaje}% de las piezas (${color.usos} en ${color.pedidosCount} pedidos)`

                      return (
                        <Tooltip key={`${color.nombreColor}-${idx}`}>
                          <TooltipTrigger
                            render={
                              <div className="group hover:bg-secondary/40 rounded-lg p-1.5 -mx-1.5 transition-colors duration-150 cursor-default">
                                <div className="flex items-center justify-between gap-2.5 mb-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {/* Indicador de posición */}
                                    <span
                                      className={cn(
                                        'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0',
                                        pos === 1
                                          ? 'bg-primary text-primary-foreground shadow-2xs'
                                          : 'bg-secondary text-muted-foreground border border-border/60'
                                      )}
                                    >
                                      {pos}
                                    </span>

                                    {/* Muestrario de color con dot nítido */}
                                    <span
                                      className="w-4 h-4 rounded-full border border-border/80 shadow-2xs shrink-0"
                                      style={{ backgroundColor: color.codigoHex }}
                                      title={color.nombreColor}
                                    />

                                    {/* Nombre del color y micro-chip de material */}
                                    <span className="text-xs font-bold text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                                      {color.nombreColor}
                                    </span>
                                    <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                      {color.tipoMaterial}
                                    </span>
                                  </div>

                                  <span className="text-xs font-bold text-foreground text-right shrink-0 font-mono">
                                    {color.usos} {color.usos === 1 ? 'pieza' : 'piezas'}
                                  </span>
                                </div>

                                {/* Barra de proporción horizontal artesanal */}
                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1.5">
                                  <div
                                    className="h-full bg-accent-foreground/80 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: mounted ? `${pctRelativo}%` : '0%' }}
                                  />
                                </div>
                              </div>
                            }
                          />
                          <TooltipContent sideOffset={4} className="text-xs max-w-xs font-medium">
                            <span>{tooltipMsg}</span>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                    <Inbox className="w-7 h-7 text-muted-foreground stroke-[1.5]" />
                    <p className="text-xs italic text-muted-foreground">
                      Sin suficientes impresiones registradas para generar el ranking
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </TooltipProvider>
  )
}
