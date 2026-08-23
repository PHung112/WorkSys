import Modal from "./Modal";

/**
 * Generic reusable confirm dialog.
 * Props: title, message, confirmLabel, danger, onConfirm, onClose
 */
export default function ConfirmModal({
  title = "Xác nhận",
  message,
  confirmLabel = "Xác nhận",
  danger = true,
  onConfirm,
  onClose,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-white/65 text-sm leading-relaxed mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-white/15 rounded-xl text-white/55 hover:text-white text-sm transition"
        >
          Hủy
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            danger
              ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/35 hover:text-red-300"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
