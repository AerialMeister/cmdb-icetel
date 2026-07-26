// ============================================================
// Ilustraciones de equipos — "tal como se ve instalado"
//
// PRINCIPIO RECTOR: cada equipo se reconoce por su SILUETA, no por el
// detalle interior. Antes de dibujar nada, la pregunta es "¿en qué se
// diferencia el contorno de este equipo del de todos los demás?".
// Si dos equipos comparten contorno, uno de los dos está mal planteado.
//
// Siluetas asignadas (no repetir):
//   ups .................. torre vertical angosta con display
//   genset ............... contenedor horizontal + chimenea de escape
//   planta_cc ............ gabinete con dos zonas visiblemente distintas
//   tablero .............. gabinete ancho con la puerta abierta al costado
//   clima (CRAC) ......... vertical sobre piso técnico, descarga hacia abajo
//   clima (split) ........ dos cuerpos separados unidos por cañería
//   bomba ................ voluta circular + motor cilíndrico + descarga
//   banco_bateria ........ rack ABIERTO de bandejas, sin cerramiento
//   celda_mt ............. gabinete alto con mímico unifilar en la puerta
//   transformador_mt ..... cuba con conservador arriba y radiadores al lado
//   torre_enfriamiento ... trapecio con chimenea acampanada y ventilador
//   chiller .............. horizontal largo con ventiladores EN EL TECHO
//   ahc .................. horizontal con ductos rectangulares a los lados
//   acu .................. cubo con UNA reja circular grande al frente
//   estanque ............. cilindro HORIZONTAL sobre silletas
//   alcantarilla ......... corte de terreno con tapa a nivel de suelo
//   ascensor ............. puertas de hall con indicador de piso
//   instalacion_fisica ... edificio
//   monitoreo ............ videowall de 4 pantallas
//   extintor ............. extintor colgado en muro con señalética
//
// Reglas de forma: viewBox 0 0 240 200, contorno C.line 2px, relleno
// plano, esquinas redondeadas, sombra vía <Base/>, sin rótulos de texto.
// ============================================================

const C = {
  ink: '#0f172a',
  line: '#475569',
  body: '#eef2f8',
  bodyAlt: '#dbe4f0',
  steel: '#c3cfe0',
  steelDark: '#94a3b8',
  brand: '#0f3d6b',
  accent: '#1d4ed8',
  accentSoft: '#bfd4fb',
  glass: '#dbeafe',
  on: '#16a34a',
  warn: '#f59e0b',
  off: '#dc2626',
  white: '#ffffff',
}

function Base({ children, shadow = 86 }) {
  return (
    <svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="120" cy="188" rx={shadow} ry="7" fill={C.ink} opacity="0.08" />
      {children}
    </svg>
  )
}

/* --- Vocabulario compartido: rejillas, aletas, ventiladores, flujo --- */

function Louvers({ x, y, w, h, n = 6 }) {
  const gap = h / n
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" fill={C.white} stroke={C.steelDark} strokeWidth="1.6" />
      {[...Array(n)].map((_, i) => (
        <line key={i} x1={x + 5} y1={y + gap * (i + 0.5)} x2={x + w - 5} y2={y + gap * (i + 0.5)}
          stroke={C.steelDark} strokeWidth="2.6" strokeLinecap="round" />
      ))}
    </g>
  )
}

function Fins({ x, y, w, h, n = 11 }) {
  const gap = w / (n - 1)
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {[...Array(n)].map((_, i) => (
        <line key={i} x1={x + i * gap} y1={y + 5} x2={x + i * gap} y2={y + h - 5}
          stroke={C.steelDark} strokeWidth="2" />
      ))}
    </g>
  )
}

function Fan({ cx, cy, r }) {
  const b = r * 0.86
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={C.white} stroke={C.line} strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r * 0.8} fill="none" stroke={C.steel} strokeWidth="1.5" />
      {[0, 120, 240].map((a) => (
        <path key={a} transform={`rotate(${a} ${cx} ${cy})`} fill={C.steelDark}
          d={`M${cx} ${cy} L${cx - b * 0.24} ${cy - b} a ${b} ${b} 0 0 1 ${b * 0.7} ${b * 0.22} Z`} />
      ))}
      <circle cx={cx} cy={cy} r={Math.max(3, r * 0.17)} fill={C.line} />
    </g>
  )
}

function Flow({ d, color = C.accent }) {
  return <path d={d} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
}

/* ============ UPS — torre vertical angosta ============ */
function UpsModular() {
  return (
    <Base shadow={44}>
      <rect x="84" y="14" width="72" height="166" rx="7" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="92" y="22" width="56" height="150" rx="4" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {/* display */}
      <rect x="99" y="30" width="42" height="28" rx="4" fill={C.ink} />
      <rect x="104" y="36" width="24" height="14" rx="2" fill={C.accentSoft} />
      <circle cx="135" cy="43" r="3.4" fill={C.on} />
      {/* botonera */}
      {[0, 1, 2].map((i) => <circle key={i} cx={107 + i * 13} cy="67" r="3.6" fill={C.steel} />)}
      {/* módulos de potencia */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="99" y={80 + i * 24} width="42" height="18" rx="3" fill={C.bodyAlt} stroke={C.steel} strokeWidth="1.4" />
          <rect x="104" y={86 + i * 24} width="16" height="4" rx="2" fill={C.steelDark} />
          <circle cx="135" cy={89 + i * 24} r="3" fill={C.on} />
        </g>
      ))}
      {/* rejilla de ventilación */}
      <Louvers x={99} y={152} w={42} h={16} n={4} />
      <rect x="88" y="176" width="64" height="6" rx="3" fill={C.line} />
    </Base>
  )
}

