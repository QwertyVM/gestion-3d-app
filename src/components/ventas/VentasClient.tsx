'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Check, MoreVertical } from 'lucide-react'
import { updateEstadoVenta, registrarAbono } from '@/actions/ventas'
import { toast } from 'sonner'
import { EstadoVenta } from '@prisma/client'

interface VentasClientProps {
  ventas: any[]
}

export function VentasClient({ ventas }: VentasClientProps) {
  const [search, setSearch] = useState('')

  const filtered = ventas.filter(v => 
    v.cliente.toLowerCase().includes(search.toLowerCase()) || 
    v.producto.nombreModelo.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

  const handleEstado = async (id: string, estado: EstadoVenta) => {
    try {
      await updateEstadoVenta(id, estado)
      toast.success(`Estado actualizado a ${estado}`)
    } catch (e) {
      toast.error('Error al actualizar')
    }
  }

  const getEstadoBadge = (estado: EstadoVenta) => {
    switch (estado) {
      case 'ENTREGADO': return <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10">Entregado</Badge>
      case 'PENDIENTE': return <Badge variant="outline" className="text-orange-400 border-orange-500/20 bg-orange-500/10">Pendiente</Badge>
      case 'EN_PRODUCCION': return <Badge variant="outline" className="text-blue-400 border-blue-500/20 bg-blue-500/10">En Producción</Badge>
      case 'CANCELADO': return <Badge variant="outline" className="text-red-400 border-red-500/20 bg-red-500/10">Cancelado</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Ventas y Pedidos</h1>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-lg">Historial de Ventas</CardTitle>
          <div className="flex gap-4 pt-4">
            <Input 
              placeholder="Buscar por cliente o producto..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                  <TableHead className="text-zinc-400">Fecha</TableHead>
                  <TableHead className="text-zinc-400">Cliente</TableHead>
                  <TableHead className="text-zinc-400">Producto</TableHead>
                  <TableHead className="text-zinc-400">Estado</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total</TableHead>
                  <TableHead className="text-zinc-400 text-right">Saldo</TableHead>
                  <TableHead className="text-zinc-400 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((venta) => (
                  <TableRow key={venta.id} className="border-zinc-800 hover:bg-zinc-800/30">
                    <TableCell className="text-zinc-300">
                      {new Date(venta.fecha).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-200">
                      {venta.cliente}
                      {venta.canalVenta && <span className="block text-xs text-zinc-500">{venta.canalVenta}</span>}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {venta.producto.nombreModelo}
                      <span className="block text-xs text-zinc-500">Cant: {venta.cantidad} | {venta.tipoPrecio}</span>
                    </TableCell>
                    <TableCell>
                      {getEstadoBadge(venta.estado)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-white">
                      {formatCurrency(Number(venta.total))}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={Number(venta.saldoPendiente) > 0 ? "text-orange-400 font-medium" : "text-emerald-400"}>
                        {formatCurrency(Number(venta.saldoPendiente))}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {venta.estado !== 'ENTREGADO' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEstado(venta.id, 'ENTREGADO')}
                            className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-400/10"
                            title="Marcar como Entregado"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
