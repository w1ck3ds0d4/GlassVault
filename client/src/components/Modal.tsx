import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  type?: "info" | "success" | "error" | "warning";
}

export default function Modal({ open, onClose, title, children, type = "info" }: ModalProps) {
  useEffect(() => {
    if (open) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header modal-${type}`}>
          <h3>{title || (type === "error" ? "Error" : type === "success" ? "Success" : "Notice")}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}

// Hook for easy usage
interface ModalState {
  open: boolean;
  title: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export function useModal() {
  const [state, setState] = React.useState<ModalState>({
    open: false, title: "", message: "", type: "info",
  });

  const showModal = (message: string, type: ModalState["type"] = "info", title?: string) => {
    setState({ open: true, message, type, title: title || "" });
  };

  const closeModal = () => setState((s) => ({ ...s, open: false }));

  const ModalComponent = () => (
    <Modal open={state.open} onClose={closeModal} title={state.title} type={state.type}>
      <p>{state.message}</p>
    </Modal>
  );

  return { showModal, closeModal, ModalComponent };
}
