'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AddBlindadoModal, BlindadoFormData } from './AddBlindadoModal'
import { ModalPagarCompromiso, CompromisoParaPagar } from './ModalPagarCompromiso'
import { ModalRevertirCompromiso, ReversionTarget } from './ModalRevertirCompromiso'
import {
  pagarCompromisoBlindado,
  revertirPagoCompromisoBlindado,
  CuotaDetalle,
} from '@/actions/presupuesto'
import type { PartidaPresupuesto } from './CashFlowHubView'

export interface BcpLoanData {
  cuotaActual: number
  totalCuotas: number
  montoCuota: number
  capitalRestante: number
  pagada: boolean
  cuotaSeptiembre?: CuotaDetalle | null
  cuotaOctubre?: CuotaDetalle | null
}

export interface CompromisosBlindadosSectionProps {
  partidasBlindadas: PartidaPresupuesto[]
  tienePrestamoBCP: boolean
  bcpData: BcpLoanData
  totalBlindado: number
  isPayingCuota?: boolean
  handlePagarCuotaBCP?: () => void
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
  onSavePartida,
  onDeletePartida,
  mesNombre,
}: CompromisosBlindadosSectionProps) {
  const router = useRouter()
  const [modalBlindadoAbierto, setModalBlindadoAbierto] = useState(false)
  const [editingPartida, setEditingPartida] = useState<PartidaPresupuesto | null>(null)

  // Estado para la ventana de pago contable
  const [modalPagarAbierto, setModalPagarAbierto] = useState(false)
  const [compromisoParaPagar, setCompromisoParaPagar] = useState<CompromisoParaPagar | null>(null)

  // Estado para la ventana de reversión contable
  const [modalRevertirAbierto, setModalRevertirAbierto] = useState(false)
  const [reversionTarget, setReversionTarget] = useState<ReversionTarget | null>(null)

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

  // Apertura de ventana de pago para Préstamo BCP
  const handleAbrirPagarPrestamo = (numeroCuota: number, mesNombre: string) => {
    setCompromisoParaPagar({
      tipoCompromiso: 'PRESTAMO',
      numeroCuota,
      concepto: 'Préstamo BCP',
      cuotaLabel: `Cuota de ${mesNombre} (${numeroCuota}/${bcpData.totalCuotas})`,
      montoSugerido: bcpData.montoCuota,
      mesPeriodo: `${mesNombre} 2026`,
      categoria: 'FINANCIERO',
      subcategoria: 'BCP',
    })
    setModalPagarAbierto(true)
  }

  // Apertura de ventana de pago para Gasto Variable / Fijo (Luz, Internet, etc.)
  const handleAbrirPagarPartida = (partida: PartidaPresupuesto) => {
    const montoSugerido = Number(partida.monto || partida.presupuesto || 0)
    setCompromisoParaPagar({
      tipoCompromiso: 'PARTIDA',
      partidaId: partida.id,
      concepto: partida.concepto,
      cuotaLabel: `Cuota de Octubre • ${partida.concepto}`,
      montoSugerido,
      mesPeriodo: 'Octubre 2026',
      categoria: partida.categoria,
      subcategoria: partida.subconcepto || 'Servicios Básicos',
      esVariable: true,
    })
    setModalPagarAbierto(true)
  }

  // Ejecución del pago contable a través del backend
  const handleConfirmarPago = async (data: {
    tipoCompromiso: 'PRESTAMO' | 'PARTIDA'
    partidaId?: string
    numeroCuota?: number
    concepto: string
    monto: number
    fechaPago: string
    metodoPago: string
    categoria?: string
    subcategoria?: string
    notas?: string
  }) => {
    const res = await pagarCompromisoBlindado({
      tipoCompromiso: data.tipoCompromiso,
      partidaId: data.partidaId,
      numeroCuota: data.numeroCuota,
      concepto: data.concepto,
      monto: data.monto,
      fechaPago: data.fechaPago,
      metodoPago: data.metodoPago,
      categoria: data.categoria,
      subcategoria: data.subcategoria,
      notas: data.notas,
      persona: 'Víctor',
      negocio: '3D',
    })

    if (res.success) {
      toast.success(
        `Pago de S/ ${data.monto.toFixed(2)} asentado con éxito para ${data.concepto}`
      )
      router.refresh()
    } else {
      throw new Error('No se pudo asentar el pago en la base de datos')
    }
  }

  // Apertura de modal para revertir pago
  const handleAbrirRevertir = (target: ReversionTarget) => {
    setReversionTarget(target)
    setModalRevertirAbierto(true)
  }

  // Ejecución de reversión en el backend
  const handleConfirmarReversion = async (target: ReversionTarget) => {
    const res = await revertirPagoCompromisoBlindado({
      tipoCompromiso: target.tipo,
      inversionId: target.inversionId,
      numeroCuota: target.numeroCuota,
      partidaId: target.partidaId,
      concepto: target.concepto,
      negocio: '3D',
    })

    if (res.success) {
      router.refresh()
    } else {
      throw new Error('Error al procesar el extorno en la base de datos')
    }
  }

  const totalActivos = (tienePrestamoBCP ? 1 : 0) + partidasBlindadas.length
  const mesActual = mesNombre || new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(new Date())
  const mesFormateado = mesActual.charAt(0).toUpperCase() + mesActual.slice(1)

  // Datos de las cuotas del préstamo
  const cuotaSep = bcpData.cuotaSeptiembre || {
    numeroCuota: 1,
    mes: 'Septiembre',
    anio: 2026,
    monto: 368.88,
    pagada: true,
    fechaPago: '28 de sep. de 2026',
    vencimiento: 'Finales de Septiembre (30/09)',
  }

  const cuotaOct = bcpData.cuotaOctubre || {
    numeroCuota: 2,
    mes: 'Octubre',
    anio: 2026,
    monto: bcpData.montoCuota || 388.68,
    pagada: bcpData.pagada,
    fechaPago: null,
    vencimiento: 'Finales de Octubre (31/10/2026)',
  }

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
                Gastos fijos y cuotas amortizadas por mes. Se pagan a finales de {mesActual} y descuentan automáticamente de tu caja libre.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Badge de Total Comprometido */}
            <span className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap font-mono">
              Total Blindado: S/ {totalBlindado.toFixed(2)}
            </span>
            {/* Botón para Agregar Nuevo Blindado */}
            <Button
              onClick={handleAbrirNuevo}
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold h-9 px-3.5 rounded-xl flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Blindar Gasto</span>
            </Button>
          </div>
        </div>

        {/* Grid Dinámico de Partidas Blindadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* ========================================================================= */}
          {/* TARJETA PRÉSTAMO BCP: CUOTA DE OCTUBRE + CUOTA DE SEPTIEMBRE CON REVERSIÓN */}
          {/* ========================================================================= */}
          {tienePrestamoBCP && (
            <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 flex flex-col justify-between space-y-3.5 hover:border-border transition-colors">
              {/* Encabezado del Préstamo */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Landmark className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-foreground truncate">
                        Préstamo BCP
                      </span>
                      <span className="bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        24 Cuotas
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      Amortización de Capital de Trabajo
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-foreground font-mono block">
                    S/ {bcpData.montoCuota.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Cap. Rest: S/ {bcpData.capitalRestante.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* CUOTA DE OCTUBRE (Cuota 2/24 - Mes en Curso) */}
              <div className="bg-card border border-border/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">
                        CUOTA DE OCTUBRE
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                        (Cuota 2/24)
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {cuotaOct.pagada
                        ? `✓ Pagada: S/ ${cuotaOct.monto.toFixed(2)} (${cuotaOct.fechaPago || 'Octubre'})`
                        : 'Vence: Finales de Octubre (31 de Octubre)'}
                    </p>
                  </div>

                  {cuotaOct.pagada ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleAbrirRevertir({
                          tipo: 'PRESTAMO',
                          numeroCuota: 2,
                          concepto: 'Préstamo BCP',
                          mes: 'Cuota de Octubre',
                          monto: cuotaOct.monto,
                          inversionId: cuotaOct.inversionId,
                        })
                      }
                      className="h-7 px-2.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30 cursor-pointer shadow-2xs whitespace-nowrap active:scale-[0.98]"
                      title="Revertir y extornar cuota de Octubre"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Revertir
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAbrirPagarPrestamo(2, 'Octubre')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-7 px-3 rounded-lg shadow-2xs cursor-pointer whitespace-nowrap transition-all active:scale-[0.98]"
                    >
                      Pagar Cuota Octubre
                    </Button>
                  )}
                </div>
              </div>

              {/* CUOTA DE SEPTIEMBRE (Cuota 1/24 - Inmediata con Reversión) */}
              <div className="bg-muted/40 border border-border/60 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground">
                      CUOTA DE SEPTIEMBRE
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      (Cuota 1/24)
                    </span>
                    {cuotaSep.pagada ? (
                      <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded">
                        ✓ Pagada
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground block font-mono mt-0.5">
                    {cuotaSep.pagada
                      ? `Abonado: S/ ${cuotaSep.monto.toFixed(2)} el 28 Sep`
                      : 'Sin registro de abono contable'}
                  </span>
                </div>

                {cuotaSep.pagada ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleAbrirRevertir({
                        tipo: 'PRESTAMO',
                        numeroCuota: 1,
                        concepto: 'Préstamo BCP',
                        mes: 'Cuota de Septiembre',
                        monto: cuotaSep.monto,
                        inversionId: cuotaSep.inversionId,
                      })
                    }
                    className="h-6.5 px-2 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-md cursor-pointer whitespace-nowrap active:scale-[0.98]"
                    title="Extornar y revertir el pago de la Cuota 1 de Septiembre"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Revertir Septiembre
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAbrirPagarPrestamo(1, 'Septiembre')}
                    className="h-6.5 px-2 text-[11px] font-medium text-primary hover:bg-primary/10 rounded-md cursor-pointer whitespace-nowrap active:scale-[0.98]"
                  >
                    Pagar Cuota 1
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MAPEO DE PARTIDAS BLINDADAS ADICIONALES (LUZ, INTERNET, GASTOS VARIABLES) */}
          {/* ========================================================================= */}
          {partidasBlindadas.map((partida) => {
            const montoPresupuestado = Number(partida.monto || partida.presupuesto || 0)
            const estaPagado = Boolean(partida.pagado)
            const montoPagado = Number(partida.montoPagadoReal || montoPresupuestado)

            return (
              <div
                key={partida.id}
                className="bg-secondary/40 border border-border/80 rounded-xl p-4 flex flex-col justify-between space-y-3.5 hover:border-amber-500/40 transition-colors group"
              >
                {/* Cabecera del Gasto Blindado */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-card border border-border/70 flex items-center justify-center shrink-0 text-amber-600 shadow-2xs">
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
                        {partida.subconcepto || getCategoriaLabel(partida.categoria) || 'Gasto Fijo Mensual'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-foreground font-mono block">
                      S/ {montoPresupuestado.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-muted-foreground block font-medium">
                      Presupuesto Octubre
                    </span>
                  </div>
                </div>

                {/* Bloque Contable de la Cuota de Octubre */}
                <div className="bg-card border border-border/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-foreground">
                          CUOTA DE OCTUBRE
                        </span>
                        {estaPagado ? (
                          <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            ✓ Pagado: S/ {montoPagado.toFixed(2)}
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            Variable • Pendiente
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {estaPagado
                          ? `Asentado en caja: S/ ${montoPagado.toFixed(2)}`
                          : 'Vencimiento: Finales de Octubre (31 de Octubre)'}
                      </p>
                    </div>

                    {estaPagado ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleAbrirRevertir({
                            tipo: 'PARTIDA',
                            partidaId: partida.id,
                            concepto: partida.concepto,
                            mes: 'Cuota de Octubre',
                            monto: montoPagado,
                            inversionId: partida.inversionId,
                          })
                        }
                        className="h-7 px-2.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30 cursor-pointer shadow-2xs whitespace-nowrap active:scale-[0.98]"
                        title="Revertir y extornar pago de Octubre"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Revertir
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAbrirPagarPartida(partida)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-7 px-3 rounded-lg shadow-2xs cursor-pointer whitespace-nowrap transition-all active:scale-[0.98]"
                        title="Pagar especificando el monto exacto del recibo"
                      >
                        Pagar Cuota Octubre
                      </Button>
                    )}
                  </div>
                </div>

                {/* Pie de Tarjeta: Estado Blindado y Acciones de Edición */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0">
                    {estaPagado ? 'Fondo Liberado' : 'Fondo Blindado'}
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
            )
          })}

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

      {/* Modal para Agregar o Editar Configuración de Compromisos */}
      <AddBlindadoModal
        open={modalBlindadoAbierto}
        onOpenChange={setModalBlindadoAbierto}
        editingPartida={editingPartida}
        onSave={onSavePartida}
      />

      {/* Ventana Modal para Asentar Pago Contable con Monto Específico Variable */}
      <ModalPagarCompromiso
        open={modalPagarAbierto}
        onOpenChange={setModalPagarAbierto}
        compromiso={compromisoParaPagar}
        onConfirmarPago={handleConfirmarPago}
      />

      {/* Ventana Modal para Revertir / Extornar Pagos Asentados */}
      <ModalRevertirCompromiso
        open={modalRevertirAbierto}
        onOpenChange={setModalRevertirAbierto}
        target={reversionTarget}
        onConfirmarReversion={handleConfirmarReversion}
      />
    </>
  )
}
