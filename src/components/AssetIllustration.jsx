// ============================================================
// Ilustraciones de equipos — estilo duotono plano
//
// Reglas del sistema de diseño (respetarlas al agregar equipos nuevos):
//   * viewBox único 0 0 240 200 para TODAS. Así todas ocupan el mismo
//     espacio en las tarjetas y la grilla se ve pareja.
//   * Paleta cerrada C: neutros para el chasis, azul de marca para el
//     frente, azul acento para el detalle "vivo", verde/ámbar/rojo solo
//     para indicadores de estado.
//   * Contorno C.line de 2px, esquinas redondeadas, relleno plano.
//     Sin gradientes ni sombras duras.
//   * Sombra de apoyo en el suelo vía <Base/>, nunca dibujada a mano.
//   * Sin rótulos de texto: la tarjeta ya dice el nombre del tipo.
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

// Lienzo común: sombra de apoyo + viewBox unificado.
function Base({ children, shadow = 86 }) {
  return (
    <svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="120" cy="188" rx={shadow} ry="7" fill={C.ink} opacity="0.08" />
      {children}
    </svg>
  )
}

// Flecha de flujo (aire o agua) reutilizable.
function Flow({ d, color = C.accent }) {
  return <path d={d} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
}

/* ---------------------------------------------------------- UPS modular */
function UpsModular() {
  return (
    <Base shadow={58}>
      <rect x="74" y="18" width="92" height="162" rx="11" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="84" y="28" width="72" height="28" rx="6" fill={C.brand} />
      <rect x="91" y="36" width="32" height="12" rx="3" fill={C.accentSoft} />
      <circle cx="146" cy="42" r="4" fill={C.on} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="84" y={66 + i * 27} width="72" height="21" rx="5" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
          <rect x="91" y={72 + i * 27} width="28" height="4" rx="2" fill={C.steel} />
          <rect x="91" y={79 + i * 27} width="16" height="3" rx="1.5" fill={C.steel} />
          <circle cx="146" cy={76 + i * 27} r="3.4" fill={C.on} />
        </g>
      ))}
      <rect x="86" y="174" width="68" height="6" rx="3" fill={C.line} />
    </Base>
  )
}

/* ------------------------------------------------- Grupo electrógeno */
function Genset() {
  return (
    <Base>
      {/* patín */}
      <rect x="26" y="150" width="188" height="16" rx="5" fill={C.line} />
      <rect x="40" y="166" width="26" height="10" rx="3" fill={C.ink} />
      <rect x="174" y="166" width="26" height="10" rx="3" fill={C.ink} />
      {/* radiador */}
      <rect x="32" y="76" width="42" height="74" rx="7" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="39" y1={88 + i * 14} x2="67" y2={88 + i * 14} stroke={C.steelDark} strokeWidth="2.4" />
      ))}
      {/* motor */}
      <rect x="76" y="66" width="76" height="84" rx="9" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="86" y="78" width="56" height="12" rx="4" fill={C.line} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={88 + i * 14} y="96" width="10" height="26" rx="3" fill={C.steel} />
      ))}
      <rect x="86" y="130" width="56" height="8" rx="3" fill={C.bodyAlt} />
      {/* alternador */}
      <rect x="152" y="82" width="62" height="68" rx="30" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <circle cx="183" cy="116" r="15" fill={C.steel} stroke={C.line} strokeWidth="2" />
      <circle cx="183" cy="116" r="5" fill={C.line} />
      {/* escape */}
      <rect x="98" y="26" width="15" height="42" rx="5" fill={C.steelDark} />
      <ellipse cx="105" cy="25" rx="11" ry="6" fill={C.steel} />
      <circle cx="203" cy="94" r="4" fill={C.on} />
    </Base>
  )
}

