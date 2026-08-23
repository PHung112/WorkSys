import Modal from "../../common/Modal";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../../common/formStyles";

const tomorrow = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
})();

export default function CreateTaskModal({ taskForm, setTaskForm, members, onSubmit, onClose, formError }) {
  return (
    <Modal title="Tạo task mới" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Tiêu đề *</label>
          <input
            value={taskForm.title}
            onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Tiêu đề task..."
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Mô tả</label>
          <textarea
            value={taskForm.description}
            onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Mô tả chi tiết..."
            className={`${inputCls} h-20 resize-none`}
          />
        </div>
        <div>
          <label className={labelCls}>Giao cho (chọn ít nhất 1 người) *</label>
          <div className="mt-2 max-h-40 overflow-y-auto space-y-2 border border-outline-variant/20 rounded-xl p-3 bg-surface-container-lowest">
            {members.map((m) => {
              const isChecked = taskForm.assignedToIds?.includes(m.userId);
              return (
                <label key={m.userId} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant/50 group-hover:border-primary/50'}`}>
                    {isChecked && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isChecked}
                    onChange={(e) => {
                      setTaskForm((p) => {
                        const newIds = e.target.checked
                          ? [...(p.assignedToIds || []), m.userId]
                          : (p.assignedToIds || []).filter(id => id !== m.userId);
                        return { ...p, assignedToIds: newIds };
                      });
                    }}
                  />
                  <span className="text-on-surface text-sm">{m.username}</span>
                </label>
              );
            })}
          </div>
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
          <button type="submit" className={btnPrimary}>Tạo task</button>
        </div>
      </form>
    </Modal>
  );
}
