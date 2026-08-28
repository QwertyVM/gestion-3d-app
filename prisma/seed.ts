import { PrismaClient, CategoriaInversion, EstadoVenta, TipoPrecio } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Limpiar datos previos si se desea ejecutar el seed de cero
  await prisma.inversion.deleteMany()

  // 1. Inversiones Base
  await prisma.inversion.createMany({
    data: [
      { persona: 'Víctor', categoria: CategoriaInversion.ACTIVO_FIJO, itemConcepto: 'Impresora 3D', especificacionColor: 'Equipo Principal', presentacion: 'Unidad', cantidad: 1, costoUnitario: 2099, costoEnvio: 0, costoTotal: 2099, loteRegistro: 'Inversión Inicial' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA', especificacionColor: 'Color Mate', presentacion: 'Bobina 1Kg', cantidad: 1, costoUnitario: 75.59, costoEnvio: 0, costoTotal: 75.59, costoPorGramo: 0.0756, loteRegistro: 'Lote 1' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA', especificacionColor: 'Negro', presentacion: 'Bobina 1Kg', cantidad: 1, costoUnitario: 75.59, costoEnvio: 0, costoTotal: 75.59, costoPorGramo: 0.0756, loteRegistro: 'Lote 1' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA', especificacionColor: 'Verde Agua', presentacion: 'Bobina 1Kg', cantidad: 1, costoUnitario: 75.59, costoEnvio: 0, costoTotal: 75.59, costoPorGramo: 0.0756, loteRegistro: 'Lote 1' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Blanco Hueso', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 7, costoTotal: 67, costoPorGramo: 0.067, loteRegistro: 'Lote 2' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Carbón', presentacion: 'Con Bobina Reutilizable (BR) 1Kg', cantidad: 1, costoUnitario: 79, costoEnvio: 7, costoTotal: 86, costoPorGramo: 0.086, loteRegistro: 'Lote 2' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Gris Ceniza', presentacion: 'Con Bobina Reutilizable (BR) 1Kg', cantidad: 1, costoUnitario: 79, costoEnvio: 7, costoTotal: 86, costoPorGramo: 0.086, loteRegistro: 'Lote 2' },
      { persona: 'Víctor', categoria: CategoriaInversion.ACTIVO_FIJO, itemConcepto: 'Secador de Filamento TwoTrees', especificacionColor: 'Secador de Filamento', presentacion: 'Unidad', cantidad: 1, costoUnitario: 240, costoEnvio: 0, costoTotal: 240, loteRegistro: 'Lote 3' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Blanco Hueso', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, loteRegistro: 'Lote 3' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Charcoal', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, loteRegistro: 'Lote 3' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Gris Ceniza', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, loteRegistro: 'Lote 3' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Lila Púrpura', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, loteRegistro: 'Lote 3' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Naranja Mandarina', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, loteRegistro: 'Lote 3' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Rojo Escarlata', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, loteRegistro: 'Lote 3' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Verde Grass', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, loteRegistro: 'Lote 3' },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Filamento 3D', especificacionColor: 'Sale', presentacion: 'Sin bobina', cantidad: 5, costoUnitario: 60, costoEnvio: 0, costoTotal: 300, costoPorGramo: 0.06, loteRegistro: 'Lote 4' },
      { persona: 'Víctor', categoria: CategoriaInversion.SERVICIO, itemConcepto: 'Publicidad', especificacionColor: '5 días', presentacion: 'Campaña', cantidad: 1, costoUnitario: 123, costoEnvio: 0, costoTotal: 123, loteRegistro: 'Lote 4' },
      { persona: 'Jamile :)', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Cajas', especificacionColor: '-', presentacion: 'Unidad', cantidad: 3, costoUnitario: 9.9, costoEnvio: 0, costoTotal: 29.7 },
      { persona: 'Jamile :)', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Set de sticker', especificacionColor: '-', presentacion: 'Set', cantidad: 2, costoUnitario: 13, costoEnvio: 0, costoTotal: 26 },
      { persona: 'Jamile :)', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Cubierta de plástico con bolsas de aire', especificacionColor: '-', presentacion: '2 metros', cantidad: 2, costoUnitario: 5, costoEnvio: 0, costoTotal: 10 },
      { persona: 'Jamile :)', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Cajas', especificacionColor: '-', presentacion: 'Unidad', cantidad: 1, costoUnitario: 12, costoEnvio: 0, costoTotal: 12 },
      { persona: 'Jamile :)', categoria: CategoriaInversion.INSUMO, itemConcepto: 'Cajas', especificacionColor: '-', presentacion: 'Unidad', cantidad: 1, costoUnitario: 18, costoEnvio: 0, costoTotal: 18 },
      { persona: 'Víctor', categoria: CategoriaInversion.SERVICIO, itemConcepto: 'Taxi envío lince', especificacionColor: '', presentacion: '', cantidad: 1, costoUnitario: 25.55, costoEnvio: 0, costoTotal: 25.55 }
    ]
  })

  // Limpiar ventas previas para evitar conflictos de Foreign Key al limpiar productos
  await prisma.venta.deleteMany()
  await prisma.producto.deleteMany()

  // 2. Catálogo de Productos (Agrupados por Categoría)
  const productosBase = [
    // Insertos y Organizadores
    { lineaCategoria: 'Insertos y Organizadores', nombreModelo: 'Inserto Zombicide 2ª Ed. (10 placas)', costoBase: 78.85, precioAmigos: 105.00, precioMercado: 125.00, precioComunidad: 135.00 },
    { lineaCategoria: 'Insertos y Organizadores', nombreModelo: 'Inserto Gloomhaven: Jaws of the Lion (6 placas)', costoBase: 70.74, precioAmigos: 90.00, precioMercado: 105.00, precioComunidad: 115.00 },

    // Juegos de Mesa (Mansiones de la Locura)
    { lineaCategoria: 'JUEGOS DE MESA', nombreModelo: 'Mansiones de la Locura - Kit 1 Jugador (1 Tablero + 2 Marcadores)', costoBase: 9.19, precioAmigos: 20.00, precioMercado: 25.00, precioComunidad: 30.00 },
    { lineaCategoria: 'JUEGOS DE MESA', nombreModelo: 'Mansiones de la Locura - Set 2 Jugadores (2 Tableros + 4 Marcadores)', costoBase: 18.38, precioAmigos: 40.00, precioMercado: 50.00, precioComunidad: 55.00 },
    { lineaCategoria: 'JUEGOS DE MESA', nombreModelo: 'Mansiones de la Locura - Set 3 Jugadores (3 Tableros + 6 Marcadores)', costoBase: 27.57, precioAmigos: 55.00, precioMercado: 70.00, precioComunidad: 80.00 },
    { lineaCategoria: 'JUEGOS DE MESA', nombreModelo: 'Mansiones de la Locura - Set 4 Jugadores (4 Tableros + 8 Marcadores)', costoBase: 36.76, precioAmigos: 70.00, precioMercado: 90.00, precioComunidad: 100.00 },
    { lineaCategoria: 'JUEGOS DE MESA', nombreModelo: 'Mansiones de la Locura - Set 5 Jugadores (5 Tableros + 10 Marcadores)', costoBase: 45.95, precioAmigos: 85.00, precioMercado: 105.00, precioComunidad: 120.00 },

    // Juegos de Rol & Accesorios
    { lineaCategoria: 'Juegos de Rol & Accesorios', nombreModelo: 'Torre de Dados de Dragón', costoBase: 49.00, precioAmigos: 65.00, precioMercado: 80.00, precioComunidad: 90.00 },
    { lineaCategoria: 'Juegos de Rol & Accesorios', nombreModelo: 'Torre de Dados Árbol Fantasía', costoBase: 47.94, precioAmigos: 65.00, precioMercado: 80.00, precioComunidad: 90.00 },
    { lineaCategoria: 'Juegos de Rol & Accesorios', nombreModelo: 'La Cuna del Dragón (Bandeja Multiusos)', costoBase: 18.75, precioAmigos: 25.00, precioMercado: 30.00, precioComunidad: 35.00 },
    { lineaCategoria: 'Juegos de Rol & Accesorios', nombreModelo: 'Contador de Munchkin (Individual)', costoBase: 3.65, precioAmigos: 10.00, precioMercado: 10.00, precioComunidad: 15.00 },
    { lineaCategoria: 'Juegos de Rol & Accesorios', nombreModelo: 'Set Contadores Munchkin (Pack x6)', costoBase: 15.98, precioAmigos: 35.00, precioMercado: 50.00, precioComunidad: 60.00 },

    // Miniaturas & Decoración
    { lineaCategoria: 'Miniaturas & Decoración', nombreModelo: 'Pocket Knights - Escuadrón Pesado (Set x4)', costoBase: 9.73, precioAmigos: 15.00, precioMercado: 20.00, precioComunidad: 25.00 },
    { lineaCategoria: 'Miniaturas & Decoración', nombreModelo: 'Cuadro Silueta Evolución Gengar', costoBase: 13.25, precioAmigos: 20.00, precioMercado: 25.00, precioComunidad: 30.00 },

    // Hogar & Oficina
    { lineaCategoria: 'Hogar & Oficina', nombreModelo: 'Soporte Plegable Tablet / iPad', costoBase: 20.11, precioAmigos: 30.00, precioMercado: 35.00, precioComunidad: 40.00 },
    { lineaCategoria: 'Hogar & Oficina', nombreModelo: 'Soporte de Cubiertos de Escritorio', costoBase: 25.98, precioAmigos: 35.00, precioMercado: 45.00, precioComunidad: 50.00 },
    { lineaCategoria: 'Hogar & Oficina', nombreModelo: 'Soporte de Incienso Todo en Uno', costoBase: 15.97, precioAmigos: 25.00, precioMercado: 30.00, precioComunidad: 35.00 },
    { lineaCategoria: 'Hogar & Oficina', nombreModelo: 'Juego de 4 Posavasos Japandi con Soporte', costoBase: 27.65, precioAmigos: 35.00, precioMercado: 45.00, precioComunidad: 50.00 },
  ]

  for (const prod of productosBase) {
    await prisma.producto.create({ data: prod })
  }

  // 3. Ventas Iniciales
  const productoSet5J = await prisma.producto.findUnique({ where: { nombreModelo: 'Mansiones de la Locura - Set 5 Jugadores (5 Tableros + 10 Marcadores)' } })
  const productoZombicide = await prisma.producto.findUnique({ where: { nombreModelo: 'Inserto Zombicide 2ª Ed. (10 placas)' } })

  if (productoSet5J && productoZombicide) {
    await prisma.venta.createMany({
      data: [
        {
          fecha: new Date('2026-08-14T10:00:00Z'),
          cliente: 'Bryan condemarin',
          productoId: productoSet5J.id,
          cantidad: 1,
          tipoPrecio: TipoPrecio.PERSONALIZADO,
          precioUnitario: 82.00,
          total: 82.00,
          montoPagado: 82.00,
          saldoPendiente: 0.00,
          estado: EstadoVenta.ENTREGADO,
        },
        {
          fecha: new Date('2026-08-20T10:00:00Z'),
          cliente: 'Jalmar Pinedo',
          productoId: productoZombicide.id,
          cantidad: 1,
          tipoPrecio: TipoPrecio.PERSONALIZADO,
          precioUnitario: 132.00,
          total: 132.00,
          montoPagado: 132.00,
          saldoPendiente: 0.00,
          estado: EstadoVenta.ENTREGADO,
          canalVenta: 'Instagram',
        },
        {
          fecha: new Date('2026-08-23T10:00:00Z'),
          cliente: 'Con Rad',
          productoId: productoZombicide.id,
          cantidad: 1,
          tipoPrecio: TipoPrecio.COMUNIDAD,
          precioUnitario: 135.00,
          total: 135.00,
          montoPagado: 135.00,
          saldoPendiente: 0.00,
          estado: EstadoVenta.ENTREGADO,
          diaEntregaPrometida: '26 Miercoles en la noche o 27 Jueves en la mañana',
          destinoEnvio: 'Lince',
          canalVenta: 'Instagram',
        },
        {
          fecha: new Date('2026-08-24T10:00:00Z'),
          cliente: 'Gianmarco Gamarra',
          productoId: productoZombicide.id,
          cantidad: 1,
          tipoPrecio: TipoPrecio.COMUNIDAD,
          precioUnitario: 135.00,
          total: 135.00,
          montoPagado: 70.00,
          saldoPendiente: 65.00,
          estado: EstadoVenta.PENDIENTE,
          diaEntregaPrometida: '28 Viernes o 29 Sabado en la mañana',
          destinoEnvio: 'Shalom',
          canalVenta: 'Instagram',
        }
      ]
    })
  }

  console.log('Seed exitoso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