/* ------------------------------------------------------------ Planta CC */
function PlantaCC() {
  return (
    <Base>
      {/* rectificadores */}
      <rect x="26" y="26" width="88" height="150" rx="10" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="36" y="36" width="68" height="18" rx="5" fill={C.brand} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="36" y={64 + i * 34} width="68" height="26" rx="5" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
          <rect x="43" y={72 + i * 34} width="30" height="5" rx="2.5" fill={C.accent} />
          <circle cx="95" cy={77 + i * 34} r="3.4" fill={C.on} />
        </g>
      ))}
      <rect x="36" y="166" width="68" height="4" rx="2" fill={C.steel} />
      {/* banco de baterías */}
      <rect x="126" y="26" width="88" height="150" rx="10" fill={C.body} stroke={C.line} strokeWidth="2" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1].map((c) => (
          <g key={r + '-' + c}>
            <rect x={136 + c * 38} y={38 + r * 34} width="32" height="24" rx="4" fill={C.bodyAlt} stroke={C.line} strokeWidth="1.6" />
            <rect x={141 + c * 38} y={34 + r * 34} width="6" height="5" rx="1.5" fill={C.off} />
            <rect x={157 + c * 38} y={34 + r * 34} width="6" height="5" rx="1.5" fill={C.ink} />
          </g>
        ))
      )}
      <path d="M114 100 H126" stroke={C.accent} strokeWidth="3" strokeLinecap="round" />
    </Base>
  )
}

/* ----------------------------------------------------- Tablero eléctrico */
function Tablero() {
  return (
    <Base shadow={64}>
      <rect x="52" y="14" width="136" height="166" rx="11" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="64" y="26" width="112" height="142" rx="7" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {/* barra principal */}
      <rect x="72" y="36" width="96" height="9" rx="4.5" fill={C.brand} />
      {/* interruptor general */}
      <rect x="100" y="54" width="40" height="28" rx="5" fill={C.line} />
      <rect x="112" y="60" width="16" height="16" rx="3" fill={C.on} />
      {/* filas de protecciones */}
      {[0, 1].map((row) => (
        <g key={row}>
          <rect x="72" y={94 + row * 38} width="96" height="4" rx="2" fill={C.steel} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <rect x={73 + i * 16} y={102 + row * 38} width="12" height="24" rx="3" fill={C.bodyAlt} stroke={C.steel} strokeWidth="1.4" />
              <rect x={76 + i * 16} y={106 + row * 38} width="6" height="9" rx="1.5" fill={i % 3 === 0 ? C.off : C.accent} />
            </g>
          ))}
        </g>
      ))}
      {/* manilla */}
      <rect x="180" y="88" width="6" height="24" rx="3" fill={C.line} />
    </Base>
  )
}

/* ------------------------------------------------- Clima de precisión */
function CracPrecision() {
  return (
    <Base shadow={62}>
      <rect x="66" y="14" width="108" height="166" rx="11" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="78" y="26" width="84" height="26" rx="6" fill={C.brand} />
      <rect x="86" y="34" width="32" height="11" rx="3" fill={C.accentSoft} />
      <circle cx="152" cy="39" r="4" fill={C.on} />
      {/* serpentín */}
      <rect x="78" y="62" width="84" height="46" rx="6" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {[0, 1, 2].map((i) => (
        <line key={i} x1="84" y1={73 + i * 14} x2="156" y2={73 + i * 14} stroke={C.accent} strokeWidth="2.6" />
      ))}
      {/* ventilador */}
      <circle cx="120" cy="138" r="27" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <g fill={C.steelDark}>
        <path d="M120 138 L120 113 a25 25 0 0 1 19 11 Z" />
        <path d="M120 138 L142 152 a25 25 0 0 1 -20 11 Z" />
        <path d="M120 138 L98 152 a25 25 0 0 1 1 -24 Z" />
      </g>
      <circle cx="120" cy="138" r="5.5" fill={C.line} />
      {/* impulsión */}
      <Flow d="M84 176 v-8 M84 168 l-4 4 M84 168 l4 4" />
      <Flow d="M156 176 v-8 M156 168 l-4 4 M156 168 l4 4" />
    </Base>
  )
}

/* ------------------------------------------------------- Split / HVAC */
function SplitHvac() {
  return (
    <Base>
      {/* evaporadora */}
      <rect x="20" y="34" width="124" height="46" rx="14" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="20" y="62" width="124" height="14" rx="7" fill={C.bodyAlt} />
      <line x1="34" y1="69" x2="130" y2="69" stroke={C.steelDark} strokeWidth="1.8" />
      <rect x="96" y="44" width="34" height="9" rx="3" fill={C.accentSoft} />
      <circle cx="134" cy="48" r="3.6" fill={C.on} />
      <Flow d="M46 88 q6 12 0 22" />
      <Flow d="M78 88 q6 12 0 22" />
      <Flow d="M110 88 q6 12 0 22" />
      {/* condensadora */}
      <rect x="150" y="98" width="74" height="72" rx="10" fill={C.body} stroke={C.line} strokeWidth="2" />
      <circle cx="187" cy="134" r="25" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      <g stroke={C.steelDark} strokeWidth="2.4" fill="none">
        <circle cx="187" cy="134" r="17" />
        <circle cx="187" cy="134" r="9" />
      </g>
      <circle cx="187" cy="134" r="4" fill={C.line} />
      {/* cañería de interconexión */}
      <path d="M144 60 H166 a8 8 0 0 1 8 8 V98" fill="none" stroke={C.steelDark} strokeWidth="4" strokeLinecap="round" />
    </Base>
  )
}

