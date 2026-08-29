import { useState } from "react";
import Modal from "../../common/Modal";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../../common/formStyles";

// Lấy ngày hiện tại định dạng YYYY-MM-DD theo giờ địa phương làm mốc tối thiểu cho deadline
const today = (() => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
})();

export default function CreateTaskModal({ taskForm, setTaskForm, members, onSubmit, onClose, formError }) {
  const [searchMember, setSearchMember] = useState("");

  // Lọc thành viên theo tên đăng nhập hoặc email khi người dùng gõ tìm kiếm
  const filteredMembers = members.filter((m) => {
    const q = searchMember.toLowerCase().trim();
    if (!q) return true;
    return (
      m.username?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

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

        {/* Đính kèm file mô tả chi tiết nhiệm vụ */}
        <div>
          <label className={labelCls}>File đính kèm mô tả / chi tiết task <span className="text-white/30">(tùy chọn)</span></label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-center gap-2 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-xl cursor-pointer transition text-xs font-medium">
              <span className="material-symbols-outlined text-[18px] text-primary">upload_file</span>
              <span>{taskForm.file ? "Thay đổi file đính kèm" : "Chọn file đính kèm chi tiết task"}</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setTaskForm((p) => ({ ...p, file }));
                }}
              />
            </label>
            {taskForm.file && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl text-xs text-on-surface">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0">description</span>
                <span className="truncate flex-1 font-mono">{taskForm.file.name}</span>
                <span className="text-on-surface-variant text-[11px] shrink-0">
                  ({(taskForm.file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => setTaskForm((p) => ({ ...p, file: null }))}
                  className="text-on-surface-variant hover:text-error transition p-1 cursor-pointer"
                  title="Xóa file đính kèm"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls + " !mb-0"}>Giao cho (chọn ít nhất 1 người) *</label>
            <span className="text-xs text-on-surface-variant">
              Đã chọn: <strong className="text-primary">{taskForm.assignedToIds?.length || 0}</strong>
            </span>
          </div>

          {/* Ô tìm kiếm tên thành viên */}
          <div className="relative mb-2">
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-8 pr-7 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition"
            />
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none">
              search
            </span>
            {searchMember && (
              <button
                type="button"
                onClick={() => setSearchMember("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-[14px] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1 border border-outline-variant/20 rounded-xl p-2 bg-surface-container-lowest">
            {filteredMembers.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic py-3 text-center">
                Không tìm thấy thành viên phù hợp
              </p>
            ) : (
              filteredMembers.map((m) => {
                const isChecked = taskForm.assignedToIds?.includes(m.userId);
                return (
                  <label key={m.userId} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface-container-high/60 cursor-pointer group transition">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant/50 group-hover:border-primary/50'}`}>
                      {isChecked && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
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
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {m.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-on-surface text-xs font-medium leading-tight truncate">{m.username}</span>
                      {m.email && <span className="text-[10px] text-on-surface-variant truncate">{m.email}</span>}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div>
          <label className={labelCls}>Deadline <span className="text-white/30">(tùy chọn)</span></label>
          <div className="relative">
            <input
              type="date"
              value={taskForm.deadline}
              min={today}
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
