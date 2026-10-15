import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getColoresInventario } from '@/actions/inventario'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const theme = searchParams.get('theme') || 'dark'
    const isDownload = searchParams.get('download') === 'true'

    const { disponibles } = await getColoresInventario()
    const colores = disponibles.length > 0 ? disponibles : [
      { id: '1', nombreColor: 'Negro carbón', codigoHex: '#18181B' },
      { id: '2', nombreColor: 'Blanco hueso', codigoHex: '#F5F5F0' },
      { id: '3', nombreColor: 'Azul oscuro', codigoHex: '#1E3A8A' },
      { id: '4', nombreColor: 'Rojo escarlata', codigoHex: '#DC2626' },
      { id: '5', nombreColor: 'Verde grass', codigoHex: '#22C55E' },
    ]

    const isDark = theme !== 'light'
    const bgColor = isDark ? '#12100E' : '#FAF8F5'
    const cardBg = isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF'
    const cardBorder = isDark ? 'rgba(212, 190, 167, 0.22)' : '#E2D9CC'
    const titleColor = isDark ? '#FFFFFF' : '#241C15'
    const textColor = isDark ? '#FDFBF7' : '#241C15'
    const subtextColor = isDark ? '#C7B49F' : '#75695D'
    const accentColor = '#A36F4C'
    const accentBg = isDark ? 'rgba(163, 111, 76, 0.25)' : '#F5EBE1'

    const rowsCount = Math.max(4, Math.ceil(colores.length / 3))
    const calculatedHeight = Math.max(1350, 360 + rowsCount * 105)

    const response = new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '1080px',
            height: `${calculatedHeight}px`,
            backgroundColor: bgColor,
            padding: '50px 50px',
            fontFamily: 'sans-serif',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Publicitario */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderBottom: `2px solid ${cardBorder}`,
              paddingBottom: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: accentBg,
                  border: `1.5px solid ${accentColor}`,
                  borderRadius: '24px',
                  padding: '8px 18px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    marginRight: '10px',
                  }}
                />
                <span
                  style={{
                    color: isDark ? '#F2E8DC' : accentColor,
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                  }}
                >
                  NOVA 3D • Catálogo Oficial de Filamentos
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0EBE4',
                  borderRadius: '16px',
                  padding: '6px 14px',
                  color: isDark ? '#E5D6C7' : '#75695D',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                ✨ {colores.length} Colores Disponibles
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: '20px',
              }}
            >
              <span
                style={{
                  fontSize: '44px',
                  fontWeight: 900,
                  color: titleColor,
                  letterSpacing: '-1px',
                }}
              >
                Catálogo de Colores Disponibles
              </span>
              <span
                style={{
                  fontSize: '18px',
                  color: subtextColor,
                  marginTop: '8px',
                  fontWeight: 500,
                }}
              >
                Filamentos PLA Premium en taller para producción inmediata. Consulta por referencias y códigos HEX.
              </span>
            </div>
          </div>

          {/* Grid de Colores */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              marginTop: '26px',
              marginBottom: '26px',
              justifyContent: 'flex-start',
            }}
          >
            {colores.map((color) => {
              const hex = color.codigoHex || '#18181B'
              return (
                <div
                  key={color.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '316px',
                    height: '84px',
                    backgroundColor: cardBg,
                    border: `1.5px solid ${cardBorder}`,
                    borderRadius: '20px',
                    padding: '12px 16px',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Swatch con efecto 3D */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: hex,
                      border: '3px solid rgba(255, 255, 255, 0.45)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      marginRight: '14px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      padding: '5px',
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.35)',
                      }}
                    />
                  </div>

                  {/* Info del color */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        color: textColor,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {color.nombreColor}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: isDark ? '#E5D6C7' : '#75695D',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#EAE4DC',
                          padding: '3px 8px',
                          borderRadius: '8px',
                        }}
                      >
                        {hex.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer Publicitario */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `2px solid ${cardBorder}`,
              paddingTop: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  color: titleColor,
                }}
              >
                ✨ Fabricación 3D de Alta Calidad • Personalización y Piezas a Medida
              </span>
              <span
                style={{
                  fontSize: '14px',
                  color: subtextColor,
                  marginTop: '4px',
                }}
              >
                Consulta por combinaciones multicolor o disponibilidad de reposición.
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: accentColor,
                borderRadius: '16px',
                padding: '12px 24px',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 900,
                letterSpacing: '0.5px',
              }}
            >
              PEDIDOS &amp; COTIZACIONES
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: calculatedHeight,
      }
    )

    if (isDownload) {
      response.headers.set(
        'Content-Disposition',
        'attachment; filename="catalogo-colores-disponibles-nova3d.png"'
      )
    }

    return response
  } catch (error: any) {
    console.error('Error generando imagen de catálogo:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