/* ------------------------------------------------------- Bomba de agua */
function Bomba() {
  return (
    <Base>
      <rect x="34" y="152" width="172" height="16" rx="5" fill={C.line} />
      {/* motor */}
      <rect x="42" y="88" width="86" height="60" rx="14" fill={C.body} stroke={C.line} strokeWidth="2" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={56 + i * 16} y1="94" x2={56 + i * 16} y2="142" stroke={C.steelDark} strokeWidth="3" />
      ))}
      {/* voluta */}
      <circle cx="164" cy="118" r="38" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <circle cx="164" cy="118" r="16" fill={C.steel} stroke={C.line} strokeWidth="2" />
      <circle cx="164" cy="118" r="5" fill={C.line} />
      {/* descarga y succión */}
      <rect x="152" y="36" width="24" height="46" rx="6" fill={C.accent} />
      <rect x="146" y="28" width="36" height="12" rx="5" fill={C.brand} />
      <rect x="200" y="106" width="30" height="24" rx="6" fill={C.accent} />
      <rect x="226" y="100" width="12" height="36" rx="5" fill={C.brand} />
    </Base>
  )
}

/* ---------------------------------------------------- Banco de baterías */
function BancoBateria() {
  return (
    <Base>
      <rect x="26" y="22" width="188" height="152" rx="11" fill={C.body} stroke={C.line} strokeWidth="2" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <g key={r + '-' + c}>
            <rect x={40 + c * 42} y={44 + r * 44} width="34" height="30" rx="4" fill={C.white} stroke={C.line} strokeWidth="1.7" />
            <rect x={45 + c * 42} y={40 + r * 44} width="7" height="6" rx="2" fill={C.off} />
            <rect x={62 + c * 42} y={40 + r * 44} width="7" height="6" rx="2" fill={C.ink} />
            <line x1={40 + c * 42} y1={62 + r * 44} x2={74 + c * 42} y2={62 + r * 44} stroke={C.steel} strokeWidth="1.6" />
          </g>
        ))
      )}
      {/* puentes de interconexión */}
      {[0, 1, 2].map((r) => (
        <g key={'p' + r} stroke={C.accent} strokeWidth="2.6" strokeLinecap="round">
          <line x1="69" y1={43 + r * 44} x2="87" y2={43 + r * 44} />
          <line x1="111" y1={43 + r * 44} x2="129" y2={43 + r * 44} />
          <line x1="153" y1={43 + r * 44} x2="171" y2={43 + r * 44} />
        </g>
      ))}
    </Base>
  )
}

/* ------------------------------------------------------------ Celda MT */
function CeldaMT() {
  return (
    <Base shadow={56}>
      <rect x="66" y="14" width="108" height="166" rx="10" fill={C.body} stroke={C.line} strokeWidth="2" />
      {/* relé de protección */}
      <rect x="78" y="26" width="84" height="42" rx="6" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      <circle cx="120" cy="47" r="13" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <path d="M114 47 h12 M126 47 l-4 -3.5 M126 47 l-4 3.5" stroke={C.line} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="152" cy="34" r="3.4" fill={C.on} />
      {/* interruptor extraíble */}
      <rect x="80" y="78" width="80" height="58" rx="7" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <circle cx="120" cy="98" r="9" fill={C.line} />
      <path d="M120 107 v16" stroke={C.line} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M104 124 h32" stroke={C.line} strokeWidth="3.4" strokeLinecap="round" />
      <rect x="92" y="127" width="56" height="5" rx="2.5" fill={C.steel} />
      {/* señalización */}
      <rect x="78" y="146" width="84" height="9" rx="4.5" fill={C.warn} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={94 + i * 26} cy="168" r="7.5" fill="#fde68a" stroke={C.line} strokeWidth="1.8" />
      ))}
    </Base>
  )
}

