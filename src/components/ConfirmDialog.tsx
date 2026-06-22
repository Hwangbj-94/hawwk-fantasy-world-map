import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = '취소',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="modal-panel confirm-panel"
        role="dialog"
      >
        <h2 id="confirm-dialog-title">{title}</h2>
        <div className="modal-copy">{children}</div>
        <div className="modal-actions">
          <button className="button ghost" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="button primary" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
