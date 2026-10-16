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
  ChevronRight
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

  // Simulador de asignación de sueldo
  const [sueldoSimulado, setSueldoSimulado] = useState<string>('0')
  const sueldoNum = Math.max(0, parseFloat(sueldoSimulado) || 0)

  // Cálculos reactivos de la simulación
  const saldoPostSueldo = activeMes.saldoAcumulado - sueldoNum
  const colchonRestante = saldoPostSueldo - activeMes.reservaObligaciones
  const esSueldoSeguro = sueldoNum > 0 && sueldoNum <= activeMes.capacidadSueldoSeguro
  const esSueldoAlerta = sueldoNum > activeMes.capacidadSueldoSeguro && sueldoNum <= activeMes.saldoAcumulado
  const esSueldoPeligro = sueldoNum > activeMes.saldoAcumulado

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2D9CC]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[11px] font-bold border-[#E2D9CC] text-[#75695D] bg-white">
              {initialData.negocio === '3D' ? 'Taller 3D' : 'Board Games'}
            </Badge>
            <span className="text-xs text-[#75695D] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Modelo Financiero P&L + Carry-over
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#241C15] tracking-tight">
            Rentabilidad Mensual & Asignación de Sueldos
          </h1>
          <p className="text-xs sm:text-sm text-[#75695D] mt-1 max-w-3xl">
            Evalúa la utilidad real del mes frente al colchón acumulado en caja, asegurando el pago de obligaciones antes de asignar retiros de socios o sueldos.
          </p>
        </div>

        {/* Selector de Mes Activo */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-white p-1.5 rounded-2xl border border-[#E2D9CC] shadow-2xs">
          <Calendar className="w-4 h-4 text-[#75695D] ml-2 shrink-0" />
          <select
            value={selectedMesKey}
            onChange={(e) => setSelectedMesKey(e.target.value)}
            className="text-xs font-bold text-[#241C15] bg-transparent outline-none cursor-pointer pr-2"
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
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1ECE4]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#75695D] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              1. Utilidad del Mes ({activeMes.nombreMes.split(' ')[0]})
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                activeMes.utilidadMes >= 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              )}
            >
              {activeMes.margenOperativoPct}% Margen
            </span>
          </div>

          <div className="my-3">
            <div
              className={cn(
                'text-3xl font-extrabold font-mono tracking-tight',
                activeMes.utilidadMes >= 0 ? 'text-emerald-800' : 'text-red-700'
              )}
            >
              {activeMes.utilidadMes >= 0 ? '+' : ''}
              {formatCurrency(activeMes.utilidadMes)}
            </div>
            <p className="text-[11px] text-[#75695D] mt-1 font-medium">
              Rendimiento operativo generado exclusivamente en estos 30 días.
            </p>
          </div>

          {/* Micro cascada del mes */}
          <div className="pt-2 border-t border-[#F1ECE4] space-y-1 text-xs">
            <div className="flex justify-between text-[#75695D]">
              <span>Ventas Cobradas:</span>
              <span className="font-mono font-bold text-[#241C15]">
                {formatCurrency(activeMes.ventasCobradas)}
              </span>
            </div>
            <div className="flex justify-between text-[#75695D]">
              <span>(-) Compras Material:</span>
              <span className="font-mono font-bold text-amber-800">
                -{formatCurrency(activeMes.comprasDirectas)}
              </span>
            </div>
            <div className="flex justify-between text-[#75695D]">
              <span>(-) Gastos Operativos (Pauta & Envíos):</span>
              <span className="font-mono font-bold text-orange-700">
                -{formatCurrency(activeMes.gastosOperativos)}
              </span>
            </div>
            {activeMes.gastosBlindadosPagados > 0 && (
              <div className="flex justify-between text-[#75695D]">
                <span>(-) Gastos Blindados Pagados (BCP/Taller):</span>
                <span className="font-mono font-bold text-red-700">
                  -{formatCurrency(activeMes.gastosBlindadosPagados)}
                </span>
              </div>
            )}
            {activeMes.compromisosPendientes > 0 && (
              <>
                <div className="flex justify-between text-[#75695D] bg-amber-50/70 px-1.5 py-0.5 rounded border border-amber-200/60">
                  <span className="text-amber-900 font-medium">(-) Blindados a Fin de Mes:</span>
                  <span className="font-mono font-bold text-amber-900">
                    -{formatCurrency(activeMes.compromisosPendientes)}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-[#F1ECE4] font-bold">
                  <span className="text-[#241C15]">Utilidad Proyectada Cierre:</span>
                  <span
                    className={cn(
                      'font-mono',
                      activeMes.utilidadProyectadaCierre >= 0 ? 'text-emerald-800' : 'text-red-700'
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
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1ECE4]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#75695D] flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#A36F4C]" />
              2. Liquidez Acumulada (Caja)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4EFEA] text-[#241C15] border border-[#E2D9CC]">
              Colchón Histórico
            </span>
          </div>

          <div className="my-3">
            <div
              className={cn(
                'text-3xl font-extrabold font-mono tracking-tight',
                activeMes.saldoAcumulado >= 0 ? 'text-[#241C15]' : 'text-red-700'
              )}
            >
              {formatCurrency(activeMes.saldoAcumulado)}
            </div>
            <p className="text-[11px] text-[#75695D] mt-1 font-medium">
              Efectivo real total en cuenta al cierre de {activeMes.nombreMes}.
            </p>
          </div>

          <div className="pt-2 border-t border-[#F1ECE4] space-y-1 text-xs">
            <div className="flex justify-between text-[#75695D]">
              <span>Saldo Inicial (Arrastre):</span>
              <span className="font-mono font-bold text-[#241C15]">
                {formatCurrency(activeMes.saldoInicial)}
              </span>
            </div>
            {activeMes.inyeccionCapital > 0 && (
              <div className="flex justify-between text-[#75695D] bg-sky-50/70 px-1.5 py-0.5 rounded border border-sky-200/60">
                <span className="text-sky-900 font-medium">(+) Préstamo / Aportes:</span>
                <span className="font-mono font-bold text-sky-900">
                  +{formatCurrency(activeMes.inyeccionCapital)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-[#75695D]">
              <span>(+) Utilidad Operativa del Mes:</span>
              <span
                className={cn(
                  'font-mono font-bold',
                  activeMes.utilidadMes >= 0 ? 'text-emerald-800' : 'text-red-700'
                )}
              >
                {activeMes.utilidadMes >= 0 ? '+' : ''}
                {formatCurrency(activeMes.utilidadMes)}
              </span>
            </div>
            {activeMes.activosFijosCapex > 0 && (
              <div className="flex justify-between text-[#75695D]">
                <span>(-) Equipos / Capex:</span>
                <span className="font-mono font-bold text-[#A36F4C]">
                  -{formatCurrency(activeMes.activosFijosCapex)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TARJETA 3: CAPACIDAD REAL DE SUELDO SEGURO */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 border-2 border-emerald-600/30 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              3. Capacidad Máxima de Sueldo
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              100% Protegido
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl font-extrabold font-mono tracking-tight text-emerald-800">
              {formatCurrency(activeMes.capacidadSueldoSeguro)}
            </div>
            <p className="text-[11px] text-emerald-900 mt-1 font-medium">
              Monto que puedes retirar hoy sin comprometer las cuotas ni servicios del mes siguiente.
            </p>
          </div>

          <div className="pt-2 border-t border-emerald-100 space-y-1 text-xs">
            {activeMes.compromisosPendientes > 0 && (
              <div className="flex justify-between text-amber-900 font-semibold bg-amber-50/70 px-1.5 py-0.5 rounded border border-amber-200/60">
                <span>Cuotas / Servicios pendientes:</span>
                <span className="font-mono font-bold">
                  {formatCurrency(activeMes.compromisosPendientes)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-[#75695D]">
              <span>Fondo de Reserva Total:</span>
              <span className="font-mono font-bold text-amber-800">
                {formatCurrency(activeMes.reservaObligaciones)}
              </span>
            </div>
            <div className="flex justify-between text-[#75695D]">
              <span>Diagnóstico Operativo:</span>
              <span
                className={cn(
                  'font-bold text-[11px]',
                  activeMes.estadoDiagnostico === 'EXCELENTE' && 'text-emerald-800',
                  activeMes.estadoDiagnostico === 'RENTABLE' && 'text-emerald-700',
                  activeMes.estadoDiagnostico === 'EQUILIBRIO' && 'text-amber-800',
                  activeMes.estadoDiagnostico === 'DEFICIT' && 'text-red-700'
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
      <div className="bg-white border border-[#E2D9CC] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F1ECE4]">
          <div>
            <h3 className="text-sm font-bold text-[#241C15]">
              Estructura de Distribución de Ventas ({activeMes.nombreMes})
            </h3>
            <p className="text-[11px] text-[#75695D] mt-0.5">
              Cómo se consumen las ventas cobradas antes de llegar a la utilidad neta.
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-[#241C15]">
            Total Ventas: {formatCurrency(activeMes.ventasCobradas)}
          </div>
        </div>

        {/* Barra Proporcional */}
        <div className="my-4">
          <div className="h-6 w-full rounded-xl overflow-hidden bg-[#F4EFEA] flex border border-[#E2D9CC] p-0.5">
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
                className="bg-red-500 flex items-center justify-center text-[10px] font-bold text-white truncate px-1 transition-all"
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
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[#75695D] block text-[10px]">Compras Material:</span>
                <span className="font-mono font-bold text-[#241C15]">
                  {formatCurrency(activeMes.comprasDirectas)} ({pctCompras}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[#75695D] block text-[10px]">Gastos Operativos:</span>
                <span className="font-mono font-bold text-[#241C15]">
                  {formatCurrency(activeMes.gastosOperativos)} ({pctOperativos}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[#75695D] block text-[10px]">Gastos Blindados (BCP/Fijos):</span>
                <span className="font-mono font-bold text-red-700">
                  {formatCurrency(activeMes.totalBlindadosMes)} ({pctBlindados}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <div className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[#75695D] block text-[10px]">Utilidad Pura del Mes:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {formatCurrency(activeMes.utilidadMes)} ({pctUtilidad}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SIMULADOR INTERACTIVO DE ASIGNACIÓN DE SUELDO                          */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2D9CC] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-[#F1ECE4]">
          <Sliders className="w-4 h-4 text-[#A36F4C]" />
          <div>
            <h3 className="text-sm font-bold text-[#241C15]">
              Simulador de Asignación de Sueldo o Retiro
            </h3>
            <p className="text-[11px] text-[#75695D]">
              Ingresa el sueldo mensual que deseas asignarte para evaluar el impacto en la caja acumulada y la reserva de seguridad.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 items-center">
          {/* Input de simulación */}
          <div className="lg:col-span-5 space-y-3">
            <Label className="text-xs font-bold text-[#241C15]">
              ¿Cuánto sueldo o retiro deseas asignarte? (S/)
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#75695D]">
                S/
              </span>
              <Input
                type="number"
                min="0"
                step="50"
                value={sueldoSimulado}
                onChange={(e) => setSueldoSimulado(e.target.value)}
                placeholder="Ej. 800.00"
                className="pl-9 h-11 text-base font-mono font-bold border-[#E2D9CC] bg-[#F8F6F2] text-[#241C15] rounded-xl focus:bg-white"
              />
            </div>

            {/* Botones de montos rápidos */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[200, 400, 800, 1200, Math.round(activeMes.capacidadSueldoSeguro)].filter(v => v > 0).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSueldoSimulado(String(v))}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#E2D9CC] bg-[#F4EFEA] hover:bg-[#EAE4DB] text-[#241C15] transition-colors cursor-pointer"
                >
                  S/ {v}
                </button>
              ))}
            </div>
          </div>

          {/* Resultado de la simulación */}
          <div className="lg:col-span-7 bg-[#F8F6F2] border border-[#E2D9CC] rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]">
              <span className="text-xs font-bold text-[#75695D]">
                Diagnóstico del Retiro Simulado
              </span>
              {sueldoNum === 0 ? (
                <Badge variant="outline" className="text-[10px] bg-white border-[#E2D9CC]">
                  Sin retiro ingresado
                </Badge>
              ) : esSueldoSeguro ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  100% Sostenible y Seguro
                </Badge>
              ) : esSueldoAlerta ? (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Atención: Consume Reserva
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-900 border-red-300 text-[10px] font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Peligro: Fondos Insuficientes
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 my-3 text-xs">
              <div>
                <span className="text-[#75695D] block text-[11px]">Saldo Acumulado Restante:</span>
                <span
                  className={cn(
                    'text-base font-mono font-extrabold block',
                    saldoPostSueldo >= 0 ? 'text-[#241C15]' : 'text-red-700'
                  )}
                >
                  {formatCurrency(saldoPostSueldo)}
                </span>
              </div>
              <div>
                <span className="text-[#75695D] block text-[11px]">Reserva de Obligaciones:</span>
                <span
                  className={cn(
                    'text-base font-mono font-extrabold block',
                    colchonRestante >= 0 ? 'text-emerald-800' : 'text-amber-800'
                  )}
                >
                  {formatCurrency(activeMes.reservaObligaciones)} {colchonRestante >= 0 ? '✓' : '⚠️'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#75695D] leading-relaxed pt-2 border-t border-[#E2D9CC]/70">
              {sueldoNum === 0 ? (
                'Ingresa un monto para simular la salud de la caja tras el pago de sueldo.'
              ) : esSueldoSeguro ? (
                `Excelente decisión: Puedes pagarte S/ ${sueldoNum.toFixed(2)} y aún quedarán ${formatCurrency(saldoPostSueldo)} en caja, cubriendo completamente la reserva de obligaciones fijas de ${formatCurrency(activeMes.reservaObligaciones)}.`
              ) : esSueldoAlerta ? (
                `Advertencia: Hay suficiente caja (${formatCurrency(activeMes.saldoAcumulado)}), pero al pagarte S/ ${sueldoNum.toFixed(2)}, invades ${formatCurrency(Math.abs(colchonRestante))} de la reserva mínima necesaria para el próximo mes.`
              ) : (
                `Inviable: El sueldo propuesto (S/ ${sueldoNum.toFixed(2)}) supera la caja total acumulada disponible (${formatCurrency(activeMes.saldoAcumulado)}). Te descapitalizarías inmediatamente.`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TABLA DE AUDITORÍA & EVOLUCIÓN HISTÓRICA (SIN SCROLL HORIZONTAL)       */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2D9CC] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F1ECE4]">
          <div>
            <h3 className="text-sm font-bold text-[#241C15] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#A36F4C]" />
              Evolución Mensual Consolidada (Auditoría de Arrastre)
            </h3>
            <p className="text-[11px] text-[#75695D] mt-0.5">
              Demostración cronológica de cómo el saldo anterior alimenta el acumulado de cada mes, separando costos directos, gastos operativos y compromisos blindados.
            </p>
          </div>
          <div className="text-xs text-[#75695D]">
            Total Meses Auditados: <strong className="text-[#241C15]">{initialData.meses.length}</strong>
          </div>
        </div>

        {/* Tabla Responsiva adaptada sin scroll horizontal (layout fluido) */}
        <div className="w-full">
          {/* Encabezados visibles en desktop */}
          <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-2 bg-[#F8F6F2] rounded-xl text-[11px] font-bold text-[#75695D] border border-[#E2D9CC] mb-2">
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
                      ? 'bg-amber-50/50 border-amber-600/40 shadow-xs'
                      : 'bg-white border-[#E2D9CC] hover:bg-[#F8F6F2]'
                  )}
                >
                  {/* Vista Desktop (Grid fluido de 12 columnas sin scroll horizontal) */}
                  <div className="hidden lg:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2 font-bold text-[#241C15] flex flex-col justify-center truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', isSelected ? 'bg-amber-600' : 'bg-transparent')} />
                        <span className="truncate">{m.nombreMes}</span>
                      </div>
                      {m.inyeccionCapital > 0 && (
                        <span className="text-[10px] text-sky-700 font-medium pl-3.5 truncate">
                          +{formatCurrency(m.inyeccionCapital)} financiamiento
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 text-right font-mono font-medium text-[#75695D]">
                      {formatCurrency(m.saldoInicial)}
                    </div>

                    <div className="col-span-2 text-right font-mono font-bold text-emerald-800">
                      +{formatCurrency(m.ventasCobradas)}
                    </div>

                    <div className="col-span-1 text-right font-mono font-medium text-amber-800">
                      -{formatCurrency(m.comprasDirectas)}
                    </div>

                    <div className="col-span-2 text-right font-mono font-medium text-orange-700">
                      -{formatCurrency(m.gastosOperativos)}
                    </div>

                    <div className="col-span-2 text-right font-mono font-medium text-red-700">
                      -{formatCurrency(m.totalBlindadosMes)}
                    </div>

                    <div className="col-span-1 text-right">
                      <span
                        className={cn(
                          'font-mono font-bold block',
                          m.utilidadMes >= 0 ? 'text-emerald-800' : 'text-red-700'
                        )}
                      >
                        {m.utilidadMes >= 0 ? '+' : ''}{formatCurrency(m.utilidadMes)}
                      </span>
                    </div>

                    <div className="col-span-1 text-right font-mono font-extrabold text-[#241C15]">
                      {formatCurrency(m.saldoAcumulado)}
                    </div>
                  </div>

                  {/* Vista Móvil / Tablet Compacta (Cards fluidas sin scroll) */}
                  <div className="lg:hidden space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#E2D9CC]">
                      <span className="font-bold text-[#241C15] text-sm">
                        {m.nombreMes}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-mono',
                          m.utilidadMes >= 0 ? 'text-emerald-800 border-emerald-300' : 'text-red-800 border-red-300'
                        )}
                      >
                        {m.margenOperativoPct}% Margen
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-[#75695D] block">Ventas Cobradas:</span>
                        <span className="font-mono font-semibold text-emerald-800">
                          +{formatCurrency(m.ventasCobradas)}
                        </span>
                      </div>
                      {m.inyeccionCapital > 0 && (
                        <div>
                          <span className="text-sky-900 block font-medium">Inyección / Préstamo:</span>
                          <span className="font-mono font-semibold text-sky-700">
                            +{formatCurrency(m.inyeccionCapital)}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-[#75695D] block">Compras Material:</span>
                        <span className="font-mono font-semibold text-amber-800">
                          -{formatCurrency(m.comprasDirectas)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#75695D] block">Gastos Operativos:</span>
                        <span className="font-mono font-semibold text-orange-700">
                          -{formatCurrency(m.gastosOperativos)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#75695D] block">Gastos Blindados:</span>
                        <span className="font-mono font-semibold text-red-700">
                          -{formatCurrency(m.totalBlindadosMes)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#75695D] block">Utilidad del Mes:</span>
                        <span
                          className={cn(
                            'font-mono font-bold',
                            m.utilidadMes >= 0 ? 'text-emerald-800' : 'text-red-700'
                          )}
                        >
                          {m.utilidadMes >= 0 ? '+' : ''}{formatCurrency(m.utilidadMes)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#75695D] block">Saldo Acumulado:</span>
                        <span className="font-mono font-bold text-[#241C15]">
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
      <div className="bg-[#F4EFEA] border border-[#E2D9CC] rounded-2xl p-5 text-xs text-[#75695D] space-y-2">
        <div className="font-bold text-[#241C15] flex items-center gap-1.5">
          <Info className="w-4 h-4 text-amber-700" />
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