/* --------------------------------------------------- Transformador MT */
function TransformadorMT() {
  return (
    <Base>
      {/* aletas de refrigeración */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={'l' + i} x="36" y={70 + i * 22} width="22" height="15" rx="4" fill={C.bodyAlt} stroke={C.line} strokeWidth="1.6" />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <rect key={'r' + i} x="182" y={70 + i * 22} width="22" height="15" rx="4" fill={C.bodyAlt} stroke={C.line} strokeWidth="1.6" />
      ))}
      {/* cuba */}
      <rect x="56" y="60" width="128" height="104" rx="10" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="70" y="132" width="100" height="8" rx="4" fill={C.steel} />
      <rect x="70" y="148" width="46" height="6" rx="3" fill={C.steel} />
      {/* bushings AT */}
      {[0, 1, 2].map((i) => (
        <g key={'at' + i}>
          <rect x={76 + i * 24} y="40" width="8" height="22" rx="3" fill={C.steelDark} />
          <circle cx={80 + i * 24} cy="34" r="8.5" fill="#fca5a5" stroke={C.line} strokeWidth="1.8" />
        </g>
      ))}
      {/* bushings BT */}
      {[0, 1, 2, 3].map((i) => (
        <g key={'bt' + i}>
          <rect x={150 + i * 11} y="46" width="5" height="16" rx="2" fill={C.steelDark} />
          <circle cx={152 + i * 11} cy="43" r="5" fill={C.brand} />
        </g>
      ))}
      <rect x="82" y="72" width="46" height="6" rx="3" fill={C.accentSoft} />
    </Base>
  )
}

/* ------------------------------------------------ Torre de enfriamiento */
function TorreEnfriamiento() {
  return (
    <Base shadow={70}>
      <path d="M56 62 L184 62 L164 172 L76 172 Z" fill={C.body} stroke={C.line} strokeWidth="2" strokeLinejoin="round" />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={80 + i * 2} y1={148 - i * 20} x2={160 - i * 2} y2={148 - i * 20} stroke={C.steel} strokeWidth="4" strokeLinecap="round" />
      ))}
      {/* plenum superior */}
      <ellipse cx="120" cy="58" rx="66" ry="13" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <ellipse cx="120" cy="58" rx="42" ry="8" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      <g stroke={C.steelDark} strokeWidth="2.4" strokeLinecap="round">
        <line x1="86" y1="58" x2="154" y2="58" />
        <line x1="120" y1="50" x2="120" y2="66" />
        <line x1="96" y1="53" x2="144" y2="63" />
        <line x1="96" y1="63" x2="144" y2="53" />
      </g>
      <circle cx="120" cy="58" r="5" fill={C.line} />
      {/* aire de salida */}
      <Flow d="M98 36 v-14 M98 22 l-4 4 M98 22 l4 4" />
      <Flow d="M142 36 v-14 M142 22 l-4 4 M142 22 l4 4" />
      {/* agua */}
      <rect x="70" y="168" width="100" height="10" rx="5" fill={C.accent} />
    </Base>
  )
}

/* ------------------------------------------------------------- Chiller */
function Chiller() {
  return (
    <Base>
      <rect x="22" y="46" width="196" height="106" rx="11" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="34" y="152" width="26" height="12" rx="4" fill={C.ink} />
      <rect x="180" y="152" width="26" height="12" rx="4" fill={C.ink} />
      {/* condensador */}
      <rect x="34" y="58" width="94" height="82" rx="7" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {[...Array(8)].map((_, i) => (
        <line key={i} x1={42 + i * 11} y1="66" x2={42 + i * 11} y2="132" stroke={C.steelDark} strokeWidth="2.2" />
      ))}
      {/* compresores */}
      <circle cx="156" cy="82" r="20" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <circle cx="156" cy="82" r="8" fill={C.steel} />
      <circle cx="196" cy="82" r="20" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <circle cx="196" cy="82" r="8" fill={C.steel} />
      {/* circuito hidráulico */}
      <rect x="140" y="114" width="72" height="10" rx="5" fill={C.accent} />
      <rect x="140" y="130" width="72" height="10" rx="5" fill={C.accentSoft} />
    </Base>
  )
}

