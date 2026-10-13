'use client'

import React, { useState } from 'react'
import {
  Lock,
  Plus,
  Landmark,
  Zap,
  Globe,
  Package,
  Pencil,
  Trash2,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddBlindadoModal, BlindadoFormData } from './AddBlindadoModal'
import type { PartidaPresupuesto } from './CashFlowHubView'

export interface BcpLoanData {
  cuotaActual: number
  totalCuotas: number
  montoCuota: number
  capitalRestante: number
  pagada: boolean
}

export interface CompromisosBlindadosSectionProps {
  partidasBlindadas: PartidaPresupuesto[]
  tienePrestamoBCP: boolean
  bcpData: BcpLoanData
  totalBlindado: number
  isPayingCuota: boolean
  handlePagarCuotaBCP: () => void
  onSavePartida: (data: BlindadoFormData) => Promise<void>
  onDeletePartida: (id: string) => Promise<void>
  mesNombre?: string
}

export function getIconoPorCategoria(categoria?: string, concepto?: string) {
  const c = (concepto || '').toLowerCase()
  const cat = (categoria || '').toUpperCase()

  if (c.includes('luz') || c.includes('electric') || c.includes('energ')) {
    return <Zap className="w-4 h-4 text-amber-600" />
  }
  if (
    c.includes('internet') ||
    c.includes('wifi') ||
    c.includes('servici') ||
    cat === 'SERVICIOS'
  ) {
    return <Globe className="w-4 h-4 text-sky-600" />
  }
  if (
    c.includes('reserva') ||
    c.includes('maquin') ||
    c.includes('impresor') ||
    c.includes('bambu') ||
    cat === 'CAPEX'
  ) {
    return <Package className="w-4 h-4 text-primary" />
  }
  if (
    c.includes('préstamo') ||
    c.includes('prestamo') ||
    c.includes('banco') ||
    cat === 'BLINDADO'
  ) {
    return <Landmark className="w-4 h-4 text-emerald-700" />
  }
  if (c.includes('alquiler') || c.includes('taller') || cat === 'OPERATIVO') {
    return <Lock className="w-4 h-4 text-amber-600" />
  }
  return <ShieldCheck className="w-4 h-4 text-amber-600" />
}

export function getCategoriaLabel(categoria?: string) {
  switch (categoria) {
    case 'OPERATIVO':
      return 'Fijo / Taller'
    case 'SERVICIOS':
      return 'Servicios & Op.'
    case 'CAPEX':
      return 'Reserva Máquinas'
    case 'BLINDADO':
      return 'Deuda / Préstamo'
    case 'INSUMOS':
      return 'Insumos & Material'
    default:
      return categoria || 'Gasto Fijo'
  }
}

export function CompromisosBlindadosSection({
  partidasBlindadas,
  tienePrestamoBCP,
  bcpData,
  totalBlindado,
  isPayingCuota,
  handlePagarCuotaBCP,
  onSavePartida,
  onDeletePartida,
  mesNombre,
}: CompromisosBlindadosSectionProps) {
  const [modalBlindadoAbierto, setModalBlindadoAbierto] = useState(false)
  const [editingPartida, setEditingPartida] = useState<PartidaPresupuesto | null>(null)

  const handleAbrirNuevo = () => {
    setEditingPartida(null)
    setModalBlindadoAbierto(true)
  }

  const handleEditarBlindado = (partida: PartidaPresupuesto) => {
    setEditingPartida(partida)
    setModalBlindadoAbierto(true)
  }

  const handleEliminarBlindado = async (id: string) => {
    const partida = partidasBlindadas.find((p) => p.id === id)
    const nombre = partida?.concepto || 'este compromiso'
    if (
      !confirm(
        `¿Confirmas desblindar y eliminar "${nombre}"?\n\nEl monto se liberará de inmediato en tu Gasto Libre.`
      )
    ) {
      return
    }
    await onDeletePartida(id)
  }

  const totalActivos = (tienePrestamoBCP ? 1 : 0) + partidasBlindadas.length
  const mesActual = mesNombre || new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(new Date())
  const mesFormateado = mesActual.charAt(0).toUpperCase() + mesActual.slice(1)

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4 mb-5">
        {/* Cabecera del Módulo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Compromisos Blindados de {mesFormateado} ({totalActivos})
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Gastos fijos y amortizaciones descontados automáticamente de tu caja libre.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Badge de Total Comprometido */}
            <span className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap font-mono">
              Total: S/ {totalBlindado.toFixed(2)}
            </span>
            {/* Botón para Agregar Nuevo Blindado */}
            <Button
              onClick={handleAbrirNuevo}
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold h-9 px-3.5 rounded-xl flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Blindar Gasto</span>
            </Button>
          </div>
        </div>

        {/* Grid Dinámico de Partidas Blindadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Renderizado del Préstamo BCP (Partida Especial con Amortización) */}
          {tienePrestamoBCP && (
            <div className="bg-secondary/40 border border-border/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                    <Landmark className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">
                      Préstamo BCP
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      Cuota {bcpData.cuotaActual}/{bcpData.totalCuotas}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-foreground font-mono whitespace-nowrap">
                  S/ {bcpData.montoCuota.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0">
                    Blindado
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap truncate">
                    Cap. Rest: S/ {bcpData.capitalRestante.toFixed(2)}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handlePagarCuotaBCP}
                  disabled={isPayingCuota || bcpData.pagada}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-7 px-3 rounded-lg shadow-2xs cursor-pointer whitespace-nowrap transition-all active:scale-[0.98]"
                >
                  {isPayingCuota ? 'Pagando...' : bcpData.pagada ? '✓ Al día' : `Pagar Cuota ${bcpData.cuotaActual}`}
                </Button>
              </div>
            </div>
          )}

          {/* Mapeo Dinámico de Partidas Blindadas Adicionales (Luz, Internet, Reservas) */}
          {partidasBlindadas.map((partida) => (
            <div
              key={partida.id}
              className="bg-secondary/40 border border-border/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-card border border-border/70 flex items-center justify-center shrink-0 text-amber-600">
                    {getIconoPorCategoria(partida.categoria, partida.concepto)}
                  </div>
                  <div className="min-w-0">
                    <span
                      className="text-xs font-bold text-foreground block leading-snug truncate"
                      title={partida.concepto}
                    >
                      {partida.concepto}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {partida.subconcepto || getCategoriaLabel(partida.categoria) || 'Gasto Fijo'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-foreground font-mono whitespace-nowrap">
                  S/ {Number(partida.monto || partida.presupuesto || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0">
                  Blindado
                </span>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => handleEditarBlindado(partida)}
                    title="Editar compromiso"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive cursor-pointer"
                    onClick={() => handleEliminarBlindado(partida.id)}
                    title="Eliminar compromiso"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Estado vacío si no hay compromisos */}
          {!tienePrestamoBCP && partidasBlindadas.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
              <Lock className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
              <p className="font-semibold text-foreground">No tienes compromisos blindados activos este mes.</p>
              <p className="text-[11px] mt-0.5">Usa el botón "+ Blindar Gasto" para proteger cuotas fijas o reservas.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Agregar o Editar Compromisos Blindados */}
      <AddBlindadoModal
        open={modalBlindadoAbierto}
        onOpenChange={setModalBlindadoAbierto}
        editingPartida={editingPartida}
        onSave={onSavePartida}
      />
    </>
  )
}
