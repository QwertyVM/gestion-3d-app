'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { deleteInversion } from '@/actions/inversiones'
import { toast } from 'sonner'
import { CategoriaInversion } from '@prisma/client'

// Simulación simple de modal por falta de Dialog completo si no se generó.
// Se recomienda usar el Dialog de shadcn si está disponible.

interface InversionesClientProps {
  inversiones: any[]
}

export function InversionesClient({ inversiones }: InversionesClientProps) {
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState<string>('TODOS')

  const filtered = inversiones.filter(inv => {
    const matchSearch = inv.itemConcepto.toLowerCase().includes(search.toLowerCase()) 
      || (inv.loteRegistro && inv.loteRegistro.toLowerCase().includes(search.toLowerCase()))
      || (inv.persona && inv.persona.toLowerCase().includes(search.toLowerCase()))
    const matchCat = categoria === 'TODOS' || inv.categoria === categoria
    return matchSearch && matchCat
  })

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

  const handleDelete = async (id: string) => {
    if (confirm('¿Seguro que deseas eliminar esta inversión?')) {
      try {
        await deleteInversion(id)
        toast.success('Inversión eliminada')
      } catch (e) {
        toast.error('Error al eliminar')
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Inversiones</h1>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Inversión
        </Button>
      </div>

      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-lg">Registro de Gastos y Activos</CardTitle>
          <div className="flex gap-4 pt-4">
            <Input 
              placeholder="Buscar por concepto o lote..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs bg-zinc-900 border-zinc-700 text-white"
            />
            <select 
              className="bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="TODOS">Todas las Categorías</option>
              <option value={CategoriaInversion.ACTIVO_FIJO}>Activo Fijo</option>
              <option value={CategoriaInversion.INSUMO}>Insumo</option>
              <option value={CategoriaInversion.SERVICIO}>Servicio</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                  <TableHead className="text-zinc-400">Concepto</TableHead>
                  <TableHead className="text-zinc-400">Persona</TableHead>
                  <TableHead className="text-zinc-400">Categoría</TableHead>
                  <TableHead className="text-zinc-400 text-right">Cant.</TableHead>
                  <TableHead className="text-zinc-400 text-right">C. Unitario</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total</TableHead>
                  <TableHead className="text-zinc-400 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id} className="border-zinc-800 hover:bg-zinc-800/30">
                    <TableCell className="font-medium text-zinc-200">
                      {inv.itemConcepto}
                      {inv.loteRegistro && <span className="block text-xs text-zinc-500">Lote: {inv.loteRegistro}</span>}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase">
                          {inv.persona?.charAt(0) || '?'}
                        </div>
                        {inv.persona || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        inv.categoria === 'ACTIVO_FIJO' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                        inv.categoria === 'INSUMO' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                        'text-purple-400 border-purple-500/20 bg-purple-500/10'
                      }>
                        {inv.categoria.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">{inv.cantidad}</TableCell>
                    <TableCell className="text-right text-zinc-300">{formatCurrency(Number(inv.costoUnitario))}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-400">{formatCurrency(Number(inv.costoTotal))}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)} className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
