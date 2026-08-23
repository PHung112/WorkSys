import Modal from "../../common/Modal";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../../common/formStyles";

export default function EditRoleModal({ roleForm, setRoleForm, onSubmit, onClose, formError }) {
  return (
    <Modal title="Thay đổi vai trò" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Vai trò mới</label>
          <select
            value={roleForm.role}
            onChange={(e) => setRoleForm({ role: e.target.value })}
            className={`${inputCls} bg-slate-700`}
          >
            <option value="MEMBER">MEMBER</option>
            <option value="MANAGER">MANAGER</option>
          </select>
        </div>
        {formError && <p className="text-red-400 text-xs">{formError}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={btnSecondary}>Hủy</button>
          <button type="submit" className={btnPrimary}>Cập nhật</button>
        </div>
      </form>
    </Modal>
  );
}
