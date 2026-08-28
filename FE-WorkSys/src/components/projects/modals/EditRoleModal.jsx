import Modal from "../../common/Modal";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../../common/formStyles";

// Modal thay đổi vai trò (phân quyền) cho thành viên trong dự án.
// Cho phép Admin thay đổi vai trò thành viên sang MEMBER hoặc MANAGER,
// hoặc Manager nâng cấp thành viên lên MANAGER.
export default function EditRoleModal({ roleForm, setRoleForm, onSubmit, onClose, formError }) {
  return (
    <Modal title="Phân quyền thành viên" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Chọn vai trò mới</label>
          <select
            value={roleForm.role}
            onChange={(e) => setRoleForm({ role: e.target.value })}
            className={`${inputCls} bg-surface-container-high cursor-pointer`}
          >
            <option value="MEMBER">MEMBER (Thành viên thực thi)</option>
            <option value="MANAGER">MANAGER (Quản lý dự án)</option>
          </select>
          <div className="mt-2.5 p-2.5 bg-surface-container-highest rounded-lg border border-outline-variant/10 text-xs text-on-surface-variant flex flex-col gap-1">
            <span className="font-semibold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">info</span>
              Quyền hạn của Manager:
            </span>
            <span>• Tạo và giao task cho thành viên</span>
            <span>• Mời thành viên mới vào dự án</span>
            <span>• Sử dụng Trợ lý Ảo AI để phân tích tiến độ</span>
          </div>
        </div>
        {formError && <p className="text-error text-xs font-medium">{formError}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Hủy</button>
          <button type="submit" className={btnPrimary}>Cập nhật vai trò</button>
        </div>
      </form>
    </Modal>
  );
}
