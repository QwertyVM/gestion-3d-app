'use client'

import React from 'react'
import {
  User,
  UserCheck,
  UserPlus,
  Search,
  Check,
  Phone,
  AtSign,
  Calendar,
  AlertTriangle,
  X,
  MapPin,
  Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClienteOption } from './types'

interface OrderCustomerSectionProps {
  clientSelectMode: 'EXISTING' | 'NEW'
  setClientSelectMode: (mode: 'EXISTING' | 'NEW') => void
  clientesList: ClienteOption[]
  selectedClientOption: ClienteOption | null
  onSelectClient: (client: ClienteOption) => void
  onClearSelectedClient: () => void
  onSwitchToNewClient: (presetName?: string) => void
  clientSearchTerm: string
  setClientSearchTerm: (term: string) => void
  isClientDropdownOpen: boolean
  setIsClientDropdownOpen: (open: boolean) => void
  filteredClientOptions: ClienteOption[]
  similarExistingClient: ClienteOption | null
  formFecha: string
  setFormFecha: (fecha: string) => void
  formCliente: string
  setFormCliente: (cliente: string) => void
  formTelefono: string
  setFormTelefono: (tel: string) => void
  formCanal: string
  setFormCanal: (canal: string) => void
  formHandleSocial: string
  setFormHandleSocial: (handle: string) => void
  formDestino: string
  setFormDestino: (dest: string) => void
  formDiaEntrega: string
  setFormDiaEntrega: (dia: string) => void
  isRegisteringClientInline: boolean
  onRegisterClientInline: () => void
}

