// Íconos de línea reutilizables (heroicons-style), 24x24, currentColor.
const S = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const IconRayo = (p) => (<svg {...S} {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>)
export const IconClima = (p) => (<svg {...S} {...p}><rect x="2" y="4" width="20" height="9" rx="2"/><path d="M6 17v2M10 17v3M14 17v2M18 17v3"/></svg>)
export const IconEdificio = (p) => (<svg {...S} {...p}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M10 21v-4h4v4"/></svg>)
export const IconSistema = (p) => (<svg {...S} {...p}><rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/><path d="M7 7h.01M7 17h.01"/></svg>)
export const IconPlus = (p) => (<svg {...S} {...p}><path d="M12 5v14M5 12h14"/></svg>)
export const IconEdit = (p) => (<svg {...S} {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>)
export const IconTrash = (p) => (<svg {...S} {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>)
export const IconKey = (p) => (<svg {...S} {...p}><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 21 2M16 7l3 3M18 5l3 3"/></svg>)
export const IconUsers = (p) => (<svg {...S} {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3 3 0 0 1 0 6M21 20c0-2.5-1.4-4.6-3.5-5.5"/></svg>)
export const IconLogout = (p) => (<svg {...S} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>)
export const IconBack = (p) => (<svg {...S} {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>)
export const IconChip = (p) => (<svg {...S} {...p}><rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 1v3M12 1v3M15 1v3M9 20v3M12 20v3M15 20v3M1 9h3M1 12h3M1 15h3M20 9h3M20 12h3M20 15h3"/></svg>)
export const IconSearch = (p) => (<svg {...S} {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>)
export const IconX = (p) => (<svg {...S} {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>)

export const systemIcon = (key, props) => {
  switch (key) {
    case 'rayo': return <IconRayo {...props} />
    case 'clima': return <IconClima {...props} />
    case 'edificio': return <IconEdificio {...props} />
    default: return <IconSistema {...props} />
  }
}