/* ============ Grupo electrógeno — contenedor + chimenea ============ */
function Genset() {
  return (
    <Base shadow={92}>
      {/* chimenea de escape */}
      <rect x="164" y="14" width="18" height="40" rx="4" fill={C.steelDark} />
      <rect x="158" y="10" width="30" height="9" rx="4.5" fill={C.line} />
      {/* techo */}
      <rect x="24" y="46" width="192" height="14" rx="6" fill={C.brand} />
      {/* cerramiento insonorizado */}
      <rect x="30" y="58" width="180" height="100" rx="7" fill={C.body} stroke={C.line} strokeWidth="2" />
      <Louvers x={40} y={70} w={46} h={76} />
      {/* puerta con tablero de control */}
      <rect x="96" y="70" width="66" height="76" rx="5" fill={C.bodyAlt} stroke={C.line} strokeWidth="1.8" />
      <rect x="104" y="78" width="50" height="32" rx="4" fill={C.brand} />
      <rect x="110" y="85" width="24" height="10" rx="2" fill={C.accentSoft} />
      <circle cx="147" cy="90" r="3.4" fill={C.on} />
      <circle cx="147" cy="101" r="3.4" fill={C.warn} />
      <rect x="104" y="120" width="50" height="5" rx="2.5" fill={C.steelDark} />
      <rect x="150" y="130" width="9" height="12" rx="3" fill={C.line} />
      <Louvers x={172} y={70} w={34} h={76} />
      {/* patín */}
      <rect x="22" y="158" width="196" height="15" rx="4" fill={C.line} />
      <rect x="44" y="162" width="24" height="7" rx="2" fill={C.ink} />
      <rect x="172" y="162" width="24" height="7" rx="2" fill={C.ink} />
    </Base>
  )
}

/* ============ Planta CC — gabinete de dos zonas ============ */
function PlantaCC() {
  return (
    <Base shadow={64}>
      <rect x="58" y="14" width="124" height="166" rx="7" fill={C.body} stroke={C.line} strokeWidth="2" />
      {/* zona rectificadores */}
      <rect x="68" y="24" width="104" height="76" rx="5" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="74" y={30 + i * 17} width="92" height="13" rx="3" fill={C.bodyAlt} stroke={C.steel} strokeWidth="1.2" />
          <rect x="79" y={34 + i * 17} width="26" height="5" rx="2.5" fill={C.accent} />
          <circle cx="158" cy={36.5 + i * 17} r="3" fill={C.on} />
        </g>
      ))}
      {/* separación de zonas */}
      <rect x="68" y="106" width="104" height="5" rx="2.5" fill={C.steelDark} />
      {/* zona baterías */}
      <rect x="68" y="117" width="104" height="53" rx="5" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {[0, 1].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <g key={r + '-' + c}>
            <rect x={75 + c * 24} y={128 + r * 25} width="20" height="18" rx="3" fill={C.bodyAlt} stroke={C.line} strokeWidth="1.4" />
            <rect x={78 + c * 24} y={125 + r * 25} width="5" height="4" rx="1.5" fill={C.off} />
            <rect x={88 + c * 24} y={125 + r * 25} width="5" height="4" rx="1.5" fill={C.ink} />
          </g>
        ))
      )}
      <rect x="66" y="176" width="108" height="6" rx="3" fill={C.line} />
    </Base>
  )
}

/* ============ Tablero — gabinete con puerta abierta ============ */
function Tablero() {
  return (
    <Base shadow={90}>
      {/* puerta abierta hacia el observador */}
      <path d="M26 36 L64 22 L64 178 L26 164 Z" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" strokeLinejoin="round" />
      <path d="M34 52 L56 44 L56 152 L34 144 Z" fill={C.body} stroke={C.steel} strokeWidth="1.4" />
      <rect x="58" y="94" width="5" height="16" rx="2.5" fill={C.line} />
      {/* cuerpo */}
      <rect x="64" y="22" width="140" height="156" rx="5" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="74" y="32" width="120" height="136" rx="3" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {/* barra principal */}
      <rect x="82" y="40" width="104" height="9" rx="4.5" fill={C.brand} />
      {/* interruptor general */}
      <rect x="116" y="56" width="36" height="22" rx="4" fill={C.line} />
      <rect x="128" y="61" width="12" height="12" rx="2" fill={C.on} />
      {/* filas de protecciones sobre riel DIN */}
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <rect x="82" y={90 + r * 26} width="104" height="3.5" rx="1.75" fill={C.steelDark} />
          {[...Array(8)].map((_, i) => (
            <g key={i}>
              <rect x={83 + i * 13} y={95 + r * 26} width="10" height="18" rx="2" fill={C.bodyAlt} stroke={C.steel} strokeWidth="1.2" />
              <rect x={85.5 + i * 13} y={98 + r * 26} width="5" height="7" rx="1.5" fill={i % 3 === 0 ? C.off : C.accent} />
            </g>
          ))}
        </g>
      ))}
    </Base>
  )
}

