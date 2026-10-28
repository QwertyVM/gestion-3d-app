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
  CheckCircle2,
  Cpu,
  Calculator,
  Sparkles,
  ListOrdered
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  TallerDataResponse,
  PiezaTaller,
  updateEstadoPieza,
  updateEnlaceModelo
} from '@/actions/taller'
import { ProductionKpiCard } from './ProductionKpiCard'
import { ProductionQueueView } from './ProductionQueueView'
import { ProductionInsightsSection } from './ProductionInsightsSection'
import { ProductionByColorView } from './ProductionByColorView'
import { PrinterFleetWidget } from './PrinterFleetWidget'
import { SlicingCostBreakdownModal } from './SlicingCostBreakdownModal'
import { KpiExplainerModal } from '@/components/ui/KpiExplainerModal'

export function TallerClient({ data }: { data: TallerDataResponse }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedKpiExplainer, setSelectedKpiExplainer] = useState<string | null>(null)

  // Selector de Vista Activa en Taller
  const [activeTab, setActiveTab] = useState<'COLA' | 'COLORES' | 'FLOTA'>('COLA')
  const [coloresExpandidos, setColoresExpandidos] = useState<Record<string, boolean>>({})
  const [isCostModalOpen, setIsCostModalOpen] = useState(false)
  const [selectedPieceForCost, setSelectedPieceForCost] = useState<PiezaTaller | null>(null)

  // Estado optimista local y loader individual para feedback instantáneo (<50ms)
  const [piezasOpt, setPiezasOpt] = useState<Record<string, 'PENDIENTE' | 'EN_PRODUCCION' | 'EN_TALLER' | 'EMPAQUETANDO' | 'LISTO_ENTREGA' | 'ENTREGADO'>>({})
  const [enlacesOpt, setEnlacesOpt] = useState<Record<string, string | null>>({})
  const [loadingPieceId, setLoadingPieceId] = useState<string | null>(null)

  // Reset de estado optimista al recibir nuevos datos del servidor
  useEffect(() => {
    setPiezasOpt({})
    setEnlacesOpt({})
  }, [data])

  // Piezas con estado optimista integrado (incluyendo enlace del modelo)
  const todasPiezas = useMemo(() => {
    return data.piezas.map(p => {
      const opt = piezasOpt[p.id]
      const optEnlace = enlacesOpt[p.productoId] !== undefined ? enlacesOpt[p.productoId] : p.enlaceMakerworld
      return {
        ...p,
        ...(opt ? { estado: opt } : {}),
        enlaceMakerworld: optEnlace
      }
    })
  }, [data.piezas, piezasOpt, enlacesOpt])

  // Métricas dinámicas calculadas en tiempo real para el ciclo operativo de taller
  const metricasActivas = useMemo(() => {
    const pendientes = todasPiezas.filter(p => p.estado === 'PENDIENTE').reduce((sum, p) => sum + p.cantidad, 0)
    const enProduccion = todasPiezas.filter(p => p.estado === 'EN_PRODUCCION').reduce((sum, p) => sum + p.cantidad, 0)
    const enTaller = todasPiezas.filter(p => p.estado === 'EN_TALLER').reduce((sum, p) => sum + p.cantidad, 0)
    const empaquetando = todasPiezas.filter(p => p.estado === 'EMPAQUETANDO').reduce((sum, p) => sum + p.cantidad, 0)
    const listos = todasPiezas.filter(p => p.estado === 'LISTO_ENTREGA').reduce((sum, p) => sum + p.cantidad, 0)

    // Piezas por fabricar / en proceso en taller
    const piezasTaller = todasPiezas.filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_PRODUCCION' || p.estado === 'EN_TALLER' || p.estado === 'EMPAQUETANDO')

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
      totalPiezasEnTaller: enTaller,
      totalPiezasEmpaquetando: empaquetando,
      totalPiezasListas: listos,
      totalPiezasActivas: pendientes + enProduccion + enTaller + empaquetando + listos,
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

  // Acción instantánea con feedback visual y transición fluida para cambiar estado de la pieza individual
  const handleCambiarEstado = async (
    tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
    piezaId: string,
    nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'EN_TALLER' | 'EMPAQUETANDO' | 'LISTO_ENTREGA' | 'ENTREGADO'
  ) => {
    setLoadingPieceId(piezaId)

    try {
      const res = await updateEstadoPieza(tipoRegistro, piezaId, nuevoEstado)
      if (res.success) {
        setPiezasOpt(prev => ({ ...prev, [piezaId]: nuevoEstado }))
        if (nuevoEstado === 'EN_PRODUCCION') {
          toast.success('Pieza pasada a En Impresión')
        } else if (nuevoEstado === 'EN_TALLER') {
          toast.success('Pieza pasada a En Taller')
        } else if (nuevoEstado === 'EMPAQUETANDO') {
          toast.success('Pieza enviada a Empaque')
        } else if (nuevoEstado === 'LISTO_ENTREGA') {
          toast.success('Pieza marcada como Lista')
        } else if (nuevoEstado === 'ENTREGADO') {
          toast.success('Pedido marcado como Entregado')
        } else if (nuevoEstado === 'PENDIENTE') {
          toast.success('Pieza devuelta a Pendiente')
        } else {
          toast.success('Pieza actualizada')
        }
        startTransition(() => {
          router.refresh()
        })
      } else {
        toast.error(res.error || 'Error al actualizar estado')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error de conexión')
    } finally {
      setLoadingPieceId(null)
    }
  }

  // Acción instantánea con optimistic update para vincular o actualizar enlace de modelo 3D
  const handleActualizarEnlace = async (productoId: string, nuevoEnlace: string | null) => {
    setEnlacesOpt(prev => ({ ...prev, [productoId]: nuevoEnlace }))
    try {
      const res = await updateEnlaceModelo(productoId, nuevoEnlace)
      if (res.success) {
        toast.success(nuevoEnlace ? 'Enlace del modelo vinculado exitosamente' : 'Enlace del modelo eliminado')
        startTransition(() => {
          router.refresh()
        })
      } else {
        setEnlacesOpt(prev => {
          const next = { ...prev }
          delete next[productoId]
          return next
        })
        toast.error(res.error || 'Error al actualizar enlace')
      }
    } catch (err: any) {
      setEnlacesOpt(prev => {
        const next = { ...prev }
        delete next[productoId]
        return next
      })
      toast.error(err.message || 'Error de conexión')
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleToggleColorExpandido = (key: string) => {
    setColoresExpandidos(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Taller de Producción 3D
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/50">
              NOVA 3D Studio
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cola de fabricación e impresión 3D, optimización por color, control de flota y cálculo de merma.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Botón Calculadora de Costos 3D */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedPieceForCost(todasPiezas.find(p => p.estado === 'PENDIENTE') || todasPiezas[0] || null)
              setIsCostModalOpen(true)
            }}
            className="rounded-xl border-border bg-card text-foreground hover:bg-muted text-xs h-8 px-3 cursor-pointer shadow-2xs gap-1.5 transition-all"
            title="Abrir calculadora de costos reales de impresión 3D (luz, filamento, merma)"
          >
            <Calculator className="w-3.5 h-3.5 text-primary" />
            <span>Calculadora Coste 3D</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isPending}
            className="rounded-xl border-border bg-card text-foreground hover:bg-muted text-xs h-8 px-2.5 cursor-pointer shadow-2xs gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isPending ? 'animate-spin text-primary' : ''}`} />
            <span>Actualizar</span>
          </Button>

          <Link href="/pedidos">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-muted-foreground hover:text-foreground text-xs h-8 px-2.5 cursor-pointer gap-1.5 transition-all"
            >
              <span>Ver Pedidos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CICLO OPERATIVO DE TALLER: PANEL UNIFICADO CON HAIRLINE DIVIDERS       */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-border/30 grid grid-cols-2 lg:grid-cols-4 shadow-2xs mb-3">
        {/* KPI 1 - POR FABRICAR */}
        <div 
          onClick={() => setSelectedKpiExplainer('taller_por_fabricar')}
          className="p-4 sm:p-5 flex flex-col justify-between gap-3 group hover:bg-muted/10 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-muted-foreground gap-1.5">
            <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground/80 font-medium truncate">
              Por Fabricar
            </span>
            <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
          </div>

          <div className="pt-0.5">
            <div className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight text-foreground tabular-nums">
              {metricasActivas.totalPiezasPendientes}
              <span className="text-xs text-muted-foreground font-normal font-sans ml-1.5">
                {metricasActivas.totalPiezasPendientes === 1 ? 'pza' : 'uds'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground/75 mt-0.5 truncate">
              En cola de espera de impresión
            </p>
          </div>
        </div>

        {/* KPI 2 - MODELOS DISTINTOS */}
        <div 
          onClick={() => setSelectedKpiExplainer('taller_modelos_distintos')}
          className="p-4 sm:p-5 flex flex-col justify-between gap-3 group hover:bg-muted/10 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-muted-foreground gap-1.5">
            <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground/80 font-medium truncate">
              Modelos Distintos
            </span>
            <Layers className="w-3.5 h-3.5 text-muted-foreground/60" />
          </div>

          <div className="pt-0.5">
            <div className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight text-foreground tabular-nums">
              {metricasActivas.totalModelosDistintos}
              <span className="text-xs text-muted-foreground font-normal font-sans ml-1.5">
                {metricasActivas.totalModelosDistintos === 1 ? 'diseño' : 'diseños'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground/75 mt-0.5 truncate">
              Agrupados para fabricación en lote
            </p>
          </div>
        </div>

        {/* KPI 3 - COLORES ASIGNADOS */}
        <div 
          onClick={() => setSelectedKpiExplainer('taller_colores_asignados')}
          className="p-4 sm:p-5 flex flex-col justify-between gap-3 group hover:bg-muted/10 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-muted-foreground gap-1.5">
            <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground/80 font-medium truncate">
              Colores Requeridos
            </span>
            <Palette className="w-3.5 h-3.5 text-muted-foreground/60" />
          </div>

          <div className="pt-0.5">
            <div className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight text-foreground tabular-nums">
              {metricasActivas.totalColoresAsignados}
              <span className="text-xs text-muted-foreground font-normal font-sans ml-1.5">
                {metricasActivas.totalColoresAsignados === 1 ? 'bobina' : 'bobinas'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px] text-muted-foreground/75 truncate">Filamentos:</span>
              {metricasActivas.coloresPreview.length > 0 && (
                <div className="flex items-center -space-x-1 shrink-0 ml-1">
                  {metricasActivas.coloresPreview.slice(0, 4).map((col, idx) => (
                    <span
                      key={idx}
                      className="w-2.5 h-2.5 rounded-full border border-border/50 inline-block shrink-0"
                      style={{ backgroundColor: col.codigoHex }}
                      title={col.nombreColor}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI 4 - LISTAS PARA DESPACHO */}
        <div 
          onClick={() => setSelectedKpiExplainer('taller_listas_despacho')}
          className="p-4 sm:p-5 flex flex-col justify-between gap-3 group hover:bg-muted/10 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-muted-foreground gap-1.5">
            <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground/80 font-medium truncate">
              Listas p/ Entrega
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="pt-0.5">
            <div className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight text-foreground tabular-nums">
              {metricasActivas.totalPiezasListas}
              <span className="text-xs text-muted-foreground font-normal font-sans ml-1.5">
                {metricasActivas.totalPiezasListas === 1 ? 'pieza' : 'piezas'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground/75 mt-0.5 truncate">
              Listas para empaque o recojo
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ESTADÍSTICAS OPERATIVAS (TOP MODELOS Y COLORES MÁS USADOS)             */}
      {/* ========================================================================= */}
      <ProductionInsightsSection piezas={piezasParaEstadisticas} />

      {/* ========================================================================= */}
      {/* 4. SELECTOR DE VISTAS OPERATIVAS (SEGMENTED CONTROL MODERNO)               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/50">
        <div className="inline-flex items-center p-0.5 rounded-xl bg-muted/40 border border-border/60 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('COLA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COLA'
                ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-primary" />
            <span>Cola de Producción ({metricasActivas.totalPiezasActivas})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COLORES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COLORES'
                ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            <span>Tanda por Color ({data.gruposPorColor?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FLOTA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FLOTA'
                ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-500" />
            <span>Flota de Impresoras 3D</span>
          </button>
        </div>

        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          {activeTab === 'COLA' && 'Orden cronológico según fecha pactada de entrega al cliente'}
          {activeTab === 'COLORES' && 'Agrupación para minimizar cambios de filamento y purgas en taller'}
          {activeTab === 'FLOTA' && 'Estado de las máquinas, asignación directa y consumo eléctrico en soles'}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 5. VISTAS CONDICIONALES SEGÚN TAB SELECCIONADA                            */}
      {/* ========================================================================= */}
      {activeTab === 'COLA' && (
        <ProductionQueueView
          piezas={todasPiezas}
          loadingPieceId={loadingPieceId}
          onCambiarEstado={handleCambiarEstado}
          onActualizarEnlace={handleActualizarEnlace}
          metricasActivas={metricasActivas}
        />
      )}

      {activeTab === 'COLORES' && (
        <ProductionByColorView
          grupos={data.gruposPorColor || []}
          coloresExpandidos={coloresExpandidos}
          onToggleExpandido={handleToggleColorExpandido}
        />
      )}

      {activeTab === 'FLOTA' && (
        <PrinterFleetWidget
          piezasPendientes={todasPiezas}
          onAssignToPrinter={(printerId, pieza) => {
            handleCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_PRODUCCION')
          }}
        />
      )}

      {/* Modal de Cálculo Real de Costes 3D */}
      <SlicingCostBreakdownModal
        open={isCostModalOpen}
        onOpenChange={setIsCostModalOpen}
        pieza={selectedPieceForCost}
      />

      {/* Modal Explicador de Fórmulas y Transacciones de KPI */}
      <KpiExplainerModal
        isOpen={!!selectedKpiExplainer}
        onClose={() => setSelectedKpiExplainer(null)}
        kpiId={selectedKpiExplainer}
      />
    </div>
  )
}

// Aliases para máxima compatibilidad con las especificaciones de arquitectura
export { TallerClient as ProductionDashboardView, TallerClient as TallerProduccionPage }