/* -------------------------------------------------- AHC / manejadora */
function AHC() {
  return (
    <Base>
      <rect x="22" y="42" width="196" height="112" rx="11" fill={C.body} stroke={C.line} strokeWidth="2" />
      {/* sección de filtros */}
      <rect x="34" y="54" width="44" height="88" rx="6" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      <path d="M34 54 L78 142 M50 54 L78 110 M66 54 L78 78 M34 78 L60 142 M34 110 L44 142"
        stroke={C.steel} strokeWidth="1.8" fill="none" />
      {/* serpentín */}
      <rect x="88" y="54" width="52" height="88" rx="6" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="95" y1={66 + i * 17} x2="133" y2={66 + i * 17} stroke={C.accent} strokeWidth="2.6" />
      ))}
      {/* ventilador */}
      <circle cx="178" cy="98" r="30" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <g fill={C.steelDark}>
        <path d="M178 98 L178 70 a28 28 0 0 1 21 12 Z" />
        <path d="M178 98 L202 114 a28 28 0 0 1 -22 12 Z" />
        <path d="M178 98 L154 114 a28 28 0 0 1 1 -27 Z" />
      </g>
      <circle cx="178" cy="98" r="6" fill={C.line} />
      {/* flujo */}
      <Flow d="M8 76 h12 M20 76 l-5 -4 M20 76 l-5 4" />
      <Flow d="M8 120 h12 M20 120 l-5 -4 M20 120 l-5 4" />
      <Flow d="M220 98 h12 M232 98 l-5 -4 M232 98 l-5 4" />
    </Base>
  )
}

/* ----------------------------------------------------- ACU / unidad A/A */
function ACU() {
  return (
    <Base shadow={72}>
      <rect x="42" y="40" width="156" height="124" rx="12" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="54" y="52" width="132" height="70" rx="8" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {/* rejilla del ventilador */}
      <circle cx="120" cy="87" r="30" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <g stroke={C.steelDark} strokeWidth="2.4" fill="none">
        <circle cx="120" cy="87" r="22" />
        <circle cx="120" cy="87" r="14" />
        <circle cx="120" cy="87" r="7" />
      </g>
      <circle cx="120" cy="87" r="3.4" fill={C.line} />
      {/* condensador inferior */}
      <rect x="54" y="130" width="132" height="24" rx="6" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {[...Array(11)].map((_, i) => (
        <line key={i} x1={62 + i * 12} y1="136" x2={62 + i * 12} y2="148" stroke={C.steelDark} strokeWidth="2.2" />
      ))}
      {/* cañerías */}
      <rect x="198" y="70" width="26" height="9" rx="4.5" fill={C.accent} />
      <rect x="198" y="86" width="26" height="9" rx="4.5" fill={C.accentSoft} />
      <circle cx="176" cy="60" r="3.6" fill={C.on} />
    </Base>
  )
}

/* ---------------------------------------------- Estanque de combustible */
function EstanqueCombustible() {
  return (
    <Base>
      {/* silletas */}
      <rect x="54" y="152" width="34" height="18" rx="4" fill={C.line} />
      <rect x="152" y="152" width="34" height="18" rx="4" fill={C.line} />
      {/* cuerpo cilíndrico */}
      <rect x="34" y="62" width="172" height="92" rx="46" fill={C.body} stroke={C.line} strokeWidth="2" />
      <ellipse cx="62" cy="108" rx="17" ry="45" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      {/* nivel de combustible */}
      <path d="M78 130 h112 a30 30 0 0 1 -14 22 H88 a30 30 0 0 1 -10 -22 Z" fill={C.warn} opacity="0.55" />
      {/* boca de llenado */}
      <rect x="112" y="42" width="20" height="22" rx="5" fill={C.steelDark} />
      <rect x="104" y="34" width="36" height="12" rx="5" fill={C.brand} />
      {/* indicador de nivel */}
      <circle cx="168" cy="94" r="15" fill={C.white} stroke={C.line} strokeWidth="2" />
      <path d="M168 94 L177 86" stroke={C.off} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="168" cy="94" r="2.6" fill={C.line} />
      {/* venteo */}
      <rect x="182" y="46" width="7" height="20" rx="3" fill={C.steelDark} />
      <path d="M186 46 q9 -6 15 0" fill="none" stroke={C.steelDark} strokeWidth="4" strokeLinecap="round" />
    </Base>
  )
}

