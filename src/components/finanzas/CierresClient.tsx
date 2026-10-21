'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ShieldCheck, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  DollarSign, 
  TrendingUp, 
  Trash2, 
  X, 
  ArrowRight, 
  Loader2, 
  Landmark, 
  Wallet,
  Sparkles,
  FileCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CierreMesItem, DatosPreCierre, createCierreMes, deleteCierreMes } from '@/actions/cierres'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface CierresClientProps {
  cierres: CierreMesItem[]
  datosPreCierre: DatosPreCierre
}

const ITEMS_PER_PAGE = 5

export function CierresClient({ cierres: initialCierres, datosPreCierre }: CierresClientProps) {
  const router = useRouter()
  const [cierres, setCierres] = useState<CierreMesItem[]>(initialCierres)
  const [openModal, setOpenModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(cierres.length / ITEMS_PER_PAGE))
  const paginatedCierres = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return cierres.slice(start, start + ITEMS_PER_PAGE)
  }, [cierres, currentPage])

  // Wizard state (Paso 1: Rendimiento, Paso 2: Arqueo, Paso 3: Blindaje)
  const [pasoWizard, setPasoWizard] = useState<1 | 2 | 3>(1)

  // Form states
  const [formMes, setFormMes] = useState<number>(datosPreCierre.mes)
  const [formAnio, setFormAnio] = useState<number>(datosPreCierre.anio)
  const [formPeriodo, setFormPeriodo] = useState<string>(datosPreCierre.nombrePeriodo)

  // Arqueo Inputs
  const [formRealBCP, setFormRealBCP] = useState<string>((datosPreCierre.saldoSistemaCaja * 0.65).toFixed(2))
  const [formRealYape, setFormRealYape] = useState<string>((datosPreCierre.saldoSistemaCaja * 0.35).toFixed(2))

  // Blindaje Inputs
  const [formCuotaPrestamo, setFormCuotaPrestamo] = useState<string>(datosPreCierre.cuotaPrestamoSugerida.toString())
  const [formReservaMaquina, setFormReservaMaquina] = useState<string>(datosPreCierre.reservaSugerida.toString())
  const [formColchonEmergencia, setFormColchonEmergencia] = useState<string>(datosPreCierre.colchonSugerido.toString())
  const [formNotas, setFormNotas] = useState<string>('')

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Calculations for Modal
  const saldoRealBCPNum = parseFloat(formRealBCP) || 0
  const saldoRealYapeNum = parseFloat(formRealYape) || 0
  const saldoRealTotalCalculado = saldoRealBCPNum + saldoRealYapeNum
  const descuadreCalculado = saldoRealTotalCalculado - datosPreCierre.saldoSistemaCaja

  const cuotaPrestamoNum = parseFloat(formCuotaPrestamo) || 0
  const reservaMaquinaNum = parseFloat(formReservaMaquina) || 0
  const colchonEmergenciaNum = parseFloat(formColchonEmergencia) || 0
  const totalBlindadoCalculado = cuotaPrestamoNum + reservaMaquinaNum + colchonEmergenciaNum
  const liquidezLibreFinalCalculada = Math.max(0, saldoRealTotalCalculado - totalBlindadoCalculado)

  // Open Create Wizard
  const handleOpenWizard = () => {
    setPasoWizard(1)
    setFormMes(datosPreCierre.mes)
    setFormAnio(datosPreCierre.anio)
    setFormPeriodo(datosPreCierre.nombrePeriodo)
    setFormRealBCP((datosPreCierre.saldoSistemaCaja * 0.65).toFixed(2))
    setFormRealYape((datosPreCierre.saldoSistemaCaja * 0.35).toFixed(2))
    setFormCuotaPrestamo(datosPreCierre.cuotaPrestamoSugerida.toString())
    setFormReservaMaquina(datosPreCierre.reservaSugerida.toString())
    setFormColchonEmergencia(datosPreCierre.colchonSugerido.toString())
    setFormNotas('')
    setOpenModal(true)
  }

  // Handle submit Cierre
  const handleSubmitCierre = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await createCierreMes({
        mes: formMes,
        anio: formAnio,
        nombrePeriodo: formPeriodo,
        totalIngresosVentas: datosPreCierre.totalIngresosVentas,
        totalIngresosDirectos: datosPreCierre.totalIngresosDirectos,
        totalIngresos: datosPreCierre.totalIngresos,
        totalEgresosInsumos: datosPreCierre.totalEgresosInsumos,
        totalEgresosMaquinaria: datosPreCierre.totalEgresosMaquinaria,
        totalEgresosServicios: datosPreCierre.totalEgresosServicios,
        totalEgresos: datosPreCierre.totalEgresos,
        flujoNetoMes: datosPreCierre.flujoNetoMes,
        saldoSistema: datosPreCierre.saldoSistemaCaja,
        saldoRealBCP: saldoRealBCPNum,
        saldoRealYape: saldoRealYapeNum,
        saldoRealTotal: saldoRealTotalCalculado,
        descuadreCaja: descuadreCalculado,
        montoCuotaPrestamo: cuotaPrestamoNum,
        montoReservaMaquina: reservaMaquinaNum,
        montoColchonEmergencia: colchonEmergenciaNum,
        totalFondosBlindados: totalBlindadoCalculado,
        liquidezLibreFinal: liquidezLibreFinalCalculada,
        cuentasPorCobrarTraspaso: datosPreCierre.cuentasPorCobrar,
        totalPedidosMes: datosPreCierre.totalPedidos,
        notas: formNotas || undefined
      })

      toast.success(res.message)
      setOpenModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar el cierre de mes.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Cierre
  const handleDeleteCierre = async (id: string, periodo: string) => {
    if (confirm(`¿Deseas eliminar el registro de prueba del cierre "${periodo}"?`)) {
      try {
        await deleteCierreMes(id)
        setCierres(prev => prev.filter(c => c.id !== id))
        toast.success(`Cierre de "${periodo}" eliminado exitosamente.`)
        router.refresh()
      } catch (err: any) {
        toast.error(err?.message || 'Error al eliminar cierre.')
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                <FileCheck className="h-5 w-5" />
              </div>
              <span>Cierres Mensuales & Arqueo</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auditoría mensual de caja, conciliación bancaria y congelación oficial de resultados por período.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <Link href="/finanzas/flujo-caja" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full sm:w-auto border-border/60 bg-background text-foreground hover:bg-muted/50 cursor-pointer rounded-lg text-xs h-9 shadow-none font-medium">
              <Landmark className="h-4 w-4 mr-1.5 text-muted-foreground" />
              Flujo de Caja
            </Button>
          </Link>

          <Button 
            onClick={handleOpenWizard}
            className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-none transition-all cursor-pointer rounded-lg px-3 py-2 text-xs h-9 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo Cierre
          </Button>
        </div>
      </div>

      {/* KPI Cards Minimalistas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider select-none">Cierres Registrados</span>
            <div className="p-1 rounded-md bg-muted/60 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-foreground font-mono tabular-nums tracking-tight">
              {cierres.length} <span className="text-xs font-normal font-sans text-muted-foreground">meses</span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">Historial oficial</span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider select-none">Estado de Cierres</span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight">
              {cierres.length > 0 ? 'Al día' : 'Pendiente'}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">
              {cierres.length > 0 ? `Último: ${cierres[0].nombrePeriodo}` : 'Sin cierres previos'}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider select-none">Saldo Caja Actual</span>
            <div className="p-1 rounded-md bg-muted/60 text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-foreground font-mono tabular-nums tracking-tight">
              {formatCurrency(datosPreCierre.saldoSistemaCaja)}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">Saldo en sistema</span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider select-none">Cuentas por Cobrar</span>
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 font-mono tabular-nums tracking-tight">
              {formatCurrency(datosPreCierre.cuentasPorCobrar)}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">Traspaso al nuevo mes</span>
          </div>
        </div>
      </div>

      {/* Historial de Cierres Registrados */}
      <Card className="bg-card border border-border/60 shadow-none rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                Historial Oficial de Cierres Mensuales
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Fotografías financieras oficiales guardadas al final de cada mes con sus arqueos y fondos blindados.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-muted/60 border-border/50 text-muted-foreground font-medium text-xs">
              {cierres.length} Registros
            </Badge>
          </div>
        </CardHeader>

        {cierres.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto">
              <FileCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No hay cierres mensuales registrados aún</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Como Agosto está por finalizar, puedes realizar el primer cierre de prueba para conciliar saldos de cuentas y congelar el resultado del mes.
            </p>
            <Button
              onClick={handleOpenWizard}
              className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Realizar Cierre de Agosto (Prueba)
            </Button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/40">
              {paginatedCierres.map((c) => (
                <div key={c.id} className="p-4 hover:bg-muted/20 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/60 border border-border/60 text-foreground">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{c.nombrePeriodo}</span>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-medium">
                            Cierre Oficial
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Cerrado el {formatDate(c.fechaCierre)} • {c.totalPedidosMes} pedidos producidos
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCierre(c.id, c.nombrePeriodo)}
                        className="text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 text-xs rounded-lg cursor-pointer"
                        title="Eliminar registro de prueba"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Eliminar Prueba
                      </Button>
                    </div>
                  </div>

                  {/* Grid de métricas del cierre */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                      <span className="text-[11px] text-muted-foreground block font-medium">Ingresos Cobrados:</span>
                      <span className="text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">+{formatCurrency(c.totalIngresos)}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                      <span className="text-[11px] text-muted-foreground block font-medium">Egresos Totales:</span>
                      <span className="text-sm font-semibold font-mono text-foreground tabular-nums">-{formatCurrency(c.totalEgresos)}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                      <span className="text-[11px] text-muted-foreground block font-medium">Fondos Blindados:</span>
                      <span className="text-sm font-semibold font-mono text-foreground tabular-nums">{formatCurrency(c.totalFondosBlindados)}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">Liquidez Libre de Cierre:</span>
                      <span className="text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(c.liquidezLibreFinal)}</span>
                    </div>
                  </div>

                  {/* Conciliación bancaria */}
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-foreground font-medium">Conciliación Bancaria:</span>
                      <span className="font-mono text-muted-foreground">BCP: {formatCurrency(c.saldoRealBCP)} | Yape: {formatCurrency(c.saldoRealYape)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`font-mono text-[10px] font-medium tabular-nums ${
                        c.descuadreCaja === 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        Descuadre: {formatCurrency(c.descuadreCaja)}
                      </Badge>
                    </div>
                  </div>

                  {c.notas && (
                    <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/40">
                      <strong className="text-foreground">Notas del cierre:</strong> {c.notas}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="p-3 bg-muted/10 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">
                  Mostrando página <strong className="text-foreground">{currentPage}</strong> de <strong className="text-foreground">{totalPages}</strong> ({cierres.length} periodos)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5 border-border/60 bg-background text-foreground hover:bg-muted/50 disabled:opacity-40 cursor-pointer shadow-none"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-primary text-primary-foreground font-semibold shadow-none'
                            : 'bg-background border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5 border-border/60 bg-background text-foreground hover:bg-muted/50 disabled:opacity-40 cursor-pointer shadow-none"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* MODAL / WIZARD DE CIERRE DE MES (PRUEBA)                                  */}
      {/* ========================================================================= */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent showCloseButton={false} className="bg-card border border-border/80 text-foreground w-[95vw] sm:max-w-[620px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-xl rounded-2xl z-50">
          {/* Header Fijo */}
          <div className="px-6 py-4 border-b border-border/60 bg-card/95 backdrop-blur-xs flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                    Asistente de Cierre de Mes: {formPeriodo}
                  </DialogTitle>
                  <Badge variant="outline" className="bg-muted/60 border-border/50 text-muted-foreground text-[10px] font-medium">
                    PRUEBA
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Paso {pasoWizard} de 3: {pasoWizard === 1 ? 'Rendimiento' : pasoWizard === 2 ? 'Arqueo Bancario' : 'Blindaje de Fondos'}
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper Tabs Header Fijo */}
          <div className="grid grid-cols-3 bg-muted/40 border-b border-border/60 text-xs font-medium text-center flex-shrink-0">
            <button
              type="button"
              onClick={() => setPasoWizard(1)}
              className={`py-2.5 transition-colors cursor-pointer border-b-2 ${
                pasoWizard === 1 ? 'border-primary text-foreground bg-card font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              1. Rendimiento
            </button>
            <button
              type="button"
              onClick={() => setPasoWizard(2)}
              className={`py-2.5 transition-colors cursor-pointer border-b-2 ${
                pasoWizard === 2 ? 'border-primary text-foreground bg-card font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              2. Arqueo Caja
            </button>
            <button
              type="button"
              onClick={() => setPasoWizard(3)}
              className={`py-2.5 transition-colors cursor-pointer border-b-2 ${
                pasoWizard === 3 ? 'border-primary text-foreground bg-card font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              3. Blindaje Final
            </button>
          </div>

          <form onSubmit={handleSubmitCierre} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 touch-pan-y">
              {/* PASO 1: RENDIMIENTO DEL PERÍODO */}
              {pasoWizard === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                      Resumen Financiero del Período ({formPeriodo}):
                    </span>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-card border border-border/60">
                        <span className="text-muted-foreground block text-[11px]">Ventas Cobradas:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{formatCurrency(datosPreCierre.totalIngresosVentas)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border border-border/60">
                        <span className="text-muted-foreground block text-[11px]">Servicios Directos:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{formatCurrency(datosPreCierre.totalIngresosDirectos)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border border-border/60">
                        <span className="text-muted-foreground block text-[11px]">Compras Insumos:</span>
                        <span className="font-semibold text-foreground font-mono tabular-nums">-{formatCurrency(datosPreCierre.totalEgresosInsumos)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border border-border/60">
                        <span className="text-muted-foreground block text-[11px]">Maquinaria & Equipos:</span>
                        <span className="font-semibold text-foreground font-mono tabular-nums">-{formatCurrency(datosPreCierre.totalEgresosMaquinaria)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">Saldo Neto Calculado por el Sistema:</span>
                      <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                        {formatCurrency(datosPreCierre.saldoSistemaCaja)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: ARQUEO Y CONCILIACIÓN BANCARIA */}
              {pasoWizard === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                    <strong>Arqueo de Caja:</strong> Ingresa los saldos que figuran en tus aplicaciones bancarias al cierre de mes para conciliar posibles diferencias.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground/90 block mb-1">Saldo Real en BCP (S/):</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formRealBCP}
                        onChange={(e) => setFormRealBCP(e.target.value)}
                        className="bg-background border-border/80 font-mono font-semibold text-sm h-9 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground/90 block mb-1">Saldo Real en Yape (S/):</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formRealYape}
                        onChange={(e) => setFormRealYape(e.target.value)}
                        className="bg-background border-border/80 font-mono font-semibold text-sm h-9 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Comparación y descuadre */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saldo Real Total Ingresado:</span>
                      <span className="font-mono font-semibold text-foreground tabular-nums">{formatCurrency(saldoRealTotalCalculado)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saldo Registrado en Sistema:</span>
                      <span className="font-mono text-muted-foreground tabular-nums">{formatCurrency(datosPreCierre.saldoSistemaCaja)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border/50 font-medium">
                      <span>Descuadre / Diferencia:</span>
                      <span className={`font-mono tabular-nums ${descuadreCalculado === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {descuadreCalculado >= 0 ? '+' : ''}{formatCurrency(descuadreCalculado)} ({descuadreCalculado === 0 ? 'Cuadrado perfecto' : 'Ajuste registrado'})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3: BLINDAJE FINAL Y CONFIRMACIÓN */}
              {pasoWizard === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                      <Label className="text-[11px] text-muted-foreground block mb-1">Cuota Préstamo:</Label>
                      <Input
                        type="number"
                        step="10"
                        value={formCuotaPrestamo}
                        onChange={(e) => setFormCuotaPrestamo(e.target.value)}
                        className="bg-background border-border/80 font-mono text-xs font-semibold h-8 rounded-lg"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                      <Label className="text-[11px] text-muted-foreground block mb-1">Reserva Máquina:</Label>
                      <Input
                        type="number"
                        step="50"
                        value={formReservaMaquina}
                        onChange={(e) => setFormReservaMaquina(e.target.value)}
                        className="bg-background border-border/80 font-mono text-xs font-semibold h-8 rounded-lg"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                      <Label className="text-[11px] text-muted-foreground block mb-1">Colchón Emergencia:</Label>
                      <Input
                        type="number"
                        step="25"
                        value={formColchonEmergencia}
                        onChange={(e) => setFormColchonEmergencia(e.target.value)}
                        className="bg-background border-border/80 font-mono text-xs font-semibold h-8 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Resumen de liquidez final */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 block text-sm">Liquidez Libre Oficial de Cierre:</span>
                      <span className="text-[11px] text-muted-foreground">Saldo Real ({formatCurrency(saldoRealTotalCalculado)}) - Blindado ({formatCurrency(totalBlindadoCalculado)})</span>
                    </div>
                    <div className="text-xl font-semibold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(liquidezLibreFinalCalculada)}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground/90 block mb-1">Notas u Observaciones del Cierre (Opcional):</Label>
                    <Input
                      placeholder="Ej: Cuota bancaria pagada el 28, preventa A2L reservada..."
                      value={formNotas}
                      onChange={(e) => setFormNotas(e.target.value)}
                      className="h-9 bg-background border-border/80 text-xs text-foreground rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Fijo con Navegación y Botones */}
            <div className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between flex-shrink-0">
              {pasoWizard > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPasoWizard((p) => Math.max(1, p - 1) as any)}
                  className="text-muted-foreground hover:text-foreground text-xs rounded-lg cursor-pointer"
                >
                  Volver
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenModal(false)}
                  className="text-muted-foreground hover:text-foreground text-xs rounded-lg cursor-pointer"
                >
                  Cancelar
                </Button>
              )}

              {pasoWizard < 3 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPasoWizard((p) => Math.min(3, p + 1) as any)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-xs cursor-pointer shadow-none"
                >
                  Siguiente
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg shadow-none cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Guardando Cierre...
                    </>
                  ) : (
                    'Confirmar y Guardar Cierre Oficial'
                  )}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
