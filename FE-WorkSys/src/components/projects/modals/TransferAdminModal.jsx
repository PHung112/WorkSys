import Modal from "../../common/Modal";
import { inputCls, labelCls, btnSecondary } from "../../common/formStyles";

export default function TransferAdminModal({
  members, currentUserId, transferTarget, setTransferTarget,
  onSubmit, onClose, formError,
}) {
  return (
    <Modal title="Chuyển nhượng quyền Admin" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-white/55 text-sm">
          Bạn cần chọn một thành viên để chuyển quyền{" "}
          <strong className="text-yellow-300">ADMIN</strong> trước khi thoát.
        </p>
        <div>
          <label className={labelCls}>Chuyển quyền Admin cho</label>
          <select
            value={transferTarget}
            onChange={(e) => setTransferTarget(e.target.value)}
            className={`${inputCls} bg-slate-700`}
            required
          >
            <option value="">-- Chọn thành viên --</option>
            {members
              .filter((m) => m.userId !== currentUserId)
              .map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.username} ({m.role})
                </option>
              ))}
          </select>
        </div>
        {formError && <p className="text-red-400 text-xs">{formError}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={btnSecondary}>Hủy</button>
          <button
            type="submit"
            disabled={!transferTarget}
            className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-40 rounded-xl font-medium text-sm transition"
          >
            Chuyển quyền & Thoát
          </button>
        </div>
      </form>
    </Modal>
  );
}
