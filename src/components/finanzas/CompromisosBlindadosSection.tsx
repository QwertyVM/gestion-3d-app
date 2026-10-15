'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AddBlindadoModal, BlindadoFormData } from './AddBlindadoModal'
import { ModalPagarCompromiso, CompromisoParaPagar } from './ModalPagarCompromiso'
import { ModalRevertirCompromiso, ReversionTarget } from './ModalRevertirCompromiso'
import { PaymentHistoryModal, HistorialModalItem } from './PaymentHistoryModal'
import { CompromisosBlindadosCard, getCategoriaLabel } from './CompromisosBlindadosCard'
import {
  pagarCompromisoBlindado,
  revertirPagoCompromisoBlindado,
  CuotaDetalle,
  ItemHistorialPago,
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
  historialPagos?: ItemHistorialPago[]
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
  gastoLibreActual?: number
}

export function CompromisosBlindadosSection({
  partidasBlindadas,
  tienePrestamoBCP,
  bcpData,
  totalBlindado,
  onSavePartida,
  onDeletePartida,
  mesNombre,
  gastoLibreActual,
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

  // Estado para el modal de historial de cuotas y pagos
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false)
  const [itemHistorial, setItemHistorial] = useState<HistorialModalItem | null>(null)

  const mesActual = mesNombre || 'Octubre'
  const mesFormateado = mesActual.charAt(0).toUpperCase() + mesActual.slice(1)

  // Cuotas BCP normalizadas
  const cuotaSep = bcpData.cuotaSeptiembre || {
    numeroCuota: 1,
    mes: 'Septiembre',
    anio: 2026,
    monto: 368.88,
    pagada: true,
    fechaPago: '28 set. 2026',
    vencimiento: '30 de Septiembre',
  }

  const cuotaOct = bcpData.cuotaOctubre || {
    numeroCuota: 2,
    mes: 'Octubre',
    anio: 2026,
    monto: bcpData.montoCuota || 388.68,
    pagada: bcpData.pagada,
    fechaPago: null,
    vencimiento: '31 de Octubre',
  }

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
  const handleAbrirPagarPrestamo = (numeroCuota: number, mesNom: string) => {
    setCompromisoParaPagar({
      tipoCompromiso: 'PRESTAMO',
      numeroCuota,
      concepto: 'Préstamo BCP',
      cuotaLabel: `Cuota de ${mesNom} (${numeroCuota}/${bcpData.totalCuotas})`,
      montoSugerido: bcpData.montoCuota,
      mesPeriodo: `${mesNom} 2026`,
      categoria: 'FINANCIERO',
      subcategoria: 'BCP',
    })
    setModalPagarAbierto(true)
  }

  // Apertura de ventana de pago para Partida de Gasto Fijo / Variable
  const handleAbrirPagarPartida = (partida: PartidaPresupuesto, mesPeriodoForzado?: string) => {
    const montoSugerido = Number(partida.monto || partida.presupuesto || 0)
    const periodo = mesPeriodoForzado || `${mesFormateado} 2026`
    setCompromisoParaPagar({
      tipoCompromiso: 'PARTIDA',
      partidaId: partida.id,
      concepto: partida.concepto,
      cuotaLabel: `${partida.concepto} • ${periodo}`,
      montoSugerido,
      mesPeriodo: periodo,
      categoria: partida.categoria,
      subcategoria: partida.subconcepto || 'Servicios Básicos',
      esVariable: true,
    })
    setModalPagarAbierto(true)
  }

  // Apertura de Historial para Préstamo BCP
  const handleAbrirHistorialPrestamo = () => {
    const pagosRegistrados: ItemHistorialPago[] = []
    if (bcpData.historialPagos && bcpData.historialPagos.length > 0) {
      pagosRegistrados.push(...bcpData.historialPagos)
    } else {
      if (cuotaSep.pagada) {
        pagosRegistrados.push({
          id: cuotaSep.inversionId || 'sep-cuota-1',
          inversionId: cuotaSep.inversionId || 'sep-cuota-1',
          concepto: 'Pago Cuota 1/24 - Préstamo BCP',
          mesPeriodo: 'Septiembre 2026',
          monto: cuotaSep.monto,
          fechaPago: cuotaSep.fechaPago || '28 set. 2026',
          metodoPago: 'BCP',
          numeroCuota: 1,
        })
      }
      if (cuotaOct.pagada) {
        pagosRegistrados.push({
          id: cuotaOct.inversionId || 'oct-cuota-2',
          inversionId: cuotaOct.inversionId || 'oct-cuota-2',
          concepto: 'Pago Cuota 2/24 - Préstamo BCP',
          mesPeriodo: 'Octubre 2026',
          monto: cuotaOct.monto,
          fechaPago: cuotaOct.fechaPago || 'Octubre 2026',
          metodoPago: 'BCP',
          numeroCuota: 2,
        })
      }
    }

    const totalAbonado = pagosRegistrados.reduce((acc, h) => acc + h.monto, 0)
    const cuotasPagadas = pagosRegistrados.length || (cuotaOct.pagada ? 2 : cuotaSep.pagada ? 1 : 0)

    setItemHistorial({
      id: 'prestamo-bcp',
      concepto: 'Préstamo BCP',
      subconcepto: 'Amortización de Capital de Trabajo',
      categoria: 'FINANCIERO',
      tipo: 'PRESTAMO',
      cuotasPagadas,
      totalCuotas: bcpData.totalCuotas || 24,
      totalAbonado,
      montoMensualPresupuesto: bcpData.montoCuota,
      capitalRestante: bcpData.capitalRestante,
      historialPagos: pagosRegistrados,
    })
    setModalHistorialAbierto(true)
  }

  // Apertura de Historial para Partida
  const handleAbrirHistorialPartida = (partida: PartidaPresupuesto) => {
    const montoPresupuestado = Number(partida.monto || partida.presupuesto || 0)
    const sepPagada = Boolean(
      partida.cuotaSeptiembre?.pagada ||
      (partida.montoSeptiembreReal && Number(partida.montoSeptiembreReal) > 0)
    )
    const sepMonto = Number(
      partida.cuotaSeptiembre?.monto || partida.montoSeptiembreReal || montoPresupuestado
    )
    const sepFecha = partida.cuotaSeptiembre?.fechaPago || '28 set. 2026'

    const estaPagadoOct = Boolean(partida.pagado)
    const montoPagadoOct = Number(partida.montoPagadoReal || montoPresupuestado)

    const pagosRegistrados: ItemHistorialPago[] = []
    if (partida.historialPagos && partida.historialPagos.length > 0) {
      pagosRegistrados.push(...partida.historialPagos)
    } else {
      if (sepPagada) {
        pagosRegistrados.push({
          id: partida.cuotaSeptiembre?.inversionId || `${partida.id}-sep`,
          inversionId: partida.cuotaSeptiembre?.inversionId || `${partida.id}-sep`,
          concepto: `${partida.concepto} • Septiembre 2026`,
          mesPeriodo: 'Septiembre 2026',
          monto: sepMonto,
          fechaPago: sepFecha,
          metodoPago: 'BCP',
        })
      }
      if (estaPagadoOct) {
        pagosRegistrados.push({
          id: partida.inversionId || `${partida.id}-oct`,
          inversionId: partida.inversionId || `${partida.id}-oct`,
          concepto: `${partida.concepto} • Octubre 2026`,
          mesPeriodo: 'Octubre 2026',
          monto: montoPagadoOct,
          fechaPago: partida.fechaPago || 'Octubre 2026',
          metodoPago: 'BCP',
        })
      }
    }

    const totalAbonado = pagosRegistrados.reduce((acc, h) => acc + h.monto, 0)
    const cuotasPagadas =
      partida.totalPagos ??
      (pagosRegistrados.length || (sepPagada ? 1 : 0) + (estaPagadoOct ? 1 : 0))

    setItemHistorial({
      id: partida.id,
      concepto: partida.concepto,
      subconcepto: partida.subconcepto,
      categoria: partida.categoria,
      tipo: 'PARTIDA',
      cuotasPagadas,
      totalAbonado,
      montoMensualPresupuesto: montoPresupuestado,
      historialPagos: pagosRegistrados,
    })
    setModalHistorialAbierto(true)
  }

  // Ejecución del pago contable en backend
  const handleConfirmarPago = async (data: {
    tipoCompromiso: 'PRESTAMO' | 'PARTIDA'
    partidaId?: string
    numeroCuota?: number
    concepto: string
    monto: number
    fechaPago: string
    mesPeriodo?: string
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
      mesPeriodo: data.mesPeriodo,
      metodoPago: data.metodoPago,
      categoria: data.categoria,
      subcategoria: data.subcategoria,
      notas: data.notas,
      persona: 'Víctor',
      negocio: '3D',
    })

    if (res.success) {
      toast.success(
        `Pago de S/ ${data.monto.toFixed(2)} registrado para ${data.concepto} (${data.mesPeriodo || 'contable'})`
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

  // Ejecución de reversión en backend
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
      toast.success(`Pago de ${target.concepto} (${target.mes}) revertido con éxito`)
      router.refresh()
    } else {
      throw new Error('Error al procesar el extorno en la base de datos')
    }
  }

  const totalActivos = (tienePrestamoBCP ? 1 : 0) + partidasBlindadas.length
  const cuotasPagadasBCP = bcpData.historialPagos?.length || (cuotaOct.pagada ? 2 : cuotaSep.pagada ? 1 : 0)
  const totalAbonadoBCP = (bcpData.historialPagos || []).reduce((acc, h) => acc + h.monto, 0) || (cuotaSep.pagada ? cuotaSep.monto : 0)

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
                Gastos fijos y cuotas amortizadas por mes que descuentan de tu caja libre.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Badge de Total Comprometido */}
            <span className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap font-mono">
              Total: S/ {totalBlindado.toFixed(2)}
            </span>
            {/* Botón para Blindar Gasto */}
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

        {/* Grid Dinámico de Tarjetas de Compromiso del Mes Activo */}
        <div
          className={
            totalActivos <= 2
              ? 'grid grid-cols-1 md:grid-cols-2 gap-5'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
          }
        >
          {/* ========================================================================= */}
          {/* 1. TARJETA COMPACTA PRÉSTAMO BCP (ENFOQUE EXCLUSIVO EN MES ACTIVO)       */}
          {/* ========================================================================= */}
          {tienePrestamoBCP && (
            <CompromisosBlindadosCard
              id="prestamo-bcp"
              tipo="PRESTAMO"
              concepto="Préstamo BCP"
              subconcepto="Amortización de Capital de Trabajo"
              categoria="FINANCIERO"
              montoMensual={bcpData.montoCuota}
              mesActivoNombre={mesFormateado}
              vencimientoTexto="Vence: 31 de Octubre"
              cuotaNumero={2}
              totalCuotas={bcpData.totalCuotas || 24}
              capitalRestante={bcpData.capitalRestante}
              cuotasPagadas={cuotasPagadasBCP}
              estaPagada={Boolean(cuotaOct.pagada)}
              montoPagadoMes={cuotaOct.monto}
              fechaPagoMes={cuotaOct.fechaPago || undefined}
              detalleDerechaTexto={`${cuotasPagadasBCP}/${bcpData.totalCuotas || 24} pagadas • Cap. Rest: S/ ${(bcpData.capitalRestante || 7631.12).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              onPagar={() => handleAbrirPagarPrestamo(2, mesFormateado)}
              onRevertir={() =>
                handleAbrirRevertir({
                  tipo: 'PRESTAMO',
                  numeroCuota: 2,
                  concepto: 'Préstamo BCP',
                  mes: `Cuota de ${mesFormateado}`,
                  monto: cuotaOct.monto,
                  inversionId: cuotaOct.inversionId,
                })
              }
              onVerHistorial={handleAbrirHistorialPrestamo}
            />
          )}

          {/* ========================================================================= */}
          {/* 2. MAPEO DE PARTIDAS BLINDADAS ADICIONALES (LUZ, INTERNET, TALLER, ETC.)  */}
          {/* ========================================================================= */}
          {partidasBlindadas.map((partida) => {
            const montoPresupuestado = Number(partida.monto || partida.presupuesto || 0)
            const estaPagadoOct = Boolean(partida.pagado)
            const montoPagadoOct = Number(partida.montoPagadoReal || montoPresupuestado)
            const sepPagada = Boolean(
              partida.cuotaSeptiembre?.pagada ||
              (partida.montoSeptiembreReal && Number(partida.montoSeptiembreReal) > 0)
            )

            const totalPagosRealizados =
              partida.totalPagos ??
              (partida.historialPagos?.length || (sepPagada ? 1 : 0) + (estaPagadoOct ? 1 : 0))

            const esLuz = partida.concepto.toLowerCase().includes('luz')

            return (
              <CompromisosBlindadosCard
                key={partida.id}
                id={partida.id}
                tipo="PARTIDA"
                concepto={partida.concepto}
                subconcepto={
                  partida.subconcepto ||
                  (esLuz
                    ? 'Electricidad 2x máquinas'
                    : `${getCategoriaLabel(partida.categoria)} • Gasto Fijo Mensual`)
                }
                categoria={partida.categoria}
                montoMensual={montoPresupuestado}
                mesActivoNombre={mesFormateado}
                vencimientoTexto={esLuz ? 'Débito: 28 de cada mes' : `Vence: 31 de ${mesFormateado}`}
                estaPagada={estaPagadoOct}
                montoPagadoMes={montoPagadoOct}
                fechaPagoMes={partida.fechaPago || undefined}
                cuotasPagadas={totalPagosRealizados}
                detalleDerechaTexto={
                  totalPagosRealizados === 0
                    ? '0 pagos previos'
                    : `${totalPagosRealizados} ${totalPagosRealizados === 1 ? 'pago previo' : 'pagos previos'}`
                }
                onPagar={() => handleAbrirPagarPartida(partida, `${mesFormateado} 2026`)}
                onRevertir={() =>
                  handleAbrirRevertir({
                    tipo: 'PARTIDA',
                    partidaId: partida.id,
                    concepto: partida.concepto,
                    mes: `Cuota de ${mesFormateado}`,
                    monto: montoPagadoOct,
                    inversionId: partida.inversionId,
                  })
                }
                onVerHistorial={() => handleAbrirHistorialPartida(partida)}
                onEditar={() => handleEditarBlindado(partida)}
                onEliminar={() => handleEliminarBlindado(partida.id)}
              />
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
        gastoLibreActual={gastoLibreActual}
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

      {/* Ventana Modal para Consultar Historial Completo de Pagos */}
      <PaymentHistoryModal
        open={modalHistorialAbierto}
        onOpenChange={setModalHistorialAbierto}
        item={itemHistorial}
        onPagarNuevo={(histItem, mesPeriodoForzado) => {
          if (histItem.tipo === 'PRESTAMO') {
            const esSep = mesPeriodoForzado?.toLowerCase().includes('septiembre')
            handleAbrirPagarPrestamo(esSep ? 1 : 2, esSep ? 'Septiembre' : mesFormateado)
          } else {
            const partidaObj = partidasBlindadas.find((p) => p.id === histItem.id)
            if (partidaObj) {
              handleAbrirPagarPartida(partidaObj, mesPeriodoForzado)
            }
          }
        }}
        onRevertirPago={handleAbrirRevertir}
      />
    </>
  )
}
