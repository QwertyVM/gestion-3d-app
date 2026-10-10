'use client'

import React, { useState, useMemo } from 'react'
import { Search, Boxes, Sparkles, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PiezaTaller } from '@/actions/taller'
import { PrintJobsQueueTable } from './PrintJobsQueueTable'
import { ConfirmarAccionPiezaModal } from './ConfirmarAccionPiezaModal'
import { VincularModeloModal } from './VincularModeloModal'

export interface ProductionQueueViewProps {
  piezas: PiezaTaller[]
  loadingPieceId?: string | null
  onCambiarEstado: (
    tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
    piezaId: string,
    nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'
  ) => Promise<void> | void
  onActualizarEnlace?: (productoId: string, nuevoEnlace: string | null) => Promise<void> | void
  metricasActivas: {
    totalPiezasPendientes: number
    totalPiezasEnProduccion: number
    totalPiezasListas: number
    totalPiezasActivas: number
  }
}

type FiltroEstado = 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'TODOS'

export function ProductionQueueView({
  piezas,
  loadingPieceId,
  onCambiarEstado,
  onActualizarEnlace,
  metricasActivas
}: ProductionQueueViewProps) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroMaterial, setFiltroMaterial] = useState<string>('TODOS')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODOS')

  // Estado para el modal de confirmación
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPieza, setModalPieza] = useState<PiezaTaller | null>(null)
  const [modalModo, setModalModo] = useState<'INICIAR' | 'REABRIR'>('INICIAR')
  const [isModalSubmitting, setIsModalSubmitting] = useState(false)

  // Estado para el modal de vincular enlace del modelo 3D
  const [vincularModalOpen, setVincularModalOpen] = useState(false)
  const [piezaParaVincular, setPiezaParaVincular] = useState<PiezaTaller | null>(null)
  const [isVincularSubmitting, setIsVincularSubmitting] = useState(false)

  // Extraer lista única de materiales reales presentes en las piezas
  const materialesDisponibles = useMemo(() => {
    const setMats = new Set<string>()
    piezas.forEach((p) => {
      if (p.tipoMaterial && p.tipoMaterial.trim()) {
        setMats.add(p.tipoMaterial.trim().toUpperCase())
      }
    })
    return Array.from(setMats).sort()
  }, [piezas])

  // Filtrado reactivo de piezas
  const piezasFiltradas = useMemo(() => {
    let result = [...piezas]

    // 1. Búsqueda por texto (pieza, cliente, código, color, personalización)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.nombreModelo.toLowerCase().includes(q) ||
          p.cliente.toLowerCase().includes(q) ||
          p.codigoRef.toLowerCase().includes(q) ||
          p.nombreColor.toLowerCase().includes(q) ||
          (p.personalizacion && p.personalizacion.toLowerCase().includes(q))
      )
    }

    // 2. Filtro rápido por material
    if (filtroMaterial !== 'TODOS') {
      result = result.filter(
        (p) => p.tipoMaterial?.trim().toUpperCase() === filtroMaterial
      )
    }

    // 3. Filtro por estado
    if (filtroEstado !== 'TODOS') {
      result = result.filter((p) => p.estado === filtroEstado)
    }

    return result
  }, [piezas, busqueda, filtroMaterial, filtroEstado])

  // Desglose por etapas operativas
  const piezasPendientes = useMemo(
    () => piezasFiltradas.filter((p) => p.estado === 'PENDIENTE'),
    [piezasFiltradas]
  )
  const piezasEnProduccion = useMemo(
    () => piezasFiltradas.filter((p) => p.estado === 'EN_PRODUCCION'),
    [piezasFiltradas]
  )
  const piezasListas = useMemo(
    () => piezasFiltradas.filter((p) => p.estado === 'LISTO_ENTREGA'),
    [piezasFiltradas]
  )

  // Handlers para abrir modal de confirmación
  const handleRequestIniciar = (pieza: PiezaTaller) => {
    setModalPieza(pieza)
    setModalModo('INICIAR')
    setModalOpen(true)
  }

  const handleRequestReabrir = (pieza: PiezaTaller) => {
    setModalPieza(pieza)
    setModalModo('REABRIR')
    setModalOpen(true)
  }

  const handleModalConfirm = async (pieza: PiezaTaller) => {
    setIsModalSubmitting(true)
    try {
      if (modalModo === 'INICIAR') {
        await onCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_PRODUCCION')
      } else {
        await onCambiarEstado(pieza.tipoRegistro, pieza.id, 'PENDIENTE')
      }
      setModalOpen(false)
    } finally {
      setIsModalSubmitting(false)
    }
  }

  // Handlers para modal de vincular enlace del modelo 3D
  const handleRequestVincular = (pieza: PiezaTaller) => {
    setPiezaParaVincular(pieza)
    setVincularModalOpen(true)
  }

  const handleConfirmVincular = async (productoId: string, nuevoEnlace: string | null) => {
    setIsVincularSubmitting(true)
    try {
      if (onActualizarEnlace) {
        await onActualizarEnlace(productoId, nuevoEnlace)
      }
      setVincularModalOpen(false)
    } finally {
      setIsVincularSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 mb-8 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* BARRA UNIFICADA DE FILTROS, BÚSQUEDA Y CHIPS DE MATERIAL                   */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Input de Búsqueda Unificado */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por modelo, cliente, pedido (#PED-XXX) o color..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-10 rounded-xl border-input bg-card pl-9 text-sm w-full focus-visible:ring-1 focus-visible:ring-primary text-foreground placeholder:text-muted-foreground shadow-2xs"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Control de Estados Operativos */}
          <div className="bg-secondary/60 p-1 rounded-xl flex items-center gap-1 shrink-0 overflow-x-auto max-w-full">
            {[
              { id: 'PENDIENTE', label: 'Pendientes', count: metricasActivas.totalPiezasPendientes },
              { id: 'EN_PRODUCCION', label: 'En Impresión', count: metricasActivas.totalPiezasEnProduccion },
              { id: 'LISTO_ENTREGA', label: 'Listos', count: metricasActivas.totalPiezasListas },
              { id: 'TODOS', label: 'Todos', count: metricasActivas.totalPiezasActivas }
            ].map((st) => {
              const isSelected = filtroEstado === st.id
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setFiltroEstado(st.id as FiltroEstado)}
                  className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-card text-foreground font-bold shadow-2xs border border-border/80'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
                  }`}
                >
                  <span>{st.label}</span>
                  <span className="font-mono text-[11px] opacity-75">({st.count})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chips de Filtro Rápido por Material (PLA, PETG, ABS, etc.) */}
        {materialesDisponibles.length > 0 && (
          <div className="pt-2 border-t border-border/60 flex items-center gap-2 overflow-x-auto pb-0.5 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Material:
            </span>

            <button
              type="button"
              onClick={() => setFiltroMaterial('TODOS')}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
                filtroMaterial === 'TODOS'
                  ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              Todos
            </button>

            {materialesDisponibles.map((mat) => (
              <button
                key={mat}
                type="button"
                onClick={() => setFiltroMaterial(mat)}
                className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
                  filtroMaterial === mat
                    ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {mat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CONTENEDORES DE ETAPAS OPERATIVAS CON IDENTIDAD CROMÁTICA SEMÁNTICA        */}
      {/* ========================================================================= */}
      {piezasFiltradas.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-muted text-muted-foreground/50 flex items-center justify-center mx-auto mb-3 border border-border">
            <Boxes className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">
            No se encontraron piezas con los filtros activos
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {busqueda || filtroMaterial !== 'TODOS'
              ? 'Prueba modificando el texto de búsqueda o restableciendo los filtros de material.'
              : 'No hay piezas registradas en esta fase de producción.'}
          </p>
          {(busqueda || filtroMaterial !== 'TODOS' || filtroEstado !== 'TODOS') && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBusqueda('')
                  setFiltroMaterial('TODOS')
                  setFiltroEstado('TODOS')
                }}
                className="rounded-xl border-border text-xs cursor-pointer"
              >
                Restablecer todos los filtros
              </Button>
            </div>
          )}
        </div>
      ) : filtroEstado === 'TODOS' ? (
        <div className="space-y-6">
          {/* 1. Etapa Pendiente / En Cola (Ámbar cálido) */}
          <PrintJobsQueueTable
            piezas={piezasPendientes}
            etapa="PENDIENTE"
            titulo="Piezas Pendientes"
            subtitulo="Piezas en cola esperando asignación de cama de impresión y bobina."
            badgeCount={piezasPendientes.length}
            loadingPieceId={loadingPieceId}
            onCambiarEstado={onCambiarEstado}
            onRequestIniciar={handleRequestIniciar}
            onRequestReabrir={handleRequestReabrir}
            onVincularUrl={handleRequestVincular}
          />

          {/* 2. Etapa En Impresión (Terracota NOVA) */}
          <PrintJobsQueueTable
            piezas={piezasEnProduccion}
            etapa="EN_PRODUCCION"
            titulo="Piezas en Impresión"
            subtitulo="Piezas actualmente en proceso activo de impresión 3D en taller."
            badgeCount={piezasEnProduccion.length}
            loadingPieceId={loadingPieceId}
            onCambiarEstado={onCambiarEstado}
            onRequestIniciar={handleRequestIniciar}
            onRequestReabrir={handleRequestReabrir}
            onVincularUrl={handleRequestVincular}
          />

          {/* 3. Etapa Lista para Entrega (Verde salvia artesanal) */}
          <PrintJobsQueueTable
            piezas={piezasListas}
            etapa="LISTO_ENTREGA"
            titulo="Piezas Listas para Entrega"
            subtitulo="Piezas impresas y verificadas listas para despacho o recojo en taller."
            badgeCount={piezasListas.length}
            loadingPieceId={loadingPieceId}
            onCambiarEstado={onCambiarEstado}
            onRequestIniciar={handleRequestIniciar}
            onRequestReabrir={handleRequestReabrir}
            onVincularUrl={handleRequestVincular}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {filtroEstado === 'PENDIENTE' && (
            <PrintJobsQueueTable
              piezas={piezasPendientes}
              etapa="PENDIENTE"
              titulo="Piezas Pendientes"
              subtitulo="Listado priorizado de piezas que requieren fabricación en taller."
              badgeCount={piezasPendientes.length}
              loadingPieceId={loadingPieceId}
              onCambiarEstado={onCambiarEstado}
              onRequestIniciar={handleRequestIniciar}
              onRequestReabrir={handleRequestReabrir}
              onVincularUrl={handleRequestVincular}
            />
          )}

          {filtroEstado === 'EN_PRODUCCION' && (
            <PrintJobsQueueTable
              piezas={piezasEnProduccion}
              etapa="EN_PRODUCCION"
              titulo="Piezas en Impresión"
              subtitulo="Piezas en proceso activo de impresión 3D en taller."
              badgeCount={piezasEnProduccion.length}
              loadingPieceId={loadingPieceId}
              onCambiarEstado={onCambiarEstado}
              onRequestIniciar={handleRequestIniciar}
              onRequestReabrir={handleRequestReabrir}
              onVincularUrl={handleRequestVincular}
            />
          )}

          {filtroEstado === 'LISTO_ENTREGA' && (
            <PrintJobsQueueTable
              piezas={piezasListas}
              etapa="LISTO_ENTREGA"
              titulo="Piezas Listas para Entrega"
              subtitulo="Piezas terminadas listas para entrega al cliente o despacho."
              badgeCount={piezasListas.length}
              loadingPieceId={loadingPieceId}
              onCambiarEstado={onCambiarEstado}
              onRequestIniciar={handleRequestIniciar}
              onRequestReabrir={handleRequestReabrir}
              onVincularUrl={handleRequestVincular}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMACIÓN PARA INICIAR IMPRESIÓN O REABRIR PIEZA              */}
      {/* ========================================================================= */}
      <ConfirmarAccionPiezaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        pieza={modalPieza}
        modo={modalModo}
        isLoading={isModalSubmitting}
        onConfirm={handleModalConfirm}
      />

      {/* ========================================================================= */}
      {/* MODAL PARA VINCULAR / EDITAR ENLACE DEL MODELO 3D                         */}
      {/* ========================================================================= */}
      <VincularModeloModal
        open={vincularModalOpen}
        onOpenChange={setVincularModalOpen}
        pieza={piezaParaVincular}
        isLoading={isVincularSubmitting}
        onConfirm={handleConfirmVincular}
      />
    </div>
  )
}