export function OrderCustomerSection({
  clientSelectMode,
  setClientSelectMode,
  clientesList,
  selectedClientOption,
  onSelectClient,
  onClearSelectedClient,
  onSwitchToNewClient,
  clientSearchTerm,
  setClientSearchTerm,
  isClientDropdownOpen,
  setIsClientDropdownOpen,
  filteredClientOptions,
  similarExistingClient,
  formFecha,
  setFormFecha,
  formCliente,
  setFormCliente,
  formTelefono,
  setFormTelefono,
  formCanal,
  setFormCanal,
  formHandleSocial,
  setFormHandleSocial,
  formDestino,
  setFormDestino,
  formDiaEntrega,
  setFormDiaEntrega,
  isRegisteringClientInline,
  onRegisterClientInline
}: OrderCustomerSectionProps) {
  return (
    <div className="bg-card/70 border border-border rounded-xl p-5 mb-5 space-y-4 shadow-sm">
      {/* Encabezado de la Sección con Stepper Badge y Selector Segmentado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
        <div className="flex items-center">
          <span className="bg-primary/10 text-primary font-bold text-xs w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 shrink-0">
            1
          </span>
          <span className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            Datos del Cliente y Despacho
          </span>
        </div>

        {/* Control segmentado superior unificado (Tabs / Toggle Group) */}
        <div className="bg-muted p-1 rounded-xl flex gap-1 w-fit border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setClientSelectMode('EXISTING')
              setIsClientDropdownOpen(false)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              clientSelectMode === 'EXISTING'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            <span>Cliente Existente</span>
            <span className="bg-card text-muted-foreground px-2 py-0.5 rounded-full text-xs font-mono font-bold border border-border/60">
              {clientesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchToNewClient()}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              clientSelectMode === 'NEW'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5 text-primary" />
            <span>+ Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* 1. METADATOS DE LA ORDEN: Fila de 2 Columnas (Fecha del Pedido y Canal de Venta) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Fecha del Pedido */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-primary" />
            Fecha del Pedido *
          </Label>
          <Input
            type="date"
            required
            value={formFecha}
            onChange={(e) => setFormFecha(e.target.value)}
            className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Canal de Venta */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            Canal de Venta
          </Label>
          <select
            value={formCanal}
            onChange={(e) => setFormCanal(e.target.value)}
            className="w-full h-10 rounded-xl border border-input bg-card/80 text-foreground text-sm font-medium px-3 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="WhatsApp">WhatsApp</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="Feria">Feria / Presencial</option>
            <option value="Recomendación">Recomendación</option>
            <option value="Directo">Directo / Taller</option>
          </select>
        </div>
      </div>

      {/* 2. GESTIÓN DEL CLIENTE SEGÚN TAB ACTIVO */}
      {clientSelectMode === 'EXISTING' ? (
        <div className="space-y-3 pt-1">
          {selectedClientOption ? (
            /* Card compacta de cliente vinculado */
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center justify-center shrink-0">
                  {selectedClientOption.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                    {selectedClientOption.nombre}
                  </span>
                  {selectedClientOption.telefono && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/80 dark:bg-stone-900/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                      <Phone className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                      {selectedClientOption.telefono}
                    </span>
                  )}
                  {selectedClientOption.handleSocial && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/80 dark:bg-stone-900/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                      <AtSign className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                      {selectedClientOption.handleSocial.replace(/^@/, '')}
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearSelectedClient}
                className="text-xs h-7 px-2.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 font-medium flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              >
                <X className="h-3 w-3 text-stone-500" />
                <span>Cambiar</span>
              </Button>
            </div>
          ) : (
            /* Buscador de clientes registrados */
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar cliente registrado por nombre, teléfono o @instagram..."
                value={clientSearchTerm}
                onChange={(e) => {
                  setClientSearchTerm(e.target.value)
                  setIsClientDropdownOpen(true)
                }}
                onFocus={() => setIsClientDropdownOpen(true)}
                className="pl-9 pr-9 h-10 rounded-xl border-input bg-card text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60 w-full shadow-2xs"
              />
              {clientSearchTerm && (
                <button
                  type="button"
                  onClick={() => setClientSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Popover de autocompletado flotante */}
              {isClientDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-popover border border-border shadow-lg rounded-xl overflow-hidden py-1 z-50 max-h-60 overflow-y-auto divide-y divide-border/60 animate-in fade-in-50 duration-150">
                  <div className="px-3 py-1.5 bg-muted/50 text-[11px] font-bold text-muted-foreground flex items-center justify-between border-b border-border">
                    <span>
                      {clientSearchTerm.trim()
                        ? `Resultados para "${clientSearchTerm}" (${filteredClientOptions.length})`
                        : `Clientes registrados (${clientesList.length}) - Selecciona uno:`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsClientDropdownOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-medium"
                    >
                      Cerrar
                    </button>
                  </div>

                  {filteredClientOptions.length > 0 ? (
                    filteredClientOptions.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onSelectClient(c)}
                        className="hover:bg-muted/70 transition-colors cursor-pointer px-3 py-2 text-xs flex justify-between items-center group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-accent text-accent-foreground flex items-center justify-center font-bold text-xs shrink-0">
                            {c.nombre.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-xs text-foreground block truncate">
                              {c.nombre}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                              {c.telefono && <span>📞 {c.telefono}</span>}
                              {c.handleSocial && <span>@{c.handleSocial.replace(/^@/, '')}</span>}
                              {c.distrito && <span>📍 {c.distrito}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-mono">
                            {c.canalOrigen || c.canalPreferido || 'Directo'}
                          </span>
                          <span className="text-xs text-primary font-bold group-hover:translate-x-0.5 transition-transform">
                            Seleccionar →
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <p className="text-xs text-muted-foreground">
                        No se encontró ningún cliente registrado con &quot;{clientSearchTerm}&quot;.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onSwitchToNewClient(clientSearchTerm)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-xl"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        Registrar &quot;{clientSearchTerm}&quot; como nuevo cliente
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 3. ESTADO "NUEVO CLIENTE": Inputs Editables y Limpios en 3 Columnas */
        <div className="space-y-3 pt-1">
          {/* Advertencia preventiva si existe cliente similar */}
          {similarExistingClient && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in-50 duration-150">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-foreground">
                  <span className="font-bold block text-amber-800 dark:text-amber-200">
                    ¡Atención! Ya existe un cliente similar registrado:
                  </span>
                  <span className="text-muted-foreground">
                    &quot;{similarExistingClient.nombre}&quot;
                    {similarExistingClient.telefono ? ` (📞 ${similarExistingClient.telefono})` : ''}
                    {similarExistingClient.handleSocial ? ` (@${similarExistingClient.handleSocial.replace(/^@/, '')})` : ''}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => onSelectClient(similarExistingClient)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-xl shrink-0 h-8 font-semibold cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Usar &quot;{similarExistingClient.nombre}&quot;
              </Button>
            </div>
          )}

          {/* Cuadrícula de 3 Columnas Limpias y Editables */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Nombre Completo * */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User className="h-3 w-3 text-primary" />
                Nombre Completo *
              </Label>
              <Input
                required
                placeholder="Nombre del nuevo cliente..."
                value={formCliente}
                onChange={(e) => setFormCliente(e.target.value)}
                className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Teléfono / WhatsApp */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Phone className="h-3 w-3 text-primary" />
                Teléfono / WhatsApp
              </Label>
              <Input
                placeholder="Ej: 987654321"
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
                className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {/* @ Instagram */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <AtSign className="h-3 w-3 text-primary" />
                @ Instagram
              </Label>
              <Input
                placeholder="@usuario"
                value={formHandleSocial}
                onChange={(e) => setFormHandleSocial(e.target.value)}
                className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Opción de guardar en directorio */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
            <span className="text-[11px] text-muted-foreground">
              💡 Se registrará automáticamente con el pedido o puedes guardarlo de inmediato.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!formCliente.trim() || isRegisteringClientInline}
              onClick={onRegisterClientInline}
              className="text-[11px] h-7 border-border text-foreground bg-card hover:bg-muted rounded-xl cursor-pointer"
            >
              {isRegisteringClientInline ? 'Guardando...' : '💾 Guardar en Directorio'}
            </Button>
          </div>
        </div>
      )}

      {/* 4. FILA DE DESPACHO: 2 Columnas Limpias (Entrega Pactada y Destino / Agencia) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {/* Entrega Pactada */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary" />
            Entrega Pactada
          </Label>
          <Input
            placeholder="Ej: Sábado 18:00, Mañana en Shalom..."
            value={formDiaEntrega}
            onChange={(e) => setFormDiaEntrega(e.target.value)}
            className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Destino / Dirección / Agencia */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary" />
            Destino / Agencia
          </Label>
          <Input
            placeholder="Ej: Shalom Agencia Miraflores, Lima..."
            value={formDestino}
            onChange={(e) => setFormDestino(e.target.value)}
            className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
    </div>
  )
}