/* ============ CRAC — vertical sobre piso técnico ============ */
function CracPrecision() {
  return (
    <Base shadow={90}>
      <rect x="74" y="10" width="94" height="146" rx="6" fill={C.body} stroke={C.line} strokeWidth="2" />
      {/* panel de control */}
      <rect x="84" y="20" width="74" height="24" rx="4" fill={C.brand} />
      <rect x="90" y="26" width="28" height="12" rx="2" fill={C.accentSoft} />
      <circle cx="148" cy="32" r="3.6" fill={C.on} />
      {/* reja frontal de aspiración */}
      <Louvers x={84} y={52} w={74} h={94} n={8} />
      {/* piso técnico */}
      <rect x="18" y="156" width="204" height="12" rx="2" fill={C.bodyAlt} stroke={C.line} strokeWidth="1.6" />
      <line x1="70" y1="156" x2="70" y2="168" stroke={C.steelDark} strokeWidth="1.6" />
      <line x1="120" y1="156" x2="120" y2="168" stroke={C.steelDark} strokeWidth="1.6" />
      <line x1="170" y1="156" x2="170" y2="168" stroke={C.steelDark} strokeWidth="1.6" />
      {/* descarga bajo el piso */}
      <Flow d="M98 172 v14 M98 186 l-5 -5 M98 186 l5 -5" />
      <Flow d="M144 172 v14 M144 186 l-5 -5 M144 186 l5 -5" />
    </Base>
  )
}

/* ============ Split — dos cuerpos separados ============ */
function SplitHvac() {
  return (
    <Base shadow={80}>
      {/* muro */}
      <rect x="14" y="18" width="6" height="150" rx="3" fill={C.steel} />
      {/* evaporadora mural */}
      <rect x="22" y="30" width="112" height="40" rx="13" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="22" y="56" width="112" height="13" rx="6.5" fill={C.bodyAlt} stroke={C.steel} strokeWidth="1.4" />
      <line x1="34" y1="62" x2="122" y2="62" stroke={C.steelDark} strokeWidth="1.8" />
      <rect x="96" y="39" width="26" height="8" rx="3" fill={C.accentSoft} />
      <circle cx="127" cy="43" r="3.2" fill={C.on} />
      <Flow d="M48 78 q6 12 0 22" />
      <Flow d="M78 78 q6 12 0 22" />
      <Flow d="M108 78 q6 12 0 22" />
      {/* cañería de interconexión */}
      <path d="M134 50 H160 a10 10 0 0 1 10 10 V96" fill="none" stroke={C.steelDark} strokeWidth="5" strokeLinecap="round" />
      {/* condensadora exterior */}
      <rect x="146" y="96" width="80" height="72" rx="8" fill={C.body} stroke={C.line} strokeWidth="2" />
      <Fan cx={186} cy={132} r={27} />
      <rect x="152" y="160" width="68" height="5" rx="2.5" fill={C.steelDark} />
    </Base>
  )
}

/* ============ Bomba — voluta + motor + descarga vertical ============ */
function Bomba() {
  return (
    <Base>
      <rect x="26" y="156" width="188" height="15" rx="4" fill={C.line} />
      {/* motor con aletas */}
      <rect x="30" y="94" width="84" height="58" rx="20" fill={C.body} stroke={C.line} strokeWidth="2" />
      {[...Array(6)].map((_, i) => (
        <line key={i} x1={44 + i * 12} y1="100" x2={44 + i * 12} y2="146" stroke={C.steelDark} strokeWidth="3" />
      ))}
      <rect x="52" y="80" width="34" height="16" rx="4" fill={C.brand} />
      {/* acople */}
      <rect x="114" y="110" width="16" height="26" rx="3" fill={C.steel} stroke={C.line} strokeWidth="1.6" />
      {/* voluta */}
      <path d="M148 96 Q150 62 156 50 L188 50 Q198 76 202 100 Z" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="168" cy="120" r="38" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      {/* brida de succión axial */}
      <circle cx="168" cy="120" r="23" fill={C.body} stroke={C.line} strokeWidth="1.8" />
      <circle cx="168" cy="120" r="13" fill={C.steel} stroke={C.line} strokeWidth="1.8" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} r="2.4" fill={C.line}
          cx={168 + 19 * Math.cos((a * Math.PI) / 180)}
          cy={120 + 19 * Math.sin((a * Math.PI) / 180)} />
      ))}
      {/* brida de descarga */}
      <rect x="150" y="38" width="44" height="13" rx="4" fill={C.brand} />
    </Base>
  )
}

