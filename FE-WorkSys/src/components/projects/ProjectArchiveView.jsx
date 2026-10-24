import { useProjectArchive } from "../../hooks/useProjectArchive";
import ArchiveFilterBar from "./archive/ArchiveFilterBar";
import ArchiveTasksTable from "./archive/ArchiveTasksTable";

/**
 * Component hiển thị kho lưu trữ (Archive) của dự án trực tiếp bên trong ProjectDetail
 */
export default function ProjectArchiveView({
  archivedTasks = [],
  selectedProject,
  onBackToKanban,
}) {
  const {
    searchQuery,
    setSearchQuery,
    monthFilter,
    setMonthFilter,
    assigneeFilter,
    setAssigneeFilter,
    availableMonths,
    availableAssignees,
    filteredTasks,
  } = useProjectArchive(selectedProject?.id, archivedTasks);

  return (
    <div className="flex-1 flex flex-col w-full h-full px-container-margin overflow-y-auto custom-scrollbar pb-10">
      {/* Header thanh điều hướng & Thao tác */}
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
              <span className="material-symbols-outlined text-[24px] text-primary">inventory_2</span>
              <span>Kho lưu trữ nhiệm vụ</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                {archivedTasks.length}
              </span>
            </h2>
            <p className="text-on-surface-variant text-xs mt-0.5">
              Các nhiệm vụ đã hoàn thành và được tự động lưu trữ sau 7 ngày
            </p>
          </div>
        </div>

        <div className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/10 flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-[16px] text-amber-500">info</span>
          Tự động bảo quản lịch sử công việc
        </div>
      </div>

      {/* Thanh tìm kiếm & Bộ lọc */}
      <div className="my-4">
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
      </div>

      {/* Bảng danh sách task */}
      <ArchiveTasksTable filteredTasks={filteredTasks} />
    </div>
  );
}
