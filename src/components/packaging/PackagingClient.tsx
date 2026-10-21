'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Package,
  Layers,
  Plus,
  ShoppingBag,
  ExternalLink,
  History,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StockCajasResumen, LoteCajaItem, getStockCajas } from '@/actions/cajas'
import { PackagingKpis } from './PackagingKpis'
import { PackagingLotsGrid } from './PackagingLotsGrid'
import { PackagingOrdersTable } from './PackagingOrdersTable'
import { NewBoxPurchaseModal } from './NewBoxPurchaseModal'
import { BoxLotsModal } from '@/components/pedidos/BoxLotsModal'

interface PackagingClientProps {
  initialStockCajas: StockCajasResumen
}

export function PackagingClient({ initialStockCajas }: PackagingClientProps) {
  const [stockCajas, setStockCajas] = useState<StockCajasResumen>(initialStockCajas)
  const [activeTab, setActiveTab] = useState<'LOTES' | 'PEDIDOS'>('LOTES')
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false)
  const [selectedLotDetail, setSelectedLotDetail] = useState<LoteCajaItem | null>(null)
  const [selectedLotFilter, setSelectedLotFilter] = useState<string | null>(null)

  const reloadStock = async () => {
    try {
      const updated = await getStockCajas()
      setStockCajas(updated)
    } catch (e) {
      console.error('Error reloading packaging stock:', e)
    }
  }

  const handleSelectLotFromGrid = (lote: LoteCajaItem) => {
    setSelectedLotFilter(lote.id)
    setActiveTab('PEDIDOS')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. ENCABEZADO PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Gestión de Packaging & Cajas
            </h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2 py-0.5 rounded-lg">
              {stockCajas.totalStockDisponible} disponibles
            </Badge>
            {stockCajas.loteReciente50 && (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                <Sparkles className="w-3 h-3 mr-1" /> Lote 50 activo @ S/ {stockCajas.loteReciente50.costoUnitario.toFixed(2)}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Control de inventario de cajas de empaque, lotes adquiridos y asignación por pedido.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <Link href="/pedidos">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs font-semibold rounded-xl border-border bg-card hover:bg-muted text-foreground cursor-pointer flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>Ver Pedidos</span>
            </Button>
          </Link>

          <Button
            onClick={() => setIsNewPurchaseModalOpen(true)}
            className="h-9 px-4 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-[0.98] border-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Compra de Cajas</span>
          </Button>
        </div>
      </div>

      {/* 2. TARJETAS DE KPIS PRINCIPALES */}
      <PackagingKpis stockCajas={stockCajas} />

      {/* 3. NAVEGACIÓN POR PESTAÑAS */}
      <div className="flex items-center justify-between border-b border-border/80 gap-3 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('LOTES')
              setSelectedLotFilter(null)
            }}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'LOTES'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Catálogo de Lotes & Tipos de Caja</span>
            <span className="sm:hidden">Lotes & Cajas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              activeTab === 'LOTES' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {stockCajas.lotes.filter((l) => l.stockDisponible > 0).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PEDIDOS')}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'PEDIDOS'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Trazabilidad de Asignaciones</span>
            <span className="sm:hidden">Asignaciones</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              activeTab === 'PEDIDOS' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {stockCajas.totalCajasAsignadas}
            </span>
          </button>
        </div>

        {activeTab === 'PEDIDOS' && selectedLotFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedLotFilter(null)}
            className="text-xs text-muted-foreground hover:text-foreground h-8 cursor-pointer"
          >
            Ver todos los pedidos
          </Button>
        )}
      </div>

      {/* 4. CONTENIDO SEGÚN PESTAÑA */}
      {activeTab === 'LOTES' ? (
        <PackagingLotsGrid
          lotes={stockCajas.lotes}
          loteReciente50Id={stockCajas.loteReciente50?.id}
          onSelectLot={handleSelectLotFromGrid}
          onStockUpdated={reloadStock}
        />
      ) : (
        <PackagingOrdersTable
          lotes={stockCajas.lotes}
          selectedLotFilter={selectedLotFilter}
          onClearLotFilter={() => setSelectedLotFilter(null)}
        />
      )}

      {/* 5. MODAL: REGISTRAR NUEVA COMPRA */}
      <NewBoxPurchaseModal
        isOpen={isNewPurchaseModalOpen}
        onClose={() => setIsNewPurchaseModalOpen(false)}
        onPurchaseSuccess={reloadStock}
      />
    </div>
  )
}
