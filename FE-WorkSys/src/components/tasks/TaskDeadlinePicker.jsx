import { useRef } from "react";
import TimePicker from "../common/TimePicker";
import { labelCls, inputCls } from "../common/formStyles";

/**
 * Component chọn hạn chót (Deadline: Ngày + Giờ)
 */
export default function TaskDeadlinePicker({
  deadline,
  setDeadline,
  deadlineTime,
  setDeadlineTime,
  minDate,
}) {
  const dateInputRef = useRef(null);

  return (
    <div>
      <label className={labelCls}>
        Deadline <span className="text-on-surface-variant/50 font-normal">(tùy chọn)</span>
      </label>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Chọn Ngày */}
        <div className="relative flex-1">
          <input
            ref={dateInputRef}
            type="date"
            value={deadline}
            min={minDate}
            onChange={(e) => setDeadline(e.target.value)}
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

        {/* Chọn Giờ */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-medium hidden sm:inline">lúc</span>
          <TimePicker value={deadlineTime} onChange={setDeadlineTime} />
        </div>
      </div>
    </div>
  );
}
