import { useState, useEffect } from "react";
import aiApi from "../../api/aiApi";

// Các mẫu tính năng thường gặp để Admin / Manager chọn nhanh
const QUICK_TEMPLATES = [
  {
    icon: "payments",
    title: "Cổng thanh toán VNPay / MoMo",
    goal: "Tích hợp cổng thanh toán trực tuyến qua VNPay và MoMo với Webhook IPN đối soát tự động",
    req: "Cần sinh mã thanh toán, xử lý redirect URL, xác thực chữ ký số checksum và cập nhật trạng thái đơn hàng.",
  },
  {
    icon: "forum",
    title: "Hệ thống Chat Realtime",
    goal: "Xây dựng tính năng trò chuyện thời gian thực cho thành viên dự án bằng WebSocket (STOMP)",
    req: "Lưu lịch sử tin nhắn vào database, phân quyền theo nhóm chat, đếm số tin nhắn chưa đọc và đẩy push notification.",
  },
  {
    icon: "security",
    title: "Xác thực 2 lớp (2FA) qua OTP",
    goal: "Triển khai tính năng bảo mật tài khoản 2 lớp (2FA) bằng mã OTP 6 số gửi về Email",
    req: "Sinh mã OTP ngẫu nhiên, lưu vào Redis với thời gian sống TTL 5 phút, gửi mail SMTP và xác minh trước khi cấp JWT.",
  },
  {
    icon: "description",
    title: "Xuất báo cáo PDF & Excel",
    goal: "Xây dựng module tổng hợp số liệu KPI và xuất báo cáo tiến độ dự án ra file Excel và PDF",
    req: "Lọc dữ liệu theo mốc thời gian, tạo biểu đồ tóm tắt, định dạng bảng chuyên nghiệp và tối ưu tốc độ download file lớn.",
  },
];

