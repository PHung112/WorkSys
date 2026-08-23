import Modal from "../../common/Modal";
import { btnSecondary } from "../../common/formStyles";

export default function ConfirmLeaveModal({ projectName, onConfirm, onClose }) {
  return (
    <Modal title="Xác nhận thoát dự án" onClose={onClose}>
      <p className="text-white/55 text-sm mb-6">
        Bạn có chắc muốn thoát khỏi dự án{" "}
        <strong className="text-white">{projectName}</strong>? Bạn sẽ không thể xem dự án này nữa.
      </p>
      <div className="flex gap-3">
        <button onClick={onClose} className={btnSecondary}>Hủy</button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl font-medium text-sm transition"
        >
          Thoát dự án
        </button>
      </div>
    </Modal>
  );
}
