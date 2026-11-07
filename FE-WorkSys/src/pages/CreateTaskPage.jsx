import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCreateTask } from "../hooks/useCreateTask";
import TaskAssigneesPicker from "../components/tasks/TaskAssigneesPicker";
import TaskAttachmentPicker from "../components/tasks/TaskAttachmentPicker";
import TaskDeadlinePicker from "../components/tasks/TaskDeadlinePicker";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../components/common/formStyles";

/**
 * Trang tạo nhiệm vụ mới (TaskPage):
 * - Tái cấu trúc phân tách logic nghiệp vụ (useCreateTask) và các UI subcomponents
 */
export default function CreateTaskPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const urlProjectId = params.projectId || searchParams.get("projectId");

  const {
    currentProject,
    members,
    loadingMembers,
    filteredMembers,
    title,
    setTitle,
    description,
    setDescription,
    deadline,
    setDeadline,
    deadlineTime,
    setDeadlineTime,
    assignedToIds,
    setAssignedToIds,
    file,
    setFile,
    searchMemberQuery,
    setSearchMemberQuery,
    submitting,
    errorMessage,
    getTodayString,
    handleToggleSelectAll,
    handleNavigateBack,
    handleSubmit,
  } = useCreateTask(urlProjectId, navigate);

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
        <form
          onSubmit={handleSubmit}
          className="bg-surface-container/60 backdrop-blur-md border border-outline-variant/20 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6"
        >
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

          {/* File đính kèm */}
          <TaskAttachmentPicker file={file} setFile={setFile} />

          {/* Phân công thành viên */}
          <TaskAssigneesPicker
            members={members}
            filteredMembers={filteredMembers}
            assignedToIds={assignedToIds}
            setAssignedToIds={setAssignedToIds}
            searchMemberQuery={searchMemberQuery}
            setSearchMemberQuery={setSearchMemberQuery}
            loadingMembers={loadingMembers}
            onToggleSelectAll={handleToggleSelectAll}
          />

          {/* Hạn chót (Deadline: Ngày + Giờ) */}
          <TaskDeadlinePicker
            deadline={deadline}
            setDeadline={setDeadline}
            deadlineTime={deadlineTime}
            setDeadlineTime={setDeadlineTime}
            minDate={getTodayString()}
          />

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
                  <span className="animate-spin material-symbols-outlined text-[18px]">
                    progress_activity
                  </span>
                  <span>Đang tạo...</span>
                </>
              ) : (
                <span>Tạo nhiệm vụ</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
