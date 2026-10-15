'use client'

import React from 'react'
import {
  Landmark,
  Zap,
  Globe,
  Package,
  Lock,
  ShieldCheck,
  RotateCcw,
  Pencil,
  Trash2,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface CompromisosBlindadosCardProps {
  id: string
  tipo: 'PRESTAMO' | 'PARTIDA'
  concepto: string
  subconcepto?: string
  categoria?: string
  montoMensual: number
  mesActivoNombre?: string
  vencimientoTexto?: string
  estaPagada: boolean
  montoPagadoMes?: number
  fechaPagoMes?: string
  progresoTexto?: string
  detalleDerechaTexto?: string
  cuotaNumero?: number
  totalCuotas?: number
  capitalRestante?: number
  cuotasPagadas?: number
  onPagar: () => void
  onRevertir: () => void
  onVerHistorial: () => void
  onEditar?: () => void
  onEliminar?: () => void
}

export function getIconoCompromiso(categoria?: string, concepto?: string) {
  const c = (concepto || '').toLowerCase()
  const cat = (categoria || '').toUpperCase()

  if (c.includes('luz') || c.includes('electric') || c.includes('energ')) {
    return <Zap className="w-5 h-5 text-amber-600" />
  }
  if (
    c.includes('internet') ||
    c.includes('wifi') ||
    c.includes('servici') ||
    cat === 'SERVICIOS'
  ) {
    return <Globe className="w-5 h-5 text-sky-600" />
  }
  if (
    c.includes('reserva') ||
    c.includes('maquin') ||
    c.includes('impresor') ||
    c.includes('bambu') ||
    cat === 'CAPEX'
  ) {
    return <Package className="w-5 h-5 text-primary" />
  }
  if (
    c.includes('préstamo') ||
    c.includes('prestamo') ||
    c.includes('banco') ||
    c.includes('bcp') ||
    cat === 'BLINDADO' ||
    cat === 'FINANCIERO'
  ) {
    return <Landmark className="w-5 h-5 text-primary" />
  }
  if (c.includes('alquiler') || c.includes('taller') || cat === 'OPERATIVO') {
    return <Lock className="w-5 h-5 text-amber-600" />
  }
  return <ShieldCheck className="w-5 h-5 text-amber-600" />
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
    case 'FINANCIERO':
      return 'Deuda / Préstamo'
    case 'INSUMOS':
      return 'Insumos & Material'
    default:
      return categoria || 'Gasto Fijo'
  }
}

export function CompromisosBlindadosCard({
  id,
  tipo,
  concepto,
  subconcepto,
  categoria,
  montoMensual,
  mesActivoNombre = 'Octubre',
  vencimientoTexto,
  estaPagada,
  montoPagadoMes,
  fechaPagoMes,
  progresoTexto,
  detalleDerechaTexto,
  cuotaNumero,
  totalCuotas,
  capitalRestante,
  cuotasPagadas,
  onPagar,
  onRevertir,
  onVerHistorial,
  onEditar,
  onEliminar,
}: CompromisosBlindadosCardProps) {
  const isPrestamo = tipo === 'PRESTAMO'
  const vence = vencimientoTexto || `Vence el 31 de ${mesActivoNombre}`

  const formattedMonto = montoMensual.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Format detail text for right side of level 2
  let detalleDerecha = detalleDerechaTexto
  if (!detalleDerecha) {
    if (isPrestamo) {
      const pagadas = cuotasPagadas !== undefined ? cuotasPagadas : 1
      const total = totalCuotas || 24
      const capRestStr =
        capitalRestante !== undefined
          ? `Cap. Rest: S/ ${capitalRestante.toLocaleString('es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : ''
      detalleDerecha = `${pagadas}/${total} pagadas${capRestStr ? ` • ${capRestStr}` : ''}`
    } else {
      detalleDerecha = progresoTexto || 'Débito automático estimado'
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all">
      {/* Nivel 1: Cabecera e Importe */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
        {/* Izquierda: Ícono temático + Títulos */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 border border-border/70">
            {getIconoCompromiso(categoria, concepto)}
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-bold text-foreground truncate" title={concepto}>
              {concepto}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {isPrestamo && (
                <span className="text-[10px] font-semibold bg-secondary px-2 py-0.5 rounded-md border border-border/70 text-foreground whitespace-nowrap">
                  {totalCuotas ? `${totalCuotas} Cuotas • TEA 8.70%` : '24 Cuotas • TEA 8.70%'}
                </span>
              )}
              <span className="text-xs text-muted-foreground truncate">
                {subconcepto || `${getCategoriaLabel(categoria)} • Gasto Fijo Mensual`}
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: Importe */}
        <div className="text-right shrink-0">
          <span className="text-lg font-extrabold text-foreground font-mono block">
            S/ {formattedMonto}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase text-right block mt-0.5 whitespace-nowrap">
            Presupuesto {mesActivoNombre}
          </span>
        </div>
      </div>

      {/* Nivel 2: Estado y Vencimiento del Mes Activo */}
      <div className="bg-secondary/40 border border-border/70 rounded-xl p-3 flex items-center justify-between gap-3">
        {/* Izquierda (Identificación y Vencimiento) */}
        <div className="min-w-0">
          <div className="flex items-center">
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              {isPrestamo
                ? `Cuota ${cuotaNumero || '2'} de ${mesActivoNombre}`
                : `Cuota de ${mesActivoNombre}`}
            </span>
            {estaPagada ? (
              <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md ml-2 whitespace-nowrap">
                ✓ Pagada
              </span>
            ) : (
              <span className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md ml-2 whitespace-nowrap">
                Pendiente
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground inline mr-1 shrink-0" />
            <span className="truncate">
              {estaPagada
                ? fechaPagoMes
                  ? `Pagado el ${fechaPagoMes}`
                  : `Abonado: S/ ${(montoPagadoMes || montoMensual).toFixed(2)}`
                : vence}
            </span>
          </div>
        </div>

        {/* Derecha (Progreso / Detalle) */}
        <div className="text-[11px] text-muted-foreground text-right shrink-0">
          {detalleDerecha}
        </div>
      </div>

      {/* Nivel 3: Botón de Acción Principal de Pago */}
      <div>
        {estaPagada ? (
          <div className="w-full h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
            <span>✓ Cuota de {mesActivoNombre} Pagada</span>
          </div>
        ) : (
          <Button
            type="button"
            onClick={onPagar}
            className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              Pagar Cuota {isPrestamo ? (cuotaNumero || '2') : `de ${mesActivoNombre}`} (S/{' '}
              {montoMensual.toFixed(2)})
            </span>
          </Button>
        )}
      </div>

      {/* Nivel 4: Pie de Tarjeta y Enlaces */}
      <div className="flex items-center justify-between pt-1 text-xs border-t border-border/50">
        <button
          type="button"
          onClick={onVerHistorial}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Ver Historial {isPrestamo ? 'de Cuotas' : ''} →</span>
        </button>

        <div className="flex items-center gap-2">
          {estaPagada && onRevertir && (
            <button
              type="button"
              onClick={onRevertir}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors active:scale-[0.98] mr-1"
              title={`Revertir pago de ${mesActivoNombre}`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Revertir</span>
            </button>
          )}

          {(onEditar || onEliminar) && (
            <div className="flex items-center gap-1">
              {onEditar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={onEditar}
                  title="Editar compromiso"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              {onEliminar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                  onClick={onEliminar}
                  title="Eliminar compromiso"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
