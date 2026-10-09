'use client'

import React, { useState, useMemo, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Layers,
  Palette,
  Clock,
  RefreshCw,
  ExternalLink,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  TallerDataResponse,
  updateEstadoPieza
} from '@/actions/taller'
import { ProductionKpiCard } from './ProductionKpiCard'
import { ProductionQueueView } from './ProductionQueueView'
import { ProductionInsightsSection } from './ProductionInsightsSection'

export function TallerClient({ data }: { data: TallerDataResponse }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Estado optimista local y loader individual para feedback instantáneo (<50ms)
  const [piezasOpt, setPiezasOpt] = useState<Record<string, 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'>>({})
  const [loadingPieceId, setLoadingPieceId] = useState<string | null>(null)

  // Reset de estado optimista al recibir nuevos datos del servidor
  useEffect(() => {
    setPiezasOpt({})
  }, [data])

  // Piezas con estado optimista integrado
  const todasPiezas = useMemo(() => {
    return data.piezas.map(p => {
      const opt = piezasOpt[p.id]
      return opt ? { ...p, estado: opt } : p
    })
  }, [data.piezas, piezasOpt])

  // Métricas dinámicas calculadas en tiempo real para el ciclo operativo de taller
  const metricasActivas = useMemo(() => {
    const pendientes = todasPiezas.filter(p => p.estado === 'PENDIENTE').reduce((sum, p) => sum + p.cantidad, 0)
    const enProduccion = todasPiezas.filter(p => p.estado === 'EN_PRODUCCION').reduce((sum, p) => sum + p.cantidad, 0)
    const listos = todasPiezas.filter(p => p.estado === 'LISTO_ENTREGA').reduce((sum, p) => sum + p.cantidad, 0)

    // Piezas por fabricar / en proceso en taller
    const piezasTaller = todasPiezas.filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_PRODUCCION')

    // Modelos distintos de las piezas activas a fabricar
    const modelosSet = new Set<string>()
    piezasTaller.forEach(p => modelosSet.add(p.productoId || p.nombreModelo))
    const totalModelosDistintos = modelosSet.size > 0 ? modelosSet.size : data.metricas.totalModelosUnicos

    // Colores distintos asignados a la tanda activa
    const coloresMap = new Map<string, { nombreColor: string; codigoHex: string }>()
    piezasTaller.forEach(p => {
      if (p.colores && p.colores.length > 0) {
        p.colores.forEach(c => {
          const key = c.nombreColor || c.id
          if (!coloresMap.has(key)) coloresMap.set(key, { nombreColor: c.nombreColor, codigoHex: c.codigoHex })
        })
      } else if (p.nombreColor) {
        if (!coloresMap.has(p.nombreColor)) {
          coloresMap.set(p.nombreColor, { nombreColor: p.nombreColor, codigoHex: p.codigoHex || '#94A3B8' })
        }
      }
    })
    const coloresList = Array.from(coloresMap.values())
    const totalColoresAsignados = coloresList.length > 0 ? coloresList.length : data.metricas.totalColoresRequeridos

    return {
      ...data.metricas,
      totalPiezasPendientes: pendientes,
      totalPiezasEnProduccion: enProduccion,
      totalPiezasListas: listos,
      totalPiezasActivas: pendientes + enProduccion + listos,
      totalModelosDistintos,
      totalColoresAsignados,
      coloresPreview: coloresList.slice(0, 4)
    }
  }, [todasPiezas, data.metricas])

  // Piezas para estadísticas operativas (prioriza histórico completo si está disponible)
  const piezasParaEstadisticas = useMemo(() => {
    if (data.historicoPiezas && data.historicoPiezas.length > 0) {
      return data.historicoPiezas.map(p => {
        const opt = piezasOpt[p.id]
        return opt ? { ...p, estado: opt } : p
      })
    }
    return todasPiezas
  }, [data.historicoPiezas, piezasOpt, todasPiezas])

  // Acción instantánea con optimistic update para cambiar estado de la pieza individual
  const handleCambiarEstado = async (
    tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
    piezaId: string,
    nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'
  ) => {
    setPiezasOpt(prev => ({ ...prev, [piezaId]: nuevoEstado }))
    setLoadingPieceId(piezaId)

    try {
      const res = await updateEstadoPieza(tipoRegistro, piezaId, nuevoEstado)
      if (res.success) {
        if (nuevoEstado === 'EN_PRODUCCION') {
          toast.success('Pieza pasada a En Impresión')
        } else if (nuevoEstado === 'LISTO_ENTREGA') {
          toast.success('Pieza marcada como Lista para Entrega')
        } else if (nuevoEstado === 'ENTREGADO') {
          toast.success('Pedido marcado como Entregado')
        } else {
          toast.success('Pieza reabierta a Pendiente')
        }
        startTransition(() => {
          router.refresh()
        })
      } else {
        setPiezasOpt(prev => {
          const next = { ...prev }
          delete next[piezaId]
          return next
        })
        toast.error(res.error || 'Error al actualizar estado')
      }
    } catch (err: any) {
      setPiezasOpt(prev => {
        const next = { ...prev }
        delete next[piezaId]
        return next
      })
      toast.error(err.message || 'Error de conexión')
    } finally {
      setLoadingPieceId(null)
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Taller de Producción 3D
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cola de fabricación e impresión 3D, control de estados y priorización por entrega.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isPending}
            className="rounded-xl border-border bg-card text-foreground hover:bg-muted text-xs h-9 px-3 cursor-pointer shadow-xs gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isPending ? 'animate-spin text-primary' : ''}`} />
            <span>Actualizar</span>
          </Button>

          <Link href="/pedidos">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-muted-foreground hover:text-foreground text-xs h-9 px-3 cursor-pointer gap-1.5 transition-all"
            >
              <span>Ver Pedidos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CICLO OPERATIVO DE TALLER: 4 KPIS EN CUADRÍCULA BALANCEADA              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* KPI 1 - POR FABRICAR */}
        <ProductionKpiCard
          label="POR FABRICAR"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{metricasActivas.totalPiezasPendientes}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">
                {metricasActivas.totalPiezasPendientes === 1 ? 'pza' : 'uds'}
              </span>
            </span>
          }
          sublabel={
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>En espera de impresión</span>
            </div>
          }
          icon={<Clock className="w-4 h-4 text-primary/70" />}
        />

        {/* KPI 2 - MODELOS DISTINTOS */}
        <ProductionKpiCard
          label="MODELOS DISTINTOS"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{metricasActivas.totalModelosDistintos}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">
                {metricasActivas.totalModelosDistintos === 1 ? 'diseño' : 'diseños'}
              </span>
            </span>
          }
          sublabel={
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>Agrupados para lote</span>
            </div>
          }
          icon={<Layers className="w-4 h-4 text-primary/70" />}
        />

        {/* KPI 3 - COLORES ASIGNADOS */}
        <ProductionKpiCard
          label="COLORES ASIGNADOS"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{metricasActivas.totalColoresAsignados}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">
                {metricasActivas.totalColoresAsignados === 1 ? 'color' : 'colores'}
              </span>
            </span>
          }
          sublabel={
            <div className="flex items-center gap-1.5 min-w-0">
              <Palette className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">Carretes requeridos</span>
              {metricasActivas.coloresPreview.length > 0 && (
                <div className="flex items-center -space-x-1 ml-1 shrink-0">
                  {metricasActivas.coloresPreview.slice(0, 3).map((col, idx) => (
                    <span
                      key={idx}
                      className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-2xs inline-block shrink-0"
                      style={{ backgroundColor: col.codigoHex }}
                      title={col.nombreColor}
                    />
                  ))}
                </div>
              )}
            </div>
          }
          icon={<Palette className="w-4 h-4 text-primary/70" />}
        />

        {/* KPI 4 - LISTAS PARA DESPACHO */}
        <ProductionKpiCard
          label="LISTAS PARA DESPACHO"
          className="p-4.5 pr-5"
          value={
            <span className="flex items-baseline gap-1.5">
              <span>{metricasActivas.totalPiezasListas}</span>
              <span className="text-xs text-muted-foreground font-normal font-sans">
                {metricasActivas.totalPiezasListas === 1 ? 'pieza lista' : 'piezas listas'}
              </span>
            </span>
          }
          sublabel={
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">Listas para empaque o recojo</span>
            </div>
          }
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. ESTADÍSTICAS OPERATIVAS (TOP MODELOS Y COLORES MÁS USADOS)             */}
      {/* ========================================================================= */}
      <ProductionInsightsSection piezas={piezasParaEstadisticas} />

      {/* ========================================================================= */}
      {/* 4. COLA DE PRODUCCIÓN PRINCIPAL                                           */}
      {/* ========================================================================= */}
      <ProductionQueueView
        piezas={todasPiezas}
        loadingPieceId={loadingPieceId}
        onCambiarEstado={handleCambiarEstado}
        metricasActivas={metricasActivas}
      />
    </div>
  )
}

// Aliases para máxima compatibilidad con las especificaciones de arquitectura
export { TallerClient as ProductionDashboardView, TallerClient as TallerProduccionPage }
