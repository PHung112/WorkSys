import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import projectApi from "../api/projectApi";
import aiApi from "../api/aiApi";

const getTodayString = (daysOffset = 0) => {
  const d = new Date();
  if (daysOffset > 0) d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Trang độc lập AI Phân rã nhiệm vụ (Task Decomposition - WBS)
 * Route: /projects/:projectId/ai-decompose
 * Tính năng:
 * 1. Đọc mã nguồn và cấu trúc file từ GitHub Repo liên kết
 * 2. Phân rã mục tiêu thành các sub-tasks kỹ thuật thực tế
 * 3. Hướng dẫn chi tiết cách dùng & mẹo viết prompt
 * 4. Tự động lưu bản nháp & Lưu lịch sử các lần phân rã để không bao giờ bị mất dữ liệu
 */
export default function AiDecomposePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Dữ liệu dự án & thành viên
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoadingProject, setIsLoadingProject] = useState(true);

  // Form State
  const [step, setStep] = useState(1);
  const [featureGoal, setFeatureGoal] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [targetDeadline, setTargetDeadline] = useState(getTodayString(14));
  const [tasks, setTasks] = useState([]);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  // Lịch sử phân rã
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeHistoryItem, setActiveHistoryItem] = useState(null);

  const draftStorageKey = `worksys_ai_decompose_draft_${projectId}`;
  const historyStorageKey = `worksys_ai_decompose_history_${projectId}`;

  const loadingMessages = [
    "Đang kết nối với Google Gemini AI...",
    "Đang truy vấn cấu trúc file & mã nguồn từ GitHub Repo...",
    "Đang phân tích cấu trúc thư mục & yêu cầu kỹ thuật...",
    "Đang phân rã tính năng bám sát mã nguồn thực tế...",
    "Đang đối chiếu danh sách thành viên và ước lượng thời gian...",
    "Đang hoàn tất cấu trúc nhiệm vụ...",
  ];

  // 1. Tải thông tin dự án & thành viên
  useEffect(() => {
    let isMounted = true;
    const fetchProjectData = async () => {
      try {
        setIsLoadingProject(true);
        const [projRes, memRes] = await Promise.all([
          projectApi.getProjectById(projectId),
          projectApi.getProjectMembers(projectId),
        ]);
        if (isMounted) {
          setProject(projRes.data);
          setMembers(memRes.data || []);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin dự án:", err);
        if (isMounted) setError("Không thể tải thông tin dự án hoặc bạn không có quyền truy cập.");
      } finally {
        if (isMounted) setIsLoadingProject(false);
      }
    };

    fetchProjectData();
    return () => { isMounted = false; };
  }, [projectId]);

  // 2. Tải bản nháp đã lưu & Lịch sử phân rã từ localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(historyStorageKey);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }

      const savedDraft = localStorage.getItem(draftStorageKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft && draft.tasks && draft.tasks.length > 0) {
          setFeatureGoal(draft.featureGoal || "");
          setAdditionalRequirements(draft.additionalRequirements || "");
          setTargetDeadline(draft.targetDeadline || getTodayString(14));
          setTasks(draft.tasks);
          setStep(draft.step || 3);
        }
      }
    } catch (e) {
      console.warn("Không thể khôi phục draft hoặc history từ localStorage:", e);
    }
  }, [draftStorageKey, historyStorageKey]);

  // 3. Tự động lưu bản nháp vào localStorage mỗi khi tasks hoặc form thay đổi
  useEffect(() => {
    if (tasks.length > 0 || featureGoal.trim()) {
      const draftData = {
        featureGoal,
        additionalRequirements,
        targetDeadline,
        step,
        tasks,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(draftData));
    }
  }, [tasks, featureGoal, additionalRequirements, targetDeadline, step, draftStorageKey]);

  // 4. Loading message rotation
  useEffect(() => {
    let interval;
    if (isDecomposing) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isDecomposing]);

  // Xử lý bắt đầu phân rã
  const handleStartDecompose = async () => {
    if (!featureGoal.trim()) {
      setError("Vui lòng nhập mục tiêu hoặc tên tính năng cần phân rã.");
      return;
    }

    setError("");
    setSuccessMessage("");
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

      // Lưu đợt phân rã này vào Lịch sử
      const newHistoryItem = {
        id: `decomp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        featureGoal: featureGoal.trim(),
        additionalRequirements: additionalRequirements.trim(),
        targetDeadline,
        taskCount: formattedTasks.length,
        tasks: formattedTasks,
        savedToKanban: false,
      };

      const updatedHistory = [newHistoryItem, ...history.slice(0, 19)]; // Lưu tối đa 20 lần gần nhất
      setHistory(updatedHistory);
      localStorage.setItem(historyStorageKey, JSON.stringify(updatedHistory));

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

  // Lưu hàng loạt task vào Kanban
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

      await aiApi.batchCreateTasks(projectId, payloadTasks);

      // Cập nhật trạng thái lịch sử
      const updatedHistory = history.map((item) => {
        if (item.featureGoal === featureGoal.trim()) {
          return { ...item, savedToKanban: true };
        }
        return item;
      });
      setHistory(updatedHistory);
      localStorage.setItem(historyStorageKey, JSON.stringify(updatedHistory));

      // Xóa draft tạm sau khi đã lưu thành công
      localStorage.removeItem(draftStorageKey);

      setSuccessMessage(`Đã tạo thành công ${payloadTasks.length} nhiệm vụ lên Kanban!`);
      setTimeout(() => {
        navigate(`/projects?goto=${projectId}`);
      }, 1200);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Không thể lưu các nhiệm vụ vào CSDL");
    } finally {
      setIsSaving(false);
    }
  };

  // Nạp lại một đợt phân rã từ lịch sử
  const handleRestoreHistoryItem = (item) => {
    setFeatureGoal(item.featureGoal || "");
    setAdditionalRequirements(item.additionalRequirements || "");
    setTargetDeadline(item.targetDeadline || getTodayString(14));
    setTasks(item.tasks || []);
    setStep(3);
    setIsHistoryOpen(false);
    setActiveHistoryItem(item);
    setError("");
  };

  // Xóa một mục lịch sử
  const handleDeleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem(historyStorageKey, JSON.stringify(updated));
    if (activeHistoryItem?.id === id) setActiveHistoryItem(null);
  };

  // Xóa sạch lịch sử
  const handleClearAllHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử phân rã của dự án này?")) {
      setHistory([]);
      localStorage.removeItem(historyStorageKey);
      setIsHistoryOpen(false);
    }
  };

  // Reset form để nhập yêu cầu mới
  const handleResetForm = () => {
    setFeatureGoal("");
    setAdditionalRequirements("");
    setTargetDeadline(getTodayString(14));
    setTasks([]);
    setStep(1);
    setError("");
    setSuccessMessage("");
    localStorage.removeItem(draftStorageKey);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background font-body-sm text-on-background flex flex-col">
      {/* Loading Overlay khi tải thông tin dự án */}
      {isLoadingProject && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full"></div>
            <p className="text-on-surface-variant font-body-sm">Đang tải thông tin dự án...</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

        {/* Header điều hướng */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/projects?goto=${projectId}`)}
              className="h-10 px-3.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl flex items-center gap-2 text-xs font-semibold border border-outline-variant/20 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Quay lại bảng công việc Kanban"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Dự án</span>
            </button>
            <div className="h-6 w-px bg-outline-variant/20 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant text-xs font-medium">Dự án:</span>
                <span className="text-primary font-bold text-sm tracking-wide">
                  {project?.name || "Đang tải..."}
                </span>
                {project?.githubRepo && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-surface-container-high text-purple-400 border border-purple-500/20">
                    <span className="material-symbols-outlined text-[14px]">code</span>
                    <span>{project.githubRepo}</span>
                  </span>
                )}
              </div>
              <h1 className="font-display text-xl font-bold text-on-background flex items-center gap-2 mt-0.5">
                <span className="material-symbols-outlined text-[24px] text-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                <span>AI Tự Động Phân Rã Nhiệm Vụ (WBS)</span>
              </h1>
            </div>
          </div>

          {/* Action buttons: Nút Lịch sử & Step Indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="h-10 px-3.5 bg-surface-container hover:bg-surface-container-high text-purple-300 hover:text-purple-200 border border-purple-500/30 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Xem lại các lần AI chia task trước đây"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>Lịch sử ({history.length})</span>
            </button>

            {/* Step indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/15 text-xs">
              <span className={`font-semibold ${step === 1 ? "text-purple-400 font-bold" : "text-on-surface-variant"}`}>
                1. Nhập mục tiêu
              </span>
              <span className="text-outline-variant/30">➔</span>
              <span className={`font-semibold ${step === 2 ? "text-purple-400 font-bold animate-pulse" : "text-on-surface-variant"}`}>
                2. AI quét & phân tích
              </span>
              <span className="text-outline-variant/30">➔</span>
              <span className={`font-semibold ${step === 3 ? "text-purple-400 font-bold" : "text-on-surface-variant"}`}>
                3. Xem trước & Lưu
              </span>
            </div>
          </div>
        </div>

        {/* Thông báo lỗi / Thành công */}
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-medium">{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* NỘI DUNG CHÍNH */}

        {/* BƯỚC 1: NHẬP MỤC TIÊU */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form nhập mục tiêu bên trái */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-on-background flex items-center gap-2 m-0">
                    <span className="material-symbols-outlined text-[20px] text-purple-400">flag</span>
                    <span>Thông tin mục tiêu cần phân rã</span>
                  </h3>
                  {tasks.length > 0 && (
                    <button
                      onClick={() => setStep(3)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-semibold underline cursor-pointer"
                    >
                      Khôi phục kết quả vừa tạo ({tasks.length} task)
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Mục tiêu / Tính năng chính *
                  </label>
                  <textarea
                    value={featureGoal}
                    onChange={(e) => setFeatureGoal(e.target.value)}
                    placeholder="Ví dụ: Chỉnh sửa tiêu đề trang web portfolio và cập nhật thông tin cá nhân..."
                    rows={4}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-3.5 text-xs text-on-surface outline-none focus:border-purple-500 transition-all placeholder:text-on-surface-variant/40 leading-relaxed"
                  />
                  <p className="text-[11px] text-on-surface-variant/70 mt-1.5">
                    Nêu rõ tên tính năng hoặc các thành phần cần chỉnh sửa. Nếu có file cụ thể, bạn có thể ghi kèm.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Yêu cầu kỹ thuật bổ sung (nếu có)
                  </label>
                  <textarea
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    placeholder="Ví dụ: Đổi font chữ sang Inter, thêm hiệu ứng fade-in khi load trang..."
                    rows={3}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-3.5 text-xs text-on-surface outline-none focus:border-purple-500 transition-all placeholder:text-on-surface-variant/40 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Hạn chót mục tiêu hoàn thành
                  </label>
                  <input
                    type="date"
                    value={targetDeadline}
                    min={getTodayString()}
                    onChange={(e) => setTargetDeadline(e.target.value)}
                    className="w-full sm:w-64 bg-surface-container border border-outline-variant/20 rounded-xl p-2.5 text-xs text-on-surface outline-none focus:border-purple-500 transition-all cursor-pointer"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-outline-variant/10">
                  <span className="text-[11px] text-on-surface-variant">
                    {project?.githubRepo ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        Sẽ tự động đọc mã nguồn từ {project.githubRepo}
                      </span>
                    ) : (
                      "Chưa kết nối GitHub Repo (AI sẽ chia theo cấu trúc dự án chuẩn)"
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={handleStartDecompose}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    <span>Bắt đầu phân rã với Gemini</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cột phải: HƯỚNG DẪN CÁCH SỬ DỤNG (Thay thế mẫu cũ) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/10">
                  <span className="material-symbols-outlined text-[22px] text-purple-400">menu_book</span>
                  <h3 className="font-display text-sm font-bold text-on-background m-0 uppercase tracking-wider">
                    Hướng dẫn sử dụng & Mẹo viết Prompt
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs text-on-surface-variant leading-relaxed">
                  <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/10">
                    <p className="font-bold text-on-surface flex items-center gap-1.5 mb-1 text-purple-300">
                      <span className="material-symbols-outlined text-[16px]">code</span>
                      1. Tự động đọc mã nguồn GitHub
                    </p>
                    <p className="m-0">
                      Nếu dự án đã liên kết Repo GitHub (như <strong>{project?.githubRepo || "repo của bạn"}</strong>), AI sẽ <strong>tự động quét toàn bộ cây thư mục và package.json</strong> để nhận diện công nghệ (React, Vite, Tailwind...) và <strong>chỉ định danh đúng file component cần sửa</strong> trong mã nguồn.
                    </p>
                  </div>

                  <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/10">
                    <p className="font-bold text-on-surface flex items-center gap-1.5 mb-1 text-purple-300">
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      2. Cách nhập mục tiêu hiệu quả
                    </p>
                    <p className="m-0">
                      - Với việc nhỏ (sửa text, đổi tiêu đề, chỉnh CSS): Ghi ngắn gọn. AI sẽ tạo 1-2 task đúng trọng tâm, không vẽ ra CSDL hay Backend thừa thãi.<br />
                      - Với tính năng lớn (thanh toán, chat realtime): AI sẽ bóc tách đầy đủ theo các tầng kỹ thuật thực tế.
                    </p>
                  </div>

                  <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/10">
                    <p className="font-bold text-on-surface flex items-center gap-1.5 mb-1 text-purple-300">
                      <span className="material-symbols-outlined text-[16px]">group</span>
                      3. Tự động gợi ý người phụ trách
                    </p>
                    <p className="m-0">
                      AI đối chiếu theo <strong>Vị trí / Chuyên môn</strong> của từng thành viên (Frontend, Backend, UI/UX...) để đề xuất người nhận phù hợp nhất. Bạn có thể thay đổi trước khi lưu.
                    </p>
                  </div>

                  <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/10">
                    <p className="font-bold text-on-surface flex items-center gap-1.5 mb-1 text-purple-300">
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      4. Tự động lưu - Không sợ mất kết quả
                    </p>
                    <p className="m-0">
                      Mỗi lần AI chia task xong, hệ thống <strong>tự động lưu vào Lịch sử và Bản nháp</strong>. Dù bạn lỡ chuyển trang hoặc tải lại, kết quả vẫn được bảo toàn trọn vẹn!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BƯỚC 2: AI ĐANG XỬ LÝ */}
        {step === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-2xl shadow-purple-600/40 animate-pulse mb-6">
              <span className="material-symbols-outlined text-[36px] animate-spin">sync</span>
            </div>
            <h3 className="font-display text-xl font-bold text-on-background mb-2">
              Gemini đang kiến trúc & phân rã nhiệm vụ...
            </h3>
            <p className="text-xs text-purple-400 font-semibold transition-all duration-300">
              {loadingMessages[loadingTextIndex]}
            </p>
          </div>
        )}

        {/* BƯỚC 3: XEM TRƯỚC VÀ CHỈNH SỬA SUB-TASKS */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-on-surface">
                    Đã sinh ra {tasks.length} nhiệm vụ con (WBS)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                    Tự động lưu vào Lịch sử
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant m-0 mt-0.5">
                  Mục tiêu: <strong className="text-on-surface">{featureGoal}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold border border-outline-variant/20 transition-all cursor-pointer"
                >
                  Nhập mục tiêu khác
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatchTasks}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  <span>{isSaving ? "Đang lưu vào Kanban..." : "Lưu vào Kanban"}</span>
                </button>
              </div>
            </div>

            {/* Danh sách Task Card */}
            <div className="grid grid-cols-1 gap-4">
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    task.selected
                      ? "bg-surface-container-low border-purple-500/40 shadow-sm"
                      : "bg-surface-container-lowest/60 border-outline-variant/10 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={task.selected}
                      onChange={() => handleToggleTask(task.id)}
                      className="w-4 h-4 mt-1.5 accent-purple-600 rounded cursor-pointer"
                    />
                    <div className="flex-1 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => handleUpdateTaskField(task.id, "title", e.target.value)}
                          className="font-bold text-sm bg-transparent border-b border-transparent hover:border-outline-variant/30 focus:border-purple-500 text-on-surface outline-none pb-0.5 flex-1"
                        />
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full shrink-0">
                          Task #{idx + 1}
                        </span>
                      </div>

                      <textarea
                        value={task.description}
                        onChange={(e) => handleUpdateTaskField(task.id, "description", e.target.value)}
                        rows={3}
                        className="w-full text-xs bg-surface-container border border-outline-variant/20 rounded-xl p-3 text-on-surface-variant outline-none focus:border-purple-500/50 resize-y leading-relaxed"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs pt-1">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-on-surface-variant/70 mb-1">
                            Người phụ trách *
                          </label>
                          <select
                            value={task.assigneeIds[0] || ""}
                            onChange={(e) => {
                              const val = e.target.value ? [Number(e.target.value)] : [];
                              handleUpdateTaskField(task.id, "assigneeIds", val);
                            }}
                            className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-purple-500/50 cursor-pointer"
                          >
                            <option value="">-- Chọn thành viên --</option>
                            {members.map((m) => {
                              const uId = m.user?.id || m.userId || m.id;
                              const uName = m.user?.username || m.username;
                              const pos = m.position ? ` - ${m.position}` : "";
                              return (
                                <option key={uId} value={uId}>
                                  {uName} ({m.role}{pos})
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
                            className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-purple-500/50 cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-on-surface-variant/70 mb-1">
                            Độ ưu tiên
                          </label>
                          <select
                            value={task.priority}
                            onChange={(e) => handleUpdateTaskField(task.id, "priority", e.target.value)}
                            className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-purple-500/50 cursor-pointer"
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

      {/* DRAWER / MODAL LỊCH SỬ PHÂN RÃ */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-container-high h-full shadow-2xl flex flex-col border-l border-outline-variant/20">
            {/* Header Drawer */}
            <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-purple-400">history</span>
                <h3 className="font-display font-bold text-sm text-on-background m-0">
                  Lịch sử AI phân rã ({history.length})
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Danh sách lịch sử */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[36px] opacity-40 mb-2">history_toggle_off</span>
                  <p className="text-xs m-0">Chưa có lịch sử phân rã nào cho dự án này.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleRestoreHistoryItem(item)}
                    className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 hover:border-purple-500/40 transition-all cursor-pointer group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-on-surface-variant/70">
                        {new Date(item.timestamp).toLocaleString("vi-VN")}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {item.savedToKanban ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                            Đã lưu Kanban
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400">
                            Bản nháp
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          title="Xóa mục này"
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 text-on-surface-variant transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-on-surface group-hover:text-purple-300 line-clamp-2 m-0">
                      {item.featureGoal}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/10">
                      <span>{item.taskCount || item.tasks?.length} nhiệm vụ con</span>
                      <span className="text-purple-400 font-semibold group-hover:underline flex items-center gap-1">
                        <span>Khôi phục</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Drawer */}
            {history.length > 0 && (
              <div className="p-3 border-t border-outline-variant/10 flex justify-between items-center">
                <button
                  onClick={handleClearAllHistory}
                  className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 cursor-pointer transition-colors"
                >
                  Xóa tất cả lịch sử
                </button>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
