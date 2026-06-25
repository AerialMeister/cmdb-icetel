import { IconX } from './Icons.jsx'

export default function Modal({ title, onClose, children, footer, size }) {
  const cls = 'modal' + (size === 'sm' ? ' modal-sm' : size === 'lg' ? ' modal-lg' : '')
  return (
    <div className="modal-overlay">
      <div className={cls} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn-ghost" onClick={onClose} aria-label="Cerrar"><IconX width={20} height={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
