import { resumenVigenciaExtintor } from '../lib/vigencia.js'

const COLOR = { off: '#dc2626', on: '#16a34a' }

// Columna "Vigencia" de un extintor: "Vencido" en rojo, "Operativo (VXX)"
// en verde, o un aviso neutro si todavía no hay fechas cargadas.
export default function VigenciaExtintor({ data }) {
  const { estado, texto } = resumenVigenciaExtintor(data)
  if (estado === null) return <span style={{ color: 'var(--muted)' }}>{texto}</span>
  return <span style={{ color: COLOR[estado], fontWeight: 700 }}>{texto}</span>
}
