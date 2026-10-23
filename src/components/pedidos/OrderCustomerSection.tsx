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
import { DeliveryDatePicker } from './DeliveryDatePicker'

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
    <div className="space-y-4">
      {/* Encabezado Minimalista de Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-border/50 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted-foreground">01.</span>
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Cliente &amp; Despacho
          </span>
        </div>

        {/* Control segmentado minimalista */}
        <div className="inline-flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setClientSelectMode('EXISTING')
              setIsClientDropdownOpen(false)
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              clientSelectMode === 'EXISTING'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Cliente Registrado</span>
            <span className="text-[10px] font-mono text-muted-foreground ml-0.5">
              ({clientesList.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchToNewClient()}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              clientSelectMode === 'NEW'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>+ Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* 1. METADATOS DE LA ORDEN: Fecha y Canal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            Fecha del Pedido *
          </Label>
          <Input
            type="date"
            required
            value={formFecha}
            onChange={(e) => setFormFecha(e.target.value)}
            className="h-9 rounded-lg border-border/70 bg-background text-foreground text-xs font-mono focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Canal de Venta
          </Label>
          <select
            value={formCanal}
            onChange={(e) => setFormCanal(e.target.value)}
            className="w-full h-9 rounded-lg border border-border/70 bg-background text-foreground text-xs font-medium px-2.5 focus:outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
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

      {/* 2. GESTIÓN DEL CLIENTE */}
      {clientSelectMode === 'EXISTING' ? (
        <div className="space-y-2 pt-0.5">
          {selectedClientOption ? (
            /* Fila de cliente seleccionado */
            <div className="bg-muted/30 border border-border/60 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-md bg-foreground/10 text-foreground font-semibold text-xs flex items-center justify-center shrink-0">
                  {selectedClientOption.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold text-foreground truncate">
                    {selectedClientOption.nombre}
                  </span>
                  {selectedClientOption.telefono && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                      <Phone className="h-2.5 w-2.5" />
                      {selectedClientOption.telefono}
                    </span>
                  )}
                  {selectedClientOption.handleSocial && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                      <AtSign className="h-2.5 w-2.5" />
                      {selectedClientOption.handleSocial.replace(/^@/, '')}
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearSelectedClient}
                className="text-xs h-7 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted font-medium flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Cambiar</span>
              </Button>
            </div>
          ) : (
            /* Buscador de clientes registrados */
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por nombre, teléfono o @instagram..."
                value={clientSearchTerm}
                onChange={(e) => {
                  setClientSearchTerm(e.target.value)
                  setIsClientDropdownOpen(true)
                }}
                onFocus={() => setIsClientDropdownOpen(true)}
                className="pl-8.5 pr-8 h-9 rounded-lg border-border/70 bg-background text-foreground text-xs focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/60 w-full"
              />
              {clientSearchTerm && (
                <button
                  type="button"
                  onClick={() => setClientSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Popover de autocompletado flotante */}
              {isClientDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-popover border border-border shadow-lg rounded-xl overflow-hidden py-1 z-50 max-h-60 overflow-y-auto divide-y divide-border/50 animate-in fade-in-50 duration-150">
                  <div className="px-3 py-1.5 bg-muted/40 text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                    <span>
                      {clientSearchTerm.trim()
                        ? `Resultados para "${clientSearchTerm}" (${filteredClientOptions.length})`
                        : `Clientes registrados (${clientesList.length})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsClientDropdownOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>

                  {filteredClientOptions.length > 0 ? (
                    filteredClientOptions.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onSelectClient(c)}
                        className="hover:bg-muted/60 transition-colors cursor-pointer px-3 py-2 text-xs flex justify-between items-center group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-6 w-6 rounded-md bg-muted text-foreground flex items-center justify-center font-medium text-[11px] shrink-0">
                            {c.nombre.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="font-medium text-xs text-foreground block truncate">
                              {c.nombre}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                              {c.telefono && <span>{c.telefono}</span>}
                              {c.handleSocial && <span>@{c.handleSocial.replace(/^@/, '')}</span>}
                              {c.distrito && <span>{c.distrito}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                            {c.canalOrigen || c.canalPreferido || 'Directo'}
                          </span>
                          <span className="text-xs text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                            Elegir →
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <p className="text-xs text-muted-foreground">
                        No se encontró ningún cliente con &quot;{clientSearchTerm}&quot;.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onSwitchToNewClient(clientSearchTerm)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-lg h-8"
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
        /* ESTADO "NUEVO CLIENTE" */
        <div className="space-y-3 pt-0.5">
          {similarExistingClient && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">
                    Existe un cliente similar: &quot;{similarExistingClient.nombre}&quot;
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {similarExistingClient.telefono ? `Tel: ${similarExistingClient.telefono}` : ''}
                    {similarExistingClient.handleSocial ? ` • @${similarExistingClient.handleSocial.replace(/^@/, '')}` : ''}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => onSelectClient(similarExistingClient)}
                className="bg-muted hover:bg-muted/80 text-foreground border border-border/60 text-xs rounded-md shrink-0 h-7 font-medium cursor-pointer"
              >
                <Check className="h-3 w-3 mr-1" />
                Usar existente
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                Nombre Completo *
              </Label>
              <Input
                required
                placeholder="Nombre del cliente..."
                value={formCliente}
                onChange={(e) => setFormCliente(e.target.value)}
                className="h-9 rounded-lg border-border/70 bg-background text-foreground text-xs focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                Teléfono / WhatsApp
              </Label>
              <Input
                placeholder="Ej: 987654321"
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
                className="h-9 rounded-lg border-border/70 bg-background text-foreground text-xs font-mono focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <AtSign className="h-3 w-3 text-muted-foreground" />
                @ Instagram
              </Label>
              <Input
                placeholder="@usuario"
                value={formHandleSocial}
                onChange={(e) => setFormHandleSocial(e.target.value)}
                className="h-9 rounded-lg border-border/70 bg-background text-foreground text-xs focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">
              Se vinculará automáticamente al guardar la orden.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!formCliente.trim() || isRegisteringClientInline}
              onClick={onRegisterClientInline}
              className="text-[11px] h-7 border-border/60 text-muted-foreground hover:text-foreground bg-background rounded-md cursor-pointer shrink-0"
            >
              {isRegisteringClientInline ? 'Guardando...' : 'Guardar en Directorio'}
            </Button>
          </div>
        </div>
      )}

      {/* 3. FILA DE DESPACHO: Entrega Pactada y Destino */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            Entrega Pactada
          </Label>
          <DeliveryDatePicker
            value={formDiaEntrega}
            onChange={setFormDiaEntrega}
            placeholder="Seleccionar fecha pactada..."
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            Destino / Agencia
          </Label>
          <Input
            placeholder="Ej: Shalom Agencia Miraflores, Lima..."
            value={formDestino}
            onChange={(e) => setFormDestino(e.target.value)}
            className="h-9 rounded-lg border-border/70 bg-background text-foreground text-xs focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
    </div>
  )
}