/* ============ Banco de baterías — rack ABIERTO ============ */
function BancoBateria() {
  return (
    <Base shadow={80}>
      {/* montantes */}
      <rect x="30" y="20" width="11" height="158" rx="3" fill={C.steelDark} />
      <rect x="199" y="20" width="11" height="158" rx="3" fill={C.steelDark} />
      <rect x="30" y="20" width="180" height="9" rx="3" fill={C.line} />
      {[0, 1, 2].map((r) => (
        <g key={r}>
          {/* bandeja */}
          <rect x="30" y={78 + r * 46} width="180" height="8" rx="3" fill={C.steel} stroke={C.line} strokeWidth="1.4" />
          {/* celdas */}
          {[0, 1, 2, 3, 4].map((c) => (
            <g key={c}>
              <rect x={46 + c * 31} y={46 + r * 46} width="26" height="32" rx="3" fill={C.white} stroke={C.line} strokeWidth="1.7" />
              <rect x={50 + c * 31} y={42 + r * 46} width="6" height="5" rx="2" fill={C.off} />
              <rect x={62 + c * 31} y={42 + r * 46} width="6" height="5" rx="2" fill={C.ink} />
              <line x1={46 + c * 31} y1={62 + r * 46} x2={72 + c * 31} y2={62 + r * 46} stroke={C.steel} strokeWidth="1.5" />
            </g>
          ))}
          {/* puentes entre celdas */}
          {[0, 1, 2, 3].map((c) => (
            <line key={'p' + c} x1={65 + c * 31} y1={44 + r * 46} x2={83 + c * 31} y2={44 + r * 46}
              stroke={C.accent} strokeWidth="2.6" strokeLinecap="round" />
          ))}
        </g>
      ))}
    </Base>
  )
}

/* ============ Celda MT — mímico unifilar en la puerta ============ */
function CeldaMT() {
  return (
    <Base shadow={54}>
      <rect x="74" y="10" width="92" height="170" rx="5" fill={C.body} stroke={C.line} strokeWidth="2" />
      {/* compartimento de relé */}
      <rect x="82" y="20" width="76" height="42" rx="4" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      <rect x="94" y="27" width="52" height="28" rx="3" fill={C.ink} />
      <rect x="99" y="32" width="24" height="12" rx="2" fill={C.accentSoft} />
      <circle cx="138" cy="35" r="3" fill={C.on} />
      <circle cx="138" cy="46" r="3" fill={C.off} />
      {/* puerta con mímico unifilar */}
      <rect x="82" y="70" width="76" height="76" rx="4" fill={C.bodyAlt} stroke={C.line} strokeWidth="1.8" />
      <path d="M120 78 V92 M120 112 V126" stroke={C.brand} strokeWidth="3" strokeLinecap="round" />
      <rect x="111" y="92" width="18" height="20" rx="2" fill={C.white} stroke={C.brand} strokeWidth="3" />
      <path d="M120 126 L133 138" stroke={C.brand} strokeWidth="3" strokeLinecap="round" />
      <circle cx="120" cy="126" r="3" fill={C.brand} />
      <circle cx="120" cy="138" r="3" fill={C.brand} />
      <path d="M112 138 h16" stroke={C.brand} strokeWidth="3" strokeLinecap="round" />
      {/* compartimento del interruptor extraíble */}
      <rect x="82" y="154" width="76" height="18" rx="4" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      <rect x="108" y="160" width="24" height="6" rx="3" fill={C.line} />
      {/* lámparas de señalización */}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={169 + 0} cy={30 + i * 16} r="4.5" fill={[C.on, C.off, C.warn][i]} stroke={C.line} strokeWidth="1.4" />
      ))}
    </Base>
  )
}

/* ============ Transformador MT — conservador + radiadores ============ */
function TransformadorMT() {
  return (
    <Base>
      {/* conservador de aceite */}
      <rect x="78" y="24" width="84" height="22" rx="11" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <rect x="94" y="46" width="7" height="12" fill={C.steelDark} />
      <rect x="139" y="46" width="7" height="12" fill={C.steelDark} />
      {/* radiadores */}
      {[...Array(5)].map((_, i) => (
        <rect key={'l' + i} x={30 + i * 9} y="78" width="6" height="74" rx="3" fill={C.steel} stroke={C.line} strokeWidth="1.3" />
      ))}
      {[...Array(5)].map((_, i) => (
        <rect key={'r' + i} x={168 + i * 9} y="78" width="6" height="74" rx="3" fill={C.steel} stroke={C.line} strokeWidth="1.3" />
      ))}
      {/* cuba */}
      <rect x="78" y="58" width="84" height="100" rx="6" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="88" y="132" width="64" height="6" rx="3" fill={C.steel} />
      <rect x="88" y="144" width="34" height="5" rx="2.5" fill={C.steel} />
      {/* bushings AT: porcelana escalonada */}
      {[0, 1, 2].map((i) => (
        <g key={'at' + i}>
          <rect x={92 + i * 26} y="42" width="7" height="18" fill={C.steelDark} />
          <ellipse cx={95.5 + i * 26} cy="40" rx="10" ry="4" fill="#fca5a5" stroke={C.line} strokeWidth="1.3" />
          <ellipse cx={95.5 + i * 26} cy="33" rx="8" ry="3.5" fill="#fca5a5" stroke={C.line} strokeWidth="1.3" />
          <ellipse cx={95.5 + i * 26} cy="27" rx="6" ry="3" fill="#fca5a5" stroke={C.line} strokeWidth="1.3" />
        </g>
      ))}
      {/* base con ruedas */}
      <rect x="70" y="158" width="100" height="11" rx="3" fill={C.line} />
      <circle cx="88" cy="174" r="6" fill={C.ink} />
      <circle cx="152" cy="174" r="6" fill={C.ink} />
    </Base>
  )
}

