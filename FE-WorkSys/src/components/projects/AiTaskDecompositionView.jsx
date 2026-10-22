import { useState, useEffect } from "react";
import aiApi from "../../api/aiApi";

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

const getTodayString = (daysOffset = 0) => {
  const d = new Date();
  if (daysOffset > 0) d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Component AI Phân rã nhiệm vụ (WBS) trực tiếp bên trong ProjectDetail
 */
export default function AiTaskDecompositionView({
  projectId,
  projectMembers = [],
  onTasksCreated,
  onBackToKanban,
}) {
  const [step, setStep] = useState(1);
  const [featureGoal, setFeatureGoal] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [targetDeadline, setTargetDeadline] = useState(getTodayString(14));
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState([]);

  const loadingMessages = [
    "Đang kết nối với Google Gemini AI...",
    "Đang phân tích cấu trúc & yêu cầu kỹ thuật...",
    "Đang phân rã tính năng theo chuẩn CSDL ➔ API ➔ UI ➔ Test...",
    "Đang đối chiếu danh sách thành viên và ước lượng thời gian...",
    "Đang hoàn tất cấu trúc nhiệm vụ...",
  ];

  useEffect(() => {
    let interval;
    if (isDecomposing) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isDecomposing]);

  const handleSelectTemplate = (template) => {
    setFeatureGoal(template.goal);
    setAdditionalRequirements(template.req);
    setError("");
  };

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
      console.error(err);
      setError(err.response?.data?.message || err.message || "Lỗi khi gọi AI phân rã task");
      setStep(1);
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleToggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)));
  };

  const handleUpdateTaskField = (id, field, value) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleSaveBatchTasks = async () => {
    const selectedTasks = tasks.filter((t) => t.selected);
    if (selectedTasks.length === 0) {
      setError("Vui lòng chọn ít nhất 1 nhiệm vụ để lưu.");
      return;
    }

    const unassignedTask = selectedTasks.find((t) => !t.assigneeIds || t.assigneeIds.length === 0);
    if (unassignedTask) {
      setError(`Nhiệm vụ "${unassignedTask.title}" chưa được phân công cho thành viên nào.`);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const payloadTasks = selectedTasks.map((t) => ({
        title: t.title.trim(),
        description: t.description.trim(),
        deadline: t.deadline,
        priority: t.priority,
        assigneeIds: t.assigneeIds,
      }));

      const res = await aiApi.batchCreateTasks(projectId, payloadTasks);
      if (onTasksCreated) {
        onTasksCreated(res.data);
      }
      onBackToKanban();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Không thể lưu các nhiệm vụ vào CSDL");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full px-container-margin overflow-y-auto custom-scrollbar pb-12">
      {/* Header thanh điều hướng */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToKanban}
            className="h-9 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant/20 transition-colors cursor-pointer"
            title="Quay lại Bảng công việc Kanban"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Bảng công việc</span>
          </button>
          <div className="h-4 w-px bg-outline-variant/20 hidden sm:block"></div>
          <div>
            <h2 className="font-display text-xl font-bold text-on-background flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-[24px] text-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span>AI Tự Động Phân Rã Nhiệm Vụ (WBS)</span>
            </h2>
            <p className="text-on-surface-variant text-xs mt-0.5">
              Chuyển đổi một mục tiêu tính năng lớn thành danh sách 3-6 task con chuẩn quy trình CSDL ➔ API ➔ UI ➔ Test
            </p>
          </div>
        </div>

        {/* Thanh Step indicator */}
        <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/10 text-xs shrink-0">
          <span className={`font-semibold ${step === 1 ? "text-purple-400 font-bold" : "text-on-surface-variant"}`}>
            1. Nhập mục tiêu
          </span>
          <span className="text-outline-variant/30">➔</span>
          <span className={`font-semibold ${step === 2 ? "text-purple-400 font-bold animate-pulse" : "text-on-surface-variant"}`}>
            2. AI xử lý
          </span>
          <span className="text-outline-variant/30">➔</span>
          <span className={`font-semibold ${step === 3 ? "text-purple-400 font-bold" : "text-on-surface-variant"}`}>
            3. Xem trước & Lưu
          </span>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="my-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* NỘI DUNG TỪNG BƯỚC */}

      {/* BƯỚC 1: NHẬP MỤC TIÊU */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-display text-base font-bold text-on-background flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-[20px] text-purple-400">flag</span>
                <span>Thông tin tính năng cần phân rã</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Mục tiêu / Tính năng chính *
                </label>
                <textarea
                  value={featureGoal}
                  onChange={(e) => setFeatureGoal(e.target.value)}
                  placeholder="Ví dụ: Xây dựng tính năng thanh toán online bằng VNPay và MoMo..."
                  rows={3}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-3 text-xs text-on-surface outline-none focus:border-purple-500/60 transition-all placeholder:text-on-surface-variant/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Yêu cầu kỹ thuật bổ sung (nếu có)
                </label>
                <textarea
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  placeholder="Ví dụ: Sử dụng Redis lưu session, bảo mật IPN Webhook..."
                  rows={3}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-3 text-xs text-on-surface outline-none focus:border-purple-500/60 transition-all placeholder:text-on-surface-variant/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Hạn chót mục tiêu hoàn thành
                </label>
                <input
                  type="date"
                  value={targetDeadline}
                  min={getTodayString()}
                  onChange={(e) => setTargetDeadline(e.target.value)}
                  className="w-full sm:w-64 bg-surface-container border border-outline-variant/20 rounded-xl p-2.5 text-xs text-on-surface outline-none focus:border-purple-500/60 transition-all cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartDecompose}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  <span>Bắt đầu phân rã với Gemini</span>
                </button>
              </div>
            </div>
          </div>

          {/* Gợi ý mẫu tính năng */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="font-display text-sm font-bold text-on-surface-variant uppercase tracking-wider m-0">
              Chọn nhanh mẫu tính năng phổ biến:
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {QUICK_TEMPLATES.map((tpl, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="p-3.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 hover:border-purple-500/40 rounded-xl transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="material-symbols-outlined text-[20px] text-purple-400 group-hover:scale-110 transition-transform">
                      {tpl.icon}
                    </span>
                    <span className="text-xs font-bold text-on-surface group-hover:text-purple-300">
                      {tpl.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2 m-0 leading-relaxed">
                    {tpl.goal}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BƯỚC 2: AI ĐANG XỬ LÝ */}
      {step === 2 && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-purple-600/40 animate-pulse mb-6">
            <span className="material-symbols-outlined text-[32px] animate-spin">sync</span>
          </div>
          <h3 className="font-display text-lg font-bold text-on-background mb-2">
            Gemini đang kiến trúc & phân rã nhiệm vụ...
          </h3>
          <p className="text-xs text-purple-400 font-medium transition-all duration-300">
            {loadingMessages[loadingTextIndex]}
          </p>
        </div>
      )}

      {/* BƯỚC 3: XEM TRƯỚC VÀ CHỈNH SỬA CÁC SUB-TASKS */}
      {step === 3 && (
        <div className="space-y-4 my-6">
          <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
            <div>
              <span className="text-xs font-bold text-on-surface">
                Đã sinh ra {tasks.length} nhiệm vụ con (WBS)
              </span>
              <p className="text-[11px] text-on-surface-variant m-0">
                Bạn có thể tick chọn, chỉnh sửa nội dung hoặc thay đổi người phụ trách trước khi lưu vào Kanban.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-medium border border-outline-variant/20 transition-colors cursor-pointer"
              >
                Nhập lại
              </button>
              <button
                type="button"
                onClick={handleSaveBatchTasks}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">task_alt</span>
                <span>{isSaving ? "Đang lưu..." : "Lưu vào Kanban"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${
                  task.selected
                    ? "bg-surface-container-low border-purple-500/40 shadow-sm"
                    : "bg-surface-container-lowest/60 border-outline-variant/10 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.selected}
                    onChange={() => handleToggleTask(task.id)}
                    className="w-4 h-4 mt-1 accent-purple-600 rounded cursor-pointer"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => handleUpdateTaskField(task.id, "title", e.target.value)}
                        className="font-bold text-sm bg-transparent border-b border-transparent hover:border-outline-variant/30 focus:border-purple-500 text-on-surface outline-none pb-0.5 flex-1"
                      />
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full shrink-0">
                        Task #{idx + 1}
                      </span>
                    </div>

                    <textarea
                      value={task.description}
                      onChange={(e) => handleUpdateTaskField(task.id, "description", e.target.value)}
                      rows={2}
                      className="w-full text-xs bg-surface-container border border-outline-variant/20 rounded-xl p-2.5 text-on-surface-variant outline-none focus:border-purple-500/50 resize-none"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-on-surface-variant/70 mb-1">
                          Người phụ trách
                        </label>
                        <select
                          value={task.assigneeIds[0] || ""}
                          onChange={(e) => {
                            const val = e.target.value ? [Number(e.target.value)] : [];
                            handleUpdateTaskField(task.id, "assigneeIds", val);
                          }}
                          className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-purple-500/50 cursor-pointer"
                        >
                          <option value="">-- Chọn thành viên --</option>
                          {projectMembers.map((m) => {
                            const uId = m.userId || m.id;
                            return (
                              <option key={uId} value={uId}>
                                {m.username} ({m.role})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-on-surface-variant/70 mb-1">
                          Hạn hoàn thành (Deadline)
                        </label>
                        <input
                          type="date"
                          value={task.deadline}
                          onChange={(e) => handleUpdateTaskField(task.id, "deadline", e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-purple-500/50 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-on-surface-variant/70 mb-1">
                          Độ ưu tiên
                        </label>
                        <select
                          value={task.priority}
                          onChange={(e) => handleUpdateTaskField(task.id, "priority", e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-purple-500/50 cursor-pointer"
                        >
                          <option value="HIGH">Cao (High)</option>
                          <option value="MEDIUM">Trung bình (Medium)</option>
                          <option value="LOW">Thấp (Low)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
