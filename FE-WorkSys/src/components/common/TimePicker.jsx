import { useState, useRef, useEffect } from "react";

// Component chọn Giờ & Phút phong cách Đồng hồ số OLED cao cấp (giống hình mẫu)
export default function TimePicker({ value = "23:59", onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Tách giờ và phút từ value (định dạng HH:mm)
  const [rawH, rawM] = (value && value.includes(":") ? value.split(":") : ["23", "59"]).map((v) =>
    parseInt(v, 10)
  );

  const h = isNaN(rawH) ? 23 : (rawH + 24) % 24;
  const m = isNaN(rawM) ? 59 : (rawM + 60) % 60;

  const currentHourStr = String(h).padStart(2, "0");
  const currentMinuteStr = String(m).padStart(2, "0");

  // Tính số trước và số sau
  const prevHourStr = String((h - 1 + 24) % 24).padStart(2, "0");
  const nextHourStr = String((h + 1) % 24).padStart(2, "0");

  const prevMinuteStr = String((m - 1 + 60) % 60).padStart(2, "0");
  const nextMinuteStr = String((m + 1) % 60).padStart(2, "0");

  const popupRef = useRef(null);
  const hourColRef = useRef(null);
  const minuteColRef = useRef(null);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Chặn cuộn trang web ngoài và xử lý lăn chuột trên Giờ / Phút
  useEffect(() => {
    if (!isOpen) return;

    // Chặn cuộn thanh cuộn của toàn bộ trang khi rê chuột trong popup
    const popupEl = popupRef.current;
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (popupEl) {
      popupEl.addEventListener("wheel", preventScroll, { passive: false });
    }

    // Lăn chuột trên cột Giờ
    const hourEl = hourColRef.current;
    const handleNativeHourWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY > 0) {
        setHour(h + 1);
      } else {
        setHour(h - 1);
      }
    };
    if (hourEl) {
      hourEl.addEventListener("wheel", handleNativeHourWheel, { passive: false });
    }

    // Lăn chuột trên cột Phút
    const minuteEl = minuteColRef.current;
    const handleNativeMinuteWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY > 0) {
        setMinute(m + 1);
      } else {
        setMinute(m - 1);
      }
    };
    if (minuteEl) {
      minuteEl.addEventListener("wheel", handleNativeMinuteWheel, { passive: false });
    }

    return () => {
      if (popupEl) popupEl.removeEventListener("wheel", preventScroll);
      if (hourEl) hourEl.removeEventListener("wheel", handleNativeHourWheel);
      if (minuteEl) minuteEl.removeEventListener("wheel", handleNativeMinuteWheel);
    };
  }, [isOpen, h, m]);

  // Đổi giờ
  const setHour = (newH) => {
    const validH = String((newH + 24) % 24).padStart(2, "0");
    onChange(`${validH}:${currentMinuteStr}`);
  };

  // Đổi phút
  const setMinute = (newM) => {
    const validM = String((newM + 60) % 60).padStart(2, "0");
    onChange(`${currentHourStr}:${validM}`);
  };

  // Xử lý nhập tay vào ô text
  const handleInputChange = (e) => {
    let val = e.target.value.replace(/[^0-9:]/g, "");
    if (val.length === 2 && !val.includes(":") && e.nativeEvent.inputType !== "deleteContentBackward") {
      val += ":";
    }
    if (val.length > 5) val = val.slice(0, 5);
    onChange(val);
  };

  // Validate khi blur ô nhập tay
  const handleInputBlur = () => {
    const parts = (value || "").split(":");
    let inputH = parseInt(parts[0] || "0", 10);
    let inputM = parseInt(parts[1] || "0", 10);
    if (isNaN(inputH) || inputH < 0) inputH = 0;
    if (inputH > 23) inputH = 23;
    if (isNaN(inputM) || inputM < 0) inputM = 0;
    if (inputM > 59) inputM = 59;
    onChange(`${String(inputH).padStart(2, "0")}:${String(inputM).padStart(2, "0")}`);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Nút hiển thị & Ô nhập giờ */}
      <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2.5 focus-within:border-primary transition shadow-sm w-36">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="23:59"
          maxLength={5}
          className="w-full bg-transparent text-on-surface font-mono text-sm focus:outline-none tracking-widest text-center"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-on-surface-variant hover:text-primary transition p-0.5 cursor-pointer flex items-center justify-center shrink-0"
          title="Mở đồng hồ lăn chuột"
        >
          <span className="material-symbols-outlined text-[18px]">schedule</span>
        </button>
      </div>

      {/* Popup Đồng hồ số OLED siêu tối giản & sang trọng */}
      {isOpen && (
        <div
          ref={popupRef}
          className="absolute left-0 bottom-full mb-3 bg-black border border-zinc-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 p-6 w-72 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Header tiêu đề */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/80 text-xs text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-zinc-300">mouse</span>
              Lăn chuột trên số
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-zinc-200 transition cursor-pointer p-1 rounded-lg"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Giao diện Đồng hồ 3 hàng cuộn giống ảnh mẫu */}
          <div className="flex items-center justify-center py-2 font-mono">
            {/* Cột Giờ */}
            <div
              ref={hourColRef}
              className="flex flex-col items-center justify-center flex-1 cursor-ns-resize group py-1"
              title="Lăn chuột hoặc click để đổi giờ"
            >
              <span className="text-[10px] tracking-wider uppercase font-semibold text-zinc-500 mb-2 font-sans">
                Giờ
              </span>

              {/* Hàng trên (Giờ trước) */}
              <button
                type="button"
                onClick={() => setHour(h - 1)}
                className="text-2xl sm:text-3xl font-light text-zinc-600 hover:text-zinc-400 transition-all opacity-50 hover:opacity-100 py-1 cursor-pointer"
              >
                {prevHourStr}
              </button>

              {/* Hàng giữa (Giờ hiện tại - Nổi bật trắng sáng) */}
              <div className="text-5xl sm:text-6xl font-light text-white tracking-tight py-2 transition-transform duration-100 group-hover:scale-105">
                {currentHourStr}
              </div>

              {/* Hàng dưới (Giờ kế tiếp) */}
              <button
                type="button"
                onClick={() => setHour(h + 1)}
                className="text-2xl sm:text-3xl font-light text-zinc-600 hover:text-zinc-400 transition-all opacity-50 hover:opacity-100 py-1 cursor-pointer"
              >
                {nextHourStr}
              </button>
            </div>

            {/* Dấu hai chấm phân cách */}
            <div className="flex flex-col items-center justify-center px-2 pt-5">
              <span className="text-4xl sm:text-5xl font-light text-white/90 select-none pb-1">:</span>
            </div>

            {/* Cột Phút */}
            <div
              ref={minuteColRef}
              className="flex flex-col items-center justify-center flex-1 cursor-ns-resize group py-1"
              title="Lăn chuột hoặc click để đổi phút"
            >
              <span className="text-[10px] tracking-wider uppercase font-semibold text-zinc-500 mb-2 font-sans">
                Phút
              </span>

              {/* Hàng trên (Phút trước) */}
              <button
                type="button"
                onClick={() => setMinute(m - 1)}
                className="text-2xl sm:text-3xl font-light text-zinc-600 hover:text-zinc-400 transition-all opacity-50 hover:opacity-100 py-1 cursor-pointer"
              >
                {prevMinuteStr}
              </button>

              {/* Hàng giữa (Phút hiện tại - Nổi bật trắng sáng) */}
              <div className="text-5xl sm:text-6xl font-light text-white tracking-tight py-2 transition-transform duration-100 group-hover:scale-105">
                {currentMinuteStr}
              </div>

              {/* Hàng dưới (Phút kế tiếp) */}
              <button
                type="button"
                onClick={() => setMinute(m + 1)}
                className="text-2xl sm:text-3xl font-light text-zinc-600 hover:text-zinc-400 transition-all opacity-50 hover:opacity-100 py-1 cursor-pointer"
              >
                {nextMinuteStr}
              </button>
            </div>
          </div>

          {/* Các nút chọn nhanh */}
          <div className="grid grid-cols-3 gap-2 pt-4 mt-3 border-t border-zinc-800/80 text-xs">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                onChange(
                  `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
                );
              }}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 rounded-xl text-zinc-300 font-medium transition cursor-pointer text-center"
            >
              Hiện tại
            </button>
            <button
              type="button"
              onClick={() => onChange("12:00")}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 rounded-xl text-zinc-300 font-medium transition cursor-pointer text-center"
            >
              12:00
            </button>
            <button
              type="button"
              onClick={() => onChange("23:59")}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 rounded-xl text-zinc-300 font-medium transition cursor-pointer text-center"
            >
              23:59
            </button>
          </div>

          {/* Nút xác nhận */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full mt-3 py-2 bg-white text-black font-semibold rounded-xl text-xs hover:bg-zinc-200 transition cursor-pointer shadow-md active:scale-95"
          >
            Xong ({currentHourStr}:{currentMinuteStr})
          </button>
        </div>
      )}
    </div>
  );
}