/* ============ Torre de enfriamiento — chimenea acampanada ============ */
function TorreEnfriamiento() {
  return (
    <Base shadow={74}>
      {/* chimenea acampanada */}
      <path d="M84 76 L94 34 L146 34 L156 76 Z" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="120" cy="34" rx="26" ry="8" fill={C.body} stroke={C.line} strokeWidth="2" />
      <Fan cx={120} cy={34} r={20} />
      {/* cuerpo trapezoidal */}
      <path d="M62 76 L178 76 L170 152 L70 152 Z" fill={C.body} stroke={C.line} strokeWidth="2" strokeLinejoin="round" />
      {/* rejillas de entrada de aire */}
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={74 + i * 1.5} y1={94 + i * 15} x2={166 - i * 1.5} y2={94 + i * 15}
          stroke={C.steelDark} strokeWidth="5" strokeLinecap="round" />
      ))}
      {/* piscina y cañerías */}
      <rect x="56" y="152" width="128" height="20" rx="4" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <rect x="62" y="158" width="116" height="8" rx="4" fill={C.accent} />
      <rect x="184" y="118" width="34" height="11" rx="5.5" fill={C.accent} />
      <rect x="184" y="136" width="34" height="11" rx="5.5" fill={C.accentSoft} />
      {/* aire de salida */}
      <Flow d="M100 26 v-14 M100 12 l-5 5 M100 12 l5 5" />
      <Flow d="M140 26 v-14 M140 12 l-5 5 M140 12 l5 5" />
    </Base>
  )
}

/* ============ Chiller — ventiladores EN EL TECHO ============ */
function Chiller() {
  return (
    <Base shadow={92}>
      <Fan cx={70} cy={54} r={26} />
      <Fan cx={120} cy={54} r={26} />
      <Fan cx={170} cy={54} r={26} />
      {/* bancada superior */}
      <rect x="28" y="74" width="184" height="12" rx="4" fill={C.brand} />
      {/* cuerpo */}
      <rect x="28" y="84" width="184" height="72" rx="7" fill={C.body} stroke={C.line} strokeWidth="2" />
      <Fins x={38} y={94} w={132} h={52} n={13} />
      {/* tablero de control */}
      <rect x="178" y="94" width="26" height="52" rx="4" fill={C.brand} />
      <rect x="183" y="100" width="16" height="10" rx="2" fill={C.accentSoft} />
      <circle cx="191" cy="120" r="3.4" fill={C.on} />
      {/* base y cañerías */}
      <rect x="36" y="156" width="168" height="12" rx="3" fill={C.line} />
      <rect x="212" y="106" width="22" height="10" rx="5" fill={C.accent} />
      <rect x="212" y="124" width="22" height="10" rx="5" fill={C.accentSoft} />
    </Base>
  )
}

/* ============ AHC — ductos rectangulares a los lados ============ */
function AHC() {
  return (
    <Base shadow={92}>
      {/* ductos */}
      <rect x="6" y="70" width="36" height="42" rx="4" fill={C.steel} stroke={C.line} strokeWidth="2" />
      <rect x="198" y="70" width="36" height="42" rx="4" fill={C.steel} stroke={C.line} strokeWidth="2" />
      <Flow d="M14 91 h18 M32 91 l-6 -5 M32 91 l-6 5" />
      <Flow d="M206 91 h18 M224 91 l-6 -5 M224 91 l-6 5" />
      {/* cuerpo modular */}
      <rect x="40" y="46" width="160" height="106" rx="6" fill={C.body} stroke={C.line} strokeWidth="2" />
      <line x1="93" y1="46" x2="93" y2="152" stroke={C.line} strokeWidth="2" />
      <line x1="146" y1="46" x2="146" y2="152" stroke={C.line} strokeWidth="2" />
      {/* sección filtros */}
      <rect x="49" y="58" width="36" height="82" rx="4" fill={C.white} stroke={C.steel} strokeWidth="1.5" />
      <path d="M49 58 L85 94 M49 94 L85 130 M49 76 L85 112 M67 58 L85 76 M49 112 L67 130"
        fill="none" stroke={C.steel} strokeWidth="1.6" />
      {/* sección serpentín */}
      <rect x="102" y="58" width="36" height="82" rx="4" fill={C.white} stroke={C.steel} strokeWidth="1.5" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="108" y1={68 + i * 16} x2="132" y2={68 + i * 16} stroke={C.accent} strokeWidth="2.6" />
      ))}
      {/* sección ventilador, con visor */}
      <circle cx="173" cy="99" r="26" fill={C.white} stroke={C.steel} strokeWidth="1.5" />
      <Fan cx={173} cy={99} r={21} />
      {/* manillas */}
      <rect x="87" y="94" width="4" height="14" rx="2" fill={C.line} />
      <rect x="140" y="94" width="4" height="14" rx="2" fill={C.line} />
      <rect x="193" y="94" width="4" height="14" rx="2" fill={C.line} />
      <rect x="48" y="152" width="144" height="10" rx="3" fill={C.line} />
    </Base>
  )
}

