import { useParams, useNavigate } from "react-router-dom";
import { useProjectArchive } from "../hooks/useProjectArchive";
import ArchiveFilterBar from "../components/projects/archive/ArchiveFilterBar";
import ArchiveTasksTable from "../components/projects/archive/ArchiveTasksTable";

/**
 * Trang toàn màn hình độc lập (/projects/:projectId/archive) hiển thị các task đã lưu trữ
 */
export default function ProjectArchivePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const {
    project,
    archivedTasks,
    isLoading,
    searchQuery,
    setSearchQuery,
    monthFilter,
    setMonthFilter,
    assigneeFilter,
    setAssigneeFilter,
    availableMonths,
    availableAssignees,
    filteredTasks,
  } = useProjectArchive(projectId);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background font-body-sm text-on-background flex flex-col">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full"></div>
            <p className="text-on-surface-variant font-body-sm">Đang tải kho lưu trữ...</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/projects?goto=${projectId}`)}
              className="h-10 px-3.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl flex items-center gap-2 text-xs font-semibold border border-outline-variant/20 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Quay lại danh sách dự án"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Dự án</span>
            </button>
            <div className="h-6 w-px bg-outline-variant/20 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant text-xs font-medium">Dự án:</span>
                <span className="text-primary font-bold text-sm tracking-wide">
                  {project?.name || "Chi tiết dự án"}
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-on-background flex items-center gap-2.5 mt-0.5">
                <span className="material-symbols-outlined text-[28px] text-primary">
                  inventory_2
                </span>
                <span>Kho lưu trữ</span>
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                  {archivedTasks.length} task
                </span>
              </h1>
            </div>
          </div>
          <div className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-500">info</span>
            Task hoàn thành sẽ được tự động lưu trữ sau 7 ngày
          </div>
        </div>

        {/* Thanh bộ lọc */}
        <ArchiveFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          monthFilter={monthFilter}
          setMonthFilter={setMonthFilter}
          assigneeFilter={assigneeFilter}
          setAssigneeFilter={setAssigneeFilter}
          availableMonths={availableMonths}
          availableAssignees={availableAssignees}
        />

        {/* Bảng danh sách task */}
        <ArchiveTasksTable filteredTasks={filteredTasks} />
      </div>
    </div>
  );
}
