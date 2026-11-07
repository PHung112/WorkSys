import { btnPrimary, btnSecondary, inputCls, labelCls } from "../common/formStyles";

export default function CreateProjectView({ projectForm, setProjectForm, onSubmit, onCancel, formError }) {
  return (
    <div className="flex-1 flex flex-col bg-surface-container-lowest h-full">
      {/* Header */}
      <div className="px-stack-lg py-5 border-b border-surface-container-highest bg-surface-container-lowest flex items-center shrink-0">
        <div>
          <h2 className="font-display text-2xl font-bold text-on-background tracking-tight">
            Tạo dự án mới
          </h2>
          <p className="text-sm font-body-sm text-on-surface-variant mt-1">
            Thiết lập một dự án không gian làm việc mới cho nhóm của bạn.
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-stack-lg custom-scrollbar flex justify-center">
        <div className="w-full max-w-2xl mt-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-6 bg-surface-container p-6 rounded-2xl border border-outline-variant/20 shadow-sm">
            <div>
              <label className={labelCls}>Tên dự án *</label>
              <input
                value={projectForm.name}
                onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ví dụ: Dự án phát triển Website..."
                className={inputCls}
                required
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls}>Mô tả</label>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Mô tả mục tiêu, phạm vi và thông tin chung của dự án..."
                className={`${inputCls} h-32 resize-none`}
              />
            </div>
            
            {formError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-start gap-2 text-error">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <p className="font-body-sm text-sm">{formError}</p>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-surface-container-highest mt-2">
              <button type="button" onClick={onCancel} className={btnSecondary}>
                Hủy
              </button>
              <button type="submit" className={btnPrimary}>
                Tạo dự án
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