/* -------------------------------------------------------- Alcantarillado */
function Alcantarilla() {
  return (
    <Base shadow={74}>
      {/* cámara */}
      <ellipse cx="120" cy="74" rx="72" ry="26" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <path d="M48 74 V132 a72 26 0 0 0 144 0 V74" fill={C.body} stroke={C.line} strokeWidth="2" />
      <ellipse cx="120" cy="74" rx="52" ry="18" fill={C.white} stroke={C.steel} strokeWidth="1.6" />
      {/* tapa con patrón */}
      <g stroke={C.steelDark} strokeWidth="2" strokeLinecap="round">
        <line x1="82" y1="74" x2="158" y2="74" />
        <line x1="120" y1="58" x2="120" y2="90" />
        <line x1="92" y1="64" x2="148" y2="84" />
        <line x1="92" y1="84" x2="148" y2="64" />
      </g>
      {/* ductos */}
      <rect x="12" y="112" width="44" height="26" rx="8" fill={C.steel} stroke={C.line} strokeWidth="2" />
      <rect x="184" y="112" width="44" height="26" rx="8" fill={C.steel} stroke={C.line} strokeWidth="2" />
      {/* flujo */}
      <Flow d="M22 125 h20 M42 125 l-5 -4 M42 125 l-5 4" />
      <Flow d="M196 125 h20 M216 125 l-5 -4 M216 125 l-5 4" />
    </Base>
  )
}

/* -------------------------------------------------------------- Ascensor */
function Ascensor() {
  return (
    <Base shadow={60}>
      {/* ducto */}
      <rect x="60" y="12" width="120" height="168" rx="10" fill={C.body} stroke={C.line} strokeWidth="2" />
      {/* poleas y cables */}
      <circle cx="120" cy="30" r="11" fill={C.bodyAlt} stroke={C.line} strokeWidth="2" />
      <circle cx="120" cy="30" r="3.4" fill={C.line} />
      <line x1="104" y1="34" x2="104" y2="72" stroke={C.steelDark} strokeWidth="2.4" />
      <line x1="136" y1="34" x2="136" y2="58" stroke={C.steelDark} strokeWidth="2.4" />
      {/* contrapeso */}
      <rect x="128" y="58" width="18" height="46" rx="4" fill={C.steelDark} />
      {/* cabina */}
      <rect x="72" y="72" width="64" height="82" rx="7" fill={C.white} stroke={C.line} strokeWidth="2" />
      <line x1="104" y1="78" x2="104" y2="148" stroke={C.steel} strokeWidth="2" />
      <rect x="80" y="80" width="18" height="26" rx="3" fill={C.glass} />
      <rect x="110" y="80" width="18" height="26" rx="3" fill={C.glass} />
      <circle cx="99" cy="118" r="2.6" fill={C.line} />
      <circle cx="109" cy="118" r="2.6" fill={C.line} />
      {/* guías */}
      <rect x="62" y="60" width="7" height="112" rx="3" fill={C.steel} />
      <rect x="171" y="60" width="7" height="112" rx="3" fill={C.steel} />
      {/* botonera de piso */}
      <rect x="188" y="86" width="16" height="26" rx="4" fill={C.brand} />
      <circle cx="196" cy="94" r="3" fill={C.on} />
      <circle cx="196" cy="104" r="3" fill={C.accentSoft} />
    </Base>
  )
}

/* ------------------------------------------------- Instalación física */
function InstalacionFisica() {
  return (
    <Base>
      {/* techo */}
      <path d="M22 78 L120 20 L218 78 Z" fill={C.brand} stroke={C.brand} strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 20 L218 78 L196 78 L120 33 Z" fill={C.ink} opacity="0.18" />
      {/* cuerpo */}
      <rect x="44" y="78" width="152" height="96" rx="7" fill={C.body} stroke={C.line} strokeWidth="2" />
      {/* ventanas */}
      {[0, 1, 2].map((c) =>
        [0, 1].map((r) => (
          <rect key={c + '-' + r} x={58 + c * 46} y={92 + r * 34} width="30" height="24" rx="3"
            fill={C.glass} stroke={C.steel} strokeWidth="1.6" />
        ))
      )}
      {/* puerta */}
      <rect x="104" y="140" width="34" height="34" rx="4" fill={C.accent} />
      <circle cx="131" cy="158" r="2.8" fill={C.warn} />
      {/* zócalo */}
      <rect x="36" y="172" width="168" height="8" rx="4" fill={C.line} />
    </Base>
  )
}

