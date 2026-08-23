import Modal from "../../common/Modal";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../../common/formStyles";

const tomorrow = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
})();

export default function EditTaskModal({ taskForm, setTaskForm, onSubmit, onClose, formError }) {
  return (
    <Modal title="Chỉnh sửa task" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Tiêu đề *</label>
          <input
            value={taskForm.title}
            onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Mô tả</label>
          <textarea
            value={taskForm.description}
            onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))}
            className={`${inputCls} h-20 resize-none`}
          />
        </div>
        <div>
          <label className={labelCls}>Deadline <span className="text-white/30">(tùy chọn — tối thiểu ngày mai)</span></label>
          <div className="relative">
            <input
              type="date"
              value={taskForm.deadline}
              min={tomorrow}
              onChange={(e) => setTaskForm((p) => ({ ...p, deadline: e.target.value }))}
              onClick={(e) => e.target.showPicker()}
              className={`${inputCls} [&::-webkit-calendar-picker-indicator]:opacity-0 cursor-pointer`}
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">calendar_month</span>
          </div>
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
