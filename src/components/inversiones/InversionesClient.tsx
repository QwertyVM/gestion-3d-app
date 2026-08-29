'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Loader2, X, Wallet } from 'lucide-react'
import { deleteInversion, createInversion } from '@/actions/inversiones'
import { toast } from 'sonner'
import { CategoriaInversion } from '@prisma/client'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

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

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm">
            <Wallet className="h-6 w-6 stroke-[2.5]" />
          </div>
          Inversiones & Capital
        </h1>
        
        <Button 
          onClick={() => setOpen(true)}
          className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold rounded-xl shadow-md shadow-[#A36F4C]/20 transition-all cursor-pointer h-10 px-4 text-xs"
        >
          <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
          Nueva Inversión
        </Button>
      </div>

      {/* Modal Nueva Inversión */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[#A36F4C] shadow-sm">
                <Plus className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#241C15] tracking-tight">
                  Registrar Nueva Inversión
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D]">
                  Compra de maquinaria, insumos o aportes de capital.
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Tipo de Registro</Label>
              <select 
                name="categoria"
                value={formCategoria}
                onChange={(e) => setFormCategoria(e.target.value as CategoriaInversion)}
                className="w-full bg-[#F4EFEA] border border-[#DCD3C6] text-[#241C15] rounded-xl px-3 py-2 text-sm focus:border-[#A36F4C]"
              >
                <option value="INSUMO">Compra de Insumo</option>
                <option value="ACTIVO_FIJO">Compra de Activo Fijo</option>
                <option value="SERVICIO">Pago de Servicio</option>
                <option value="APORTE_CAPITAL">Aporte de Capital / Préstamo</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Persona / Inversionista</Label>
                <Input name="persona" defaultValue="Víctor" required className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Concepto</Label>
                <Input name="itemConcepto" required placeholder="Ej: Préstamo, Filamento..." className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl" />
              </div>
            </div>

            {formCategoria === 'APORTE_CAPITAL' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Monto Total (S/)</Label>
                  <Input name="costoUnitario" type="number" step="0.01" required className="bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono font-bold rounded-xl" />
                  <input type="hidden" name="cantidad" value="1" />
                  <input type="hidden" name="costoEnvio" value="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Número de Cuotas</Label>
                  <Input name="numeroCuotas" type="number" min="1" placeholder="Ej: 24" className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl" />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Cant.</Label>
                    <Input name="cantidad" type="number" defaultValue="1" min="1" required className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">C. Unitario</Label>
                    <Input name="costoUnitario" type="number" step="0.01" required className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Envío Total</Label>
                    <Input name="costoEnvio" type="number" step="0.01" defaultValue="0" className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl font-mono" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Presentación</Label>
                  <Input name="presentacion" placeholder="Ej: Bobina 1Kg, Pack 100u, etc." className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl" />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2D9CC]">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#A36F4C]/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Registrar Inversión'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabla */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-[#FDFBF7] border-b border-[#E2D9CC]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-bold text-[#241C15]">Registro de Gastos y Capital</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Input 
                placeholder="Buscar concepto o persona..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-xs h-9 rounded-xl focus:border-[#A36F4C]"
              />
              <select 
                className="bg-[#F4EFEA] border border-[#DCD3C6] text-[#241C15] rounded-xl px-3 py-1.5 text-xs font-medium focus:border-[#A36F4C] h-9"
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
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="w-full">
            <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
              <TableRow className="border-[#E2D9CC] hover:bg-transparent">
                <TableHead className="text-[#241C15] font-bold px-4 py-3">Concepto</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3">Persona</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3">Categoría</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">Cant.</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">C. Unitario</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">Total</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id} className="border-[#E2D9CC]/70 hover:bg-[#FDFBF7] transition-colors">
                  <TableCell className="font-bold text-[#241C15] px-4 py-3">
                    {inv.itemConcepto}
                    {inv.especificacionColor && <span className="block text-xs text-[#75695D] font-normal">{inv.especificacionColor}</span>}
                    {inv.presentacion && <span className="block text-xs text-[#75695D] font-normal">{inv.presentacion}</span>}
                    {inv.numeroCuotas && <span className="block text-xs text-[#A36F4C] font-bold">{inv.numeroCuotas} Cuotas de {formatCurrency(Number(inv.montoCuota))}</span>}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-[#241C15]">
                    <span className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[10px] font-bold text-[#633E20] uppercase">
                        {inv.persona?.charAt(0) || '?'}
                      </div>
                      {inv.persona || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Badge variant="outline" className={
                      inv.categoria === 'ACTIVO_FIJO' ? 'text-[#8C6D1F] border-[#E8D49B] bg-[#FDF6E2] font-bold' :
                      inv.categoria === 'INSUMO' ? 'text-[#1E5E3A] border-[#B4E3C0] bg-[#EBF7EE] font-bold' :
                      inv.categoria === 'APORTE_CAPITAL' ? 'text-[#633E20] border-[#D4BEA7] bg-[#EFE5D8] font-bold' :
                      'text-[#75695D] border-[#E2D9CC] bg-[#F4EFEA] font-medium'
                    }>
                      {inv.categoria.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-[#241C15] font-mono px-3 py-3">{inv.cantidad}</TableCell>
                  <TableCell className="text-right text-[#75695D] font-mono px-3 py-3">{formatCurrency(Number(inv.costoUnitario))}</TableCell>
                  <TableCell className="text-right font-mono font-extrabold text-[#1E5E3A] px-3 py-3">{formatCurrency(Number(inv.costoTotal))}</TableCell>
                  <TableCell className="text-center px-3 py-3">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)} className="h-8 w-8 text-[#75695D] hover:text-[#A34335] hover:bg-red-50 rounded-xl cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