/* -------------------------------------------------- Sistema de monitoreo */
function SistemaMonitoreo() {
  return (
    <Base>
      {/* monitor */}
      <rect x="20" y="26" width="150" height="104" rx="10" fill={C.ink} />
      <rect x="29" y="35" width="132" height="86" rx="5" fill="#1e293b" />
      <polyline points="38,102 60,80 78,90 100,58 122,74 144,50" fill="none" stroke={C.on} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="38,112 60,106 78,109 100,96 122,101 144,88" fill="none" stroke={C.warn} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="144" cy="50" r="4.2" fill={C.on} />
      <rect x="80" y="130" width="30" height="14" rx="3" fill={C.steel} />
      <rect x="58" y="144" width="74" height="7" rx="3.5" fill={C.steelDark} />
      {/* rack NMS */}
      <rect x="182" y="40" width="52" height="112" rx="8" fill={C.body} stroke={C.line} strokeWidth="2" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x="190" y={50 + i * 20} width="36" height="14" rx="3" fill={C.white} stroke={C.steel} strokeWidth="1.4" />
          <circle cx="197" cy={57 + i * 20} r="3.2" fill={i === 2 ? C.off : C.on} />
          <rect x="204" y={55 + i * 20} width="16" height="3.5" rx="1.75" fill={C.steel} />
        </g>
      ))}
      {/* enlace */}
      <path d="M170 88 h12" stroke={C.accent} strokeWidth="2.6" strokeDasharray="4 3" strokeLinecap="round" />
    </Base>
  )
}

/* ------------------------------------------------------------- Extintor */
function Extintor() {
  return (
    <Base shadow={44}>
      {/* manguera */}
      <path d="M148 52 C 184 62, 188 116, 168 150" fill="none" stroke={C.line} strokeWidth="6" strokeLinecap="round" />
      <path d="M168 150 l -8 22 l 22 0 z" fill={C.line} />
      {/* cuerpo */}
      <rect x="86" y="66" width="68" height="112" rx="18" fill="#dc2626" />
      <path d="M86 100 h68 v44 h-68 z" fill={C.ink} opacity="0.10" />
      <rect x="86" y="66" width="68" height="112" rx="18" fill="none" stroke={C.line} strokeWidth="2" />
      {/* etiqueta */}
      <rect x="96" y="100" width="48" height="44" rx="5" fill="#fef2f2" stroke={C.line} strokeWidth="1.6" />
      <rect x="103" y="110" width="34" height="4.5" rx="2.25" fill={C.steelDark} />
      <rect x="103" y="121" width="34" height="4.5" rx="2.25" fill={C.steelDark} />
      <rect x="103" y="132" width="21" height="4.5" rx="2.25" fill={C.steelDark} />
      {/* cuello y válvula */}
      <rect x="106" y="48" width="28" height="20" rx="4" fill={C.steel} stroke={C.line} strokeWidth="2" />
      <rect x="94" y="28" width="52" height="22" rx="6" fill={C.line} />
      <rect x="90" y="16" width="64" height="9" rx="4.5" fill={C.line} />
      {/* pasador */}
      <circle cx="154" cy="21" r="7" fill="none" stroke={C.warn} strokeWidth="3.4" />
      {/* manómetro */}
      <path d="M88 42 H78" stroke={C.line} strokeWidth="5" strokeLinecap="round" />
      <circle cx="66" cy="42" r="15" fill={C.white} stroke={C.line} strokeWidth="2.4" />
      <path d="M66 42 L75 33" stroke={C.on} strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="66" cy="42" r="2.8" fill={C.line} />
    </Base>
  )
}

/* -------------------------------------------------------------- Genérico */
function Generic() {
  return (
    <Base shadow={62}>
      <rect x="56" y="30" width="128" height="140" rx="11" fill={C.body} stroke={C.line} strokeWidth="2" />
      <rect x="70" y="44" width="100" height="24" rx="6" fill={C.brand} />
      <circle cx="156" cy="56" r="4" fill={C.on} />
      <rect x="70" y="82" width="100" height="11" rx="5.5" fill={C.bodyAlt} />
      <rect x="70" y="102" width="68" height="11" rx="5.5" fill={C.bodyAlt} />
      <rect x="70" y="122" width="84" height="11" rx="5.5" fill={C.bodyAlt} />
      <rect x="70" y="146" width="100" height="8" rx="4" fill={C.steel} />
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
