import Modal from "../../common/Modal";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../../common/formStyles";

export default function SubmitTaskModal({ submitForm, setSubmitForm, onSubmit, onClose, formError }) {
  return (
    <Modal title="Nộp task" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-white/45 text-xs">
          Nộp file đính kèm <strong className="text-white">hoặc</strong> dán địa chỉ liên kết (URL).
        </p>
        <div>
          <label className={labelCls}>Địa chỉ liên kết (URL)</label>
          <input
            type="url"
            value={submitForm.link}
            onChange={(e) =>
              setSubmitForm((p) => ({ ...p, link: e.target.value, file: p.link ? null : p.file }))
            }
            placeholder="https://..."
            className={inputCls}
            disabled={!!submitForm.file}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">hoặc</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <div>
          <label className={labelCls}>Upload file</label>
          <input
            type="file"
            onChange={(e) =>
              setSubmitForm((p) => ({
                ...p,
                file: e.target.files[0] || null,
                link: e.target.files[0] ? "" : p.link,
              }))
            }
            className="w-full text-sm text-white/60 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600/30 file:text-purple-300 file:text-xs file:font-semibold hover:file:bg-purple-600/50 cursor-pointer"
            disabled={!!submitForm.link}
          />
          {submitForm.file && (
            <p className="text-xs text-purple-300 mt-1.5 truncate">📄 {submitForm.file.name}</p>
          )}
        </div>
        {formError && <p className="text-red-400 text-xs">{formError}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={btnSecondary}>Hủy</button>
          <button type="submit" className={btnPrimary}>Nộp task</button>
        </div>
      </form>
    </Modal>
  );
}