/* ============ ACU — UNA reja circular grande ============ */
function ACU() {
  return (
    <Base shadow={70}>
      <rect x="58" y="34" width="124" height="126" rx="9" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="66" y="42" width="108" height="12" rx="4" fill={C.brand} />
      {/* reja circular */}
      <circle cx="120" cy="106" r="46" fill={C.white} stroke={C.line} strokeWidth="2" />
      {[38, 30, 22, 14].map((r) => (
        <circle key={r} cx="120" cy="106" r={r} fill="none" stroke={C.steelDark} strokeWidth="2" />
      ))}
      {[0, 45, 90, 135].map((a) => (
        <line key={a} transform={`rotate(${a} 120 106)`} x1="74" y1="106" x2="166" y2="106"
          stroke={C.steelDark} strokeWidth="2" />
      ))}
      <circle cx="120" cy="106" r="8" fill={C.line} />
      {/* cañerías y patas */}
      <rect x="182" y="72" width="26" height="10" rx="5" fill={C.accent} />
      <rect x="182" y="90" width="26" height="10" rx="5" fill={C.accentSoft} />
      <rect x="70" y="160" width="16" height="14" rx="3" fill={C.line} />
      <rect x="154" y="160" width="16" height="14" rx="3" fill={C.line} />
      <circle cx="168" cy="48" r="3.4" fill={C.on} />
    </Base>
  )
}

/* ============ Estanque — cilindro horizontal sobre silletas ============ */
function EstanqueCombustible() {
  return (
    <Base shadow={92}>
      {/* silletas */}
      <path d="M52 154 L74 154 L80 174 L46 174 Z" fill={C.line} strokeLinejoin="round" />
      <path d="M166 154 L188 154 L194 174 L160 174 Z" fill={C.line} strokeLinejoin="round" />
      {/* cuerpo cilíndrico */}
      <rect x="26" y="70" width="188" height="86" rx="43" fill={C.body} stroke={C.line} strokeWidth="2" />
      <ellipse cx="52" cy="113" rx="19" ry="43" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      {/* costuras */}
      <path d="M108 71 a 19 42 0 0 0 0 84" fill="none" stroke={C.steel} strokeWidth="1.8" />
      <path d="M164 71 a 19 42 0 0 0 0 84" fill="none" stroke={C.steel} strokeWidth="1.8" />
      {/* boca de hombre */}
      <rect x="104" y="54" width="34" height="18" rx="4" fill={C.steelDark} />
      <rect x="98" y="46" width="46" height="11" rx="5" fill={C.brand} />
      {/* venteo */}
      <rect x="176" y="46" width="8" height="26" rx="3" fill={C.steelDark} />
      <path d="M180 47 q11 -8 18 0" fill="none" stroke={C.steelDark} strokeWidth="5" strokeLinecap="round" />
      {/* escalera lateral */}
      <line x1="196" y1="86" x2="196" y2="154" stroke={C.steelDark} strokeWidth="3" />
      <line x1="208" y1="86" x2="208" y2="154" stroke={C.steelDark} strokeWidth="3" />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="196" y1={98 + i * 17} x2="208" y2={98 + i * 17} stroke={C.steelDark} strokeWidth="2.4" />
      ))}
      {/* nivel */}
      <circle cx="82" cy="100" r="12" fill={C.white} stroke={C.line} strokeWidth="2" />
      <path d="M82 100 L89 93" stroke={C.warn} strokeWidth="2.6" strokeLinecap="round" />
    </Base>
  )
}

/* ============ Alcantarillado — corte de terreno ============ */
function Alcantarilla() {
  return (
    <Base shadow={0}>
      {/* terreno */}
      <rect x="10" y="86" width="220" height="94" rx="6" fill={C.bodyAlt} />
      <rect x="10" y="86" width="220" height="9" rx="4" fill={C.steelDark} />
      {/* marco y tapa a nivel de suelo */}
      <ellipse cx="120" cy="88" rx="50" ry="15" fill={C.steel} stroke={C.line} strokeWidth="2" />
      <ellipse cx="120" cy="86" rx="38" ry="11" fill={C.body} stroke={C.line} strokeWidth="2" />
      <g stroke={C.steelDark} strokeWidth="1.8" strokeLinecap="round">
        <line x1="88" y1="86" x2="152" y2="86" />
        <line x1="120" y1="76" x2="120" y2="96" />
        <line x1="96" y1="80" x2="144" y2="92" />
        <line x1="96" y1="92" x2="144" y2="80" />
      </g>
      {/* cámara enterrada */}
      <rect x="86" y="98" width="68" height="66" rx="4" fill={C.white} stroke={C.line} strokeWidth="2" />
      {/* peldaños */}
      {[0, 1, 2].map((i) => (
        <line key={i} x1="96" y1={112 + i * 15} x2="110" y2={112 + i * 15} stroke={C.steelDark} strokeWidth="3" strokeLinecap="round" />
      ))}
      {/* ductos */}
      <rect x="16" y="126" width="70" height="24" rx="6" fill={C.steel} stroke={C.line} strokeWidth="2" />
      <rect x="154" y="126" width="70" height="24" rx="6" fill={C.steel} stroke={C.line} strokeWidth="2" />
      {/* agua */}
      <rect x="90" y="152" width="60" height="10" rx="3" fill={C.accent} opacity="0.6" />
      <rect x="20" y="140" width="66" height="8" rx="4" fill={C.accent} opacity="0.6" />
      <rect x="154" y="140" width="66" height="8" rx="4" fill={C.accent} opacity="0.6" />
      <Flow d="M30 134 h22 M52 134 l-5 -4 M52 134 l-5 4" />
      <Flow d="M186 134 h22 M208 134 l-5 -4 M208 134 l-5 4" />
    </Base>
  )
}

