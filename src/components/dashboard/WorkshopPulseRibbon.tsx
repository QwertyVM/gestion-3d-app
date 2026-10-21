'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { 
  Hammer, 
  ArrowRight, 
  CircleDot, 
  CheckCircle2, 
  AlertTriangle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkshopPulseRibbonProps {
  pedidos: any[]
  filamentos: any[]
  is3D?: boolean
  className?: string
}

export function WorkshopPulseRibbon({
  pedidos = [],
  filamentos = [],
  is3D = true,
  className
}: WorkshopPulseRibbonProps) {
  // 1. Conteo de piezas por estado en taller
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

  // 2. Alertas de filamentos comprometidos
  const { quiebresCount, criticosCount } = useMemo(() => {
    if (!is3D || !filamentos || filamentos.length === 0) {
      return { quiebresCount: 0, criticosCount: 0 }
    }

    const demandaMap: Record<string, number> = {}

    pedidos.forEach(p => {
      const isActive = p.estado === 'PENDIENTE' || p.estado === 'EN_TALLER' || p.estado === 'EN_PRODUCCION'
      if (!isActive) return

      if (Array.isArray(p.items)) {
        p.items.forEach((item: any) => {
          const colId = item.coloresIds?.[0] || item.colorFilamentoId
          if (!colId) return
          const gramos = Number(item.gramosConsumidos || 0) * Math.max(1, Number(item.cantidad || 1))
          demandaMap[colId] = (demandaMap[colId] || 0) + gramos
        })
      }
    })

    let quiebres = 0
    let criticos = 0

    filamentos.forEach(f => {
      const colId = f.id
      const stockFisico = Number(f.stockGramos != null ? f.stockGramos : (Number(f.stockBobinas || 0) * 1000))
      const demanda = demandaMap[colId] || 0
      const stockNetoProyectado = stockFisico - demanda

      if (demanda > 0 && stockNetoProyectado < 0) {
        quiebres++
      } else if (demanda > 0 && stockNetoProyectado < 150) {
        criticos++
      }
    })

    return {
      quiebresCount: quiebres,
      criticosCount: criticos
    }
  }, [pedidos, filamentos, is3D])

  return (
    <div
      className={cn(
        'bg-card border border-border/70 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs',
        className
      )}
    >
      {/* Lado izquierdo: Título y Pulso de Taller */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-accent text-accent-foreground flex items-center justify-center border border-border/70 shrink-0">
          <Hammer className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-xs sm:text-sm">
              Pulso del Taller 3D
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary border border-border/70 text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {totalPiezasActivas} {totalPiezasActivas === 1 ? 'pieza activa' : 'piezas activas'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Estado de fabricación en máquinas y disponibilidad de material
          </p>
        </div>
      </div>

      {/* Centro: Métricas Operativas en Cápsulas Limpias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 max-w-xl md:px-3">
        {/* En Producción */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-sky-500/8 border border-sky-500/20">
          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <span className="text-[10px] text-muted-foreground block leading-none">Imprimiendo</span>
            <span className="font-mono font-bold text-sky-700 dark:text-sky-300 text-xs">
              {piezasEnProduccion} {piezasEnProduccion === 1 ? 'pieza' : 'piezas'}
            </span>
          </div>
        </div>

        {/* En Cola */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-secondary border border-border/70">
          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-muted-foreground block leading-none">En Cola</span>
            <span className="font-mono font-bold text-foreground text-xs">
              {piezasPendientes} {piezasPendientes === 1 ? 'pieza' : 'piezas'}
            </span>
          </div>
        </div>

        {/* Listas / Empaque */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 col-span-2 sm:col-span-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-muted-foreground block leading-none">Listas</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs">
              {piezasListas} {piezasListas === 1 ? 'lista' : 'listas'}
            </span>
          </div>
        </div>
      </div>

      {/* Lado derecho: Alerta de stock de filamento y Acceso al Taller */}
      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
        {quiebresCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-destructive bg-destructive/10 border border-destructive/25 px-2.5 py-1 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{quiebresCount} {quiebresCount === 1 ? 'quiebre de filamento' : 'quiebres de filamento'}</span>
          </span>
        ) : criticosCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-xl">
            <CircleDot className="w-3.5 h-3.5" />
            <span>Stock bajo en {criticosCount} {criticosCount === 1 ? 'color' : 'colores'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <CircleDot className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filamentos con stock suficiente</span>
          </span>
        )}

        {is3D && (
          <Link
            href="/taller"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <span>Ver Taller</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  )
}