// Lấy ngày hôm nay định dạng YYYY-MM-DD
const getTodayString = (daysOffset = 0) => {
  const d = new Date();
  if (daysOffset > 0) {
    d.setDate(d.getDate() + daysOffset);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AiTaskDecompositionModal({
  isOpen,
  onClose,
  projectId,
  projectMembers = [],
  onTasksCreated,
}) {
  // Step 1: Nhập tính năng | Step 2: AI Loading | Step 3: Xem trước & Chỉnh sửa
  const [step, setStep] = useState(1);

  // Form Step 1
  const [featureGoal, setFeatureGoal] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [targetDeadline, setTargetDeadline] = useState(getTodayString(14));

  // Step 2 & 3
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState([]); // Danh sách sub-tasks do AI sinh ra

  const loadingMessages = [
    "Đang kết nối với Google Gemini AI...",
    "Đang phân tích phạm vi & yêu cầu kỹ thuật...",
    "Đang phân rã tính năng theo chuẩn CSDL ➔ API ➔ UI ➔ Test...",
    "Đang đối chiếu danh sách thành viên và ước lượng thời gian...",
    "Đang hoàn tất cấu trúc nhiệm vụ...",
  ];

  // Hiệu ứng chữ chạy khi AI đang suy nghĩ
  useEffect(() => {
    let interval;
    if (isDecomposing) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isDecomposing]);

  // Reset modal khi đóng/mở
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError("");
      setTasks([]);
      setIsDecomposing(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Chọn template nhanh
  const handleSelectTemplate = (template) => {
    setFeatureGoal(template.goal);
    setAdditionalRequirements(template.req);
    setError("");
  };

  // Bước 1 ➔ Bước 2 ➔ Bước 3: Gọi API AI phân rã
  const handleStartDecompose = async () => {
    if (!featureGoal.trim()) {
      setError("Vui lòng nhập mục tiêu hoặc tên tính năng cần phân rã.");
      return;
    }

    setError("");
    setIsDecomposing(true);
    setStep(2);

    try {
      const payload = {
        featureGoal: featureGoal.trim(),
        additionalRequirements: additionalRequirements.trim(),
        targetDeadline: targetDeadline || getTodayString(14),
      };

      const res = await aiApi.decomposeFeature(projectId, payload);
      const data = res.data || [];

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("AI không trả về danh sách nhiệm vụ nào. Vui lòng thử lại với mô tả rõ ràng hơn.");
      }

      // Chuẩn hóa dữ liệu sang state có thể chỉnh sửa
      const formattedTasks = data.map((t, idx) => ({
        id: `ai-task-${Date.now()}-${idx}`,
        selected: true,
        title: t.title || `Nhiệm vụ con ${idx + 1}`,
        description: t.description || "",
        priority: t.priority || "MEDIUM",
        estimatedDays: t.estimatedDays || 2,
        deadline: t.suggestedDeadline || getTodayString(3),
        assigneeIds: t.suggestedAssigneeId ? [t.suggestedAssigneeId] : [],
      }));

      setTasks(formattedTasks);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Đã xảy ra lỗi khi gọi AI. Vui lòng thử lại.");
      setStep(1); // Quay lại bước 1 nếu lỗi
    } finally {
      setIsDecomposing(false);
    }
  };

  // Cập nhật từng trường của task trong danh sách review
  const handleTaskChange = (taskId, field, value) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  // Bật/tắt chọn task
  const handleToggleSelect = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, selected: !t.selected } : t))
    );
  };

  // Xóa 1 task khỏi danh sách
  const handleDeleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Thêm thủ công 1 task mới vào danh sách
  const handleAddManualTask = () => {
    const newTask = {
      id: `manual-task-${Date.now()}`,
      selected: true,
      title: "Nhiệm vụ mới",
      description: "",
      priority: "MEDIUM",
      estimatedDays: 1,
      deadline: targetDeadline || getTodayString(7),
      assigneeIds: [],
    };
    setTasks((prev) => [...prev, newTask]);
  };

  // Bước cuối: Lưu hàng loạt các task đã chọn vào Database & Kanban
  const handleSaveToKanban = async () => {
    const selectedTasks = tasks.filter((t) => t.selected);
    if (selectedTasks.length === 0) {
      setError("Vui lòng chọn ít nhất 1 nhiệm vụ để thêm vào Kanban.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const payload = selectedTasks.map((t) => ({
        title: t.title.trim(),
        description: t.description.trim(),
        deadline: t.deadline,
        assigneeIds: t.assigneeIds || [],
        priority: t.priority,
      }));

      const res = await aiApi.batchCreateTasks(projectId, payload);
      const createdTasks = res.data || [];

      if (onTasksCreated) {
        onTasksCreated(createdTasks);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể lưu nhiệm vụ. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = tasks.filter((t) => t.selected).length;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#181622] text-white border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-purple-950/40 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-900/40 via-[#201d2d] to-[#181622] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <span className="material-symbols-outlined text-[22px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  AI Phân Rã Nhiệm Vụ (WBS)
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {step === 1 && "Nhập mục tiêu tính năng lớn để AI tự động chia thành các sub-tasks chi tiết"}
                {step === 2 && "Đang xử lý phân tích và bẻ nhỏ công việc..."}
                {step === 3 && `Kiểm tra, phân công và tùy chỉnh trước khi đưa lên bảng Kanban (${selectedCount}/${tasks.length} task được chọn)`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDecomposing || isSaving}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300 shrink-0">
            <span className="material-symbols-outlined text-[18px] text-red-400 shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">

          {/* ================= STEP 1: NHẬP TÍNH NĂNG & YÊU CẦU ================= */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              {/* Ô nhập tính năng chính */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Tên tính năng hoặc mục tiêu lớn <span className="text-purple-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={featureGoal}
                    onChange={(e) => setFeatureGoal(e.target.value)}
                    placeholder="Ví dụ: Tích hợp xác thực 2 lớp 2FA bằng Email OTP..."
                    className="w-full bg-[#110f18] border border-white/10 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Gợi ý mẫu nhanh */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Hoặc chọn nhanh mẫu tính năng phổ biến:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {QUICK_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`text-left p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                        featureGoal === tpl.goal
                          ? "bg-purple-900/30 border-purple-500/50 shadow-md shadow-purple-950/40"
                          : "bg-[#201d2d]/60 hover:bg-[#201d2d] border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[18px]">{tpl.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate mb-0.5">{tpl.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{tpl.req}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Yêu cầu bổ sung & Hạn chót */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Yêu cầu kỹ thuật bổ sung (tùy chọn)
                  </label>
                  <textarea
                    rows={3}
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    placeholder="Ví dụ: Cần kiểm tra định dạng email đuôi @company.com, lưu token vào Redis với TTL 5 phút..."
                    className="w-full bg-[#110f18] border border-white/10 focus:border-purple-500 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition custom-scrollbar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Hạn chót mục tiêu
                  </label>
                  <input
                    type="date"
                    value={targetDeadline}
                    onChange={(e) => setTargetDeadline(e.target.value)}
                    min={getTodayString()}
                    className="w-full bg-[#110f18] border border-white/10 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    AI sẽ tự động chia mốc thời gian hoàn thành của các task con sao cho không vượt quá hạn này.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: LOADING STATE ================= */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              {/* Vòng xoay AI Glowing */}
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 animate-spin blur-md opacity-75"></div>
                <div className="relative w-full h-full rounded-full bg-[#181622] border-2 border-purple-500/50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px] text-purple-400 animate-pulse">
                    psychology
                  </span>
                </div>
              </div>

              <h3 className="text-base font-semibold text-white mb-2">Google Gemini AI đang suy nghĩ</h3>
              <p className="text-xs text-purple-300 font-mono transition-all duration-300 animate-pulse">
                {loadingMessages[loadingTextIndex]}
              </p>

              <div className="w-56 h-1 bg-white/5 rounded-full mt-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-indeterminate"></div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PREVIEW & CUSTOMIZE TASKS ================= */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Mục tiêu: <span className="text-purple-300 font-medium">{featureGoal}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddManualTask}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-white/10"
                >
                  <span className="material-symbols-outlined text-[16px] text-purple-400">add</span>
                  Thêm task thủ công
                </button>
              </div>

              {/* Danh sách các task con */}
              <div className="flex flex-col gap-3">
                {tasks.map((task, idx) => {
                  const priorityColor =
                    task.priority === "HIGH"
                      ? "text-red-400 bg-red-500/10 border-red-500/20"
                      : task.priority === "LOW"
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : "text-amber-400 bg-amber-500/10 border-amber-500/20";

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all ${
                        task.selected
                          ? "bg-[#201d2d]/80 border-purple-500/30 shadow-md shadow-black/20"
                          : "bg-[#181622]/50 border-white/5 opacity-60"
                      }`}
                    >
                      {/* Hàng 1: Checkbox + Tiêu đề + Độ ưu tiên + Nút xóa */}
                      <div className="flex items-start gap-3 mb-2.5">
                        <input
                          type="checkbox"
                          checked={task.selected}
                          onChange={() => handleToggleSelect(task.id)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-white/20 bg-[#110f18] mt-1 cursor-pointer"
                        />

                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => handleTaskChange(task.id, "title", e.target.value)}
                            placeholder="Tiêu đề task..."
                            className="w-full bg-transparent font-semibold text-sm text-white placeholder:text-slate-500 outline-none border-b border-transparent hover:border-white/10 focus:border-purple-500 pb-0.5 transition"
                          />
                        </div>

                        {/* Dropdown Priority */}
                        <select
                          value={task.priority}
                          onChange={(e) => handleTaskChange(task.id, "priority", e.target.value)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border outline-none bg-[#110f18] cursor-pointer ${priorityColor}`}
                        >
                          <option value="HIGH">HIGH (Ưu tiên cao)</option>
                          <option value="MEDIUM">MEDIUM (Trung bình)</option>
                          <option value="LOW">LOW (Ưu tiên thấp)</option>
                        </select>

                        {/* Nút xóa */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                          title="Xóa task này"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>

                      {/* Hàng 2: Mô tả kỹ thuật */}
                      <div className="pl-7 mb-3">
                        <textarea
                          rows={2}
                          value={task.description}
                          onChange={(e) => handleTaskChange(task.id, "description", e.target.value)}
                          placeholder="Mô tả các bước kỹ thuật..."
                          className="w-full bg-[#110f18]/60 border border-white/5 focus:border-purple-500/50 rounded-lg p-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none transition custom-scrollbar"
                        />
                      </div>

                      {/* Hàng 3: Gán Người thực hiện + Hạn chót + Số ngày */}
                      <div className="pl-7 flex flex-wrap items-center gap-3 text-xs">
                        {/* Dropdown Gán thành viên */}
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                          <select
                            value={task.assigneeIds?.[0] || ""}
                            onChange={(e) => {
                              const val = e.target.value ? [Number(e.target.value)] : [];
                              handleTaskChange(task.id, "assigneeIds", val);
                            }}
                            className="bg-[#110f18] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none focus:border-purple-500 cursor-pointer"
                          >
                            <option value="">Chưa gán (mặc định bạn)</option>
                            {projectMembers.map((m) => {
                              const uId = m.userId || m.id;
                              return (
                                <option key={uId} value={uId}>
                                  {m.username} ({m.role || "MEMBER"})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Hạn chót (Deadline) */}
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                          <input
                            type="date"
                            value={task.deadline || ""}
                            onChange={(e) => handleTaskChange(task.id, "deadline", e.target.value)}
                            min={getTodayString()}
                            className="bg-[#110f18] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none focus:border-purple-500"
                          />
                        </div>

                        {/* Badge ước tính số ngày */}
                        {task.estimatedDays && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                            Ước tính: ~{task.estimatedDays} ngày
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 bg-[#14121d] border-t border-white/10 flex items-center justify-between shrink-0">
          <div>
            {step === 3 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSaving}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Cấu hình lại mục tiêu
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDecomposing || isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
            >
              Hủy bỏ
            </button>

            {step === 1 && (
              <button
                type="button"
                onClick={handleStartDecompose}
                disabled={isDecomposing || !featureGoal.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-500 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl transition shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Bắt đầu phân rã với AI
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleSaveToKanban}
                disabled={isSaving || selectedCount === 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang lưu vào Kanban...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Thêm {selectedCount} nhiệm vụ vào Kanban
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