/* ============ Ascensor — puertas de hall ============ */
function Ascensor() {
  return (
    <Base shadow={62}>
      {/* marco */}
      <rect x="58" y="18" width="124" height="162" rx="5" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      {/* indicador de piso */}
      <rect x="90" y="28" width="60" height="26" rx="4" fill={C.ink} />
      <rect x="112" y="34" width="16" height="14" rx="2" fill={C.accentSoft} />
      <path d="M101 47 L96 40 L106 40 Z" fill={C.on} />
      <path d="M139 36 L144 43 L134 43 Z" fill={C.steelDark} />
      {/* puertas */}
      <rect x="70" y="62" width="100" height="110" rx="3" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="78" y="70" width="36" height="94" rx="2" fill={C.white} stroke={C.steel} strokeWidth="1.5" />
      <rect x="126" y="70" width="36" height="94" rx="2" fill={C.white} stroke={C.steel} strokeWidth="1.5" />
      <line x1="120" y1="62" x2="120" y2="172" stroke={C.line} strokeWidth="2.5" />
      {/* umbral */}
      <rect x="66" y="172" width="108" height="8" rx="2" fill={C.steelDark} />
      {/* botonera de llamada */}
      <rect x="190" y="82" width="20" height="38" rx="5" fill={C.brand} />
      <circle cx="200" cy="94" r="4" fill={C.on} />
      <circle cx="200" cy="108" r="4" fill={C.accentSoft} />
    </Base>
  )
}

/* ============ Instalación física — edificio ============ */
function InstalacionFisica() {
  return (
    <Base>
      <path d="M22 78 L120 20 L218 78 Z" fill={C.brand} stroke={C.brand} strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 20 L218 78 L196 78 L120 33 Z" fill={C.ink} opacity="0.18" />
      <rect x="44" y="78" width="152" height="96" rx="6" fill={C.body} stroke={C.line} strokeWidth="2" />
      {[0, 1, 2].map((c) =>
        [0, 1].map((r) => (
          <rect key={c + '-' + r} x={58 + c * 46} y={92 + r * 34} width="30" height="24" rx="3"
            fill={C.glass} stroke={C.steel} strokeWidth="1.6" />
        ))
      )}
      <rect x="104" y="140" width="34" height="34" rx="4" fill={C.accent} />
      <circle cx="131" cy="158" r="2.8" fill={C.warn} />
      <rect x="36" y="172" width="168" height="8" rx="4" fill={C.line} />
    </Base>
  )
}

/* ============ Monitoreo — videowall de 4 pantallas ============ */
function SistemaMonitoreo() {
  return (
    <Base shadow={80}>
      {/* pantalla 1: curvas */}
      <rect x="26" y="20" width="90" height="62" rx="6" fill={C.ink} />
      <polyline points="36,68 54,50 68,58 84,36 106,48" fill="none" stroke={C.on} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* pantalla 2: barras */}
      <rect x="124" y="20" width="90" height="62" rx="6" fill={C.ink} />
      {[26, 44, 34, 52, 40].map((h, i) => (
        <rect key={i} x={136 + i * 16} y={72 - h} width="10" height={h} rx="2" fill={i === 3 ? C.warn : C.accent} />
      ))}
      {/* pantalla 3: tabla */}
      <rect x="26" y="88" width="90" height="62" rx="6" fill={C.ink} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx="40" cy={102 + i * 13} r="3.4" fill={i === 1 ? C.off : C.on} />
          <rect x="50" y={100 + i * 13} width="52" height="4" rx="2" fill="#334155" />
        </g>
      ))}
      {/* pantalla 4: alarma */}
      <rect x="124" y="88" width="90" height="62" rx="6" fill={C.ink} />
      <path d="M169 104 L186 132 L152 132 Z" fill="none" stroke={C.off} strokeWidth="3" strokeLinejoin="round" />
      <line x1="169" y1="113" x2="169" y2="122" stroke={C.off} strokeWidth="3" strokeLinecap="round" />
      <circle cx="169" cy="127" r="1.8" fill={C.off} />
      {/* consola */}
      <rect x="34" y="158" width="172" height="10" rx="4" fill={C.line} />
      <rect x="88" y="150" width="64" height="8" rx="3" fill={C.steelDark} />
    </Base>
  )
}

