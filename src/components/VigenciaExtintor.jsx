import { vigenciaExtintor } from '../lib/vigencia.js'

const COLOR = {
  vencida: '#dc2626',  // rojo
  proximo: '#ea580c',  // naranjo
  vigente: '#16a34a',  // verde
}

// Celda / bloque de vigencia de un extintor.
// - Si todo está lejos de vencer: "Extintor vigente" en verde.
// - Si algún control está vencido o próximo: una línea por control,
//   con su etiqueta, para distinguir carga de prueba hidrostática.
export default function VigenciaExtintor({ data }) {
  const { global, items } = vigenciaExtintor(data)

  if (global === 'sin_dato') {
    return <span style={{ color: 'var(--muted)' }}>Sin fechas registradas</span>
  }

  if (global === 'vigente') {
    return <span style={{ color: COLOR.vigente, fontWeight: 600 }}>Extintor vigente</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {items.map((i) => (
        <span
          key={i.etiqueta}
          style={{ color: COLOR[i.estado], fontWeight: 600, whiteSpace: 'nowrap', fontSize: 13 }}
        >
          {i.etiqueta}: {i.texto}
        </span>
      ))}
    </div>
  )
}
