'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { deleteInversion, createInversion } from '@/actions/inversiones'
import { toast } from 'sonner'
import { CategoriaInversion } from '@prisma/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface InversionesClientProps {
  inversiones: any[]
}

export function InversionesClient({ inversiones }: InversionesClientProps) {
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODOS')
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [formCategoria, setFormCategoria] = useState<CategoriaInversion>('INSUMO')

  const filtered = inversiones.filter(inv => {
    const matchSearch = inv.itemConcepto.toLowerCase().includes(search.toLowerCase()) 
      || (inv.especificacionColor && inv.especificacionColor.toLowerCase().includes(search.toLowerCase()))
      || (inv.persona && inv.persona.toLowerCase().includes(search.toLowerCase()))
    const matchCat = categoriaFilter === 'TODOS' || inv.categoria === categoriaFilter
    return matchSearch && matchCat
  })

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

  const handleDelete = async (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este registro?')) {
      try {
        await deleteInversion(id)
        toast.success('Registro eliminado')
      } catch (e) {
        toast.error('Error al eliminar')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await createInversion({
        persona: formData.get('persona') as string,
        categoria: formCategoria,
        itemConcepto: formData.get('itemConcepto') as string,
        especificacionColor: formData.get('especificacionColor') as string || undefined,
        cantidad: Number(formData.get('cantidad')) || 1,
        costoUnitario: Number(formData.get('costoUnitario')),
        costoEnvio: Number(formData.get('costoEnvio')) || 0,
        numeroCuotas: Number(formData.get('numeroCuotas')) || undefined,
        presentacion: formData.get('presentacion') as string || undefined,
      })
      toast.success('Inversión registrada exitosamente')
      setOpen(false)
    } catch (e) {
      toast.error('Error al registrar la inversión')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Inversiones & Capital</h1>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Inversión
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Inversión</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tipo de Registro</Label>
                <select 
                  name="categoria"
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value as CategoriaInversion)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="INSUMO">Compra de Insumo</option>
                  <option value="ACTIVO_FIJO">Compra de Activo Fijo</option>
                  <option value="SERVICIO">Pago de Servicio</option>
                  <option value="APORTE_CAPITAL">Aporte de Capital / Préstamo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Persona / Inversionista</Label>
                  <Input name="persona" defaultValue="Víctor" required className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="space-y-2">
                  <Label>Concepto</Label>
                  <Input name="itemConcepto" required placeholder="Ej: Préstamo, Filamento..." className="bg-zinc-900 border-zinc-700" />
                </div>
              </div>

              {formCategoria === 'APORTE_CAPITAL' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monto Total (S/)</Label>
                    <Input name="costoUnitario" type="number" step="0.01" required className="bg-zinc-900 border-zinc-700" />
                    <input type="hidden" name="cantidad" value="1" />
                    <input type="hidden" name="costoEnvio" value="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Número de Cuotas</Label>
                    <Input name="numeroCuotas" type="number" min="1" placeholder="Ej: 24" className="bg-zinc-900 border-zinc-700" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cant.</Label>
                      <Input name="cantidad" type="number" defaultValue="1" min="1" required className="bg-zinc-900 border-zinc-700" />
                    </div>
                    <div className="space-y-2">
                      <Label>Costo Unitario</Label>
                      <Input name="costoUnitario" type="number" step="0.01" required className="bg-zinc-900 border-zinc-700" />
                    </div>
                    <div className="space-y-2">
                      <Label>Envío Total</Label>
                      <Input name="costoEnvio" type="number" step="0.01" defaultValue="0" className="bg-zinc-900 border-zinc-700" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Presentación</Label>
                    <Input name="presentacion" placeholder="Ej: Bobina 1Kg, Pack 100u, etc." className="bg-zinc-900 border-zinc-700" />
                  </div>
                </>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-lg">Registro de Gastos y Capital</CardTitle>
          <div className="flex gap-4 pt-4">
            <Input 
              placeholder="Buscar por concepto, persona o detalle..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs bg-zinc-900 border-zinc-700 text-white"
            />
            <select 
              className="bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm"
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
            >
              <option value="TODOS">Todas las Categorías</option>
              <option value={CategoriaInversion.ACTIVO_FIJO}>Activo Fijo</option>
              <option value={CategoriaInversion.INSUMO}>Insumo</option>
              <option value={CategoriaInversion.SERVICIO}>Servicio</option>
              <option value={CategoriaInversion.APORTE_CAPITAL}>Aporte de Capital</option>
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
                      {inv.especificacionColor && <span className="block text-xs text-zinc-400">{inv.especificacionColor}</span>}
                      {inv.presentacion && <span className="block text-xs text-zinc-500">{inv.presentacion}</span>}
                      {inv.numeroCuotas && <span className="block text-xs text-blue-400 font-semibold">{inv.numeroCuotas} Cuotas de {formatCurrency(Number(inv.montoCuota))}</span>}
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
                        inv.categoria === 'APORTE_CAPITAL' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
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
