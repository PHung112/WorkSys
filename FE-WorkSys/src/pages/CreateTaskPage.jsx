import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import projectApi from "../api/projectApi";
import taskApi from "../api/taskApi";
import TimePicker from "../components/common/TimePicker";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../components/common/formStyles";

// Hàm tiện ích lấy chuỗi ngày hôm nay định dạng YYYY-MM-DD theo giờ địa phương
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Trang tạo nhiệm vụ mới (TaskPage): giao diện riêng biệt, rộng rãi cho việc soạn thảo task, đính kèm file và chọn người thực hiện
export default function CreateTaskPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  // Xác định projectId từ param hoặc query string
  const urlProjectId = params.projectId || searchParams.get("projectId");

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId || "");
  const [currentProject, setCurrentProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(getTodayString());
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [assignedToIds, setAssignedToIds] = useState([]);
  const [file, setFile] = useState(null);

  // Filter thành viên
  const [searchMemberQuery, setSearchMemberQuery] = useState("");
  const dateInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Kiểm tra xem người dùng đã nhập bất kỳ thông tin nào chưa
  const hasUnsavedChanges =
    title.trim() !== "" ||
    description.trim() !== "" ||
    file !== null ||
    assignedToIds.length > 0;

  // Cảnh báo khi người dùng reload (F5) hoặc đóng tab trình duyệt
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, submitting]);

  // Hàm xử lý quay lại dự án kèm cảnh báo nếu có nội dung chưa lưu
  const handleNavigateBack = () => {
    if (hasUnsavedChanges && !submitting) {
      const confirmLeave = window.confirm(
        "Nội dung bạn đã điền trong ô sẽ bị xóa. Bạn có chắc chắn muốn quay lại không?"
      );
      if (!confirmLeave) return;
    }
    navigate(selectedProjectId ? `/projects?goto=${selectedProjectId}` : "/projects");
  };

  // Kiểm tra đăng nhập
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/auth");
    }
  }, [navigate]);

  // Load danh sách dự án của người dùng nếu chưa có sẵn projectId
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectApi.getMyProjects();
        setProjects(res.data);
        if (!selectedProjectId && res.data.length > 0) {
          setSelectedProjectId(String(res.data[0].id));
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách dự án:", err);
      }
    };
    fetchProjects();
  }, [selectedProjectId]);

  // Load thông tin dự án hiện tại & danh sách thành viên dự án
  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchProjectAndMembers = async () => {
      setLoadingMembers(true);
      try {
        const [projectRes, membersRes] = await Promise.all([
          projectApi.getProjectById(selectedProjectId).catch(() => null),
          projectApi.getProjectMembers(selectedProjectId),
        ]);
        if (projectRes?.data) {
          setCurrentProject(projectRes.data);
        }
        setMembers(membersRes.data || []);
      } catch (err) {
        console.error("Lỗi khi tải thành viên dự án:", err);
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchProjectAndMembers();
  }, [selectedProjectId]);

  // Lọc thành viên theo từ khóa tìm kiếm (tên hoặc email)
  const filteredMembers = members.filter((m) => {
    const q = searchMemberQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.username?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  // Chọn / Bỏ chọn tất cả thành viên
  const handleToggleSelectAll = () => {
    if (assignedToIds.length === filteredMembers.length && filteredMembers.length > 0) {
      setAssignedToIds([]);
    } else {
      setAssignedToIds(filteredMembers.map((m) => m.userId));
    }
  };

  // Submit tạo task mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedProjectId) {
      setErrorMessage("Vui lòng chọn một dự án để tạo task.");
      return;
    }

    if (assignedToIds.length === 0) {
      setErrorMessage("Vui lòng phân công cho ít nhất 1 thành viên.");
      return;
    }

    setSubmitting(true);
    try {
      // Kết hợp ngày và giờ thành chuỗi ISO (YYYY-MM-DDTHH:mm:ss)
      const fullDeadline = deadline ? `${deadline}T${deadlineTime || "23:59"}:00` : null;

      if (file) {
        // Gửi qua Multipart Form-Data khi có file đính kèm
        const formData = new FormData();
        formData.append("projectId", selectedProjectId);
        formData.append("title", title);
        if (description) formData.append("description", description);
        if (fullDeadline) formData.append("deadline", fullDeadline);
        formData.append("file", file);
        assignedToIds.forEach((id) => formData.append("assignedToIds", id));
        await taskApi.createTask(formData);
      } else {
        // Gửi qua JSON khi không có file
        await taskApi.createTask({
          projectId: Number(selectedProjectId),
          assignedToIds,
          title,
          description,
          deadline: fullDeadline,
        });
      }

      // Tạo thành công, điều hướng quay lại trang dự án
      navigate(`/projects?goto=${selectedProjectId}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error;
      setErrorMessage(msg ? `Lỗi: ${msg}` : "Tạo nhiệm vụ thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow gradient */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 -left-40 w-80 h-80 bg-tertiary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header điều hướng */}
        <div className="relative flex items-center justify-center pb-4 border-b border-outline-variant/15">
          <button
            onClick={handleNavigateBack}
            className="absolute left-0 p-2 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-xl transition cursor-pointer flex items-center justify-center border border-outline-variant/20"
            title="Quay lại dự án"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex flex-col items-center text-center">
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">Tạo nhiệm vụ mới</h1>
            <p className="text-xs text-primary font-medium mt-0.5 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">folder</span>
              {currentProject ? `Dự án: ${currentProject.name}` : "Đang tải thông tin dự án..."}
            </p>
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form tạo task */}
        <form onSubmit={handleSubmit} className="bg-surface-container/60 backdrop-blur-md border border-outline-variant/20 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Tiêu đề nhiệm vụ */}
          <div>
            <label className={labelCls}>Tiêu đề *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên nhiệm vụ cần thực hiện..."
              className={inputCls}
              required
            />
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className={labelCls}>Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể yêu cầu, hướng dẫn thực hiện, tiêu chí nghiệm thu..."
              rows={4}
              className={`${inputCls} resize-y min-h-[100px]`}
            />
          </div>

          {/* Đính kèm file tài liệu chi tiết */}
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
                  <span className="material-symbols-outlined text-[20px] text-primary shrink-0">description</span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-mono font-medium truncate">{file.name}</span>
                    <span className="text-[10px] text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB</span>
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

          {/* Phân công thành viên */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + " !mb-0"}>Giao cho ai *</label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-on-surface-variant">
                  Đã chọn: <strong className="text-primary">{assignedToIds.length}</strong> / {members.length}
                </span>
                {filteredMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs text-primary hover:underline cursor-pointer font-medium"
                  >
                    {assignedToIds.length === filteredMembers.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                )}
              </div>
            </div>

            {/* Ô tìm kiếm thành viên */}
            <div className="relative mb-2.5">
              <input
                type="text"
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                placeholder="Tìm kiếm thành viên theo tên hoặc email..."
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl pl-9 pr-8 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
                search
              </span>
              {searchMemberQuery && (
                <button
                  type="button"
                  onClick={() => setSearchMemberQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-[16px] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Danh sách thành viên */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 border border-outline-variant/20 rounded-xl p-2.5 bg-surface-container-lowest divide-y divide-outline-variant/10 custom-scrollbar">
              {loadingMembers ? (
                <p className="text-xs text-on-surface-variant text-center py-4">Đang tải danh sách thành viên...</p>
              ) : filteredMembers.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic py-4 text-center">
                  Không tìm thấy thành viên phù hợp
                </p>
              ) : (
                filteredMembers.map((m) => {
                  const isChecked = assignedToIds.includes(m.userId);
                  return (
                    <label
                      key={m.userId}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer group transition ${isChecked ? "bg-primary/10 border border-primary/20" : "hover:bg-surface-container-high/50 border border-transparent"
                        }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isChecked ? "bg-primary border-primary text-on-primary" : "border-outline-variant/50 group-hover:border-primary/50"
                          }`}
                      >
                        {isChecked && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignedToIds((prev) => [...prev, m.userId]);
                          } else {
                            setAssignedToIds((prev) => prev.filter((id) => id !== m.userId));
                          }
                        }}
                      />
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt={m.username} className="w-full h-full object-cover" />
                        ) : (
                          m.username?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface text-xs font-semibold truncate">{m.username}</span>
                          {m.role && (
                            <span className="px-1.5 py-0.5 bg-surface-container-high text-[10px] text-on-surface-variant rounded border border-outline-variant/10">
                              {m.role}
                            </span>
                          )}
                        </div>
                        {m.email && <span className="text-[11px] text-on-surface-variant truncate">{m.email}</span>}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Hạn chót (Deadline: Ngày + Giờ) */}
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
                  min={getTodayString()}
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

              {/* Chọn Giờ (kèm con lăn cuộn giống đồng hồ báo thức) */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-medium hidden sm:inline">lúc</span>
                <TimePicker value={deadlineTime} onChange={setDeadlineTime} />
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={handleNavigateBack}
              className={btnSecondary}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`${btnPrimary} flex items-center gap-2 px-6`}
            >
              {submitting ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <span>Tạo nhiệm vụ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
