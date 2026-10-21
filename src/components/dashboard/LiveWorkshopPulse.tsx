'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { 
  Hammer, 
  CircleDot, 
  ArrowRight, 
  CheckCircle2
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface LiveWorkshopPulseProps {
  pedidos: any[]
  filamentos: any[]
  is3D?: boolean
  className?: string
}

export function LiveWorkshopPulse({ pedidos = [], filamentos = [], is3D = true, className }: LiveWorkshopPulseProps) {
  // 1. Desglose del Flujo Activo del Taller (Pendientes -> Imprimiendo -> Listos)
  const { piezasPendientes, piezasEnProduccion, piezasListas, totalPiezasActivas } = useMemo(() => {
    let pendientes = 0
    let enProduccion = 0
    let listas = 0

    pedidos.forEach(p => {
      if (p.estado === 'ENTREGADO' || p.estado === 'CANCELADO') return

      if (Array.isArray(p.items) && p.items.length > 0) {
        p.items.forEach((item: any) => {
          const qty = Math.max(1, Number(item.cantidad || 1))
          const st = item.estado || p.estado
          if (st === 'EN_PRODUCCION' || st === 'EN_TALLER') {
            enProduccion += qty
          } else if (st === 'LISTO_ENTREGA' || st === 'EMPAQUETANDO') {
            listas += qty
          } else {
            pendientes += qty
          }
        })
      } else {
        const qty = Math.max(1, Number(p.cantidad || 1))
        if (p.estado === 'EN_PRODUCCION' || p.estado === 'EN_TALLER') {
          enProduccion += qty
        } else if (p.estado === 'LISTO_ENTREGA' || p.estado === 'EMPAQUETANDO') {
          listas += qty
        } else {
          pendientes += qty
        }
      }
    })

    return {
      piezasPendientes: pendientes,
      piezasEnProduccion: enProduccion,
      piezasListas: listas,
      totalPiezasActivas: pendientes + enProduccion + listas
    }
  }, [pedidos])

  // 2. Cálculo de Filamentos Comprometidos (SOLO alertas reales cuando hay demanda activa)
  const { quiebresFilamento, alertasCriticas } = useMemo(() => {
    if (!is3D || !filamentos || filamentos.length === 0) {
      return { quiebresFilamento: [], alertasCriticas: [] }
    }

    // Mapear demanda en gramos y registrar los pedidos involucrados
    const demandaMap: Record<string, { 
      gramosComprometidos: number; 
      pedidosCount: number;
      pedidosAfectados: Array<{ codigo: string; cliente: string; gramos: number }> 
    }> = {}

    pedidos.forEach(p => {
      const isActive = p.estado === 'PENDIENTE' || p.estado === 'EN_TALLER' || p.estado === 'EN_PRODUCCION'
      if (!isActive) return

      if (Array.isArray(p.items)) {
        p.items.forEach((item: any) => {
          const colId = item.coloresIds?.[0] || item.colorFilamentoId
          if (!colId) return
          const gramos = Number(item.gramosConsumidos || 0) * Math.max(1, Number(item.cantidad || 1))
          if (!demandaMap[colId]) {
            demandaMap[colId] = { gramosComprometidos: 0, pedidosCount: 0, pedidosAfectados: [] }
          }
          demandaMap[colId].gramosComprometidos += gramos
          demandaMap[colId].pedidosCount += 1
          if (!demandaMap[colId].pedidosAfectados.some(pa => pa.codigo === p.codigo)) {
            demandaMap[colId].pedidosAfectados.push({
              codigo: p.codigo,
              cliente: p.cliente,
              gramos: Math.round(gramos)
            })
          }
        })
      }
    })

    const quiebres: any[] = []
    const criticos: any[] = []

    filamentos.forEach(f => {
      const colId = f.id
      const stockFisico = Number(f.stockGramos != null ? f.stockGramos : (Number(f.stockBobinas || 0) * 1000))
      const demanda = demandaMap[colId]?.gramosComprometidos || 0
      const stockNetoProyectado = stockFisico - demanda
      const pedidosAfectados = demandaMap[colId]?.pedidosAfectados || []

      // Un quiebre SOLO es real si hay demanda activa y el stock es insuficiente
      const esQuiebre = demanda > 0 && stockNetoProyectado < 0
      const faltan = Math.abs(Math.round(stockNetoProyectado))
      
      // Crítico solo si la cola activa dejará menos de 150g
      const esCritico = !esQuiebre && demanda > 0 && stockNetoProyectado < 150

      if (esQuiebre && faltan > 0) {
        quiebres.push({
          id: f.id,
          nombreColor: f.nombreColor,
          codigoHex: f.codigoHex,
          stockFisico: Math.round(stockFisico),
          demanda: Math.round(demanda),
          stockNetoProyectado: Math.round(stockNetoProyectado),
          faltanGramos: faltan,
          pedidosAfectados
        })
      } else if (esCritico) {
        criticos.push({
          id: f.id,
          nombreColor: f.nombreColor,
          codigoHex: f.codigoHex,
          stockFisico: Math.round(stockFisico),
          demanda: Math.round(demanda),
          stockNetoProyectado: Math.round(stockNetoProyectado),
          pedidosAfectados
        })
      }
    })

    return {
      quiebresFilamento: quiebres,
      alertasCriticas: criticos
    }
  }, [pedidos, filamentos, is3D])

  // Porcentajes de barra para el embudo de producción
  const pctPendiente = totalPiezasActivas > 0 ? (piezasPendientes / totalPiezasActivas) * 100 : 0
  const pctProduccion = totalPiezasActivas > 0 ? (piezasEnProduccion / totalPiezasActivas) * 100 : 0
  const pctListas = totalPiezasActivas > 0 ? (piezasListas / totalPiezasActivas) * 100 : 0

  return (
    <Card className={cn("bg-card border border-border/60 shadow-xs rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full min-h-[360px]", className)}>
      <CardHeader className="p-0 pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Operaciones & Taller
            </CardTitle>
            <span className="text-[11px] font-mono font-medium text-muted-foreground">
              ({totalPiezasActivas} {totalPiezasActivas === 1 ? 'pieza en cola' : 'piezas en cola'})
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {is3D && (
              <Link
                href="/taller"
                className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
              >
                <span>Taller</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            <Link
              href="/catalogo/inventario"
              className="text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1 transition-colors"
            >
              <span>Almacén</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-4 flex-1 flex flex-col justify-between space-y-4">
        {/* 1. Flujo Activo de Fabricación */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Embudo de Producción
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {totalPiezasActivas > 0 ? `${Math.round(pctListas)}% completado` : '100% al día'}
            </span>
          </div>

          {totalPiezasActivas > 0 ? (
            <div className="space-y-2.5">
              <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden flex gap-0.5">
                <div 
                  className="bg-muted-foreground/30 h-full transition-all" 
                  style={{ width: `${pctPendiente}%` }} 
                  title={`Pendientes: ${piezasPendientes}`}
                />
                <div 
                  className="bg-sky-500 h-full transition-all" 
                  style={{ width: `${pctProduccion}%` }} 
                  title={`Imprimiendo: ${piezasEnProduccion}`}
                />
                <div 
                  className="bg-emerald-500 h-full transition-all" 
                  style={{ width: `${pctListas}%` }} 
                  title={`Listas: ${piezasListas}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-0.5">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/40">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-muted-foreground text-[10px] block leading-none">En cola</span>
                    <span className="font-mono font-semibold text-foreground tabular-nums text-xs">{piezasPendientes}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-sky-500/5 border border-sky-500/20">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sky-600 dark:text-sky-400 text-[10px] block leading-none">Imprimiendo</span>
                    <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 tabular-nums text-xs">{piezasEnProduccion}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] block leading-none">Listas</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">{piezasListas}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2.5 px-3 rounded-lg bg-muted/20 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sin piezas pendientes de fabricar en cola.</span>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="border-t border-border/50" />

        {/* 2. Cobertura de Filamentos & Insumos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5 text-primary" />
              Insumos Comprometidos
            </span>
            {quiebresFilamento.length > 0 && (
              <span className="text-[10px] font-mono font-bold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-full">
                {quiebresFilamento.length} {quiebresFilamento.length === 1 ? 'quiebre proyectado' : 'quiebres proyectados'}
              </span>
            )}
          </div>

          {quiebresFilamento.length === 0 && alertasCriticas.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 py-2 px-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="text-foreground text-xs">
                Stock suficiente para todos los pedidos activos en cola.
              </span>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
              {quiebresFilamento.map(q => (
                <div 
                  key={q.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-border/60 shrink-0"
                      style={{ backgroundColor: q.codigoHex || '#888' }}
                    />
                    <span className="font-semibold text-foreground truncate text-xs">
                      {q.nombreColor}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                      ({q.pedidosAfectados.length} pedidos)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-destructive shrink-0 tabular-nums">
                    Faltan {q.faltanGramos}g
                  </span>
                </div>
              ))}
              {alertasCriticas.map(c => (
                <div 
                  key={c.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-border/60 shrink-0"
                      style={{ backgroundColor: c.codigoHex || '#888' }}
                    />
                    <span className="font-semibold text-foreground truncate text-xs">
                      {c.nombreColor}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 shrink-0 tabular-nums">
                    Quedarán ~{c.stockNetoProyectado}g
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
