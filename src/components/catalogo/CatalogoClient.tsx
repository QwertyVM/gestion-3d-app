'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Minus } from 'lucide-react'
import { deleteProducto } from '@/actions/productos'
import { toast } from 'sonner'

// Subcomponente para renderizar tarjetas agrupadas con contador
function GroupedProductCard({ item, formatCurrency }: { item: any, formatCurrency: (val: number) => string }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const v = item.variants[selectedIndex]
  
  return (
    <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl hover:border-emerald-500/50 transition-colors group">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div>
          <Badge variant="outline" className="text-zinc-400 border-zinc-700 bg-zinc-900 mb-2">
            {item.lineaCategoria}
          </Badge>
          <CardTitle className="text-xl text-zinc-100 leading-tight group-hover:text-emerald-400 transition-colors">
            {item.nombreModelo}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Selector interactivo de variantes */}
        <div className="flex flex-col items-center justify-center mb-6 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <span className="text-sm text-zinc-400 mb-3 text-center">Seleccionar Variante</span>
          <div className="flex items-center gap-4 w-full justify-between">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setSelectedIndex(i => Math.max(0, i - 1))}
              disabled={selectedIndex === 0}
              className="h-8 w-8 rounded-full border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white shrink-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 text-center px-2">
              <span className="font-semibold text-emerald-400 text-sm leading-tight inline-block">{v.variantName}</span>
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setSelectedIndex(i => Math.min(item.variants.length - 1, i + 1))}
              disabled={selectedIndex === item.variants.length - 1}
              className="h-8 w-8 rounded-full border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800/50">
          <span className="text-sm text-zinc-400">Costo Base</span>
          <span className="font-bold text-white">{formatCurrency(Number(v.costoBase))}</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Amigos
            </span>
            <span className="text-sm font-bold text-emerald-50">{formatCurrency(Number(v.precioAmigos))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Comunidad
            </span>
            <span className="text-sm font-bold text-blue-50">{formatCurrency(Number(v.precioComunidad))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-purple-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Mercado
            </span>
            <span className="text-sm font-bold text-purple-50">{formatCurrency(Number(v.precioMercado))}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CatalogoClientProps {
  productos: any[]
}

export function CatalogoClient({ productos }: CatalogoClientProps) {
  const [search, setSearch] = useState('')

  // Agrupar JUEGOS DE MESA
  const groupedMap = new Map<string, any>()
  const normalProducts: any[] = []

  productos.forEach((prod: any) => {
    // Manejar caso en el que la categoría esté en minúsculas en la búsqueda
    if (prod.lineaCategoria.toUpperCase() === 'JUEGOS DE MESA') {
      const parts = prod.nombreModelo.split(' - ')
      if (parts.length > 1) {
        const gameName = parts[0]
        const variantName = parts.slice(1).join(' - ')
        
        if (!groupedMap.has(gameName)) {
          groupedMap.set(gameName, {
            isGroup: true,
            id: `group-${gameName}`, // Fake ID para key
            lineaCategoria: prod.lineaCategoria,
            nombreModelo: gameName,
            variants: []
          })
        }
        groupedMap.get(gameName).variants.push({ ...prod, variantName })
      } else {
        normalProducts.push(prod)
      }
    } else {
      normalProducts.push(prod)
    }
  })

  // Ordenar variantes por costo
  groupedMap.forEach(group => {
    group.variants.sort((a: any, b: any) => Number(a.costoBase) - Number(b.costoBase))
  })

  const allDisplayItems = [...normalProducts, ...Array.from(groupedMap.values())]

  const filtered = allDisplayItems.filter(item => {
    if (item.isGroup) {
      const matchGame = item.nombreModelo.toLowerCase().includes(search.toLowerCase()) || item.lineaCategoria.toLowerCase().includes(search.toLowerCase())
      const matchVariant = item.variants.some((v: any) => v.variantName.toLowerCase().includes(search.toLowerCase()))
      return matchGame || matchVariant
    }
    return item.nombreModelo.toLowerCase().includes(search.toLowerCase()) ||
           item.lineaCategoria.toLowerCase().includes(search.toLowerCase())
  })

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

  const handleDelete = async (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este producto?')) {
      try {
        await deleteProducto(id)
        toast.success('Producto eliminado')
      } catch (e) {
        toast.error('Error al eliminar')
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Catálogo de Productos</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <div className="flex gap-4">
        <Input 
          placeholder="Buscar por modelo o línea..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-zinc-900 border-zinc-700 text-white"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => {
          if (item.isGroup) {
            return <GroupedProductCard key={item.id} item={item} formatCurrency={formatCurrency} />
          }

          return (
            <Card key={item.id} className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl hover:border-blue-500/50 transition-colors group">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700 bg-zinc-900 mb-2">
                    {item.lineaCategoria}
                  </Badge>
                  <CardTitle className="text-lg text-zinc-100 leading-tight group-hover:text-blue-400 transition-colors">
                    {item.nombreModelo}
                  </CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-blue-400">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-zinc-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800/50">
                  <span className="text-sm text-zinc-400">Costo Base</span>
                  <span className="font-bold text-white">{formatCurrency(Number(item.costoBase))}</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Amigos
                    </span>
                    <span className="text-sm font-bold text-emerald-50">{formatCurrency(Number(item.precioAmigos))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Comunidad
                    </span>
                    <span className="text-sm font-bold text-blue-50">{formatCurrency(Number(item.precioComunidad))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Mercado
                    </span>
                    <span className="text-sm font-bold text-purple-50">{formatCurrency(Number(item.precioMercado))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
