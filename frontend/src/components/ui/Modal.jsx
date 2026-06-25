const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function Modal({ open, onClose, title, children, size = 'lg' }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal-panel ${SIZES[size] || SIZES.lg}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
