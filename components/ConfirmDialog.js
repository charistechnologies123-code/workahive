import { useState } from "react";

export function useConfirmDialog() {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    tone: "danger",
    onConfirm: null,
  });

  const confirm = ({ title, message, confirmText = "Confirm", tone = "danger", onConfirm }) => {
    setState({
      open: true,
      title,
      message,
      confirmText,
      tone,
      onConfirm: typeof onConfirm === "function" ? onConfirm : null,
    });
  };

  const close = () => {
    setState((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const handleConfirm = async () => {
    try {
      if (state.onConfirm) {
        await state.onConfirm();
      }
    } finally {
      close();
    }
  };

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      tone={state.tone}
      onClose={close}
      onConfirm={handleConfirm}
    />
  );

  return { confirm, dialog, close };
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger",
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="confirm-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="confirm-dialog-head">
          <h3>{title || "Please confirm"}</h3>
          <p>{message}</p>
        </div>

        <div className="confirm-dialog-actions">
          <button type="button" className="btn-soft" onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={tone === "danger" ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
