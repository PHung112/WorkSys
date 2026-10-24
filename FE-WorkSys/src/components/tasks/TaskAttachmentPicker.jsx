import { labelCls } from "../common/formStyles";

/**
 * Component tải lên file tài liệu đính kèm cho nhiệm vụ
 */
export default function TaskAttachmentPicker({ file, setFile }) {
  return (
    <div>
      <label className={labelCls}>
        File đính kèm <span className="text-on-surface-variant/50 font-normal">(tùy chọn)</span>
      </label>
      <div className="flex flex-col gap-2">
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/30 hover:border-primary/50 bg-surface-container-lowest/40 hover:bg-surface-container-high/40 rounded-xl p-5 cursor-pointer transition group">
          <span className="material-symbols-outlined text-[32px] text-primary group-hover:scale-110 transition-transform mb-1">
            upload_file
          </span>
          <span className="text-xs font-semibold text-on-surface">
            {file ? "Chọn file khác để thay thế" : "Nhấp để tải lên file tài liệu đính kèm"}
          </span>
          <span className="text-[11px] text-on-surface-variant/70 mt-0.5">
            Hỗ trợ các định dạng PDF, DOCX, ZIP, PNG, JPG... (Tối đa 20MB)
          </span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              setFile(selected);
            }}
          />
        </label>

        {file && (
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-on-surface">
            <span className="material-symbols-outlined text-[20px] text-primary shrink-0">
              description
            </span>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-mono font-medium truncate">{file.name}</span>
              <span className="text-[10px] text-on-surface-variant">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-1 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition cursor-pointer"
              title="Xóa file đính kèm"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
