import { useRef, useState, useEffect } from "react";
import Modal from "../../common/Modal";
import TimePicker from "../../common/TimePicker";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../../common/formStyles";

// Lấy ngày hiện tại định dạng YYYY-MM-DD theo giờ địa phương làm mốc tối thiểu cho deadline
const today = (() => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
})();

export default function EditTaskModal({ taskForm, setTaskForm, onSubmit, onClose, formError }) {
  const dateInputRef = useRef(null);

  // Tách ngày và giờ từ taskForm.deadline nếu có
  const initialDate = taskForm.deadline ? taskForm.deadline.split("T")[0] : "";
  const initialTime = taskForm.deadline && taskForm.deadline.includes("T")
    ? taskForm.deadline.split("T")[1].slice(0, 5)
    : "23:59";

  const [dateVal, setDateVal] = useState(initialDate);
  const [timeVal, setTimeVal] = useState(initialTime);

  // Đồng bộ ngày và giờ vào taskForm.deadline
  useEffect(() => {
    if (dateVal) {
      setTaskForm((p) => ({ ...p, deadline: `${dateVal}T${timeVal || "23:59"}:00` }));
    } else {
      setTaskForm((p) => ({ ...p, deadline: "" }));
    }
  }, [dateVal, timeVal, setTaskForm]);

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
          <label className={labelCls}>Deadline <span className="text-white/30">(tùy chọn)</span></label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={dateInputRef}
                type="date"
                value={dateVal}
                min={today}
                onChange={(e) => setDateVal(e.target.value)}
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1 flex items-center justify-center"
                title="Mở lịch chọn ngày"
              >
                calendar_month
              </button>
            </div>
            <TimePicker value={timeVal} onChange={setTimeVal} />
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
