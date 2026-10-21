'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sliders,
  Wallet,
  ArrowRight,
  Info,
  Building2,
  Layers,
  Sparkles,
  ChevronRight,
  Users
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, cn } from '@/lib/utils'
import type { RentabilidadSueldosResumen, MesRentabilidadData } from '@/actions/rentabilidad'

interface RentabilidadSueldosViewProps {
  initialData: RentabilidadSueldosResumen
}

export function RentabilidadSueldosView({ initialData }: RentabilidadSueldosViewProps) {
  const [selectedMesKey, setSelectedMesKey] = useState<string>(
    initialData.mesSeleccionado.mesKey
  )

  // Mes actualmente seleccionado
  const activeMes = useMemo<MesRentabilidadData>(() => {
    const found = initialData.meses.find((m) => m.mesKey === selectedMesKey)
    return found || initialData.mesSeleccionado
  }, [initialData.meses, initialData.mesSeleccionado, selectedMesKey])

  // Configuración de socios (2 personas)
  const numSocios = activeMes.numSocios || 2

  // Simulador de asignación de sueldo
  const [modoSimulacion, setModoSimulacion] = useState<'POR_SOCIO' | 'TOTAL'>('POR_SOCIO')
  const [sueldoSimulado, setSueldoSimulado] = useState<string>('400')
  const inputNum = Math.max(0, parseFloat(sueldoSimulado) || 0)

  // Montos según el modo de simulación
  const sueldoPorSocio = modoSimulacion === 'POR_SOCIO' ? inputNum : (numSocios > 0 ? inputNum / numSocios : inputNum)
  const sueldoTotalEmpresa = modoSimulacion === 'POR_SOCIO' ? inputNum * numSocios : inputNum

  // Cálculos reactivos de la simulación
  const saldoPostSueldo = activeMes.saldoAcumulado - sueldoTotalEmpresa
  const colchonRestante = saldoPostSueldo - activeMes.reservaObligaciones
  const esSueldoSeguro = sueldoTotalEmpresa > 0 && sueldoTotalEmpresa <= activeMes.capacidadSueldoSeguro
  const esSueldoAlerta = sueldoTotalEmpresa > activeMes.capacidadSueldoSeguro && sueldoTotalEmpresa <= activeMes.saldoAcumulado
  const esSueldoPeligro = sueldoTotalEmpresa > activeMes.saldoAcumulado

  // Porcentajes para la barra de cascada
  const pctCompras = activeMes.ventasCobradas > 0
    ? Math.min(100, Math.round((activeMes.comprasDirectas / activeMes.ventasCobradas) * 100))
    : 0
  const pctOperativos = activeMes.ventasCobradas > 0
    ? Math.min(100 - pctCompras, Math.round((activeMes.gastosOperativos / activeMes.ventasCobradas) * 100))
    : 0
  const pctBlindados = activeMes.ventasCobradas > 0
    ? Math.min(100 - pctCompras - pctOperativos, Math.round((activeMes.totalBlindadosMes / activeMes.ventasCobradas) * 100))
    : 0
  const pctUtilidad = activeMes.ventasCobradas > 0
    ? Math.max(0, 100 - pctCompras - pctOperativos - pctBlindados)
    : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ========================================================================= */}
      {/* 1. CABECERA & CONTROLES DE NAVEGACIÓN                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[11px] font-medium border-border/50 text-muted-foreground bg-muted/60">
              {initialData.negocio === '3D' ? 'Taller 3D' : 'Board Games'}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Modelo Financiero P&L + Carry-over
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            Rentabilidad Mensual & Asignación de Sueldos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl">
            Evalúa la utilidad real del mes frente al colchón acumulado en caja, asegurando el pago de obligaciones antes de asignar retiros de socios o sueldos.
          </p>
        </div>

        {/* Selector de Mes Activo */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-card p-1.5 rounded-lg border border-border/60 shadow-none">
          <Calendar className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
          <select
            value={selectedMesKey}
            onChange={(e) => setSelectedMesKey(e.target.value)}
            className="text-xs font-semibold text-foreground bg-transparent outline-none cursor-pointer pr-2"
          >
            {initialData.meses.map((m) => (
              <option key={m.mesKey} value={m.mesKey}>
                {m.nombreMes} {m.mesKey === initialData.mesSeleccionado.mesKey ? '(Actual)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EL TRÍPTICO DE DECISIÓN FINANCIERA (KPIS DE RENTABILIDAD & CAJA)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TARJETA 1: UTILIDAD DEL MES (P&L PURO) */}
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              1. Utilidad del Mes ({activeMes.nombreMes.split(' ')[0]})
            </span>
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-md border',
                activeMes.utilidadMes >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              )}
            >
              {activeMes.margenOperativoPct}% Margen
            </span>
          </div>

          <div className="my-3">
            <div
              className={cn(
                'text-2xl font-semibold font-mono tracking-tight tabular-nums',
                activeMes.utilidadMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {activeMes.utilidadMes >= 0 ? '+' : ''}
              {formatCurrency(activeMes.utilidadMes)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">
              Rendimiento operativo generado exclusivamente en estos 30 días.
            </p>
          </div>

          {/* Micro cascada del mes */}
          <div className="pt-2 border-t border-border/40 space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Ventas Cobradas:</span>
              <span className="font-mono font-semibold text-foreground tabular-nums">
                {formatCurrency(activeMes.ventasCobradas)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>(-) Compras Material:</span>
              <span className="font-mono font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                -{formatCurrency(activeMes.comprasDirectas)}
              </span>
            </div>
            {activeMes.gastosPersonal > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>(-) Personal & Colaboradores:</span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400 tabular-nums">
                  -{formatCurrency(activeMes.gastosPersonal)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>(-) Gastos Operativos:</span>
              <span className="font-mono font-medium text-muted-foreground tabular-nums">
                -{formatCurrency(activeMes.gastosOperativos)}
              </span>
            </div>
            {activeMes.gastosBlindadosPagados > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>(-) Blindados Pagados:</span>
                <span className="font-mono font-medium text-rose-600 dark:text-rose-400 tabular-nums">
                  -{formatCurrency(activeMes.gastosBlindadosPagados)}
                </span>
              </div>
            )}
            {activeMes.compromisosPendientes > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  <span className="text-amber-600 dark:text-amber-400 font-medium">(-) Blindados a Fin de Mes:</span>
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                    -{formatCurrency(activeMes.compromisosPendientes)}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-border/40 font-semibold">
                  <span className="text-foreground">Utilidad Proyectada Cierre:</span>
                  <span
                    className={cn(
                      'font-mono tabular-nums',
                      activeMes.utilidadProyectadaCierre >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {activeMes.utilidadProyectadaCierre >= 0 ? '+' : ''}
                    {formatCurrency(activeMes.utilidadProyectadaCierre)} ({activeMes.margenProyectadoPct}%)
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* TARJETA 2: UTILIDAD / LIQUIDEZ ACUMULADA (CARRY-OVER) */}
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              2. Liquidez Acumulada (Caja)
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/50">
              Colchón Histórico
            </span>
          </div>

          <div className="my-3">
            <div
              className={cn(
                'text-2xl font-semibold font-mono tracking-tight tabular-nums',
                activeMes.saldoAcumulado >= 0 ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {formatCurrency(activeMes.saldoAcumulado)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">
              Efectivo real total en cuenta al cierre de {activeMes.nombreMes}.
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Saldo Inicial (Arrastre):</span>
              <span className="font-mono font-semibold text-foreground tabular-nums">
                {formatCurrency(activeMes.saldoInicial)}
              </span>
            </div>
            {activeMes.inyeccionCapital > 0 && (
              <div className="flex justify-between text-muted-foreground bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                <span className="text-blue-600 dark:text-blue-400 font-medium">(+) Préstamo / Aportes:</span>
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                  +{formatCurrency(activeMes.inyeccionCapital)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>(+) Utilidad Operativa del Mes:</span>
              <span
                className={cn(
                  'font-mono font-semibold tabular-nums',
                  activeMes.utilidadMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {activeMes.utilidadMes >= 0 ? '+' : ''}
                {formatCurrency(activeMes.utilidadMes)}
              </span>
            </div>
            {activeMes.activosFijosCapex > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>(-) Equipos / Capex:</span>
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  -{formatCurrency(activeMes.activosFijosCapex)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TARJETA 3: CAPACIDAD REAL DE SUELDO SEGURO */}
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              3. Capacidad Máxima de Sueldo
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {numSocios} Socios (50/50)
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-semibold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(activeMes.capacidadSueldoPorSocio || activeMes.capacidadSueldoSeguro / numSocios)}
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                c/u (por socio)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">
              Total disponible para ambos socios: <strong className="font-mono font-semibold text-foreground tabular-nums">{formatCurrency(activeMes.capacidadSueldoSeguro)}</strong> ({formatCurrency(activeMes.capacidadSueldoPorSocio || activeMes.capacidadSueldoSeguro / numSocios)} c/u).
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 space-y-1 text-xs">
            {activeMes.compromisosPendientes > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                <span>Cuotas / Servicios pendientes:</span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatCurrency(activeMes.compromisosPendientes)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Fondo de Reserva Total:</span>
              <span className="font-mono font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                {formatCurrency(activeMes.reservaObligaciones)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/40 font-medium">
              <span className="text-foreground">Diagnóstico Operativo:</span>
              <span
                className={cn(
                  'font-medium text-[11px]',
                  activeMes.estadoDiagnostico === 'EXCELENTE' && 'text-emerald-600 dark:text-emerald-400',
                  activeMes.estadoDiagnostico === 'RENTABLE' && 'text-emerald-600 dark:text-emerald-400',
                  activeMes.estadoDiagnostico === 'EQUILIBRIO' && 'text-amber-600 dark:text-amber-400',
                  activeMes.estadoDiagnostico === 'DEFICIT' && 'text-rose-600 dark:text-rose-400'
                )}
              >
                {activeMes.estadoDiagnostico}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CASCADA DE DISTRIBUCIÓN DEL INGRESO DEL MES                            */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Estructura de Distribución de Ventas ({activeMes.nombreMes})
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Cómo se consumen las ventas cobradas antes de llegar a la utilidad neta.
            </p>
          </div>
          <div className="text-xs font-mono font-semibold text-foreground tabular-nums">
            Total Ventas: {formatCurrency(activeMes.ventasCobradas)}
          </div>
        </div>

        {/* Barra Proporcional */}
        <div className="my-4">
          <div className="h-6 w-full rounded-xl overflow-hidden bg-muted/40 flex border border-border/60 p-0.5">
            {pctCompras > 0 && (
              <div
                style={{ width: `${pctCompras}%` }}
                className="bg-amber-500 rounded-l-lg flex items-center justify-center text-[10px] font-bold text-white truncate px-1 transition-all"
                title={`Compras de Insumos: ${formatCurrency(activeMes.comprasDirectas)} (${pctCompras}%)`}
              >
                {pctCompras > 12 ? `${pctCompras}% Material` : ''}
              </div>
            )}
            {pctOperativos > 0 && (
              <div
                style={{ width: `${pctOperativos}%` }}
                className="bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white truncate px-1 transition-all"
                title={`Gastos Operativos (Pauta/Envíos): ${formatCurrency(activeMes.gastosOperativos)} (${pctOperativos}%)`}
              >
                {pctOperativos > 12 ? `${pctOperativos}% Operativo` : ''}
              </div>
            )}
            {pctBlindados > 0 && (
              <div
                style={{ width: `${pctBlindados}%` }}
                className="bg-rose-500 flex items-center justify-center text-[10px] font-bold text-white truncate px-1 transition-all"
                title={`Gastos Blindados (BCP/Taller): ${formatCurrency(activeMes.totalBlindadosMes)} (${pctBlindados}%)`}
              >
                {pctBlindados > 12 ? `${pctBlindados}% Blindado` : ''}
              </div>
            )}
            {pctUtilidad > 0 && (
              <div
                style={{ width: `${pctUtilidad}%` }}
                className="bg-emerald-600 rounded-r-lg flex items-center justify-center text-[10px] font-bold text-white truncate px-1 transition-all"
                title={`Utilidad Limpia: ${formatCurrency(activeMes.utilidadMes)} (${pctUtilidad}%)`}
              >
                {pctUtilidad > 12 ? `${pctUtilidad}% Utilidad` : ''}
              </div>
            )}
          </div>

          {/* Leyenda de la Barra */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mt-3 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-border/50">
              <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">Compras Material:</span>
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  {formatCurrency(activeMes.comprasDirectas)} ({pctCompras}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-border/50">
              <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">Gastos Operativos:</span>
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  {formatCurrency(activeMes.gastosOperativos)} ({pctOperativos}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-border/50">
              <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">Gastos Blindados (BCP/Fijos):</span>
                <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatCurrency(activeMes.totalBlindadosMes)} ({pctBlindados}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-border/50">
              <div className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">Utilidad Pura del Mes:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(activeMes.utilidadMes)} ({pctUtilidad}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SIMULADOR INTERACTIVO DE ASIGNACIÓN DE SUELDO (2 SOCIOS)               */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-primary" />
              Simulador de Asignación de Sueldo o Retiro ({numSocios} Socios)
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Evalúa el impacto en la caja acumulada al retirar sueldos para los {numSocios} socios protegiendo la reserva técnica.
            </p>
          </div>
          <Badge variant="outline" className="text-[11px] font-semibold border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 self-start sm:self-auto flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Equipo de {numSocios} personas (50/50)
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 items-center">
          {/* Input de simulación */}
          <div className="lg:col-span-5 space-y-3">
            {/* Selector de modo: Por socio vs Total equipo */}
            <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground">
              <button
                type="button"
                onClick={() => setModoSimulacion('POR_SOCIO')}
                className={cn(
                  'flex-1 py-1.5 px-2.5 rounded-lg transition-all text-center cursor-pointer',
                  modoSimulacion === 'POR_SOCIO'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'hover:text-foreground'
                )}
              >
                Por Socio (c/u × {numSocios})
              </button>
              <button
                type="button"
                onClick={() => setModoSimulacion('TOTAL')}
                className={cn(
                  'flex-1 py-1.5 px-2.5 rounded-lg transition-all text-center cursor-pointer',
                  modoSimulacion === 'TOTAL'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'hover:text-foreground'
                )}
              >
                Total Empresa (ambos)
              </button>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                {modoSimulacion === 'POR_SOCIO'
                  ? `¿Cuánto sueldo o retiro por socio deseas? (c/u)`
                  : `¿Cuánto retiro total deseas para los ${numSocios} socios?`}
              </Label>
              <span className="text-[11px] font-mono font-medium text-muted-foreground tabular-nums">
                {modoSimulacion === 'POR_SOCIO'
                  ? `Total: ${formatCurrency(sueldoTotalEmpresa)}`
                  : `c/u: ${formatCurrency(sueldoPorSocio)}`}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                S/
              </span>
              <Input
                type="number"
                min="0"
                step="50"
                value={sueldoSimulado}
                onChange={(e) => setSueldoSimulado(e.target.value)}
                placeholder={modoSimulacion === 'POR_SOCIO' ? 'Ej. 400.00' : 'Ej. 800.00'}
                className="pl-9 h-11 text-base font-mono font-semibold border-border/80 bg-background text-foreground rounded-xl focus-visible:ring-ring"
              />
            </div>

            {/* Botones de montos rápidos adaptados */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(modoSimulacion === 'POR_SOCIO'
                ? [200, 300, 400, Math.floor(activeMes.capacidadSueldoPorSocio || activeMes.capacidadSueldoSeguro / numSocios)]
                : [400, 600, 800, Math.floor(activeMes.capacidadSueldoSeguro)]
              ).filter((v, idx, arr) => v > 0 && arr.indexOf(v) === idx).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSueldoSimulado(String(v))}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 text-foreground transition-colors cursor-pointer tabular-nums"
                >
                  S/ {v} {modoSimulacion === 'POR_SOCIO' ? 'c/u' : 'total'}
                </button>
              ))}
            </div>
          </div>

          {/* Resultado de la simulación */}
          <div className="lg:col-span-7 bg-muted/20 border border-border/60 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <span className="text-xs font-semibold text-muted-foreground">
                Diagnóstico del Retiro Simulado ({numSocios} personas)
              </span>
              {sueldoTotalEmpresa === 0 ? (
                <Badge variant="outline" className="text-[10px] bg-background border-border/60 text-muted-foreground">
                  Sin retiro ingresado
                </Badge>
              ) : esSueldoSeguro ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  100% Sostenible y Seguro
                </Badge>
              ) : esSueldoAlerta ? (
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Atención: Consume Reserva
                </Badge>
              ) : (
                <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Peligro: Fondos Insuficientes
                </Badge>
              )}
            </div>

            {/* 4 Tarjetas de desglose exacto */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 text-xs">
              <div className="bg-card p-2 rounded-lg border border-border/50">
                <span className="text-muted-foreground block text-[10px] font-medium truncate">Retiro c/u:</span>
                <span className="text-sm font-mono font-bold text-foreground block tabular-nums">
                  {formatCurrency(sueldoPorSocio)}
                </span>
                <span className="text-[9px] text-muted-foreground">por socio</span>
              </div>
              <div className="bg-card p-2 rounded-lg border border-border/50">
                <span className="text-muted-foreground block text-[10px] font-medium truncate">Total Empresa:</span>
                <span className="text-sm font-mono font-bold text-foreground block tabular-nums">
                  {formatCurrency(sueldoTotalEmpresa)}
                </span>
                <span className="text-[9px] text-muted-foreground">{numSocios} personas</span>
              </div>
              <div className="bg-card p-2 rounded-lg border border-border/50">
                <span className="text-muted-foreground block text-[10px] font-medium truncate">Caja Restante:</span>
                <span
                  className={cn(
                    'text-sm font-mono font-bold block tabular-nums',
                    saldoPostSueldo >= 0 ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {formatCurrency(saldoPostSueldo)}
                </span>
                <span className="text-[9px] text-muted-foreground">en cuenta</span>
              </div>
              <div className="bg-card p-2 rounded-lg border border-border/50">
                <span className="text-muted-foreground block text-[10px] font-medium truncate">Reserva Fija:</span>
                <span
                  className={cn(
                    'text-sm font-mono font-bold block tabular-nums',
                    colchonRestante >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {formatCurrency(activeMes.reservaObligaciones)} {colchonRestante >= 0 ? '✓' : '⚠️'}
                </span>
                <span className="text-[9px] text-muted-foreground">blindada</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
              {sueldoTotalEmpresa === 0 ? (
                'Ingresa un monto para simular la salud de la caja tras el retiro de ambos socios.'
              ) : esSueldoSeguro ? (
                `Excelente decisión: Asignar ${formatCurrency(sueldoPorSocio)} a cada socio (${formatCurrency(sueldoTotalEmpresa)} en total para las ${numSocios} personas) es 100% seguro. Quedarán ${formatCurrency(saldoPostSueldo)} en caja, cubriendo completamente la reserva de obligaciones fijas de ${formatCurrency(activeMes.reservaObligaciones)}.`
              ) : esSueldoAlerta ? (
                `Advertencia: Hay suficiente caja (${formatCurrency(activeMes.saldoAcumulado)}), pero al retirar ${formatCurrency(sueldoTotalEmpresa)} entre ambos socios (${formatCurrency(sueldoPorSocio)} c/u), invaden ${formatCurrency(Math.abs(colchonRestante))} de la reserva mínima necesaria para el próximo mes.`
              ) : (
                `Inviable: El retiro propuesto (${formatCurrency(sueldoTotalEmpresa)} total, ${formatCurrency(sueldoPorSocio)} c/u) supera la caja total disponible (${formatCurrency(activeMes.saldoAcumulado)}). Te descapitalizarías inmediatamente.`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TABLA DE AUDITORÍA & EVOLUCIÓN HISTÓRICA (SIN SCROLL HORIZONTAL)       */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />
              Evolución Mensual Consolidada (Auditoría de Arrastre)
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Demostración cronológica de cómo el saldo anterior alimenta el acumulado de cada mes, separando costos directos, gastos operativos y compromisos blindados.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Total Meses Auditados: <strong className="text-foreground">{initialData.meses.length}</strong>
          </div>
        </div>

        {/* Tabla Responsiva adaptada sin scroll horizontal (layout fluido) */}
        <div className="w-full">
          {/* Encabezados visibles en desktop */}
          <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-2 bg-muted/30 rounded-xl text-[11px] font-semibold text-muted-foreground border border-border/50 mb-2">
            <div className="col-span-2">Período / Mes</div>
            <div className="col-span-1 text-right">Saldo Inicial</div>
            <div className="col-span-2 text-right">Ventas Cobradas</div>
            <div className="col-span-1 text-right">Compras Mat.</div>
            <div className="col-span-2 text-right">Gastos Operativos</div>
            <div className="col-span-2 text-right">Gastos Blindados</div>
            <div className="col-span-1 text-right">Utilidad Mes</div>
            <div className="col-span-1 text-right">Saldo Acum.</div>
          </div>

          {/* Filas */}
          <div className="space-y-2">
            {initialData.meses.map((m) => {
              const isSelected = m.mesKey === selectedMesKey

              return (
                <div
                  key={m.mesKey}
                  onClick={() => setSelectedMesKey(m.mesKey)}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all cursor-pointer text-xs',
                    isSelected
                      ? 'bg-primary/5 border-primary/40 shadow-xs'
                      : 'bg-card border-border/50 hover:bg-muted/30'
                  )}
                >
                  {/* Vista Desktop (Grid fluido de 12 columnas sin scroll horizontal) */}
                  <div className="hidden lg:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2 font-semibold text-foreground flex flex-col justify-center truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', isSelected ? 'bg-primary' : 'bg-transparent')} />
                        <span className="truncate">{m.nombreMes}</span>
                      </div>
                      {m.inyeccionCapital > 0 && (
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium pl-3.5 truncate tabular-nums">
                          +{formatCurrency(m.inyeccionCapital)} financiamiento
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 text-right font-mono font-medium text-muted-foreground tabular-nums">
                      {formatCurrency(m.saldoInicial)}
                    </div>

                    <div className="col-span-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatCurrency(m.ventasCobradas)}
                    </div>

                    <div className="col-span-1 text-right font-mono font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                      -{formatCurrency(m.comprasDirectas)}
                    </div>

                    <div className="col-span-2 text-right font-mono font-medium text-orange-600 dark:text-orange-400 tabular-nums">
                      -{formatCurrency(m.gastosOperativos)}
                    </div>

                    <div className="col-span-2 text-right font-mono font-medium text-rose-600 dark:text-rose-400 tabular-nums">
                      -{formatCurrency(m.totalBlindadosMes)}
                    </div>

                    <div className="col-span-1 text-right">
                      <span
                        className={cn(
                          'font-mono font-semibold block tabular-nums',
                          m.utilidadMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {m.utilidadMes >= 0 ? '+' : ''}{formatCurrency(m.utilidadMes)}
                      </span>
                    </div>

                    <div className="col-span-1 text-right font-mono font-bold text-foreground tabular-nums">
                      {formatCurrency(m.saldoAcumulado)}
                    </div>
                  </div>

                  {/* Vista Móvil / Tablet Compacta (Cards fluidas sin scroll) */}
                  <div className="lg:hidden space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                      <span className="font-semibold text-foreground text-sm">
                        {m.nombreMes}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-mono tabular-nums',
                          m.utilidadMes >= 0 ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'text-rose-600 dark:text-rose-400 border-rose-500/20'
                        )}
                      >
                        {m.margenOperativoPct}% Margen
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground block">Ventas Cobradas:</span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatCurrency(m.ventasCobradas)}
                        </span>
                      </div>
                      {m.inyeccionCapital > 0 && (
                        <div>
                          <span className="text-sky-600 dark:text-sky-400 block font-medium">Inyección / Préstamo:</span>
                          <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                            +{formatCurrency(m.inyeccionCapital)}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground block">Compras Material:</span>
                        <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                          -{formatCurrency(m.comprasDirectas)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Gastos Operativos:</span>
                        <span className="font-mono font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                          -{formatCurrency(m.gastosOperativos)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Gastos Blindados:</span>
                        <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                          -{formatCurrency(m.totalBlindadosMes)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Utilidad del Mes:</span>
                        <span
                          className={cn(
                            'font-mono font-semibold tabular-nums',
                            m.utilidadMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {m.utilidadMes >= 0 ? '+' : ''}{formatCurrency(m.utilidadMes)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Saldo Acumulado:</span>
                        <span className="font-mono font-bold text-foreground tabular-nums">
                          {formatCurrency(m.saldoAcumulado)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. GUÍA CONCEPTUAL RÁPIDA (REGLAS DE ORO FINANCIERAS)                     */}
      {/* ========================================================================= */}
      <div className="bg-muted/20 border border-border/60 rounded-2xl p-5 text-xs text-muted-foreground space-y-2">
        <div className="font-semibold text-foreground flex items-center gap-1.5">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Reglas de Oro del Asesor Financiero para la Asignación de Sueldos:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>
            <strong>Nunca retires el 100% de la utilidad acumulada:</strong> Siempre mantén como mínimo una reserva equivalente a 1 mes de obligaciones fijas (luz, internet, cuota BCP, alquiler).
          </li>
          <li>
            <strong>El sueldo del operador es costo, no dividendo:</strong> Si trabajas activamente en el taller, fija un sueldo mensual realista dentro de tu capacidad segura y transfiérelo a tu cuenta personal con fecha fija.
          </li>
          <li>
            <strong>Monitorea el P&L mensual vs la Caja:</strong> Puedes tener meses con baja utilidad pero estar protegido por el saldo acumulado anterior; sin embargo, si la utilidad del mes es negativa por 2 meses consecutivos, debes revisar tus precios de venta o recortar gastos variables de inmediato.
          </li>
        </ul>
      </div>
    </div>
  )
}
