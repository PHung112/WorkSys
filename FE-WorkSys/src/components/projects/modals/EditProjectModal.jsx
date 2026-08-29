import Modal from "../../common/Modal";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../../common/formStyles";

export default function EditProjectModal({ projectForm, setProjectForm, onSubmit, onClose, formError }) {
  return (
    <Modal title="Chỉnh sửa dự án" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Tên dự án *</label>
          <input
            value={projectForm.name}
            onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Mô tả</label>
          <textarea
            value={projectForm.description}
            onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
            className={`${inputCls} h-24 resize-none`}
          />
        </div>
        {formError && <p className="text-red-400 text-xs">{formError}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={btnSecondary}>Hủy</button>
          <button type="submit" className={btnPrimary}>Lưu thay đổi</button>
        </div>
      </form>
    </Modal>
  );
}
