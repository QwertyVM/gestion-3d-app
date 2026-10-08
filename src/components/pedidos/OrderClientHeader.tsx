'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  User,
  UserCheck,
  UserPlus,
  Search,
  Check,
  Phone,
  AtSign,
  AlertTriangle,
  X,
  RotateCcw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClienteOption } from './types'

interface OrderClientHeaderProps {
  clientSelectMode: 'EXISTING' | 'NEW'
  setClientSelectMode: (mode: 'EXISTING' | 'NEW') => void
  selectedClientOption: ClienteOption | null
  onSelectClient: (client: ClienteOption) => void
  onSwitchToNewClient: (presetName?: string) => void
  clientesList: ClienteOption[]
  formCliente: string
  setFormCliente: (v: string) => void
  formTelefono: string
  setFormTelefono: (v: string) => void
  formHandleSocial: string
  setFormHandleSocial: (v: string) => void
  formCanal: string
  setFormCanal: (v: string) => void
  formDestino: string
  setFormDestino: (v: string) => void
}

export function OrderClientHeader({
  clientSelectMode,
  setClientSelectMode,
  selectedClientOption,
  onSelectClient,
  onSwitchToNewClient,
  clientesList,
  formCliente,
  setFormCliente,
  formTelefono,
  setFormTelefono,
  formHandleSocial,
  setFormHandleSocial,
  formCanal,
  setFormCanal,
  formDestino,
  setFormDestino
}: OrderClientHeaderProps) {
  const [isChangingClient, setIsChangingClient] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Filtrado reactivo en tiempo real
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) {
      return (clientesList || []).slice(0, 25)
    }
    const q = searchTerm.trim().toLowerCase()
    const qNorm = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return (clientesList || []).filter(c => {
      const n = (c.nombre || '').toLowerCase()
      const nNorm = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const t = c.telefono || ''
      const h = (c.handleSocial || '').toLowerCase()
      return n.includes(q) || nNorm.includes(qNorm) || t.includes(q) || h.includes(q)
    }).slice(0, 20)
  }, [clientesList, searchTerm])

  // Detección de similitud en modo nuevo cliente
  const similarExistingClient = useMemo(() => {
    if (clientSelectMode !== 'NEW' || !formCliente.trim()) return null
    const cleanInput = formCliente.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return (clientesList || []).find(c => {
      const cleanC = (c.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      return cleanC === cleanInput || (cleanInput.length >= 4 && cleanC.includes(cleanInput))
    }) || null
  }, [clientSelectMode, formCliente, clientesList])

  // Click outside listener para el dropdown de búsqueda
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChooseClient = (client: ClienteOption) => {
    onSelectClient(client)
    setIsChangingClient(false)
    setIsDropdownOpen(false)
    setSearchTerm('')
  }

  const handleStartChanging = () => {
    setIsChangingClient(true)
    setSearchTerm('')
    setIsDropdownOpen(true)
  }

  const handleCancelChanging = () => {
    setIsChangingClient(false)
    setIsDropdownOpen(false)
    setSearchTerm('')
  }

  const handleTriggerNewClient = (presetName?: string) => {
    onSwitchToNewClient(presetName || searchTerm.trim())
    setIsChangingClient(false)
    setIsDropdownOpen(false)
  }

  // Iniciales del cliente
  const getInitials = (name: string) => {
    if (!name) return 'CL'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-3">
      {/* CASO 1: Cliente registrado y NO en proceso de cambio (BANNER COMPACTO DE 1 FILA) */}
      {clientSelectMode === 'EXISTING' && selectedClientOption && !isChangingClient && (
        <div className="bg-stone-50 border border-border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all duration-150">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar sutil con iniciales */}
            <div className="bg-secondary text-primary font-bold text-xs w-8 h-8 rounded-full flex items-center justify-center border border-border shrink-0 select-none shadow-2xs">
              {getInitials(selectedClientOption.nombre)}
            </div>

            <div className="min-w-0 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-[280px]">
                {selectedClientOption.nombre}
              </span>

              {/* Badge discreto Cliente Vinculado */}
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0">
                <Check className="h-2.5 w-2.5" />
                Cliente Vinculado
              </span>

              {/* Detalles secundarios en text-xs text-muted-foreground */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {selectedClientOption.telefono && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground/70" />
                    {selectedClientOption.telefono}
                  </span>
                )}
                {selectedClientOption.handleSocial && (
                  <span className="inline-flex items-center gap-0.5 text-[#BE185D]">
                    <AtSign className="h-3 w-3" />
                    {selectedClientOption.handleSocial.replace(/^@/, '')}
                  </span>
                )}
                {(selectedClientOption.canalOrigen || selectedClientOption.canalPreferido) && (
                  <span className="font-mono text-[10px] bg-secondary/80 px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">
                    {selectedClientOption.canalOrigen || selectedClientOption.canalPreferido}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStartChanging}
              className="h-7 text-xs border-border hover:bg-muted font-medium cursor-pointer"
            >
              <Search className="h-3 w-3 mr-1 text-muted-foreground" />
              Cambiar
            </Button>
          </div>
        </div>
      )}

      {/* CASO 2: Modo Cambio de Cliente (Input de Búsqueda con Autocompletado en Tiempo Real) */}
      {(isChangingClient || (clientSelectMode === 'EXISTING' && !selectedClientOption)) && (
        <div ref={searchContainerRef} className="relative bg-card border border-border rounded-xl p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/60">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-primary" />
              Buscar cliente registrado
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTriggerNewClient()}
                className="text-xs text-primary hover:underline font-medium cursor-pointer flex items-center gap-1"
              >
                <UserPlus className="h-3 w-3" />
                Registrar nuevo
              </button>
              {selectedClientOption && (
                <button
                  type="button"
                  onClick={handleCancelChanging}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1 ml-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Escribe nombre, teléfono o @instagram..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setIsDropdownOpen(true)
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="pl-8 pr-8 h-9 text-xs sm:text-sm bg-background border-input rounded-lg focus-visible:ring-1 focus-visible:ring-primary transition-all duration-150"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Menú flotante de resultados en tiempo real */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto divide-y divide-border/60 animate-in fade-in-50 duration-150">
              <div className="px-3 py-1.5 bg-muted/40 text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                <span>
                  {searchTerm.trim()
                    ? `Resultados para "${searchTerm}" (${filteredClients.length})`
                    : `Clientes registrados (${clientesList.length})`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              {filteredClients.length > 0 ? (
                filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleChooseClient(c)}
                    className="w-full text-left p-2.5 hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-secondary group-hover:bg-accent text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-border">
                        {getInitials(c.nombre)}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-xs text-foreground block truncate">
                          {c.nombre}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {c.telefono && <span>📞 {c.telefono}</span>}
                          {c.handleSocial && <span className="text-[#BE185D]">@{c.handleSocial.replace(/^@/, '')}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-mono">
                        {c.canalOrigen || c.canalPreferido || 'Directo'}
                      </span>
                      <span className="text-xs text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                        Seleccionar →
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    No se encontró ningún cliente registrado con "{searchTerm}".
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleTriggerNewClient(searchTerm)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-lg h-7 font-medium"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Registrar "{searchTerm}" como nuevo cliente
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CASO 3: Modo NUEVO CLIENTE (Inputs limpios y editables, sin candados bloqueados) */}
      {clientSelectMode === 'NEW' && (
        <div className="bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold py-0.5 px-2">
                <UserPlus className="h-3 w-3 mr-1" /> Nuevo Cliente
              </Badge>
              <span className="text-xs text-muted-foreground">
                Ingresa los datos del cliente para este pedido.
              </span>
            </div>

            {clientesList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setClientSelectMode('EXISTING')
                  handleStartChanging()
                }}
                className="text-xs text-primary font-medium hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
              >
                <UserCheck className="h-3 w-3" />
                Elegir cliente registrado ({clientesList.length})
              </button>
            )}
          </div>

          {/* Detección de duplicado amigable */}
          {similarExistingClient && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in-50 duration-150">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-foreground">
                  <span className="font-semibold block">
                    Cliente similar encontrado:
                  </span>
                  <span className="text-muted-foreground">
                    "{similarExistingClient.nombre}"
                    {similarExistingClient.telefono ? ` (📞 ${similarExistingClient.telefono})` : ''}
                    {similarExistingClient.handleSocial ? ` (@${similarExistingClient.handleSocial.replace(/^@/, '')})` : ''}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => handleChooseClient(similarExistingClient)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg shrink-0 h-6 px-2.5"
              >
                <Check className="h-3 w-3 mr-1" />
                Usar "{similarExistingClient.nombre}"
              </Button>
            </div>
          )}

          {/* Fila de 3 inputs editables para nuevo cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">
                Nombre del Cliente *
              </Label>
              <Input
                required
                placeholder="Nombre completo..."
                value={formCliente}
                onChange={(e) => setFormCliente(e.target.value)}
                className="h-9 text-xs sm:text-sm bg-background border-input rounded-xl focus-visible:ring-1 focus-visible:ring-primary transition-all duration-150"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                Teléfono / WhatsApp
              </Label>
              <Input
                placeholder="Ej: 987654321"
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
                className="h-9 text-xs sm:text-sm bg-background border-input rounded-xl focus-visible:ring-1 focus-visible:ring-primary transition-all duration-150"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <AtSign className="h-3 w-3 text-[#BE185D]" />
                Usuario Instagram
              </Label>
              <Input
                placeholder="@usuario"
                value={formHandleSocial}
                onChange={(e) => setFormHandleSocial(e.target.value)}
                className="h-9 text-xs sm:text-sm bg-background border-input rounded-xl focus-visible:ring-1 focus-visible:ring-primary transition-all duration-150"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