/* ============ Extintor — colgado en muro con señalética ============ */
function Extintor() {
  return (
    <Base shadow={40}>
      {/* muro */}
      <rect x="30" y="10" width="180" height="164" rx="6" fill={C.body} stroke={C.steel} strokeWidth="1.6" />
      <line x1="30" y1="70" x2="210" y2="70" stroke={C.steel} strokeWidth="1.4" />
      <line x1="30" y1="126" x2="210" y2="126" stroke={C.steel} strokeWidth="1.4" />
      <line x1="120" y1="10" x2="120" y2="70" stroke={C.steel} strokeWidth="1.4" />
      <line x1="76" y1="70" x2="76" y2="126" stroke={C.steel} strokeWidth="1.4" />
      {/* señalética */}
      <rect x="142" y="24" width="50" height="50" rx="5" fill="#dc2626" />
      <rect x="158" y="38" width="16" height="26" rx="5" fill={C.white} />
      <rect x="162" y="32" width="8" height="7" rx="2" fill={C.white} />
      <path d="M174 40 q9 3 8 12" fill="none" stroke={C.white} strokeWidth="2.6" strokeLinecap="round" />
      {/* soporte de muro */}
      <rect x="66" y="104" width="42" height="9" rx="4" fill={C.steelDark} />
      {/* extintor */}
      <rect x="66" y="74" width="42" height="76" rx="14" fill="#dc2626" />
      <path d="M66 100 h42 v30 h-42 z" fill={C.ink} opacity="0.10" />
      <rect x="66" y="74" width="42" height="76" rx="14" fill="none" stroke={C.line} strokeWidth="2" />
      <rect x="73" y="98" width="28" height="28" rx="4" fill="#fef2f2" stroke={C.line} strokeWidth="1.4" />
      <rect x="78" y="105" width="18" height="3.4" rx="1.7" fill={C.steelDark} />
      <rect x="78" y="112" width="18" height="3.4" rx="1.7" fill={C.steelDark} />
      <rect x="78" y="119" width="11" height="3.4" rx="1.7" fill={C.steelDark} />
      {/* válvula */}
      <rect x="79" y="62" width="16" height="13" rx="3" fill={C.steel} stroke={C.line} strokeWidth="1.6" />
      <rect x="71" y="48" width="32" height="15" rx="5" fill={C.line} />
      <rect x="68" y="40" width="38" height="7" rx="3.5" fill={C.line} />
      <circle cx="106" cy="44" r="5.5" fill="none" stroke={C.warn} strokeWidth="2.8" />
      {/* manómetro */}
      <path d="M77 56 H66" stroke={C.line} strokeWidth="4" strokeLinecap="round" />
      <circle cx="58" cy="56" r="11" fill={C.white} stroke={C.line} strokeWidth="2" />
      <path d="M58 56 L64 50" stroke={C.on} strokeWidth="2.4" strokeLinecap="round" />
      {/* manguera */}
      <path d="M104 70 C 124 80, 126 118, 112 140" fill="none" stroke={C.line} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M112 140 l -6 16 l 15 0 z" fill={C.line} />
      {/* piso */}
      <rect x="24" y="174" width="192" height="8" rx="3" fill={C.steelDark} />
    </Base>
  )
}

/* ============ Genérico — rack con puerta perforada ============ */
function Generic() {
  return (
    <Base shadow={56}>
      <rect x="66" y="16" width="108" height="162" rx="7" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="76" y="26" width="88" height="142" rx="4" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x="84" y={36 + i * 27} width="72" height="19" rx="3" fill={C.bodyAlt} stroke={C.steel} strokeWidth="1.3" />
          <circle cx="92" cy={45.5 + i * 27} r="3" fill={i === 2 ? C.warn : C.on} />
          <rect x="102" y={43 + i * 27} width="30" height="4" rx="2" fill={C.steelDark} />
        </g>
      ))}
      <rect x="70" y="174" width="100" height="6" rx="3" fill={C.line} />
    </Base>
  )
}

export default function AssetIllustration({ illustration, data, imageUrl }) {
  if (imageUrl) return <img src={imageUrl} alt="Activo" />

  if (illustration === 'clima') {
    const tipo = String(data?.tipo || '').toUpperCase()
    return tipo === 'CRAC' || tipo === 'CRAH' ? <CracPrecision /> : <SplitHvac />
  }
  switch (illustration) {
    case 'ups':                  return <UpsModular />
    case 'genset':               return <Genset />
    case 'planta_cc':            return <PlantaCC />
    case 'tablero':              return <Tablero />
    case 'bomba':                return <Bomba />
    case 'banco_bateria':        return <BancoBateria />
    case 'celda_mt':             return <CeldaMT />
    case 'transformador_mt':     return <TransformadorMT />
    case 'torre_enfriamiento':   return <TorreEnfriamiento />
    case 'chiller':              return <Chiller />
    case 'ahc':                  return <AHC />
    case 'acu':                  return <ACU />
    case 'estanque_combustible': return <EstanqueCombustible />
    case 'alcantarilla':         return <Alcantarilla />
    case 'ascensor':             return <Ascensor />
    case 'instalacion_fisica':   return <InstalacionFisica />
    case 'extintor':             return <Extintor />
    case 'monitoreo':            return <SistemaMonitoreo />
    default:                     return <Generic />
  }
}
