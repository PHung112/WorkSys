import Modal from "../../common/Modal";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../../common/formStyles";

export default function CreateProjectModal({ projectForm, setProjectForm, onSubmit, onClose, formError }) {
  return (
    <Modal title="Tạo dự án mới" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Tên dự án *</label>
          <input
            value={projectForm.name}
            onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Tên dự án..."
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Mô tả</label>
          <textarea
            value={projectForm.description}
            onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Mô tả dự án..."
            className={`${inputCls} h-24 resize-none`}
          />
        </div>
        {formError && <p className="text-error font-body-sm text-body-sm mt-1">{formError}</p>}
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className={btnSecondary}>Hủy</button>
          <button type="submit" className={btnPrimary}>Tạo dự án</button>
        </div>
      </form>
    </Modal>
  );
}
